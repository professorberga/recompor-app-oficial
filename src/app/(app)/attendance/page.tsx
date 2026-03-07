"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Search, Calendar, ChevronLeft, ChevronRight, Save, UserCheck, UserX, BookOpen, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Student, Discipline } from "@/lib/types"

const MOCK_STUDENTS: Student[] = [
  { 
    id: '1', 
    name: 'Ana Beatriz Silva', 
    class: '9º Ano A', 
    classId: '1',
    callNumber: '01', 
    ra: '123456', 
    raDigit: '7', 
    status: 'Ativo',
    photo: null,
    enrollments: ['d1', 'd2'],
    history: { attendance: [], assessments: [], occurrences: [], observations: [] }
  },
  { 
    id: '2', 
    name: 'Bruno Oliveira Souza', 
    class: '9º Ano A', 
    classId: '1',
    callNumber: '02', 
    ra: '234567', 
    raDigit: '8', 
    status: 'Ativo',
    photo: null,
    enrollments: ['d1'],
    history: { attendance: [], assessments: [], occurrences: [], observations: [] }
  },
]

const MOCK_DISCIPLINES: Discipline[] = [
  { id: 'd1', name: 'Língua Portuguesa', classId: '1', teacherId: 'prof-1', schedule: '07:00 às 07:50' },
  { id: 'd2', name: 'Matemática', classId: '1', teacherId: 'prof-1', schedule: '07:50 às 08:40' },
]

type AttendanceState = Record<string, 'present' | 'absent'>;

export default function AttendancePage() {
  const [mounted, setMounted] = useState(false)
  const [selectedDisciplineId, setSelectedDisciplineId] = useState("d1")
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [attendance, setAttendance] = useState<AttendanceState>({})
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    setCurrentDate(new Date())
  }, [])

  const selectedDiscipline = MOCK_DISCIPLINES.find(d => d.id === selectedDisciplineId);

  const filteredStudents = useMemo(() => {
    return MOCK_STUDENTS.filter(s => {
      const isEnrolled = s.enrollments.includes(selectedDisciplineId);
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.ra.includes(searchTerm);
      return isEnrolled && matchesSearch;
    });
  }, [selectedDisciplineId, searchTerm]);

  useEffect(() => {
    if (mounted) {
      const initialState: AttendanceState = {};
      filteredStudents.forEach(s => { initialState[s.id] = 'present'; });
      setAttendance(initialState);
    }
  }, [filteredStudents, mounted]);

  const handleSave = () => {
    toast({ title: "Chamada Registrada", description: `Salva para ${selectedDiscipline?.name}.` })
  }

  const presentCount = Object.values(attendance).filter(v => v === 'present').length
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length

  if (!mounted || !currentDate) return null;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-32">
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label className="text-[10px] font-bold uppercase mb-1 block">Disciplina</Label>
            <Select value={selectedDisciplineId} onValueChange={setSelectedDisciplineId}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MOCK_DISCIPLINES.map(d => <SelectItem key={d.id} value={d.id}>{d.name} • {d.schedule}</SelectItem>)}
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
        <Table>
          <TableHeader><TableRow className="bg-muted/10 h-12">
            <TableHead className="w-[50px] text-center font-bold">Nº</TableHead>
            <TableHead className="font-bold">Estudante</TableHead>
            <TableHead className="text-center font-bold">Presença</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filteredStudents.map((s, idx) => (
              <TableRow key={s.id} className="h-16">
                <TableCell className="text-center font-bold text-muted-foreground">{idx + 1}</TableCell>
                <TableCell>
                  <div className="flex flex-col"><span className="font-bold">{s.name}</span><span className="text-[10px] text-muted-foreground">RA: {s.ra}</span></div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-4">
                    <button onClick={() => setAttendance({...attendance, [s.id]: 'present'})} className={cn("w-10 h-10 rounded-full font-black border-2 transition-all", attendance[s.id] === 'present' ? "bg-green-500 border-green-600 text-white" : "border-muted")}>P</button>
                    <button onClick={() => setAttendance({...attendance, [s.id]: 'absent'})} className={cn("w-10 h-10 rounded-full font-black border-2 transition-all", attendance[s.id] === 'absent' ? "bg-red-500 border-red-600 text-white" : "border-muted")}>F</button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredStudents.length === 0 && <TableRow><TableCell colSpan={3} className="h-40 text-center italic opacity-30">Nenhum aluno matriculado nesta disciplina.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 md:left-[var(--sidebar-width)] bg-white/90 backdrop-blur-md border-t p-4 flex items-center justify-between shadow-2xl z-50">
        <div className="flex gap-8 px-6">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-sm font-bold">{presentCount} Presentes</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-sm font-bold">{absentCount} Faltas</span></div>
        </div>
        <Button onClick={handleSave} className="px-10 h-12 font-bold shadow-xl">Salvar Diário</Button>
      </div>
    </div>
  )
}
