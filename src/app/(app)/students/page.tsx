
"use client"

import { useState, useRef, useEffect, Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { 
  Search, UserPlus, Eye, 
  Camera, Check, Trash2, Pencil, 
  Calendar, ClipboardCheck, GraduationCap, Info,
  Upload, ImageIcon, BookOpen, Clock, Save, X, RotateCcw, Loader2,
  CheckCircle2, XCircle, BarChart3, TrendingUp, Filter
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
import { Progress } from "@/components/ui/progress"
import { BIMESTRE_LABELS } from "@/lib/date-utils"

const compressImage = (base64Str: string, maxWidth = 150, maxHeight = 150): Promise<string> => {
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
      resolve(canvas.toDataURL('image/jpeg', 0.5)); // Qualidade 0.5 para garantir payload pequeno
    };
    img.onerror = () => resolve("");
  });
};

function StudentsContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, profile } = useUser()
  const firestore = useFirestore()
  
  const classFilter = searchParams.get('class')
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedBimestre, setSelectedBimestre] = useState<string>("all")
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

  useEffect(() => {
    if (profile?.activeBimestre && selectedBimestre === "all") {
      setSelectedBimestre(profile.activeBimestre);
    }
  }, [profile]);

  const attendanceHistoryRef = useMemoFirebase(() => {
    if (!user?.uid || !selectedStudent?.id) return null;
    const baseQuery = collection(firestore, 'teachers', user.uid, 'attendanceRecords');
    return query(baseQuery, where('studentId', '==', selectedStudent.id));
  }, [user, selectedStudent, firestore]);

  const { data: rawAttendanceHistory = [] } = useCollection(attendanceHistoryRef)

  const filteredAttendance = useMemo(() => {
    if (selectedBimestre === "all") return rawAttendanceHistory;
    return rawAttendanceHistory.filter(h => h.bimestre === selectedBimestre);
  }, [rawAttendanceHistory, selectedBimestre]);

  const attendanceStats = useMemo(() => {
    if (filteredAttendance.length === 0) return { total: 0, present: 0, absent: 0, rate: 0, color: "text-primary", bg: "bg-primary/5", border: "border-primary" };
    const total = filteredAttendance.length;
    const present = filteredAttendance.filter(h => h.status === 'Presente').length;
    const absent = total - present;
    const rate = Math.round((present / total) * 100);

    let color = "text-green-600";
    let bg = "bg-green-50";
    let border = "border-green-500";
    if (rate <= 50) {
      color = "text-red-600";
      bg = "bg-red-50";
      border = "border-red-500";
    } else if (rate <= 75) {
      color = "text-yellow-600";
      bg = "bg-yellow-50";
      border = "border-yellow-500";
    }
    return { total, present, absent, rate, color, bg, border };
  }, [filteredAttendance]);

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
      toast({ title: "Câmera indisponível", variant: "destructive" })
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
        const targetWidth = 150;
        const targetHeight = (videoRef.current.videoHeight / videoRef.current.videoWidth) * targetWidth;
        canvasRef.current.width = targetWidth
        canvasRef.current.height = targetHeight
        context.drawImage(videoRef.current, 0, 0, targetWidth, targetHeight)
        const rawBase64 = canvasRef.current.toDataURL('image/jpeg', 0.5)
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

  const resetForm = () => {
    setFormData({ 
      callNumber: "", 
      name: "", 
      ra: "", 
      raDigit: "", 
      classId: classFilter || "", 
      status: "Ativo" 
    })
    setCapturedPhoto(null)
    setIsEditing(false)
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid) return
    if (!formData.name || !formData.ra || !formData.classId) {
      toast({ title: "Campos obrigatórios", variant: "destructive" })
      return
    }
    setIsSubmitting(true);
    try {
      const studentId = isEditing && selectedStudent ? selectedStudent.id : Math.random().toString(36).substr(2, 9)
      const targetRef = doc(firestore, 'teachers', user.uid, 'students', studentId)
      
      let finalPhoto = capturedPhoto;
      // Validação rigorosa de tamanho de imagem para evitar Erro 400
      if (capturedPhoto && capturedPhoto.length > 30000) {
        finalPhoto = await compressImage(capturedPhoto);
      }

      const studentData = {
        ...formData,
        id: studentId,
        photo: finalPhoto || null,
        teacherId: user.uid,
        class: classes.find(c => c.id === formData.classId)?.name || "Turma",
        enrollmentDate: new Date().toISOString()
      }
      
      await setDoc(targetRef, studentData, { merge: true })
      toast({ title: isEditing ? "Cadastro atualizado" : "Aluno registrado" })
      resetForm()
      setIsRegisterOpen(false)
    } catch (err: any) {
      toast({ title: "Falha ao salvar", variant: "destructive" })
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDelete = async (studentId: string) => {
    if (!user?.uid || !window.confirm("Confirmar exclusão?")) return
    try {
      await deleteDoc(doc(firestore, 'teachers', user.uid, 'students', studentId))
      toast({ title: "Removido" })
    } catch (err) {
      toast({ title: "Erro na exclusão", variant: "destructive" })
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary uppercase">Alunos</h2>
          <p className="text-sm text-muted-foreground">Gestão de matrículas sincronizada no Firestore.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsRegisterOpen(true); }} className="font-bold">
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
                    <button onClick={() => { setSelectedStudent(student); setIsFichaOpen(true); }} className="font-bold text-sm text-left hover:text-primary transition-colors uppercase">{student.name}</button>
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
          {filteredStudents.length === 0 && <div className="text-center py-20 opacity-30 italic">Nenhum aluno encontrado.</div>}
        </div>
      )}

      {/* DIALOG DE CADASTRO */}
      <Dialog open={isRegisterOpen} onOpenChange={(o) => { if(!o) stopCamera(); setIsRegisterOpen(o); }}>
        <DialogContent className="max-w-3xl w-[95vw] h-[90vh] flex flex-col p-0 bg-white shadow-2xl">
          <DialogHeader className="p-6 border-b shrink-0 bg-primary text-white">
            <DialogTitle className="text-xl font-black uppercase">{isEditing ? 'Atualizar' : 'Novo'} Registro</DialogTitle>
            <DialogDescription className="text-white/70">Preencha os dados oficiais do aluno para o diário de classe.</DialogDescription>
          </DialogHeader>
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
                      <Button size="sm" onClick={capturePhoto} className="bg-green-600 hover:bg-green-700 font-bold">
                        <Check className="h-4 w-4 mr-2" /> Capturar
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={startCamera} className="font-bold">
                        <Camera className="h-4 w-4 mr-2" /> Câmera
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="font-bold">
                      <Upload className="h-4 w-4 mr-2" /> Foto
                    </Button>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="font-bold text-xs uppercase">Nome Completo</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs uppercase">RA</Label>
                    <Input value={formData.ra} onChange={(e) => setFormData({...formData, ra: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs uppercase">Dígito</Label>
                    <Input value={formData.raDigit} onChange={(e) => setFormData({...formData, raDigit: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs uppercase">Turma</Label>
                    <Select value={formData.classId} onValueChange={(v) => setFormData({...formData, classId: v})}>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs uppercase">Nº Chamada</Label>
                    <Input type="number" value={formData.callNumber} onChange={(e) => setFormData({...formData, callNumber: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 border-t bg-slate-50 shrink-0">
            <Button variant="ghost" onClick={() => { stopCamera(); setIsRegisterOpen(false); }} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleRegisterSubmit} disabled={isSubmitting} className="shadow-lg min-w-[150px] font-black uppercase tracking-widest text-xs">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {isSubmitting ? 'Gravando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FICHA DO ALUNO */}
      <Dialog open={isFichaOpen} onOpenChange={setIsFichaOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 bg-white shadow-2xl overflow-hidden">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/50 shadow-lg">
                {selectedStudent?.photo ? <img src={selectedStudent.photo} className="h-full w-full object-cover" /> : <span className="text-3xl font-black">{selectedStudent?.name.charAt(0)}</span>}
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tighter uppercase">{selectedStudent?.name}</DialogTitle>
                <DialogDescription className="text-white/80 font-bold uppercase text-[10px] tracking-widest">RA: {selectedStudent?.ra}-{selectedStudent?.raDigit} • {selectedStudent?.class}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="bg-slate-100 border-b px-8 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Bimestre:</span>
              <Select value={selectedBimestre} onValueChange={setSelectedBimestre}>
                <SelectTrigger className="h-8 w-44 bg-white border-none shadow-sm font-bold text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Períodos</SelectItem>
                  <SelectItem value="1">1º Bimestre</SelectItem>
                  <SelectItem value="2">2º Bimestre</SelectItem>
                  <SelectItem value="3">3º Bimestre</SelectItem>
                  <SelectItem value="4">4º Bimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedBimestre !== "all" && (
              <Badge variant="secondary" className="bg-blue-600 text-white font-black uppercase text-[9px] tracking-tighter">
                Filtro Ativo: {BIMESTRE_LABELS[selectedBimestre]}
              </Badge>
            )}
          </div>
          <Tabs defaultValue="history" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-white border-b px-8 h-12 justify-start gap-8 rounded-none border-t">
              <TabsTrigger value="history" className="font-black uppercase text-[10px] tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none">Analítico de Frequência</TabsTrigger>
              <TabsTrigger value="info" className="font-black uppercase text-[10px] tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none">Dados de Matrícula</TabsTrigger>
            </TabsList>
            <ScrollArea className="flex-1 p-8">
              <TabsContent value="history" className="m-0 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-white border shadow-sm">
                    <CardHeader className="p-4 pb-1"><CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Aulas Previstas</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0"><p className="text-3xl font-black">{attendanceStats.total}</p></CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="p-4 pb-1"><CardTitle className="text-[10px] uppercase font-black text-green-700 tracking-widest">Presenças</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0"><p className="text-3xl font-black text-green-700">{attendanceStats.present}</p></CardContent>
                  </Card>
                  <Card className="bg-red-50 border-red-200">
                    <CardHeader className="p-4 pb-1"><CardTitle className="text-[10px] uppercase font-black text-red-700 tracking-widest">Ausências</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0"><p className="text-3xl font-black text-red-700">{attendanceStats.absent}</p></CardContent>
                  </Card>
                  <Card className={cn("border-2 shadow-inner transition-colors", attendanceStats.border, attendanceStats.bg)}>
                    <CardHeader className="p-4 pb-1">
                      <CardTitle className={cn("text-[10px] uppercase font-black tracking-widest", attendanceStats.color)}>Freq. Global</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className={cn("text-3xl font-black", attendanceStats.color)}>{attendanceStats.rate}%</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black uppercase text-xs tracking-widest flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Evolução Pedagógica</h4>
                    <Badge className={cn("font-black uppercase text-[9px] px-4 py-1", attendanceStats.bg, attendanceStats.color, "border-none")}>
                      {attendanceStats.rate >= 75 ? 'Dentro da Meta SP' : 'Risco de Abandono'}
                    </Badge>
                  </div>
                  <Progress value={attendanceStats.rate} className="h-3 bg-slate-100" />
                </div>

                <div className="space-y-3">
                  <h4 className="font-black text-xs uppercase tracking-widest text-muted-foreground">Log de Ausências {selectedBimestre !== "all" ? `no ${BIMESTRE_LABELS[selectedBimestre]}` : "no Ano Letivo"}</h4>
                  <div className="border rounded-xl divide-y bg-white overflow-hidden shadow-sm">
                    {filteredAttendance
                      .filter(record => record.status === 'Falta')
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((record) => (
                      <div key={record.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-black text-xs uppercase">{new Date(record.date).toLocaleDateString('pt-BR')}</span>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold">{BIMESTRE_LABELS[record.bimestre || "1"]}</Badge>
                        </div>
                        <Badge variant="destructive" className="font-black text-[9px] px-3 uppercase tracking-widest">
                          <XCircle className="h-3 w-3 mr-1" /> Falta Registrada
                        </Badge>
                      </div>
                    ))}
                    {filteredAttendance.filter(record => record.status === 'Falta').length === 0 && (
                      <div className="p-16 text-center text-xs text-muted-foreground uppercase font-bold tracking-widest opacity-20">Nenhuma ausência registrada neste período.</div>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="info" className="m-0 space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-6 rounded-xl border-2 border-slate-100 bg-white text-center shadow-sm">
                    <Label className="text-[9px] uppercase font-black text-muted-foreground block mb-2 tracking-widest">Situação</Label>
                    <Badge className="bg-green-600 font-black uppercase text-[10px]">{selectedStudent?.status}</Badge>
                  </div>
                  <div className="p-6 rounded-xl border-2 border-slate-100 bg-white text-center shadow-sm">
                    <Label className="text-[9px] uppercase font-black text-muted-foreground block mb-2 tracking-widest">Turma Vinculada</Label>
                    <p className="font-black text-primary uppercase text-sm">{selectedStudent?.class}</p>
                  </div>
                  <div className="p-6 rounded-xl border-2 border-slate-100 bg-white text-center shadow-sm">
                    <Label className="text-[9px] uppercase font-black text-muted-foreground block mb-2 tracking-widest">Ordem na Chamada</Label>
                    <p className="font-black text-2xl">#{selectedStudent?.callNumber}</p>
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
  return <Suspense fallback={<div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>}><StudentsContent /></Suspense>
}
