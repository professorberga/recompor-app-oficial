
"use client"

import { useState, useRef, useEffect, Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { 
  Search, UserPlus, Eye, 
  Camera, Check, Trash2, Pencil, 
  Calendar, ClipboardCheck, GraduationCap, Info,
  Upload, ImageIcon, BookOpen, Clock, Save, X, RotateCcw, Loader2,
  CheckCircle2, XCircle, BarChart3, TrendingUp, Filter, AlertTriangle,
  UserCheck,
  PlusCircle
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
import { Student, StudentEnrollment, TeacherProfile } from "@/lib/types"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase/provider"
import { collection, doc, setDoc, deleteDoc, query, where, getDocs, writeBatch } from "firebase/firestore"
import { Progress } from "@/components/ui/progress"
import { BIMESTRE_LABELS } from "@/lib/date-utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

  const teachersRef = useMemoFirebase(() => collection(firestore, 'teachers'), [firestore])
  const { data: allTeachers = [] } = useCollection(teachersRef)

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
    status: "Ativo" as 'Ativo' | 'Inativo',
    enrollments: [] as StudentEnrollment[]
  })

  // Estado para a nova matrícula que está sendo adicionada
  const [newEnrollment, setNewEnrollment] = useState({
    classId: "",
    subject: "Língua Portuguesa",
    teacherId: ""
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
      status: "Ativo",
      enrollments: []
    })
    setNewEnrollment({ classId: "", subject: "Língua Portuguesa", teacherId: "" })
    setCapturedPhoto(null)
    setIsEditing(false)
  }

  const handleAddEnrollment = () => {
    if (!newEnrollment.classId || !newEnrollment.teacherId) {
      toast({ title: "Selecione Turma e Professor", variant: "destructive" });
      return;
    }

    const classInfo = classes.find(c => c.id === newEnrollment.classId);
    const teacherInfo = allTeachers.find(t => t.id === newEnrollment.teacherId);

    const enrollment: StudentEnrollment = {
      classId: newEnrollment.classId,
      className: classInfo?.name || "",
      subject: newEnrollment.subject,
      teacherId: newEnrollment.teacherId,
      teacherName: teacherInfo?.name || ""
    };

    // Evita duplicatas de Turma + Disciplina
    if (formData.enrollments.some(e => e.classId === enrollment.classId && e.subject === enrollment.subject)) {
      toast({ title: "Este aluno já está matriculado nesta disciplina para esta turma.", variant: "destructive" });
      return;
    }

    setFormData(prev => ({
      ...prev,
      enrollments: [...prev.enrollments, enrollment]
    }));

    setNewEnrollment({ classId: "", subject: "Língua Portuguesa", teacherId: "" });
  }

  const handleRemoveEnrollment = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      enrollments: prev.enrollments.filter((_, i) => i !== idx)
    }));
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return;
    if (!formData.name || !formData.ra) {
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
        // Mantemos classId/class para compatibilidade, usando a primeira matrícula como principal
        class: formData.enrollments[0]?.className || "Sem Turma",
        classId: formData.enrollments[0]?.classId || "",
        enrollmentDate: new Date().toISOString(),
        teacherId: user.uid // Criador do registro
      }
      
      await setDoc(targetRef, studentData, { merge: true })
      toast({ title: isEditing ? "Cadastro atualizado" : "Aluno registrado" })
      resetForm()
      setIsRegisterOpen(false)
    } catch (err: any) {
      toast({ 
        title: "Falha ao salvar", 
        description: "Erro de conexão ou permissão.",
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
      const recordsQuery = query(collection(firestore, 'attendanceRecords'), where('studentId', '==', student.id));
      const recordsSnap = await getDocs(recordsQuery);
      const batch = writeBatch(firestore);
      recordsSnap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      await deleteDoc(doc(firestore, 'students', student.id))
      toast({ title: "Aluno e registros removidos" })
    } catch (err: any) {
      toast({ title: "Não foi possível excluir", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtra professores que têm atribuição para a turma selecionada no mini-form de matrícula
  const availableTeachers = useMemo(() => {
    if (!newEnrollment.classId) return [];
    return allTeachers.filter(t => 
      t.assignments?.some(a => a.classId === newEnrollment.classId) || t.role === 'Admin'
    );
  }, [newEnrollment.classId, allTeachers]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary uppercase">Alunos</h2>
          <p className="text-sm text-muted-foreground">Gestão de matrículas granulares por disciplina e docente.</p>
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
                    <div className="flex flex-wrap gap-1 mt-1">
                      {student.enrollments?.map((e, i) => (
                        <Badge key={i} variant="outline" className="text-[8px] font-black uppercase py-0 border-primary/20">{e.className} • {e.subject}</Badge>
                      ))}
                      {(!student.enrollments || student.enrollments.length === 0) && (
                        <span className="text-[10px] text-muted-foreground font-bold italic">Sem matrículas</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => { setSelectedStudent(student); setFormData({ ...student, enrollments: student.enrollments || [] }); setCapturedPhoto(student.photo); setIsEditing(true); setIsRegisterOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent className="bg-white">
                      <AlertDialogHeader><AlertDialogTitle>Excluir Aluno?</AlertDialogTitle><AlertDialogDescription>Isso removerá todo o histórico de frequência vinculado.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(student)} className="bg-destructive">Confirmar</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* DIALOG DE CADASTRO / MATRÍCULA */}
      <Dialog open={isRegisterOpen} onOpenChange={(o) => { if(!o) stopCamera(); setIsRegisterOpen(o); }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 bg-white shadow-2xl rounded-2xl overflow-hidden">
          <DialogHeader className="p-8 border-b shrink-0 bg-primary text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">{isEditing ? 'Atualizar' : 'Novo'} Estudante & Grade de Matrícula</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* DADOS BÁSICOS */}
                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-40 w-40 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative">
                      {capturedPhoto ? <img src={capturedPhoto} className="h-full w-full object-cover" /> : isCameraActive ? <video ref={videoRef} autoPlay muted className="h-full w-full object-cover" /> : <ImageIcon className="h-12 w-12 text-slate-300" />}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={isCameraActive ? capturePhoto : startCamera} className="font-bold">{isCameraActive ? 'Capturar' : 'Câmera'}</Button>
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Arquivo</Button>
                      <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Nome Completo</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-10 font-bold" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase">RA</Label><Input value={formData.ra} onChange={(e) => setFormData({...formData, ra: e.target.value})} className="h-10" /></div>
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Dígito</Label><Input value={formData.raDigit} onChange={(e) => setFormData({...formData, raDigit: e.target.value})} className="h-10" /></div>
                    </div>
                    <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Número Chamada</Label><Input type="number" value={formData.callNumber} onChange={(e) => setFormData({...formData, callNumber: e.target.value})} className="h-10" /></div>
                  </div>
                </div>

                {/* GRADE DE MATRÍCULA */}
                <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Grade de Matrícula</h4>
                  
                  <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm border mb-6">
                    <div className="grid gap-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase">Turma</Label>
                        <Select value={newEnrollment.classId} onValueChange={(v) => setNewEnrollment({...newEnrollment, classId: v, teacherId: ""})}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase">Disciplina</Label>
                          <Select value={newEnrollment.subject} onValueChange={(v) => setNewEnrollment({...newEnrollment, subject: v})}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="Língua Portuguesa">Português</SelectItem><SelectItem value="Matemática">Matemática</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase">Professor</Label>
                          <Select value={newEnrollment.teacherId} onValueChange={(v) => setNewEnrollment({...newEnrollment, teacherId: v})}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>{availableTeachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button type="button" onClick={handleAddEnrollment} className="h-8 text-[10px] font-black uppercase tracking-widest mt-2"><PlusCircle className="h-3 w-3 mr-2" /> Matricular</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Matrículas Ativas</Label>
                    <div className="border rounded-lg bg-white overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow><TableHead className="text-[9px] font-black uppercase py-2">Turma/Disc.</TableHead><TableHead className="text-[9px] font-black uppercase py-2">Professor</TableHead><TableHead className="w-8"></TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.enrollments.map((e, idx) => (
                            <TableRow key={idx} className="h-10">
                              <TableCell className="py-2"><span className="text-[10px] font-black block leading-none">{e.className}</span><span className="text-[8px] font-bold text-muted-foreground uppercase">{e.subject}</span></TableCell>
                              <TableCell className="py-2 text-[9px] font-bold uppercase truncate max-w-[80px]">{e.teacherName}</TableCell>
                              <TableCell className="py-2"><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveEnrollment(idx)}><X className="h-3 w-3" /></Button></TableCell>
                            </TableRow>
                          ))}
                          {formData.enrollments.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-4 text-[9px] font-bold opacity-30 italic">Sem matrículas ativas.</TableCell></TableRow>}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 border-t bg-slate-50 shrink-0">
            <Button variant="ghost" onClick={() => setIsRegisterOpen(false)} className="font-bold">Cancelar</Button>
            <Button onClick={handleRegisterSubmit} disabled={isSubmitting} className="min-w-[180px] font-black uppercase tracking-widest text-xs h-12">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Sincronizar Aluno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FICHA DO ALUNO (Visualização Analítica) */}
      <Dialog open={isFichaOpen} onOpenChange={setIsFichaOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 bg-white shadow-2xl overflow-hidden rounded-2xl">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/50 shadow-2xl">
                {selectedStudent?.photo ? <img src={selectedStudent.photo} className="h-full w-full object-cover" /> : <span className="text-4xl font-black">{selectedStudent?.name?.charAt(0) || "?"}</span>}
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tighter uppercase">{selectedStudent?.name}</DialogTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedStudent?.enrollments?.map((e, idx) => (
                    <Badge key={idx} className="bg-white/20 text-white border-white/30 text-[9px] font-black uppercase">{e.className} • {e.subject}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </DialogHeader>
          {/* ... resto da ficha do aluno conforme original ... */}
          <ScrollArea className="flex-1 p-8">
            <div className="space-y-8">
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
                    <CardHeader className="p-4 pb-1"><CardTitle className={cn("text-[10px] uppercase font-black tracking-widest", attendanceStats.color)}>Taxa de Freq.</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0"><p className={cn("text-3xl font-black", attendanceStats.color)}>{attendanceStats.rate}%</p></CardContent>
                  </Card>
               </div>
               <div className="border rounded-2xl overflow-hidden shadow-sm">
                 <table className="w-full text-sm">
                   <thead className="bg-slate-50 border-b font-black uppercase text-[10px]"><tr><th className="px-6 py-4 text-left">Turma</th><th className="px-6 py-4 text-left">Disciplina</th><th className="px-6 py-4 text-left">Professor</th></tr></thead>
                   <tbody className="divide-y">
                    {selectedStudent?.enrollments?.map((e, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-black uppercase text-xs">{e.className}</td>
                        <td className="px-6 py-4 font-bold uppercase text-xs">{e.subject}</td>
                        <td className="px-6 py-4 font-medium uppercase text-xs text-muted-foreground">{e.teacherName}</td>
                      </tr>
                    ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default function StudentsPage() {
  return <Suspense fallback={<div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>}><StudentsContent /></Suspense>
}
