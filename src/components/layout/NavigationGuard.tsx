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
    console.log(`[NavigationGuard] Rota alterada para: ${pathname}`);
    
    const cleanup = () => {
      console.log("[NavigationGuard] Executando limpeza de bloqueios de UI...");
      
      // Restaura interatividade e rolagem forçadamente no body e html
      const resetStyles = (el: HTMLElement) => {
        el.style.pointerEvents = "auto";
        el.style.overflow = "auto";
        el.style.removeProperty("pointer-events");
        el.style.removeProperty("overflow");
        el.removeAttribute('data-scroll-locked');
      };

      resetStyles(document.body);
      resetStyles(document.documentElement);
      
      // Remove overlays residuais e elementos de guarda de foco do Radix
      const overlays = document.querySelectorAll('[data-radix-focus-guard], [data-radix-portal], .radix-overlay');
      overlays.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.display = 'none';
        }
      });
    }

    // Executa imediatamente
    cleanup();
    
    // Executa novamente após um curto atraso para garantir que o Radix terminou sua transição
    const timer = setTimeout(cleanup, 50);
    const timer2 = setTimeout(cleanup, 200);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [pathname])

  return null
}
