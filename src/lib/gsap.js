import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// `main` carrega `perspective` para os efeitos de revelação 3D no scroll do site, o que transforma
// qualquer `position: fixed` de um descendente em `absolute`-relativo-a-esse-ancestral em vez do
// viewport (por isso está restrito a `main` e não a `#root` — ver GlobalStyle.js). Fixar via
// transform contorna isso de qualquer forma (e também é a recomendação padrão ao combinar com o
// Lenis).
ScrollTrigger.defaults({ pinType: "transform" });

export { gsap, ScrollTrigger };
