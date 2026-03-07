
"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  BrainCircuit, 
  Sparkles, 
  Plus, 
  ClipboardList, 
  Save, 
  Trash2, 
  PlusCircle, 
  LayoutList, 
  Target, 
  ChevronDown,
  CheckCircle2,
  Info,
  Table as TableIcon,
  Search,
  X,
  Check
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
import { generateBloomAssessmentItems } from "@/ai/flows/bloom-assessment-item-generator"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const BLOOM_LEVELS = [
  { value: 'Remember', label: 'Lembrar', color: 'bg-blue-100 text-blue-700' },
  { value: 'Understand', label: 'Entender', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'Apply', label: 'Aplicar', color: 'bg-teal-100 text-teal-700' },
  { value: 'Analyze', label: 'Analisar', color: 'bg-indigo-100 text-cyan-700' },
  { value: 'Evaluate', label: 'Avaliar', color: 'bg-violet-100 text-violet-700' },
  { value: 'Create', label: 'Criar', color: 'bg-pink-100 text-pink-700' },
]

const MOCK_CLASSES = [
  { id: '1', name: '9º Ano A' },
  { id: '2', name: '9º Ano B' },
  { id: '3', name: '8º Ano A' },
]

const MOCK_STUDENTS = [
  { id: '1', name: 'Ana Beatriz Silva', ra: '123456', classId: '1' },
  { id: '2', name: 'Bruno Oliveira Souza', ra: '234567', classId: '1' },
  { id: '3', name: 'Carlos Eduardo Santos', ra: '345678', classId: '2' },
  { id: '4', name: 'Daniela Lima Ferreira', ra: '456789', classId: '2' },
  { id: '5', name: 'Eduardo Pereira Costa', ra: '567890', classId: '3' },
]

interface Class {
  id: string
  name: string
}

interface ClassMultiSelectProps {
  classes: Class[]
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

  const selectAll = () => {
    onChange(classes.map(c => c.id))
  }

  const clearAll = () => {
    onChange([])
  }

  return (
    <div className="border rounded-md p-3 space-y-3 bg-white shadow-sm">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={selectAll}
          className="text-xs font-bold px-3 py-1.5 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
        >
          Selecionar todas
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-bold px-3 py-1.5 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
        >
          Limpar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {classes.map((turma) => (
          <label
            key={turma.id}
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors group"
          >
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
              checked={value.includes(turma.id)}
              onChange={() => toggleClass(turma.id)}
            />
            <span className="text-sm font-medium group-hover:text-primary transition-colors">
              {turma.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

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
  classIds: string[];
  bloomLevel: string;
  date: string;
  rubric: RubricCriterion[];
  grades: Record<string, number>;
  studentCriterionGrades: Record<string, Record<string, string>>;
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
      classIds: ['1', '2'],
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
  const [gradingClassId, setGradingClassId] = useState<string>("")
  
  // Spreadsheet State
  const [spreadsheetClassId, setSpreadsheetClassId] = useState<string>("1")

  // New Assessment Form State
  const [newAssessment, setNewAssessment] = useState({
    title: "",
    subject: "Portuguese" as "Portuguese" | "Math",
    bloomLevel: "Understand",
    date: new Date().toISOString().split('T')[0],
  })
  
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [newRubric, setNewRubric] = useState<RubricCriterion[]>([])
  const [tempGrades, setTempGrades] = useState<Record<string, Record<string, string>>>({})
  
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAssessment.title) {
      toast({ title: "Erro", description: "Título é obrigatório.", variant: "destructive" })
      return
    }
    if (selectedClasses.length === 0) {
      toast({ title: "Erro", description: "Selecione pelo menos uma turma.", variant: "destructive" })
      return
    }

    const assessment: AssessmentRecord = {
      id: Math.random().toString(36).substr(2, 9),
      ...newAssessment,
      classIds: selectedClasses,
      rubric: newRubric,
      grades: {},
      studentCriterionGrades: {}
    }

    setAssessments([assessment, ...assessments])
    setIsNewDialogOpen(false)
    setNewAssessment({
      title: "",
      subject: "Portuguese",
      bloomLevel: "Understand",
      date: new Date().toISOString().split('T')[0],
    })
    setSelectedClasses([])
    setNewRubric([])
    toast({ title: "Avaliação Criada", description: "A avaliação foi registrada com sucesso." })
  }

  const openGradesDialog = (assessment: AssessmentRecord) => {
    setSelectedAssessment(assessment)
    setTempGrades(assessment.studentCriterionGrades || {})
    setGradingClassId(assessment.classIds[0] || "")
    setIsGradesDialogOpen(true)
  }

  const handleSaveGrades = () => {
    if (!selectedAssessment) return

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
    } else {
      Object.assign(finalGrades, selectedAssessment.grades)
    }

    setAssessments(assessments.map(a => 
      a.id === selectedAssessment.id ? { 
        ...a, 
        grades: { ...a.grades, ...finalGrades }, 
        studentCriterionGrades: tempGrades 
      } : a
    ))
    
    setIsGradesDialogOpen(false)
    toast({ title: "Notas Registradas", description: "As notas foram calculadas e salvas." })
  }

  const spreadsheetData = useMemo(() => {
    const classAssessments = assessments.filter(a => a.classIds.includes(spreadsheetClassId))
    const rows = MOCK_STUDENTS.filter(s => s.classId === spreadsheetClassId).map(student => {
      let totalScore = 0
      let count = 0
      const studentGrades: Record<string, number | null> = {}

      classAssessments.forEach(assessment => {
        const grade = assessment.grades[student.id]
        studentGrades[assessment.id] = grade !== undefined ? grade : null
        if (grade !== undefined) {
          totalScore += grade
          count++
        }
      })

      return {
        id: student.id,
        name: student.name,
        ra: student.ra,
        grades: studentGrades,
        average: count > 0 ? totalScore / count : 0
      }
    })

    return { assessments: classAssessments, rows }
  }, [assessments, spreadsheetClassId])

  const filteredStudentsForGrading = useMemo(() => {
    if (!gradingClassId) return []
    return MOCK_STUDENTS.filter(s => s.classId === gradingClassId)
  }, [gradingClassId])

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Avaliações & Notas</h2>
          <p className="text-muted-foreground mt-1">Gerencie o desempenho acadêmico com rubricas estruturadas e IA.</p>
        </div>
        
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg">
              <Plus className="h-4 w-4" /> Nova Avaliação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[750px] w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-white shadow-2xl border-none">
            <DialogHeader className="p-6 pb-4 border-b shrink-0">
              <DialogTitle>Criar Registro de Avaliação</DialogTitle>
              <DialogDescription>Defina os parâmetros e a rubrica de desempenho.</DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 w-full bg-slate-50/30">
              <div className="p-8">
                <form id="new-assessment-form" onSubmit={handleCreateAssessment} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <Label className="font-bold">Título da Avaliação</Label>
                      <Input 
                        placeholder="Ex: Redação Argumentativa - 4º Bimestre" 
                        value={newAssessment.title}
                        onChange={(e) => setNewAssessment({...newAssessment, title: e.target.value})}
                        className="bg-white h-11 text-lg font-medium"
                      />
                    </div>

                    <div className="space-y-3 col-span-1 md:col-span-2">
                      <Label className="font-bold">Turmas Vinculadas ({selectedClasses.length} selecionada(s))</Label>
                      <ClassMultiSelect 
                        classes={MOCK_CLASSES} 
                        value={selectedClasses} 
                        onChange={setSelectedClasses} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold">Disciplina</Label>
                      <Select value={newAssessment.subject} onValueChange={(v: any) => setNewAssessment({...newAssessment, subject: v})}>
                        <SelectTrigger className="bg-white h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Portuguese">Português</SelectItem>
                          <SelectItem value="Math">Matemática</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold">Data de Aplicação</Label>
                      <Input 
                        type="date" 
                        value={newAssessment.date} 
                        onChange={(e) => setNewAssessment({...newAssessment, date: e.target.value})} 
                        className="bg-white h-11" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold">Taxonomia de Bloom</Label>
                      <Select value={newAssessment.bloomLevel} onValueChange={(v) => setNewAssessment({...newAssessment, bloomLevel: v})}>
                        <SelectTrigger className="bg-white h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {BLOOM_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator className="my-10" />

                  <div className="space-y-6 pb-12">
                    <div className="flex items-center justify-between bg-transparent py-2">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        <LayoutList className="h-4 w-4" /> Critérios da Rubrica
                      </h4>
                      <Button type="button" variant="outline" size="sm" onClick={addCriterion} className="gap-2 bg-white shadow-sm font-bold text-xs">
                        <PlusCircle className="h-4 w-4 text-primary" /> Adicionar Critério
                      </Button>
                    </div>

                    <div className="grid gap-8">
                      {newRubric.map((criterion, cIdx) => (
                        <Card key={criterion.id} className="border shadow-md overflow-hidden bg-white hover:border-primary/20 transition-all">
                          <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 bg-slate-50/80">
                            <div className="flex items-center gap-3 flex-1 mr-4">
                              <span className="h-6 w-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {cIdx + 1}
                              </span>
                              <Input 
                                className="font-bold bg-transparent border-none focus-visible:ring-0 px-0 h-auto text-base placeholder:text-slate-400" 
                                placeholder="Título do Critério (ex: Coesão Textual)"
                                value={criterion.title}
                                onChange={(e) => updateCriterionTitle(criterion.id, e.target.value)}
                              />
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-destructive/10" onClick={() => removeCriterion(criterion.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4">
                            {criterion.levels.map((level) => (
                              <div key={level.id} className="grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-9">
                                  <Label className="text-[10px] text-muted-foreground font-bold uppercase mb-1 block">Nível de Desempenho</Label>
                                  <Input 
                                    className="h-9 text-xs" 
                                    placeholder="Descrição (ex: O texto apresenta conectivos variados...)" 
                                    value={level.label}
                                    onChange={(e) => updateLevel(criterion.id, level.id, { label: e.target.value })}
                                  />
                                </div>
                                <div className="col-span-3">
                                  <Label className="text-[10px] text-muted-foreground font-bold uppercase mb-1 block">Valor</Label>
                                  <div className="flex items-center gap-2">
                                    <Input 
                                      type="number" 
                                      className="h-9 text-xs text-center font-bold" 
                                      placeholder="Pts"
                                      value={level.points}
                                      onChange={(e) => updateLevel(criterion.id, level.id, { points: parseFloat(e.target.value) || 0 })}
                                    />
                                    <span className="text-[9px] font-black text-slate-400">PTS</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ))}

                      {newRubric.length === 0 && (
                        <div className="text-center py-24 border-2 border-dashed rounded-xl bg-white/50 group">
                          <LayoutList className="h-12 w-12 mx-auto mb-4 text-slate-300 group-hover:text-primary/40 transition-colors" />
                          <p className="text-sm font-bold text-slate-400">Nenhuma rubrica definida.</p>
                          <p className="text-xs text-slate-400/80 mt-1">Clique em "Adicionar Critério" para estruturar a avaliação.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>
              <ScrollBar className="w-2" />
            </ScrollArea>

            <DialogFooter className="p-6 bg-slate-50 border-t shrink-0">
              <Button type="submit" form="new-assessment-form" className="w-full h-12 text-md font-bold shadow-lg">
                Salvar Avaliação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-white border shadow-sm p-1">
          <TabsTrigger value="manager" className="gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
            <ClipboardList className="h-4 w-4" /> Diário de Avaliações
          </TabsTrigger>
          <TabsTrigger value="spreadsheet" className="gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
            <TableIcon className="h-4 w-4" /> Planilha de Resultados
          </TabsTrigger>
          <TabsTrigger value="generator" className="gap-2 font-bold data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <Sparkles className="h-4 w-4" /> Gerador IA Bloom
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manager" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assessments.map((a) => (
              <Card key={a.id} className="border-none shadow-md bg-white hover:shadow-lg transition-all overflow-hidden flex flex-col group">
                <div className={cn("h-1.5", BLOOM_LEVELS.find(l => l.value === a.bloomLevel)?.color.split(' ')[0] || "bg-primary")} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">
                      {a.subject === 'Portuguese' ? 'Português' : 'Matemática'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-bold">{new Date(a.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">{a.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5">
                    <BrainCircuit className="h-3.5 w-3.5" /> 
                    Nível: {BLOOM_LEVELS.find(l => l.value === a.bloomLevel)?.label}
                  </CardDescription>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {a.classIds.map(cid => (
                      <Badge key={cid} variant="secondary" className="text-[9px] h-5 bg-muted font-bold">
                        {MOCK_CLASSES.find(c => c.id === cid)?.name || 'N/A'}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="pb-4 flex-1">
                  <div className="bg-muted/30 p-3 rounded-lg border border-border border-dashed mb-4">
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
                <CardFooter className="pt-0 border-t bg-muted/10 p-0">
                  <Button variant="ghost" className="w-full h-12 gap-2 text-primary font-bold hover:bg-primary/5 rounded-none" onClick={() => openGradesDialog(a)}>
                    <CheckCircle2 className="h-4 w-4" /> Lançar Notas
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="spreadsheet" className="mt-6 space-y-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2">
                  <TableIcon className="h-5 w-5 text-primary" />
                  Planilha de Resultados Consolidada
                </CardTitle>
                <CardDescription>Visualize o desempenho de cada aluno em todas as avaliações lado a lado.</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Selecionar Turma</Label>
                  <Select value={spreadsheetClassId} onValueChange={setSpreadsheetClassId}>
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="Turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_CLASSES.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="w-[250px] font-bold text-xs uppercase sticky left-0 bg-slate-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Estudante</TableHead>
                      {spreadsheetData.assessments.map(a => (
                        <TableHead key={a.id} className="text-center font-bold text-[10px] uppercase min-w-[120px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="truncate max-w-[120px]">{a.title}</span>
                            <Badge variant="outline" className="text-[8px] h-4 px-1 mx-auto font-normal opacity-70">
                              {BLOOM_LEVELS.find(l => l.value === a.bloomLevel)?.label}
                            </Badge>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-bold text-xs uppercase bg-primary/5 text-primary min-w-[100px] border-l">Média Final</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {spreadsheetData.rows.map((row) => (
                      <TableRow key={row.id} className="group hover:bg-muted/10">
                        <TableCell className="sticky left-0 bg-white z-20 font-medium group-hover:bg-slate-50 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold truncate max-w-[200px]">{row.name}</span>
                            <span className="text-[10px] text-muted-foreground">RA: {row.ra}</span>
                          </div>
                        </TableCell>
                        {spreadsheetData.assessments.map(a => (
                          <TableCell key={a.id} className="text-center">
                            {row.grades[a.id] !== null ? (
                              <span className="font-bold text-sm">{row.grades[a.id]?.toFixed(1)}</span>
                            ) : (
                              <span className="text-muted-foreground/30 text-xs">-</span>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-center bg-primary/5 border-l">
                          <Badge className={cn(
                            "text-xs font-black h-7 px-3",
                            row.average >= 7 ? "bg-green-500" : row.average >= 5 ? "bg-amber-500" : "bg-red-500"
                          )}>
                            {row.average.toFixed(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
            <CardFooter className="bg-slate-50/50 border-t p-4">
              <div className="flex items-center gap-6 text-[10px] font-bold uppercase text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-sm" /> Satisfatório (7.0+)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-sm" /> Em Alerta (5.0 - 6.9)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-sm" /> Crítico (&lt; 5.0)
                </div>
              </div>
            </CardFooter>
          </Card>
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
                      <div key={idx} className="p-4 rounded-xl bg-muted/20 border group hover:border-accent/40 transition-colors">
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
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] bg-white p-0 overflow-hidden flex flex-col shadow-2xl border-none">
          <DialogHeader className="p-6 bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center justify-between pr-8">
              <div>
                <DialogTitle className="text-2xl font-black">{selectedAssessment?.title}</DialogTitle>
                <p className="text-sm text-primary-foreground/80 mt-1">
                  Lançamento de Notas por Rubrica
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-[10px] font-bold uppercase block opacity-60">Nível Bloom</span>
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/40">
                  {BLOOM_LEVELS.find(l => l.value === selectedAssessment?.bloomLevel)?.label}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between shrink-0">
            <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Turma em Avaliação</Label>
              <Select value={gradingClassId} onValueChange={setGradingClassId}>
                <SelectTrigger className="h-10 bg-white border-slate-200">
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {selectedAssessment?.classIds.map(id => (
                    <SelectItem key={id} value={id}>
                      {MOCK_CLASSES.find(c => c.id === id)?.name || `Turma ${id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Alunos Listados</span>
              <Badge variant="outline" className="bg-white">
                {filteredStudentsForGrading.length} estudantes
              </Badge>
            </div>
          </div>
          
          <ScrollArea className="flex-1 w-full">
            <div className="p-6 space-y-8">
              {filteredStudentsForGrading.length > 0 ? (
                filteredStudentsForGrading.map((student) => {
                  const selection = tempGrades[student.id] || {}
                  let total = 0
                  
                  if (selectedAssessment?.rubric && selectedAssessment.rubric.length > 0) {
                    Object.entries(selection).forEach(([cId, lId]) => {
                      const criterion = selectedAssessment?.rubric.find(c => c.id === cId)
                      const level = criterion?.levels.find(l => l.id === lId)
                      if (level) total += level.points
                    })
                  } else {
                    total = selectedAssessment?.grades[student.id] || 0
                  }

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
                        {selectedAssessment?.rubric && selectedAssessment.rubric.length > 0 ? (
                          selectedAssessment.rubric.map((criterion) => (
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
                          ))
                        ) : (
                          <div className="flex items-center gap-4">
                            <Label>Nota Direta:</Label>
                            <Input 
                              type="number" 
                              className="w-24 font-bold" 
                              defaultValue={total}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0
                                setAssessments(prev => prev.map(a => 
                                  a.id === selectedAssessment?.id ? {
                                    ...a,
                                    grades: { ...a.grades, [student.id]: val }
                                  } : a
                                ))
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-20 text-center opacity-30 flex flex-col items-center">
                  <Info className="h-10 w-10 mb-2" />
                  <p className="text-sm font-bold">Selecione uma turma para carregar os alunos.</p>
                </div>
              )}
            </div>
            <ScrollBar className="w-2" />
          </ScrollArea>

          <DialogFooter className="p-6 bg-muted/10 border-t shrink-0">
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
