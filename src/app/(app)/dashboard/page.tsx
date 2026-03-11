
"use client"

import { useState, useEffect, useMemo } from "react"
import { OverviewCards } from "@/components/dashboard/OverviewCards"
import { EvolutionChart } from "@/components/dashboard/EvolutionChart"
import { AbsenteeCard } from "@/components/dashboard/AbsenteeCard"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUser, useFirestore, useMemoFirebase } from "@/firebase/provider"
import { collection } from "firebase/firestore"
import { useCollection } from 'react-firebase-hooks/firestore'
import { Loader2 } from "lucide-react"

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false)
  const { user, profile, isAdmin, isUserLoading } = useUser()
  const firestore = useFirestore()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const classesRef = useMemoFirebase(() => collection(firestore, 'classes'), [firestore])
  const studentsRef = useMemoFirebase(() => collection(firestore, 'students'), [firestore])
  const attendanceRef = useMemoFirebase(() => collection(firestore, 'attendanceRecords'), [firestore])
  const assessmentsRef = useMemoFirebase(() => collection(firestore, 'assessments'), [firestore])

  const [classesSnap] = useCollection(classesRef)
  const [studentsSnap] = useCollection(studentsRef)
  const [attendanceSnap] = useCollection(attendanceRef)
  const [assessmentsSnap] = useCollection(assessmentsRef)

  const rawClasses = useMemo(() => classesSnap?.docs.map(d => ({ ...d.data(), id: d.id })) || [], [classesSnap])
  const rawStudents = useMemo(() => studentsSnap?.docs.map(d => ({ ...d.data(), id: d.id })) || [], [studentsSnap])
  const rawAttendance = useMemo(() => attendanceSnap?.docs.map(d => ({ ...d.data(), id: d.id })) || [], [attendanceSnap])
  const rawAssessments = useMemo(() => assessmentsSnap?.docs.map(d => ({ ...d.data(), id: d.id })) || [], [assessmentsSnap])

  const dashboardData = useMemo(() => {
    if (!profile) return { totalClasses: 0, totalStudents: 0, avgAttendance: 0, bloomEvolution: 0, chartData: [] };
    
    let filteredClasses = rawClasses;
    let filteredStudents = rawStudents;
    let filteredAttendance = rawAttendance;
    let filteredAssessments = rawAssessments;

    if (!isAdmin) {
      const assignedClassIds = profile.assignments?.map(a => a.classId) || [];
      filteredClasses = rawClasses.filter(c => assignedClassIds.includes(c.id));
      filteredStudents = rawStudents.filter(s => assignedClassIds.includes(s.classId));
      filteredAttendance = rawAttendance.filter(r => assignedClassIds.includes(r.classId));
      filteredAssessments = rawAssessments.filter(a => a.classIds.some(id => assignedClassIds.includes(id)));
    }

    const totalAttendanceDocs = filteredAttendance.length;
    const presentCount = filteredAttendance.filter(r => r.status === 'Presente').length;
    const avgAttendance = totalAttendanceDocs > 0 ? Math.round((presentCount / totalAttendanceDocs) * 100) : 0;

    const chartData = filteredAssessments
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(a => {
        const grades = Object.values(a.grades || {});
        const avg = grades.length > 0 ? grades.reduce((acc, val) => acc + val, 0) / grades.length : 0;
        return {
          month: new Date(a.date).toLocaleDateString('pt-BR', { month: 'short' }),
          value: Math.round(avg * 10)
        }
      });

    let bloomEvolution = 0;
    if (chartData.length >= 2) {
      bloomEvolution = chartData[chartData.length - 1].value - chartData[chartData.length - 2].value;
    }

    return {
      totalClasses: filteredClasses.length,
      totalStudents: filteredStudents.length,
      avgAttendance,
      bloomEvolution,
      chartData
    };
  }, [profile, isAdmin, rawClasses, rawStudents, rawAttendance, rawAssessments]);

  const userName = profile?.name || user?.displayName || user?.email?.split('@')[0] || "Professor"

  if (isUserLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Bem-vindo, {userName}
        </h2>
        <p className="text-muted-foreground mt-1">
          {dashboardData.totalClasses > 0 
            ? `Resumo das suas ${dashboardData.totalClasses} turmas e ${dashboardData.totalStudents} alunos.`
            : "Sistema pronto para novas atribuições."
          }
        </p>
      </div>

      <OverviewCards 
        totalClasses={dashboardData.totalClasses} 
        totalStudents={dashboardData.totalStudents}
        avgAttendance={dashboardData.avgAttendance}
        bloomEvolution={dashboardData.bloomEvolution}
      />

      <div className="grid gap-6 md:grid-cols-6">
        <div className="col-span-4">
          {isClient ? (
            <EvolutionChart data={dashboardData.chartData} />
          ) : (
            <Card className="border-none shadow-md bg-white h-[450px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Preparando indicadores...</p>
              </div>
            </Card>
          )}
        </div>
        
        <div className="col-span-2 flex flex-col gap-6">
          <AbsenteeCard />
          
          <Card className="border-none shadow-md bg-white flex-1">
            <CardHeader>
              <CardTitle className="text-lg">Ações Recomendadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.totalClasses === 0 ? (
                  <div className="p-4 rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 text-center">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Aguardando Turmas</p>
                    <p className="text-[10px] text-muted-foreground mt-1">O coordenador ainda não atribuiu turmas ao seu perfil.</p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">Chamada do Dia</span>
                        <Badge variant="outline" className="text-accent border-accent">Pendente</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Lembre-se de registrar a frequência das turmas ativas.</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
