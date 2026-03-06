"use client"

import { useState, useRef, useEffect, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { 
  Search, UserPlus, Filter, MoreHorizontal, Eye, BrainCircuit, FileText, 
  Sparkles, Camera, RotateCcw, Check, Trash2, Pencil, AlertCircle, X, 
  Calendar, ClipboardCheck, GraduationCap, History, Info, FileDown 
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

const BLOOM_LEVELS = [
  { value: 'Remember', label: 'Lembrar' },
  { value: 'Understand', label: 'Entender' },
  { value: 'Apply', label: 'Aplicar' },
  { value: 'Analyze', label: 'Analisar' },
  { value: 'Evaluate', label: 'Avaliar' },
  { value: 'Create', label: 'Criar' },
]

const STATUS_OPTIONS = [
  { value: 'Ativo', label: 'Ativo' },
  { value: 'Transferido', label: 'Transferido' },
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
        { subject: 'Matemática', competency: 'Frações', level: 'Remember', score: 70, date: '2023-09-20' },
      ],
      occurrences: [
        { date: '2023-10-10', type: 'Pedagógica', description: 'Demonstrou liderança excepcional em trabalho de grupo.' },
        { date: '2023-09-12', type: 'Comportamental', description: 'Conversa excessiva durante a explicação de conteúdo novo.' },
      ],
      observations: [
        "Estudante dedicada, porém precisa focar mais em revisões de gramática.",
        "Apresenta ótimas conexões entre textos literários e atualidades."
      ]
    }
  },
  { id: '2', name: 'Bruno Oliveira Souza', class: '9º Ano A', classId: '1', subject: 'Português', trend: 'stable', bloomLevel: 'Understand', callNumber: '05', ra: '234567', raDigit: '8', tutor: 'Prof. Ricardo', status: 'Ativo' },
  { id: '3', name: 'Carlos Eduardo Santos', class: '9º Ano A', classId: '1', subject: 'Português', trend: 'up', bloomLevel: 'Analyze', callNumber: '08', ra: '345678', raDigit: '9', tutor: 'Prof. Ricardo', status: 'Ativo' },
  { id: '4', name: 'Daniela Lima Ferreira', class: '9º Ano B', classId: '2', subject: 'Português', trend: 'down', bloomLevel: 'Remember', callNumber: '12', ra: '456789', raDigit: '0', tutor: 'Profa. Marina', status: 'Transferido' },
  { id: '5', name: 'Eduardo Pereira Costa', class: '9º Ano B', classId: '2', subject: 'Português', trend: 'up', bloomLevel: 'Create', callNumber: '15', ra: '567890', raDigit: '1', tutor: 'Profa. Marina', status: 'Ativo' },
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
  const [isExporting, setIsExporting] = useState(false)
  
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isOccurrenceOpen, setIsOccurrenceOpen] = useState(false)
  const [isFichaOpen, setIsFichaOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  const [occurrenceText, setOccurrenceText] = useState("")
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    callNumber: "",
    name: "",
    ra: "",
    raDigit: "",
    class: "",
    tutor: "",
    bloomLevel: "Remember",
    status: "Ativo"
  })

  // Filtering Logic
  const classFilter = searchParams.get('class')
  
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           student.ra.includes(searchTerm) ||
                           student.class.toLowerCase().includes(searchTerm.toLowerCase())
      
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

  useEffect(() => {
    if (!isRegisterOpen && !isOccurrenceOpen && !isFichaOpen) {
      const timer = setTimeout(() => {
        if (typeof document !== 'undefined') {
          document.body.style.pointerEvents = "auto";
          document.body.style.overflow = "auto";
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isRegisterOpen, isOccurrenceOpen, isFichaOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setIsCameraActive(true)
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (error) {
      toast({ variant: 'destructive', title: 'Câmera Indisponível' })
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)
        setCapturedPhoto(canvasRef.current.toDataURL('image/jpeg'))
        stopCamera()
      }
    }
  }

  const openCreateDialog = () => {
    setIsEditing(false)
    setSelectedStudent(null)
    setFormData({callNumber: "", name: "", ra: "", raDigit: "", class: "", tutor: "", bloomLevel: "Remember", status: "Ativo"})
    setCapturedPhoto(null)
    setIsRegisterOpen(true)
  }

  const openEditDialog = (student: any) => {
    setIsEditing(true)
    setSelectedStudent(student)
    setFormData({ 
      callNumber: student.callNumber, 
      name: student.name, 
      ra: student.ra, 
      raDigit: student.raDigit, 
      class: student.class, 
      tutor: student.tutor, 
      bloomLevel: student.bloomLevel, 
      status: student.status 
    })
    setCapturedPhoto(student.photo || null)
    setIsRegisterOpen(true)
  }

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditing && selectedStudent) {
      setStudents(students.map(s => s.id === selectedStudent.id ? { ...s, ...formData, photo: capturedPhoto } : s))
      toast({ title: "Cadastro Atualizado" })
    } else {
      setStudents([{ id: Date.now().toString(), ...formData, photo: capturedPhoto, trend: 'stable' } as any, ...students])
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
          notes: `Disciplina: ${a.subject}`
        })) || [{ competency: 'Geral', skill: 'Progresso', score: 80 }],
        observationalNotes: selectedStudent.history?.observations || ['Aluno em evolução constante.']
      })
      setAiInsight(result)
    } catch (error) {
      toast({ title: "Erro na IA", description: "Não foi possível gerar a análise agora.", variant: "destructive" })
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (!selectedStudent || !printRef.current) return
    setIsExporting(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')
      
      const canvas = await html2canvas(printRef.current, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Historico_${selectedStudent.name}.pdf`)
      toast({ title: "Exportação concluída" })
    } catch (error) {
      toast({ title: "Erro na exportação", variant: "destructive" })
    } finally {
      setIsExporting(false)
    }
  }

  const clearClassFilter = () => {
    router.replace('/students', { scroll: false })
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Gestão de Alunos</h2>
          <p className="text-muted-foreground mt-1">
            {classFilter ? `Exibindo alunos da turma selecionada` : `Acompanhe perfis individuais e histórico de aprendizagem.`}
          </p>
        </div>
        <Button className="gap-2 shadow-lg" onClick={openCreateDialog}>
          <UserPlus className="h-4 w-4" /> Cadastrar Aluno
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, RA ou turma..." 
            className="pl-10 bg-muted/20 border-none" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {classFilter && (
          <Button variant="secondary" className="gap-2 bg-primary/10 text-primary border-primary/20" onClick={clearClassFilter}>
            <X className="h-4 w-4" /> Limpar Filtro de Turma
          </Button>
        )}
        <Button variant="outline" className="gap-2"><Filter className="h-4 w-4" /> Filtros Avançados</Button>
      </div>

      <div className="grid gap-4">
        {filteredStudents.map((student) => (
          <Card key={student.id} className={`border-none shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden group ${student.status === 'Transferido' ? 'opacity-75 grayscale-[0.3]' : ''}`}>
            <CardContent className="p-0 flex items-center h-20">
              <div className={`w-1 h-full ${student.status === 'Ativo' ? 'bg-primary' : 'bg-muted-foreground'} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="px-6 flex-1 grid grid-cols-5 items-center gap-4">
                <div className="flex items-center gap-3 col-span-1 overflow-hidden text-left">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-primary overflow-hidden border border-border shrink-0">
                    {student.photo ? <img src={student.photo} alt="" className="w-full h-full object-cover" /> : student.name.charAt(0)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <button 
                      onClick={() => {
                        setSelectedStudent(student);
                        setAiInsight(null);
                        setIsFichaOpen(true);
                        router.replace(`/students?id=${student.id}`, { scroll: false })
                      }}
                      className="font-semibold text-sm truncate hover:text-primary hover:underline text-left"
                    >
                      {student.name}
                    </button>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tighter font-bold">RA: {student.ra}-{student.raDigit}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Turma</span>
                  <span className="text-sm font-medium">{student.class}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Situação</span>
                  <Badge variant={student.status === 'Ativo' ? 'secondary' : 'outline'} className={`text-[9px] h-5 ${student.status === 'Ativo' ? 'bg-green-100 text-green-700' : ''}`}>
                    {student.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Média Bloom</span>
                  <Badge variant="secondary" className="text-[9px] h-5">{student.bloomLevel}</Badge>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1.5 h-8 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10" 
                    onClick={() => {
                      setSelectedStudent(student);
                      setAiInsight(null);
                      setIsFichaOpen(true);
                      router.replace(`/students?id=${student.id}`, { scroll: false })
                    }}
                  >
                    <History className="h-3.5 w-3.5" /> Histórico
                  </Button>
                  
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openEditDialog(student); }}>
                        <Pencil className="h-4 w-4 mr-2" /> Editar Aluno
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSelectedStudent(student); setOccurrenceText(""); setIsOccurrenceOpen(true); }}>
                        <AlertCircle className="h-4 w-4 mr-2" /> Lançar Ocorrência
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onSelect={() => setStudents(students.filter(s => s.id !== student.id))}>
                        <Trash2 className="h-4 w-4 mr-2" /> Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredStudents.length === 0 && (
          <div className="py-20 text-center opacity-30 flex flex-col items-center">
            <Info className="h-12 w-12 mb-4" />
            <p className="font-medium">Nenhum aluno encontrado para os critérios selecionados.</p>
          </div>
        )}
      </div>

      {/* Register/Edit Dialog */}
      <Dialog open={isRegisterOpen} onOpenChange={(open) => { setIsRegisterOpen(open); if (!open) stopCamera(); }}>
        <DialogContent className="max-w-3xl bg-white p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-primary text-primary-foreground shrink-0">
            <DialogTitle className="text-2xl">{isEditing ? 'Editar Aluno' : 'Novo Cadastro'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-4 flex flex-col items-center gap-4">
                <div className="relative w-full aspect-[3/4] rounded-lg bg-muted border-2 border-dashed flex items-center justify-center overflow-hidden">
                  {capturedPhoto ? (
                    <img src={capturedPhoto} alt="Preview" className="w-full h-full object-cover" />
                  ) : isCameraActive ? (
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                  ) : (
                    <Camera className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex gap-2">
                  {!isCameraActive ? (
                    <Button type="button" variant="outline" size="sm" onClick={startCamera}>Ativar Câmera</Button>
                  ) : (
                    <Button type="button" variant="destructive" size="sm" onClick={capturePhoto}>Capturar</Button>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="col-span-8 space-y-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-3">
                    <Label>Nº</Label>
                    <Input value={formData.callNumber} onChange={(e) => setFormData({...formData, callNumber: e.target.value})} />
                  </div>
                  <div className="col-span-9">
                    <Label>Nome</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>RA</Label>
                    <div className="flex gap-1">
                      <Input value={formData.ra} onChange={(e) => setFormData({...formData, ra: e.target.value})} />
                      <Input className="w-12 text-center" maxLength={1} value={formData.raDigit} onChange={(e) => setFormData({...formData, raDigit: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <Label>Turma</Label>
                    <Select value={formData.class} onValueChange={(v) => setFormData({...formData, class: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9º Ano A">9º Ano A</SelectItem>
                        <SelectItem value="9º Ano B">9º Ano B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Situação</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Bloom</Label>
                    <Select value={formData.bloomLevel} onValueChange={(v) => setFormData({...formData, bloomLevel: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{BLOOM_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter><Button type="submit">Salvar Alterações</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Occurrence Dialog */}
      <Dialog open={isOccurrenceOpen} onOpenChange={setIsOccurrenceOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader><DialogTitle>Lançar Ocorrência</DialogTitle></DialogHeader>
          <Textarea 
            placeholder="Descreva a situação detalhadamente..." 
            className="min-h-[120px]" 
            value={occurrenceText} 
            onChange={(e) => setOccurrenceText(e.target.value)} 
          />
          <DialogFooter><Button onClick={() => { toast({title: "Ocorrência Registrada"}); setIsOccurrenceOpen(false); }}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History (Ficha) Dialog */}
      <Dialog open={isFichaOpen} onOpenChange={(open) => { 
        setIsFichaOpen(open); 
        if (!open) router.replace('/students', { scroll: false }); 
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-primary text-primary-foreground shrink-0 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 overflow-hidden shadow-2xl">
                  {selectedStudent?.photo ? <img src={selectedStudent.photo} alt="" className="w-full h-full object-cover" /> : <span className="text-4xl font-bold">{selectedStudent?.name.charAt(0)}</span>}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <DialogTitle className="text-3xl font-black">{selectedStudent?.name}</DialogTitle>
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/40">{selectedStudent?.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-primary-foreground/80 font-medium">
                    <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> {selectedStudent?.class}</span>
                    <span className="flex items-center gap-1.5"><Info className="h-4 w-4" /> RA: {selectedStudent?.ra}-{selectedStudent?.raDigit}</span>
                    <span className="flex items-center gap-1.5"><History className="h-4 w-4" /> Tutor: {selectedStudent?.tutor}</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-2 font-bold"
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                <FileDown className="h-4 w-4" /> {isExporting ? "Gerando..." : "Exportar PDF"}
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 bg-muted/20 border-b">
              <TabsList className="bg-transparent h-14 w-full justify-start gap-8 p-0">
                <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 px-0 font-bold text-muted-foreground transition-all">Resumo</TabsTrigger>
                <TabsTrigger value="assessments" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 px-0 font-bold text-muted-foreground transition-all">Avaliações</TabsTrigger>
                <TabsTrigger value="attendance" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 px-0 font-bold text-muted-foreground transition-all">Frequência</TabsTrigger>
                <TabsTrigger value="occurrences" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 px-0 font-bold text-muted-foreground transition-all">Ocorrências</TabsTrigger>
                <TabsTrigger value="ai" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 px-0 font-bold text-muted-foreground transition-all flex gap-2"><Sparkles className="h-4 w-4 text-accent" /> IA Insights</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-8">
                <TabsContent value="overview" className="m-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none bg-blue-50/50 shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold uppercase text-blue-600 tracking-wider">Média Bloom</span>
                          <BrainCircuit className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-3xl font-black text-blue-900">{selectedStudent?.bloomLevel}</p>
                        <p className="text-xs text-blue-700 mt-1">Evolução de +2 níveis este bimestre</p>
                      </CardContent>
                    </Card>
                    <Card className="border-none bg-green-50/50 shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold uppercase text-green-600 tracking-wider">Presença Geral</span>
                          <ClipboardCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-3xl font-black text-green-900">92%</p>
                        <p className="text-xs text-green-700 mt-1">Acima da média da turma (88%)</p>
                      </CardContent>
                    </Card>
                    <Card className="border-none bg-amber-50/50 shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold uppercase text-amber-600 tracking-wider">Ocorrências</span>
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                        </div>
                        <p className="text-3xl font-black text-amber-900">{selectedStudent?.history?.occurrences.length || 0}</p>
                        <p className="text-xs text-amber-700 mt-1">Última há 15 dias</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-bold flex items-center gap-2">Observações Recentes</h4>
                    <div className="space-y-3">
                      {selectedStudent?.history?.observations.map((obs: string, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl bg-muted/20 border border-border/50 text-sm italic">
                          "{obs}"
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="assessments" className="m-0 space-y-6">
                  <div className="space-y-4">
                    {selectedStudent?.history?.assessments.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-xl border bg-white shadow-sm hover:border-primary/40 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <GraduationCap className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold">{item.competency}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{item.subject}</span>
                              <span>•</span>
                              <span>{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <Badge variant="outline" className="h-6 px-2 text-[10px] uppercase font-bold border-primary/30 text-primary">{item.level}</Badge>
                          <div className="text-right">
                            <span className="text-xl font-black text-primary">{item.score}</span>
                            <span className="text-[10px] text-muted-foreground block">pontos</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="attendance" className="m-0 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border-dashed border-2">
                    <div className="flex items-center gap-4">
                      <Calendar className="h-8 w-8 text-primary/40" />
                      <div>
                        <p className="font-bold">Registro de Frequência do Mês</p>
                        <p className="text-xs text-muted-foreground">Exibindo os últimos 5 registros</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {selectedStudent?.history?.attendance.map((att: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-xl border bg-white">
                        <span className="font-medium text-sm">{new Date(att.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        <Badge className={att.status === 'present' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}>
                          {att.status === 'present' ? 'Presente' : 'Falta'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="occurrences" className="m-0 space-y-6">
                  <div className="space-y-4">
                    {selectedStudent?.history?.occurrences.map((occ: any, idx: number) => (
                      <div key={idx} className="relative pl-6 pb-6 border-l-2 border-amber-200 last:pb-0">
                        <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-amber-500 border-2 border-white" />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-[10px] uppercase font-bold bg-amber-100 text-amber-700">{occ.type}</Badge>
                            <span className="text-xs text-muted-foreground">{new Date(occ.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <p className="text-sm leading-relaxed">{occ.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="ai" className="m-0 space-y-6">
                  <div className="p-6 rounded-2xl bg-accent/5 border border-accent/20">
                    <div className="flex items-center justify-between mb-6">
                      <div className="space-y-1">
                        <h4 className="text-xl font-black text-accent flex items-center gap-2"><Sparkles className="h-5 w-5" /> Relatório Pedagógico IA</h4>
                        <p className="text-sm text-muted-foreground">Análise sintética de desempenho e sugestões de intervenção.</p>
                      </div>
                      <Button onClick={generateAiInsight} disabled={isAiLoading} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
                        {isAiLoading ? <span className="flex items-center gap-2 animate-pulse">Analisando dados...</span> : "Gerar Novo Insight"}
                      </Button>
                    </div>

                    {aiInsight ? (
                      <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="p-6 rounded-xl bg-white shadow-sm border border-accent/10">
                          <h5 className="font-bold text-accent mb-2 uppercase text-xs tracking-widest">Resumo do Percurso</h5>
                          <p className="text-sm leading-relaxed text-foreground/80">{aiInsight.progressSummary}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h5 className="font-bold text-sm text-green-600 flex items-center gap-2"><Check className="h-4 w-4" /> Pontos Fortes</h5>
                            <ul className="space-y-2">
                              {aiInsight.strengths.map((s, i) => <li key={i} className="text-xs p-2 bg-green-50 rounded-lg">{s}</li>)}
                            </ul>
                          </div>
                          <div className="space-y-3">
                            <h5 className="font-bold text-sm text-red-600 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Pontos de Atenção</h5>
                            <ul className="space-y-2">
                              {aiInsight.areasForImprovement.map((a, i) => <li key={i} className="text-xs p-2 bg-red-50 rounded-lg">{a}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                        <Sparkles className="h-10 w-10 text-accent" />
                        <p className="font-bold">Ainda não há análises disponíveis</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      <div className="absolute opacity-0 pointer-events-none -left-[9999px] top-0">
        <div ref={printRef} className="w-[800px] p-12 bg-white text-black space-y-10">
          <div className="border-b-8 border-primary pb-8 flex justify-between items-end">
            <div className="space-y-2">
              <h1 className="text-5xl font-black uppercase tracking-tighter text-primary">Histórico Escolar</h1>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Recompor+ • Relatório Consolidado</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 bg-muted/10 p-6 rounded-2xl border border-border/50">
            <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Estudante</p><p className="text-2xl font-black">{selectedStudent?.name}</p></div>
            <div><p className="text-[10px] font-bold text-muted-foreground uppercase">RA</p><p className="text-xl font-bold">{selectedStudent?.ra}-{selectedStudent?.raDigit}</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando dados...</div>}>
      <StudentsContent />
    </Suspense>
  )
}
