
"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Users, AlertTriangle, ArrowRight, Loader2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUser, useFirestore, useMemoFirebase } from "@/firebase/provider"
import { collection } from "firebase/firestore"
import { useCollection } from 'react-firebase-hooks/firestore'

export function AbsenteeCard() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, profile, isAdmin } = useUser()
  const firestore = useFirestore()

  const attendanceRef = useMemoFirebase(() => collection(firestore, 'attendanceRecords'), [firestore])
  const studentsRef = useMemoFirebase(() => collection(firestore, 'students'), [firestore])

  const [attendanceSnap, isAttendanceLoading] = useCollection(attendanceRef)
  const [studentsSnap] = useCollection(studentsRef)

  const attendance = useMemo(() => attendanceSnap?.docs.map(d => ({ ...d.data(), id: d.id })) || [], [attendanceSnap])
  const students = useMemo(() => studentsSnap?.docs.map(d => ({ ...d.data(), id: d.id })) || [], [studentsSnap])

  const alerts = useMemo(() => {
    if (!profile || !user) return [];

    const absences = attendance.filter(r => 
      r.status === 'Falta' && (isAdmin || r.teacherId === user.uid)
    );
    
    const studentAbsenceCount: Record<string, number> = {};
    absences.forEach(r => {
      studentAbsenceCount[r.studentId] = (studentAbsenceCount[r.studentId] || 0) + 1;
    });

    return Object.entries(studentAbsenceCount)
      .map(([studentId, count]) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return null;
        
        const isMatriculado = isAdmin || student.enrollments?.some(e => e.teacherId === user.uid);
        if (!isMatriculado) return null;
        
        return {
          id: student.id,
          name: student.name,
          class: student.class,
          classId: student.classId,
          absences: count
        };
      })
      .filter(a => a !== null && a.absences >= 3)
      .sort((a, b) => b!.absences - a!.absences);
  }, [attendance, students, profile, user, isAdmin]);

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
            <CardDescription>Estudantes com faltas acumuladas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isAttendanceLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
              ) : alerts.length > 0 ? (
                alerts.slice(0, 3).map((student: any) => (
                  <div key={student.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate max-w-[150px] uppercase text-[10px]">{student.name}</span>
                    <Badge variant="destructive" className="h-5 text-[9px] font-black uppercase">
                      {student.absences} Faltas
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-[10px] font-black uppercase text-muted-foreground opacity-30 italic">
                  Nenhum alerta crítico.
                </div>
              )}
              {alerts.length > 0 && (
                <div className="pt-2 flex justify-center text-[9px] font-black uppercase text-primary group-hover:translate-x-1 transition-transform items-center gap-1">
                  Ver lista completa <ArrowRight className="h-3 w-3" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-red-600 flex items-center gap-2 uppercase tracking-tighter">
            <AlertTriangle className="h-6 w-6" />
            Ausências Críticas
          </DialogTitle>
          <DialogDescription className="font-bold text-xs uppercase">
            Alunos com 3 ou mais faltas registradas.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] mt-4 pr-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-black uppercase text-[10px]">Estudante</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Turma</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px]">Faltas</TableHead>
                <TableHead className="text-right font-black uppercase text-[10px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.length > 0 ? (
                alerts.map((student: any) => (
                  <TableRow key={student.id} className="hover:bg-red-50/30 transition-colors">
                    <TableCell>
                      <Link 
                        href={`/students?class=${student.classId}`}
                        className="font-black text-xs uppercase hover:text-primary transition-colors"
                      >
                        {student.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[10px] font-bold uppercase">{student.class}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-lg font-black text-red-600">{student.absences}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="text-[9px] font-black uppercase border-red-500 text-red-600 bg-red-50">
                        Risco de Evasão
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 opacity-30 italic font-black uppercase text-xs tracking-widest">
                    Tudo em ordem.
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
