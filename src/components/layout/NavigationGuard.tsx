
"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * NavigationGuard: Garante que a interface permaneça interativa após navegação ou fechamento de modais.
 * Resolve o problema de "UI Freeze" (pointer-events: none no body) comum em bibliotecas Radix/Shadcn.
 */
export function NavigationGuard() {
  const pathname = usePathname()

  useEffect(() => {
    const forceCleanup = () => {
      if (typeof document === 'undefined') return;
      
      const elementsToReset = [document.body, document.documentElement];
      
      elementsToReset.forEach(el => {
        if (!el) return;
        // Restaura a interatividade e o scroll
        el.style.pointerEvents = "auto";
        el.style.overflow = "auto";
        el.style.userSelect = "auto";
        
        // Remove atributos de bloqueio do Radix/Shadcn
        el.removeAttribute('data-scroll-locked');
        el.removeAttribute('aria-hidden');
        el.removeAttribute('data-radix-scroll-lock');
      });

      // Remove overlays fantasmas ou guardas de foco que possam ter ficado órfãos
      const ghostElements = document.querySelectorAll('[data-radix-focus-guard], [data-radix-portal], .radix-overlay');
      ghostElements.forEach(el => {
        if (el instanceof HTMLElement) {
          // Em vez de apenas esconder, removemos se for um portal órfão para limpar o DOM
          if (el.hasAttribute('data-radix-focus-guard')) el.remove();
        }
      });
    };

    // Executa a limpeza em ciclos para garantir que o React/Radix terminou de desmontar
    forceCleanup();
    const timers = [0, 100, 300, 500].map(d => setTimeout(forceCleanup, d));
    
    return () => timers.forEach(t => clearTimeout(t));
  }, [pathname]);

  return null
}
