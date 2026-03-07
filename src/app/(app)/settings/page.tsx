
"use client"

import { useState, useEffect } from "react"
import { 
  School, 
  Settings as SettingsIcon, 
  Bell, 
  ShieldCheck, 
  Save, 
  Moon, 
  Sun,
  Globe,
  Lock,
  Users,
  UserPlus,
  Mail,
  Trash2,
  Check,
  MoreHorizontal,
  Search,
  Pencil,
  Key,
  BookOpen,
  Clock,
  Plus,
  UserCheck,
  Info,
  ChevronRight,
  UserCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

type UserRole = 'Admin' | 'Professor';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'Ativo' | 'Inativo';
}

interface Discipline {
  id: string;
  name: string;
  classId: string;
  teacherId: string;
  schedule: string;
}

const INITIAL_USERS: SystemUser[] = [
  { 
    id: 'admin-1', 
    name: 'Marcio Bergamini', 
    email: 'marciobergamini@prof.educacao.sp.gov.br', 
    role: 'Admin', 
    status: 'Ativo' 
  },
  { 
    id: 'prof-1', 
    name: 'Ricardo Silva', 
    email: 'ricardo.silva@escola.gov.br', 
    role: 'Professor', 
    status: 'Ativo' 
  },
]

const MOCK_CLASSES = [
  { id: '1', name: '9º Ano A' },
  { id: '2', name: '9º Ano B' },
  { id: '3', name: '8º Ano A' },
]

const MOCK_SCHEDULES = [
  "07:00 às 07:50",
  "07:50 às 08:40",
  "08:40 às 09:30",
  "09:45 às 10:35",
  "10:35 às 11:25",
  "12:25 às 13:15",
  "13:15 às 14:05",
  "14:20 às 15:10",
  "15:10 às 16:00",
]

const INITIAL_DISCIPLINES: Discipline[] = [
  { id: 'd1', name: 'Língua Portuguesa', classId: '1', teacherId: 'prof-1', schedule: '07:00 às 07:50' },
  { id: 'd2', name: 'Matemática', classId: '1', teacherId: 'prof-1', schedule: '07:50 às 08:40' },
]

const MOCK_STUDENTS = [
  { id: '1', name: 'Ana Beatriz Silva', ra: '123456', enrollments: ['d1', 'd2'] },
  { id: '2', name: 'Bruno Oliveira Souza', ra: '234567', enrollments: ['d1'] },
  { id: '3', name: 'Carlos Eduardo Santos', ra: '345678', enrollments: ['d2'] },
  { id: '4', name: 'Daniela Lima Ferreira', ra: '456789', enrollments: ['d1'] },
  { id: '5', name: 'Eduardo Pereira Costa', ra: '567890', enrollments: ['d1', 'd2'] },
  { id: '6', name: 'Fernanda Rocha Lima', ra: '678901', enrollments: ['d1'] },
  { id: '7', name: 'Gabriel Alvez Martins', ra: '789012', enrollments: ['d2'] },
  { id: '8', name: 'Helena Mendes Castro', ra: '890123', enrollments: ['d1'] },
]

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  
  const [isSaving, setIsSaving] = useState(false)

  // Estados para Gestão de Usuários
  const [users, setUsers] = useState<SystemUser[]>(INITIAL_USERS)
  const [userSearch, setUserSearch] = useState("")
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    role: "Professor" as UserRole,
    assignedDisciplineIds: [] as string[]
  })

  // Estados para Gestão de Disciplinas
  const [disciplines, setDisciplines] = useState<Discipline[]>(INITIAL_DISCIPLINES)
  const [isDisciplineDialogOpen, setIsDisciplineDialogOpen] = useState(false)
  const [selectedDisciplineForStudents, setSelectedDisciplineForStudents] = useState<Discipline | null>(null)
  const [isViewStudentsDialogOpen, setIsViewStudentsDialogOpen] = useState(false)
  
  const [newDiscipline, setNewDiscipline] = useState({
    name: "",
    classId: "",
    teacherId: "",
    schedule: MOCK_SCHEDULES[0]
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: "Configurações Salvas",
        description: "As preferências globais do sistema foram atualizadas.",
      })
    }, 800)
  }

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userFormData.name || !userFormData.email) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" })
      return
    }

    let targetUserId = "";

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, name: userFormData.name, email: userFormData.email, role: userFormData.role } : u))
      targetUserId = editingUser.id;
      toast({ title: "Usuário Atualizado" })
    } else {
      const newUser: SystemUser = {
        id: Math.random().toString(36).substr(2, 9),
        name: userFormData.name,
        email: userFormData.email,
        role: userFormData.role,
        status: 'Ativo'
      }
      setUsers([newUser, ...users])
      targetUserId = newUser.id;
      toast({ title: "Usuário Cadastrado" })
    }

    // Sincronizar disciplinas associadas
    if (userFormData.role === 'Professor' || userFormData.role === 'Admin') {
      const updatedDisciplines = disciplines.map(d => {
        const isAssigned = userFormData.assignedDisciplineIds.includes(d.id);
        if (isAssigned) {
          return { ...d, teacherId: targetUserId };
        } else if (d.teacherId === targetUserId) {
          return { ...d, teacherId: "" };
        }
        return d;
      });
      setDisciplines(updatedDisciplines);
    }

    setIsUserDialogOpen(false)
    setEditingUser(null)
    setUserFormData({ name: "", email: "", role: "Professor", assignedDisciplineIds: [] })
  }

  const handleDisciplineSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDiscipline.name || !newDiscipline.classId || !newDiscipline.teacherId) {
      toast({ title: "Erro", description: "Preencha todos os campos da disciplina.", variant: "destructive" })
      return
    }

    const discipline: Discipline = {
      id: Math.random().toString(36).substr(2, 9),
      ...newDiscipline
    }
    setDisciplines([discipline, ...disciplines])
    setIsDisciplineDialogOpen(false)
    setNewDiscipline({ name: "", classId: "", teacherId: "", schedule: MOCK_SCHEDULES[0] })
    toast({ title: "Disciplina Cadastrada" })
  }

  const toggleDisciplineInUserForm = (id: string) => {
    setUserFormData(prev => ({
      ...prev,
      assignedDisciplineIds: prev.assignedDisciplineIds.includes(id)
        ? prev.assignedDisciplineIds.filter(dId => dId !== id)
        : [...prev.assignedDisciplineIds, id]
    }))
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  const enrolledStudentsForSelectedDiscipline = selectedDisciplineForStudents 
    ? MOCK_STUDENTS.filter(s => s.enrollments.includes(selectedDisciplineForStudents.id))
    : [];

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Configurações do Sistema</h2>
        <p className="text-muted-foreground mt-1">Gerencie disciplinas, usuários e parâmetros da instituição.</p>
      </div>

      <Tabs defaultValue="disciplines" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12 bg-white border shadow-sm">
          <TabsTrigger value="disciplines" className="gap-2 font-bold"><BookOpen className="h-4 w-4" /> Disciplinas</TabsTrigger>
          <TabsTrigger value="users" className="gap-2 font-bold"><Users className="h-4 w-4" /> Usuários</TabsTrigger>
          <TabsTrigger value="school" className="gap-2 font-bold"><School className="h-4 w-4" /> Escola</TabsTrigger>
          <TabsTrigger value="system" className="gap-2 font-bold"><SettingsIcon className="h-4 w-4" /> Interface</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 font-bold"><Bell className="h-4 w-4" /> Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="disciplines" className="mt-6 space-y-6">
          <Card className="border-none shadow-md bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
              <div>
                <CardTitle>Gestão de Disciplinas</CardTitle>
                <CardDescription>Cadastre matérias e associe-as a turmas, professores e horários.</CardDescription>
              </div>
              <Dialog open={isDisciplineDialogOpen} onOpenChange={setIsDisciplineDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-lg">
                    <Plus className="h-4 w-4" /> Nova Disciplina
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-white">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Disciplina</DialogTitle>
                    <DialogDescription>Preencha os dados da nova disciplina letiva.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleDisciplineSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nome da Disciplina</Label>
                      <Input 
                        placeholder="Ex: Redação e Gramática" 
                        value={newDiscipline.name}
                        onChange={(e) => setNewDiscipline({...newDiscipline, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Turma</Label>
                      <Select value={newDiscipline.classId} onValueChange={(v) => setNewDiscipline({...newDiscipline, classId: v})}>
                        <SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                        <SelectContent>
                          {MOCK_CLASSES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Professor Responsável</Label>
                      <Select value={newDiscipline.teacherId} onValueChange={(v) => setNewDiscipline({...newDiscipline, teacherId: v})}>
                        <SelectTrigger><SelectValue placeholder="Selecione o professor" /></SelectTrigger>
                        <SelectContent>
                          {users.filter(u => u.role === 'Professor' || u.role === 'Admin').map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Horário</Label>
                      <Select value={newDiscipline.schedule} onValueChange={(v) => setNewDiscipline({...newDiscipline, schedule: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MOCK_SCHEDULES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter className="pt-4">
                      <Button type="submit" className="w-full">Salvar Disciplina</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/20 border-b text-[10px] font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Disciplina</th>
                      <th className="px-6 py-4">Turma</th>
                      <th className="px-6 py-4">Professor</th>
                      <th className="px-6 py-4">Horário</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {disciplines.map((d) => (
                      <tr key={d.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 font-bold">
                          <button 
                            onClick={() => {
                              setSelectedDisciplineForStudents(d);
                              setIsViewStudentsDialogOpen(true);
                            }}
                            className="text-primary hover:underline flex items-center gap-1.5 transition-all text-left"
                          >
                            {d.name}
                            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary">{MOCK_CLASSES.find(c => c.id === d.classId)?.name}</Badge>
                        </td>
                        <td className="px-6 py-4 flex items-center gap-2">
                          <UserCheck className="h-3 w-3 text-muted-foreground" />
                          {users.find(u => u.id === d.teacherId)?.name || "Não atribuído"}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                          <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {d.schedule}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" onClick={() => setDisciplines(disciplines.filter(x => x.id !== d.id))}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card className="border-none shadow-md bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
              <div>
                <CardTitle>Gestão de Usuários</CardTitle>
                <CardDescription>Adicione ou remova permissões de acesso ao sistema.</CardDescription>
              </div>
              <Dialog open={isUserDialogOpen} onOpenChange={(open) => {
                setIsUserDialogOpen(open);
                if (!open) {
                  setEditingUser(null);
                  setUserFormData({ name: "", email: "", role: "Professor", assignedDisciplineIds: [] });
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-lg"><UserPlus className="h-4 w-4" /> Novo Usuário</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl w-[95vw] h-[90vh] bg-white flex flex-col p-0 overflow-hidden">
                  <DialogHeader className="p-6 border-b shrink-0">
                    <DialogTitle>{editingUser ? 'Editar Usuário' : 'Cadastrar Usuário'}</DialogTitle>
                    <DialogDescription>Dados de acesso e atribuições de disciplinas.</DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="flex-1">
                    <form id="user-form" onSubmit={handleUserSubmit} className="space-y-6 p-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                          <Label>Nome Completo</Label>
                          <Input value={userFormData.name} onChange={(e) => setUserFormData({...userFormData, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>E-mail</Label>
                          <Input type="email" value={userFormData.email} onChange={(e) => setUserFormData({...userFormData, email: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Perfil de Acesso</Label>
                          <Select value={userFormData.role} onValueChange={(v: any) => setUserFormData({...userFormData, role: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Professor">Professor</SelectItem>
                              <SelectItem value="Admin">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {(userFormData.role === 'Professor' || userFormData.role === 'Admin') && (
                        <div className="space-y-4 pt-4 border-t">
                          <h4 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <BookOpen className="h-4 w-4" /> Atribuição de Aulas
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {disciplines.map((d) => (
                              <label key={d.id} className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                userFormData.assignedDisciplineIds.includes(d.id) ? "bg-primary/5 border-primary/20" : "hover:bg-muted/5"
                              )}>
                                <Checkbox 
                                  checked={userFormData.assignedDisciplineIds.includes(d.id)} 
                                  onCheckedChange={() => toggleDisciplineInUserForm(d.id)} 
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold">{d.name}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase">{MOCK_CLASSES.find(c => c.id === d.classId)?.name} • {d.schedule}</span>
                                </div>
                              </label>
                            ))}
                            {disciplines.length === 0 && (
                              <p className="text-xs italic text-muted-foreground col-span-2 py-4">Nenhuma disciplina cadastrada para atribuição.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </form>
                  </ScrollArea>
                  <DialogFooter className="p-6 border-t bg-slate-50 shrink-0">
                    <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit" form="user-form" className="px-8 shadow-lg font-bold">Salvar Alterações</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 border-b bg-muted/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar usuários..." className="pl-10 h-10 bg-white" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/20 border-b text-[10px] font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Usuário</th>
                      <th className="px-6 py-4">Perfil</th>
                      <th className="px-6 py-4">Disciplinas</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map((user) => {
                      const teacherDisciplines = disciplines.filter(d => d.teacherId === user.id);
                      return (
                        <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold">{user.name}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4"><Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>{user.role}</Badge></td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {teacherDisciplines.length > 0 ? (
                                teacherDisciplines.map(d => (
                                  <Badge key={d.id} variant="outline" className="text-[9px] h-4">
                                    {d.name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic">Nenhuma</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4"><Badge variant="outline" className="text-green-600 bg-green-50">{user.status}</Badge></td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => {
                                setEditingUser(user);
                                setUserFormData({
                                  name: user.name,
                                  email: user.email,
                                  role: user.role,
                                  assignedDisciplineIds: disciplines.filter(d => d.teacherId === user.id).map(d => d.id)
                                });
                                setIsUserDialogOpen(true);
                              }}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setUsers(users.filter(x => x.id !== user.id))}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="school" className="mt-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle>Dados da Unidade Escolar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Nome da Unidade Escolar</Label>
                <Input defaultValue="E.E. Professor Milton Santos" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ano Letivo</Label>
                  <Select defaultValue="2024"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="2024">2024</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2">
                  <Label>Bimestre</Label>
                  <Select defaultValue="4"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="4">4º Bimestre</SelectItem></SelectContent></Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t p-6">
              <Button onClick={handleSave} disabled={isSaving} className="ml-auto">Salvar Alterações</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Alunos Matriculados na Disciplina */}
      <Dialog open={isViewStudentsDialogOpen} onOpenChange={setIsViewStudentsDialogOpen}>
        <DialogContent className="max-w-[500px] w-[95vw] h-[600px] max-h-[90vh] bg-white p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-6 bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center border border-white/40">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">
                  {selectedDisciplineForStudents?.name}
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/80 font-medium">
                  Alunos Matriculados nesta Disciplina
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="px-6 py-4 flex items-center justify-between shrink-0 bg-slate-50/50">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Info className="h-4 w-4" /> Total de Alunos: {enrolledStudentsForSelectedDiscipline.length}
            </span>
            <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[10px] font-bold">
              {MOCK_CLASSES.find(c => c.id === selectedDisciplineForStudents?.classId)?.name}
            </Badge>
          </div>

          <ScrollArea className="flex-1 px-6">
            <div className="space-y-2 py-4">
              {enrolledStudentsForSelectedDiscipline.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold group-hover:text-primary transition-colors">{student.name}</span>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">RA: {student.ra}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                </div>
              ))}

              {enrolledStudentsForSelectedDiscipline.length === 0 && (
                <div className="py-20 text-center opacity-30 flex flex-col items-center">
                  <UserCircle className="h-10 w-10 mb-2" />
                  <p className="text-sm font-bold">Nenhum aluno matriculado.</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-4 bg-slate-50 border-t shrink-0">
            <Button variant="outline" className="w-full" onClick={() => setIsViewStudentsDialogOpen(false)}>
              Fechar Visualização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
