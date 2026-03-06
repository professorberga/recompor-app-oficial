"use client"

import { Plus, Search, BookOpen, GraduationCap, UserCircle, X } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const INITIAL_CLASSES = [
  { id: '1', name: '9º Ano A', subject: 'Portuguese', students: 32, iconColor: 'bg-primary', teacher: 'Prof. Ricardo Silva' },
  { id: '2', name: '9º Ano B', subject: 'Portuguese', students: 28, iconColor: 'bg-primary', teacher: 'Prof. Ricardo Silva' },
  { id: '3', name: '8º Ano A', subject: 'Math', students: 30, iconColor: 'bg-accent', teacher: 'Profa. Marina Costa' },
  { id: '4', name: '8º Ano B', subject: 'Math', students: 34, iconColor: 'bg-accent', teacher: 'Profa. Marina Costa' },
]

export default function ClassesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [classes, setClasses] = useState(INITIAL_CLASSES)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const [newClass, setNewClass] = useState({
    name: "",
    subject: "Portuguese" as "Portuguese" | "Math",
    teacher: "Prof. Ricardo Silva",
    students: "0"
  })

  // Failsafe para evitar UI Freeze ao fechar o diálogo
  useEffect(() => {
    if (!isDialogOpen) {
      const timer = setTimeout(() => {
        if (typeof document !== 'undefined') {
          document.body.style.pointerEvents = "auto";
          document.body.style.overflow = "auto";
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isDialogOpen]);

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newClass.name || !newClass.teacher) {
      toast({
        title: "Erro no cadastro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      })
      return
    }

    const createdClass = {
      id: Math.random().toString(36).substr(2, 9),
      name: newClass.name,
      subject: newClass.subject,
      students: parseInt(newClass.students) || 0,
      teacher: newClass.teacher,
      iconColor: newClass.subject === 'Portuguese' ? 'bg-primary' : 'bg-accent'
    }

    setClasses([createdClass, ...classes])
    setIsDialogOpen(false)
    setNewClass({ name: "", subject: "Portuguese", teacher: "Prof. Ricardo Silva", students: "0" })
    
    toast({
      title: "Turma criada!",
      description: `A turma ${createdClass.name} foi adicionada com sucesso.`,
    })
  }

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.teacher.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Suas Turmas</h2>
          <p className="text-muted-foreground mt-1">Gerencie suas salas de aula e estudantes.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg">
              <Plus className="h-4 w-4" /> Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Turma</DialogTitle>
              <DialogDescription>
                Informe os detalhes da nova sala de aula para o sistema.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateClass} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Turma</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: 7º Ano C" 
                  value={newClass.name}
                  onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Disciplina</Label>
                <Select 
                  value={newClass.subject} 
                  onValueChange={(v: any) => setNewClass({...newClass, subject: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a matéria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Portuguese">Português</SelectItem>
                    <SelectItem value="Math">Matemática</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher">Docente Responsável</Label>
                <Input 
                  id="teacher" 
                  placeholder="Nome do professor" 
                  value={newClass.teacher}
                  onChange={(e) => setNewClass({...newClass, teacher: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="students">Quantidade de Alunos (Estimativa)</Label>
                <Input 
                  id="students" 
                  type="number"
                  value={newClass.students}
                  onChange={(e) => setNewClass({...newClass, students: e.target.value})}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full">Criar Turma</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome da turma ou professor..." 
            className="pl-10 bg-muted/30 border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClasses.map((cls) => (
          <Card key={cls.id} className="border-none shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white">
            <div className={`h-2 ${cls.iconColor}`} />
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-3">
              <div className={`h-12 w-12 rounded-lg ${cls.iconColor} flex items-center justify-center text-white shadow-inner`}>
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <CardTitle className="text-xl group-hover:text-primary transition-colors truncate">{cls.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                    {cls.subject === 'Portuguese' ? 'Português' : 'Matemática'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-primary/60" />
                  <span className="font-medium text-foreground/80 truncate">Docente: {cls.teacher}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary/60" />
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

        {filteredClasses.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-30">
            <BookOpen className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-medium">Nenhuma turma encontrada.</p>
          </div>
        )}
      </div>
    </div>
  )
}
