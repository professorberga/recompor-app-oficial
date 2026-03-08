
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
import { cn } from "@/lib/utils"
import { Student } from "@/lib/types"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase/provider"
import { collection, doc, setDoc, deleteDoc, query, where } from "firebase/firestore"

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
  
  // Turmas do professor para o Select
  const classesRef = useMemoFirebase(() => 
    user?.uid ? collection(firestore, 'teachers', user.uid, 'classes') : null,
    [user, firestore]
  )
  const { data: classes = [] } = useCollection(classesRef)

  // Estudantes na subcoleção direta do professor, filtrados por turma se houver filtro
  const studentsRef = useMemoFirebase(() => {
    if (!user?.uid) return null;
    const baseCol = collection(firestore, 'teachers', user.uid, 'students');
    if (classFilter) {
      return query(baseCol, where('classId', '==', classFilter));
    }
    return baseCol;
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
    status: "Ativo" as 'Ativo' | 'Inativo'
  })

  useEffect(() => {
    if (classFilter) setFormData(prev => ({ ...prev, classId: classFilter }));
  }, [classFilter]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (student.ra && student.ra.includes(searchTerm))
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
    if (!user?.uid || !formData.classId) {
       toast({ title: "Erro", description: "UID do professor ou Turma ausente.", variant: "destructive" });
       return;
    }
    
    if (!formData.name || !formData.ra) {
      toast({ title: "Campos Obrigatórios", description: "Nome e RA devem ser preenchidos.", variant: "destructive" })
      return
    }

    const studentId = isEditing && selectedStudent ? selectedStudent.id : Math.random().toString(36).substr(2, 9)
    // Salvando na nova hierarquia: /teachers/{uid}/students/{studentId}
    const targetRef = doc(firestore, 'teachers', user.uid, 'students', studentId)

    const studentData = {
      ...formData,
      id: studentId,
      photo: capturedPhoto,
      teacherId: user.uid,
      class: classes.find(c => c.id === formData.classId)?.name || "Turma",
      enrollmentDate: new Date().toISOString()
    }

    try {
      await setDoc(targetRef, studentData)
      setIsRegisterOpen(false)
      stopCamera()
      toast({ title: "Sucesso", description: isEditing ? "Cadastro atualizado." : "Aluno cadastrado com sucesso no Firestore." })
    } catch (err: any) {
      console.error("Erro ao cadastrar aluno:", err);
      toast({ title: "Falha ao Salvar (400)", description: "Verifique as regras de segurança ou o UID.", variant: "destructive" })
    }
  }

  const handleDelete = async (studentId: string) => {
    if (!user?.uid) return
    try {
      await deleteDoc(doc(firestore, 'teachers', user.uid, 'students', studentId))
      toast({ title: "Removido", description: "Aluno excluído do banco de dados." })
    } catch (err) {
      toast({ title: "Erro ao excluir", variant: "destructive" })
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Gestão de Alunos</h2>
          <p className="text-sm text-muted-foreground">Listagem real filtrada por professor (UID: {user?.uid?.substring(0,8)}...)</p>
        </div>
        <Button onClick={() => { setIsEditing(false); setCapturedPhoto(null); setFormData({ callNumber: "", name: "", ra: "", raDigit: "", classId: classFilter || "", status: "Ativo" }); setIsRegisterOpen(true); }}>
          <UserPlus className="h-4 w-4 mr-2" /> Novo Aluno
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou RA..." className="pl-10 h-11 bg-white shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-3">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="border-none shadow-sm hover:shadow-md transition-all group bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                    {student.photo ? <img src={student.photo} className="h-full w-full object-cover" /> : <span className="font-bold text-primary">{student.name.charAt(0)}</span>}
                  </div>
                  <div className="flex flex-col">
                    <button onClick={() => { setSelectedStudent(student); setIsFichaOpen(true); }} className="font-bold text-sm text-left hover:text-primary transition-colors">{student.name}</button>
                    <span className="text-[10px] text-muted-foreground font-bold tracking-tight">RA: {student.ra}-{student.raDigit} • {student.class}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedStudent(student); setFormData({ ...student }); setCapturedPhoto(student.photo); setIsEditing(true); setIsRegisterOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(student.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredStudents.length === 0 && (
            <div className="py-24 text-center opacity-40 border-2 border-dashed rounded-2xl bg-muted/20">
              <GraduationCap className="h-16 w-16 mx-auto mb-4" />
              <p className="text-xl font-bold text-primary">Nenhum aluno encontrado</p>
              <p className="text-sm">Cadastre alunos para começar o acompanhamento no diário vinculado ao seu perfil.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={isRegisterOpen} onOpenChange={(open) => { if (!open) stopCamera(); setIsRegisterOpen(open); }}>
        <DialogContent className="max-w-3xl w-[95vw] h-[90vh] flex flex-col p-0 bg-white">
          <DialogHeader className="p-6 border-b shrink-0"><DialogTitle className="text-primary font-black">{isEditing ? 'Atualizar' : 'Novo'} Registro de Aluno</DialogTitle></DialogHeader>
          <ScrollArea className="flex-1">
            <div className="p-8 space-y-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-4 shrink-0">
                  <div className="h-44 w-44 rounded-2xl bg-muted border-2 border-dashed flex items-center justify-center overflow-hidden shadow-inner">
                    {capturedPhoto ? <img src={capturedPhoto} className="h-full w-full object-cover" /> : isCameraActive ? <video ref={videoRef} autoPlay muted className="h-full w-full object-cover" /> : <ImageIcon className="h-14 w-14 text-muted-foreground" />}
                  </div>
                  <div className="flex gap-2">
                    {isCameraActive ? <Button size="sm" onClick={capturePhoto} className="bg-green-600 hover:bg-green-700"><Check className="h-4 w-4 mr-2" /> Capturar</Button> : <Button variant="outline" size="sm" onClick={startCamera}><Camera className="h-4 w-4 mr-2" /> Câmera</Button>}
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-2" /> Foto</Button>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="col-span-2 space-y-1.5"><Label>Nome Completo</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ex: João da Silva" /></div>
                  <div className="space-y-1.5"><Label>RA</Label><Input value={formData.ra} onChange={(e) => setFormData({...formData, ra: e.target.value})} placeholder="000.000.000" /></div>
                  <div className="space-y-1.5"><Label>Dígito</Label><Input value={formData.raDigit} onChange={(e) => setFormData({...formData, raDigit: e.target.value})} placeholder="X" /></div>
                  <div className="space-y-1.5"><Label>Turma</Label>
                    <Select value={formData.classId} onValueChange={(v) => setFormData({...formData, classId: v})}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Nº Chamada</Label><Input type="number" value={formData.callNumber} onChange={(e) => setFormData({...formData, callNumber: e.target.value})} /></div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 border-t bg-slate-50 shrink-0"><Button variant="ghost" onClick={() => setIsRegisterOpen(false)}>Cancelar</Button><Button onClick={handleRegisterSubmit} className="shadow-lg">Gravar no Firestore</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFichaOpen} onOpenChange={setIsFichaOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 bg-white shadow-2xl overflow-hidden">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/50">{selectedStudent?.photo ? <img src={selectedStudent.photo} className="h-full w-full object-cover" /> : <span className="text-3xl font-bold">{selectedStudent?.name.charAt(0)}</span>}</div>
              <div><DialogTitle className="text-3xl font-black">{selectedStudent?.name}</DialogTitle><DialogDescription className="text-white/80 font-medium">RA: {selectedStudent?.ra}-{selectedStudent?.raDigit} • {selectedStudent?.class}</DialogDescription></div>
            </div>
          </DialogHeader>
          <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-slate-50 border-b px-8 h-14 justify-start gap-8 rounded-none"><TabsTrigger value="info" className="font-bold">Informações</TabsTrigger><TabsTrigger value="history" className="font-bold">Histórico</TabsTrigger></TabsList>
            <ScrollArea className="flex-1 p-8">
              <TabsContent value="info" className="m-0 space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border bg-slate-50"><Label className="text-[10px] uppercase font-black text-muted-foreground block mb-1">Status</Label><p className="font-bold text-green-600">{selectedStudent?.status}</p></div>
                  <div className="p-4 rounded-xl border bg-slate-50"><Label className="text-[10px] uppercase font-black text-muted-foreground block mb-1">Turma</Label><p className="font-bold">{selectedStudent?.class}</p></div>
                  <div className="p-4 rounded-xl border bg-slate-50"><Label className="text-[10px] uppercase font-black text-muted-foreground block mb-1">Chamada</Label><p className="font-bold">#{selectedStudent?.callNumber}</p></div>
                </div>
              </TabsContent>
              <TabsContent value="history" className="m-0 py-20 text-center opacity-30 italic">Nenhum histórico disponível para este aluno no momento.</TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default function StudentsPage() {
  return <Suspense fallback={<div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>}><StudentsContent /></Suspense>
}
