
"use client"

import { useState, useRef, useEffect, Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { 
  Search, UserPlus, Eye, 
  Camera, Check, Trash2, Pencil, 
  Calendar, ClipboardCheck, GraduationCap, Info,
  Upload, ImageIcon, BookOpen, Clock, Save, X, RotateCcw, Loader2
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
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase/provider"
import { collection, doc, setDoc, query, where } from "firebase/firestore"

function StudentsContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user } = useUser()
  const firestore = useFirestore()
  
  const classFilter = searchParams.get('class')
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isFichaOpen, setIsFichaOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Real Firestore Data
  const classesRef = useMemoFirebase(() => 
    user ? collection(firestore, 'teachers', user.uid, 'classes') : null,
    [user, firestore]
  )
  const { data: classes = [] } = useCollection(classesRef)

  const studentsRef = useMemoFirebase(() => {
    if (!user || !classFilter) return null;
    return collection(firestore, 'teachers', user.uid, 'classes', classFilter, 'students');
  }, [user, classFilter, firestore]);

  const { data: students = [], isLoading } = useCollection(studentsRef)

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
    classId: classFilter || "",
    status: "Ativo" as 'Ativo' | 'Inativo',
    enrollments: [] as string[]
  })

  useEffect(() => {
    if (classFilter) setFormData(prev => ({ ...prev, classId: classFilter }));
  }, [classFilter]);

  const filteredStudents = useMemo(() => {
    return (students || []).filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           student.ra.includes(searchTerm)
      return matchesSearch
    })
  }, [students, searchTerm])

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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.classId) return
    
    if (!formData.name || !formData.ra) {
      toast({ title: "Erro", description: "Nome e RA são obrigatórios.", variant: "destructive" })
      return
    }

    const studentId = isEditing && selectedStudent ? selectedStudent.id : Math.random().toString(36).substr(2, 9)
    const targetRef = doc(firestore, 'teachers', user.uid, 'classes', formData.classId, 'students', studentId)

    const studentData = {
      ...formData,
      id: studentId,
      photo: capturedPhoto,
      teacherId: user.uid,
      class: classes.find(c => c.id === formData.classId)?.name || "N/A",
      enrollmentDate: new Date().toISOString(),
      history: isEditing && selectedStudent ? selectedStudent.history : { attendance: [], assessments: [], occurrences: [], observations: [] }
    }

    try {
      await setDoc(targetRef, studentData)
      setIsRegisterOpen(false)
      stopCamera()
      toast({ title: "Sucesso", description: isEditing ? "Cadastro atualizado." : "Aluno cadastrado." })
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao salvar no banco de dados.", variant: "destructive" })
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Gestão de Alunos</h2>
        {classFilter ? (
          <Button onClick={() => { setIsEditing(false); setCapturedPhoto(null); setIsRegisterOpen(true); }}>
            <UserPlus className="h-4 w-4 mr-2" /> Cadastrar Aluno
          </Button>
        ) : (
          <Badge variant="outline" className="p-2">Selecione uma turma na aba "Turmas" para gerenciar alunos</Badge>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou RA..." className="pl-10 h-11 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {student.photo ? (
                    <img src={student.photo} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {student.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <button onClick={() => { setSelectedStudent(student); setIsFichaOpen(true); }} className="font-bold text-sm hover:underline">{student.name}</button>
                    <span className="text-[10px] text-muted-foreground font-bold">RA: {student.ra}-{student.raDigit} • {student.class}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { 
                    setSelectedStudent(student); 
                    setFormData({ ...student });
                    setCapturedPhoto(student.photo);
                    setIsEditing(true);
                    setIsRegisterOpen(true);
                  }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedStudent(student); setIsFichaOpen(true); }}><Eye className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredStudents.length === 0 && (
            <div className="py-20 text-center opacity-30">
              <GraduationCap className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Nenhum aluno encontrado.</p>
              {!classFilter && <p className="text-sm">Selecione uma turma para carregar os alunos.</p>}
            </div>
          )}
        </div>
      )}

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
                  <div className="space-y-2"><Label>Turma</Label>
                    <Select value={formData.classId} onValueChange={(v) => setFormData({...formData, classId: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Chamada</Label><Input type="number" value={formData.callNumber} onChange={(e) => setFormData({...formData, callNumber: e.target.value})} /></div>
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
                <h4 className="font-bold flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Dados Cadastrais</h4>
                <div className="grid gap-2 border p-4 rounded-lg bg-slate-50">
                   <p className="text-sm"><strong>Status:</strong> {selectedStudent?.status}</p>
                   <p className="text-sm"><strong>Turma:</strong> {selectedStudent?.class}</p>
                   <p className="text-sm"><strong>Número:</strong> {selectedStudent?.callNumber}</p>
                </div>
              </TabsContent>
              <TabsContent value="history" className="m-0 space-y-4">
                <div className="py-10 text-center text-muted-foreground italic">Histórico acadêmico em desenvolvimento.</div>
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
