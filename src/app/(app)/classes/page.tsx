"use client"

import { Plus, Search, BookOpen, GraduationCap } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import Link from "next/link"

const MOCK_CLASSES = [
  { id: '1', name: '9º Ano A', subject: 'Portuguese', students: 32, iconColor: 'bg-primary' },
  { id: '2', name: '9º Ano B', subject: 'Portuguese', students: 28, iconColor: 'bg-primary' },
  { id: '3', name: '8º Ano A', subject: 'Math', students: 30, iconColor: 'bg-accent' },
  { id: '4', name: '8º Ano B', subject: 'Math', students: 34, iconColor: 'bg-accent' },
]

export default function ClassesPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredClasses = MOCK_CLASSES.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Suas Turmas</h2>
          <p className="text-muted-foreground mt-1">Gerencie suas salas de aula e estudantes.</p>
        </div>
        <Button className="gap-2 shadow-lg">
          <Plus className="h-4 w-4" /> Nova Turma
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome da turma..." 
            className="pl-10 bg-muted/30 border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClasses.map((cls) => (
          <Card key={cls.id} className="border-none shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className={`h-2 ${cls.iconColor}`} />
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className={`h-12 w-12 rounded-lg ${cls.iconColor} flex items-center justify-center text-white shadow-inner`}>
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{cls.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                    {cls.subject === 'Portuguese' ? 'Português' : 'Matemática'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  <span>{cls.students} Alunos</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 p-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href={`/students?class=${cls.id}`}>Ver Alunos</Link>
              </Button>
              <Button size="sm" className="flex-1" asChild>
                <Link href={`/attendance?class=${cls.id}`}>Fazer Chamada</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}