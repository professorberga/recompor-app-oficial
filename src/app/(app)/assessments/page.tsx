
"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { 
  BrainCircuit, 
  FileDown, 
  Sparkles, 
  Plus, 
  ClipboardList, 
  GraduationCap, 
  Search,
  ChevronRight,
  Save,
  Info,
  CheckCircle2
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

interface AssessmentRecord {
  id: string;
  title: string;
  subject: "Portuguese" | "Math";
  classId: string;
  bloomLevel: string;
  date: string;
  rubric?: string;
  grades: Record<string, number>; // studentId -> score
}

export default function AssessmentPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("manager")
  
  // IA Generator State
  const [subjectIA, setSubjectIA] = useState<"Portuguese" | "Math">("Portuguese")
  const [competencyIA, setCompetencyIA] = useState("")
  const [bloomLevelIA, setBloomLevelIA] = useState<any>("Remember")
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
      rubric: 'Avaliar a capacidade de identificar metáforas e ironias no texto literário.',
      grades: { '1': 8.5, '2': 7.0, '3': 9.0 }
    }
  ])
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [isGradesDialogOpen, setIsGradesDialogOpen] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentRecord | null>(null)
  
  const [newAssessment, setNewAssessment] = useState({
    title: "",
    subject: "Portuguese" as "Portuguese" | "Math",
    classId: "1",
    bloomLevel: "Understand",
    date: new Date().toISOString().split('T')[0],
    rubric: ""
  })

  const [tempGrades, setTempGrades] = useState<Record<string, string>>({})

  const { toast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)

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
        bloomLevel: bloomLevelIA,
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
      grades: {}
    }

    setAssessments([assessment, ...assessments])
    setIsNewDialogOpen(false)
    setNewAssessment({
      title: "",
      subject: "Portuguese",
      classId: "1",
      bloomLevel: "Understand",
      date: new Date().toISOString().split('T')[0],
      rubric: ""
    })
    toast({ title: "Avaliação Criada", description: "Agora você pode lançar as notas dos alunos." })
  }

  // Open Grades Dialog
  const openGradesDialog = (assessment: AssessmentRecord) => {
    setSelectedAssessment(assessment)
    const initialGrades: Record<string, string> = {}
    MOCK_STUDENTS.forEach(s => {
      initialGrades[s.id] = assessment.grades[s.id]?.toString() || ""
    })
    setTempGrades(initialGrades)
    setIsGradesDialogOpen(true)
  }

  // Save Grades
  const handleSaveGrades = () => {
    if (!selectedAssessment) return

    const updatedGrades: Record<string, number> = {}
    Object.entries(tempGrades).forEach(([id, val]) => {
      if (val !== "") updatedGrades[id] = parseFloat(val)
    })

    setAssessments(assessments.map(a => 
      a.id === selectedAssessment.id ? { ...a, grades: updatedGrades } : a
    ))
    
    setIsGradesDialogOpen(false)
    toast({ title: "Notas Registradas", description: "As notas foram salvas com sucesso." })
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Avaliações & Notas</h2>
          <p className="text-muted-foreground mt-1">Gerencie o desempenho acadêmico e utilize a IA para criar atividades.</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg">
                <Plus className="h-4 w-4" /> Nova Avaliação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white">
              <DialogHeader>
                <DialogTitle>Criar Registro de Avaliação</DialogTitle>
                <DialogDescription>Defina os parâmetros da atividade para lançar notas posteriormente.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAssessment} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título da Avaliação</Label>
                  <Input 
                    placeholder="Ex: Simulado de Frações" 
                    value={newAssessment.title}
                    onChange={(e) => setNewAssessment({...newAssessment, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Data da Aplicação</Label>
                  <Input type="date" value={newAssessment.date} onChange={(e) => setNewAssessment({...newAssessment, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Rubrica / Critérios (Opcional)</Label>
                  <Textarea 
                    placeholder="Descreva o que será avaliado..." 
                    value={newAssessment.rubric}
                    onChange={(e) => setNewAssessment({...newAssessment, rubric: e.target.value})}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">Criar Avaliação</Button>
                </DialogFooter>
              </form>
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
              <Card key={a.id} className="border-none shadow-md bg-white hover:shadow-lg transition-all overflow-hidden">
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
                <CardContent className="pb-4">
                  <div className="bg-muted/30 p-3 rounded-lg border border-dashed border-border mb-4">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase mb-2">
                      <span>Status de Notas</span>
                      <span>{Object.keys(a.grades).length}/{MOCK_STUDENTS.length}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all" 
                        style={{ width: `${(Object.keys(a.grades).length / MOCK_STUDENTS.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  {a.rubric && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50/50 p-2 rounded border border-blue-100 italic">
                      <Info className="h-3 w-3 shrink-0 mt-0.5 text-blue-500" />
                      <p className="line-clamp-2">{a.rubric}</p>
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
                  <div className="space-y-4" ref={printRef}>
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
        <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center justify-between pr-8">
              <div>
                <DialogTitle className="text-2xl font-black">{selectedAssessment?.title}</DialogTitle>
                <p className="text-sm text-primary-foreground/80 mt-1">Lançamento de Notas • Turma: {selectedAssessment?.classId}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase block opacity-60">Nível Bloom</span>
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/40">
                  {BLOOM_LEVELS.find(l => l.value === selectedAssessment?.bloomLevel)?.label}
                </Badge>
              </div>
            </div>
          </DialogHeader>
          <div className="p-6">
            <ScrollArea className="h-[400px] pr-4">
              <table className="w-full">
                <thead className="text-[10px] font-bold uppercase text-muted-foreground border-b h-10">
                  <tr>
                    <th className="text-left">Estudante</th>
                    <th className="text-right w-32">Nota (0-10)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {MOCK_STUDENTS.map((student) => (
                    <tr key={student.id} className="h-14 hover:bg-muted/5 transition-colors">
                      <td className="font-medium text-sm">
                        <div className="flex flex-col">
                          {student.name}
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">RA: {student.ra}</span>
                        </div>
                      </td>
                      <td className="text-right">
                        <Input 
                          type="number" 
                          step="0.5" 
                          min="0" 
                          max="10" 
                          className="w-24 ml-auto text-center font-bold text-lg"
                          placeholder="-"
                          value={tempGrades[student.id] || ""}
                          onChange={(e) => setTempGrades({...tempGrades, [student.id]: e.target.value})}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
          <DialogFooter className="p-6 bg-muted/10 border-t">
            <Button variant="outline" onClick={() => setIsGradesDialogOpen(false)}>Cancelar</Button>
            <Button className="px-8 shadow-lg" onClick={handleSaveGrades}>
              <Save className="h-4 w-4 mr-2" /> Salvar Notas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
