import { useCallback, useEffect, useRef } from "react";
import { useStickyScrub } from "../../hooks/useStickyScrub";
import { ScrollTrigger } from "../../lib/gsap";
import {
  Wrapper,
  Inner,
  TitleGroup,
  Title,
  Subtitle,
  CardsRow,
  Card,
  CardImageStage,
  CardCaption,
  CardTitle,
  CardDescription,
} from "./ModuloBonus.styles";

// Rendered left-to-right in this order (final resting layout), but each one starts its
// "unstacking" journey at a different moment (see UNSTACK_ORDER) — the Netflix card peels off
// first (to the left), the cafeteria one second (to the right), and the mentoria one last,
// settling into the gap left in the middle.
const BONUS_ITEMS = [
  {
    id: "netflix",
    img: "/assets/bonus/Netflix.jpg",
    title: "Clone da Netflix",
    description: "Construa uma plataforma de streaming completa — catálogo, player de vídeo e login de usuários — do zero até o deploy.",
    restRotation: 0,
    // The logo sits on the left edge of the source image — anchoring the crop there keeps it
    // fully visible, cropping only from the right instead of trimming both sides evenly.
    imagePosition: "left center",
  },
  {
    id: "mentoria",
    img: "/assets/bonus/mentoria.jpg",
    title: "Mentoria e Carreira",
    description: "Sessões exclusivas de orientação de carreira, para te ajudar a entrar e crescer no mercado de tecnologia.",
    restRotation: 0,
  },
  {
    id: "cafeteria",
    img: "/assets/bonus/cafeteria.jpg",
    title: "Landing Page de Cafeteria",
    description: "Crie uma página de vendas moderna e responsiva para um negócio real, com foco em design e conversão.",
    restRotation: 0,
  },
];

// Indices into BONUS_ITEMS, in the order each card starts peeling off the stack — matches the
// "first one left, next one right, the other one in the middle" choreography, independent of
// their final left-to-right reading order above.
const UNSTACK_ORDER = [0, 2, 1];

const TITLE_WINDOW = [0, 0.09];
const TITLE_EXIT = [0.16, 0.24];
const STACK_EMERGE = [0.24, 0.3];
const UNSTACK_START = 0.3;
const UNSTACK_END = 0.62;
const CAPTION_WINDOWS = [
  [0.66, 0.76],
  [0.72, 0.82],
  [0.78, 0.88],
];

const SCALE_START = 0.5;
const BLUR_START_PX = 14;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export function ModuloBonus() {
  const containerRef = useRef(null);
  const titleGroupRef = useRef(null);
  const rowRef = useRef(null);
  const cardRefs = useRef([]);
  const captionRefs = useRef([]);
  const centerOffsetsRef = useRef(BONUS_ITEMS.map(() => 0));

  // Each card's natural resting distance from the row's own center, measured from real layout
  // (offsetLeft/offsetWidth ignore any transform already applied) — used to pull it inward to
  // the stack and let it back out to that exact spot, instead of guessing a fixed pixel gap.
  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const rowCenter = row.offsetWidth / 2;
    centerOffsetsRef.current = cardRefs.current.map((el) => {
      if (!el) return 0;
      return el.offsetLeft + el.offsetWidth / 2 - rowCenter;
    });
  }, []);

  const render = useCallback((progress) => {
    if (titleGroupRef.current) {
      const [inStart, inEnd] = TITLE_WINDOW;
      const [outStart, outEnd] = TITLE_EXIT;
      let t;
      if (progress <= inEnd) {
        t = easeOutCubic(clamp01((progress - inStart) / (inEnd - inStart)));
      } else if (progress < outStart) {
        t = 1;
      } else {
        t = 1 - easeOutCubic(clamp01((progress - outStart) / (outEnd - outStart)));
      }
      titleGroupRef.current.style.opacity = t.toFixed(3);
      titleGroupRef.current.style.transform = `translate(-50%, -50%) scale(${(SCALE_START + (1 - SCALE_START) * t).toFixed(3)})`;
      titleGroupRef.current.style.filter = `blur(${(BLUR_START_PX * (1 - t)).toFixed(2)}px)`;
    }

    if (rowRef.current) {
      const stackT = easeOutCubic(clamp01((progress - STACK_EMERGE[0]) / (STACK_EMERGE[1] - STACK_EMERGE[0])));
      rowRef.current.style.opacity = stackT.toFixed(3);
    }

    const n = BONUS_ITEMS.length;
    const step = n > 1 ? (UNSTACK_END - UNSTACK_START - 0.2) / (n - 1) : 0;
    const unstackTByIndex = new Array(n);
    UNSTACK_ORDER.forEach((cardIndex, rank) => {
      const start = UNSTACK_START + rank * step;
      const end = start + 0.2;
      unstackTByIndex[cardIndex] = easeOutCubic(clamp01((progress - start) / (end - start)));
    });

    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const unstackT = unstackTByIndex[i];
      const offset = centerOffsetsRef.current[i] || 0;
      const x = offset * (unstackT - 1); // fully stacked (x = -offset, cancels resting offset) -> resting (x = 0)
      const rotation = BONUS_ITEMS[i].restRotation * (1 - unstackT);
      el.style.transform = `translateX(${x.toFixed(1)}px) rotate(${rotation.toFixed(2)}deg)`;
      el.style.opacity = Math.max(unstackT, stackOpacityFallback(progress)).toFixed(3);
    });

    captionRefs.current.forEach((el, i) => {
      if (!el) return;
      const [start, end] = CAPTION_WINDOWS[i];
      const t = easeOutCubic(clamp01((progress - start) / (end - start)));
      el.style.opacity = t.toFixed(3);
      el.style.transform = `translateY(${((1 - t) * 16).toFixed(2)}px)`;
    });
  }, []);

  // Cards are already visible (opacity driven by the row's own stack-emerge fade) before their
  // individual unstackT starts climbing — this just keeps a card from re-fading to 0 due to
  // its own unstackT sitting at 0 while still waiting its turn.
  function stackOpacityFallback(progress) {
    return easeOutCubic(clamp01((progress - STACK_EMERGE[0]) / (STACK_EMERGE[1] - STACK_EMERGE[0])));
  }

  useStickyScrub(containerRef, { distance: 4.5, onUpdate: render });

  useEffect(() => {
    measure();
    render(0);
    const refresh = () => {
      measure();
    };
    window.addEventListener("resize", refresh);
    ScrollTrigger.addEventListener("refresh", refresh);
    return () => {
      window.removeEventListener("resize", refresh);
      ScrollTrigger.removeEventListener("refresh", refresh);
    };
  }, [measure, render]);

  return (
    <Wrapper ref={containerRef}>
      <Inner>
        <TitleGroup ref={titleGroupRef}>
          <Title>Módulo bônus</Title>
          <Subtitle>Além de todo nosso conteúdo, temos módulo bônus</Subtitle>
        </TitleGroup>

        <CardsRow ref={rowRef}>
          {BONUS_ITEMS.map((item, i) => (
            <Card key={item.id} ref={(el) => (cardRefs.current[i] = el)}>
              <CardImageStage>
                <img src={item.img} alt={item.title} style={{ objectPosition: item.imagePosition || "center" }} />
              </CardImageStage>
              <CardCaption ref={(el) => (captionRefs.current[i] = el)}>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardCaption>
            </Card>
          ))}
        </CardsRow>
      </Inner>
    </Wrapper>
  );
}
