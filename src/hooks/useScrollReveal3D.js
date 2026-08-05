import { useLayoutEffect } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";

/**
 * Revela o elemento de `ref` com uma inclinação 3D controlada pelo scroll (rotateX + profundidade +
 * fade). Passe `scrub: true` para efeitos ligados diretamente à posição do scroll em vez de uma
 * entrada única.
 */
export function useScrollReveal3D(ref, options = {}) {
  const {
    rotateX = 18,
    y = 90,
    z = -200,
    duration = 1.1,
    scrub = false,
    start = "top 82%",
    end = "top 40%",
  } = options;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, rotateX, y, z, transformPerspective: 1200, transformOrigin: "50% 100%" },
        {
          autoAlpha: 1,
          rotateX: 0,
          y: 0,
          z: 0,
          duration,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start,
            end,
            scrub,
            toggleActions: scrub ? undefined : "play none none reverse",
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [ref, rotateX, y, z, duration, scrub, start, end]);
}

export { ScrollTrigger };
