
"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  BrainCircuit, 
  Sparkles, 
  Plus, 
  ClipboardList, 
  ChevronRight,
  Save,
  Info,
  CheckCircle2,
  Trash2,
  PlusCircle,
  LayoutList,
  Target
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { generateBloomAssessmentItems } from "@/ai/flows/bloom-assessment-item-generator"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const BLOOM_LEVELS = [
  { value: 'Remember', label: 'Lembrar', color: 'bg-blue-100 text-blue-700' },
  { value: 'Understand', label: 'Entender', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'Apply', label: 'Aplicar', color: 'bg-teal-100 text-teal-700' },
  { value: 'Analyze', label: 'Analisar', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'Evaluate', label: 'Avaliar', color: 'bg-violet-100 text-violet-700' },
  { value: 'Create', label: 'Criar', color: 'bg-pink-100 text-pink-700' },
]

const MOCK_STUDENTS = [
  { id: '1', name: 'Ana Beatriz Silva', ra: '123456' },
  { id: '2', name: 'Bruno Oliveira Souza', ra: '234567' },
  { id: '3', name: 'Carlos Eduardo Santos', ra: '345678' },
  { id: '4', name: 'Daniela Lima Ferreira', ra: '456789' },
  { id: '5', name: 'Eduardo Pereira Costa', ra: '567890' },
]

interface RubricLevel {
  id: string;
  label: string;
  points: number;
}

interface RubricCriterion {
  id: string;
  title: string;
  levels: RubricLevel[];
}

interface AssessmentRecord {
  id: string;
  title: string;
  subject: "Portuguese" | "Math";
  classId: string;
  bloomLevel: string;
  date: string;
  rubric: RubricCriterion[];
  grades: Record<string, number>; // studentId -> total score
  studentCriterionGrades: Record<string, Record<string, string>>; // studentId -> criterionId -> levelId
}

export default function AssessmentPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("manager")
  
  // IA Generator State
  const [subjectIA, setSubjectIA] = useState<"Portuguese" | "Math">("Portuguese")
  const [competencyIA, setCompetencyIA] = useState("")
  const [bloomLevelIA, setBloomLevelIA] = useState<string>("Remember")
  const [isLoadingIA, setIsLoadingIA] = useState(false)
  const [generatedItems, setGeneratedItems] = useState<string[]>([])
  
  // Assessment Manager State
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([
    {
      id: 'initial-1',
      title: 'Prova de Interpretação',
      subject: 'Portuguese',
      classId: '1',
      bloomLevel: 'Analyze',
      date: '2024-10-25',
      rubric: [
        {
          id: 'c1',
          title: 'Identificação de Metáforas',
          levels: [
            { id: 'l1', label: 'Não identifica', points: 0 },
            { id: 'l2', label: 'Identifica parcialmente', points: 5 },
            { id: 'l3', label: 'Identifica plenamente', points: 10 },
          ]
        }
      ],
      grades: { '1': 10, '2': 5 },
      studentCriterionGrades: {
        '1': { 'c1': 'l3' },
        '2': { 'c1': 'l2' }
      }
    }
  ])
  
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [isGradesDialogOpen, setIsGradesDialogOpen] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentRecord | null>(null)
  
  // New Assessment Form State
  const [newAssessment, setNewAssessment] = useState({
    title: "",
    subject: "Portuguese" as "Portuguese" | "Math",
    classId: "1",
    bloomLevel: "Understand",
    date: new Date().toISOString().split('T')[0],
  })
  const [newRubric, setNewRubric] = useState<RubricCriterion[]>([])

  // Temporary grades state for the grading dialog
  const [tempGrades, setTempGrades] = useState<Record<string, Record<string, string>>>({})

  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  // IA Generation Handler
  const handleGenerateAI = async () => {
    if (!competencyIA) {
      toast({ title: "Campo obrigatório", description: "Por favor, descreva a competência para gerar os itens.", variant: "destructive" })
      return
    }
    
    setIsLoadingIA(true)
    try {
      const result = await generateBloomAssessmentItems({
        subject: subjectIA,
        competency: competencyIA,
        bloomLevel: bloomLevelIA as any,
        numItems: 3
      })
      setGeneratedItems(result.items)
      toast({ title: "Atividades Geradas", description: "A IA criou novas questões baseadas na Taxonomia de Bloom." })
    } catch (error) {
      toast({ title: "Erro na IA", description: "Não foi possível gerar os itens de avaliação.", variant: "destructive" })
    } finally {
      setIsLoadingIA(false)
    }
  }

  // Rubric Builder Actions
  const addCriterion = () => {
    const id = Math.random().toString(36).substr(2, 9)
    setNewRubric([...newRubric, {
      id,
      title: "",
      levels: [
        { id: Math.random().toString(36).substr(2, 9), label: "Insuficiente", points: 0 },
        { id: Math.random().toString(36).substr(2, 9), label: "Satisfatório", points: 5 },
        { id: Math.random().toString(36).substr(2, 9), label: "Excelente", points: 10 },
      ]
    }])
  }

  const removeCriterion = (id: string) => {
    setNewRubric(newRubric.filter(c => c.id !== id))
  }

  const updateCriterionTitle = (id: string, title: string) => {
    setNewRubric(newRubric.map(c => c.id === id ? { ...c, title } : c))
  }

  const updateLevel = (criterionId: string, levelId: string, updates: Partial<RubricLevel>) => {
    setNewRubric(newRubric.map(c => {
      if (c.id === criterionId) {
        return {
          ...c,
          levels: c.levels.map(l => l.id === levelId ? { ...l, ...updates } : l)
        }
      }
      return c
    }))
  }

  // Create New Assessment
  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAssessment.title) {
      toast({ title: "Erro", description: "Título é obrigatório.", variant: "destructive" })
      return
    }

    const assessment: AssessmentRecord = {
      id: Math.random().toString(36).substr(2, 9),
      ...newAssessment,
      rubric: newRubric,
      grades: {},
      studentCriterionGrades: {}
    }

    setAssessments([assessment, ...assessments])
    setIsNewDialogOpen(false)
    setNewAssessment({
      title: "",
      subject: "Portuguese",
      classId: "1",
      bloomLevel: "Understand",
      date: new Date().toISOString().split('T')[0],
    })
    setNewRubric([])
    toast({ title: "Avaliação Criada", description: "Agora você pode lançar as notas baseadas na rubrica." })
  }

  // Open Grades Dialog
  const openGradesDialog = (assessment: AssessmentRecord) => {
    setSelectedAssessment(assessment)
    setTempGrades(assessment.studentCriterionGrades || {})
    setIsGradesDialogOpen(true)
  }

  // Save Grades
  const handleSaveGrades = () => {
    if (!selectedAssessment) return

    const finalGrades: Record<string, number> = {}
    
    // Calculate final grade per student based on selected levels
    Object.entries(tempGrades).forEach(([studentId, criterionSelection]) => {
      let total = 0
      Object.entries(criterionSelection).forEach(([criterionId, levelId]) => {
        const criterion = selectedAssessment.rubric.find(c => c.id === criterionId)
        const level = criterion?.levels.find(l => l.id === levelId)
        if (level) total += level.points
      })
      finalGrades[studentId] = total
    })

    setAssessments(assessments.map(a => 
      a.id === selectedAssessment.id ? { 
        ...a, 
        grades: finalGrades, 
        studentCriterionGrades: tempGrades 
      } : a
    ))
    
    setIsGradesDialogOpen(false)
    toast({ title: "Notas Registradas", description: "As notas foram calculadas e salvas." })
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Avaliações & Notas</h2>
          <p className="text-muted-foreground mt-1">Gerencie o desempenho acadêmico com rubricas estruturadas e IA.</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg">
                <Plus className="h-4 w-4" /> Nova Avaliação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] bg-white max-h-[90vh] flex flex-col p-0">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>Criar Registro de Avaliação</DialogTitle>
                <DialogDescription>Defina os parâmetros e a rubrica de desempenho.</DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-1 px-6 py-4">
                <form id="new-assessment-form" onSubmit={handleCreateAssessment} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Título da Avaliação</Label>
                      <Input 
                        placeholder="Ex: Redação Argumentativa" 
                        value={newAssessment.title}
                        onChange={(e) => setNewAssessment({...newAssessment, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data da Aplicação</Label>
                      <Input type="date" value={newAssessment.date} onChange={(e) => setNewAssessment({...newAssessment, date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Disciplina</Label>
                      <Select value={newAssessment.subject} onValueChange={(v: any) => setNewAssessment({...newAssessment, subject: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Portuguese">Português</SelectItem>
                          <SelectItem value="Math">Matemática</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nível de Bloom</Label>
                      <Select value={newAssessment.bloomLevel} onValueChange={(v) => setNewAssessment({...newAssessment, bloomLevel: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {BLOOM_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                        <LayoutList className="h-4 w-4" /> Rubrica de Avaliação
                      </h4>
                      <Button type="button" variant="outline" size="sm" onClick={addCriterion} className="gap-2">
                        <PlusCircle className="h-4 w-4" /> Adicionar Critério
                      </Button>
                    </div>

                    <div className="space-y-6">
                      {newRubric.map((criterion, cIdx) => (
                        <Card key={criterion.id} className="border bg-muted/20">
                          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                            <Input 
                              className="font-bold bg-transparent border-none focus-visible:ring-0 px-0 h-auto text-base" 
                              placeholder={`Critério ${cIdx + 1} (ex: Coesão)`}
                              value={criterion.title}
                              onChange={(e) => updateCriterionTitle(criterion.id, e.target.value)}
                            />
                            <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeCriterion(criterion.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 space-y-3">
                            {criterion.levels.map((level) => (
                              <div key={level.id} className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-8">
                                  <Input 
                                    className="h-8 text-xs" 
                                    placeholder="Descrição do nível" 
                                    value={level.label}
                                    onChange={(e) => updateLevel(criterion.id, level.id, { label: e.target.value })}
                                  />
                                </div>
                                <div className="col-span-4 flex items-center gap-2">
                                  <Input 
                                    type="number" 
                                    className="h-8 text-xs text-center" 
                                    placeholder="Pts"
                                    value={level.points}
                                    onChange={(e) => updateLevel(criterion.id, level.id, { points: parseFloat(e.target.value) || 0 })}
                                  />
                                  <span className="text-[10px] font-bold text-muted-foreground">PTS</span>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ))}

                      {newRubric.length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed rounded-xl opacity-40">
                          <p className="text-sm">Clique em "Adicionar Critério" para montar sua rubrica.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </ScrollArea>
              <DialogFooter className="p-6 bg-muted/10 border-t">
                <Button type="submit" form="new-assessment-form" className="w-full h-12 text-md font-bold shadow-lg">Criar Avaliação</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12 bg-white border shadow-sm">
          <TabsTrigger value="manager" className="gap-2 font-bold"><ClipboardList className="h-4 w-4" /> Diário de Avaliações</TabsTrigger>
          <TabsTrigger value="generator" className="gap-2 font-bold"><Sparkles className="h-4 w-4 text-accent" /> Gerador IA Bloom</TabsTrigger>
        </TabsList>

        <TabsContent value="manager" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assessments.map((a) => (
              <Card key={a.id} className="border-none shadow-md bg-white hover:shadow-lg transition-all overflow-hidden flex flex-col">
                <div className={cn("h-1.5", BLOOM_LEVELS.find(l => l.value === a.bloomLevel)?.color.split(' ')[0] || "bg-primary")} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">
                      {a.subject === 'Portuguese' ? 'Português' : 'Matemática'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-bold">{new Date(a.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <CardTitle className="text-lg line-clamp-1">{a.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5">
                    <BrainCircuit className="h-3.5 w-3.5" /> 
                    Nível: {BLOOM_LEVELS.find(l => l.value === a.bloomLevel)?.label}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4 flex-1">
                  <div className="bg-muted/30 p-3 rounded-lg border border-dashed border-border mb-4">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase mb-2">
                      <span>Notas Lançadas</span>
                      <span>{Object.keys(a.grades).length}/{MOCK_STUDENTS.length}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all" 
                        style={{ width: `${(Object.keys(a.grades).length / MOCK_STUDENTS.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  {a.rubric && a.rubric.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Rubrica:</p>
                      <div className="flex flex-wrap gap-1">
                        {a.rubric.map(c => (
                          <Badge key={c.id} variant="secondary" className="text-[9px] h-5 bg-blue-50 text-blue-700 border-blue-100">
                            {c.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0 border-t bg-muted/10">
                  <Button variant="ghost" className="w-full h-12 gap-2 text-primary font-bold hover:bg-primary/5" onClick={() => openGradesDialog(a)}>
                    <CheckCircle2 className="h-4 w-4" /> Lançar Notas
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {assessments.length === 0 && (
            <div className="py-24 text-center opacity-30 flex flex-col items-center">
              <ClipboardList className="h-12 w-12 mb-4" />
              <p className="font-bold">Nenhuma avaliação registrada ainda.</p>
              <p className="text-sm">Clique em "Nova Avaliação" para começar.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="generator" className="mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="col-span-1 border-none shadow-md bg-white h-fit">
              <CardHeader>
                <CardTitle>Configuração IA</CardTitle>
                <CardDescription>Crie atividades pedagógicas em segundos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Matéria</Label>
                  <Select value={subjectIA} onValueChange={(v: any) => setSubjectIA(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Portuguese">Português</SelectItem>
                      <SelectItem value="Math">Matemática</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Competência / Habilidade</Label>
                  <Input placeholder="Ex: Concordância Nominal" value={competencyIA} onChange={(e) => setCompetencyIA(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nível de Bloom</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {BLOOM_LEVELS.map((level) => (
                      <Button
                        key={level.value}
                        variant={bloomLevelIA === level.value ? "default" : "outline"}
                        className={`justify-start h-9 text-xs font-medium ${bloomLevelIA === level.value ? 'bg-primary' : ''}`}
                        onClick={() => setBloomLevelIA(level.value)}
                      >
                        {level.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button className="w-full gap-2 mt-4 bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleGenerateAI} disabled={isLoadingIA}>
                  <Sparkles className="h-4 w-4" /> {isLoadingIA ? "Gerando..." : "Gerar Atividades"}
                </Button>
              </CardContent>
            </Card>

            <Card className="col-span-2 border-none shadow-md bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Roteiro Sugerido</CardTitle>
                  <CardDescription>Utilize estas atividades em suas avaliações</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {generatedItems.length > 0 ? (
                  <div className="space-y-4">
                    {generatedItems.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-muted/20 border group">
                        <div className="flex gap-4">
                          <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">{idx + 1}</span>
                          <p className="text-sm leading-relaxed">{item}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-24 text-center opacity-30 flex flex-col items-center">
                    <Sparkles className="h-10 w-10 mb-2" />
                    <p className="text-sm">Configure os filtros e use a IA para gerar conteúdo.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Grades Dialog */}
      <Dialog open={isGradesDialogOpen} onOpenChange={setIsGradesDialogOpen}>
        <DialogContent className="max-w-4xl bg-white p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center justify-between pr-8">
              <div>
                <DialogTitle className="text-2xl font-black">{selectedAssessment?.title}</DialogTitle>
                <p className="text-sm text-primary-foreground/80 mt-1">Lançamento por Rubrica • Turma: {selectedAssessment?.classId}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase block opacity-60">Nível Bloom</span>
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/40">
                  {BLOOM_LEVELS.find(l => l.value === selectedAssessment?.bloomLevel)?.label}
                </Badge>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-8">
                {MOCK_STUDENTS.map((student) => {
                  // Calculate student total score
                  const selection = tempGrades[student.id] || {}
                  let total = 0
                  Object.entries(selection).forEach(([cId, lId]) => {
                    const criterion = selectedAssessment?.rubric.find(c => c.id === cId)
                    const level = criterion?.levels.find(l => l.id === lId)
                    if (level) total += level.points
                  })

                  return (
                    <div key={student.id} className="space-y-4 p-4 rounded-xl border bg-muted/5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                          <span className="font-bold text-lg">{student.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">RA: {student.ra}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-primary">{total.toFixed(1)}</span>
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase">Nota Final</span>
                        </div>
                      </div>

                      <div className="grid gap-4">
                        {selectedAssessment?.rubric.map((criterion) => (
                          <div key={criterion.id} className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                              <Target className="h-3 w-3" /> {criterion.title}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {criterion.levels.map((level) => {
                                const isSelected = selection[criterion.id] === level.id
                                return (
                                  <Button
                                    key={level.id}
                                    type="button"
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                      "h-8 text-[10px] font-medium transition-all",
                                      isSelected ? "bg-primary shadow-md scale-105" : "hover:bg-primary/5"
                                    )}
                                    onClick={() => {
                                      const newSelection = { ...selection, [criterion.id]: level.id }
                                      setTempGrades({ ...tempGrades, [student.id]: newSelection })
                                    }}
                                  >
                                    {level.label} ({level.points} pts)
                                  </Button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="p-6 bg-muted/10 border-t">
            <Button variant="outline" onClick={() => setIsGradesDialogOpen(false)}>Cancelar</Button>
            <Button className="px-8 shadow-lg font-bold" onClick={handleSaveGrades}>
              <Save className="h-4 w-4 mr-2" /> Finalizar e Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
