import { useLayoutEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "../lib/gsap";

/**
 * Drives the whole page's smooth scroll and keeps ScrollTrigger in sync with it.
 * Mount once at the app root.
 */
export function useLenis() {
  useLayoutEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Fonts/images can still be reflowing when ScrollTrigger first measures pin
    // start/end offsets; re-measure once everything has actually settled.
    window.addEventListener("load", ScrollTrigger.refresh);

    return () => {
      window.removeEventListener("load", ScrollTrigger.refresh);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
}
