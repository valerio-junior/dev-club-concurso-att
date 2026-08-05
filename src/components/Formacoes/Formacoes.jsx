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
const RIGHT_MARGIN_TARGET_PX = 24; // margem quase zero à direita assim que um card está em exibição
const RISE_DISTANCE_BUFFER_PX = 40; // um pouco além da borda inferior do viewport, para que realmente comece fora da tela
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
  // Progresso (0..1) no qual a posição de cada card na fileira se alinha com onde o card 0
  // começou — ou seja, quando ele "chega" à vista. Medido a partir do layout real, não estimado.
  const arrivalProgressRef = useRef(FORMACOES.map(() => 0));

  const measure = useCallback(() => {
    const belt = beltLayerRef.current;
    const textCol = textColRef.current;
    const cardsRow = cardsRowRef.current;
    const firstCard = cardRefs.current[0];
    const lastCard = cardRefs.current[cardRefs.current.length - 1];
    if (!belt || !textCol || !cardsRow || !firstCard || !lastCard) return;

    // Empurra a fileira para que o primeiro card (de tamanho fixo) fique rente à margem direita —
    // não dá para confiar no justify-content para isso já que a fileira transborda bem além do
    // viewport com os outros 7 cards, o que desregula a própria distribuição de espaço do flexbox.
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

    // Iguala a altura de cada card à altura natural do primeiro — as descrições variam de
    // comprimento, então se deixados soltos os cards mais curtos acabam visualmente menores que o
    // card 0. Reseta para auto primeiro para que a medição reflita o conteúdo real, não uma altura
    // desatualizada de uma passada anterior (ex: depois de um resize).
    cardRefs.current.forEach((el) => {
      if (el) el.style.height = "";
    });
    const cardHeight = firstCard.getBoundingClientRect().height;
    cardRefs.current.forEach((el) => {
      if (el) el.style.height = `${cardHeight}px`;
    });

    // A que distância abaixo do viewport um card precisa começar para realmente subir a partir de
    // fora da tela — todos os cards compartilham o mesmo Y de repouso (uma única fileira), então uma
    // medição cobre todos eles. Medido em relação ao *próprio container da seção*, não ao viewport ao
    // vivo: no carregamento da página (digamos, com o scroll ainda no Hero), essa seção ainda está
    // bem mais abaixo no documento, sem fixar, então sua posição ao vivo no viewport não tem
    // significado — mas seu offset em relação ao topo do próprio container é constante independente
    // de onde esse container esteja atualmente na página, já que o container é sempre exatamente
    // 100vh assim que fixado.
    const container = containerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const cardOffsetFromContainerTop = firstCard.getBoundingClientRect().top - containerRect.top;
      riseDistanceRef.current = Math.max(containerRect.height - cardOffsetFromContainerTop + RISE_DISTANCE_BUFFER_PX, 0);
    }

    const originX = firstCard.getBoundingClientRect().left;
    // A própria caixa do BeltLayer é só a largura do viewport (overflow de flex não expande o
    // próprio bounding rect de um pai) — o que realmente precisamos é a que distância a borda
    // direita atual do *último card* está do viewport, já que é isso que precisa se livrar da borda
    // esquerda para que tudo (título + a fileira inteira, todos andando na mesma esteira) tenha ido
    // embora.
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
      // Linear, sem easing — uma esteira de verdade se move a uma taxa constante, e isso mantém a
      // matemática de progresso de chegada abaixo simples e previsível.
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

      // Sobe ao longo de *toda* a lacuna desde que o card anterior chegou (ou seja, desde que a
      // esteira começou a abrir espaço à direita para ele) em vez de uma janela curta e fixa logo
      // antes da chegada — o objetivo é realmente ver ele subindo conforme você rola.
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

  // O progresso agora chega de forma imperativa a partir do FormacoesConteudosIA (o Stage fixado
  // compartilhado que hospeda essa seção e o ConteudosIA juntos, permitindo que os dois se
  // sobreponham) em vez dessa seção fixar a si mesma — veja aquele componente para a coreografia de
  // scroll combinada.
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

    // Outras seções (seus próprios pin-spacers, vídeos carregando, etc.) ainda podem mudar o
    // layout total da página depois da medição inicial dessa seção — os eventos "load" e "resize" da
    // window não cobrem tudo isso, mas o próprio evento "refresh" do GSAP dispara toda vez que o
    // ScrollTrigger recalcula qualquer coisa (ex: o pin-spacer de uma seção irmã mudando de altura),
    // que é exatamente quando as medições em cache dessa seção podem ficar desatualizadas.
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
