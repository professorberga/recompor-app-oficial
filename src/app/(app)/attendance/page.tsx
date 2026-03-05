"use client"

import { useState } from "react"
import { Check, X, Search, Calendar, ChevronLeft, ChevronRight, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

const MOCK_STUDENTS = [
  { id: '1', name: 'Ana Beatriz Silva', attendance: 95 },
  { id: '2', name: 'Bruno Oliveira Souza', attendance: 88 },
  { id: '3', name: 'Carlos Eduardo Santos', attendance: 92 },
  { id: '4', name: 'Daniela Lima Ferreira', attendance: 78 },
  { id: '5', name: 'Eduardo Pereira Costa', attendance: 98 },
  { id: '6', name: 'Fernanda Rocha Lima', attendance: 90 },
  { id: '7', name: 'Gabriel Alvez Martins', attendance: 85 },
  { id: '8', name: 'Helena Mendes Castro', attendance: 94 },
]

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] = useState("1")
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | null>>(
    Object.fromEntries(MOCK_STUDENTS.map(s => [s.id, 'present']))
  )
  const { toast } = useToast()

  const toggleStatus = (id: string) => {
    setAttendance(prev => ({
      ...prev,
      [id]: prev[id] === 'present' ? 'absent' : 'present'
    }))
  }

  const handleSave = () => {
    toast({
      title: "Chamada Registrada",
      description: `A chamada da Turma 9º Ano A foi salva com sucesso para o dia ${new Date().toLocaleDateString()}.`,
      variant: "default",
      className: "bg-green-50 border-green-200 text-green-900"
    })
  }

  const presentCount = Object.values(attendance).filter(v => v === 'present').length
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Chamada Diária</h2>
          <p className="text-muted-foreground mt-1">Registre a presença dos seus alunos rapidamente.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border font-medium">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Hoje, {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1 border-none shadow-md bg-white h-fit">
          <CardHeader>
            <CardTitle>Filtros & Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Turma</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">9º Ano A - Português</SelectItem>
                  <SelectItem value="2">9º Ano B - Português</SelectItem>
                  <SelectItem value="3">8º Ano A - Matemática</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-green-50 border border-green-100 flex flex-col items-center">
                <span className="text-2xl font-bold text-green-700">{presentCount}</span>
                <span className="text-[10px] text-green-600 font-bold uppercase">Presentes</span>
              </div>
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex flex-col items-center">
                <span className="text-2xl font-bold text-red-700">{absentCount}</span>
                <span className="text-[10px] text-red-600 font-bold uppercase">Ausentes</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-4">A chamada reflete no relatório de evolução do aluno e na frequência escolar obrigatória.</p>
              <Button className="w-full gap-2 shadow-lg" onClick={handleSave}>
                <Save className="h-4 w-4" /> Salvar Chamada
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-md bg-white overflow-hidden">
          <CardHeader className="bg-muted/30 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Lista de Estudantes</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Filtrar por nome..." className="pl-8 h-8 text-xs bg-white border-border" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/10 border-b border-border">
                  <TableHead className="w-[80px] text-center">Nº</TableHead>
                  <TableHead>Estudante</TableHead>
                  <TableHead className="text-center">% Freq. Anual</TableHead>
                  <TableHead className="w-[200px] text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_STUDENTS.map((student, idx) => (
                  <TableRow key={student.id} className="group hover:bg-muted/20 transition-colors h-14">
                    <TableCell className="text-center font-medium text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-semibold">{student.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={student.attendance >= 90 ? "secondary" : "outline"} className={student.attendance < 80 ? "border-red-500 text-red-600" : ""}>
                        {student.attendance}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          size="sm" 
                          variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                          className={`flex-1 h-8 rounded-full ${attendance[student.id] === 'present' ? 'bg-green-600 hover:bg-green-700 shadow-md' : 'text-green-600 border-green-200'}`}
                          onClick={() => setAttendance(prev => ({ ...prev, [student.id]: 'present' }))}
                        >
                          <Check className="h-3 w-3 mr-1" /> Presente
                        </Button>
                        <Button 
                          size="sm" 
                          variant={attendance[student.id] === 'absent' ? 'default' : 'outline'}
                          className={`flex-1 h-8 rounded-full ${attendance[student.id] === 'absent' ? 'bg-red-600 hover:bg-red-700 shadow-md' : 'text-red-600 border-red-200'}`}
                          onClick={() => setAttendance(prev => ({ ...prev, [student.id]: 'absent' }))}
                        >
                          <X className="h-3 w-3 mr-1" /> Ausente
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}