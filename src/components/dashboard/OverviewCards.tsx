
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, CheckSquare, BrainCircuit } from "lucide-react"

interface OverviewCardsProps {
  totalClasses?: number;
  totalStudents?: number;
}

export function OverviewCards({ totalClasses = 0, totalStudents = 0 }: OverviewCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Turmas Ativas</CardTitle>
          <BookOpen className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalClasses}</div>
          <p className="text-xs text-muted-foreground">Registradas no Firestore</p>
        </CardContent>
      </Card>
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total de Alunos</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalStudents}</div>
          <p className="text-xs text-muted-foreground">Em todas as turmas</p>
        </CardContent>
      </Card>
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Presença Média</CardTitle>
          <CheckSquare className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">94.2%</div>
          <p className="text-xs text-green-600 font-medium">Bimestre atual</p>
        </CardContent>
      </Card>
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Evolução Bloom</CardTitle>
          <BrainCircuit className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+18%</div>
          <p className="text-xs text-muted-foreground">Indicador de Recomposição</p>
        </CardContent>
      </Card>
    </div>
  )
}
