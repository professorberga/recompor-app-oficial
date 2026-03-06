
"use client"

import {
  BookOpen,
  Calendar,
  CheckSquare,
  LayoutDashboard,
  Users,
  BrainCircuit,
  UserCircle,
  Settings,
  ShieldCheck,
  UserCog
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

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
    title: "Avaliações Bloom",
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
    title: "Usuários",
    url: "/users",
    icon: UserCog,
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
  
  // Simulando usuário admin logado (Marcio Bergamini)
  const isAdmin = true;

  const handleLinkClick = (title: string) => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-white shadow-sm">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl shadow-lg">
            B
          </div>
          <span className="font-headline font-bold text-lg text-primary tracking-tight group-data-[collapsible=icon]:hidden">
            Monitor do BEEM
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Painel de Controle</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="h-11 px-4 transition-all duration-200"
                    onClick={() => handleLinkClick(item.title)}
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
            <SidebarMenuButton className="h-14 px-4 bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                  MB
                </div>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                  <span className="font-bold text-xs truncate max-w-[120px]">Marcio Bergamini</span>
                  <span className="text-[10px] text-primary font-bold uppercase tracking-tighter">Administrador</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
