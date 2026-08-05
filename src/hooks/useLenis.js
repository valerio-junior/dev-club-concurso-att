import { useLayoutEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "../lib/gsap";

// Shared instance so components outside this hook (e.g. Footer's nav links) can trigger a
// smooth scroll through the same Lenis that owns the page's scroll — a plain anchor jump or
// `scrollIntoView` would fight with Lenis's own raf loop instead of animating through it.
let lenisInstance = null;

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
    lenisInstance = lenis;

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
      lenisInstance = null;
    };
  }, []);
}

// Offset pulls the target down a bit so it doesn't land flush under the fixed header.
export function scrollToSection(target, offset = -96) {
  lenisInstance?.scrollTo(target, { offset });
}
