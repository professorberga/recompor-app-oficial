
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence,
  sendPasswordResetEmail,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth"
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc } from "firebase/firestore"
import { useAuth, useUser, useFirestore } from "@/firebase/provider"
import { Brain, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Globe } from "lucide-react"
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  
  const auth = useAuth()
  const firestore = useFirestore()
  const { user, isUserLoading, schoolConfig } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  const SYSTEM_VERSION = "v1.8.2"

  // Limpeza de cache apenas se o usuário NÃO estiver logado e NÃO estiver carregando
  useEffect(() => {
    if (!isUserLoading && !user) {
      const clearSession = async () => {
        try {
          // Apenas limpa se realmente necessário para evitar loops de redirecionamento
          window.localStorage.removeItem('firebase:previous_websocket_failure');
          console.log("[Auth] Ambiente de login preparado.");
        } catch (err) {
          console.error("Erro ao preparar sessão:", err);
        }
      };
      clearSession();
    }
  }, [auth, user, isUserLoading]);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isUserLoading, router])

  const checkProfileAndRedirect = async (firebaseUser: any) => {
    try {
      const normalizedEmail = firebaseUser.email.toLowerCase().trim();
      const teachersRef = collection(firestore, 'teachers');
      const q = query(teachersRef, where('email', '==', normalizedEmail));
      const qSnap = await getDocs(q);
      
      if (qSnap.empty) {
        await signOut(auth);
        toast({
          title: "Acesso Não Autorizado",
          description: "E-mail autenticado, mas nenhum perfil docente vinculado ao Recompor+.",
          variant: "destructive",
        });
        return;
      }

      const foundDoc = qSnap.docs[0];
      const legacyData = foundDoc.data();
      const legacyId = foundDoc.id;

      if (legacyId !== firebaseUser.uid) {
        console.log(`[Migration] Sincronizando perfil ${legacyId} -> ${firebaseUser.uid}`);
        
        const newDocRef = doc(firestore, 'teachers', firebaseUser.uid);
        await setDoc(newDocRef, { 
          ...legacyData, 
          id: firebaseUser.uid,
          role: legacyData.role || 'Professor'
        }, { merge: true });

        if (legacyId === normalizedEmail || legacyId.length < 20) {
          await deleteDoc(doc(firestore, 'teachers', legacyId));
        }
        
        toast({ title: "Perfil Sincronizado", description: "Identidade institucional vinculada com sucesso." });
      }

      // Delay para garantir que o Firestore propague as permissões antes do redirect
      await new Promise(resolve => setTimeout(resolve, 800));
      router.push("/dashboard");
    } catch (error: any) {
      handleAuthError(error);
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await checkProfileAndRedirect(result.user);
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsGoogleLoading(false);
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    const sanitizedEmail = email.trim();

    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
      await checkProfileAndRedirect(userCredential.user);
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAuthError = (error: any) => {
    console.error("Auth Error:", error.code, error.message);
    
    if (error.code === "auth/unauthorized-domain") {
      toast({ 
        title: "Domínio Não Autorizado", 
        description: "A URL deste site precisa ser adicionada aos 'Domínios Autorizados' no Console do Firebase (Authentication > Settings).", 
        variant: "destructive" 
      });
      return;
    }

    if (error.code === "auth/network-request-failed") {
      toast({ 
        title: "Erro de Conexão", 
        description: "Falha ao conectar com os serviços do Google. Verifique sua internet ou limpe o cache.", 
        variant: "destructive" 
      });
      return;
    }

    let message = "Verifique suas credenciais ou tente novamente em instantes.";
    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
      message = "E-mail ou senha incorretos. Verifique os dados.";
    }

    toast({ title: "Falha na Autenticação", description: message, variant: "destructive" });
  }

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "E-mail Necessário", description: "Digite seu e-mail para receber o link de recuperação.", variant: "destructive" });
      return;
    }
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast({ title: "Recuperação Enviada", description: "Link enviado para seu e-mail." });
    } catch (error: any) {
      toast({ title: "Erro no Envio", description: "Não foi possível enviar o e-mail de recuperação.", variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  }

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg mb-4">
            <Brain className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-primary tracking-tighter uppercase">Recompor+</h1>
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-wide">{schoolConfig?.schoolName || "Escola"}</p>
        </div>
        <Card className="border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Portal do Docente</CardTitle>
            <CardDescription>Acesse o diário de classe digital</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button 
              variant="outline" 
              className="w-full h-12 gap-3 font-bold border-2 hover:bg-slate-50" 
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-5 w-5 text-blue-500" />}
              Entrar com Google (Institucional)
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black"><span className="bg-white px-2 text-muted-foreground">Ou use e-mail e senha</span></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="email" 
                    placeholder="nome@educacao.sp.gov.br" 
                    className="pl-10 h-11" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Senha</Label>
                  <Button 
                    variant="link" 
                    className="px-0 h-auto font-bold text-xs text-primary" 
                    type="button" 
                    onClick={handleForgotPassword} 
                    disabled={isResetting}
                  >
                    Esqueci a senha
                  </Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    className="pl-10 pr-10 h-11" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 font-black uppercase tracking-widest text-xs" disabled={isLoading || isGoogleLoading}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...</>
                ) : (
                  <>Acessar Sistema <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-slate-50 p-6 border-t flex flex-col items-center gap-1">
            <p className="text-[10px] text-center w-full text-muted-foreground uppercase font-black tracking-widest">
              Ambiente Institucional Seguro
            </p>
            <p className="text-[8px] text-center w-full text-muted-foreground font-mono mt-1">
              Versão {SYSTEM_VERSION}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
