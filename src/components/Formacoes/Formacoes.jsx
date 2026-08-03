import { useCallback, useEffect, useRef } from "react";
import { useStickyScrub } from "../../hooks/useStickyScrub";
import { theme } from "../../styles/theme";
import {
  Wrapper,
  BeltLayer,
  TextCol,
  Heading,
  CardsRow,
  Card,
  IconRow,
  CardIcon,
  CardTitle,
  CardDescription,
} from "./Formacoes.styles";

const FORMACOES = [
  {
    title: "Formação Front-End",
    description:
      "Aprenda a construir interfaces modernas, responsivas e interativas — a porta de entrada para quem quer programar o que o usuário vê e sente.",
    icons: [
      { src: "/assets/logos/tech/html5.svg", alt: "HTML5" },
      { src: "/assets/logos/tech/css3.svg", alt: "CSS3" },
    ],
  },
  {
    title: "Formação FullStack",
    description:
      "Domine front-end e back-end numa trilha só, e saia preparado para construir aplicações completas do zero ao deploy.",
    icons: [
      { src: "/assets/logos/tech/react.svg", alt: "React" },
      { src: "/assets/logos/tech/nodedotjs.svg", alt: "Node.js" },
    ],
  },
  {
    title: "HTML",
    description: "A base de toda a web. Aprenda a estruturar páginas do jeito certo, com semântica e acessibilidade.",
    icons: [{ src: "/assets/logos/tech/html5.svg", alt: "HTML5" }],
  },
  {
    title: "CSS",
    description: "Dê vida e estilo às suas páginas — layouts modernos, responsivos e animações que encantam.",
    icons: [{ src: "/assets/logos/tech/css3.svg", alt: "CSS3" }],
  },
  {
    title: "React",
    description: "A biblioteca mais usada do mercado para construir interfaces rápidas, componentizadas e escaláveis.",
    icons: [{ src: "/assets/logos/tech/react.svg", alt: "React" }],
  },
  {
    title: "TypeScript",
    description: "JavaScript com superpoderes — tipagem estática para escrever código mais seguro e fácil de manter.",
    icons: [{ src: "/assets/logos/tech/typescript.svg", alt: "TypeScript" }],
  },
  {
    title: "Git e GitHub",
    description: "Versionamento de código e colaboração em equipe — essencial para qualquer desenvolvedor profissional.",
    icons: [
      { src: "/assets/logos/tech/git.svg", alt: "Git" },
      { src: "/assets/logos/tech/github.svg", alt: "GitHub" },
    ],
  },
  {
    title: "Node.js",
    description: "Leve o JavaScript para o back-end e construa APIs robustas com o runtime mais usado do mercado.",
    icons: [{ src: "/assets/logos/tech/nodedotjs.svg", alt: "Node.js" }],
  },
];

const ENTER_OPACITY_FRACTION = 0.7;
const BELT_DISTANCE_BUFFER_PX = 80;
const RIGHT_MARGIN_TARGET_PX = 24; // near-zero margin on the right once a card is on display
const RISE_DISTANCE_BUFFER_PX = 40; // a bit past the viewport's bottom edge, so it truly starts off-screen
const TABLET_BREAKPOINT_PX = parseInt(theme.breakpoints.tablet, 10);

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export function Formacoes() {
  const containerRef = useRef(null);
  const beltLayerRef = useRef(null);
  const textColRef = useRef(null);
  const cardsRowRef = useRef(null);
  const cardRefs = useRef([]);
  const beltDistanceRef = useRef(1600);
  const riseDistanceRef = useRef(500);
  const scrollProgressRef = useRef(0);
  // Progress (0..1) at which each card's row position lines up with where card 0 started —
  // i.e. when it "arrives" in view. Measured from real layout, not guessed.
  const arrivalProgressRef = useRef(FORMACOES.map(() => 0));

  const measure = useCallback(() => {
    const belt = beltLayerRef.current;
    const textCol = textColRef.current;
    const cardsRow = cardsRowRef.current;
    const firstCard = cardRefs.current[0];
    const lastCard = cardRefs.current[cardRefs.current.length - 1];
    if (!belt || !textCol || !cardsRow || !firstCard || !lastCard) return;

    // Push the row so the first (fixed-size) card lands flush against the right margin —
    // can't rely on justify-content for this since the row overflows way past the viewport
    // with the other 7 cards, which throws off flexbox's own space distribution.
    cardsRow.style.marginLeft = "0px";
    if (window.innerWidth > TABLET_BREAKPOINT_PX) {
      const computed = window.getComputedStyle(belt);
      const paddingRight = parseFloat(computed.paddingRight) || 0;
      const gap = parseFloat(computed.columnGap || computed.gap) || 0;
      const cardWidth = firstCard.getBoundingClientRect().width;
      const available = belt.getBoundingClientRect().width - textCol.getBoundingClientRect().width - gap - paddingRight;
      const marginLeft = Math.max(available - cardWidth - RIGHT_MARGIN_TARGET_PX, 0);
      cardsRow.style.marginLeft = `${marginLeft}px`;
    }

    // How far below the viewport a card must start to genuinely rise from off-screen — all
    // cards share the same resting Y (a single row), so one measurement covers all of them.
    // Measured relative to the *section's own container*, not the live viewport: at page
    // load (say, scrolled to the Hero), this section still sits far down the document,
    // unpinned, so its live viewport position is meaningless — but its offset from its own
    // container's top is constant regardless of where that container currently sits on the
    // page, since the container is always exactly 100vh once pinned.
    const container = containerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const cardOffsetFromContainerTop = firstCard.getBoundingClientRect().top - containerRect.top;
      riseDistanceRef.current = Math.max(containerRect.height - cardOffsetFromContainerTop + RISE_DISTANCE_BUFFER_PX, 0);
    }

    const originX = firstCard.getBoundingClientRect().left;
    // BeltLayer's own box is just the viewport width (flex overflow doesn't expand a
    // parent's own bounding rect) — what we actually need is how far the *last card's*
    // current right edge sits from the viewport, since that's what has to clear the left
    // edge for everything (title + the whole row, all riding the same belt) to be gone.
    const lastCardRight = lastCard.getBoundingClientRect().right;
    beltDistanceRef.current = Math.max(lastCardRight + BELT_DISTANCE_BUFFER_PX, 1);

    arrivalProgressRef.current = cardRefs.current.map((el) => {
      if (!el) return 0;
      const offset = el.getBoundingClientRect().left - originX;
      return clamp01(offset / beltDistanceRef.current);
    });
  }, []);

  const render = useCallback((progress) => {
    if (beltLayerRef.current) {
      // Linear, not eased — a real conveyor moves at a constant rate, and it keeps the
      // arrival-progress math below simple and predictable.
      const x = -progress * beltDistanceRef.current;
      beltLayerRef.current.style.transform = `translateX(${x.toFixed(2)}px)`;
    }

    cardRefs.current.forEach((el, i) => {
      if (!el) return;

      const arrival = arrivalProgressRef.current[i];
      if (i === 0 || progress >= arrival) {
        el.style.opacity = "1";
        el.style.transform = "translateY(0px)";
        return;
      }

      // Rises across the *entire* gap since the previous card arrived (i.e. since the belt
      // started opening up room on the right for it) instead of a short fixed window right
      // before arrival — the whole point being to actually see it climb as you scroll.
      const riseStart = i > 0 ? arrivalProgressRef.current[i - 1] : 0;
      if (progress <= riseStart) {
        el.style.opacity = "0";
        el.style.transform = `translateY(${riseDistanceRef.current}px)`;
        return;
      }

      const posT = (progress - riseStart) / (arrival - riseStart);
      const eased = easeOutCubic(posT);
      const opacityT = clamp01(posT / ENTER_OPACITY_FRACTION);
      el.style.opacity = opacityT.toFixed(3);
      el.style.transform = `translateY(${((1 - eased) * riseDistanceRef.current).toFixed(2)}px)`;
    });
  }, []);

  useStickyScrub(containerRef, { distance: 3.3, onUpdate: render, progressRef: scrollProgressRef });

  useEffect(() => {
    measure();
    render(scrollProgressRef.current);

    // Other sections above this one (Hero/Empresas videos, etc.) can still be resizing their
    // own pinned heights shortly after mount — a re-measure once everything has settled
    // catches any of that instead of only trusting the very first, possibly-early pass.
    const refresh = () => {
      measure();
      render(scrollProgressRef.current);
    };
    window.addEventListener("load", refresh);
    window.addEventListener("resize", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      window.removeEventListener("resize", refresh);
    };
  }, [measure, render]);

  return (
    <Wrapper ref={containerRef}>
      <BeltLayer ref={beltLayerRef}>
        <TextCol ref={textColRef}>
          <Heading>
            Formações e trilhas diretas
            <br />
            para você não se perder no caminho
          </Heading>
        </TextCol>

        <CardsRow ref={cardsRowRef}>
          {FORMACOES.map((item, i) => (
            <Card key={item.title} ref={(el) => (cardRefs.current[i] = el)}>
              <IconRow>
                {item.icons.map((icon) => (
                  <CardIcon key={icon.alt} src={icon.src} alt={icon.alt} />
                ))}
              </IconRow>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </Card>
          ))}
        </CardsRow>
      </BeltLayer>
    </Wrapper>
  );
}
