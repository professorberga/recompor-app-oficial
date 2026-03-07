"use client"

import {
  BookOpen,
  Calendar,
  CheckSquare,
  LayoutDashboard,
  Users,
  BrainCircuit,
  Settings,
  ShieldCheck,
  UserCircle,
  LogOut,
  ChevronUp
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

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
    icon: BrainCircuit,
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
    adminOnly: true
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()
  
  // Simulação de troca de usuário para teste do protótipo
  const [currentUser, setCurrentUser] = useState({
    id: 'admin-1',
    name: 'Marcio Bergamini',
    role: 'Admin' as 'Admin' | 'Professor'
  })

  // Efeito para persistir a escolha do usuário no protótipo (localstorage simulado)
  useEffect(() => {
    const saved = localStorage.getItem('proto_user_role')
    if (saved) {
      if (saved === 'Professor') {
        setCurrentUser({ id: 'prof-1', name: 'Ricardo Silva', role: 'Professor' })
      } else {
        setCurrentUser({ id: 'admin-1', name: 'Marcio Bergamini', role: 'Admin' })
      }
    }
  }, [])

  const switchRole = (role: 'Admin' | 'Professor') => {
    if (role === 'Professor') {
      const user = { id: 'prof-1', name: 'Ricardo Silva', role: 'Professor' as const }
      setCurrentUser(user)
      localStorage.setItem('proto_user_role', 'Professor')
    } else {
      const user = { id: 'admin-1', name: 'Marcio Bergamini', role: 'Admin' as const }
      setCurrentUser(user)
      localStorage.setItem('proto_user_role', 'Admin')
    }
    window.location.reload() // Recarrega para aplicar filtros em todas as telas
  }

  const isAdmin = currentUser.role === 'Admin'
  const schoolName = "E.E. Professor Milton Santos"

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  // Filtra itens do menu baseados no cargo
  const filteredItems = items.filter(item => !item.adminOnly || isAdmin)

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-white shadow-sm">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
            <span className="font-headline font-black text-xl text-primary tracking-tighter leading-none">
              Recompor+
            </span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase truncate mt-0.5">
              {schoolName}
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
                      {currentUser.name.charAt(0)}{currentUser.name.split(' ')[1]?.charAt(0)}
                    </div>
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden text-left">
                      <span className="font-bold text-xs truncate max-w-[120px]">{currentUser.name}</span>
                      <span className="text-[10px] text-primary font-bold uppercase tracking-tighter">
                        {currentUser.role}
                      </span>
                    </div>
                    <ChevronUp className="h-4 w-4 ml-auto text-muted-foreground group-data-[collapsible=icon]:hidden" />
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56 mb-2">
                <DropdownMenuLabel>Alternar Perfil (Protótipo)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => switchRole('Admin')}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Entrar como Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchRole('Professor')}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  Entrar como Professor
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
