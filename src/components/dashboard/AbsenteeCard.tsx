"use client"

import { useState } from "react"
import { Users, AlertTriangle, ArrowRight } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

const MOCK_ABSENTEES = [
  { id: '4', name: 'Daniela Lima Ferreira', absences: 12, class: '9º Ano B', trend: 'increasing' },
  { id: '7', name: 'Gabriel Alvez Martins', absences: 8, class: '9º Ano A', trend: 'stable' },
  { id: '2', name: 'Bruno Oliveira Souza', absences: 7, class: '9º Ano A', trend: 'decreasing' },
  { id: '10', name: 'Mariana Silva Costa', absences: 6, class: '8º Ano A', trend: 'increasing' },
  { id: '12', name: 'João Victor Santos', absences: 5, class: '9º Ano B', trend: 'stable' },
]

export function AbsenteeCard() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="border-none shadow-md bg-white cursor-pointer hover:shadow-lg transition-all group overflow-hidden border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-red-500" />
                Alunos em Alerta (Faltas)
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
            </div>
            <CardDescription>Clique para ver detalhes das ausências</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_ABSENTEES.slice(0, 3).map((student) => (
                <div key={student.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[150px]">{student.name}</span>
                  <Badge variant="destructive" className="h-5 text-[10px] font-bold">
                    {student.absences} Faltas
                  </Badge>
                </div>
              ))}
              <div className="pt-2 flex justify-center text-xs font-bold text-primary group-hover:translate-x-1 transition-transform items-center gap-1">
                Ver lista completa <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Relatório de Ausências Críticas
          </DialogTitle>
          <DialogDescription>
            Alunos com mais de 5 faltas registradas no bimestre atual.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] mt-4 pr-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-bold uppercase text-[10px]">Estudante</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Turma</TableHead>
                <TableHead className="text-center font-bold uppercase text-[10px]">Total de Faltas</TableHead>
                <TableHead className="text-right font-bold uppercase text-[10px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_ABSENTEES.map((student) => (
                <TableRow key={student.id} className="hover:bg-red-50/30 transition-colors">
                  <TableCell className="font-bold">{student.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{student.class}</TableCell>
                  <TableCell className="text-center">
                    <span className="text-lg font-black text-red-600">{student.absences}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={`text-[10px] uppercase ${
                      student.trend === 'increasing' ? 'border-red-500 text-red-600 bg-red-50' : 
                      student.trend === 'decreasing' ? 'border-green-500 text-green-600 bg-green-50' : 
                      'border-muted-foreground/30 text-muted-foreground'
                    }`}>
                      {student.trend === 'increasing' ? 'Em Alta' : student.trend === 'decreasing' ? 'Em Queda' : 'Estável'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
