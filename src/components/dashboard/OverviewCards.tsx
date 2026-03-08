
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, CheckSquare, BrainCircuit, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface OverviewCardsProps {
  totalClasses?: number;
  totalStudents?: number;
  avgAttendance?: number;
  bloomEvolution?: number;
}

export function OverviewCards({ 
  totalClasses = 0, 
  totalStudents = 0, 
  avgAttendance = 0, 
  bloomEvolution = 0 
}: OverviewCardsProps) {
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
          <CheckSquare className={cn("h-4 w-4", avgAttendance >= 75 ? "text-green-500" : "text-red-500")} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgAttendance}%</div>
          <p className={cn(
            "text-xs font-medium",
            avgAttendance >= 75 ? "text-green-600" : "text-red-600"
          )}>
            {avgAttendance >= 75 ? "Dentro da meta SP" : "Abaixo da meta"}
          </p>
        </CardContent>
      </Card>
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Evolução Bloom</CardTitle>
          <BrainCircuit className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {bloomEvolution > 0 ? `+${bloomEvolution}` : bloomEvolution}%
            </div>
            {bloomEvolution !== 0 && (
              bloomEvolution > 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">Indicador de Recomposição</p>
        </CardContent>
      </Card>
    </div>
  )
}
