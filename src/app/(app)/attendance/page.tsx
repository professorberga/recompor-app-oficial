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

const MOCK_STUDENTS = [
  { id: '1', name: 'Ana Beatriz Silva', ra: '123456', raDigit: '7', attendance: 95, enrollments: ['d1', 'd2'] },
  { id: '2', name: 'Bruno Oliveira Souza', ra: '234567', raDigit: '8', attendance: 88, enrollments: ['d1'] },
  { id: '3', name: 'Carlos Eduardo Santos', ra: '345678', raDigit: '9', attendance: 92, enrollments: ['d2'] },
  { id: '4', name: 'Daniela Lima Ferreira', ra: '456789', raDigit: '0', attendance: 78, enrollments: ['d1'] },
  { id: '5', name: 'Eduardo Pereira Costa', ra: '567890', raDigit: '1', attendance: 98, enrollments: ['d1', 'd2'] },
  { id: '6', name: 'Fernanda Rocha Lima', ra: '678901', raDigit: '2', attendance: 90, enrollments: ['d1'] },
  { id: '7', name: 'Gabriel Alvez Martins', ra: '789012', raDigit: '3', attendance: 85, enrollments: ['d2'] },
  { id: '8', name: 'Helena Mendes Castro', ra: '890123', raDigit: '4', attendance: 94, enrollments: ['d1'] },
]

const MOCK_DISCIPLINES = [
  { id: 'd1', name: 'Língua Portuguesa', class: '9º Ano A', schedule: '07:00 às 07:50' },
  { id: 'd2', name: 'Matemática', class: '9º Ano A', schedule: '07:50 às 08:40' },
]

type AttendanceState = Record<string, 'present' | 'absent'>;
type AttendanceHistory = Record<string, AttendanceState>;

export default function AttendancePage() {
  const [mounted, setMounted] = useState(false)
  const [selectedDisciplineId, setSelectedDisciplineId] = useState("d1")
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [attendance, setAttendance] = useState<AttendanceState>({})
  const [history, setHistory] = useState<AttendanceHistory>({})
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    setCurrentDate(new Date())
  }, [])

  useEffect(() => {
    if (!currentDate || !mounted) return;
    const dateKey = `${format(currentDate, "yyyy-MM-dd")}:${selectedDisciplineId}`;
    if (history[dateKey]) {
      setAttendance(history[dateKey]);
    } else {
      const initialState = Object.fromEntries(MOCK_STUDENTS.map(s => [s.id, 'present'])) as AttendanceState;
      setAttendance(initialState);
    }
  }, [currentDate, selectedDisciplineId, history, mounted]);

  const filteredStudents = useMemo(() => {
    return MOCK_STUDENTS.filter(s => {
      const isEnrolled = s.enrollments.includes(selectedDisciplineId);
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.ra.includes(searchTerm);
      return isEnrolled && matchesSearch;
    });
  }, [selectedDisciplineId, searchTerm]);

  const selectedDiscipline = MOCK_DISCIPLINES.find(d => d.id === selectedDisciplineId);

  const setStatus = (id: string, status: 'present' | 'absent') => {
    setAttendance(prev => ({ ...prev, [id]: status }))
  }

  const handleSave = () => {
    if (!currentDate) return
    const dateKey = `${format(currentDate, "yyyy-MM-dd")}:${selectedDisciplineId}`;
    setHistory(prev => ({ ...prev, [dateKey]: { ...attendance } }));
    toast({ title: "Chamada Registrada", description: `Salva para ${selectedDiscipline?.name} em ${format(currentDate, "dd/MM/yyyy")}.` })
  }

  const presentCount = filteredStudents.filter(s => attendance[s.id] === 'present').length
  const absentCount = filteredStudents.filter(s => attendance[s.id] === 'absent').length

  if (!mounted || !currentDate) return null;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-border/50">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="w-full md:w-80">
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block ml-1">Disciplina / Aula</label>
            <Select value={selectedDisciplineId} onValueChange={setSelectedDisciplineId}>
              <SelectTrigger className="bg-muted/30 border-none h-10">
                <SelectValue placeholder="Selecione a disciplina" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_DISCIPLINES.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-bold">{d.name}</span>
                      <span className="text-[10px] opacity-70">{d.class} • {d.schedule}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block ml-1">Data</label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => addDays(prev!, -1))}><ChevronLeft className="h-4 w-4" /></Button>
              <div className="flex items-center gap-2 px-4 h-10 bg-muted/30 rounded-md font-medium min-w-[200px] justify-center text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="capitalize">{format(currentDate, "dd 'de' MMMM", { locale: ptBR })}</span>
              </div>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => addDays(prev!, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Filtrar aluno matriculado..." className="pl-10 h-10 bg-muted/10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-sm font-bold text-primary">{selectedDiscipline?.name} - {selectedDiscipline?.class}</h3>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {selectedDiscipline?.schedule}</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-white">{filteredStudents.length} Alunos Matriculados</Badge>
      </div>

      <Card className="border-none shadow-md bg-white overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b h-12">
                <TableHead className="w-[80px] text-center font-bold text-xs uppercase">Nº</TableHead>
                <TableHead className="font-bold text-xs uppercase">Estudante Matriculado</TableHead>
                <TableHead className="text-center font-bold text-xs uppercase">Freq. Anual</TableHead>
                <TableHead className="w-[200px] text-center font-bold text-xs uppercase">Chamada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student, idx) => (
                <TableRow key={student.id} className="h-16 border-b border-border/40 hover:bg-muted/10 transition-colors">
                  <TableCell className="text-center font-medium text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-left">
                      <Link href={`/students?id=${student.id}`} className="font-semibold text-foreground hover:text-primary hover:underline">{student.name}</Link>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">RA: {student.ra}-{student.raDigit}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={cn("text-[10px] font-bold", student.attendance < 80 ? "border-red-500 text-red-600 bg-red-50" : "border-muted-foreground/20 text-muted-foreground")}>
                      {student.attendance}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-6">
                      <button onClick={() => setStatus(student.id, 'present')} className={cn("w-10 h-10 rounded-full flex items-center justify-center font-black text-lg transition-all border-2", attendance[student.id] === 'present' ? "bg-green-500 border-green-600 text-white scale-110 shadow-lg shadow-green-200" : "bg-white border-muted/50 text-muted-foreground")}>P</button>
                      <button onClick={() => setStatus(student.id, 'absent')} className={cn("w-10 h-10 rounded-full flex items-center justify-center font-black text-lg transition-all border-2", attendance[student.id] === 'absent' ? "bg-red-500 border-red-600 text-white scale-110 shadow-lg shadow-red-200" : "bg-white border-muted/50 text-muted-foreground")}>F</button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && (
                <TableRow><TableCell colSpan={4} className="h-40 text-center text-muted-foreground italic">Nenhum aluno matriculado nesta disciplina.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 md:left-[var(--sidebar-width)] bg-white/80 backdrop-blur-md border-t border-border/50 p-4 z-40 transition-all">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><UserCheck className="h-5 w-5" /></div>
              <div className="flex flex-col"><span className="text-xl font-black text-green-700 leading-none">{presentCount}</span><span className="text-[10px] font-bold text-green-600 uppercase">Presentes</span></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600"><UserX className="h-5 w-5" /></div>
              <div className="flex flex-col"><span className="text-xl font-black text-red-700 leading-none">{absentCount}</span><span className="text-[10px] font-bold text-red-600 uppercase">Faltas</span></div>
            </div>
          </div>
          <Button size="lg" className="px-12 h-12 text-md font-bold gap-3 shadow-xl" onClick={handleSave}><Save className="h-5 w-5" /> Salvar Chamada</Button>
        </div>
      </div>
    </div>
  )
}
