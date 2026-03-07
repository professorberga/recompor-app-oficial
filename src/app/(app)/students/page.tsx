
"use client"

import { useState, useRef, useEffect, Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { 
  Search, UserPlus, Eye, 
  Camera, Check, Trash2, Pencil, 
  Calendar, ClipboardCheck, GraduationCap, Info,
  Upload, ImageIcon, BookOpen, Clock, Save, X, RotateCcw
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Student, Discipline, BloomLevel } from "@/lib/types"

const MOCK_DISCIPLINES: Discipline[] = [
  { id: 'd1', name: 'Língua Portuguesa', classId: '1', teacherId: 'prof-1', schedule: '07:00 às 07:50' },
  { id: 'd2', name: 'Matemática', classId: '1', teacherId: 'prof-1', schedule: '07:50 às 08:40' },
]

const MOCK_INITIAL_STUDENTS: Student[] = [
  { 
    id: '1', 
    name: 'Ana Beatriz Silva', 
    class: '9º Ano A', 
    classId: '1',
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
]

function StudentsContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [students, setStudents] = useState<Student[]>(MOCK_INITIAL_STUDENTS)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isFichaOpen, setIsFichaOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
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
    status: "Ativo" as 'Ativo' | 'Inativo',
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
      }
    } catch (err) {
      toast({ title: "Erro na Câmera", description: "Verifique permissões.", variant: "destructive" })
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

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.ra) {
      toast({ title: "Erro", description: "Nome e RA obrigatórios.", variant: "destructive" })
      return
    }

    if (isEditing && selectedStudent) {
      const updated: Student = { ...selectedStudent, ...formData, photo: capturedPhoto };
      setStudents(students.map(s => s.id === selectedStudent.id ? updated : s))
      toast({ title: "Sucesso", description: "Cadastro atualizado." })
    } else {
      const newStudent: Student = { 
        id: Date.now().toString(), 
        ...formData, 
        photo: capturedPhoto, 
        history: { attendance: [], assessments: [], occurrences: [], observations: [] }
      }
      setStudents([newStudent, ...students])
      toast({ title: "Sucesso", description: "Aluno cadastrado." })
    }
    setIsRegisterOpen(false)
    stopCamera()
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Gestão de Alunos</h2>
        <Button onClick={() => { setIsEditing(false); setFormData({ callNumber: "", name: "", ra: "", raDigit: "", class: "9º Ano A", classId: "1", status: "Ativo", enrollments: [] }); setCapturedPhoto(null); setIsRegisterOpen(true); }}>
          <UserPlus className="h-4 w-4 mr-2" /> Cadastrar Aluno
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou RA..." className="pl-10 h-11 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="grid gap-4">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {student.photo ? <img src={student.photo} className="h-10 w-10 rounded-full object-cover" /> : <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{student.name.charAt(0)}</div>}
                <div className="flex flex-col">
                  <button onClick={() => { setSelectedStudent(student); setIsFichaOpen(true); }} className="font-bold text-sm hover:underline">{student.name}</button>
                  <span className="text-[10px] text-muted-foreground font-bold">RA: {student.ra}-{student.raDigit} • {student.class}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => { 
                  setSelectedStudent(student); 
                  setFormData({ callNumber: student.callNumber, name: student.name, ra: student.ra, raDigit: student.raDigit, class: student.class, classId: student.classId, status: student.status, enrollments: student.enrollments });
                  setCapturedPhoto(student.photo);
                  setIsEditing(true);
                  setIsRegisterOpen(true);
                }}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setSelectedStudent(student); setIsFichaOpen(true); }}><Eye className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isRegisterOpen} onOpenChange={(open) => { if (!open) stopCamera(); setIsRegisterOpen(open); }}>
        <DialogContent className="max-w-3xl w-[95vw] h-[90vh] flex flex-col p-0 bg-white">
          <DialogHeader className="p-6 border-b shrink-0"><DialogTitle>{isEditing ? 'Editar' : 'Novo'} Aluno</DialogTitle></DialogHeader>
          <ScrollArea className="flex-1">
            <div className="p-8 space-y-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-4 shrink-0">
                  <div className="h-40 w-40 rounded-2xl bg-muted border-2 border-dashed flex items-center justify-center overflow-hidden">
                    {capturedPhoto ? <img src={capturedPhoto} className="h-full w-full object-cover" /> : isCameraActive ? <video ref={videoRef} autoPlay muted className="h-full w-full object-cover" /> : <ImageIcon className="h-12 w-12 text-muted-foreground" />}
                  </div>
                  <div className="flex gap-2">
                    {isCameraActive ? <Button size="sm" onClick={capturePhoto}><Check className="h-4 w-4 mr-2" /> Capturar</Button> : <Button variant="outline" size="sm" onClick={startCamera}><Camera className="h-4 w-4 mr-2" /> Câmera</Button>}
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-2" /> Upload</Button>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="col-span-2 space-y-2"><Label>Nome Completo</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                  <div className="space-y-2"><Label>RA</Label><Input value={formData.ra} onChange={(e) => setFormData({...formData, ra: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Dígito</Label><Input value={formData.raDigit} onChange={(e) => setFormData({...formData, raDigit: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Turma</Label><Select value={formData.classId} onValueChange={(v) => setFormData({...formData, classId: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">9º Ano A</SelectItem><SelectItem value="2">9º Ano B</SelectItem><SelectItem value="3">8º Ano A</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Chamada</Label><Input type="number" value={formData.callNumber} onChange={(e) => setFormData({...formData, callNumber: e.target.value})} /></div>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t">
                <Label className="font-bold">Matrícula em Disciplinas</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-10">
                  {MOCK_DISCIPLINES.map((d) => (
                    <label key={d.id} className={cn("p-3 rounded-lg border flex items-center gap-3 cursor-pointer", formData.enrollments.includes(d.id) ? "bg-primary/5 border-primary/30" : "hover:bg-slate-50")}>
                      <Checkbox checked={formData.enrollments.includes(d.id)} onCheckedChange={(checked) => {
                        const newEnr = checked ? [...formData.enrollments, d.id] : formData.enrollments.filter(id => id !== d.id);
                        setFormData({...formData, enrollments: newEnr});
                      }} />
                      <div className="flex flex-col"><span className="text-sm font-bold">{d.name}</span><span className="text-[10px] text-muted-foreground">{d.schedule}</span></div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 border-t bg-slate-50 shrink-0"><Button variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancelar</Button><Button onClick={handleRegisterSubmit}>Salvar Aluno</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFichaOpen} onOpenChange={setIsFichaOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 bg-white shadow-2xl overflow-hidden">
          <DialogHeader className="p-6 bg-primary text-white shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">{selectedStudent?.photo ? <img src={selectedStudent.photo} className="h-full w-full object-cover" /> : selectedStudent?.name.charAt(0)}</div>
              <div><DialogTitle className="text-2xl font-bold">{selectedStudent?.name}</DialogTitle><DialogDescription className="text-sm opacity-80">RA: {selectedStudent?.ra}-{selectedStudent?.raDigit} • {selectedStudent?.class}</DialogDescription></div>
            </div>
          </DialogHeader>
          <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-transparent border-b px-6 h-12 justify-start gap-4 rounded-none"><TabsTrigger value="info">Matrícula</TabsTrigger><TabsTrigger value="history">Histórico</TabsTrigger></TabsList>
            <ScrollArea className="flex-1 p-6">
              <TabsContent value="info" className="m-0 space-y-4">
                <h4 className="font-bold flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Disciplinas Vinculadas</h4>
                <div className="grid gap-2">
                  {MOCK_DISCIPLINES.map(d => (
                    <div key={d.id} className={cn("p-4 rounded-lg border flex items-center justify-between", selectedStudent?.enrollments.includes(d.id) ? "bg-primary/5 border-primary/20" : "opacity-40")}>
                      <div className="flex flex-col"><span className="font-bold text-sm">{d.name}</span><span className="text-xs text-muted-foreground">{d.schedule}</span></div>
                      {selectedStudent?.enrollments.includes(d.id) && <Badge>Matriculado</Badge>}
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="history" className="m-0 space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label className="uppercase text-[10px] font-bold">Ocorrências</Label>
                    <div className="space-y-2">
                      {selectedStudent?.history.occurrences.map(o => (
                        <div key={o.id} className="p-3 rounded-lg border bg-red-50/20"><div className="flex justify-between mb-1"><Badge variant="destructive" className="h-4 text-[9px]">{o.type}</Badge><span className="text-[10px]">{o.date}</span></div><p className="text-xs">{o.description}</p></div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default function StudentsPage() {
  return <Suspense fallback={<div>Carregando...</div>}><StudentsContent /></Suspense>
}
