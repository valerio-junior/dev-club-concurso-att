import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";

/**
 * Fixa `containerRef` e controla um valor de progresso 0..1 a partir do scroll enquanto fixado,
 * soltando automaticamente assim que a distância de scroll é consumida. Esse é o padrão
 * compartilhado de "cena grudenta" reaproveitado em várias seções (Hero, Empresas, IA,
 * Professores...).
 *
 * `distance` controla quanto scroll é necessário para ir do progresso 0 a 1,
 * expresso como um múltiplo da altura do viewport (ex: 1.5 = 150vh de scroll).
 */
export function useStickyScrub(containerRef, { distance = 1.5, onUpdate, disabled = false, progressRef } = {}) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || disabled) return undefined;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: () => `+=${window.innerHeight * distance}`,
        pin: true,
        scrub: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          if (progressRef) progressRef.current = self.progress;
          onUpdateRef.current?.(self.progress);
        },
      });
    }, el);

    return () => ctx.revert();
  }, [containerRef, distance, disabled, progressRef]);
}
