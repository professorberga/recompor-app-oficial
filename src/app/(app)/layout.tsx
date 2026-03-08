
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { Toaster } from "@/components/ui/toaster"
import { useUser } from "@/firebase/provider"
import { Loader2 } from "lucide-react"

/**
 * AppLayout: Layout protegido para as rotas da aplicação.
 * Garante que apenas usuários autenticados acessem o conteúdo.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    // Redireciona para o login se o carregamento terminar e não houver usuário
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  // Enquanto verifica o estado, mostra um loader centralizado
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Autenticando sessão...</p>
        </div>
      </div>
    )
  }

  // Se não houver usuário, não renderiza nada (o useEffect cuidará do redirect)
  if (!user) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-30 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-[1px] bg-border mx-2" />
            <h1 className="text-sm font-semibold text-primary">Gestão de Recomposição das Aprendizagens</h1>
          </header>
          <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}
