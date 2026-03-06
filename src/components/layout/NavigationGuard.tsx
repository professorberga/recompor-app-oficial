"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * NavigationGuard: Garante que a interface permaneça interativa após navegação.
 * Resolve o problema de "UI Freeze" causado por resíduos de Modais/Dialogs do Radix UI.
 */
export function NavigationGuard() {
  const pathname = usePathname()

  useEffect(() => {
    console.log(`[NavigationGuard] Mudança de rota detectada para: ${pathname}`);
    
    const forceCleanup = () => {
      if (typeof document === 'undefined') return;
      
      const elementsToReset = [document.body, document.documentElement];
      
      elementsToReset.forEach(el => {
        if (!el) return;
        el.style.pointerEvents = "auto";
        el.style.overflow = "auto";
        el.removeAttribute('data-scroll-locked');
        el.removeAttribute('aria-hidden');
      });

      // Remove overlays fantasmas de portais
      const overlays = document.querySelectorAll('[data-radix-focus-guard], [data-radix-portal], .radix-overlay');
      overlays.forEach(el => {
        if (el instanceof HTMLElement) el.style.display = 'none';
      });
    };

    // Executa em múltiplos tempos para garantir a limpeza após o término da transição do Next.js
    forceCleanup();
    const timers = [0, 50, 200, 500].map(d => setTimeout(forceCleanup, d));
    
    return () => timers.forEach(t => clearTimeout(t));
  }, [pathname]);

  return null
}
