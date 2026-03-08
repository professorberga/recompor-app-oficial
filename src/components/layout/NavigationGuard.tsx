
"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * NavigationGuard: Garante que a interface permaneça interativa após navegação ou fechamento de modais.
 * Otimizado para não interferir agressivamente nos estilos do body durante a renderização estável.
 */
export function NavigationGuard() {
  const pathname = usePathname()

  useEffect(() => {
    const forceCleanup = () => {
      if (typeof document === 'undefined') return;
      
      const elementsToReset = [document.body, document.documentElement];
      
      // Só aplica limpeza se houver indícios de bloqueio órfão (fora de um Dialog aberto)
      const hasActiveOverlay = !!document.querySelector('[data-radix-portal], .radix-overlay, [role="dialog"]');
      
      if (!hasActiveOverlay) {
        elementsToReset.forEach(el => {
          if (!el) return;
          el.style.pointerEvents = "auto";
          el.style.overflow = "auto";
          el.removeAttribute('data-scroll-locked');
          el.removeAttribute('data-radix-scroll-lock');
        });
      }

      const ghostElements = document.querySelectorAll('[data-radix-focus-guard]');
      ghostElements.forEach(el => {
        if (!hasActiveOverlay) el.remove();
      });
    };

    forceCleanup();
    const timers = [100, 500].map(d => setTimeout(forceCleanup, d));
    
    return () => timers.forEach(t => clearTimeout(t));
  }, [pathname]);

  return null
}
