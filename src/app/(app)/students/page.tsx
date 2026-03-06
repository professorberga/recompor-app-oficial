
"use client"

import { useState, useRef } from "react"
import { Search, UserPlus, Filter, MoreHorizontal, Eye, BrainCircuit, FileText, Sparkles, Camera, RotateCcw, Check, Trash2, Pencil, AlertCircle, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { personalizedLearningSuggestions, PersonalizedLearningSuggestionsOutput } from "@/ai/flows/personalized-learning-suggestions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"

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
  
  // Dialog visibility states
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isOccurrenceOpen, setIsOccurrenceOpen] = useState(false)
  const [isFichaOpen, setIsFichaOpen] = useState(false)
  
  const [occurrenceText, setOccurrenceText] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  // Camera state
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
      setIsCameraActive(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Câmera Indisponível',
        description: 'Não foi possível acessar sua câmera.',
      })
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
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
        const targetHeight = video.videoHeight
        const targetWidth = targetHeight * 0.75
        const startX = (video.videoWidth - targetWidth) / 2
        canvas.width = targetWidth
        canvas.height = targetHeight
        context.drawImage(video, startX, 0, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight)
        setCapturedPhoto(canvas.toDataURL('image/jpeg'))
        stopCamera()
      }
    }
  }

  const openCreateDialog = () => {
    setIsEditing(false)
    setSelectedStudent(null)
    resetFormFields()
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

  const openOccurrenceDialog = (student: any) => {
    setSelectedStudent(student)
    setOccurrenceText("")
    setIsOccurrenceOpen(true)
  }

  const openFichaDialog = (student: any) => {
    setSelectedStudent(student)
    setAiInsight(null)
    setIsFichaOpen(true)
  }

  const resetFormFields = () => {
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
    stopCamera()
  }

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.ra || !formData.class) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" })
      return
    }

    if (isEditing && selectedStudent) {
      setStudents(students.map(s => s.id === selectedStudent.id ? { ...s, ...formData, photo: capturedPhoto } : s))
      toast({ title: "Atualizado", description: "Dados atualizados com sucesso." })
    } else {
      const newStudent = { id: Date.now().toString(), ...formData, photo: capturedPhoto, trend: 'stable' }
      setStudents([newStudent as any, ...students])
      toast({ title: "Cadastrado", description: "Aluno registrado com sucesso." })
    }
    setIsRegisterOpen(false)
  }

  const generateAiInsight = async () => {
    if (!selectedStudent) return
    setIsAiLoading(true)
    try {
      const result = await personalizedLearningSuggestions({
        studentName: selectedStudent.name,
        assessmentData: [{ competency: 'Geral', skill: 'Progresso', score: 80 }],
        observationalNotes: ['Aluno em evolução constante.']
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
          <p className="text-muted-foreground mt-1">Acompanhe perfis individuais e histórico de aprendizagem.</p>
        </div>
        <Button className="gap-2 shadow-lg" onClick={openCreateDialog}>
          <UserPlus className="h-4 w-4" /> Cadastrar Aluno
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou turma..." className="pl-10 bg-muted/20 border-none" />
        </div>
        <Button variant="outline" className="gap-2"><Filter className="h-4 w-4" /> Filtros</Button>
      </div>

      <div className="grid gap-4">
        {students.map((student) => (
          <Card key={student.id} className={`border-none shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden group ${student.status === 'Transferido' ? 'opacity-75 grayscale-[0.3]' : ''}`}>
            <CardContent className="p-0 flex items-center h-20">
              <div className={`w-1 h-full ${student.status === 'Ativo' ? 'bg-primary' : 'bg-muted-foreground'} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="px-6 flex-1 grid grid-cols-5 items-center gap-4">
                <div className="flex items-center gap-3 col-span-1 overflow-hidden">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-primary overflow-hidden border border-border shrink-0">
                    {student.photo ? <img src={student.photo} alt="" className="w-full h-full object-cover" /> : student.name.charAt(0)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm truncate">{student.name}</span>
                    <span className="text-[10px] text-muted-foreground">Chamada: {student.callNumber}</span>
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
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Nível Bloom</span>
                  <Badge variant="secondary" className="text-[9px] h-5">{student.bloomLevel}</Badge>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => openFichaDialog(student)}>
                    <Eye className="h-3.5 w-3.5" /> Ficha
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openEditDialog(student); }}>
                        <Pencil className="h-4 w-4 mr-2" /> Editar Aluno
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openOccurrenceDialog(student); }}>
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
      </div>

      {/* --- ALL DIALOGS MOVED OUTSIDE THE LOOP --- */}

      {/* Cadastro/Edição Dialog */}
      <Dialog open={isRegisterOpen} onOpenChange={(open) => { setIsRegisterOpen(open); if (!open) stopCamera(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-primary text-primary-foreground shrink-0 relative">
            <DialogTitle className="text-2xl">{isEditing ? 'Editar Aluno' : 'Novo Cadastro'}</DialogTitle>
            <DialogDescription className="text-primary-foreground/80">Informações oficiais do estudante.</DialogDescription>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4 text-white hover:bg-white/10" onClick={() => setIsRegisterOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>
          <form onSubmit={handleRegisterSubmit} className="flex-1 overflow-hidden flex flex-col bg-white">
            <ScrollArea className="flex-1 p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-4 flex flex-col items-center gap-4">
                  <div className="relative w-full aspect-[3/4] rounded-lg bg-muted border-2 border-dashed border-muted-foreground/20 flex items-center justify-center overflow-hidden shadow-inner">
                    {capturedPhoto ? (
                      <>
                        <img src={capturedPhoto} alt="Preview" className="w-full h-full object-cover" />
                        <Button type="button" size="sm" variant="secondary" className="absolute bottom-2" onClick={() => { setCapturedPhoto(null); startCamera(); }}>
                          <RotateCcw className="h-4 w-4 mr-2" /> Refazer
                        </Button>
                      </>
                    ) : isCameraActive ? (
                      <>
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                        <Button type="button" className="absolute bottom-4 rounded-full w-12 h-12 bg-red-600 border-4 border-white" onClick={capturePhoto} />
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-4 text-center">
                        <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                        <Button type="button" variant="outline" size="sm" onClick={startCamera}>Ativar Câmera</Button>
                      </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                </div>
                <div className="md:col-span-8 space-y-4">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3 space-y-2">
                      <Label>Nº Chamada</Label>
                      <Input placeholder="00" value={formData.callNumber} onChange={(e) => setFormData({...formData, callNumber: e.target.value})} />
                    </div>
                    <div className="col-span-9 space-y-2">
                      <Label>Nome Completo</Label>
                      <Input placeholder="Nome do aluno" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Registro (RA)</Label>
                      <div className="flex gap-2">
                        <Input placeholder="RA" value={formData.ra} onChange={(e) => setFormData({...formData, ra: e.target.value})} />
                        <Input className="w-16 text-center" placeholder="D" maxLength={1} value={formData.raDigit} onChange={(e) => setFormData({...formData, raDigit: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Turma</Label>
                      <Select value={formData.class} onValueChange={(v) => setFormData({...formData, class: v})}>
                        <SelectTrigger><SelectValue placeholder="Turma" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="9º Ano A">9º Ano A</SelectItem>
                          <SelectItem value="9º Ano B">9º Ano B</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Professor Tutor</Label>
                      <Input placeholder="Nome do tutor" value={formData.tutor} onChange={(e) => setFormData({...formData, tutor: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Situação</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                        <SelectTrigger><SelectValue placeholder="Situação" /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nível de Bloom</Label>
                    <Select value={formData.bloomLevel} onValueChange={(v) => setFormData({...formData, bloomLevel: v})}>
                      <SelectTrigger><SelectValue placeholder="Nível" /></SelectTrigger>
                      <SelectContent>
                        {BLOOM_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
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

      {/* Ocorrência Dialog */}
      <Dialog open={isOccurrenceOpen} onOpenChange={setIsOccurrenceOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" /> Lançar Ocorrência
            </DialogTitle>
            <DialogDescription>Registrar evento para {selectedStudent?.name}.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Textarea placeholder="Descreva a situação..." className="min-h-[120px]" value={occurrenceText} onChange={(e) => setOccurrenceText(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOccurrenceOpen(false)}>Cancelar</Button>
            <Button className="bg-amber-600" onClick={() => { toast({title: "Registrado"}); setIsOccurrenceOpen(false); }}>Salvar Ocorrência</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ficha Dialog */}
      <Dialog open={isFichaOpen} onOpenChange={setIsFichaOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center border border-white/30 overflow-hidden shrink-0">
                {selectedStudent?.photo ? <img src={selectedStudent.photo} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold">{selectedStudent?.name.charAt(0)}</span>}
              </div>
              <div>
                <DialogTitle className="text-2xl">{selectedStudent?.name}</DialogTitle>
                <DialogDescription className="text-primary-foreground/80">RA: {selectedStudent?.ra} • {selectedStudent?.class}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">Média Bloom</span>
                  <p className="text-xl font-bold text-primary">{selectedStudent?.bloomLevel}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">Status</span>
                  <p className="text-xl font-bold text-primary">{selectedStudent?.status}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">Tutor</span>
                  <p className="text-sm font-bold text-primary truncate">{selectedStudent?.tutor || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-accent" /> Insights da IA</h4>
                  <Button size="sm" className="bg-accent text-accent-foreground gap-2" onClick={generateAiInsight} disabled={isAiLoading}>
                    <Sparkles className="h-4 w-4" /> {isAiLoading ? "Analisando..." : "Gerar"}
                  </Button>
                </div>

                {aiInsight ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 rounded-lg border-accent/20 bg-accent/5 text-sm">{aiInsight.progressSummary}</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="font-bold text-green-600">Fortalezas:</span>
                        <ul className="list-disc list-inside">{aiInsight.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-amber-600">Melhorias:</span>
                        <ul className="list-disc list-inside">{aiInsight.areasForImprovement.map((a, i) => <li key={i}>{a}</li>)}</ul>
                      </div>
                    </div>
                  </div>
                ) : !isAiLoading && (
                  <div className="py-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                    <Sparkles className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">Gere um relatório pedagógico com inteligência artificial.</p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          <div className="p-4 border-t bg-muted/20 flex justify-end">
            <Button onClick={() => setIsFichaOpen(false)}>Fechar Ficha</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
