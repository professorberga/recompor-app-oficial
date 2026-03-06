"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * NavigationGuard: Garante que a interface permaneça interativa após navegação.
 * Resolve problemas onde o Radix UI (Dialog, Sheet, Tooltip) deixa o body bloqueado.
 */
export function NavigationGuard() {
  const pathname = usePathname()

  useEffect(() => {
    console.log(`[NavigationGuard] Navegação para: ${pathname}`);
    
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

      // Remove overlays fantasmas
      const overlays = document.querySelectorAll('[data-radix-focus-guard], [data-radix-portal], .radix-overlay');
      overlays.forEach(el => {
        if (el instanceof HTMLElement) el.style.display = 'none';
      });
    };

    // Executa imediatamente e após pequenos delays
    forceCleanup();
    const timers = [10, 100, 500].map(d => setTimeout(forceCleanup, d));
    
    return () => timers.forEach(t => clearTimeout(t));
  }, [pathname]);

  return null
}
