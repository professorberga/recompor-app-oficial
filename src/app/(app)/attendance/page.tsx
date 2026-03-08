
"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  
  const [selectedClassId, setSelectedClassId] = useState(classIdFromUrl || "")
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [attendance, setAttendance] = useState<AttendanceState>({})
  const { toast } = useToast()

  // Real Firestore Classes
  const classesRef = useMemoFirebase(() => 
    user ? collection(firestore, 'teachers', user.uid, 'classes') : null,
    [user, firestore]
  )
  const { data: classes = [] } = useCollection(classesRef)

  // Estudantes da turma selecionada na nova hierarquia (teachers/{uid}/students)
  const studentsRef = useMemoFirebase(() => {
    if (!user || !selectedClassId) return null;
    return query(
      collection(firestore, 'teachers', user.uid, 'students'), 
      where('classId', '==', selectedClassId)
    );
  }, [user, selectedClassId, firestore]);
  const { data: students = [], isLoading: isStudentsLoading } = useCollection(studentsRef)

  useEffect(() => {
    setMounted(true)
    setCurrentDate(new Date())
  }, [])

  useEffect(() => {
    if (classIdFromUrl) setSelectedClassId(classIdFromUrl)
  }, [classIdFromUrl])

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.ra && s.ra.includes(searchTerm));
      return matchesSearch;
    });
  }, [students, searchTerm]);

  useEffect(() => {
    if (mounted && students.length > 0) {
      const initialState: AttendanceState = {};
      students.forEach(s => { initialState[s.id] = 'present'; });
      setAttendance(initialState);
    }
  }, [students, mounted]);

  const handleSave = async () => {
    if (!user || !selectedClassId || !currentDate) return;

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
        });
      });

      await Promise.all(savePromises);
      toast({ title: "Chamada Registrada", description: `Salva com sucesso no Firestore.` })
    } catch (err) {
      toast({ title: "Erro ao salvar", description: "Verifique as permissões de escrita.", variant: "destructive" })
    }
  }

  const presentCount = Object.values(attendance).filter(v => v === 'present').length
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length

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
              <SelectTrigger className="h-11"><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
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
            <Label className="text-[10px] font-bold uppercase mb-1 block">Data</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => addDays(prev!, -1))}><ChevronLeft /></Button>
              <div className="h-11 px-4 border rounded-md flex items-center justify-center font-medium min-w-[180px] bg-slate-50 uppercase text-xs">
                {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
              </div>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => addDays(prev!, 1))}><ChevronRight /></Button>
            </div>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Filtrar aluno..." className="pl-10 h-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white">
        {isStudentsLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader><TableRow className="bg-muted/10 h-12">
              <TableHead className="w-[50px] text-center font-bold">Nº</TableHead>
              <TableHead className="font-bold">Estudante</TableHead>
              <TableHead className="text-center font-bold">Presença</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filteredStudents.map((s, idx) => (
                <TableRow key={s.id} className="h-16">
                  <TableCell className="text-center font-bold text-muted-foreground">{s.callNumber || idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex flex-col"><span className="font-bold">{s.name}</span><span className="text-[10px] text-muted-foreground">RA: {s.ra}</span></div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-4">
                      <button onClick={() => setAttendance({...attendance, [s.id]: 'present'})} className={cn("w-10 h-10 rounded-full font-black border-2 transition-all", attendance[s.id] === 'present' ? "bg-green-500 border-green-600 text-white" : "border-muted text-muted-foreground")}>P</button>
                      <button onClick={() => setAttendance({...attendance, [s.id]: 'absent'})} className={cn("w-10 h-10 rounded-full font-black border-2 transition-all", attendance[s.id] === 'absent' ? "bg-red-500 border-red-600 text-white" : "border-muted text-muted-foreground")}>F</button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && <TableRow><TableCell colSpan={3} className="h-40 text-center italic opacity-30">Nenhum aluno cadastrado nesta turma.</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="fixed bottom-0 left-0 right-0 md:left-[var(--sidebar-width)] bg-white/90 backdrop-blur-md border-t p-4 flex items-center justify-between shadow-2xl z-50">
        <div className="flex gap-8 px-6">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-sm font-bold">{presentCount} Presentes</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-sm font-bold">{absentCount} Faltas</span></div>
        </div>
        <Button onClick={handleSave} className="px-10 h-12 font-bold shadow-xl" disabled={!selectedClassId || filteredStudents.length === 0}>Salvar Diário</Button>
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
