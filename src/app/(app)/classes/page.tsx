
"use client"

import { Plus, Search, BookOpen, GraduationCap, User, Loader2, Trash2, ArrowRight, Pencil, Users, Check, UserPlus, Calculator, LayoutGrid, List } from "lucide-react"
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
import { useUser, useFirestore, useMemoFirebase } from "@/firebase/provider"
import { useCollection } from "react-firebase-hooks/firestore"
import { collection, doc, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ClassesPage() {
  const { user, profile, isAdmin, isUserLoading } = useUser()
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [assigningClass, setAssigningClass] = useState<any>(null)
  const { toast } = useToast()

  const classesRef = useMemoFirebase(() => collection(firestore, 'classes'), [firestore]);
  const [rawClassesSnap, isClassesLoading] = useCollection(classesRef)
  const rawClasses = useMemo(() => rawClassesSnap?.docs.map(d => ({ ...d.data(), id: d.id })) || [], [rawClassesSnap])

  const studentsRef = useMemoFirebase(() => collection(firestore, 'students'), [firestore]);
  const [allStudentsSnap, isStudentsLoading] = useCollection(studentsRef)
  const allStudents = useMemo(() => allStudentsSnap?.docs.map(d => ({ ...d.data(), id: d.id })) || [], [allStudentsSnap])

  const teachersRef = useMemoFirebase(() => collection(firestore, 'teachers'), [firestore]);
  const [allTeachersSnap, isTeachersLoading] = useCollection(teachersRef)
  const allTeachers = useMemo(() => allTeachersSnap?.docs.map(d => ({ ...d.data(), id: d.id })) || [], [allTeachersSnap])

  const [classForm, setClassForm] = useState({
    name: "",
    subject: "Portuguese" as "Portuguese" | "Math",
  })

  const classes = useMemo(() => {
    if (isUserLoading || !profile) return [];
    let list = [];
    if (isAdmin) {
      list = rawClasses;
    } else {
      const assignedIds = profile.assignments?.map(a => a.classId) || [];
      list = rawClasses.filter(c => assignedIds.includes(c.id));
    }
    return list;
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

  if (isUserLoading || isClassesLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Turmas</h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Gestão das turmas atribuídas.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border shadow-sm">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="icon" 
              className="h-9 w-9" 
              onClick={() => setViewMode('grid')}
              title="Ver como Grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="icon" 
              className="h-9 w-9" 
              onClick={() => setViewMode('list')}
              title="Ver como Lista"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild><Button className="gap-2 shadow-lg font-black uppercase text-xs h-11 px-6"><Plus className="h-5 w-5" /> Nova Turma</Button></DialogTrigger>
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
                  <Button type="submit" className="w-full font-black uppercase text-xs h-12 shadow-xl">Sincronizar</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Filtrar turmas por nome..." className="pl-10 bg-white border-none shadow-sm h-12 font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((cls) => (
            <Card key={cls.id} className="border-none shadow-md overflow-hidden bg-white border-l-4 border-l-primary hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg",
                  cls.subject === 'Math' ? 'bg-accent' : 'bg-primary'
                )}>
                  {cls.subject === 'Math' ? <Calculator className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <CardTitle className="text-xl font-black uppercase tracking-tighter truncate">{cls.name}</CardTitle>
                  <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-wider">{cls.subject === 'Portuguese' ? 'Português' : 'Matemática'}</Badge>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setAssigningClass(cls); setIsAssignDialogOpen(true); }}><Users className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setEditingClassId(cls.id); setClassForm({name: cls.name, subject: cls.subject}); setIsDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="pb-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span>{getStudentCount(cls.id)} Alunos Matriculados</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-dashed">
                  {getTeachersForClass(cls.id).map((t, i) => (
                    <Badge key={i} variant="secondary" className="text-[9px] font-black uppercase bg-primary/5 text-primary border-primary/10">
                      {t.name}
                    </Badge>
                  ))}
                  {getTeachersForClass(cls.id).length === 0 && <span className="text-[10px] italic text-muted-foreground font-bold uppercase">Sem equipe vinculada</span>}
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 p-4 flex gap-2 border-t">
                <Button variant="outline" size="sm" className="flex-1 font-black h-10 uppercase text-[10px] tracking-widest" asChild>
                  <Link href={`/students?class=${cls.id}`}>ESTUDANTES</Link>
                </Button>
                <Button size="sm" className="flex-1 font-black h-10 shadow-md gap-2 uppercase text-[10px] tracking-widest" asChild>
                  <Link href={`/attendance?class=${cls.id}`}>DIÁRIO <ArrowRight className="h-3 w-3" /></Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-none shadow-md bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 border-b font-black uppercase text-[10px] tracking-widest">
              <TableRow>
                <TableHead className="w-[100px] text-center">Ícone</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead className="text-center">Estudantes</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead className="text-right px-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.map((cls) => (
                <TableRow key={cls.id} className="hover:bg-slate-50 transition-colors h-16">
                  <TableCell className="text-center">
                    <div className={cn(
                      "h-10 w-10 mx-auto rounded-lg flex items-center justify-center text-white shadow-sm",
                      cls.subject === 'Math' ? 'bg-accent' : 'bg-primary'
                    )}>
                      {cls.subject === 'Math' ? <Calculator className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-xs uppercase tracking-tight text-primary">{cls.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200">
                      {cls.subject === 'Portuguese' ? 'Português' : 'Matemática'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-bold text-sm text-slate-600">{getStudentCount(cls.id)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getTeachersForClass(cls.id).slice(0, 2).map((t, i) => (
                        <Badge key={i} variant="secondary" className="text-[8px] font-black uppercase bg-primary/5 text-primary">
                          {t.name.split(' ')[0]}
                        </Badge>
                      ))}
                      {getTeachersForClass(cls.id).length > 2 && <Badge variant="secondary" className="text-[8px] font-black uppercase">+{getTeachersForClass(cls.id).length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-primary" onClick={() => { setAssigningClass(cls); setIsAssignDialogOpen(true); }}><Users className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-primary" onClick={() => { setEditingClassId(cls.id); setClassForm({name: cls.name, subject: cls.subject}); setIsDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        </>
                      )}
                      <Button variant="outline" size="sm" className="h-9 px-3 font-black uppercase text-[10px] tracking-widest" asChild>
                        <Link href={`/attendance?class=${cls.id}`}>Abrir</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {filteredClasses.length === 0 && (
        <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
          <Search className="h-12 w-12" />
          <p className="font-black uppercase tracking-widest text-sm">Nenhuma turma localizada</p>
        </div>
      )}

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl bg-white p-0 flex flex-col h-[80vh] shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white shrink-0 shadow-lg">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Users className="h-6 w-6" />
              Equipe: {assigningClass?.name}
            </DialogTitle>
            <DialogDescription className="text-white/70 font-bold text-xs uppercase tracking-widest">
              Gerencie os docentes e mentores vinculados a esta sala.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 p-6 bg-slate-50">
            <div className="grid gap-4">
              {allTeachers.sort((a,b) => (a.name || "").localeCompare(b.name || "")).map((teacher) => {
                const isAssigned = teacher.assignments?.some((a: any) => a.classId === assigningClass?.id);
                return (
                  <div key={teacher.id} className={cn(
                    "flex items-center justify-between p-5 rounded-2xl border-2 transition-all shadow-sm",
                    isAssigned ? "border-primary bg-white ring-1 ring-primary/10" : "border-slate-200 bg-white opacity-70 grayscale-[0.5]"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-black text-xs text-white shadow-inner", isAssigned ? "bg-primary" : "bg-slate-300")}>
                        {teacher.name?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-xs uppercase text-primary tracking-tight">{teacher.name}</span>
                        <Badge variant="outline" className="w-fit text-[8px] font-black uppercase mt-1 border-slate-300">{teacher.role}</Badge>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant={isAssigned ? "destructive" : "default"} 
                      className="h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-md"
                      onClick={() => handleToggleTeacherAssignment(teacher)}
                    >
                      {isAssigned ? "Remover" : "Atribuir"}
                    </Button>
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
