
"use client"

import { useState, useEffect, useMemo } from "react"
import { OverviewCards } from "@/components/dashboard/OverviewCards"
import { EvolutionChart } from "@/components/dashboard/EvolutionChart"
import { AbsenteeCard } from "@/components/dashboard/AbsenteeCard"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase/provider"
import { collection, query, where } from "firebase/firestore"
import { Loader2 } from "lucide-react"

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false)
  const { user, profile, isAdmin, isUserLoading } = useUser()
  const firestore = useFirestore()

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Coleção GLOBAL de Turmas
  const classesRef = useMemoFirebase(() => collection(firestore, 'classes'), [firestore])
  const { data: rawClasses = [] } = useCollection(classesRef)

  // Coleção GLOBAL de Alunos
  const studentsRef = useMemoFirebase(() => collection(firestore, 'students'), [firestore])
  const { data: rawStudents = [] } = useCollection(studentsRef)

  // Cálculos dinâmicos baseados no perfil
  const stats = useMemo(() => {
    if (!profile) return { totalClasses: 0, totalStudents: 0 };
    
    if (isAdmin) {
      return {
        totalClasses: rawClasses.length,
        totalStudents: rawStudents.length
      };
    }

    const assignedClassIds = profile.assignments?.map(a => a.classId) || [];
    const myClasses = rawClasses.filter(c => assignedClassIds.includes(c.id));
    const myStudents = rawStudents.filter(s => assignedClassIds.includes(s.classId));

    return {
      totalClasses: myClasses.length,
      totalStudents: myStudents.length
    };
  }, [profile, isAdmin, rawClasses, rawStudents]);

  const userName = profile?.name || user?.displayName || user?.email?.split('@')[0] || "Professor"

  if (isUserLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Bem-vindo, {userName}
        </h2>
        <p className="text-muted-foreground mt-1">Aqui está o resumo das suas {stats.totalClasses} turmas e {stats.totalStudents} alunos.</p>
      </div>

      <OverviewCards 
        totalClasses={stats.totalClasses} 
        totalStudents={stats.totalStudents} 
      />

      <div className="grid gap-6 md:grid-cols-6">
        <div className="col-span-4">
          {isClient ? (
            <EvolutionChart />
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
                <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Chamada Pendente</span>
                    <Badge variant="outline" className="text-accent border-accent">Urgente</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Lembre-se de registrar a frequência do dia para suas turmas ativas.</p>
                </div>
                
                <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Dados Sincronizados</span>
                    <Badge variant="secondary">Tempo Real</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">As contagens de alunos são atualizadas instantaneamente via Firestore.</p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Planejamento</span>
                    <Badge variant="outline">Aviso</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Acesse a aba Calendário para organizar seus próximos conteúdos.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
