
"use client"

import { Plus, Search, BookOpen, GraduationCap, User, Loader2, Trash2, ArrowRight, Pencil, Users, Check, UserPlus, Calculator } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase/provider"
import { collection, doc, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export default function ClassesPage() {
  const { user, profile, isAdmin, isUserLoading } = useUser()
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [assigningClass, setAssigningClass] = useState<any>(null)
  const { toast } = useToast()

  const classesRef = useMemoFirebase(() => collection(firestore, 'classes'), [firestore]);
  const { data: rawClasses = [], isLoading: isClassesLoading } = useCollection(classesRef)
  const studentsRef = useMemoFirebase(() => collection(firestore, 'students'), [firestore]);
  const { data: allStudents = [], isLoading: isStudentsLoading } = useCollection(studentsRef)
  const teachersRef = useMemoFirebase(() => collection(firestore, 'teachers'), [firestore]);
  const { data: allTeachers = [], isLoading: isTeachersLoading } = useCollection(teachersRef)

  const [classForm, setClassForm] = useState({
    name: "",
    subject: "Portuguese" as "Portuguese" | "Math",
  })

  const classes = useMemo(() => {
    if (isUserLoading || !profile) return [];
    if (isAdmin) return rawClasses;
    const assignedIds = profile.assignments?.map(a => a.classId) || [];
    return rawClasses.filter(c => assignedIds.includes(c.id));
  }, [rawClasses, profile, isAdmin, isUserLoading]);

  const getStudentCount = (classId: string) => allStudents.filter(s => s.classId === classId).length;

  const getTeachersForClass = (classId: string) => {
    return allTeachers.filter(t => t.assignments?.some(a => a.classId === classId))
      .map(t => ({ name: t.name, role: t.role, id: t.id }));
  }

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classForm.name) return;
    const classId = editingClassId || Math.random().toString(36).substr(2, 9)
    await setDoc(doc(firestore, 'classes', classId), { id: classId, name: classForm.name, subject: classForm.subject, year: new Date().getFullYear() }, { merge: true })
    setIsDialogOpen(false)
    setEditingClassId(null)
    toast({ title: "Turma Sincronizada" })
  }

  const handleToggleTeacherAssignment = async (teacher: any) => {
    if (!assigningClass) return;
    const isCurrentlyAssigned = teacher.assignments?.some((a: any) => a.classId === assigningClass.id);
    const teacherRef = doc(firestore, 'teachers', teacher.id);
    try {
      if (isCurrentlyAssigned) {
        const updatedAssignments = teacher.assignments.filter((a: any) => a.classId !== assigningClass.id);
        await updateDoc(teacherRef, { assignments: updatedAssignments });
      } else {
        const newAssignment = {
          classId: assigningClass.id,
          className: assigningClass.name,
          subject: assigningClass.subject === 'Portuguese' ? 'Português' : 'Matemática',
          dayOfWeek: "Segunda",
          lessonNumber: "1ª aula (07:00 - 07:50)"
        };
        await updateDoc(teacherRef, { assignments: arrayUnion(newAssignment) });
      }
      toast({ title: "Equipe Atualizada" });
    } catch (err) { toast({ title: "Erro na atribuição", variant: "destructive" }); }
  }

  const filteredClasses = useMemo(() => {
    return classes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [classes, searchTerm]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary uppercase">Turmas</h2>
          <p className="text-muted-foreground mt-1">Gestão das turmas atribuídas.</p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2 shadow-lg font-bold"><Plus className="h-5 w-5" /> Nova Turma</Button></DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader><DialogTitle className="font-black uppercase text-primary">Configurar Turma</DialogTitle></DialogHeader>
              <form onSubmit={handleSaveClass} className="space-y-4 py-4">
                <div className="space-y-2"><Label className="font-bold uppercase text-[10px]">Nome</Label><Input value={classForm.name} onChange={(e) => setClassForm({...classForm, name: e.target.value})} /></div>
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-[10px]">Disciplina</Label>
                  <Select value={classForm.subject} onValueChange={(v: any) => setClassForm({...classForm, subject: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Portuguese">Português</SelectItem><SelectItem value="Math">Matemática</SelectItem></SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full font-black uppercase text-xs">Sincronizar</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Filtrar turmas..." className="pl-10 bg-white border-none shadow-sm h-12" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClasses.map((cls) => (
          <Card key={cls.id} className="border-none shadow-md overflow-hidden bg-white border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
              <div className={`h-12 w-12 rounded-xl ${cls.subject === 'Math' ? 'bg-accent' : 'bg-primary'} flex items-center justify-center text-white shadow-lg`}>
                {cls.subject === 'Math' ? <Calculator className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
              </div>
              <div className="flex-1 overflow-hidden">
                <CardTitle className="text-xl font-black uppercase tracking-tighter truncate">{cls.name}</CardTitle>
                <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-wider">{cls.subject === 'Portuguese' ? 'Português' : 'Matemática'}</Badge>
              </div>
              {isAdmin && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setAssigningClass(cls); setIsAssignDialogOpen(true); }}><Users className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditingClassId(cls.id); setClassForm({name: cls.name, subject: cls.subject}); setIsDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium"><GraduationCap className="h-4 w-4 text-primary" /><span className="font-bold">{getStudentCount(cls.id)} Alunos</span></div>
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-dashed">
                {getTeachersForClass(cls.id).map((t, i) => <Badge key={i} variant="secondary" className="text-[9px] font-black uppercase bg-primary/5 text-primary">{t.name}</Badge>)}
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 p-4 flex gap-2 border-t">
              <Button variant="outline" size="sm" className="flex-1 font-black h-10" asChild><Link href={`/students?class=${cls.id}`}>ESTUDANTES</Link></Button>
              <Button size="sm" className="flex-1 font-black h-10 shadow-md gap-2 uppercase text-[10px]" asChild><Link href={`/attendance?class=${cls.id}`}>DIÁRIO <ArrowRight className="h-3 w-3" /></Link></Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl bg-white p-0 flex flex-col h-[80vh]">
          <DialogHeader className="p-6 bg-primary text-white shrink-0"><DialogTitle className="text-xl font-black uppercase">Vincular Equipe: {assigningClass?.name}</DialogTitle></DialogHeader>
          <ScrollArea className="flex-1 p-4">
            <div className="grid gap-3">
              {allTeachers.map((teacher) => {
                const isAssigned = teacher.assignments?.some((a: any) => a.classId === assigningClass?.id);
                return (
                  <div key={teacher.id} className={cn("flex items-center justify-between p-4 rounded-xl border-2", isAssigned ? "border-primary bg-primary/5" : "border-slate-100 bg-white")}>
                    <div className="flex flex-col"><span className="font-black text-xs uppercase">{teacher.name}</span><span className="text-[10px] font-bold text-muted-foreground uppercase">{teacher.role}</span></div>
                    <Button size="sm" variant={isAssigned ? "destructive" : "default"} className="h-9 px-4 font-black uppercase text-[10px]" onClick={() => handleToggleTeacherAssignment(teacher)}>{isAssigned ? "Remover" : "Atribuir"}</Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
