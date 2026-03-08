
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
  MoreHorizontal
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { TeacherProfile, UserRole } from "@/lib/types"
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

  useEffect(() => {
    setMounted(true)
    if (profile) {
      setProfileData({
        name: profile.name || "",
        email: profile.email || "",
        subjects: profile.subjects || [],
        schoolName: (profile as any).schoolName || "E.E. Professor Milton Santos",
        academicYear: (profile as any).academicYear || "2024",
        activeBimestre: (profile as any).activeBimestre || "4"
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
        subjects: editingTeacher.subjects || [],
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
                <Label>Minhas Disciplinas</Label>
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
                  <CardDescription>Controle de acesso e atribuição da unidade {profile?.schoolName}.</CardDescription>
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
                          <th className="px-6 py-4">Disciplinas</th>
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
                                {t.subjects?.map(s => <Badge key={s} variant="outline" className="text-[8px]">{s}</Badge>)}
                                {(!t.subjects || t.subjects.length === 0) && <span className="text-[10px] italic opacity-50">Não atribuída</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditingTeacher(t); setIsTeacherDialogOpen(true); }}>
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

      {/* DIALOG DE GESTÃO DE PROFESSOR */}
      <Dialog open={isTeacherDialogOpen} onOpenChange={setIsTeacherDialogOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>{editingTeacher?.id ? 'Editar' : 'Novo'} Docente</DialogTitle>
            <DialogDescription>Configure as permissões e disciplinas do professor.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveTeacher} className="space-y-4 py-4">
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
              <div className="space-y-2">
                <Label>Escola</Label>
                <Input value={editingTeacher?.schoolName || profile?.schoolName} onChange={(e) => setEditingTeacher({...editingTeacher, schoolName: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Atribuição de Disciplinas</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
                {['Português', 'Matemática', 'Ciências', 'História', 'Geografia', 'Inglês', 'Artes'].map(subj => (
                  <label key={subj} className="flex items-center gap-2 cursor-pointer p-1">
                    <Checkbox 
                      checked={editingTeacher?.subjects?.includes(subj)}
                      onCheckedChange={(checked) => {
                        const current = editingTeacher?.subjects || [];
                        const next = checked ? [...current, subj] : current.filter(s => s !== subj);
                        setEditingTeacher({...editingTeacher, subjects: next});
                      }}
                    />
                    <span className="text-xs">{subj}</span>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Gravar no Firestore
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
