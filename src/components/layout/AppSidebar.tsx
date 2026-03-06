"use client"

import {
  BookOpen,
  Calendar,
  CheckSquare,
  LayoutDashboard,
  Users,
  BrainCircuit,
  UserCircle
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
  },
  {
    title: "Turmas",
    url: "/classes",
    icon: BookOpen,
  },
  {
    title: "Alunos",
    url: "/students",
    icon: Users,
  },
  {
    title: "Avaliações Bloom",
    url: "/assessments",
    icon: BrainCircuit,
  },
  {
    title: "Chamada",
    url: "/attendance",
    icon: CheckSquare,
  },
  {
    title: "Calendário & Conteúdo",
    url: "/calendar",
    icon: Calendar,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()

  const handleLinkClick = (title: string) => {
    console.log(`[AppSidebar] Clique no menu: ${title}`);
    
    // Limpeza agressiva imediata no clique para evitar UI Freeze
    if (typeof document !== 'undefined') {
      document.body.style.pointerEvents = "auto";
      document.body.style.overflow = "auto";
      document.body.removeAttribute('data-scroll-locked');
      document.body.removeAttribute('aria-hidden');
    }

    if (isMobile) {
      console.log("[AppSidebar] Fechando menu mobile");
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
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Principal</SidebarGroupLabel>
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
            <SidebarMenuButton className="h-11 px-4">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium group-data-[collapsible=icon]:hidden">Professor Admin</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
