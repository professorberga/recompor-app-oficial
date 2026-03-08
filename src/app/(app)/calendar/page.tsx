
"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, Search, Info, Loader2, BookCheck, Bookmark } from "lucide-react"
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
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase/provider"
import { collection, doc, setDoc } from "firebase/firestore"
import { cn } from "@/lib/utils"

const CLASS_SCHEDULES = [
  "07:00 às 07:50", "07:50 às 08:40", "08:40 às 09:30", "09:45 às 10:35", "10:35 às 11:25"
]

const dayMap: Record<string, string> = {
  'segunda': 'Segunda',
  'terça': 'Terça',
  'quarta': 'Quarta',
  'quinta': 'Quinta',
  'sexta': 'Sexta',
  'sábado': 'Sábado',
  'domingo': 'Domingo'
};

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false)
  const { user, profile, isUserLoading } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()

  const [selectedClass, setSelectedClass] = useState("all")
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Busca turmas Globais para filtro
  const globalClassesRef = useMemoFirebase(() => collection(firestore, 'classes'), [firestore])
  const { data: rawClasses = [] } = useCollection(globalClassesRef)

  // Filtra turmas conforme atribuição
  const classes = useMemo(() => {
    if (!profile) return [];
    if (profile.role === 'Admin') return rawClasses;
    if (profile.assignments && profile.assignments.length > 0) {
      const assignedIds = profile.assignments.map(a => a.classId);
      return rawClasses.filter(c => assignedIds.includes(c.id));
    }
    return [];
  }, [rawClasses, profile]);

  const lessonsRef = useMemoFirebase(() => user ? collection(firestore, 'teachers', user.uid, 'lessons') : null, [user, firestore])
  const { data: recordedLessons = [], isLoading: isLessonsLoading } = useCollection(lessonsRef)

  const [newEvent, setNewEvent] = useState({
    title: "",
    time: CLASS_SCHEDULES[0],
    classId: "all",
    type: "Regular",
    content: ""
  })

  useEffect(() => {
    setMounted(true)
    setCurrentDate(new Date())
  }, [])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !lessonsRef) return
    
    if (!newEvent.title && !newEvent.content) {
      toast({ title: "Preencha ao menos o conteúdo", variant: "destructive" })
      return
    }

    const lessonId = Math.random().toString(36).substr(2, 9)
    const className = newEvent.classId === 'all' ? 'Geral' : (classes.find(c => c.id === newEvent.classId)?.name || 'Turma')

    const lessonData = {
      id: lessonId,
      title: newEvent.title || `${newEvent.type} - ${className}`,
      ...newEvent,
      class: className,
      lessonDate: currentDate?.toISOString() || new Date().toISOString(),
      teacherId: user.uid
    }

    try {
      await setDoc(doc(lessonsRef, lessonId), lessonData)
      setIsDialogOpen(false)
      setNewEvent({ title: "", time: CLASS_SCHEDULES[0], classId: "all", type: "Regular", content: "" })
      toast({ title: "Planejamento Salvo", description: "O registro foi gravado no histórico da turma." })
    } catch (err) {
      toast({ title: "Erro ao salvar", variant: "destructive" })
    }
  }

  const mergedEvents = useMemo(() => {
    if (!currentDate) return [];

    const dateStr = format(currentDate, "yyyy-MM-dd");
    const dayOfWeek = format(currentDate, "EEEE", { locale: ptBR }).split('-')[0].toLowerCase();
    const dayLabel = dayMap[dayOfWeek] || "";

    const dailyRecorded = recordedLessons.filter(l => l.date === dateStr || l.lessonDate?.split('T')[0] === dateStr);

    const plannedAssignments = (profile?.assignments || [])
      .filter(a => a.dayOfWeek === dayLabel)
      .map(a => ({
        id: `planned_${a.classId}_${a.lessonNumber}`,
        title: `${a.subject} - ${a.className}`,
        classId: a.classId,
        class: a.className,
        time: a.lessonNumber || a.timeSlot || "Horário não definido",
        type: "Grade Horária",
        content: "Aula prevista na grade horária escolar.",
        isPlanned: true,
        recorded: dailyRecorded.some(r => r.classId === a.classId)
      }));

    return [...plannedAssignments, ...dailyRecorded.map(r => ({ ...r, isPlanned: false }))];
  }, [currentDate, recordedLessons, profile]);

  const filteredEvents = useMemo(() => {
    return mergedEvents.filter(event => {
      const matchesClass = selectedClass === "all" || event.classId === selectedClass || event.classId === "all"
      const safeTitle = (event.title || "").toLowerCase();
      const safeContent = (event.content || "").toLowerCase();
      const safeSearch = (searchTerm || "").toLowerCase();
      const matchesSearch = safeTitle.includes(safeSearch) || safeContent.includes(safeSearch);
      
      return matchesClass && matchesSearch
    }).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [mergedEvents, selectedClass, searchTerm]);

  if (!mounted || isUserLoading || !currentDate) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-primary uppercase">Calendário & Conteúdos</h2>
          <p className="text-muted-foreground text-sm font-medium">Cruzamento entre Grade Horária e Lançamentos Reais.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2 shadow-lg h-11 px-6 font-bold"><Plus className="h-5 w-5" /> Novo Planejamento</Button></DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-primary uppercase">Novo Registro</DialogTitle>
              <DialogDescription>Adicione um registro manual de conteúdo ou planejamento ao calendário.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Título (Opcional)</Label>
                <Input placeholder="Ex: Revisão de Frações" value={newEvent.title} onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Turma</Label>
                  <Select value={newEvent.classId} onValueChange={(v) => setNewEvent({...newEvent, classId: v})}>
                    <SelectTrigger><SelectValue placeholder="Turma" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Geral / Extra</SelectItem>
                      {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Horário/Aula</Label>
                  <Select value={newEvent.time} onValueChange={(v) => setNewEvent({...newEvent, time: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CLASS_SCHEDULES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Conteúdo / Observações</Label>
                <Textarea placeholder="Descreva o planejamento ou conteúdo ministrado..." value={newEvent.content} onChange={(e) => setNewEvent({...newEvent, content: e.target.value})} className="min-h-[100px]" />
              </div>
              <Button type="submit" className="w-full h-12 font-black shadow-xl uppercase tracking-widest text-xs">Salvar no Firestore</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card className="p-6 border-none shadow-md bg-white">
            <Label className="text-[10px] font-black uppercase text-muted-foreground mb-4 block">Filtros de Visualização</Label>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Turma</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Turmas</SelectItem>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">Pesquisar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar conteúdo..." className="pl-10 bg-slate-50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-md bg-white">
            <h3 className="text-xs font-black uppercase text-primary mb-4 tracking-widest">Legenda</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-bold">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span>Previsto na Grade</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Conteúdo Lançado</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setCurrentDate(prev => addDays(prev!, -1))}><ChevronLeft /></Button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase text-primary tracking-tighter">
                {format(currentDate, "EEEE", { locale: ptBR })}
              </span>
              <span className="font-black text-lg uppercase tracking-tight">
                {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setCurrentDate(prev => addDays(prev!, 1))}><ChevronRight /></Button>
          </div>

          <Card className="min-h-[400px] border-none shadow-md bg-white overflow-hidden">
            <ScrollArea className="h-full max-h-[600px]">
              {isLessonsLoading ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : (
                <div className="p-6 space-y-6">
                  {filteredEvents.map((event) => (
                    <div key={event.id} className={cn(
                      "group relative border-l-4 pl-6 py-4 rounded-r-xl transition-all hover:bg-slate-50",
                      event.isPlanned ? "border-primary bg-primary/5" : "border-green-500 bg-green-50/30"
                    )}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={event.isPlanned ? "default" : "outline"} className={cn("text-[9px] font-black uppercase", !event.isPlanned && "border-green-600 text-green-700")}>
                            {event.type}
                          </Badge>
                          {event.recorded && <Badge variant="secondary" className="bg-green-100 text-green-800 text-[9px] font-black uppercase">Sincronizado</Badge>}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-black text-muted-foreground uppercase tracking-tighter">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </div>
                      </div>
                      
                      <h4 className="font-black text-xl text-primary tracking-tighter uppercase mb-1">
                        {event.title || `${event.class}`}
                      </h4>
                      
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase mb-3">
                        <Bookmark className="h-3 w-3" />
                        Turma: {event.class}
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed italic">
                        {event.content || "Sem descrição de conteúdo para este dia."}
                      </p>

                      {!event.isPlanned && (
                        <div className="absolute top-4 right-4 text-green-600 opacity-20 group-hover:opacity-100 transition-opacity">
                          <BookCheck className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {filteredEvents.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 opacity-20 grayscale">
                      <CalendarIcon className="h-20 w-20 mb-4" />
                      <p className="font-black uppercase tracking-widest text-sm">Nenhum evento ou aula prevista</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  )
}
