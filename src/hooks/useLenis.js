import { useLayoutEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "../lib/gsap";

// Instância compartilhada para que componentes fora deste hook (ex: os links de nav do Footer) possam
// disparar um scroll suave através do mesmo Lenis que controla o scroll da página — um salto de
// âncora comum ou `scrollIntoView` entraria em conflito com o próprio loop raf do Lenis em vez de animar através dele.
let lenisInstance = null;

// Teclas nativas de scroll — sem isso, o navegador move a posição instantaneamente (sem o easing
// do Lenis), o que faz as seções fixadas/scrubadas do site (Plataforma, Professores, Garantia...)
// pularem direto para o frame correspondente à nova posição em vez de tocar a transição. Cada uma
// vira um passo relativo (ou absoluto, para Home/End) animado pelo próprio `lenis.scrollTo`.
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Spacebar"]);

// Não intercepta se o foco estiver num controle real de teclado (botões do FAQ, CTA do header,
// etc.) — senão Space/setas deixariam de ativar esses elementos, quebrando a navegação por teclado
// neles em troca de "consertar" o scroll.
function isInteractiveElement(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function handleScrollKey(e, lenis) {
  if (!SCROLL_KEYS.has(e.key)) return;
  // Deixa passar combinações com modificador (atalhos do navegador/SO) e não mexe com o foco em
  // controles reais.
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  if (isInteractiveElement(document.activeElement)) return;

  const viewport = window.innerHeight;
  const maxScroll = document.documentElement.scrollHeight - viewport;
  const current = lenis.animatedScroll ?? window.scrollY;
  let target = current;

  switch (e.key) {
    case "ArrowUp":
      target = current - 100;
      break;
    case "ArrowDown":
      target = current + 100;
      break;
    case "PageUp":
      target = current - viewport * 0.9;
      break;
    case "PageDown":
      target = current + viewport * 0.9;
      break;
    case " ":
    case "Spacebar":
      target = current + (e.shiftKey ? -viewport * 0.9 : viewport * 0.9);
      break;
    case "Home":
      target = 0;
      break;
    case "End":
      target = maxScroll;
      break;
    default:
      return;
  }

  e.preventDefault();
  lenis.scrollTo(Math.max(0, Math.min(maxScroll, target)), { duration: 0.6 });
}

/**
 * Controla o scroll suave da página inteira e mantém o ScrollTrigger sincronizado com ele.
 * Deve ser montado uma única vez na raiz do app.
 */
export function useLenis() {
  useLayoutEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    });
    lenisInstance = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onKeyDown = (e) => handleScrollKey(e, lenis);
    window.addEventListener("keydown", onKeyDown);

    // Fontes/imagens ainda podem estar causando reflow quando o ScrollTrigger mede pela primeira vez os
    // offsets de início/fim do pin; remede assim que tudo realmente se estabilizar.
    window.addEventListener("load", ScrollTrigger.refresh);

    return () => {
      window.removeEventListener("load", ScrollTrigger.refresh);
      window.removeEventListener("keydown", onKeyDown);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);
}

// O offset puxa o alvo um pouco para baixo para que não fique colado embaixo do header fixo.
export function scrollToSection(target, offset = -96) {
  lenisInstance?.scrollTo(target, { offset });
}

// Usado pelo Loader (e pela Ecossistema) para impedir scroll (e o ScrollTrigger das seções pinadas)
// enquanto uma animação de página inteira está rodando.
export function setScrollLocked(locked) {
  if (locked) {
    lenisInstance?.stop();
  } else {
    lenisInstance?.start();
  }
}

// Chamado depois que a altura real do documento muda por fora do fluxo normal de scroll (ex: a
// Ecossistema colapsando a própria altura pra revelar o Hero) — sem isso o Lenis/ScrollTrigger
// continuam com os limites de scroll antigos até o próximo resize da janela.
export function refreshScroll() {
  lenisInstance?.resize();
  ScrollTrigger.refresh();
}
