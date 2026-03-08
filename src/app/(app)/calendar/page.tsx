
"use client"

import { useState, useEffect } from "react"
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, Search, Info, Loader2 } from "lucide-react"
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

const CLASS_SCHEDULES = [
  "07:00 às 07:50", "07:50 às 08:40", "08:40 às 09:30", "09:45 às 10:35", "10:35 às 11:25"
]

const ACTIVITY_TYPES = [
  { value: 'Regular', label: 'Aula Regular', color: 'bg-primary text-primary-foreground' },
  { value: 'Tutoria', label: 'Projeto Tutoria', color: 'bg-indigo-500 text-white' },
  { value: 'Monitoria', label: 'Monitor do BEEM', color: 'bg-emerald-500 text-white' },
]

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false)
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()

  const [selectedClass, setSelectedClass] = useState("all")
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Real Data
  const classesRef = useMemoFirebase(() => user ? collection(firestore, 'teachers', user.uid, 'classes') : null, [user, firestore])
  const { data: classes = [] } = useCollection(classesRef)

  const lessonsRef = useMemoFirebase(() => user ? collection(firestore, 'teachers', user.uid, 'lessons') : null, [user, firestore])
  const { data: lessons = [], isLoading: isLessonsLoading } = useCollection(lessonsRef)

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
    
    if (!newEvent.title || !newEvent.content) {
      toast({ title: "Campos incompletos", variant: "destructive" })
      return
    }

    const lessonId = Math.random().toString(36).substr(2, 9)
    const className = newEvent.classId === 'all' ? 'Geral' : (classes.find(c => c.id === newEvent.classId)?.name || 'Turma')

    const lessonData = {
      id: lessonId,
      ...newEvent,
      class: className,
      lessonDate: currentDate?.toISOString() || new Date().toISOString(),
      teacherId: user.uid
    }

    try {
      await setDoc(doc(lessonsRef, lessonId), lessonData)
      setIsDialogOpen(false)
      setNewEvent({ title: "", time: CLASS_SCHEDULES[0], classId: "all", type: "Regular", content: "" })
      toast({ title: "Planejamento Criado!", description: `Registrado com sucesso.` })
    } catch (err) {
      toast({ title: "Erro ao salvar", description: "Verifique permissões.", variant: "destructive" })
    }
  }

  const filteredEvents = lessons.filter(event => {
    const matchesClass = selectedClass === "all" || event.classId === selectedClass || event.classId === "all"
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase())
    // Filtro de data simplificado (mesma data ISO string para fins de protótipo)
    const sameDate = currentDate && event.lessonDate?.split('T')[0] === currentDate.toISOString().split('T')[0]
    return matchesClass && matchesSearch && sameDate
  })

  if (!mounted || isUserLoading || !currentDate) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-primary">Calendário & Conteúdos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2 shadow-lg"><Plus className="h-4 w-4" /> Novo Planejamento</Button></DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader><DialogTitle>Novo Registro</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4 py-4">
              <Input placeholder="Título" value={newEvent.title} onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <Select value={newEvent.classId} onValueChange={(v) => setNewEvent({...newEvent, classId: v})}>
                  <SelectTrigger><SelectValue placeholder="Turma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Geral</SelectItem>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={newEvent.time} onValueChange={(v) => setNewEvent({...newEvent, time: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CLASS_SCHEDULES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Textarea placeholder="Conteúdo" value={newEvent.content} onChange={(e) => setNewEvent({...newEvent, content: e.target.value})} />
              <Button type="submit" className="w-full">Salvar no Firestore</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex gap-4 items-end bg-white p-6 rounded-xl border">
        <div className="w-72">
          <Label className="text-[10px] font-bold uppercase ml-1">Filtrar Turma</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Turmas</SelectItem>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => addDays(prev!, -1))}><ChevronLeft /></Button>
          <div className="flex items-center gap-2 px-4 h-10 bg-muted/30 rounded-md min-w-[220px] justify-center uppercase font-bold text-xs">{format(currentDate, "dd 'de' MMMM", { locale: ptBR })}</div>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => addDays(prev!, 1))}><ChevronRight /></Button>
        </div>
      </div>
      <Card className="p-6">
        {isLessonsLoading ? <Loader2 className="animate-spin mx-auto" /> : (
          <div className="space-y-6">
            {filteredEvents.map(event => (
              <div key={event.id} className="border-l-4 border-primary pl-4 py-2">
                <div className="flex justify-between items-center mb-1">
                  <Badge>{event.type}</Badge>
                  <span className="text-xs text-muted-foreground">{event.time}</span>
                </div>
                <h4 className="font-bold text-lg">{event.title}</h4>
                <p className="text-sm text-muted-foreground">{event.content}</p>
              </div>
            ))}
            {filteredEvents.length === 0 && <div className="text-center py-20 opacity-30">Nenhum conteúdo para este dia.</div>}
          </div>
        )}
      </Card>
    </div>
  )
}
