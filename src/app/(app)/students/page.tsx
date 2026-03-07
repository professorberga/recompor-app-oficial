
"use client"

import { useState, useRef, useEffect, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { 
  Search, UserPlus, Eye, BrainCircuit, 
  Sparkles, Camera, Check, Trash2, Pencil, AlertCircle, 
  Calendar, ClipboardCheck, GraduationCap, Info,
  Upload, Image as ImageIcon, BookOpen, Clock, Save, X, RotateCcw
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { personalizedLearningSuggestions } from "@/ai/flows/personalized-learning-suggestions"
import type { PersonalizedLearningSuggestionsOutput } from "@/ai/flows/personalized-learning-suggestions"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
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
    bloomLevel: 'Apply', 
    callNumber: '01', 
    ra: '123456', 
    raDigit: '7', 
    status: 'Ativo',
    photo: null,
    enrollments: ['d1', 'd2'],
    history: {
      attendance: [
        { date: '2024-10-25', status: 'present' },
        { date: '2024-10-24', status: 'present' },
        { date: '2024-10-23', status: 'absent' },
      ],
      assessments: [
        { subject: 'Português', competency: 'Interpretação', level: 'Understand', score: 85, date: '2024-10-15' },
        { subject: 'Português', competency: 'Sintaxe', level: 'Apply', score: 92, date: '2024-10-05' },
      ],
      occurrences: [
        { id: 'occ1', date: '2024-10-10', type: 'Pedagógica', description: 'Demonstrou liderança excepcional em trabalho de grupo.' },
      ],
      observations: [
        "Estudante dedicada, porém precisa focar mais em revisões de gramática.",
      ]
    }
  },
  { 
    id: '2', 
    name: 'Bruno Oliveira Souza', 
    class: '9º Ano A', 
    classId: '1',
    bloomLevel: 'Understand', 
    callNumber: '02', 
    ra: '234567', 
    raDigit: '8', 
    status: 'Ativo',
    photo: null,
    enrollments: ['d1'],
    history: {
      attendance: [],
      assessments: [],
      occurrences: [],
      observations: []
    }
  }
]

function StudentsContent() {
  const searchParams = useSearchParams()
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
  
  const [occurrenceData, setOccurrenceData] = useState({ type: 'Pedagógica', description: '' })
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
    class: "9º Ano A",
    classId: "1",
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

  // Camera Logic
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
      }
    } catch (err) {
      toast({ title: "Erro na Câmera", description: "Não foi possível acessar a webcam. Verifique as permissões.", variant: "destructive" })
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      setIsCameraActive(false)
    }
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setCapturedPhoto(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const toggleEnrollmentInForm = (disciplineId: string) => {
    setFormData(prev => ({
      ...prev,
      enrollments: prev.enrollments.includes(disciplineId)
        ? prev.enrollments.filter(id => id !== disciplineId)
        : [...prev.enrollments, disciplineId]
    }))
  }

  const toggleEnrollmentInProfile = (disciplineId: string) => {
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
    if (!formData.name || !formData.ra) {
      toast({ title: "Erro", description: "Nome e RA são obrigatórios.", variant: "destructive" })
      return
    }

    if (isEditing && selectedStudent) {
      const updatedStudent = { ...selectedStudent, ...formData, photo: capturedPhoto };
      setStudents(students.map(s => s.id === selectedStudent.id ? updatedStudent : s))
      toast({ title: "Cadastro Atualizado", description: `${formData.name} foi atualizado com sucesso.` })
    } else {
      const newStudent = { 
        id: Date.now().toString(), 
        ...formData, 
        photo: capturedPhoto, 
        history: { attendance: [], assessments: [], occurrences: [], observations: [] }
      }
      setStudents([newStudent as any, ...students])
      toast({ title: "Aluno Cadastrado", description: `${formData.name} foi adicionado e matriculado.` })
    }
    setIsRegisterOpen(false)
    stopCamera()
  }

  const handleAddOccurrence = () => {
    if (!selectedStudent || !occurrenceData.description) return
    const newOccurrence = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      ...occurrenceData
    }
    
    setStudents(students.map(s => s.id === selectedStudent.id ? {
      ...s,
      history: {
        ...s.history,
        occurrences: [newOccurrence, ...s.history.occurrences]
      }
    } : s))
    
    setOccurrenceData({ type: 'Pedagógica', description: '' })
    setIsOccurrenceOpen(false)
    toast({ title: "Ocorrência Registrada" })
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
      toast({ title: "Erro na IA", description: "Não foi possível gerar os insights.", variant: "destructive" })
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
        <Button className="gap-2 shadow-lg" onClick={() => { 
          setIsEditing(false); 
          setFormData({
            callNumber: "", 
            name: "", 
            ra: "", 
            raDigit: "", 
            class: "9º Ano A", 
            classId: "1", 
            bloomLevel: "Remember", 
            status: "Ativo", 
            enrollments: []
          }); 
          setCapturedPhoto(null); 
          setIsRegisterOpen(true); 
        }}>
          <UserPlus className="h-4 w-4" /> Cadastrar Aluno
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou RA..." 
            className="pl-10 bg-muted/20 border-none" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden group">
            <CardContent className="p-0 flex items-center h-20">
              <div className="px-6 flex-1 grid grid-cols-6 items-center gap-4">
                <div className="flex items-center gap-3 col-span-2 text-left">
                  {student.photo ? (
                    <img src={student.photo} alt={student.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                      {student.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <button onClick={() => { setSelectedStudent(student); setIsFichaOpen(true); }} className="font-semibold text-sm hover:text-primary hover:underline text-left">{student.name}</button>
                    <span className="text-[10px] text-muted-foreground font-bold">RA: {student.ra}-{student.raDigit}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground block uppercase">Turma</span>
                  <span className="text-sm font-medium">{student.class}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground block uppercase">Matrículas</span>
                  <Badge variant="secondary" className="text-[9px]">{student.enrollments?.length || 0} Disc.</Badge>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground block uppercase">Média Bloom</span>
                  <Badge variant="outline" className="text-[9px]">{BLOOM_LEVELS.find(l => l.value === student.bloomLevel)?.label || student.bloomLevel}</Badge>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { 
                    setSelectedStudent(student); 
                    setFormData({
                      callNumber: student.callNumber,
                      name: student.name,
                      ra: student.ra,
                      raDigit: student.raDigit,
                      class: student.class,
                      classId: student.classId,
                      bloomLevel: student.bloomLevel,
                      status: student.status,
                      enrollments: student.enrollments || []
                    });
                    setCapturedPhoto(student.photo);
                    setIsEditing(true);
                    setIsRegisterOpen(true);
                  }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedStudent(student); setIsFichaOpen(true); }}><Eye className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cadastro/Edição Dialog */}
      <Dialog open={isRegisterOpen} onOpenChange={(open) => { setIsRegisterOpen(open); if (!open) stopCamera(); }}>
        <DialogContent className="max-w-3xl w-[95vw] h-[90vh] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 border-b shrink-0">
            <DialogTitle>{isEditing ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}</DialogTitle>
            <DialogDescription>Dados básicos, foto e enturmação por disciplina.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-8 space-y-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative h-44 w-44 rounded-2xl bg-muted border-2 border-dashed flex items-center justify-center overflow-hidden shadow-inner">
                    {capturedPhoto ? (
                      <img src={capturedPhoto} alt="Preview" className="h-full w-full object-cover" />
                    ) : isCameraActive ? (
                      <video ref={videoRef} autoPlay muted className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-14 w-14 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isCameraActive ? (
                      <Button type="button" size="sm" onClick={capturePhoto} className="gap-2">
                        <Check className="h-4 w-4" /> Capturar
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" size="sm" onClick={startCamera} className="gap-2">
                        <Camera className="h-4 w-4" /> Câmera
                      </Button>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                      <Upload className="h-4 w-4" /> Arquivo
                    </Button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Nome Completo</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>RA</Label>
                    <Input value={formData.ra} onChange={(e) => setFormData({...formData, ra: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Dígito</Label>
                    <Input value={formData.raDigit} onChange={(e) => setFormData({...formData, raDigit: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Turma Principal</Label>
                    <Select value={formData.classId} onValueChange={(v) => {
                      const cls = ["9º Ano A", "9º Ano B", "8º Ano A"][parseInt(v)-1]
                      setFormData({...formData, classId: v, class: cls})
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">9º Ano A</SelectItem>
                        <SelectItem value="2">9º Ano B</SelectItem>
                        <SelectItem value="3">8º Ano A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nº Chamada</Label>
                    <Input type="number" value={formData.callNumber} onChange={(e) => setFormData({...formData, callNumber: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> Matrícula em Disciplinas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
                  {MOCK_DISCIPLINES.map((discipline) => (
                    <label key={discipline.id} className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      formData.enrollments.includes(discipline.id) ? "bg-primary/5 border-primary/20" : "hover:bg-muted/5"
                    )}>
                      <Checkbox 
                        checked={formData.enrollments.includes(discipline.id)} 
                        onCheckedChange={() => toggleEnrollmentInForm(discipline.id)} 
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{discipline.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{discipline.schedule}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 bg-slate-50 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancelar</Button>
            <Button onClick={handleRegisterSubmit} className="px-8 shadow-lg font-bold">
              <Save className="h-4 w-4 mr-2" /> {isEditing ? 'Salvar Alterações' : 'Finalizar Cadastro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ficha do Aluno Dialog */}
      <Dialog open={isFichaOpen} onOpenChange={setIsFichaOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-white shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center text-4xl font-black shadow-lg">
                  {selectedStudent?.photo ? (
                    <img src={selectedStudent.photo} alt={selectedStudent.name} className="h-full w-full object-cover" />
                  ) : selectedStudent?.name.charAt(0)}
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black uppercase tracking-tight">{selectedStudent?.name}</DialogTitle>
                  <div className="flex items-center gap-4 text-primary-foreground/80 text-sm mt-1">
                    <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {selectedStudent?.class}</span>
                    <span className="flex items-center gap-1.5 font-mono uppercase font-bold">RA: {selectedStudent?.ra}-{selectedStudent?.raDigit}</span>
                    <Badge variant="outline" className="border-white/40 text-white bg-white/10 uppercase font-black text-[10px]">
                      {selectedStudent?.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="bg-white/10 border-white/40 hover:bg-white/20 text-white font-bold gap-2" onClick={() => setIsOccurrenceOpen(true)}>
                <AlertCircle className="h-4 w-4" /> Registrar Intervenção
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="enrollment" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="px-8 bg-muted/20 border-b h-14 w-full justify-start gap-8 rounded-none bg-transparent shrink-0">
              <TabsTrigger value="enrollment" className="font-bold data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full uppercase text-xs tracking-widest">Matrículas</TabsTrigger>
              <TabsTrigger value="history" className="font-bold data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full uppercase text-xs tracking-widest">Histórico & Ocorrências</TabsTrigger>
              <TabsTrigger value="ai" className="font-bold data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full uppercase text-xs tracking-widest text-accent data-[state=active]:text-accent">IA Insights</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <div className="p-8">
                <TabsContent value="enrollment" className="m-0 space-y-6">
                  <div className="flex flex-col gap-1 mb-6">
                    <h4 className="text-lg font-bold flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /> Gestão de Matrículas</h4>
                    <p className="text-sm text-muted-foreground">Disciplinas associadas às atividades de recomposição.</p>
                  </div>
                  <div className="grid gap-3">
                    {MOCK_DISCIPLINES.map((discipline) => {
                      const isEnrolled = selectedStudent?.enrollments?.includes(discipline.id);
                      return (
                        <div key={discipline.id} className={cn(
                          "p-4 rounded-xl border flex items-center justify-between transition-all group hover:border-primary/30 shadow-sm",
                          isEnrolled ? "bg-primary/5 border-primary/20" : "bg-white border-border"
                        )}>
                          <div className="flex items-center gap-4">
                            <Checkbox checked={isEnrolled} onCheckedChange={() => toggleEnrollmentInProfile(discipline.id)} className="h-5 w-5" />
                            <div className="flex flex-col">
                              <span className="font-bold text-sm group-hover:text-primary transition-colors">{discipline.name}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-tighter">
                                <Clock className="h-3.5 w-3.5" /> {discipline.schedule} • {discipline.class}
                              </span>
                            </div>
                          </div>
                          {isEnrolled && <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold">Matriculado</Badge>}
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="history" className="m-0 space-y-8">
                  <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> Ocorrências Registradas
                      </h4>
                      <div className="space-y-3">
                        {selectedStudent?.history?.occurrences.map((occ: any) => (
                          <div key={occ.id} className="p-4 rounded-lg bg-red-50/50 border border-red-100 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-red-500 font-bold h-5 uppercase text-[9px]">{occ.type}</Badge>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">{occ.date}</span>
                            </div>
                            <p className="text-xs text-red-900/80 leading-relaxed font-medium">{occ.description}</p>
                          </div>
                        ))}
                        {selectedStudent?.history?.occurrences.length === 0 && <p className="text-xs italic text-muted-foreground text-center py-10">Nenhuma ocorrência registrada.</p>}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4" /> Últimas Avaliações Bloom
                      </h4>
                      <div className="space-y-3">
                        {selectedStudent?.history?.assessments.map((ass: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-lg border bg-white shadow-sm flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-primary">{ass.subject} - {ass.competency}</span>
                              <Badge variant="outline" className="font-black h-5 border-primary/20 text-primary">{ass.score} pts</Badge>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold">
                              <span className="flex items-center gap-1"><BrainCircuit className="h-3 w-3" /> Nível: {ass.level}</span>
                              <span>{ass.date}</span>
                            </div>
                          </div>
                        ))}
                        {selectedStudent?.history?.assessments.length === 0 && <p className="text-xs italic text-muted-foreground text-center py-10">Sem avaliações registradas.</p>}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ai" className="m-0 space-y-6">
                  <Card className="border-none shadow-xl bg-accent/5 border-l-4 border-l-accent overflow-hidden">
                    <CardHeader className="pb-4 bg-white/50 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center shadow-inner">
                            <Sparkles className="h-6 w-6 text-accent" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-black">Inteligência Pedagógica</CardTitle>
                            <CardDescription>Sugestões personalizadas para o desenvolvimento</CardDescription>
                          </div>
                        </div>
                        <Button variant="accent" className="gap-2 font-bold shadow-lg" onClick={generateAiInsight} disabled={isAiLoading}>
                          {isAiLoading ? <Plus className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          {isAiLoading ? "Analisando..." : "Gerar Insights"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      {aiInsight ? (
                        <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
                          <div className="p-6 rounded-2xl bg-white border shadow-sm italic text-sm text-foreground/80 leading-relaxed border-l-4 border-l-primary">
                            "{aiInsight.progressSummary}"
                          </div>
                          <div className="grid md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                              <h5 className="text-xs font-black uppercase text-green-600 flex items-center gap-2 tracking-widest">
                                <Check className="h-4 w-4" /> Pontos Fortes
                              </h5>
                              <ul className="space-y-3">
                                {aiInsight.strengths.map((s, i) => (
                                  <li key={i} className="text-xs flex gap-3 items-start font-medium">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1 shrink-0" /> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-4">
                              <h5 className="text-xs font-black uppercase text-accent flex items-center gap-2 tracking-widest">
                                <AlertCircle className="h-4 w-4" /> Intervenções Recomendadas
                              </h5>
                              <ul className="space-y-3">
                                {aiInsight.learningSuggestions.map((s, i) => (
                                  <li key={i} className="text-xs flex gap-3 items-start font-medium">
                                    <span className="h-1.5 w-1.5 rounded-full bg-accent mt-1 shrink-0" /> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-3">
                          <BrainCircuit className="h-12 w-12 opacity-10" />
                          <p className="text-sm font-bold opacity-60">Utilize a IA para analisar o desempenho deste aluno.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Ocorrência Dialog */}
      <Dialog open={isOccurrenceOpen} onOpenChange={setIsOccurrenceOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Registrar Intervenção</DialogTitle>
            <DialogDescription>Situação observada para {selectedStudent?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold">Tipo de Registro</Label>
              <Select value={occurrenceData.type} onValueChange={(v) => setOccurrenceData({...occurrenceData, type: v})}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pedagógica">Pedagógica</SelectItem>
                  <SelectItem value="Comportamental">Comportamental</SelectItem>
                  <SelectItem value="Recomposição">Recomposição</SelectItem>
                  <SelectItem value="Elogio">Elogio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Descrição Detalhada</Label>
              <Textarea 
                placeholder="Ex: O aluno apresentou dificuldades na interpretação de charges..." 
                className="min-h-[140px] text-sm"
                value={occurrenceData.description}
                onChange={(e) => setOccurrenceData({...occurrenceData, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOccurrenceOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddOccurrence} className="font-bold">Salvar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2 font-bold"><Clock className="h-5 w-5 animate-spin" /> Carregando gestão de alunos...</div>}>
      <StudentsContent />
    </Suspense>
  )
}
