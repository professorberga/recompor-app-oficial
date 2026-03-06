"use client"

import { useState } from "react"
import { Search, Calendar, ChevronLeft, ChevronRight, Save, UserCheck, UserX } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const MOCK_STUDENTS = [
  { id: '1', name: 'Ana Beatriz Silva', ra: '123456', raDigit: '7', attendance: 95 },
  { id: '2', name: 'Bruno Oliveira Souza', ra: '234567', raDigit: '8', attendance: 88 },
  { id: '3', name: 'Carlos Eduardo Santos', ra: '345678', raDigit: '9', attendance: 92 },
  { id: '4', name: 'Daniela Lima Ferreira', ra: '456789', raDigit: '0', attendance: 78 },
  { id: '5', name: 'Eduardo Pereira Costa', ra: '567890', raDigit: '1', attendance: 98 },
  { id: '6', name: 'Fernanda Rocha Lima', ra: '678901', raDigit: '2', attendance: 90 },
  { id: '7', name: 'Gabriel Alvez Martins', ra: '789012', raDigit: '3', attendance: 85 },
  { id: '8', name: 'Helena Mendes Castro', ra: '890123', raDigit: '4', attendance: 94 },
]

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] = useState("1")
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>(
    Object.fromEntries(MOCK_STUDENTS.map(s => [s.id, 'present']))
  )
  const { toast } = useToast()

  const setStatus = (id: string, status: 'present' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [id]: status
    }))
  }

  const handleSave = () => {
    toast({
      title: "Chamada Registrada",
      description: `A chamada foi salva com sucesso para o dia ${new Date().toLocaleDateString()}.`,
      variant: "default",
      className: "bg-green-50 border-green-200 text-green-900 shadow-lg"
    })
  }

  const presentCount = Object.values(attendance).filter(v => v === 'present').length
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-20">
      {/* Header com Filtros e Calendário */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-border/50">
        <div className="space-y-4 flex-1">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-primary">Chamada Diária</h2>
            <p className="text-sm text-muted-foreground">Registre a frequência dos estudantes.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-64">
              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block ml-1">Turma</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="bg-muted/30 border-none h-10">
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">9º Ano A - Português</SelectItem>
                  <SelectItem value="2">9º Ano B - Português</SelectItem>
                  <SelectItem value="3">8º Ano A - Matemática</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block ml-1">Data</label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-10 w-10"><ChevronLeft className="h-4 w-4" /></Button>
                <div className="flex items-center gap-2 px-4 h-10 bg-muted/30 rounded-md border-none font-medium min-w-[180px] justify-center text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span>
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Filtrar por nome..." className="pl-10 h-10 bg-muted/10 border-border" />
        </div>
      </div>

      {/* Lista de Estudantes */}
      <Card className="border-none shadow-md bg-white overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/20 border-b border-border h-12">
                <TableHead className="w-[80px] text-center font-bold text-xs uppercase">Nº</TableHead>
                <TableHead className="font-bold text-xs uppercase">Estudante</TableHead>
                <TableHead className="text-center font-bold text-xs uppercase">Freq. Anual</TableHead>
                <TableHead className="w-[180px] text-center font-bold text-xs uppercase">Chamada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_STUDENTS.map((student, idx) => (
                <TableRow key={student.id} className="group hover:bg-muted/10 transition-colors h-16 border-b border-border/40">
                  <TableCell className="text-center font-medium text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{student.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">RA: {student.ra}-{student.raDigit}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={cn(
                      "text-[10px] h-6 px-2",
                      student.attendance < 80 ? "border-red-500 text-red-600 bg-red-50" : "border-muted-foreground/20"
                    )}>
                      {student.attendance}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-6">
                      {/* Botão P (Presente) */}
                      <button
                        onClick={() => setStatus(student.id, 'present')}
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all shadow-sm border-2",
                          attendance[student.id] === 'present' 
                            ? "bg-green-500 border-green-600 text-white scale-110" 
                            : "bg-white border-muted/50 text-muted-foreground hover:bg-green-50"
                        )}
                        title="Presente"
                      >
                        P
                      </button>
                      
                      {/* Botão F (Falta) */}
                      <button
                        onClick={() => setStatus(student.id, 'absent')}
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all shadow-sm border-2",
                          attendance[student.id] === 'absent' 
                            ? "bg-red-500 border-red-600 text-white scale-110" 
                            : "bg-white border-muted/50 text-muted-foreground hover:bg-red-50"
                        )}
                        title="Falta"
                      >
                        F
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Footer com Resumo e Botão Salvar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-white rounded-xl shadow-lg border-2 border-primary/10 mt-2">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-inner">
              <UserCheck className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-green-700 leading-none">{presentCount}</span>
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">Presentes</span>
            </div>
          </div>
          
          <div className="h-8 w-[1px] bg-border hidden md:block" />

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shadow-inner">
              <UserX className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-red-700 leading-none">{absentCount}</span>
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">Ausentes</span>
            </div>
          </div>
        </div>

        <Button 
          size="lg" 
          className="w-full md:w-auto px-10 h-14 text-lg font-bold gap-3 shadow-[0_4px_14px_0_rgba(var(--primary),0.39)] hover:scale-105 transition-transform" 
          onClick={handleSave}
        >
          <Save className="h-5 w-5" /> Salvar Chamada
        </Button>
      </div>
    </div>
  )
}
