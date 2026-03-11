
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

  // Busca turmas da coleção GLOBAL
  const classesRef = useMemoFirebase(() => collection(firestore, 'classes'), [firestore]);
  const { data: rawClasses = [], isLoading: isClassesLoading } = useCollection(classesRef)

  // Estudantes em Coleção Global
  const studentsRef = useMemoFirebase(() => collection(firestore, 'students'), [firestore]);
  const { data: allStudents = [], isLoading: isStudentsLoading } = useCollection(studentsRef)

  // Docentes para exibir no Card e no Painel de Atribuição
  const teachersRef = useMemoFirebase(() => collection(firestore, 'teachers'), [firestore]);
  const { data: allTeachers = [], isLoading: isTeachersLoading } = useCollection(teachersRef)

  const [classForm, setClassForm] = useState({
    name: "",
    subject: "Portuguese" as "Portuguese" | "Math",
  })

  // Filtra as turmas com base nas atribuições
  const classes = useMemo(() => {
    if (isUserLoading || !profile) return [];
    if (isAdmin) return rawClasses;
    
    const assignedIds = profile.assignments?.map(a => a.classId) || [];
    return rawClasses.filter(c => assignedIds.includes(c.id));
  }, [rawClasses, profile, isAdmin, isUserLoading]);

  const getStudentCount = (classId: string) => {
    return allStudents.filter(s => s.classId === classId).length;
  }

  const getTeachersForClass = (classId: string) => {
    return allTeachers.filter(t => 
      t.assignments?.some(a => a.classId === classId)
    ).map(t => ({ name: t.name, role: t.role, id: t.id }));
  }

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classForm.name) {
      toast({ title: "Campo Vazio", variant: "destructive" })
      return
    }

    const classId = editingClassId || Math.random().toString(36).substr(2, 9)
    const classData = {
      id: classId,
      name: classForm.name,
      subject: classForm.subject,
      year: new Date().getFullYear(),
      ...(editingClassId ? {} : { createdAt: new Date().toISOString() })
    }

    try {
      await setDoc(doc(firestore, 'classes', classId), classData, { merge: true })
      setIsDialogOpen(false)
      setEditingClassId(null)
      setClassForm({ name: "", subject: "Portuguese" })
      toast({ title: editingClassId ? "Turma Atualizada" : "Turma Criada" })
    } catch (err: any) {
      toast({ title: "Falha na Gravação", variant: "destructive" })
    }
  }

  const handleDeleteClass = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Excluir esta turma permanentemente?")) return;

    try {
      await deleteDoc(doc(firestore, 'classes', id))
      toast({ title: "Removido" })
    } catch (err) {
      toast({ title: "Falha ao Excluir", variant: "destructive" })
    }
  }

  const handleEditClick = (cls: any) => {
    setEditingClassId(cls.id)
    setClassForm({
      name: cls.name,
      subject: cls.subject as "Portuguese" | "Math"
    })
    setIsDialogOpen(true)
  }

  const handleToggleTeacherAssignment = async (teacher: any) => {
    if (!assigningClass) return;

    const isCurrentlyAssigned = teacher.assignments?.some((a: any) => a.classId === assigningClass.id);
    const teacherRef = doc(firestore, 'teachers', teacher.id);

    try {
      if (isCurrentlyAssigned) {
        // Remove a atribuição específica desta turma
        const updatedAssignments = teacher.assignments.filter((a: any) => a.classId !== assigningClass.id);
        await updateDoc(teacherRef, { assignments: updatedAssignments });
        toast({ title: "Atribuição removida" });
      } else {
        // Adiciona nova atribuição rápida
        const newAssignment = {
          classId: assigningClass.id,
          className: assigningClass.name,
          subject: assigningClass.subject === 'Portuguese' ? 'Português' : 'Matemática',
          dayOfWeek: "Segunda", // Valor padrão para atribuição ágil
          lessonNumber: "1ª aula (07:00 - 07:50)" // Valor padrão para atribuição ágil
        };
        await updateDoc(teacherRef, { 
          assignments: arrayUnion(newAssignment) 
        });
        toast({ title: "Docente vinculado à turma" });
      }
    } catch (err) {
      toast({ title: "Erro na atribuição", variant: "destructive" });
    }
  }

  const filteredClasses = useMemo(() => {
    return classes
      .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [classes, searchTerm]);

  const isLoading = isClassesLoading || isStudentsLoading || isUserLoading || isTeachersLoading;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary uppercase">Turmas</h2>
          <p className="text-muted-foreground mt-1">Organização das turmas atribuídas e institucionalizadas.</p>
        </div>

        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingClassId(null);
              setClassForm({ name: "", subject: "Portuguese" });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg h-11 px-6 font-bold">
                <Plus className="h-5 w-5" /> Nova Turma
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-primary uppercase">
                  {editingClassId ? "Editar Turma" : "Adicionar Turma"}
                </DialogTitle>
                <DialogDescription>
                  {editingClassId ? "Atualize os dados institucionais desta turma." : "A nova turma ficará disponível em todo o sistema escolar."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveClass} className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-bold uppercase text-[10px]">Nome da Turma</Label>
                  <Input id="name" placeholder="Ex: 9º Ano B" value={classForm.name} onChange={(e) => setClassForm({...classForm, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="font-bold uppercase text-[10px]">Disciplina Base</Label>
                  <Select value={classForm.subject} onValueChange={(v: any) => setClassForm({...classForm, subject: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Portuguese">Português</SelectItem>
                      <SelectItem value="Math">Matemática</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full h-12 font-black shadow-xl uppercase text-xs tracking-widest">
                    {editingClassId ? "Atualizar Turma" : "Sincronizar Turma"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Filtrar turmas..." className="pl-10 bg-white border-none shadow-sm h-12 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((cls) => {
            const classTeachers = getTeachersForClass(cls.id);
            return (
              <Card key={cls.id} className="border-none shadow-md overflow-hidden group hover:shadow-2xl transition-all duration-300 bg-white border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
                  <div className={`h-12 w-12 rounded-xl ${cls.subject === 'Portuguese' ? 'bg-primary' : 'bg-accent'} flex items-center justify-center text-white shadow-lg`}>
                    {cls.subject === 'Portuguese' ? (
                      <BookOpen className="h-6 w-6" />
                    ) : (
                      <Calculator className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <CardTitle className="text-xl font-black truncate uppercase tracking-tighter">{cls.name}</CardTitle>
                    <Badge variant="secondary" className="text-[9px] font-black uppercase mt-1 tracking-wider">
                      {cls.subject === 'Portuguese' ? 'Português' : 'Matemática'}
                    </Badge>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" onClick={() => { setAssigningClass(cls); setIsAssignDialogOpen(true); }}>
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" onClick={() => handleEditClick(cls)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClass(cls.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pb-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span className="font-bold">{getStudentCount(cls.id)} Alunos Ativos</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-dashed">
                    {classTeachers.length > 0 ? (
                      classTeachers.map((teacher, i) => (
                        <Badge key={i} variant="secondary" className={cn(
                          "border-none text-[9px] font-black uppercase py-0.5 px-2 flex items-center gap-1 transition-colors",
                          teacher.role === 'Mentor' ? "bg-accent/10 text-accent-foreground" : "bg-primary/5 text-primary"
                        )}>
                          <User className="h-2.5 w-2.5" />
                          {teacher.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[9px] font-bold text-muted-foreground italic opacity-50">Nenhuma atribuição docente</span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50/50 p-4 flex gap-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1 font-black h-10" asChild>
                    <Link href={`/students?class=${cls.id}`}>ESTUDANTES</Link>
                  </Button>
                  <Button size="sm" className="flex-1 font-black h-10 shadow-md gap-2 uppercase text-[10px]" asChild>
                    <Link href={`/attendance?class=${cls.id}`}>CHAMADA <ArrowRight className="h-3 w-3" /></Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
          {filteredClasses.length === 0 && (
            <div className="col-span-full py-32 text-center opacity-30 italic font-black uppercase tracking-widest">Nenhuma turma para exibir</div>
          )}
        </div>
      )}

      {/* DIÁLOGO DE ATRIBUIÇÃO RÁPIDA (SOMENTE ADMIN) */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden flex flex-col h-[80vh]">
          <DialogHeader className="p-6 bg-primary text-white shrink-0">
            <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
              <Users className="h-6 w-6" />
              Atribuição de Equipe: {assigningClass?.name}
            </DialogTitle>
            <DialogDescription className="text-white/70 font-bold text-xs uppercase">
              Vincule professores e mentores à turma de forma ágil.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 border-b bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar docente..." className="pl-10 h-10 bg-white" />
            </div>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="grid gap-3">
              {allTeachers
                .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                .map((teacher) => {
                  const isAssigned = teacher.assignments?.some((a: any) => a.classId === assigningClass?.id);
                  return (
                    <div key={teacher.id} className={cn(
                      "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                      isAssigned ? "border-primary bg-primary/5" : "border-slate-100 bg-white hover:border-slate-200"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs",
                          teacher.role === 'Mentor' ? "bg-accent text-accent-foreground" : "bg-primary text-white"
                        )}>
                          {teacher.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-xs uppercase tracking-tight">{teacher.name}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{teacher.role}</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant={isAssigned ? "destructive" : "default"} 
                        className="h-9 px-4 font-black uppercase text-[10px]"
                        onClick={() => handleToggleTeacherAssignment(teacher)}
                      >
                        {isAssigned ? <Trash2 className="h-4 w-4 mr-1.5" /> : <UserPlus className="h-4 w-4 mr-1.5" />}
                        {isAssigned ? "Remover" : "Atribuir"}
                      </Button>
                    </div>
                  );
                })}
            </div>
          </ScrollArea>
          <DialogFooter className="p-4 bg-slate-50 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} className="w-full font-bold">FECHAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
