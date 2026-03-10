
"use client"

import { useState, useRef, useEffect, Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { 
  Search, UserPlus, Eye, 
  Camera, Check, Trash2, Pencil, 
  Calendar, ClipboardCheck, GraduationCap, Info,
  Upload, ImageIcon, BookOpen, Clock, Save, X, RotateCcw, Loader2,
  CheckCircle2, XCircle, BarChart3, TrendingUp, Filter, AlertTriangle,
  UserCheck, PlusCircle, NotebookPen, FileText, UserRound
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Student, StudentEnrollment, TeacherProfile, StudentObservation } from "@/lib/types"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase/provider"
import { collection, doc, setDoc, deleteDoc, query, where, getDocs, writeBatch, getDoc, orderBy } from "firebase/firestore"
import { BIMESTRE_LABELS, getBimestreFromDate } from "@/lib/date-utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const compressImage = (base64Str: string, maxWidth = 120, maxHeight = 120): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width, height = img.height;
      if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } }
      else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
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

  const [isObsDialogOpen, setIsObsDialogOpen] = useState(false)
  const [obsStudent, setObsStudent] = useState<any>(null)
  const [obsContent, setObsContent] = useState("")
  const [isSavingObs, setIsSavingObs] = useState(false)
  
  const classesRef = useMemoFirebase(() => collection(firestore, 'classes'), [firestore])
  const { data: classes = [] } = useCollection(classesRef)
  const teachersRef = useMemoFirebase(() => collection(firestore, 'teachers'), [firestore])
  const { data: allTeachers = [] } = useCollection(teachersRef)

  const studentsRef = useMemoFirebase(() => {
    const baseCol = collection(firestore, 'students');
    return classFilter ? query(baseCol, where('classId', '==', classFilter)) : baseCol;
  }, [classFilter, firestore]);
  const { data: students = [], isLoading } = useCollection(studentsRef)

  const attendanceHistoryRef = useMemoFirebase(() => {
    if (!selectedStudent?.id) return null;
    return query(collection(firestore, 'attendanceRecords'), where('studentId', '==', selectedStudent.id));
  }, [selectedStudent, firestore]);
  const { data: rawAttendanceHistory = [] } = useCollection(attendanceHistoryRef)

  const obsHistoryRef = useMemoFirebase(() => {
    if (!selectedStudent?.id) return null;
    return query(collection(firestore, 'studentObservations'), where('studentId', '==', selectedStudent.id));
  }, [selectedStudent, firestore]);
  const { data: rawObsHistory = [] } = useCollection(obsHistoryRef)

  const filteredAttendance = useMemo(() => {
    if (selectedBimestre === "all") return rawAttendanceHistory;
    return rawAttendanceHistory.filter(h => h.bimestre === selectedBimestre);
  }, [rawAttendanceHistory, selectedBimestre]);

  const filteredObservations = useMemo(() => {
    return rawObsHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [rawObsHistory]);

  const attendanceStats = useMemo(() => {
    if (filteredAttendance.length === 0) return { total: 0, present: 0, absent: 0, rate: 0, color: "text-primary", bg: "bg-primary/5", border: "border-primary" };
    const total = filteredAttendance.length;
    const present = filteredAttendance.filter(h => h.status === 'Presente').length;
    const rate = Math.round((present / total) * 100);
    let color = "text-green-600", bg = "bg-green-50", border = "border-green-500";
    if (rate <= 50) { color = "text-red-600"; bg = "bg-red-50"; border = "border-red-500"; }
    else if (rate <= 75) { color = "text-yellow-600"; bg = "bg-yellow-50"; border = "border-yellow-500"; }
    return { total, present, absent: total - present, rate, color, bg, border };
  }, [filteredAttendance]);

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    callNumber: "", name: "", ra: "", raDigit: "", tutor: "", classId: classFilter || "", status: "Ativo" as 'Ativo' | 'Inativo', enrollments: [] as StudentEnrollment[]
  })
  const [newEnrollment, setNewEnrollment] = useState({ classId: "", subject: "Língua Portuguesa", teacherId: "" })

  const filteredStudents = useMemo(() => {
    return students
      .filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.ra?.includes(searchTerm))
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", 'pt-BR'));
  }, [students, searchTerm])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) { videoRef.current.srcObject = stream; setIsCameraActive(true); }
    } catch (err) { toast({ title: "Câmera indisponível", variant: "destructive" }); }
  }
  const stopCamera = () => {
    if (videoRef.current?.srcObject) { (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop()); setIsCameraActive(false); }
  }
  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        const tw = 150, th = (videoRef.current.videoHeight / videoRef.current.videoWidth) * tw;
        canvasRef.current.width = tw; canvasRef.current.height = th;
        context.drawImage(videoRef.current, 0, 0, tw, th);
        setCapturedPhoto(canvasRef.current.toDataURL('image/jpeg', 0.4));
        stopCamera();
      }
    }
  }

  const handleOpenObs = async (student: any) => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const obsId = `${student.id}_${todayStr}_${user?.uid}`;
    setObsStudent(student);
    setIsSavingObs(true);
    const snap = await getDoc(doc(firestore, 'studentObservations', obsId));
    setObsContent(snap.exists() ? snap.data().content || "" : "");
    setIsSavingObs(false);
    setIsObsDialogOpen(true);
  };

  const handleSaveObs = async () => {
    if (!obsStudent || !user) return;
    setIsSavingObs(true);
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const obsId = `${obsStudent.id}_${todayStr}_${user.uid}`;
    try {
      await setDoc(doc(firestore, 'studentObservations', obsId), {
        id: obsId,
        studentId: obsStudent.id,
        classId: obsStudent.classId,
        date: todayStr,
        teacherId: user.uid,
        teacherName: profile?.name || user.email,
        content: obsContent,
        bimestre: getBimestreFromDate(today)
      }, { merge: true });
      setIsObsDialogOpen(false);
      toast({ title: "Observação Salva" });
    } catch (e) { toast({ title: "Erro ao salvar", variant: "destructive" }); }
    finally { setIsSavingObs(false); }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user || !formData.name || !formData.ra) return;
    setIsSubmitting(true);
    try {
      const id = isEditing && selectedStudent ? selectedStudent.id : Math.random().toString(36).substr(2, 9);
      await setDoc(doc(firestore, 'students', id), {
        ...formData, id, photo: capturedPhoto || null, class: formData.enrollments[0]?.className || "Sem Turma",
        classId: formData.enrollments[0]?.classId || "", enrollmentDate: new Date().toISOString(), teacherId: user.uid
      }, { merge: true });
      toast({ title: isEditing ? "Cadastro atualizado" : "Aluno registrado" });
      setIsRegisterOpen(false);
    } catch (err) { toast({ title: "Falha ao salvar", variant: "destructive" }); }
    finally { setIsSubmitting(false); }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary uppercase">Alunos</h2>
        <Button onClick={() => { setFormData({ callNumber: "", name: "", ra: "", raDigit: "", tutor: "", classId: classFilter || "", status: "Ativo", enrollments: [] }); setCapturedPhoto(null); setIsEditing(false); setIsRegisterOpen(true); }} className="font-bold shadow-lg">
          <UserPlus className="h-4 w-4 mr-2" /> Novo Aluno
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou RA..." className="pl-10 h-11 bg-white shadow-sm border-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                    {student.photo ? <img src={student.photo} className="h-full w-full object-cover" /> : <span className="font-bold text-primary">{student.name?.charAt(0)}</span>}
                  </div>
                  <div className="flex flex-col">
                    <button onClick={() => { setSelectedStudent(student); setIsFichaOpen(true); }} className="font-bold text-sm text-left hover:text-primary uppercase tracking-tight">{student.name}</button>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {student.enrollments?.map((e, i) => <Badge key={i} variant="outline" className="text-[8px] font-black uppercase py-0 border-primary/20">{e.className} • {e.subject}</Badge>)}
                      {student.tutor && <Badge variant="secondary" className="text-[8px] font-bold uppercase py-0 bg-accent/10 text-accent-foreground border-accent/20">Tutor: {student.tutor}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenObs(student)}><NotebookPen className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setSelectedStudent(student); setFormData({ ...student, enrollments: student.enrollments || [] }); setCapturedPhoto(student.photo); setIsEditing(true); setIsRegisterOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent className="bg-white">
                      <AlertDialogHeader><AlertDialogTitle>Excluir Aluno?</AlertDialogTitle></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={async () => { await deleteDoc(doc(firestore, 'students', student.id)); toast({ title: "Removido" }); }} className="bg-destructive">Confirmar</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isRegisterOpen} onOpenChange={(o) => { if(!o) stopCamera(); setIsRegisterOpen(o); }}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 bg-white">
          <DialogHeader className="p-8 bg-primary text-white"><DialogTitle className="uppercase font-black">{isEditing ? 'Editar' : 'Novo'} Aluno</DialogTitle></DialogHeader>
          <ScrollArea className="flex-1 p-8">
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="h-32 w-32 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative">
                  {capturedPhoto ? <img src={capturedPhoto} className="h-full w-full object-cover" /> : isCameraActive ? <video ref={videoRef} autoPlay muted className="h-full w-full object-cover" /> : <ImageIcon className="h-10 w-10 text-slate-300" />}
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={isCameraActive ? capturePhoto : startCamera}>{isCameraActive ? 'Capturar' : 'Câmera'}</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>Arquivo</Button>
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = async () => setCapturedPhoto(await compressImage(r.result as string)); r.readAsDataURL(f); } }} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-[10px] uppercase font-black">Nome</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-[10px] uppercase font-black">RA</Label><Input value={formData.ra} onChange={(e) => setFormData({...formData, ra: e.target.value})} /></div>
                  <div className="space-y-1"><Label className="text-[10px] uppercase font-black">Dig.</Label><Input value={formData.raDigit} onChange={(e) => setFormData({...formData, raDigit: e.target.value})} /></div>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px] uppercase font-black">Tutor / Responsável (Opcional)</Label>
                  <Input placeholder="Nome do tutor" value={formData.tutor} onChange={(e) => setFormData({...formData, tutor: e.target.value})} />
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed">
                <h4 className="font-black text-xs uppercase text-primary mb-4">Matrículas Ativas</h4>
                <div className="grid gap-3 mb-4">
                  <Select value={newEnrollment.classId} onValueChange={(v) => setNewEnrollment({...newEnrollment, classId: v, teacherId: ""})}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Turma" /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={newEnrollment.subject} onValueChange={(v) => setNewEnrollment({...newEnrollment, subject: v})}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Língua Portuguesa">Português</SelectItem><SelectItem value="Matemática">Matemática</SelectItem></SelectContent>
                    </Select>
                    <Select value={newEnrollment.teacherId} onValueChange={(v) => setNewEnrollment({...newEnrollment, teacherId: v})}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Prof." /></SelectTrigger>
                      <SelectContent>{allTeachers.filter(t => t.assignments?.some(a => a.classId === newEnrollment.classId) || t.role === 'Admin').map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button type="button" onClick={() => { if(!newEnrollment.classId || !newEnrollment.teacherId) return; setFormData({...formData, enrollments: [...formData.enrollments, { classId: newEnrollment.classId, className: classes.find(c => c.id === newEnrollment.classId)?.name || "", subject: newEnrollment.subject, teacherId: newEnrollment.teacherId, teacherName: allTeachers.find(t => t.id === newEnrollment.teacherId)?.name || "" }]}); setNewEnrollment({classId: "", subject: "Língua Portuguesa", teacherId: ""}); }} className="h-8 uppercase text-[10px] font-black"><PlusCircle className="h-3 w-3 mr-2" /> Matricular</Button>
                </div>
                <div className="border rounded-lg bg-white">
                  <Table><TableBody>{formData.enrollments.map((e, idx) => (
                    <TableRow key={idx} className="h-10">
                      <TableCell className="py-2 text-[10px] font-black">{e.className} • {e.subject}</TableCell>
                      <TableCell className="py-2 text-[10px] uppercase">{e.teacherName}</TableCell>
                      <TableCell className="py-2"><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setFormData({...formData, enrollments: formData.enrollments.filter((_, i) => i !== idx)})}><X className="h-3 w-3" /></Button></TableCell>
                    </TableRow>
                  ))}</TableBody></Table>
                </div>
              </div>
            </form>
          </ScrollArea>
          <DialogFooter className="p-8 border-t bg-slate-50"><Button onClick={handleRegisterSubmit} disabled={isSubmitting} className="min-w-[180px] font-black h-12">Sincronizar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFichaOpen} onOpenChange={setIsFichaOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 bg-white">
          <DialogHeader className="p-8 bg-primary text-white flex-row items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-white/20 border-4 border-white/50 overflow-hidden flex items-center justify-center">
              {selectedStudent?.photo ? <img src={selectedStudent.photo} className="h-full w-full object-cover" /> : <span className="text-3xl font-black">{selectedStudent?.name?.charAt(0)}</span>}
            </div>
            <div>
              <DialogTitle className="text-3xl font-black uppercase tracking-tighter">{selectedStudent?.name}</DialogTitle>
              <div className="flex gap-2 mt-2">
                {selectedStudent?.enrollments?.map((e, idx) => <Badge key={idx} className="bg-white/20 text-white uppercase text-[9px]">{e.className} • {e.subject}</Badge>)}
              </div>
              {selectedStudent?.tutor && (
                <div className="flex items-center gap-2 mt-2 text-white/80 font-bold text-xs">
                  <UserRound className="h-3 w-3" />
                  Tutor: {selectedStudent.tutor}
                </div>
              )}
            </div>
          </DialogHeader>
          <ScrollArea className="flex-1 p-8">
            <div className="space-y-8">
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 bg-slate-50 border-none shadow-sm"><Label className="text-[9px] font-black uppercase text-muted-foreground">Frequência</Label><p className="text-2xl font-black text-primary">{attendanceStats.rate}%</p></Card>
                <Card className="p-4 bg-slate-50 border-none shadow-sm"><Label className="text-[9px] font-black uppercase text-muted-foreground">Aulas</Label><p className="text-2xl font-black text-primary">{attendanceStats.total}</p></Card>
                <Card className="p-4 bg-slate-50 border-none shadow-sm"><Label className="text-[9px] font-black uppercase text-muted-foreground">Presenças</Label><p className="text-2xl font-black text-green-600">{attendanceStats.present}</p></Card>
                <Card className="p-4 bg-slate-50 border-none shadow-sm"><Label className="text-[9px] font-black uppercase text-muted-foreground">Faltas</Label><p className="text-2xl font-black text-red-600">{attendanceStats.absent}</p></Card>
              </div>
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-primary"><FileText className="h-4 w-4" /> Histórico Pedagógico</h4>
                <div className="space-y-3">
                  {filteredObservations.map((obs) => (
                    <div key={obs.id} className="p-4 border-l-4 border-l-primary bg-slate-50 rounded-r-xl">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black uppercase text-primary">{obs.teacherName}</span>
                        <span className="text-[9px] font-bold text-muted-foreground">{format(new Date(obs.date.includes('T') ? obs.date : obs.date + 'T12:00:00'), "dd/MM/yyyy")}</span>
                      </div>
                      <p className="text-sm italic text-slate-700">{obs.content}</p>
                    </div>
                  ))}
                  {filteredObservations.length === 0 && <p className="text-center py-10 opacity-30 italic font-bold uppercase text-[10px]">Nenhuma observação registrada.</p>}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isObsDialogOpen} onOpenChange={setIsObsDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 uppercase font-black"><NotebookPen className="h-5 w-5 text-primary" /> Observação: {obsStudent?.name}</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase">Registro qualitativo para o histórico institucional.</DialogDescription>
          </DialogHeader>
          <div className="py-4"><Textarea placeholder="Descreva aqui o comportamento, desempenho ou ocorrência..." className="min-h-[150px]" value={obsContent} onChange={(e) => setObsContent(e.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setIsObsDialogOpen(false)}>Cancelar</Button><Button onClick={handleSaveObs} disabled={isSavingObs} className="min-w-[120px]">{isSavingObs ? <Loader2 className="animate-spin h-4 w-4" /> : "Salvar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default function StudentsPage() { return <Suspense fallback={<div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>}><StudentsContent /></Suspense> }
