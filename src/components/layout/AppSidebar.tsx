
"use client"

import {
  BookOpen,
  Calendar,
  CheckSquare,
  LayoutDashboard,
  Users,
  Brain,
  Settings,
  ShieldCheck,
  UserCircle,
  LogOut,
  ChevronUp,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { signOut } from "firebase/auth"
import { useAuth, useUser } from "@/firebase/provider"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    adminOnly: false
  },
  {
    title: "Turmas",
    url: "/classes",
    icon: BookOpen,
    adminOnly: false
  },
  {
    title: "Alunos",
    url: "/students",
    icon: Users,
    adminOnly: false
  },
  {
    title: "Avaliações",
    url: "/assessments",
    icon: Brain,
    adminOnly: false
  },
  {
    title: "Chamada",
    url: "/attendance",
    icon: CheckSquare,
    adminOnly: false
  },
  {
    title: "Calendário & Conteúdo",
    url: "/calendar",
    icon: Calendar,
    adminOnly: false
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
    adminOnly: false // Permitir que todos vejam seu próprio perfil/escola
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setOpenMobile, isMobile } = useSidebar()
  const [mounted, setMounted] = useState(false)
  const auth = useAuth()
  const { user, profile, isAdmin } = useUser()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      toast({
        title: "Sessão Encerrada",
        description: "Você saiu do sistema com segurança.",
      })
      router.push("/login")
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Não foi possível encerrar a sessão.",
        variant: "destructive"
      })
    }
  }

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  // Filtra itens com base no cargo real carregado do Firestore
  const filteredItems = useMemo(() => {
    return items.filter(item => !item.adminOnly || isAdmin);
  }, [isAdmin]);

  if (!mounted) return null

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-white shadow-sm">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg">
            <Brain className="h-6 w-6" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
            <span className="font-headline font-black text-xl text-primary tracking-tighter leading-none">
              Recompor+
            </span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase truncate mt-0.5">
              {profile?.schoolName || "Unidade Escolar"}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Navegação Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="h-11 px-4 transition-all duration-200"
                    onClick={handleLinkClick}
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 ${pathname === item.url ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-medium">{item.title}</span>
                      {item.adminOnly && (
                        <ShieldCheck className="h-3 w-3 ml-auto text-primary opacity-50" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-14 px-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                      {profile?.name ? (
                        profile.name.charAt(0) + (profile.name.split(' ')[1]?.charAt(0) || '')
                      ) : (
                        user?.email?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden text-left">
                      <span className="font-bold text-xs truncate max-w-[120px]">
                        {profile?.name || user?.email?.split('@')[0]}
                      </span>
                      <span className="text-[10px] text-primary font-bold uppercase tracking-tighter">
                        {profile?.role || 'Professor'}
                      </span>
                    </div>
                    <ChevronUp className="h-4 w-4 ml-auto text-muted-foreground group-data-[collapsible=icon]:hidden" />
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56 mb-2">
                <DropdownMenuLabel>Sua Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair do Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
