
"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Loader2, UserCircle, CheckCircle2, History, AlertCircle, Trash2, BookText, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase/provider"
import { collection, doc, setDoc, query, where, deleteDoc, getDoc } from "firebase/firestore"
import { getBimestreFromDate, BIMESTRE_LABELS } from "@/lib/date-utils"
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

type AttendanceState = Record<string, 'present' | 'absent'>;

function AttendanceContent() {
  const searchParams = useSearchParams()
  const classIdFromUrl = searchParams.get('class')
  const [mounted, setMounted] = useState(false)
  const { user, profile, isAdmin, isUserLoading } = useUser()
  const firestore = useFirestore()
  
  const [selectedClassId, setSelectedClassId] = useState(classIdFromUrl || "")
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [attendance, setAttendance] = useState<AttendanceState>({})
  const [contentSummary, setContentSummary] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const classesRef = useMemoFirebase(() => 
    user ? collection(firestore, 'teachers', user.uid, 'classes') : null,
    [user, firestore]
  )
  const { data: rawClasses = [] } = useCollection(classesRef)

  const classes = useMemo(() => {
    if (isAdmin) return rawClasses;
    if (profile?.assignments && profile.assignments.length > 0) {
      const assignedIds = profile.assignments.map(a => a.classId);
      return rawClasses.filter(c => assignedIds.includes(c.id));
    }
    return rawClasses;
  }, [rawClasses, profile, isAdmin]);

  const studentsRef = useMemoFirebase(() => {
    if (!user || !selectedClassId) return null;
    return query(
      collection(firestore, 'teachers', user.uid, 'students'), 
      where('classId', '==', selectedClassId)
    );
  }, [user, selectedClassId, firestore]);
  
  const { data: students = [], isLoading: isStudentsLoading } = useCollection(studentsRef)

  const attendanceRecordsRef = useMemoFirebase(() => {
    if (!user || !selectedClassId || !currentDate) return null;
    const dateStr = format(currentDate, "yyyy-MM-dd");
    return query(
      collection(firestore, 'teachers', user.uid, 'attendanceRecords'),
      where('classId', '==', selectedClassId),
      where('date', '==', dateStr)
    );
  }, [user, selectedClassId, currentDate, firestore]);

  const { data: existingRecords, isLoading: isRecordsLoading } = useCollection(attendanceRecordsRef);

  useEffect(() => {
    setMounted(true)
    setCurrentDate(new Date())
  }, [])

  useEffect(() => {
    if (classIdFromUrl) setSelectedClassId(classIdFromUrl)
  }, [classIdFromUrl])

  // Load existing data when class/date changes
  useEffect(() => {
    async function loadLessonContent() {
      if (!user || !selectedClassId || !currentDate) return;
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const lessonId = `${selectedClassId}_${dateStr}`;
      const lessonRef = doc(firestore, 'teachers', user.uid, 'lessons', lessonId);
      const snap = await getDoc(lessonRef);
      if (snap.exists()) {
        setContentSummary(snap.data().content || "");
      } else {
        setContentSummary("");
      }
    }

    if (mounted && students.length > 0) {
      const newState: AttendanceState = {};
      if (existingRecords.length > 0) {
        existingRecords.forEach(rec => {
          newState[rec.studentId] = rec.status === 'Presente' ? 'present' : 'absent';
        });
      } else {
        students.forEach(s => { newState[s.id] = 'present'; });
      }
      setAttendance(newState);
      loadLessonContent();
    }
  }, [existingRecords, students, mounted, currentDate, selectedClassId, user, firestore]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const nameMatch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      const raMatch = s.ra?.includes(searchTerm) ?? false;
      return nameMatch || raMatch;
    }).sort((a, b) => (Number(a.callNumber) || 0) - (Number(b.callNumber) || 0));
  }, [students, searchTerm]);

  const dateBimestre = useMemo(() => currentDate ? getBimestreFromDate(currentDate) : null, [currentDate]);

  const handleSave = async () => {
    if (!user || !selectedClassId || !currentDate || !dateBimestre) return;
    if (!contentSummary.trim()) {
      toast({ title: "Campo Obrigatório", description: "O resumo do conteúdo ministrado é necessário para a auditoria.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const recordsColRef = collection(firestore, 'teachers', user.uid, 'attendanceRecords');
    const lessonRef = doc(firestore, 'teachers', user.uid, 'lessons', `${selectedClassId}_${dateStr}`);
    const selectedClass = classes.find(c => c.id === selectedClassId);

    try {
      // 1. Save Student Statuses
      const savePromises = Object.entries(attendance).map(([studentId, status]) => {
        const recordId = `${studentId}_${dateStr}`;
        return setDoc(doc(recordsColRef, recordId), {
          id: recordId,
          studentId,
          classId: selectedClassId,
          date: dateStr,
          bimestre: dateBimestre,
          status: status === 'present' ? 'Presente' : 'Falta',
          recordedByTeacherId: user.uid
        }, { merge: true });
      });

      // 2. Save Lesson Content
      const lessonPromise = setDoc(lessonRef, {
        id: `${selectedClassId}_${dateStr}`,
        classId: selectedClassId,
        date: dateStr,
        teacherId: user.uid,
        content: contentSummary,
        bimestre: dateBimestre,
        subject: selectedClass?.subject || ""
      }, { merge: true });

      await Promise.all([...savePromises, lessonPromise]);
      toast({ title: "Diário Sincronizado", description: "Frequência e conteúdo salvos com sucesso." })
    } catch (err: any) {
      toast({ title: "Falha ao Salvar", description: "Erro nas permissões do Firestore.", variant: "destructive" })
    } finally {
      setIsSaving(false);
    }
  }

  const handleDeleteDayRecords = async () => {
    if (!user || !selectedClassId || !currentDate) return;
    setIsDeleting(true);
    const dateStr = format(currentDate, "yyyy-MM-dd");
    try {
      const deletePromises = existingRecords.map(rec => 
        deleteDoc(doc(firestore, 'teachers', user.uid, 'attendanceRecords', rec.id))
      );
      await Promise.all([
        ...deletePromises,
        deleteDoc(doc(firestore, 'teachers', user.uid, 'lessons', `${selectedClassId}_${dateStr}`))
      ]);
      toast({ title: "Registros Removidos" });
    } catch (err: any) {
      toast({ title: "Erro ao Excluir", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }

  if (!mounted || isUserLoading || !currentDate) return <div className="flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-64">
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label className="text-[10px] font-bold uppercase mb-1 block text-muted-foreground">Turma</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="h-11 shadow-sm"><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name} • {c.subject === 'Portuguese' ? 'Português' : 'Matemática'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-auto">
            <Label className="text-[10px] font-bold uppercase mb-1 block text-muted-foreground">Data da Chamada</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => setCurrentDate(prev => addDays(prev!, -1))}><ChevronLeft /></Button>
              <div className="h-11 px-6 border rounded-md flex items-center justify-center font-black min-w-[200px] bg-slate-50 uppercase text-xs tracking-tighter shadow-inner">
                {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
              </div>
              <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => setCurrentDate(prev => addDays(prev!, 1))}><ChevronRight /></Button>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white">
        {(isStudentsLoading || isRecordsLoading) ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader><TableRow className="bg-muted/10 h-14">
              <TableHead className="w-[80px] text-center font-black uppercase text-[10px]">Nº</TableHead>
              <TableHead className="font-black uppercase text-[10px]">Estudante</TableHead>
              <TableHead className="text-center font-black uppercase text-[10px]">Frequência</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filteredStudents.map((s, idx) => (
                <TableRow key={s.id} className="h-20 hover:bg-slate-50 transition-colors border-b">
                  <TableCell className="text-center font-black text-muted-foreground">{s.callNumber || idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border">
                        {s.photo ? <img src={s.photo} className="h-full w-full object-cover" /> : <UserCircle className="h-8 w-8 text-slate-300" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-primary uppercase">{s.name}</span>
                        <span className="text-[10px] text-muted-foreground font-bold">RA: {s.ra}-{s.raDigit}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-4">
                      <button onClick={() => setAttendance({...attendance, [s.id]: 'present'})} className={cn("w-12 h-12 rounded-full font-black border-2 transition-all shadow-sm", attendance[s.id] === 'present' ? "bg-green-500 border-green-600 text-white scale-110" : "border-slate-200 text-slate-300")}>P</button>
                      <button onClick={() => setAttendance({...attendance, [s.id]: 'absent'})} className={cn("w-12 h-12 rounded-full font-black border-2 transition-all shadow-sm", attendance[s.id] === 'absent' ? "bg-red-500 border-red-600 text-white scale-110" : "border-slate-200 text-slate-300")}>F</button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-6 border-none shadow-md bg-white">
        <div className="flex items-center gap-2 mb-4 text-primary">
          <BookText className="h-5 w-5" />
          <h3 className="font-black uppercase text-xs tracking-widest">Resumo do Conteúdo Ministrado</h3>
        </div>
        <Textarea 
          placeholder="Descreva as competências e habilidades trabalhadas nesta aula..." 
          className="min-h-[120px] bg-slate-50 border-dashed border-2 focus:border-primary" 
          value={contentSummary} 
          onChange={(e) => setContentSummary(e.target.value)} 
        />
        <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase">* Obrigatório para auditoria pedagógica</p>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 md:left-[var(--sidebar-width)] bg-white/95 backdrop-blur-md border-t p-6 flex items-center justify-between shadow-2xl z-50">
        <div className="flex gap-10 px-6">
          <Badge variant="outline" className="h-11 px-4 font-black uppercase text-[10px] tracking-widest bg-blue-50 text-blue-700 border-blue-200">{BIMESTRE_LABELS[dateBimestre || "1"]}</Badge>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-xs font-black uppercase text-slate-600">{Object.values(attendance).filter(v => v === 'present').length} Presentes</span>
          </div>
        </div>
        
        <div className="flex gap-4">
          {isAdmin && existingRecords.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="outline" className="text-destructive border-destructive font-black h-12 uppercase text-[10px]">Limpar Diário</Button></AlertDialogTrigger>
              <AlertDialogContent className="bg-white">
                <AlertDialogHeader><AlertDialogTitle>Apagar registros?</AlertDialogTitle><AlertDialogDescription>Isso removerá a frequência e o resumo de conteúdo deste dia.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteDayRecords} className="bg-destructive">Confirmar</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button onClick={handleSave} disabled={!selectedClassId || isSaving} className="px-12 h-12 font-black shadow-xl uppercase tracking-widest text-xs">
            {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {isSaving ? "Gravando..." : "Salvar Diário"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AttendancePage() {
  return <Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="animate-spin" /></div>}><AttendanceContent /></Suspense>
}
