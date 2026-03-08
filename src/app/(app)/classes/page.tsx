
"use client"

import { Plus, Search, BookOpen, GraduationCap, UserCircle, Loader2, Trash2, ArrowRight } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useState, useMemo } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase/provider"
import { collection, doc, setDoc, deleteDoc, query, where } from "firebase/firestore"

export default function ClassesPage() {
  const { user, profile } = useUser()
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  // Referência real para as turmas do professor logado
  const classesRef = useMemoFirebase(() => {
    if (!user?.uid) return null;
    return collection(firestore, 'teachers', user.uid, 'classes');
  }, [user, firestore]);
  
  const { data: classes = [], isLoading: isClassesLoading } = useCollection(classesRef)

  // Referência para TODOS os alunos do professor para calcular contagem dinâmica
  const allStudentsRef = useMemoFirebase(() => {
    if (!user?.uid) return null;
    return collection(firestore, 'teachers', user.uid, 'students');
  }, [user, firestore]);
  
  const { data: allStudents = [], isLoading: isStudentsLoading } = useCollection(allStudentsRef)

  const [newClass, setNewClass] = useState({
    name: "",
    subject: "Portuguese" as "Portuguese" | "Math",
  })

  // Calcula a quantidade real de alunos por turma baseada no campo classId
  const getStudentCount = (classId: string) => {
    return allStudents.filter(s => s.classId === classId).length;
  }

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid || !classesRef) {
      toast({ title: "Erro de Autenticação", description: "Sessão expirada.", variant: "destructive" });
      return;
    }
    
    if (!newClass.name) {
      toast({ title: "Campo Vazio", description: "O nome da turma é obrigatório.", variant: "destructive" })
      return
    }

    const classId = Math.random().toString(36).substr(2, 9)
    const classData = {
      id: classId,
      name: newClass.name,
      subject: newClass.subject,
      year: new Date().getFullYear(),
      gradeLevel: newClass.name.split(' ')[0] || "N/A",
      teacherId: user.uid,
      teacherName: profile?.name || user.email?.split('@')[0],
      createdAt: new Date().toISOString()
    }

    try {
      await setDoc(doc(classesRef, classId), classData)
      setIsDialogOpen(false)
      setNewClass({ name: "", subject: "Portuguese" })
      toast({ title: "Turma Criada", description: `${classData.name} foi registrada no Firestore.` })
    } catch (err: any) {
      console.error("Erro ao criar turma:", err);
      toast({ title: "Falha na Gravação", description: "Verifique suas permissões no Firestore.", variant: "destructive" })
    }
  }

  const handleDeleteClass = async (id: string) => {
    if (!user?.uid || !classesRef) return
    if (!confirm("Excluir esta turma? Isso não removerá os alunos, apenas o vínculo da classe.")) return;

    try {
      await deleteDoc(doc(classesRef, id))
      toast({ title: "Removido", description: "Turma excluída com sucesso." })
    } catch (err) {
      toast({ title: "Falha ao Excluir", variant: "destructive" })
    }
  }

  const filteredClasses = useMemo(() => {
    return classes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [classes, searchTerm]);

  const isLoading = isClassesLoading || isStudentsLoading;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Diário de Turmas</h2>
          <p className="text-muted-foreground mt-1">Gerencie suas classes vinculadas ao seu perfil docente.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg h-11 px-6 font-bold">
              <Plus className="h-5 w-5" /> Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-primary">Adicionar Turma</DialogTitle>
              <DialogDescription>A nova turma será vinculada ao seu UID: {user?.uid}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateClass} className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-bold">Nome da Turma</Label>
                <Input id="name" placeholder="Ex: 9º Ano B - Vespertino" value={newClass.name} onChange={(e) => setNewClass({...newClass, name: e.target.value})} required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="font-bold">Disciplina</Label>
                <Select value={newClass.subject} onValueChange={(v: any) => setNewClass({...newClass, subject: v})}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Portuguese">Português</SelectItem>
                    <SelectItem value="Math">Matemática</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-12 font-black shadow-xl">GRAVAR NO BANCO</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Filtrar minhas turmas no Firestore..." className="pl-10 bg-white border-none shadow-sm h-12 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((cls) => (
            <Card key={cls.id} className="border-none shadow-md overflow-hidden group hover:shadow-2xl transition-all duration-300 bg-white border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
                <div className={`h-12 w-12 rounded-xl ${cls.subject === 'Portuguese' ? 'bg-primary' : 'bg-accent'} flex items-center justify-center text-white shadow-lg`}>
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <CardTitle className="text-xl font-black group-hover:text-primary transition-colors truncate">{cls.name}</CardTitle>
                  <Badge variant="secondary" className="text-[9px] font-black uppercase mt-1 tracking-wider">
                    {cls.subject === 'Portuguese' ? 'Língua Portuguesa' : 'Matemática'}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClass(cls.id)}>
                   <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span className="font-bold">{getStudentCount(cls.id)} Alunos vinculados</span>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 p-4 flex gap-2 border-t">
                <Button variant="outline" size="sm" className="flex-1 font-black h-10 hover:bg-primary hover:text-white transition-colors" asChild>
                  <Link href={`/students?class=${cls.id}`}>GERENCIAR</Link>
                </Button>
                <Button size="sm" className="flex-1 font-black h-10 shadow-md gap-2" asChild>
                  <Link href={`/attendance?class=${cls.id}`}>CHAMADA <ArrowRight className="h-3 w-3" /></Link>
                </Button>
              </CardFooter>
            </Card>
          ))}

          {filteredClasses.length === 0 && (
            <div className="col-span-full py-32 text-center opacity-40 border-4 border-dashed rounded-3xl bg-muted/10 flex flex-col items-center">
              <BookOpen className="h-20 w-20 mb-6 text-primary/40" />
              <p className="text-2xl font-black text-primary/60 uppercase tracking-tighter">Nenhuma turma encontrada</p>
              <p className="text-sm font-medium mt-2">Clique no botão "Nova Turma" para registrar sua primeira classe.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
