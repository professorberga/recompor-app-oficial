
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth"
import { useAuth, useUser } from "@/firebase/provider"
import { Brain, Mail, Lock, ArrowRight, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isUserLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Garante que a sessão persista mesmo após fechar o navegador
      await setPersistence(auth, browserLocalPersistence)
      
      await signInWithEmailAndPassword(auth, email, password)
      
      toast({
        title: "Bem-vindo de volta!",
        description: "Acesso autorizado com sucesso.",
      })
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Erro ao fazer login:", error)
      let message = "Ocorreu um erro ao tentar entrar. Tente novamente."
      
      // Tratamento específico de erros do Firebase Auth
      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
          message = "E-mail ou senha incorretos. Verifique suas credenciais."
          break
        case "auth/invalid-email":
          message = "O formato do e-mail é inválido. Use um e-mail institucional."
          break
        case "auth/user-disabled":
          message = "Este usuário foi desativado. Entre em contato com a administração."
          break
        case "auth/too-many-requests":
          message = "Muitas tentativas sem sucesso. Tente novamente mais tarde."
          break
      }

      toast({
        title: "Falha na Autenticação",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg mb-4">
            <Brain className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-primary tracking-tighter uppercase">Recompor+</h1>
          <p className="text-muted-foreground text-sm font-medium">Gestão de Recomposição das Aprendizagens</p>
        </div>

        <Card className="border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Acesse sua conta</CardTitle>
            <CardDescription>
              Entre com seu e-mail institucional para gerenciar suas turmas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="nome@escola.gov.br" 
                    className="pl-10 h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Button variant="link" className="px-0 font-normal text-xs" type="button">
                    Esqueceu a senha?
                  </Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    className="pl-10 h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 font-bold shadow-lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    Entrar no Sistema <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-slate-50 p-4 border-t">
            <p className="text-[10px] text-center w-full text-muted-foreground uppercase font-bold tracking-widest">
              Ambiente Seguro • E.E. Professor Milton Santos
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
