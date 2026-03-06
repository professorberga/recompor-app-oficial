
"use client"

import { useState, useRef, useEffect } from "react"
import { Search, UserPlus, Filter, MoreHorizontal, GraduationCap, Eye, BrainCircuit, FileText, Sparkles, Camera, RotateCcw, Check, Trash2, Pencil, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { personalizedLearningSuggestions, PersonalizedLearningSuggestionsOutput } from "@/ai/flows/personalized-learning-suggestions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  { id: '1', name: 'Ana Beatriz Silva', class: '9º Ano A', subject: 'Português', trend: 'up', bloomLevel: 'Apply', callNumber: '01', ra: '123456', raDigit: '7', tutor: 'Prof. Ricardo', status: 'Ativo' },
  { id: '2', name: 'Bruno Oliveira Souza', class: '9º Ano A', subject: 'Português', trend: 'stable', bloomLevel: 'Understand', callNumber: '05', ra: '234567', raDigit: '8', tutor: 'Prof. Ricardo', status: 'Ativo' },
  { id: '3', name: 'Carlos Eduardo Santos', class: '9º Ano A', subject: 'Português', trend: 'up', bloomLevel: 'Analyze', callNumber: '08', ra: '345678', raDigit: '9', tutor: 'Prof. Ricardo', status: 'Ativo' },
  { id: '4', name: 'Daniela Lima Ferreira', class: '9º Ano B', subject: 'Português', trend: 'down', bloomLevel: 'Remember', callNumber: '12', ra: '456789', raDigit: '0', tutor: 'Profa. Marina', status: 'Transferido' },
  { id: '5', name: 'Eduardo Pereira Costa', class: '9º Ano B', subject: 'Português', trend: 'up', bloomLevel: 'Create', callNumber: '15', ra: '567890', raDigit: '1', tutor: 'Profa. Marina', status: 'Ativo' },
]

export default function StudentsPage() {
  const [students, setStudents] = useState(MOCK_INITIAL_STUDENTS)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [aiInsight, setAiInsight] = useState<PersonalizedLearningSuggestionsOutput | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
  
  // Dialog controls
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isOccurrenceOpen, setIsOccurrenceOpen] = useState(false)
  const [isFichaOpen, setIsFichaOpen] = useState(false)
  
  const [occurrenceText, setOccurrenceText] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { toast } = useToast()

  // Camera state
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Form state
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setHasCameraPermission(true)
      setIsCameraActive(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setHasCameraPermission(false)
      toast({
        variant: 'destructive',
        title: 'Acesso à Câmera Negado',
        description: 'Por favor, habilite as permissões de câmera no seu navegador.',
      })
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const tracks = stream.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        const videoWidth = video.videoWidth
        const videoHeight = video.videoHeight
        
        const targetHeight = videoHeight
        const targetWidth = targetHeight * 0.75
        const startX = (videoWidth - targetWidth) / 2

        canvas.width = targetWidth
        canvas.height = targetHeight
        
        context.drawImage(video, startX, 0, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight)
        const dataUrl = canvas.toDataURL('image/jpeg')
        setCapturedPhoto(dataUrl)
        stopCamera()
      }
    }
  }

  const handleEditClick = (student: any) => {
    setIsEditing(true)
    setEditingId(student.id)
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

  const handleOccurrenceClick = (student: any) => {
    setSelectedStudent(student)
    setOccurrenceText("")
    setIsOccurrenceOpen(true)
  }

  const handleFichaClick = (student: any) => {
    setSelectedStudent(student)
    setAiInsight(null)
    setIsFichaOpen(true)
  }

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.ra || !formData.class) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos o nome, RA e turma.",
        variant: "destructive"
      })
      return
    }

    if (isEditing && editingId) {
      setStudents(students.map(s => s.id === editingId ? { ...s, ...formData, photo: capturedPhoto } : s))
      toast({
        title: "Atualizado!",
        description: `Os dados de ${formData.name} foram atualizados.`,
      })
    } else {
      const newStudent = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        subject: 'Geral',
        trend: 'stable',
        photo: capturedPhoto
      }
      setStudents([newStudent as any, ...students])
      toast({
        title: "Sucesso!",
        description: `${formData.name} foi cadastrado com sucesso.`,
      })
    }

    setIsRegisterOpen(false)
    resetForm()
  }

  const handleOccurrenceSubmit = () => {
    if (!occurrenceText.trim()) {
      toast({ title: "Erro", description: "O texto da ocorrência não pode estar vazio.", variant: "destructive" })
      return
    }

    toast({
      title: "Ocorrência Lançada",
      description: `A ocorrência para ${selectedStudent?.name} foi registrada com sucesso no diário.`,
    })
    setIsOccurrenceOpen(false)
  }

  const resetForm = () => {
    setFormData({
      callNumber: "",
      name: "",
      ra: "",
      raDigit: "",
      class: "",
      tutor: "",
      bloomLevel: "Remember",
      status: "Ativo"
    })
    setCapturedPhoto(null)
    setIsEditing(false)
    setEditingId(null)
    stopCamera()
  }

  const generateAiInsight = async (student: any) => {
    if (!student) return
    setIsAiLoading(true)
    try {
      const result = await personalizedLearningSuggestions({
        studentName: student.name,
        assessmentData: [
          { competency: 'Interpretação de Texto', skill: 'Leitura Crítica', score: 85, notes: 'Demonstra boa compreensão mas falha em inferências complexas.' },
          { competency: 'Gramática', skill: 'Sintaxe', score: 70 },
        ],
        observationalNotes: [
          'Participativo em sala.',
          'Às vezes disperso em atividades em grupo.',
          'Melhorou significativamente na última redação.'
        ]
      })
      setAiInsight(result)
    } catch (error) {
      toast({ title: "Erro na IA", description: "Não foi possível gerar os insights agora.", variant: "destructive" })
    } finally {
      setIsAiLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Gestão de Alunos</h2>
          <p className="text-muted-foreground mt-1">Acompanhe perfis individuais e histórico de aprendizagem.</p>
        </div>
        
        <Dialog open={isRegisterOpen} onOpenChange={(open) => {
          setIsRegisterOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg">
              <UserPlus className="h-4 w-4" /> Cadastrar Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 bg-primary text-primary-foreground shrink-0">
              <DialogTitle className="text-2xl">{isEditing ? 'Editar Aluno' : 'Novo Cadastro de Aluno'}</DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                {isEditing ? 'Atualize as informações do estudante no sistema.' : 'Preencha as informações básicas para registrar o estudante no sistema.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleRegisterSubmit} className="flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 p-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-4 flex flex-col items-center gap-4">
                    <Label className="text-center w-full">Foto do Aluno (3:4)</Label>
                    <div className="relative w-full aspect-[3/4] rounded-lg bg-muted border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center overflow-hidden shadow-inner group">
                      {capturedPhoto ? (
                        <>
                          <img src={capturedPhoto} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button type="button" size="sm" variant="secondary" onClick={() => {
                              setCapturedPhoto(null)
                              startCamera()
                            }}>
                              <RotateCcw className="h-4 w-4 mr-2" /> Refazer
                            </Button>
                          </div>
                        </>
                      ) : isCameraActive ? (
                        <>
                          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                          <Button 
                            type="button" 
                            className="absolute bottom-4 rounded-full w-12 h-12 p-0 shadow-xl border-4 border-white"
                            onClick={capturePhoto}
                          >
                            <div className="w-8 h-8 rounded-full bg-red-600 animate-pulse" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-4 text-center">
                          <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground px-4">Posicione o aluno para o registro oficial</p>
                          <Button type="button" variant="outline" size="sm" onClick={startCamera}>
                            Ativar Câmera
                          </Button>
                        </div>
                      )}
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                  </div>

                  <div className="md:col-span-8 space-y-4">
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-3 space-y-2">
                        <Label htmlFor="callNumber">Nº Chamada</Label>
                        <Input id="callNumber" placeholder="00" value={formData.callNumber} onChange={(e) => setFormData({...formData, callNumber: e.target.value})} />
                      </div>
                      <div className="col-span-9 space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input id="name" placeholder="Nome do aluno" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ra">Registro do Aluno (RA)</Label>
                        <div className="flex gap-2">
                          <Input id="ra" placeholder="000.000.000" value={formData.ra} onChange={(e) => setFormData({...formData, ra: e.target.value})} />
                          <Input id="raDigit" className="w-16 text-center" placeholder="X" maxLength={1} value={formData.raDigit} onChange={(e) => setFormData({...formData, raDigit: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="class">Turma</Label>
                        <Select value={formData.class} onValueChange={(v) => setFormData({...formData, class: v})}>
                          <SelectTrigger id="class">
                            <SelectValue placeholder="Selecione a turma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="9º Ano A">9º Ano A</SelectItem>
                            <SelectItem value="9º Ano B">9º Ano B</SelectItem>
                            <SelectItem value="8º Ano A">8º Ano A</SelectItem>
                            <SelectItem value="8º Ano B">8º Ano B</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tutor">Professor Tutor</Label>
                        <Input id="tutor" placeholder="Nome do tutor" value={formData.tutor} onChange={(e) => setFormData({...formData, tutor: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Situação do Aluno</Label>
                        <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Situação" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bloom">Nível Inicial Bloom</Label>
                        <Select value={formData.bloomLevel} onValueChange={(v) => setFormData({...formData, bloomLevel: v})}>
                          <SelectTrigger id="bloom">
                            <SelectValue placeholder="Nível de Bloom" />
                          </SelectTrigger>
                          <SelectContent>
                            {BLOOM_LEVELS.map(level => (
                              <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              
              <DialogFooter className="p-6 bg-muted/20 border-t shrink-0">
                <Button type="button" variant="ghost" onClick={() => setIsRegisterOpen(false)}>Cancelar</Button>
                <Button type="submit" className="gap-2 bg-primary">
                  <Check className="h-4 w-4" /> {isEditing ? 'Salvar Alterações' : 'Concluir Cadastro'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ocorrência Dialog */}
      <Dialog open={isOccurrenceOpen} onOpenChange={setIsOccurrenceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Lançar Ocorrência
            </DialogTitle>
            <DialogDescription>
              Registre uma ocorrência pedagógica para {selectedStudent?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Descrição da Ocorrência</Label>
              <Textarea 
                placeholder="Descreva o comportamento ou situação observada..." 
                className="min-h-[150px]"
                value={occurrenceText}
                onChange={(e) => setOccurrenceText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOccurrenceOpen(false)}>Cancelar</Button>
            <Button onClick={handleOccurrenceSubmit} className="bg-amber-600 hover:bg-amber-700">Registrar no Diário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ficha do Aluno Dialog - Single Instance for better performance */}
      <Dialog open={isFichaOpen} onOpenChange={setIsFichaOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-primary text-primary-foreground shrink-0">
            <DialogTitle className="text-2xl flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-md overflow-hidden shrink-0">
                {selectedStudent?.photo ? (
                  <img src={selectedStudent.photo} alt={selectedStudent.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold">{selectedStudent?.name.charAt(0)}</span>
                )}
              </div>
              <span className="truncate">{selectedStudent?.name}</span>
              <Badge variant="outline" className="ml-2 bg-white/10 text-white border-white/20 shrink-0">{selectedStudent?.status}</Badge>
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80">
              RA: {selectedStudent?.ra}-{selectedStudent?.raDigit} • {selectedStudent?.class}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 p-6">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-muted/10 border-border/50">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Frequência</span>
                  <p className="text-2xl font-bold text-primary mt-1">94%</p>
                </Card>
                <Card className="p-4 bg-muted/10 border-border/50">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Média Bloom</span>
                  <p className="text-2xl font-bold text-primary mt-1">{selectedStudent?.bloomLevel}</p>
                </Card>
                <Card className="p-4 bg-muted/10 border-border/50">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Tutor</span>
                  <p className="text-sm font-bold text-primary mt-1 truncate">{selectedStudent?.tutor || 'Não definido'}</p>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-accent" />
                    Insights Inteligentes (IA)
                  </h4>
                  <Button 
                    size="sm" 
                    className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md gap-2"
                    onClick={() => generateAiInsight(selectedStudent)}
                    disabled={isAiLoading}
                  >
                    <Sparkles className="h-4 w-4" /> 
                    {isAiLoading ? "Analisando..." : "Gerar Relatório IA"}
                  </Button>
                </div>

                {aiInsight ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <Card className="p-4 border-accent/20 bg-accent/5">
                      <h5 className="font-bold text-sm mb-2 text-accent-foreground">Resumo de Progresso</h5>
                      <p className="text-sm leading-relaxed">{aiInsight.progressSummary}</p>
                    </Card>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="font-bold text-xs uppercase text-green-600">Pontos Fortes</h5>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {aiInsight.strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-bold text-xs uppercase text-amber-600">Áreas de Melhoria</h5>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {aiInsight.areasForImprovement.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <h5 className="font-bold text-sm mb-2 text-primary">Sugestões de Aprendizagem</h5>
                      <ul className="space-y-2">
                        {aiInsight.learningSuggestions.map((s, i) => (
                          <li key={i} className="text-sm flex gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : !isAiLoading && (
                  <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-xl border-muted">
                    <Sparkles className="h-8 w-8 text-muted mb-2" />
                    <p className="text-sm text-muted-foreground">Clique no botão acima para gerar uma análise profunda do estudante.</p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          <div className="p-4 border-t bg-muted/20 flex justify-end gap-2 shrink-0">
            <Button variant="outline" className="gap-2" onClick={() => setIsFichaOpen(false)}><FileText className="h-4 w-4" /> Fechar</Button>
            <Button className="bg-primary text-primary-foreground">Salvar Observações</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou turma..." className="pl-10 bg-muted/20 border-none" />
        </div>
        <Button variant="outline" className="gap-2"><Filter className="h-4 w-4" /> Filtros</Button>
      </div>

      <div className="grid gap-4">
        {students.map((student) => (
          <Card key={student.id} className={`border-none shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden group ${student.status === 'Transferido' ? 'opacity-75 grayscale-[0.5]' : ''}`}>
            <CardContent className="p-0 flex items-center h-20">
              <div className={`w-1.5 h-full ${student.status === 'Ativo' ? 'bg-primary' : 'bg-muted-foreground'} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="px-6 flex-1 grid grid-cols-5 items-center">
                <div className="flex items-center gap-3 col-span-1">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-primary overflow-hidden border border-border shrink-0">
                    {student.photo ? (
                      <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      student.name.charAt(0)
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm truncate">{student.name}</span>
                    <span className="text-[10px] text-muted-foreground">Chamada: {student.callNumber}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Turma</span>
                  <span className="text-sm font-medium">{student.class}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Situação</span>
                  <Badge variant={student.status === 'Ativo' ? 'secondary' : 'outline'} className={`w-fit text-[10px] h-5 ${student.status === 'Ativo' ? 'bg-green-100 text-green-700 border-green-200' : ''}`}>
                    {student.status}
                  </Badge>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Nível Bloom</span>
                  <Badge variant="secondary" className="w-fit text-[10px] h-5">{student.bloomLevel}</Badge>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleFichaClick(student)}>
                    <Eye className="h-4 w-4" /> Ficha
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-50">
                      <DropdownMenuItem onClick={() => handleEditClick(student)}>
                        <Pencil className="h-4 w-4 mr-2" /> Editar Aluno
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOccurrenceClick(student)}>
                        <AlertCircle className="h-4 w-4 mr-2" /> Lançar Ocorrência
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => {
                        setStudents(students.filter(s => s.id !== student.id))
                        toast({ title: "Removido", description: "Aluno removido da turma." })
                      }}>
                        <Trash2 className="h-4 w-4 mr-2" /> Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
