"use client"

import { useState, useRef, useEffect, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { 
  Search, UserPlus, Filter, MoreHorizontal, Eye, BrainCircuit, FileText, 
  Sparkles, Camera, RotateCcw, Check, Trash2, Pencil, AlertCircle, X, 
  Calendar, ClipboardCheck, GraduationCap, History, Info, FileDown,
  Upload, Image as ImageIcon, BookOpen, Clock, Plus
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { personalizedLearningSuggestions } from "@/ai/flows/personalized-learning-suggestions"
import type { PersonalizedLearningSuggestionsOutput } from "@/ai/flows/personalized-learning-suggestions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

const BLOOM_LEVELS = [
  { value: 'Remember', label: 'Lembrar' },
  { value: 'Understand', label: 'Entender' },
  { value: 'Apply', label: 'Aplicar' },
  { value: 'Analyze', label: 'Analisar' },
  { value: 'Evaluate', label: 'Avaliar' },
  { value: 'Create', label: 'Criar' },
]

const MOCK_DISCIPLINES = [
  { id: 'd1', name: 'Língua Portuguesa', class: '9º Ano A', schedule: '07:00 às 07:50' },
  { id: 'd2', name: 'Matemática', class: '9º Ano A', schedule: '07:50 às 08:40' },
  { id: 'd3', name: 'História', class: '9º Ano B', schedule: '08:40 às 09:30' },
]

const MOCK_INITIAL_STUDENTS = [
  { 
    id: '1', 
    name: 'Ana Beatriz Silva', 
    class: '9º Ano A', 
    classId: '1',
    subject: 'Português', 
    trend: 'up', 
    bloomLevel: 'Apply', 
    callNumber: '01', 
    ra: '123456', 
    raDigit: '7', 
    tutor: 'Prof. Ricardo', 
    status: 'Ativo',
    enrollments: ['d1', 'd2'],
    history: {
      attendance: [
        { date: '2023-10-25', status: 'present' },
        { date: '2023-10-24', status: 'present' },
        { date: '2023-10-23', status: 'absent' },
        { date: '2023-10-20', status: 'present' },
        { date: '2023-10-19', status: 'present' },
      ],
      assessments: [
        { subject: 'Português', competency: 'Interpretação', level: 'Understand', score: 85, date: '2023-10-15' },
        { subject: 'Português', competency: 'Sintaxe', level: 'Apply', score: 92, date: '2023-10-05' },
      ],
      occurrences: [
        { date: '2023-10-10', type: 'Pedagógica', description: 'Demonstrou liderança excepcional em trabalho de grupo.' },
      ],
      observations: [
        "Estudante dedicada, porém precisa focar mais em revisões de gramática.",
      ]
    }
  },
]

function StudentsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [students, setStudents] = useState(MOCK_INITIAL_STUDENTS)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [aiInsight, setAiInsight] = useState<PersonalizedLearningSuggestionsOutput | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
  
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isOccurrenceOpen, setIsOccurrenceOpen] = useState(false)
  const [isFichaOpen, setIsFichaOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  const [occurrenceText, setOccurrenceText] = useState("")
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    callNumber: "",
    name: "",
    ra: "",
    raDigit: "",
    class: "",
    classId: "1",
    tutor: "",
    bloomLevel: "Remember",
    status: "Ativo",
    enrollments: [] as string[]
  })

  const classFilter = searchParams.get('class')
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           student.ra.includes(searchTerm)
      const matchesClass = !classFilter || student.classId === classFilter
      return matchesSearch && matchesClass
    })
  }, [students, searchTerm, classFilter])

  useEffect(() => {
    const studentId = searchParams.get('id')
    if (studentId) {
      const student = students.find(s => s.id === studentId)
      if (student) {
        setSelectedStudent(student)
        setIsFichaOpen(true)
      }
    }
  }, [searchParams, students])

  const toggleEnrollment = (disciplineId: string) => {
    if (!selectedStudent) return;
    const isEnrolled = selectedStudent.enrollments?.includes(disciplineId);
    const newEnrollments = isEnrolled 
      ? selectedStudent.enrollments.filter((id: string) => id !== disciplineId)
      : [...(selectedStudent.enrollments || []), disciplineId];
    
    setStudents(students.map(s => s.id === selectedStudent.id ? { ...s, enrollments: newEnrollments } : s));
    setSelectedStudent({ ...selectedStudent, enrollments: newEnrollments });
  }

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditing && selectedStudent) {
      setStudents(students.map(s => s.id === selectedStudent.id ? { ...s, ...formData, photo: capturedPhoto } : s))
      toast({ title: "Cadastro Atualizado" })
    } else {
      setStudents([{ id: Date.now().toString(), ...formData, photo: capturedPhoto, enrollments: [] } as any, ...students])
      toast({ title: "Aluno Cadastrado" })
    }
    setIsRegisterOpen(false)
  }

  const generateAiInsight = async () => {
    if (!selectedStudent) return
    setIsAiLoading(true)
    try {
      const result = await personalizedLearningSuggestions({
        studentName: selectedStudent.name,
        assessmentData: selectedStudent.history?.assessments.map((a: any) => ({
          competency: a.level,
          skill: a.competency,
          score: a.score,
        })) || [],
        observationalNotes: selectedStudent.history?.observations || []
      })
      setAiInsight(result)
    } catch (error) {
      toast({ title: "Erro na IA", variant: "destructive" })
    } finally {
      setIsAiLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Gestão de Alunos</h2>
          <p className="text-muted-foreground mt-1">Matrículas, histórico e intervenções pedagógicas.</p>
        </div>
        <Button className="gap-2 shadow-lg" onClick={() => { setIsEditing(false); setFormData({callNumber: "", name: "", ra: "", raDigit: "", class: "9º Ano A", classId: "1", tutor: "", bloomLevel: "Remember", status: "Ativo", enrollments: []}); setCapturedPhoto(null); setIsRegisterOpen(true); }}>
          <UserPlus className="h-4 w-4" /> Cadastrar Aluno
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou RA..." className="pl-10 bg-muted/20 border-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden group">
            <CardContent className="p-0 flex items-center h-20">
              <div className="px-6 flex-1 grid grid-cols-6 items-center gap-4">
                <div className="flex items-center gap-3 col-span-2 text-left">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                    {student.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <button onClick={() => { setSelectedStudent(student); setIsFichaOpen(true); }} className="font-semibold text-sm hover:text-primary hover:underline text-left">{student.name}</button>
                    <span className="text-[10px] text-muted-foreground font-bold">RA: {student.ra}-{student.raDigit}</span>
                  </div>
                </div>
                <div><span className="text-[10px] font-bold text-muted-foreground block">Turma</span><span className="text-sm font-medium">{student.class}</span></div>
                <div><span className="text-[10px] font-bold text-muted-foreground block">Matrículas</span><Badge variant="secondary" className="text-[9px]">{student.enrollments?.length || 0} Disc.</Badge></div>
                <div><span className="text-[10px] font-bold text-muted-foreground block">Média Bloom</span><Badge variant="outline" className="text-[9px]">{student.bloomLevel}</Badge></div>
                <div className="flex justify-end"><Button variant="ghost" size="icon" onClick={() => { setSelectedStudent(student); setIsFichaOpen(true); }}><Eye className="h-4 w-4" /></Button></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isFichaOpen} onOpenChange={setIsFichaOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">{selectedStudent?.name.charAt(0)}</div>
              <div>
                <DialogTitle className="text-2xl font-black">{selectedStudent?.name}</DialogTitle>
                <div className="flex items-center gap-4 text-primary-foreground/80 text-sm mt-1">
                  <span>{selectedStudent?.class}</span> • <span>RA: {selectedStudent?.ra}-{selectedStudent?.raDigit}</span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="enrollment" className="flex-1 flex flex-col">
            <TabsList className="px-8 bg-muted/20 border-b h-14 w-full justify-start gap-8 rounded-none bg-transparent">
              <TabsTrigger value="enrollment" className="font-bold data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Matrícula em Disciplinas</TabsTrigger>
              <TabsTrigger value="overview" className="font-bold data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Histórico</TabsTrigger>
              <TabsTrigger value="ai" className="font-bold data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">IA Insights</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 p-8">
              <TabsContent value="enrollment" className="m-0 space-y-6">
                <div className="flex flex-col gap-1 mb-6">
                  <h4 className="text-lg font-bold">Gestão de Matrícula</h4>
                  <p className="text-sm text-muted-foreground">Selecione em quais disciplinas específicas o aluno está matriculado.</p>
                </div>
                <div className="grid gap-4">
                  {MOCK_DISCIPLINES.map((discipline) => {
                    const isEnrolled = selectedStudent?.enrollments?.includes(discipline.id);
                    return (
                      <div key={discipline.id} className={cn("p-4 rounded-xl border flex items-center justify-between transition-all", isEnrolled ? "bg-primary/5 border-primary/20" : "bg-white border-border")}>
                        <div className="flex items-center gap-4">
                          <Checkbox checked={isEnrolled} onCheckedChange={() => toggleEnrollment(discipline.id)} />
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{discipline.name}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {discipline.schedule}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase">{discipline.class}</Badge>
                      </div>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="overview" className="m-0">
                <div className="p-20 text-center opacity-30 italic">Dados históricos consolidados...</div>
              </TabsContent>

              <TabsContent value="ai" className="m-0 space-y-6">
                <div className="p-6 rounded-2xl bg-accent/5 border border-accent/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> Análise Pedagógica</h4>
                    <Button size="sm" onClick={generateAiInsight} disabled={isAiLoading}>{isAiLoading ? "Analisando..." : "Gerar Relatório"}</Button>
                  </div>
                  {aiInsight && (
                    <div className="space-y-4">
                      <p className="text-sm italic">"{aiInsight.progressSummary}"</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
      <StudentsContent />
    </Suspense>
  )
}
