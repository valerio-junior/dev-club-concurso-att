import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";

/**
 * Pins `containerRef` and drives a 0..1 progress value from scroll while pinned,
 * unpinning automatically once the scroll distance is consumed. This is the shared
 * "sticky scene" pattern reused across sections (Hero, Empresas, IA, Professores...).
 *
 * `distance` controls how much scroll is needed to go from progress 0 to 1,
 * expressed as a multiple of the viewport height (e.g. 1.5 = 150vh of scroll).
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
