
"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { 
  Search, ChevronLeft, ChevronRight, Loader2, UserCircle, 
  CheckCircle2, History, AlertCircle, Trash2, BookText, 
  Save, CalendarOff, NotebookPen 
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { addDays, format, getDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useUser, useFirestore, useMemoFirebase } from "@/firebase/provider"
import { useCollection } from 'react-firebase-hooks/firestore'
import { collection, doc, setDoc, query, where, deleteDoc, getDoc, getDocs } from "firebase/firestore"
import { getBimestreFromDate, BIMESTRE_LABELS } from "@/lib/date-utils"

type AttendanceState = Record<string, 'present' | 'absent'>;

const DAY_NAME_TO_INDEX: Record<string, number> = {
  'domingo': 0,
  'segunda': 1,
  'terça': 2,
  'quarta': 3,
  'quinta': 4,
  'sexta': 5,
  'sábado': 6,
  'segunda-feira': 1,
  'terça-feira': 2,
  'quarta-feira': 3,
  'quinta-feira': 4,
  'sexta-feira': 5,
};

function AttendanceContent() {
  const searchParams = useSearchParams()
  const classIdFromUrl = searchParams.get('class')
  const [mounted, setMounted] = useState(false)
  const { user, profile, schoolConfig, isAdmin, isUserLoading } = useUser()
  const firestore = useFirestore()
  
  const [selectedClassId, setSelectedClassId] = useState(classIdFromUrl || "")
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [attendance, setAttendance] = useState<AttendanceState>({})
  const [contentSummary, setContentSummary] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  
  const [isObsDialogOpen, setIsObsDialogOpen] = useState(false)
  const [obsStudent, setObsStudent] = useState<any>(null)
  const [obsContent, setObsContent] = useState("")
  const [isSavingObs, setIsSavingObs] = useState(false)

  const { toast } = useToast()

  const allowedDayIndices = useMemo(() => {
    if (!profile?.assignments || !selectedClassId) return [];
    return profile.assignments
      .filter(a => a.classId === selectedClassId)
      .map(a => DAY_NAME_TO_INDEX[a.dayOfWeek?.toLowerCase().trim() || ""])
      .filter(idx => idx !== undefined);
  }, [profile, selectedClassId]);

  const isDateValid = useMemo(() => {
    if (!currentDate) return false;
    if (isAdmin) return true;
    if (allowedDayIndices.length === 0) return false;
    return allowedDayIndices.includes(getDay(currentDate));
  }, [currentDate, allowedDayIndices, isAdmin]);

  const currentClass = useMemo(() => {
    if (!profile || !selectedClassId) return null;
    return profile.assignments?.find(a => a.classId === selectedClassId);
  }, [profile, selectedClassId]);

  const globalClassesRef = useMemoFirebase(() => collection(firestore, 'classes'), [firestore])
  const [classesSnap] = useCollection(globalClassesRef)
  const rawClasses = useMemo(() => classesSnap?.docs.map(d => ({ ...d.data(), id: d.id })) || [], [classesSnap])

  const classes = useMemo(() => {
    let list = [];
    if (isAdmin) {
      list = [...rawClasses];
    } else if (profile?.assignments) {
      const assignedIds = profile.assignments.map(a => a.classId);
      list = rawClasses.filter(c => assignedIds.includes(c.id));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [rawClasses, profile, isAdmin]);

  const studentsQuery = useMemoFirebase(() => {
    if (!selectedClassId) return null;
    return query(collection(firestore, 'students'), where('classId', '==', selectedClassId));
  }, [selectedClassId, firestore]);
  
  const [studentsSnap, isStudentsLoading] = useCollection(studentsQuery)
  const rawStudents = useMemo(() => studentsSnap?.docs.map(d => ({ ...d.data(), id: d.id })) || [], [studentsSnap])

  const students = useMemo(() => {
    if (!user || !selectedClassId) return [];
    return rawStudents.filter(s => {
      if (s.enrollments && s.enrollments.length > 0) {
        return s.enrollments.some(e => e.classId === selectedClassId && (isAdmin || e.teacherId === user.uid));
      }
      return true;
    });
  }, [rawStudents, user, selectedClassId, isAdmin]);

  const attendanceRecordsQuery = useMemoFirebase(() => {
    if (!selectedClassId || !currentDate) return null;
    const dateStr = format(currentDate, "yyyy-MM-dd");
    return query(
      collection(firestore, 'attendanceRecords'),
      where('classId', '==', selectedClassId),
      where('date', '==', dateStr),
      where('teacherId', '==', user?.uid)
    );
  }, [selectedClassId, currentDate, firestore, user]);

  const [recordsSnap, isRecordsLoading] = useCollection(attendanceRecordsQuery);
  const existingRecords = useMemo(() => recordsSnap?.docs.map(d => ({ ...d.data(), id: d.id })) || [], [recordsSnap])

  useEffect(() => {
    setMounted(true)
    setCurrentDate(new Date())
  }, [])

  useEffect(() => {
    if (mounted && selectedClassId && currentDate && !isAdmin) {
      if (!allowedDayIndices.includes(getDay(currentDate)) && allowedDayIndices.length > 0) {
        let checkDate = new Date();
        for (let i = 0; i < 7; i++) {
          if (allowedDayIndices.includes(getDay(checkDate))) {
            setCurrentDate(checkDate);
            break;
          }
          checkDate = addDays(checkDate, 1);
        }
      }
    }
  }, [selectedClassId, allowedDayIndices, mounted, isAdmin]);

  useEffect(() => {
    async function loadData() {
      if (!selectedClassId || !currentDate || !user) return;
      const dateStr = format(currentDate, "yyyy-MM-dd");
      
      const lessonId = `${selectedClassId}_${dateStr}_${user.uid}`;
      const snap = await getDoc(doc(firestore, 'lessons', lessonId));
      setContentSummary(snap.exists() ? snap.data().content || "" : "");
    }
    if (mounted && students.length > 0) {
      const newState: AttendanceState = {};
      if (existingRecords.length > 0) {
        existingRecords.forEach(rec => { newState[rec.studentId] = rec.status === 'Presente' ? 'present' : 'absent'; });
      } else {
        students.forEach(s => { newState[s.id] = 'present'; });
      }
      setAttendance(newState);
      loadData();
    }
  }, [existingRecords, students, mounted, currentDate, selectedClassId, firestore, user]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const nameMatch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      const raMatch = s.ra?.includes(searchTerm) ?? false;
      return nameMatch || raMatch;
    }).sort((a, b) => (Number(a.callNumber) || 0) - (Number(b.callNumber) || 0));
  }, [students, searchTerm]);

  const dateBimestre = useMemo(() => currentDate ? getBimestreFromDate(currentDate) : "1", [currentDate]);

  const handleNavigateDate = (direction: number) => {
    if (!currentDate) return;
    let nextDate = addDays(currentDate, direction);
    if (isAdmin) { setCurrentDate(nextDate); return; }
    for (let i = 0; i < 14; i++) {
      if (allowedDayIndices.includes(getDay(nextDate))) { setCurrentDate(nextDate); return; }
      nextDate = addDays(nextDate, direction);
    }
  };

  const handleOpenObs = async (student: any) => {
    if (!currentDate || !user) return;
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const obsId = `${student.id}_${dateStr}_${user.uid}`;
    setObsStudent(student);
    setIsSavingObs(true);
    const snap = await getDoc(doc(firestore, 'studentObservations', obsId));
    setObsContent(snap.exists() ? snap.data().content || "" : "");
    setIsSavingObs(false);
    setIsObsDialogOpen(true);
  };

  const handleSaveObs = async () => {
    if (!obsStudent || !user || !currentDate) return;
    setIsSavingObs(true);
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const obsId = `${obsStudent.id}_${dateStr}_${user.uid}`;
    try {
      await setDoc(doc(firestore, 'studentObservations', obsId), {
        id: obsId,
        studentId: obsStudent.id,
        classId: selectedClassId,
        date: dateStr,
        teacherId: user.uid,
        teacherName: profile?.name || user.email,
        content: obsContent,
        bimestre: dateBimestre
      }, { merge: true });
      setIsObsDialogOpen(false);
      toast({ title: "Observação Salva" });
    } catch (e) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsSavingObs(false);
    }
  };

  const handleSave = async () => {
    if (!user || !selectedClassId || !currentDate || !isDateValid) return;
    if (!contentSummary.trim()) {
      toast({ title: "Resumo Obrigatório", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const lessonId = `${selectedClassId}_${dateStr}_${user.uid}`;
    const selectedClass = classes.find(c => c.id === selectedClassId);
    try {
      const promises = Object.entries(attendance).map(([studentId, status]) => {
        const recordId = `${studentId}_${dateStr}_${user.uid}`;
        return setDoc(doc(firestore, 'attendanceRecords', recordId), {
          id: recordId,
          studentId,
          classId: selectedClassId,
          date: dateStr,
          bimestre: dateBimestre,
          status: status === 'present' ? 'Presente' : 'Falta',
          teacherId: user.uid,
          subject: currentClass?.subject || selectedClass?.subject || ""
        }, { merge: true });
      });
      promises.push(setDoc(doc(firestore, 'lessons', lessonId), {
        id: lessonId,
        classId: selectedClassId,
        className: selectedClass?.name || "",
        date: dateStr,
        teacherId: user.uid,
        content: contentSummary,
        bimestre: dateBimestre,
        subject: currentClass?.subject || selectedClass?.subject || ""
      }, { merge: true }));
      await Promise.all(promises);
      toast({ title: "Diário Sincronizado" });
    } catch (err) {
      toast({ title: "Falha ao Salvar", variant: "destructive" });
    } finally { setIsSaving(false); }
  }

  if (!mounted || isUserLoading || !currentDate) return <div className="flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-64">
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label className="text-[10px] font-bold uppercase mb-1 block text-muted-foreground">Turma Atribuída</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="h-11 shadow-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name} • {c.subject === 'Portuguese' ? 'Português' : 'Matemática'}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] font-bold uppercase mb-1 block text-muted-foreground">Data da Chamada</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => handleNavigateDate(-1)}><ChevronLeft /></Button>
              <div className={cn("h-11 px-6 border rounded-md flex flex-col items-center justify-center font-black min-w-[200px] uppercase text-[10px] shadow-inner", isDateValid ? "bg-slate-50" : "bg-red-50 text-red-600 border-red-200")}>
                <span>{format(currentDate, "dd 'de' MMMM", { locale: ptBR })}</span>
                {!isDateValid && <span className="text-[8px] mt-0.5">Sem aula prevista</span>}
              </div>
              <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => handleNavigateDate(1)}><ChevronRight /></Button>
            </div>
          </div>
        </div>
      </div>

      {!isDateValid && !isAdmin ? (
        <Card className="p-20 flex flex-col items-center justify-center text-center bg-white border-none shadow-md">
          <CalendarOff className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-xl font-black text-primary uppercase">Dia sem Atribuição</h3>
          <p className="text-muted-foreground max-w-xs mt-2 text-sm">Você não tem aulas configuradas para esta turma nesta data.</p>
          <Button variant="outline" className="mt-6 font-bold uppercase text-[10px]" onClick={() => handleNavigateDate(1)}>Ir para o próximo dia de aula</Button>
        </Card>
      ) : (
        <>
          <Card className="border-none shadow-md overflow-hidden bg-white">
            {(isStudentsLoading || isRecordsLoading) ? (
              <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <>
                <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por nome ou RA..." className="h-9 border-none bg-transparent" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Table>
                  <TableHeader><TableRow className="bg-muted/10 h-14">
                    <TableHead className="w-[80px] text-center font-black uppercase text-[10px]">Nº</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Estudante</TableHead>
                    <TableHead className="text-center font-black uppercase text-[10px]">Frequência</TableHead>
                    <TableHead className="text-center font-black uppercase text-[10px]">Ações</TableHead>
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
                            <button onClick={() => setAttendance({...attendance, [s.id]: 'present'})} className={cn("w-12 h-12 rounded-full font-black border-2", attendance[s.id] === 'present' ? "bg-green-500 border-green-600 text-white" : "border-slate-200 text-slate-300")}>P</button>
                            <button onClick={() => setAttendance({...attendance, [s.id]: 'absent'})} className={cn("w-12 h-12 rounded-full font-black border-2", attendance[s.id] === 'absent' ? "bg-red-500 border-red-600 text-white" : "border-slate-200 text-slate-300")}>F</button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenObs(s)} className="h-11 w-11 text-primary hover:bg-primary/10">
                              <NotebookPen className="h-5 w-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </Card>
          {selectedClassId && (
            <>
              <Card className="p-6 border-none shadow-md bg-white">
                <div className="flex items-center gap-2 mb-4 text-primary"><BookText className="h-5 w-5" /><h3 className="font-black uppercase text-xs tracking-widest">Resumo do Conteúdo Ministrado</h3></div>
                <Textarea placeholder="Descreva o conteúdo..." className="min-h-[120px] bg-slate-50" value={contentSummary} onChange={(e) => setContentSummary(e.target.value)} />
              </Card>
              <div className="fixed bottom-0 left-0 right-0 md:left-[var(--sidebar-width)] bg-white/95 backdrop-blur-md border-t p-6 flex items-center justify-between shadow-2xl z-50">
                <div className="flex gap-10 px-6">
                  <Badge variant="outline" className="h-11 px-4 font-black uppercase text-[10px] bg-blue-50 text-blue-700 border-blue-200">{BIMESTRE_LABELS[dateBimestre]}</Badge>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                    <span className="text-xs font-black uppercase text-slate-600">{Object.values(attendance).filter(v => v === 'present').length} Presentes</span>
                  </div>
                </div>
                <Button onClick={handleSave} disabled={!selectedClassId || !isDateValid || isSaving} className="px-12 h-12 font-black shadow-xl uppercase text-xs">
                  {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {isSaving ? "Gravando..." : "Salvar Diário"}
                </Button>
              </div>
            </>
          )}
        </>
      )}

      <Dialog open={isObsDialogOpen} onOpenChange={setIsObsDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 uppercase tracking-tighter">
              <NotebookPen className="h-5 w-5 text-primary" />
              Observação: {obsStudent?.name}
            </DialogTitle>
            <DialogDescription className="font-bold text-[10px] uppercase">Registrar anotação para o dia {currentDate && format(currentDate, "dd/MM")}.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Digite aqui as observações pedagógicas..." 
              className="min-h-[150px]" 
              value={obsContent} 
              onChange={(e) => setObsContent(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsObsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveObs} disabled={isSavingObs} className="min-w-[120px]">
              {isSavingObs ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sincronizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AttendancePage() {
  return <Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="animate-spin" /></div>}><AttendanceContent /></Suspense>
}
