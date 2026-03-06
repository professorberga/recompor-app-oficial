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
    console.log(`[NavigationGuard] Rota detectada: ${pathname}`);
    
    const forceCleanup = () => {
      console.log("[NavigationGuard] Iniciando limpeza de UI...");
      
      const elementsToReset = [document.body, document.documentElement];
      
      elementsToReset.forEach(el => {
        if (!el) return;
        
        // Remove bloqueios de ponteiro e rolagem
        el.style.pointerEvents = "auto";
        el.style.overflow = "auto";
        el.style.removeProperty("pointer-events");
        el.style.removeProperty("overflow");
        
        // Remove atributos específicos do Radix/Aria
        el.removeAttribute('data-scroll-locked');
        el.removeAttribute('aria-hidden');
        
        console.log(`[NavigationGuard] Reset de estilos aplicado em: ${el.tagName}`);
      });

      // Remove elementos residuais que podem bloquear a tela (overlays fantasmas)
      const overlays = document.querySelectorAll('[data-radix-focus-guard], [data-radix-portal], .radix-overlay');
      if (overlays.length > 0) {
        console.log(`[NavigationGuard] Removendo ${overlays.length} overlays residuais.`);
        overlays.forEach(el => {
          if (el instanceof HTMLElement) {
            el.style.display = 'none';
            // el.remove(); // Opcional: remover do DOM se necessário
          }
        });
      }
    };

    // Executa a limpeza em múltiplos estágios para garantir que o Next.js e o Radix completaram suas tarefas
    forceCleanup();
    const t1 = setTimeout(forceCleanup, 10);
    const t2 = setTimeout(forceCleanup, 100);
    const t3 = setTimeout(forceCleanup, 500); // Limpeza tardia de segurança
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  // Monitor de depuração: avisa se o body for bloqueado subitamente
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const bodyStyle = document.body.style.pointerEvents;
          if (bodyStyle === 'none') {
            console.warn("[DEBUG] ALERTA: pointer-events: none detectado no body!");
          }
        }
      });
    });

    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return null
}
