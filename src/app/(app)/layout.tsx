"use client"

import { useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { Toaster } from "@/components/ui/toaster"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log("[AppLayout] Componente montado");
  }, []);

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
