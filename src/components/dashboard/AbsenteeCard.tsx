
"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, AlertTriangle, ArrowRight } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

// Mantenha vazio ou carregue de /attendanceRecords se houver dados reais.
// Por enquanto, mostramos "Nenhum alerta" se não houver registros.
const REAL_ALERTS: any[] = []

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
                Alertas de Frequência
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <CardDescription>Estudantes com faltas consecutivas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {REAL_ALERTS.length > 0 ? (
                REAL_ALERTS.slice(0, 3).map((student) => (
                  <div key={student.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate max-w-[150px]">{student.name}</span>
                    <Badge variant="destructive" className="h-5 text-[10px] font-bold">
                      {student.absences} Faltas
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-muted-foreground italic">
                  Nenhum alerta crítico no momento.
                </div>
              )}
              {REAL_ALERTS.length > 0 && (
                <div className="pt-2 flex justify-center text-xs font-bold text-primary group-hover:translate-x-1 transition-transform items-center gap-1">
                  Ver lista completa <ArrowRight className="h-3 w-3" />
                </div>
              )}
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
            Alunos com baixa frequência baseada nos diários de classe do Firestore.
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
              {REAL_ALERTS.length > 0 ? (
                REAL_ALERTS.map((student) => (
                  <TableRow key={student.id} className="hover:bg-red-50/30 transition-colors">
                    <TableCell>
                      <Link 
                        href={`/students?id=${student.id}`}
                        className="font-bold hover:text-primary hover:underline transition-colors"
                      >
                        {student.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{student.class}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-lg font-black text-red-600">{student.absences}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="text-[10px] uppercase border-red-500 text-red-600 bg-red-50">
                        Atenção
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 opacity-30 italic">
                    Nenhum dado de ausência encontrado nas suas turmas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
