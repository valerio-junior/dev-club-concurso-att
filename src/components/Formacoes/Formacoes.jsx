import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { ScrollTrigger } from "../../lib/gsap";
import { theme } from "../../styles/theme";
import {
  Wrapper,
  BeltLayer,
  TextCol,
  Heading,
  CardsRow,
  Card,
  IconRow,
  IconBadge,
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

export const Formacoes = forwardRef(function Formacoes(_props, ref) {
  const containerRef = useRef(null);
  const beltLayerRef = useRef(null);
  const textColRef = useRef(null);
  const cardsRowRef = useRef(null);
  const cardRefs = useRef([]);
  const beltDistanceRef = useRef(1600);
  const riseDistanceRef = useRef(500);
  const progressRef = useRef(0);
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

    // Match every card's height to the first one's natural height — descriptions vary in
    // length, so left alone the shorter cards end up visually smaller than card 0. Reset to
    // auto first so the measurement reflects real content, not a stale height from a
    // previous pass (e.g. after a resize).
    cardRefs.current.forEach((el) => {
      if (el) el.style.height = "";
    });
    const cardHeight = firstCard.getBoundingClientRect().height;
    cardRefs.current.forEach((el) => {
      if (el) el.style.height = `${cardHeight}px`;
    });

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

  // Progress now arrives imperatively from FormacoesConteudosIA (the shared pinned Stage that
  // hosts this section and ConteudosIA together, letting the two overlap) instead of this
  // section pinning itself — see that component for the combined scroll choreography.
  const renderAtProgress = useCallback(
    (progress) => {
      progressRef.current = progress;
      render(progress);
    },
    [render]
  );

  useImperativeHandle(ref, () => ({ render: renderAtProgress }), [renderAtProgress]);

  useEffect(() => {
    measure();
    render(progressRef.current);

    // Other sections (their own pin-spacers, videos loading, etc.) can still change the
    // page's total layout after this section's own initial measurement — window "load" and
    // "resize" don't cover all of that, but GSAP's own "refresh" event fires every time
    // ScrollTrigger recalculates anything (e.g. a sibling section's pin-spacer changing
    // height), which is exactly when this section's cached measurements can go stale.
    const refresh = () => {
      measure();
      render(progressRef.current);
    };
    window.addEventListener("load", refresh);
    window.addEventListener("resize", refresh);
    ScrollTrigger.addEventListener("refresh", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      window.removeEventListener("resize", refresh);
      ScrollTrigger.removeEventListener("refresh", refresh);
    };
  }, [measure, render]);

  return (
    <Wrapper ref={containerRef}>
      <BeltLayer ref={beltLayerRef}>
        <TextCol ref={textColRef}>
          <Heading>Formações e trilhas diretas para você não se perder no caminho</Heading>
        </TextCol>

        <CardsRow ref={cardsRowRef}>
          {FORMACOES.map((item, i) => (
            <Card key={item.title} ref={(el) => (cardRefs.current[i] = el)}>
              <IconRow>
                {item.icons.map((icon) => (
                  <IconBadge key={icon.alt}>
                    <CardIcon src={icon.src} alt={icon.alt} />
                  </IconBadge>
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
});
