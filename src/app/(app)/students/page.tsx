
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

/**
 * Utilitário para comprimir e redimensionar imagens Base64.
 * Isso evita o erro de limite de 1MB do Firestore ao salvar fotos de perfil.
 */
const compressImage = (base64Str: string, maxWidth = 400, maxHeight = 400): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      // Retorna JPEG com 70% de qualidade para reduzir drasticamente o tamanho em bytes
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const classesRef = useMemoFirebase(() => 
    user?.uid ? collection(firestore, 'teachers', user.uid, 'classes') : null,
    [user, firestore]
  )
  const { data: classes = [] } = useCollection(classesRef)

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
      toast({ title: "Erro na Câmera", description: "Verifique as permissões do seu navegador.", variant: "destructive" })
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      setIsCameraActive(false)
    }
  }

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        // Redimensionamento imediato na captura
        const targetWidth = 400;
        const targetHeight = (videoRef.current.videoHeight / videoRef.current.videoWidth) * targetWidth;
        
        canvasRef.current.width = targetWidth
        canvasRef.current.height = targetHeight
        context.drawImage(videoRef.current, 0, 0, targetWidth, targetHeight)
        
        const rawBase64 = canvasRef.current.toDataURL('image/jpeg', 0.8)
        setCapturedPhoto(rawBase64)
        stopCamera()
      }
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setCapturedPhoto(compressed);
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid) {
       toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
       return;
    }
    
    if (!formData.name || !formData.ra || !formData.classId) {
      toast({ title: "Campos Obrigatórios", description: "Nome, RA e Turma devem ser preenchidos.", variant: "destructive" })
      return
    }

    setIsSubmitting(true);

    try {
      const studentId = isEditing && selectedStudent ? selectedStudent.id : Math.random().toString(36).substr(2, 9)
      const targetRef = doc(firestore, 'teachers', user.uid, 'students', studentId)

      // Se houver uma foto, garantimos que ela esteja comprimida antes de enviar ao Firestore
      let finalPhoto = capturedPhoto;
      if (capturedPhoto && capturedPhoto.length > 200000) { // Se maior que ~200KB, comprime mais
        finalPhoto = await compressImage(capturedPhoto);
      }

      const studentData = {
        ...formData,
        id: studentId,
        photo: finalPhoto,
        teacherId: user.uid,
        class: classes.find(c => c.id === formData.classId)?.name || "Turma",
        enrollmentDate: new Date().toISOString()
      }

      await setDoc(targetRef, studentData, { merge: true })
      
      setIsRegisterOpen(false)
      stopCamera()
      toast({ title: "Sucesso", description: isEditing ? "Cadastro atualizado." : "Aluno registrado com sucesso." })
    } catch (err: any) {
      console.error("Erro ao salvar aluno:", err);
      const errorMessage = err.message?.includes('longer than 1048487 bytes') 
        ? "A foto é muito grande. Tente usar uma foto menor ou capturar novamente."
        : "Erro ao conectar com o banco de dados. Tente novamente.";
      
      toast({ title: "Falha ao Salvar", description: errorMessage, variant: "destructive" })
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDelete = async (studentId: string) => {
    if (!user?.uid || !window.confirm("Tem certeza que deseja excluir este aluno?")) return
    try {
      await deleteDoc(doc(firestore, 'teachers', user.uid, 'students', studentId))
      toast({ title: "Removido", description: "O aluno foi excluído permanentemente." })
    } catch (err) {
      toast({ title: "Erro ao excluir", description: "Não foi possível remover o registro.", variant: "destructive" })
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Gestão de Alunos</h2>
          <p className="text-sm text-muted-foreground">Listagem de estudantes vinculados ao seu perfil docente.</p>
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

      <Dialog open={isRegisterOpen} onOpenChange={(open) => { if (!open) { stopCamera(); setIsRegisterOpen(open); } else { setIsRegisterOpen(open); } }}>
        <DialogContent className="max-w-3xl w-[95vw] h-[90vh] flex flex-col p-0 bg-white">
          <DialogHeader className="p-6 border-b shrink-0"><DialogTitle className="text-primary font-black">{isEditing ? 'Atualizar' : 'Novo'} Registro de Aluno</DialogTitle></DialogHeader>
          <ScrollArea className="flex-1">
            <div className="p-8 space-y-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-4 shrink-0">
                  <div className="h-44 w-44 rounded-2xl bg-muted border-2 border-dashed flex items-center justify-center overflow-hidden shadow-inner relative">
                    {capturedPhoto ? <img src={capturedPhoto} className="h-full w-full object-cover" /> : isCameraActive ? <video ref={videoRef} autoPlay muted className="h-full w-full object-cover" /> : <ImageIcon className="h-14 w-14 text-muted-foreground" />}
                    {capturedPhoto && (
                      <button onClick={() => setCapturedPhoto(null)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"><X className="h-4 w-4" /></button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isCameraActive ? (
                      <Button size="sm" onClick={capturePhoto} className="bg-green-600 hover:bg-green-700">
                        <Check className="h-4 w-4 mr-2" /> Capturar
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={startCamera}>
                        <Camera className="h-4 w-4 mr-2" /> Câmera
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" /> Foto
                    </Button>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center max-w-[150px]">As imagens são comprimidas automaticamente para otimizar o banco de dados.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="col-span-2 space-y-1.5">
                    <Label>Nome Completo</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ex: João da Silva" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>RA</Label>
                    <Input value={formData.ra} onChange={(e) => setFormData({...formData, ra: e.target.value})} placeholder="000.000.000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dígito</Label>
                    <Input value={formData.raDigit} onChange={(e) => setFormData({...formData, raDigit: e.target.value})} placeholder="X" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Turma</Label>
                    <Select value={formData.classId} onValueChange={(v) => setFormData({...formData, classId: v})}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nº Chamada</Label>
                    <Input type="number" value={formData.callNumber} onChange={(e) => setFormData({...formData, callNumber: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 border-t bg-slate-50 shrink-0">
            <Button variant="ghost" onClick={() => { stopCamera(); setIsRegisterOpen(false); }}>Cancelar</Button>
            <Button onClick={handleRegisterSubmit} disabled={isSubmitting} className="shadow-lg min-w-[150px]">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {isEditing ? 'Atualizar Aluno' : 'Gravar no Firestore'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFichaOpen} onOpenChange={setIsFichaOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 bg-white shadow-2xl overflow-hidden">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/50">
                {selectedStudent?.photo ? <img src={selectedStudent.photo} className="h-full w-full object-cover" /> : <span className="text-3xl font-bold">{selectedStudent?.name.charAt(0)}</span>}
              </div>
              <div>
                <DialogTitle className="text-3xl font-black">{selectedStudent?.name}</DialogTitle>
                <DialogDescription className="text-white/80 font-medium">RA: {selectedStudent?.ra}-{selectedStudent?.raDigit} • {selectedStudent?.class}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-slate-50 border-b px-8 h-14 justify-start gap-8 rounded-none">
              <TabsTrigger value="info" className="font-bold">Informações</TabsTrigger>
              <TabsTrigger value="history" className="font-bold">Histórico</TabsTrigger>
            </TabsList>
            <ScrollArea className="flex-1 p-8">
              <TabsContent value="info" className="m-0 space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border bg-slate-50">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground block mb-1">Status</Label>
                    <p className="font-bold text-green-600">{selectedStudent?.status}</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-slate-50">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground block mb-1">Turma</Label>
                    <p className="font-bold">{selectedStudent?.class}</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-slate-50">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground block mb-1">Chamada</Label>
                    <p className="font-bold">#{selectedStudent?.callNumber}</p>
                  </div>
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
