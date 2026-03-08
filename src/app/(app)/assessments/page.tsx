
"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  BrainCircuit, 
  Plus, 
  ClipboardList, 
  Save, 
  Trash2, 
  PlusCircle, 
  LayoutList, 
  Target, 
  CheckCircle2,
  Info,
  Table as TableIcon,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Award,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase/provider"
import { collection, doc, setDoc, query, where, getDocs } from "firebase/firestore"
import { AssessmentRecord, RubricCriterion } from "@/lib/types"
import { getBimestreFromDate, BIMESTRE_LABELS } from "@/lib/date-utils"

const BLOOM_LEVELS = [
  { value: 'Remember', label: 'Lembrar', color: 'bg-blue-100 text-blue-700' },
  { value: 'Understand', label: 'Entender', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'Apply', label: 'Aplicar', color: 'bg-teal-100 text-teal-700' },
  { value: 'Analyze', label: 'Analisar', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'Evaluate', label: 'Avaliar', color: 'bg-violet-100 text-violet-700' },
  { value: 'Create', label: 'Criar', color: 'bg-pink-100 text-pink-700' },
]

interface ClassMultiSelectProps {
  classes: any[]
  value: string[]
  onChange: (value: string[]) => void
}

function ClassMultiSelect({ classes, value, onChange }: ClassMultiSelectProps) {
  const toggleClass = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter(c => c !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
    <div className="border rounded-md p-3 space-y-3 bg-white shadow-sm">
      <div className="flex gap-2">
        <button type="button" onClick={() => onChange(classes.map(c => c.id))} className="text-xs font-bold px-3 py-1.5 bg-secondary rounded">Selecionar todas</button>
        <button type="button" onClick={() => onChange([])} className="text-xs font-bold px-3 py-1.5 bg-muted rounded">Limpar</button>
      </div>
      <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-2">
        {classes.map((turma) => (
          <label key={turma.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded">
            <input type="checkbox" className="accent-primary" checked={value.includes(turma.id)} onChange={() => toggleClass(turma.id)} />
            <span className="text-sm font-medium">{turma.name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default function AssessmentPage() {
  const [mounted, setMounted] = useState(false)
  const { user, profile, isAdmin, isUserLoading } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState("manager")
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [isGradesDialogOpen, setIsGradesDialogOpen] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentRecord | null>(null)
  const [gradingClassId, setGradingClassId] = useState<string>("")

  // Coleção GLOBAL de Avaliações
  const assessmentsRef = useMemoFirebase(() => collection(firestore, 'assessments'), [firestore])
  const assessmentsQuery = useMemoFirebase(() => {
    if (!user || !assessmentsRef) return null;
    if (isAdmin) return assessmentsRef;
    return query(assessmentsRef, where('teacherId', '==', user.uid));
  }, [user, assessmentsRef, isAdmin])
  
  const { data: assessments = [], isLoading: isAssessmentsLoading } = useCollection(assessmentsQuery)

  // Coleção GLOBAL de Turmas filtrada por atribuição (ou visão total se Admin)
  const classesRef = useMemoFirebase(() => collection(firestore, 'classes'), [firestore])
  const { data: rawClasses = [] } = useCollection(classesRef)

  const classes = useMemo(() => {
    let list = [];
    if (isAdmin) {
      list = [...rawClasses];
    } else {
      const assignedIds = profile?.assignments?.map(a => a.classId) || [];
      list = rawClasses.filter(c => assignedIds.includes(c.id));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [rawClasses, profile, isAdmin]);

  const [classStudents, setClassStudents] = useState<any[]>([])
  const [isStudentsLoading, setIsStudentsLoading] = useState(false)

  const [newAssessment, setNewAssessment] = useState({
    title: "",
    subject: "Portuguese" as "Portuguese" | "Math",
    bloomLevel: "Understand",
    date: "",
  })
  
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [newRubric, setNewRubric] = useState<RubricCriterion[]>([])
  const [tempGrades, setTempGrades] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    setMounted(true)
    setNewAssessment(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }))
  }, [])

  useEffect(() => {
    async function loadStudents() {
      if (!user || !gradingClassId) return;
      setIsStudentsLoading(true);
      const q = query(
        collection(firestore, 'students'), 
        where('classId', '==', gradingClassId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setClassStudents(list);
      setIsStudentsLoading(false);
    }
    if (isGradesDialogOpen && gradingClassId) loadStudents();
  }, [isGradesDialogOpen, gradingClassId, user, firestore]);

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !assessmentsRef) return
    if (!newAssessment.title || selectedClasses.length === 0) {
      toast({ title: "Erro", description: "Título e Turmas são obrigatórios.", variant: "destructive" })
      return
    }

    const assessmentId = Math.random().toString(36).substr(2, 9)
    const assessmentDate = new Date(newAssessment.date);
    const bimestre = getBimestreFromDate(assessmentDate);

    const assessmentData = {
      id: assessmentId,
      ...newAssessment,
      classIds: selectedClasses,
      rubric: newRubric,
      grades: {},
      studentCriterionGrades: {},
      teacherId: user.uid,
      assessmentDate: assessmentDate.toISOString(),
      bimestre: bimestre
    }

    try {
      await setDoc(doc(assessmentsRef, assessmentId), assessmentData)
      setIsNewDialogOpen(false)
      setNewAssessment({ title: "", subject: "Portuguese", bloomLevel: "Understand", date: new Date().toISOString().split('T')[0] })
      setSelectedClasses([])
      setNewRubric([])
      toast({ title: "Avaliação Criada", description: `Registrada no ${BIMESTRE_LABELS[bimestre]}.` })
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao salvar no banco de dados.", variant: "destructive" })
    }
  }

  const handleSaveGrades = async () => {
    if (!selectedAssessment || !user || !assessmentsRef) return

    const finalGrades: Record<string, number> = {}
    if (selectedAssessment.rubric.length > 0) {
      Object.entries(tempGrades).forEach(([studentId, criterionSelection]) => {
        let total = 0
        Object.entries(criterionSelection).forEach(([criterionId, levelId]) => {
          const criterion = selectedAssessment.rubric.find(c => c.id === criterionId)
          const level = criterion?.levels.find(l => l.id === levelId)
          if (level) total += level.points
        })
        finalGrades[studentId] = total
      })
    }

    try {
      await setDoc(doc(assessmentsRef, selectedAssessment.id), {
        ...selectedAssessment,
        grades: { ...selectedAssessment.grades, ...finalGrades },
        studentCriterionGrades: tempGrades
      }, { merge: true })
      
      setIsGradesDialogOpen(false)
      toast({ title: "Notas Registradas", description: "As notas foram salvas no Firestore." })
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao salvar notas.", variant: "destructive" })
    }
  }

  if (!mounted || isUserLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Avaliações</h2>
          <p className="text-muted-foreground mt-1">Organização por competências e bimestres letivos.</p>
        </div>
        
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2 shadow-lg"><Plus className="h-4 w-4" /> Nova Avaliação</Button></DialogTrigger>
          <DialogContent className="max-w-[750px] w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
            <DialogHeader className="p-6 border-b"><DialogTitle>Criar Avaliação</DialogTitle></DialogHeader>
            <ScrollArea className="flex-1 p-8">
              <form id="new-assessment-form" onSubmit={handleCreateAssessment} className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="col-span-2 space-y-2">
                    <Label>Título</Label>
                    <Input placeholder="Ex: Prova Mensal" value={newAssessment.title} onChange={(e) => setNewAssessment({...newAssessment, title: e.target.value})} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Turmas ({selectedClasses.length})</Label>
                    <ClassMultiSelect classes={classes} value={selectedClasses} onChange={setSelectedClasses} />
                  </div>
                  <div className="space-y-2">
                    <Label>Taxonomia Bloom</Label>
                    <Select value={newAssessment.bloomLevel} onValueChange={(v) => setNewAssessment({...newAssessment, bloomLevel: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{BLOOM_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input type="date" value={newAssessment.date} onChange={(e) => setNewAssessment({...newAssessment, date: e.target.value})} />
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><h4 className="font-bold">Critérios</h4><Button type="button" variant="outline" onClick={() => setNewRubric([...newRubric, { id: Math.random().toString(36).substr(2, 9), title: "", levels: [{ id: 'l1', label: 'Insuficiente', points: 0 }, { id: 'l2', label: 'Excelente', points: 10 }] }])}>+ Critério</Button></div>
                  {newRubric.map(c => (
                    <Card key={c.id} className="p-4 space-y-2">
                      <Input placeholder="Critério" value={c.title} onChange={(e) => setNewRubric(newRubric.map(curr => curr.id === c.id ? {...curr, title: e.target.value} : curr))} />
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setNewRubric(newRubric.filter(curr => curr.id !== c.id))}><Trash2 className="h-4 w-4" /></Button>
                    </Card>
                  ))}
                </div>
              </form>
            </ScrollArea>
            <DialogFooter className="p-6 border-t"><Button type="submit" form="new-assessment-form" className="w-full">Salvar no Firestore</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-white border">
          <TabsTrigger value="manager">Diário</TabsTrigger>
          <TabsTrigger value="spreadsheet">Planilha</TabsTrigger>
          <TabsTrigger value="performance-map">Mapa</TabsTrigger>
        </TabsList>

        <TabsContent value="manager" className="mt-6">
          {isAssessmentsLoading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div> : (
            <div className="grid gap-6 md:grid-cols-3">
              {assessments.map(a => (
                <Card key={a.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline">{a.subject === 'Portuguese' ? 'Português' : 'Matemática'}</Badge>
                      <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                        {BIMESTRE_LABELS[a.bimestre || "1"]}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{a.title}</CardTitle>
                    <CardDescription>{new Date(a.date).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0 border-t bg-muted/5 p-0">
                    <Button variant="ghost" className="w-full h-12 font-bold" onClick={() => { setSelectedAssessment(a); setTempGrades(a.studentCriterionGrades || {}); setGradingClassId(a.classIds[0] || ""); setIsGradesDialogOpen(true); }}>Lançar Notas</Button>
                  </CardFooter>
                </Card>
              ))}
              {assessments.length === 0 && <div className="col-span-3 py-20 text-center opacity-30">Nenhuma avaliação encontrada.</div>}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isGradesDialogOpen} onOpenChange={setIsGradesDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 bg-white">
          <DialogHeader className="p-6 bg-primary text-white"><DialogTitle>{selectedAssessment?.title}</DialogTitle></DialogHeader>
          <div className="p-6 border-b flex items-center gap-4">
            <Label>Turma:</Label>
            <Select value={gradingClassId} onValueChange={setGradingClassId}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>{selectedAssessment?.classIds.map(id => <SelectItem key={id} value={id}>{rawClasses.find(c => c.id === id)?.name || id}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <ScrollArea className="flex-1 p-6">
            {isStudentsLoading ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : (
              <div className="space-y-8">
                {classStudents.map(student => (
                  <div key={student.id} className="p-4 border rounded-xl bg-slate-50">
                    <p className="font-bold text-lg">{student.name}</p>
                    <div className="grid gap-4 mt-4">
                      {selectedAssessment?.rubric.map(criterion => (
                        <div key={criterion.id} className="space-y-2">
                          <Label className="text-xs">{criterion.title}</Label>
                          <div className="flex flex-wrap gap-2">
                            {criterion.levels.map(l => (
                              <Button key={l.id} size="sm" variant={tempGrades[student.id]?.[criterion.id] === l.id ? "default" : "outline"} onClick={() => setTempGrades({...tempGrades, [student.id]: {...(tempGrades[student.id] || {}), [criterion.id]: l.id}})}>{l.label} ({l.points})</Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <DialogFooter className="p-6 border-t"><Button onClick={handleSaveGrades} className="w-full">Salvar Notas no Firestore</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
