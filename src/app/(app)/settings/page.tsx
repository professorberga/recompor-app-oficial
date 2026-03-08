
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  School, 
  Settings as SettingsIcon, 
  Bell, 
  Plus,
  Search,
  BookOpen,
  Users,
  UserPlus,
  Mail,
  Trash2,
  Pencil,
  Clock,
  Info,
  ChevronRight,
  UserCheck,
  UserCircle,
  Loader2,
  ShieldAlert,
  Save,
  ShieldCheck,
  MoreHorizontal,
  PlusCircle,
  X
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogPortal } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { TeacherProfile, UserRole, TeacherAssignment } from "@/lib/types"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase/provider"
import { doc, setDoc, collection, query, deleteDoc } from "firebase/firestore"

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  const { user, profile, isAdmin, isUserLoading } = useUser()
  const firestore = useFirestore()
  
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Partial<TeacherProfile> | null>(null)

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    subjects: [] as string[],
    schoolName: "E.E. Professor Milton Santos",
    academicYear: "2024",
    activeBimestre: "4"
  })

  // Dados para Gestão de Administrador
  const teachersRef = useMemoFirebase(() => isAdmin ? collection(firestore, "teachers") : null, [isAdmin, firestore])
  const { data: allTeachers = [], isLoading: isTeachersLoading } = useCollection(teachersRef)

  // Classes para seleção nas atribuições
  const classesRef = useMemoFirebase(() => user ? collection(firestore, 'teachers', user.uid, 'classes') : null, [user, firestore])
  const { data: globalClasses = [] } = useCollection(classesRef)

  useEffect(() => {
    setMounted(true)
    if (profile) {
      setProfileData({
        name: profile.name || "",
        email: profile.email || "",
        subjects: profile.subjects || [],
        schoolName: profile.schoolName || "E.E. Professor Milton Santos",
        academicYear: profile.academicYear || "2024",
        activeBimestre: profile.activeBimestre || "4"
      })
    }
  }, [profile])

  const handleSaveProfile = async () => {
    if (!user) return
    setIsSaving(true)
    
    try {
      const teacherRef = doc(firestore, "teachers", user.uid)
      await setDoc(teacherRef, {
        id: user.uid,
        name: profileData.name,
        email: user.email,
        subjects: profileData.subjects,
        schoolName: profileData.schoolName,
        academicYear: profileData.academicYear,
        activeBimestre: profileData.activeBimestre,
        role: profile?.role || 'Professor' 
      }, { merge: true })
      
      toast({ title: "Configurações Salvas", description: "As informações foram atualizadas com sucesso." })
    } catch (error: any) {
      toast({ title: "Erro ao Salvar", description: "Verifique suas permissões.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin || !editingTeacher?.email) return
    
    setIsSaving(true)
    const teacherId = editingTeacher.id || Math.random().toString(36).substr(2, 9)
    
    try {
      await setDoc(doc(firestore, "teachers", teacherId), {
        ...editingTeacher,
        id: teacherId,
        role: editingTeacher.role || 'Professor'
      }, { merge: true })
      
      setIsTeacherDialogOpen(false)
      setEditingTeacher(null)
      toast({ title: "Docente Registrado", description: "Perfil atualizado no sistema." })
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao gravar docente.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTeacher = async (id: string) => {
    if (!isAdmin || id === user?.uid) return
    if (!confirm("Remover este professor do sistema?")) return

    try {
      await deleteDoc(doc(firestore, "teachers", id))
      toast({ title: "Removido", description: "Acesso revogado." })
    } catch (error) {
      toast({ title: "Erro ao remover", variant: "destructive" })
    }
  }

  const handleEditClick = (teacher: TeacherProfile) => {
    setEditingTeacher({ ...teacher });
    // Pequeno delay para garantir que o DropdownMenu fechou e liberou o scroll
    setTimeout(() => setIsTeacherDialogOpen(true), 50);
  }

  const addAssignment = () => {
    if (!editingTeacher) return;
    const currentAssignments = editingTeacher.assignments || [];
    setEditingTeacher({
      ...editingTeacher,
      assignments: [...currentAssignments, { classId: "", className: "", subject: "Português" }]
    });
  }

  const removeAssignment = (index: number) => {
    if (!editingTeacher || !editingTeacher.assignments) return;
    const next = [...editingTeacher.assignments];
    next.splice(index, 1);
    setEditingTeacher({ ...editingTeacher, assignments: next });
  }

  const updateAssignment = (index: number, field: keyof TeacherAssignment, value: string) => {
    if (!editingTeacher || !editingTeacher.assignments) return;
    const next = [...editingTeacher.assignments];
    const assignment = { ...next[index], [field]: value };
    
    if (field === 'classId') {
      const selectedClass = globalClasses.find(c => c.id === value);
      assignment.className = selectedClass?.name || "";
    }
    
    next[index] = assignment;
    setEditingTeacher({ ...editingTeacher, assignments: next });
  }

  if (!mounted || isUserLoading) return (
    <div className="flex items-center justify-center p-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Configurações</h2>
          <p className="text-muted-foreground mt-1">Gerencie seu perfil e os dados da unidade escolar.</p>
        </div>
        <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-2 shadow-lg">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Alterações
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto bg-white border shadow-sm p-1">
          <TabsTrigger value="profile" className="gap-2 font-bold py-2"><UserCircle className="h-4 w-4" /> Perfil</TabsTrigger>
          <TabsTrigger value="school" className="gap-2 font-bold py-2"><School className="h-4 w-4" /> Escola</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 font-bold py-2"><Bell className="h-4 w-4" /> Alertas</TabsTrigger>
          {isAdmin && <TabsTrigger value="users" className="gap-2 font-bold py-2"><ShieldAlert className="h-4 w-4" /> Gestão</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>Informações vinculadas ao seu registro docente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input 
                    value={profileData.name} 
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail Institucional</Label>
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Minhas Disciplinas (Atribuição Manual)</Label>
                <div className="flex flex-wrap gap-2 p-4 border rounded-lg bg-slate-50/50">
                  {['Português', 'Matemática', 'Ciências', 'História', 'Geografia', 'Inglês', 'Artes'].map(subj => (
                    <label key={subj} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border cursor-pointer hover:border-primary transition-colors">
                      <Checkbox 
                        checked={profileData.subjects.includes(subj)}
                        onCheckedChange={(checked) => {
                          const newSubjects = checked 
                            ? [...profileData.subjects, subj]
                            : profileData.subjects.filter(s => s !== subj);
                          setProfileData({...profileData, subjects: newSubjects});
                        }}
                      />
                      <span className="text-sm font-semibold">{subj}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="school" className="mt-6">
           <Card className="border-none shadow-md bg-white">
            <CardHeader><CardTitle>Informações da Unidade</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Escola</Label>
                <Input value={profileData.schoolName} onChange={(e) => setProfileData({...profileData, schoolName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ano Letivo</Label>
                  <Input value={profileData.academicYear} onChange={(e) => setProfileData({...profileData, academicYear: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Bimestre Ativo</Label>
                  <Select value={profileData.activeBimestre} onValueChange={(v) => setProfileData({...profileData, activeBimestre: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1º Bimestre</SelectItem>
                      <SelectItem value="2">2º Bimestre</SelectItem>
                      <SelectItem value="3">3º Bimestre</SelectItem>
                      <SelectItem value="4">4º Bimestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="mt-6 space-y-6">
            <Card className="border-none shadow-md bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestão de Professores</CardTitle>
                  <CardDescription>Controle de acesso e atribuição institucional.</CardDescription>
                </div>
                <Button onClick={() => { setEditingTeacher({}); setIsTeacherDialogOpen(true); }} className="gap-2">
                  <UserPlus className="h-4 w-4" /> Novo Professor
                </Button>
              </CardHeader>
              <CardContent>
                {isTeachersLoading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div> : (
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 border-b text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <tr>
                          <th className="px-6 py-4">Docente</th>
                          <th className="px-6 py-4">Cargo</th>
                          <th className="px-6 py-4">Atribuições</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {allTeachers.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-primary uppercase text-xs">{t.name}</span>
                                <span className="text-[10px] text-muted-foreground">{t.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={t.role === 'Admin' ? 'default' : 'secondary'} className="text-[9px] font-black uppercase">
                                {t.role === 'Admin' && <ShieldCheck className="h-3 w-3 mr-1" />}
                                {t.role}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {t.assignments?.map((a, idx) => (
                                  <Badge key={idx} variant="outline" className="text-[8px] bg-slate-50">
                                    {a.className}: {a.subject}
                                  </Badge>
                                ))}
                                {(!t.assignments || t.assignments.length === 0) && <span className="text-[10px] italic opacity-50">Sem atribuição</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditClick(t)}>
                                    <Pencil className="h-4 w-4 mr-2" /> Editar Atribuição
                                  </DropdownMenuItem>
                                  {t.id !== user?.uid && (
                                    <DropdownMenuItem onClick={() => handleDeleteTeacher(t.id)} className="text-destructive">
                                      <Trash2 className="h-4 w-4 mr-2" /> Revogar Acesso
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* DIALOG DE GESTÃO DE PROFESSOR - FORA DO DROPDOWN */}
      <Dialog open={isTeacherDialogOpen} onOpenChange={setIsTeacherDialogOpen}>
        <DialogPortal>
          <DialogContent className="max-w-3xl w-[95vw] h-[90vh] flex flex-col p-0 bg-white" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader className="p-6 border-b">
              <DialogTitle>{editingTeacher?.id ? 'Editar' : 'Novo'} Docente</DialogTitle>
              <DialogDescription>Configure as permissões e atribuições do professor.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1">
              <form id="teacher-form" onSubmit={handleSaveTeacher} className="space-y-6 p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input 
                      value={editingTeacher?.name || ""} 
                      onChange={(e) => setEditingTeacher({...editingTeacher, name: e.target.value})} 
                      placeholder="Nome do professor" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail Institucional</Label>
                    <Input 
                      value={editingTeacher?.email || ""} 
                      onChange={(e) => setEditingTeacher({...editingTeacher, email: e.target.value})} 
                      placeholder="email@escola.gov.br" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Perfil de Acesso</Label>
                    <Select value={editingTeacher?.role || "Professor"} onValueChange={(v: UserRole) => setEditingTeacher({...editingTeacher, role: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Professor">Professor</SelectItem>
                        <SelectItem value="Admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-bold">Atribuições de Turma</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addAssignment} className="gap-2">
                      <PlusCircle className="h-4 w-4" /> Adicionar Atribuição
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {editingTeacher?.assignments?.map((assignment, idx) => (
                      <div key={idx} className="flex gap-3 items-end p-4 border rounded-xl bg-slate-50 relative group">
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-[10px] uppercase font-bold">Turma</Label>
                          <Select value={assignment.classId} onValueChange={(v) => updateAssignment(idx, 'classId', v)}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {globalClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-[10px] uppercase font-bold">Disciplina</Label>
                          <Select value={assignment.subject} onValueChange={(v) => updateAssignment(idx, 'subject', v)}>
                            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Português">Português</SelectItem>
                              <SelectItem value="Matemática">Matemática</SelectItem>
                              <SelectItem value="Ciências">Ciências</SelectItem>
                              <SelectItem value="História">História</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="text-destructive h-10 w-10 hover:bg-destructive/10" onClick={() => removeAssignment(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {(!editingTeacher?.assignments || editingTeacher.assignments.length === 0) && (
                      <div className="text-center py-6 border-2 border-dashed rounded-xl opacity-40 italic text-sm">
                        Nenhuma turma atribuída a este docente.
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </ScrollArea>
            <DialogFooter className="p-6 border-t bg-slate-50">
              <Button type="submit" form="teacher-form" disabled={isSaving} className="w-full h-12 font-bold shadow-lg">
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Gravar Atribuição no Firestore
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  )
}
