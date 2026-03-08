
"use client"

import { useState, useEffect, useMemo } from "react"
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
  Save
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { SystemUser, Discipline, UserRole } from "@/lib/types"
import { useUser, useFirestore } from "@/firebase/provider"
import { doc, setDoc } from "firebase/firestore"

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user, profile, isAdmin, isUserLoading } = useUser()
  const firestore = useFirestore()
  
  const [isSaving, setIsSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    subjects: [] as string[]
  })

  useEffect(() => {
    setMounted(true)
    if (profile) {
      setProfileData({
        name: profile.name || "",
        email: profile.email || "",
        subjects: profile.subjects || []
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
        // Role é mantido se já existir ou definido como Professor por padrão se não for admin
        role: profile?.role || 'Professor' 
      }, { merge: true })
      
      console.log("Firestore: Perfil atualizado com sucesso para UID", user.uid)
      toast({ title: "Perfil Salvo", description: "Suas informações foram atualizadas no banco de dados." })
    } catch (error: any) {
      console.error("Firestore Error (Permissão negada ou falha de rede):", error)
      toast({ 
        title: "Erro ao Salvar", 
        description: "Você não tem permissão para editar este perfil ou houve uma falha na conexão.", 
        variant: "destructive" 
      })
    } finally {
      setIsSaving(false)
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
          <p className="text-muted-foreground mt-1">Gerencie seu perfil e as disciplinas da escola.</p>
        </div>
        <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-2 shadow-lg">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Alterações
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto bg-white border shadow-sm p-1">
          <TabsTrigger value="profile" className="gap-2 font-bold py-2"><UserCircle className="h-4 w-4" /> Meu Perfil</TabsTrigger>
          {isAdmin && <TabsTrigger value="users" className="gap-2 font-bold py-2"><Users className="h-4 w-4" /> Usuários</TabsTrigger>}
          <TabsTrigger value="school" className="gap-2 font-bold py-2"><School className="h-4 w-4" /> Escola</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 font-bold py-2"><Bell className="h-4 w-4" /> Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Estes dados são sincronizados com o seu diário de classe.</CardDescription>
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
                <Label>Disciplinas Atuantes</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-slate-50/50">
                  {['Português', 'Matemática', 'Ciências', 'História'].map(subj => (
                    <label key={subj} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border cursor-pointer hover:border-primary transition-colors">
                      <Checkbox 
                        checked={profileData.subjects.includes(subj)}
                        onCheckedChange={(checked) => {
                          const newSubjects = checked 
                            ? [...profileData.subjects, subj]
                            : profileData.subjects.filter(s => s !== subj);
                          setProfileData({...profileData, subjects: newSubjects});
                        }}
                      />
                      <span className="text-sm font-medium">{subj}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="school" className="mt-6">
           <Card className="border-none shadow-md bg-white">
            <CardHeader><CardTitle>Dados da Escola</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Unidade Escolar</Label>
                <Input defaultValue="E.E. Professor Milton Santos" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ano Letivo</Label>
                  <Input defaultValue="2024" />
                </div>
                <div className="space-y-2">
                  <Label>Bimestre Ativo</Label>
                  <Select defaultValue="4"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="4">4º Bimestre</SelectItem></SelectContent></Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {!isAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 mt-6">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-bold">Acesso de Professor</p>
            <p>Algumas configurações avançadas estão disponíveis apenas para a equipe gestora.</p>
          </div>
        </div>
      )}
    </div>
  )
}
