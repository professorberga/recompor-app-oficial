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
  Key
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

type UserRole = 'Admin' | 'Professor';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'Ativo' | 'Inativo';
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

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  
  // Simulando verificação de admin (Marcio Bergamini)
  const [isAdmin, setIsAdmin] = useState(true) 
  const [isSaving, setIsSaving] = useState(false)

  // Estados para Gestão de Usuários
  const [users, setUsers] = useState<SystemUser[]>(INITIAL_USERS)
  const [searchTerm, setSearchTerm] = useState("")
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "Professor" as UserRole
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
    
    if (!newUser.name || !newUser.email) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" })
      return
    }

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...newUser } : u))
      toast({
        title: "Usuário Atualizado",
        description: `Os dados de ${newUser.name} foram salvos com sucesso.`,
      })
    } else {
      const user: SystemUser = {
        id: Math.random().toString(36).substr(2, 9),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: 'Ativo'
      }
      setUsers([user, ...users])
      toast({
        title: "Usuário Cadastrado",
        description: `O ${user.role} ${user.name} foi adicionado com sucesso.`,
      })
    }

    setIsUserDialogOpen(false)
    setEditingUser(null)
    setNewUser({ name: "", email: "", role: "Professor" })
  }

  const openEditUserDialog = (user: SystemUser) => {
    setEditingUser(user)
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role
    })
    setIsUserDialogOpen(true)
  }

  const deleteUser = (id: string) => {
    const userToDelete = users.find(u => u.id === id)
    if (userToDelete?.email === 'marciobergamini@prof.educacao.sp.gov.br') {
      toast({ 
        title: "Ação Negada", 
        description: "Não é possível remover o administrador principal do sistema.", 
        variant: "destructive" 
      })
      return
    }
    setUsers(users.filter(u => u.id !== id))
    toast({ title: "Usuário Removido" })
  }

  const handleResetPassword = (name: string) => {
    toast({
      title: "Senha Resetada",
      description: `Um e-mail de redefinição foi enviado para ${name}.`,
    })
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!mounted) return null

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
          <Lock className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-bold text-foreground">Acesso Restrito</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          Apenas usuários com perfil de Administrador podem acessar as configurações globais do sistema.
        </p>
        <Button className="mt-6" variant="outline" asChild>
          <a href="/dashboard">Voltar para o Dashboard</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Configurações do Sistema</h2>
        <p className="text-muted-foreground mt-1">Gerencie os parâmetros globais, regras de negócio e usuários da instituição.</p>
      </div>

      <Tabs defaultValue="school" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12 bg-white border shadow-sm">
          <TabsTrigger value="school" className="gap-2 font-bold"><School className="h-4 w-4" /> Escola</TabsTrigger>
          <TabsTrigger value="users" className="gap-2 font-bold"><Users className="h-4 w-4" /> Usuários</TabsTrigger>
          <TabsTrigger value="system" className="gap-2 font-bold"><SettingsIcon className="h-4 w-4" /> Interface</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 font-bold"><Bell className="h-4 w-4" /> Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="school" className="mt-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle>Dados da Unidade Escolar</CardTitle>
              <CardDescription>Configurações oficiais da escola e critérios pedagógicos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="school-name">Nome da Unidade Escolar</Label>
                <Input id="school-name" defaultValue="E.E. Professor Milton Santos" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Ano Letivo Vigente</Label>
                  <Select defaultValue="2024">
                    <SelectTrigger id="year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term">Bimestre de Referência</Label>
                  <Select defaultValue="4">
                    <SelectTrigger id="term">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1º Bimestre</SelectItem>
                      <SelectItem value="2">2º Bimestre</SelectItem>
                      <SelectItem value="3">3º Bimestre</SelectItem>
                      <SelectItem value="4">4º Bimestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2 text-primary"><ShieldCheck className="h-4 w-4" /> Regras de Aprovação</h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Média Mínima Bloom</Label>
                    <p className="text-xs text-muted-foreground">Exigência mínima para atingir o nível satisfatório.</p>
                  </div>
                  <Input className="w-20 text-center font-bold" defaultValue="5.0" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Frequência Anual Mínima (%)</Label>
                    <p className="text-xs text-muted-foreground">Percentual exigido para aprovação direta.</p>
                  </div>
                  <Input className="w-20 text-center font-bold" defaultValue="75" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t p-6">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 ml-auto">
                <Save className="h-4 w-4" /> Salvar Configurações
              </Button>
            </CardFooter>
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
                setIsUserDialogOpen(open)
                if (!open) {
                  setEditingUser(null)
                  setNewUser({ name: "", email: "", role: "Professor" })
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-lg">
                    <UserPlus className="h-4 w-4" /> Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-white">
                  <DialogHeader>
                    <DialogTitle>{editingUser ? 'Editar Usuário' : 'Cadastrar Usuário'}</DialogTitle>
                    <DialogDescription>
                      {editingUser ? 'Atualize as informações do usuário selecionado.' : 'Adicione um novo professor ou administrador ao Recompor+.'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUserSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input 
                        id="name" 
                        placeholder="Ex: Ana Maria Souza" 
                        value={newUser.name}
                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input 
                        id="email" 
                        type="email"
                        placeholder="email@escola.gov.br" 
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        required
                        disabled={editingUser?.email === 'marciobergamini@prof.educacao.sp.gov.br'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Perfil de Acesso</Label>
                      <Select 
                        value={newUser.role} 
                        onValueChange={(v: any) => setNewUser({...newUser, role: v})}
                        disabled={editingUser?.email === 'marciobergamini@prof.educacao.sp.gov.br'}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Professor">Professor</SelectItem>
                          <SelectItem value="Admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter className="pt-4">
                      <Button type="submit" className="w-full">
                        {editingUser ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 border-b bg-muted/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar usuários..." 
                    className="pl-10 h-10 bg-white border-border"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/20 border-b text-[10px] font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Usuário</th>
                      <th className="px-6 py-4">Perfil</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">{user.name}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {user.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'} className="gap-1">
                            {user.role === 'Admin' && <ShieldCheck className="h-3 w-3" />}
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 gap-1">
                            <Check className="h-3 w-3" /> {user.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditUserDialog(user)}>
                                <Pencil className="h-4 w-4 mr-2" /> Editar Dados
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPassword(user.name)}>
                                <Key className="h-4 w-4 mr-2" /> Resetar Senha
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => deleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Remover Acesso
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle>Preferências Globais</CardTitle>
              <CardDescription>Aparência e comportamento padrão para todos os usuários.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <Label>Tema do Sistema</Label>
                    <p className="text-xs text-muted-foreground">Modo claro ou escuro automático.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Claro</span>
                  <Switch />
                  <span className="text-xs font-medium">Escuro</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <Label>Localidade</Label>
                    <p className="text-xs text-muted-foreground">Formatação de datas e números.</p>
                  </div>
                </div>
                <Select defaultValue="pt-BR">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle>Alertas de Segurança e IA</CardTitle>
              <CardDescription>Defina quais gatilhos disparam avisos para a gestão.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Aviso de Evasão Escolar</Label>
                  <p className="text-xs text-muted-foreground">Notificar quando um aluno faltar 3 dias seguidos.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Inconsistência de Notas</Label>
                  <p className="text-xs text-muted-foreground">Alertar quedas bruscas no nível Bloom entre avaliações.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
