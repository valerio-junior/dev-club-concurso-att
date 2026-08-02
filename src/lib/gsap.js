import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// #root carries `perspective` for the site's 3D scroll reveals, which turns any descendant
// `position: fixed` into `absolute`-relative-to-#root instead of the viewport. Pinning via
// transform sidesteps that (and is also the standard recommendation when pairing with Lenis).
ScrollTrigger.defaults({ pinType: "transform" });

export { gsap, ScrollTrigger };
