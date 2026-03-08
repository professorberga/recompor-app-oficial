
"use client"

import { useState, useRef, useEffect, Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { 
  Search, UserPlus, Eye, 
  Camera, Check, Trash2, Pencil, 
  Calendar, ClipboardCheck, GraduationCap, Info,
  Upload, ImageIcon, BookOpen, Clock, Save, X, RotateCcw, Loader2,
  CheckCircle2, XCircle, BarChart3, TrendingUp, Filter, AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Student } from "@/lib/types"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase/provider"
import { collection, doc, setDoc, deleteDoc, query, where, getDocs, writeBatch } from "firebase/firestore"
import { Progress } from "@/components/ui/progress"
import { BIMESTRE_LABELS } from "@/lib/date-utils"

const compressImage = (base64Str: string, maxWidth = 120, maxHeight = 120): Promise<string> => {
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
      resolve(canvas.toDataURL('image/jpeg', 0.4));
    };
    img.onerror = () => resolve("");
  });
};

function StudentsContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, profile, isAdmin } = useUser()
  const firestore = useFirestore()
  
  const classFilter = searchParams.get('class')
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedBimestre, setSelectedBimestre] = useState<string>("all")
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isFichaOpen, setIsFichaOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const classesRef = useMemoFirebase(() => collection(firestore, 'classes'), [firestore])
  const { data: classes = [] } = useCollection(classesRef)

  const studentsRef = useMemoFirebase(() => {
    const baseCol = collection(firestore, 'students');
    if (classFilter) {
      return query(baseCol, where('classId', '==', classFilter));
    }
    return baseCol;
  }, [classFilter, firestore]);

  const { data: students = [], isLoading } = useCollection(studentsRef)

  const attendanceHistoryRef = useMemoFirebase(() => {
    if (!selectedStudent?.id) return null;
    return query(collection(firestore, 'attendanceRecords'), where('studentId', '==', selectedStudent.id));
  }, [selectedStudent, firestore]);

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
      const nameMatch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      const raMatch = student.ra?.includes(searchTerm) ?? false;
      return nameMatch || raMatch;
    }).sort((a, b) => (Number(a.callNumber) || 0) - (Number(b.callNumber) || 0));
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
        const rawBase64 = canvasRef.current.toDataURL('image/jpeg', 0.4)
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
    if (!user) return;
    if (!formData.name || !formData.ra || !formData.classId) {
      toast({ title: "Campos obrigatórios", variant: "destructive" })
      return
    }
    setIsSubmitting(true);
    try {
      const studentId = isEditing && selectedStudent ? selectedStudent.id : Math.random().toString(36).substr(2, 9)
      const targetRef = doc(firestore, 'students', studentId)
      
      const studentData = {
        ...formData,
        id: studentId,
        photo: capturedPhoto || null,
        class: classes.find(c => c.id === formData.classId)?.name || "Turma",
        enrollmentDate: new Date().toISOString(),
        teacherId: user.uid
      }
      
      await setDoc(targetRef, studentData, { merge: true })
      toast({ title: isEditing ? "Cadastro atualizado" : "Aluno registrado" })
      resetForm()
      setIsRegisterOpen(false)
    } catch (err: any) {
      toast({ 
        title: "Falha ao salvar", 
        description: err.code === 'permission-denied' ? "Você não tem permissão para editar este aluno." : "Erro de conexão.",
        variant: "destructive" 
      })
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDelete = async (student: Student) => {
    if (!student || !user) return
    setIsDeleting(true)
    try {
      // 1. Limpar registros de frequência (Cascata)
      const recordsQuery = query(collection(firestore, 'attendanceRecords'), where('studentId', '==', student.id));
      const recordsSnap = await getDocs(recordsQuery);
      const batch = writeBatch(firestore);
      recordsSnap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      // 2. Deletar aluno
      await deleteDoc(doc(firestore, 'students', student.id))
      
      toast({ title: "Aluno e registros removidos com sucesso" })
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Erro inesperado ao excluir.";
      if (err.code === 'permission-denied') {
        errorMessage = "Apenas o dono do registro ou um administrador podem excluir este aluno e suas frequências.";
      }
      toast({ 
        title: "Não foi possível excluir", 
        description: errorMessage,
        variant: "destructive" 
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary uppercase">Alunos</h2>
          <p className="text-sm text-muted-foreground">Gestão de matrículas sincronizada no Firestore Global.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsRegisterOpen(true); }} className="font-bold shadow-lg">
          <UserPlus className="h-4 w-4 mr-2" /> Novo Aluno
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou RA..." className="pl-10 h-11 bg-white shadow-sm rounded-xl border-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-3">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="border-none shadow-sm hover:shadow-md transition-all group bg-white border-l-4 border-l-primary/20 hover:border-l-primary">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                    {student.photo ? <img src={student.photo} className="h-full w-full object-cover" /> : <span className="font-bold text-primary">{student.name?.charAt(0) || "?"}</span>}
                  </div>
                  <div className="flex flex-col">
                    <button onClick={() => { setSelectedStudent(student); setIsFichaOpen(true); }} className="font-bold text-sm text-left hover:text-primary transition-colors uppercase tracking-tight">{student.name}</button>
                    <span className="text-[10px] text-muted-foreground font-bold tracking-tighter">RA: {student.ra}-{student.raDigit} • {student.class}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => { setSelectedStudent(student); setFormData({ ...student }); setCapturedPhoto(student.photo); setIsEditing(true); setIsRegisterOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive uppercase font-black tracking-tighter">
                          <AlertTriangle className="h-5 w-5" /> Confirmar Exclusão
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Você está prestes a remover <strong>{student.name}</strong>. Esta ação excluirá permanentemente o cadastro e todo o histórico de frequência vinculado.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="font-bold">Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(student)} 
                          className="bg-destructive hover:bg-destructive/90 font-bold uppercase text-xs tracking-widest"
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredStudents.length === 0 && <div className="text-center py-20 opacity-30 italic font-bold uppercase text-xs tracking-widest">Nenhum aluno encontrado.</div>}
        </div>
      )}

      {/* DIALOG DE CADASTRO */}
      <Dialog open={isRegisterOpen} onOpenChange={(o) => { if(!o) stopCamera(); setIsRegisterOpen(o); }}>
        <DialogContent className="max-w-3xl w-[95vw] h-[90vh] flex flex-col p-0 bg-white shadow-2xl rounded-2xl overflow-hidden">
          <DialogHeader className="p-8 border-b shrink-0 bg-primary text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">{isEditing ? 'Atualizar' : 'Novo'} Registro de Estudante</DialogTitle>
            <DialogDescription className="text-white/70 font-bold text-xs uppercase tracking-widest">Dados oficiais para sincronização no diário global.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="p-8 space-y-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-4 shrink-0">
                  <div className="h-48 w-48 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-inner relative group">
                    {capturedPhoto ? <img src={capturedPhoto} className="h-full w-full object-cover" /> : isCameraActive ? <video ref={videoRef} autoPlay muted className="h-full w-full object-cover" /> : <ImageIcon className="h-16 w-16 text-slate-300" />}
                    {capturedPhoto && (
                      <button onClick={() => setCapturedPhoto(null)} className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"><X className="h-4 w-4" /></button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isCameraActive ? (
                      <Button size="sm" onClick={capturePhoto} className="bg-green-600 hover:bg-green-700 font-bold px-6">
                        <Check className="h-4 w-4 mr-2" /> Capturar
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={startCamera} className="font-bold border-2">
                        <Camera className="h-4 w-4 mr-2" /> Câmera
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="font-bold border-2">
                      <Upload className="h-4 w-4 mr-2" /> Arquivo
                    </Button>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 flex-1">
                  <div className="col-span-2 space-y-2">
                    <Label className="font-black text-[10px] uppercase text-muted-foreground tracking-widest">Nome Completo</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 text-lg font-bold border-2 focus:border-primary" placeholder="Nome do Aluno" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase text-muted-foreground tracking-widest">RA</Label>
                    <Input value={formData.ra} onChange={(e) => setFormData({...formData, ra: e.target.value})} className="h-12 border-2" placeholder="000.000.000" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase text-muted-foreground tracking-widest">Dígito</Label>
                    <Input value={formData.raDigit} onChange={(e) => setFormData({...formData, raDigit: e.target.value})} className="h-12 border-2 text-center" placeholder="X" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase text-muted-foreground tracking-widest">Turma</Label>
                    <Select value={formData.classId} onValueChange={(v) => setFormData({...formData, classId: v})}>
                      <SelectTrigger className="h-12 border-2 font-bold"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase text-muted-foreground tracking-widest">Nº Chamada</Label>
                    <Input type="number" value={formData.callNumber} onChange={(e) => setFormData({...formData, callNumber: e.target.value})} className="h-12 border-2" />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 border-t bg-slate-50 shrink-0">
            <Button variant="ghost" onClick={() => { stopCamera(); setIsRegisterOpen(false); }} disabled={isSubmitting} className="font-bold">Cancelar</Button>
            <Button onClick={handleRegisterSubmit} disabled={isSubmitting} className="shadow-2xl min-w-[180px] font-black uppercase tracking-widest text-xs h-12">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {isSubmitting ? 'Gravando...' : 'Salvar Registro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FICHA DO ALUNO */}
      <Dialog open={isFichaOpen} onOpenChange={setIsFichaOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 bg-white shadow-2xl overflow-hidden rounded-2xl">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/50 shadow-2xl">
                {selectedStudent?.photo ? <img src={selectedStudent.photo} className="h-full w-full object-cover" /> : <span className="text-4xl font-black">{selectedStudent?.name?.charAt(0) || "?"}</span>}
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tighter uppercase">{selectedStudent?.name}</DialogTitle>
                <DialogDescription className="text-white/80 font-bold uppercase text-[10px] tracking-widest mt-1">RA: {selectedStudent?.ra}-{selectedStudent?.raDigit} • {selectedStudent?.class}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="bg-slate-100 border-b px-8 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Filtrar Período:</span>
              <Select value={selectedBimestre} onValueChange={setSelectedBimestre}>
                <SelectTrigger className="h-9 w-48 bg-white border-2 shadow-sm font-bold text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Bimestres</SelectItem>
                  <SelectItem value="1">1º Bimestre</SelectItem>
                  <SelectItem value="2">2º Bimestre</SelectItem>
                  <SelectItem value="3">3º Bimestre</SelectItem>
                  <SelectItem value="4">4º Bimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Tabs defaultValue="history" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-white border-b px-8 h-14 justify-start gap-10 rounded-none border-t">
              <TabsTrigger value="history" className="font-black uppercase text-[10px] tracking-widest data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none shadow-none h-full">Analítico de Frequência</TabsTrigger>
              <TabsTrigger value="info" className="font-black uppercase text-[10px] tracking-widest data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none shadow-none h-full">Dados Escolares</TabsTrigger>
            </TabsList>
            <ScrollArea className="flex-1 p-8">
              <TabsContent value="history" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <Card className="bg-white border-2 shadow-sm border-slate-100">
                    <CardHeader className="p-4 pb-1"><CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Aulas Totais</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0"><p className="text-3xl font-black text-slate-800">{attendanceStats.total}</p></CardContent>
                  </Card>
                  <Card className="bg-green-50 border-2 border-green-200 shadow-sm">
                    <CardHeader className="p-4 pb-1"><CardTitle className="text-[10px] uppercase font-black text-green-700 tracking-widest">Presenças</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0"><p className="text-3xl font-black text-green-700">{attendanceStats.present}</p></CardContent>
                  </Card>
                  <Card className="bg-red-50 border-2 border-red-200 shadow-sm">
                    <CardHeader className="p-4 pb-1"><CardTitle className="text-[10px] uppercase font-black text-red-700 tracking-widest">Faltas</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0"><p className="text-3xl font-black text-red-700">{attendanceStats.absent}</p></CardContent>
                  </Card>
                  <Card className={cn("border-4 shadow-xl transition-all duration-500", attendanceStats.border, attendanceStats.bg)}>
                    <CardHeader className="p-4 pb-1">
                      <CardTitle className={cn("text-[10px] uppercase font-black tracking-widest", attendanceStats.color)}>Taxa de Freq.</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className={cn("text-3xl font-black", attendanceStats.color)}>{attendanceStats.rate}%</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border-2 border-dashed">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black uppercase text-xs tracking-widest flex items-center gap-2 text-primary"><BarChart3 className="h-4 w-4" /> Desempenho de Assiduidade</h4>
                    <Badge className={cn("font-black uppercase text-[10px] px-6 py-1.5 shadow-sm", attendanceStats.bg, attendanceStats.color, "border-2", attendanceStats.border)}>
                      {attendanceStats.rate >= 75 ? 'Excelente: Dentro da Meta SP' : 'Risco: Baixa Frequência'}
                    </Badge>
                  </div>
                  <Progress value={attendanceStats.rate} className="h-4 bg-slate-200 shadow-inner" />
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">* Meta estabelecida pela SEDUC-SP: Mínimo 75%</p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-black text-xs uppercase tracking-widest text-primary flex items-center gap-2">
                    <History className="h-4 w-4" /> Log de Ausências {selectedBimestre !== "all" ? `no ${BIMESTRE_LABELS[selectedBimestre]}` : "no Ano Corrente"}
                  </h4>
                  <div className="border-2 rounded-2xl divide-y bg-white overflow-hidden shadow-md">
                    {filteredAttendance
                      .filter(record => record.status === 'Falta')
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((record) => (
                      <div key={record.id} className="p-5 flex items-center justify-between hover:bg-red-50/50 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="bg-red-100 p-2 rounded-lg text-red-600 group-hover:scale-110 transition-transform">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-sm uppercase tracking-tighter text-slate-700">{new Date(record.date).toLocaleDateString('pt-BR')}</span>
                            <Badge variant="outline" className="text-[8px] uppercase font-black w-fit mt-1 border-slate-300">{BIMESTRE_LABELS[record.bimestre || "1"]}</Badge>
                          </div>
                        </div>
                        <Badge variant="destructive" className="font-black text-[10px] px-4 py-1 uppercase tracking-widest shadow-sm">
                          <XCircle className="h-3 w-3 mr-2" /> Falta Registrada
                        </Badge>
                      </div>
                    ))}
                    {filteredAttendance.filter(record => record.status === 'Falta').length === 0 && (
                      <div className="p-20 text-center flex flex-col items-center gap-4 opacity-30 grayscale">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                        <p className="text-sm text-slate-500 uppercase font-black tracking-widest">Nenhuma ausência registrada neste período.</p>
                      </div>
                    )}
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
