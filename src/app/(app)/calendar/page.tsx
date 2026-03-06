"use client"

import { useState, useEffect } from "react"
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, BookOpen, Clock, Search, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

const MOCK_INITIAL_EVENTS = [
  { id: '1', title: 'Interpretação de Texto', time: '08:00 - 09:30', classId: '1', class: '9º Ano A', type: 'Lesson', content: 'Revisão para a prova bimestral focando em análise de textos literários contemporâneos.' },
  { id: '2', title: 'Sintaxe e Gramática', time: '10:00 - 11:30', classId: '2', class: '9º Ano B', type: 'Lesson', content: 'Estudo aprofundado de orações subordinadas e concordância verbal.' },
  { id: '3', title: 'Plantão de Dúvidas', time: '14:00 - 15:00', classId: 'all', class: 'Geral', type: 'Support', content: 'Atendimento individual para esclarecimento de dúvidas sobre o projeto de leitura.' },
]

export default function CalendarPage() {
  const [selectedClass, setSelectedClass] = useState("all")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState("")
  const [events, setEvents] = useState(MOCK_INITIAL_EVENTS)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  // Form State
  const [newEvent, setNewEvent] = useState({
    title: "",
    time: "08:00 - 09:30",
    classId: "1",
    type: "Lesson" as "Lesson" | "Support",
    content: ""
  })

  // Failsafe para restaurar interatividade após fechar diálogo
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

  const handlePrevDay = () => {
    setCurrentDate(prev => addDays(prev, -1))
  }

  const handleNextDay = () => {
    setCurrentDate(prev => addDays(prev, 1))
  }

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newEvent.title || !newEvent.content) {
      toast({
        title: "Campos incompletos",
        description: "Por favor, preencha o título e o conteúdo do planejamento.",
        variant: "destructive"
      })
      return
    }

    const className = newEvent.classId === 'all' ? 'Geral' : 
                    newEvent.classId === '1' ? '9º Ano A' : 
                    newEvent.classId === '2' ? '9º Ano B' : '8º Ano A'

    const createdEvent = {
      id: Math.random().toString(36).substr(2, 9),
      ...newEvent,
      class: className
    }

    setEvents([createdEvent, ...events])
    setIsDialogOpen(false)
    setNewEvent({ title: "", time: "08:00 - 09:30", classId: "1", type: "Lesson", content: "" })
    
    toast({
      title: "Planejamento Criado!",
      description: `A aula "${createdEvent.title}" foi agendada com sucesso.`,
    })
  }

  const filteredEvents = events.filter(event => {
    const matchesClass = selectedClass === "all" || event.classId === selectedClass || event.classId === "all"
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesClass && matchesSearch
  })

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Calendário & Conteúdos</h2>
          <p className="text-muted-foreground mt-1">Planeje suas aulas e gerencie o cronograma curricular.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg">
              <Plus className="h-4 w-4" /> Novo Planejamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white">
            <DialogHeader>
              <DialogTitle>Novo Registro de Conteúdo</DialogTitle>
              <DialogDescription>
                Adicione um novo tema ou atividade ao cronograma de {format(currentDate, "dd/MM/yyyy")}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Aula/Atividade</Label>
                <Input 
                  id="title" 
                  placeholder="Ex: Revisão de Orações Coordenadas" 
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class">Turma</Label>
                  <Select 
                    value={newEvent.classId} 
                    onValueChange={(v) => setNewEvent({...newEvent, classId: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">9º Ano A</SelectItem>
                      <SelectItem value="2">9º Ano B</SelectItem>
                      <SelectItem value="3">8º Ano A</SelectItem>
                      <SelectItem value="all">Geral / Apoio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Input 
                    id="time" 
                    placeholder="08:00 - 09:30" 
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Atividade</Label>
                <Select 
                  value={newEvent.type} 
                  onValueChange={(v: any) => setNewEvent({...newEvent, type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lesson">Aula Regular</SelectItem>
                    <SelectItem value="Support">Apoio Pedagógico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo / Descrição do Plano</Label>
                <Textarea 
                  id="content" 
                  placeholder="Descreva os tópicos que serão abordados..." 
                  className="min-h-[100px]"
                  value={newEvent.content}
                  onChange={(e) => setNewEvent({...newEvent, content: e.target.value})}
                  required
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full">Salvar Planejamento</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-border/50">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="w-full md:w-72">
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block ml-1">Filtrar Turma</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="bg-muted/30 border-none h-10">
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Turmas</SelectItem>
                <SelectItem value="1">9º Ano A - Português</SelectItem>
                <SelectItem value="2">9º Ano B - Português</SelectItem>
                <SelectItem value="3">8º Ano A - Matemática</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block ml-1">Data de Referência</label>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10"
                onClick={handlePrevDay}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-4 h-10 bg-muted/30 rounded-md border-none font-medium min-w-[220px] justify-center text-sm">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span className="capitalize">
                  {format(currentDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10"
                onClick={handleNextDay}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar conteúdo..." 
            className="pl-10 h-10 bg-muted/10 border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle>Cronograma do Dia</CardTitle>
              <CardDescription>
                {selectedClass === "all" ? "Exibindo todas as aulas para este dia" : `Exibindo cronograma da turma selecionada`}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {filteredEvents.length} Atividades
            </Badge>
          </CardHeader>
          <CardContent className="pt-6">
            <ScrollArea className="h-auto pr-4">
              <div className="space-y-8">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="relative pl-8 pb-8 border-l-2 border-primary/20 last:pb-0 group">
                    <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-white border-2 border-primary group-hover:bg-primary transition-colors shadow-sm" />
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={event.type === 'Lesson' ? 'default' : 'secondary'} className="text-[10px] uppercase font-bold tracking-tighter px-2">
                            {event.type === 'Lesson' ? 'Aula Regular' : 'Apoio'}
                          </Badge>
                          <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {event.class}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                          <Clock className="h-3.5 w-3.5" /> {event.time}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-xl font-black group-hover:text-primary transition-colors leading-tight">
                          {event.title}
                        </h4>
                      </div>

                      <div className="p-4 bg-muted/30 rounded-xl border border-border/40 group-hover:border-primary/20 transition-colors">
                        <p className="text-sm text-foreground/80 leading-relaxed italic">
                          {event.content}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs font-bold">Ver Detalhes</Button>
                        <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-primary">Editar Registro</Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredEvents.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 text-center opacity-30">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Info className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-bold">Nenhum conteúdo agendado</p>
                    <p className="text-sm">Tente mudar a turma ou a data selecionada.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
