import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// `main` carries `perspective` for the site's 3D scroll reveals, which turns any descendant's
// `position: fixed` into `absolute`-relative-to-that-ancestor instead of the viewport (this is
// why it's scoped to `main` and not `#root` — see GlobalStyle.js). Pinning via transform
// sidesteps that regardless (and is also the standard recommendation when pairing with Lenis).
ScrollTrigger.defaults({ pinType: "transform" });

export { gsap, ScrollTrigger };
