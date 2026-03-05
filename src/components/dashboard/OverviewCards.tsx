"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, CheckSquare, BrainCircuit } from "lucide-react"

export function OverviewCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Turmas Ativas</CardTitle>
          <BookOpen className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">4</div>
          <p className="text-xs text-muted-foreground">+1 em relação ao mês passado</p>
        </CardContent>
      </Card>
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total de Alunos</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">124</div>
          <p className="text-xs text-muted-foreground">Média de 31 por turma</p>
        </CardContent>
      </Card>
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Presença Média</CardTitle>
          <CheckSquare className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">92.4%</div>
          <p className="text-xs text-green-600 font-medium">+2.1% esta semana</p>
        </CardContent>
      </Card>
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Evolução Bloom</CardTitle>
          <BrainCircuit className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+15%</div>
          <p className="text-xs text-muted-foreground">Nível 'Aplicar' atingido por 60%</p>
        </CardContent>
      </Card>
    </div>
  )
}