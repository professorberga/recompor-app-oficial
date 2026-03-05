"use client"

import { useState } from "react"
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, BookOpen, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

const MOCK_EVENTS = [
  { id: '1', title: 'Interpretação de Texto', time: '08:00 - 09:30', class: '9º Ano A', type: 'Lesson' },
  { id: '2', title: 'Sintaxe e Gramática', time: '10:00 - 11:30', class: '9º Ano B', type: 'Lesson' },
  { id: '3', title: 'Plantão de Dúvidas', time: '14:00 - 15:00', class: 'Geral', type: 'Support' },
]

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Calendário & Conteúdos</h2>
          <p className="text-muted-foreground mt-1">Planeje suas aulas e gerencie o cronograma curricular.</p>
        </div>
        <Button className="gap-2 shadow-lg">
          <Plus className="h-4 w-4" /> Novo Planejamento
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4 border-none shadow-md bg-white">
          <CardHeader>
            <CardTitle>Seletor de Data</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center p-0 pb-6">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border-none"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Cronograma do Dia</CardTitle>
              <CardDescription>{date?.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {MOCK_EVENTS.map((event) => (
                  <div key={event.id} className="relative pl-6 pb-6 border-l-2 border-primary/20 last:pb-0 group">
                    <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-white border-2 border-primary group-hover:bg-primary transition-colors" />
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={event.type === 'Lesson' ? 'default' : 'secondary'} className="text-[10px] uppercase font-bold tracking-tighter">
                          {event.type === 'Lesson' ? 'Aula Regular' : 'Apoio'}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {event.time}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold group-hover:text-primary transition-colors">{event.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {event.class}</span>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg mt-1">
                        <p className="text-xs italic leading-relaxed">Conteúdo planejado: Revisão para a prova bimestral focando em análise de textos literários contemporâneos.</p>
                      </div>
                    </div>
                  </div>
                ))}

                {MOCK_EVENTS.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                    <CalendarIcon className="h-12 w-12 mb-4" />
                    <p>Nenhuma aula agendada para este dia.</p>
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