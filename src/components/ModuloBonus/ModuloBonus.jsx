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

// Renderizado da esquerda para a direita nessa ordem (layout final de repouso), mas cada um começa
// sua jornada de "desempilhamento" em um momento diferente (ver UNSTACK_ORDER) — o card da Netflix se
// destaca primeiro (para a esquerda), o da cafeteria em segundo (para a direita), e o de mentoria por
// último, se acomodando na lacuna deixada no meio.
const BONUS_ITEMS = [
  {
    id: "netflix",
    img: "/assets/bonus/Netflix.jpg",
    title: "Clone da Netflix",
    description: "Construa uma plataforma de streaming completa — catálogo, player de vídeo e login de usuários — do zero até o deploy.",
    restRotation: 0,
    // O logo fica na borda esquerda da imagem original — ancorar o corte ali mantém ele totalmente
    // visível, cortando só pela direita em vez de aparar os dois lados igualmente.
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

// Índices em BONUS_ITEMS, na ordem em que cada card começa a se destacar da pilha — corresponde à
// coreografia "primeiro para a esquerda, o próximo para a direita, o outro no meio", independente da
// ordem final de leitura da esquerda para a direita acima.
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

  // A distância natural de repouso de cada card em relação ao centro da própria fileira, medida a
  // partir do layout real (offsetLeft/offsetWidth ignoram qualquer transform já aplicado) — usada
  // para puxá-lo para dentro da pilha e deixá-lo voltar exatamente para esse ponto, em vez de
  // adivinhar um espaçamento fixo em pixels.
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
      const x = offset * (unstackT - 1); // totalmente empilhado (x = -offset, cancela o offset de repouso) -> em repouso (x = 0)
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

  // Os cards já ficam visíveis (opacidade controlada pelo próprio fade de surgimento da pilha da
  // fileira) antes que o unstackT individual comece a subir — isso só evita que um card volte a
  // desaparecer para 0 por causa do próprio unstackT estar parado em 0 enquanto ainda espera sua vez.
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
