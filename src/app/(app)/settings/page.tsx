
"use client"

import { useState, useEffect } from "react"
import { 
  User, 
  School, 
  Settings as SettingsIcon, 
  Bell, 
  ShieldCheck, 
  Save, 
  Moon, 
  Sun,
  Globe
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
        description: "Suas preferências foram atualizadas com sucesso.",
      })
    }, 800)
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Configurações</h2>
        <p className="text-muted-foreground mt-1">Gerencie sua conta, escola e preferências do sistema.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12 bg-white border shadow-sm">
          <TabsTrigger value="profile" className="gap-2 font-bold"><User className="h-4 w-4" /> Perfil</TabsTrigger>
          <TabsTrigger value="school" className="gap-2 font-bold"><School className="h-4 w-4" /> Escola</TabsTrigger>
          <TabsTrigger value="system" className="gap-2 font-bold"><SettingsIcon className="h-4 w-4" /> Sistema</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 font-bold"><Bell className="h-4 w-4" /> Avisos</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle>Perfil do Professor</CardTitle>
              <CardDescription>Atualize suas informações pessoais e de contato.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/30">
                  <User className="h-12 w-12 text-primary/40" />
                </div>
                <Button variant="outline" size="sm">Alterar Foto</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" defaultValue="Ricardo Silva" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail Institucional</Label>
                  <Input id="email" type="email" defaultValue="ricardo.silva@escola.gov.br" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Disciplina Principal</Label>
                  <Select defaultValue="Portuguese">
                    <SelectTrigger id="subject">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Portuguese">Língua Portuguesa</SelectItem>
                      <SelectItem value="Math">Matemática</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration">Registro Funcional (RE)</Label>
                  <Input id="registration" defaultValue="987.654-3" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t p-6">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 ml-auto">
                <Save className="h-4 w-4" /> {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="school" className="mt-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle>Dados da Unidade Escolar</CardTitle>
              <CardDescription>Configurações da escola onde você leciona atualmente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="school-name">Nome da Escola</Label>
                <Input id="school-name" defaultValue="E.E. Professor Milton Santos" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Ano Letivo</Label>
                  <Select defaultValue="2024">
                    <SelectTrigger id="year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term">Bimestre Atual</Label>
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
                <h4 className="text-sm font-bold flex items-center gap-2 text-primary"><ShieldCheck className="h-4 w-4" /> Critérios de Avaliação</h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Média Mínima para Aprovação</Label>
                    <p className="text-xs text-muted-foreground">Define o limite de cor para notas vermelhas nos relatórios.</p>
                  </div>
                  <Input className="w-20 text-center font-bold" defaultValue="5.0" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Frequência Mínima (%)</Label>
                    <p className="text-xs text-muted-foreground">Percentual exigido para aprovação anual.</p>
                  </div>
                  <Input className="w-20 text-center font-bold" defaultValue="75" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t p-6">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 ml-auto">
                <Save className="h-4 w-4" /> Salvar Configurações Escolares
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle>Preferências do Sistema</CardTitle>
              <CardDescription>Personalize a aparência e comportamento do Monitor do BEEM.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <Label>Modo de Exibição</Label>
                    <p className="text-xs text-muted-foreground">Alternar entre tema claro e escuro automaticamente.</p>
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
                    <Label>Idioma do Sistema</Label>
                    <p className="text-xs text-muted-foreground">Idioma utilizado em toda a interface.</p>
                  </div>
                </div>
                <Select defaultValue="pt-BR">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en">English (US)</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <SettingsIcon className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <Label>Sincronização em Nuvem</Label>
                    <p className="text-xs text-muted-foreground">Manter dados atualizados entre dispositivos.</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle>Alertas e Notificações</CardTitle>
              <CardDescription>Escolha quais avisos você deseja receber no seu painel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Faltas Críticas</Label>
                  <p className="text-xs text-muted-foreground">Avisar quando um aluno atingir o limite de ausências.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Desempenho Baixo</Label>
                  <p className="text-xs text-muted-foreground">Notificar quando médias Bloom caírem significativamente.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Chamadas Pendentes</Label>
                  <p className="text-xs text-muted-foreground">Lembrar de realizar a chamada no final do período.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Insights de IA</Label>
                  <p className="text-xs text-muted-foreground">Avisar quando novos relatórios pedagógicos estiverem prontos.</p>
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
