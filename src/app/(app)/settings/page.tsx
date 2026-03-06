
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
  Lock
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

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  
  // Simulando verificação de admin (Marcio Bergamini)
  const [isAdmin, setIsAdmin] = useState(true) 
  const [isSaving, setIsSaving] = useState(false)

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
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Configurações do Sistema</h2>
        <p className="text-muted-foreground mt-1">Gerencie os parâmetros globais e regras de negócio da instituição.</p>
      </div>

      <Tabs defaultValue="school" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-white border shadow-sm">
          <TabsTrigger value="school" className="gap-2 font-bold"><School className="h-4 w-4" /> Escola</TabsTrigger>
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
