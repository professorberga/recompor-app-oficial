
"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Loader2, UserCircle, CheckCircle2, History } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase/provider"
import { collection, doc, setDoc, query, where } from "firebase/firestore"

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
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Real Firestore Classes
  const classesRef = useMemoFirebase(() => 
    user ? collection(firestore, 'teachers', user.uid, 'classes') : null,
    [user, firestore]
  )
  const { data: rawClasses = [] } = useCollection(classesRef)

  // Filtra as turmas com base nas atribuições feitas pelo Admin
  const classes = useMemo(() => {
    if (isAdmin) return rawClasses;
    if (profile?.assignments && profile.assignments.length > 0) {
      const assignedIds = profile.assignments.map(a => a.classId);
      return rawClasses.filter(c => assignedIds.includes(c.id));
    }
    return rawClasses;
  }, [rawClasses, profile, isAdmin]);

  // Busca estudantes na subcoleção do professor filtrando pela turma selecionada
  const studentsRef = useMemoFirebase(() => {
    if (!user || !selectedClassId) return null;
    return query(
      collection(firestore, 'teachers', user.uid, 'students'), 
      where('classId', '==', selectedClassId)
    );
  }, [user, selectedClassId, firestore]);
  
  const { data: students = [], isLoading: isStudentsLoading } = useCollection(studentsRef)

  // Busca registros de presença para a data e turma selecionadas
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

  useEffect(() => {
    if (mounted && students.length > 0) {
      const newState: AttendanceState = {};
      
      if (existingRecords.length > 0) {
        existingRecords.forEach(rec => {
          newState[rec.studentId] = rec.status === 'Presente' ? 'present' : 'absent';
        });
      } else {
        students.forEach(s => { 
          newState[s.id] = 'present'; 
        });
      }
      setAttendance(newState);
    }
  }, [existingRecords, students, mounted, currentDate]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const nameMatch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      const raMatch = s.ra?.includes(searchTerm) ?? false;
      return nameMatch || raMatch;
    }).sort((a, b) => (a.callNumber || 0) - (b.callNumber || 0));
  }, [students, searchTerm]);

  const handleSave = async () => {
    if (!user || !selectedClassId || !currentDate) return;

    setIsSaving(true);
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const recordsColRef = collection(firestore, 'teachers', user.uid, 'attendanceRecords');
    
    try {
      const savePromises = Object.entries(attendance).map(([studentId, status]) => {
        const recordId = `${studentId}_${dateStr}`;
        return setDoc(doc(recordsColRef, recordId), {
          id: recordId,
          studentId,
          classId: selectedClassId,
          date: dateStr,
          status: status === 'present' ? 'Presente' : 'Falta',
          recordedByTeacherId: user.uid
        }, { merge: true });
      });

      await Promise.all(savePromises);
      toast({ title: "Diário Gravado", description: `Chamada do dia ${format(currentDate, "dd/MM")} salva no Firestore.` })
    } catch (err: any) {
      toast({ title: "Falha ao Salvar", description: "Erro nas permissões do Firestore.", variant: "destructive" })
    } finally {
      setIsSaving(false);
    }
  }

  const presentCount = Object.values(attendance).filter(v => v === 'present').length
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length
  const hasRecords = existingRecords.length > 0;

  if (!mounted || isUserLoading || !currentDate) return (
    <div className="flex items-center justify-center p-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-32">
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label className="text-[10px] font-bold uppercase mb-1 block">Turma</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="h-11 shadow-sm"><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} • {c.subject === 'Portuguese' ? 'Português' : 'Matemática'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] font-bold uppercase mb-1 block">Data da Chamada</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => setCurrentDate(prev => addDays(prev!, -1))}><ChevronLeft /></Button>
              <div className="h-11 px-4 border rounded-md flex items-center justify-center font-black min-w-[180px] bg-slate-50 uppercase text-xs tracking-tighter">
                {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
              </div>
              <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => setCurrentDate(prev => addDays(prev!, 1))}><ChevronRight /></Button>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filtrar aluno por nome ou RA..." 
              className="pl-10 h-11 bg-white" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          {selectedClassId && (
            <Badge variant={hasRecords ? "default" : "outline"} className={cn("h-11 px-4 font-bold uppercase text-[10px] tracking-widest", hasRecords ? "bg-green-600 hover:bg-green-700" : "text-amber-600 border-amber-600 bg-amber-50")}>
              {hasRecords ? (
                <><CheckCircle2 className="h-3 w-3 mr-2" /> Chamada Realizada</>
              ) : (
                <><History className="h-3 w-3 mr-2" /> Nova Chamada</>
              )}
            </Badge>
          )}
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
              <TableHead className="text-center font-black uppercase text-[10px]">Status de Presença</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filteredStudents.map((s, idx) => (
                <TableRow key={s.id} className="h-20 hover:bg-slate-50 transition-colors">
                  <TableCell className="text-center font-black text-muted-foreground">{s.callNumber || idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                        {s.photo ? (
                          <img src={s.photo} alt={s.name} className="h-full w-full object-cover" />
                        ) : (
                          <UserCircle className="h-8 w-8 text-slate-300" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-primary uppercase">{s.name}</span>
                        <span className="text-[10px] text-muted-foreground font-bold">RA: {s.ra}-{s.raDigit}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-4">
                      <button 
                        onClick={() => setAttendance({...attendance, [s.id]: 'present'})} 
                        className={cn(
                          "w-12 h-12 rounded-full font-black border-2 transition-all shadow-sm", 
                          attendance[s.id] === 'present' 
                            ? "bg-green-500 border-green-600 text-white scale-110" 
                            : "border-slate-200 text-slate-300 hover:border-green-200"
                        )}
                      >
                        P
                      </button>
                      <button 
                        onClick={() => setAttendance({...attendance, [s.id]: 'absent'})} 
                        className={cn(
                          "w-12 h-12 rounded-full font-black border-2 transition-all shadow-sm", 
                          attendance[s.id] === 'absent' 
                            ? "bg-red-500 border-red-600 text-white scale-110" 
                            : "border-slate-200 text-slate-300 hover:border-red-200"
                        )}
                      >
                        F
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-60 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <Search className="h-12 w-12 mb-4" />
                      <p className="font-bold uppercase tracking-widest text-xs">
                        {!selectedClassId ? "Selecione uma turma para iniciar" : "Nenhum aluno encontrado"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="fixed bottom-0 left-0 right-0 md:left-[var(--sidebar-width)] bg-white/95 backdrop-blur-md border-t p-4 flex items-center justify-between shadow-2xl z-50">
        <div className="flex gap-10 px-6">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm" />
            <span className="text-xs font-black uppercase text-slate-600">{presentCount} Presentes</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm" />
            <span className="text-xs font-black uppercase text-slate-600">{absentCount} Faltas</span>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!selectedClassId || students.length === 0 || isSaving} 
          className="px-12 h-12 font-black shadow-xl uppercase tracking-widest text-xs transition-all hover:scale-105"
        >
          {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
          {isSaving ? "Gravando..." : "Salvar no Firestore"}
        </Button>
      </div>
    </div>
  )
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <AttendanceContent />
    </Suspense>
  )
}
