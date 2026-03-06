"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * Componente utilitário para garantir que a interface nunca fique travada
 * após uma navegação, limpando estilos residuais de modais do Radix UI.
 */
export function NavigationGuard() {
  const pathname = usePathname()

  useEffect(() => {
    const cleanup = () => {
      // Força a restauração da interatividade do corpo da página
      document.body.style.pointerEvents = "auto"
      document.body.style.overflow = "auto"
      document.body.removeAttribute('data-scroll-locked')
      
      // Remove overlays residuais que possam ter ficado órfãos
      const overlays = document.querySelectorAll('[data-radix-focus-guard], .radix-overlay')
      overlays.forEach(el => (el as HTMLElement).style.display = 'none')
    }

    cleanup()
    
    // Pequeno atraso para garantir que a nova rota terminou de montar
    const timer = setTimeout(cleanup, 100)
    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
