
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { useAuth, useUser, useFirestore } from "@/firebase/provider"
import { Brain, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  
  const auth = useAuth()
  const firestore = useFirestore()
  const { user, isUserLoading, schoolConfig } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  const SYSTEM_VERSION = "v1.2.6"

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isUserLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    
    setIsLoading(true)
    const sanitizedEmail = email.trim()

    try {
      await setPersistence(auth, browserLocalPersistence)
      const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password)
      
      // Verificação Híbrida: Tenta UID e depois E-mail (Handshake de Migração)
      const teacherRef = doc(firestore, 'teachers', userCredential.user.uid)
      const profileSnap = await getDoc(teacherRef)
      
      let profileExists = profileSnap.exists();
      
      if (!profileExists) {
        // Fallback: Busca se há perfil pendente pelo e-mail
        const q = query(collection(firestore, 'teachers'), where('email', '==', sanitizedEmail));
        const qSnap = await getDocs(q);
        profileExists = !qSnap.empty;
      }
      
      if (!profileExists) {
        await signOut(auth)
        toast({
          title: "Acesso Negado",
          description: "Perfil não encontrado no sistema escolar. Fale com o Coordenador Berga.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      toast({ title: "Bem-vindo de volta!", description: "Acesso autorizado." })
      router.push("/dashboard")
    } catch (error: any) {
      let message = "E-mail ou senha incorretos. Verifique os dados ou fale com o Coordenador Berga."
      if (error.code === "auth/invalid-email") message = "Formato de e-mail inválido."
      if (error.code === "auth/too-many-requests") message = "Muitas tentativas. Tente mais tarde."

      toast({ title: "Falha na Autenticação", description: message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "Campo Vazio", description: "Digite seu e-mail institucional.", variant: "destructive" })
      return
    }
    setIsResetting(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      toast({ title: "E-mail Enviado", description: "Verifique seu e-mail para redefinir a senha." })
    } catch (error: any) {
      toast({ title: "Erro ao Recuperar", variant: "destructive" })
    } finally {
      setIsResetting(false)
    }
  }

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  const schoolName = schoolConfig?.schoolName || "Recompor+"

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg mb-4"><Brain className="h-8 w-8" /></div>
          <h1 className="text-3xl font-black text-primary tracking-tighter uppercase">Recompor+</h1>
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-wide">{schoolName}</p>
        </div>
        <Card className="border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="space-y-1 text-center"><CardTitle className="text-2xl font-bold">Acesse sua conta</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">E-mail Institucional</Label>
                <div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input type="email" placeholder="nome@educacao.sp.gov.br" className="pl-10 h-11" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label className="text-xs font-bold uppercase text-muted-foreground">Senha</Label><Button variant="link" className="px-0 font-bold text-xs text-primary" type="button" onClick={handleForgotPassword} disabled={isResetting}>{isResetting ? "Enviando..." : "Esqueci minha senha"}</Button></div>
                <div className="relative"><Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input type={showPassword ? "text" : "password"} className="pl-10 pr-10 h-11" value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
              </div>
              <Button type="submit" className="w-full h-12 font-black uppercase tracking-widest text-xs" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Autenticando...</> : <>Entrar no Sistema <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
            </form>
          </CardContent>
          <CardFooter className="bg-slate-50 p-6 border-t flex flex-col items-center gap-1">
            <p className="text-[10px] text-center w-full text-muted-foreground uppercase font-black tracking-widest">Ambiente Seguro • {schoolName}</p>
            <p className="text-[8px] text-center w-full text-muted-foreground font-mono mt-1">Versão {SYSTEM_VERSION}</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
