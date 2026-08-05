import { Fragment, useCallback, useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import {
  Track,
  LineSvg,
  LineHalo,
  LinePath,
  LineTip,
  LineTipHalo,
  Node,
  NodeFaceGray,
  NodeFaceBlue,
  CardWrap,
  Card,
  CardTitle,
  CardDescription,
  LaptopWrapper,
  Connector,
  LaptopStage,
  LaptopImage,
  LaptopVignette,
  WhatsAppScreen,
  WhatsAppHeader,
  ContactAvatar,
  ContactName,
  ChatArea,
  Bubble,
  BubbleText,
  BubbleMeta,
  ComposeRow,
  ComposeInput,
  ComposeText,
  SendButton,
} from "./Evolucao.styles";
import { useStickyScrub } from "../../hooks/useStickyScrub";

const LAPTOP_SRC = "/assets/generated/notebook-aberto.png";
const CONTACT_NAME = "Valério";
const MESSAGE = "Parabéns, vamos ficar com você para essa vaga!!";

const IconCommunity = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="8" cy="9" r="3.4" />
    <circle cx="16" cy="9" r="3.4" />
    <path d="M3 20c0-3.2 2.2-5.4 5-5.4" />
    <path d="M21 20c0-3.2-2.2-5.4-5-5.4" />
  </svg>
);

const IconSupport = () => (
  <svg viewBox="0 0 24 24">
    <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
    <rect x="2" y="13" width="4.5" height="6.5" rx="2" />
    <rect x="17.5" y="13" width="4.5" height="6.5" rx="2" />
  </svg>
);

const IconMentoria = () => (
  <svg viewBox="0 0 24 24">
    <rect x="2" y="5" width="15" height="14" rx="2.5" />
    <polygon points="21,8 21,16 17,12" />
  </svg>
);

const IconPlatform = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 5c-2.2-1.6-5.4-2-8-1v14c2.6-1 5.8-0.6 8 1" />
    <path d="M12 5c2.2-1.6 5.4-2 8-1v14c-2.6-1-5.8-0.6-8 1" />
    <path d="M12 5v14" />
  </svg>
);

const IconBriefcase = () => (
  <svg viewBox="0 0 24 24">
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M3 13h18" />
  </svg>
);

// Cada coordenada aqui (x/y do nó, d do path) compartilha o mesmo espaço de coordenadas
// (largura 0..100, altura 0..VIEWBOX_H) com o viewBox do SVG, então a linha desenhada tem
// garantia de passar exatamente pelo centro de cada nó, em vez de só passar perto. Reduzido
// de espaçamentos de 100 unidades para 70 unidades entre as paradas (e a altura mínima do
// Track escalada para acompanhar), para precisar de menos scroll entre cada uma.
// A ponta depois da última parada foi cortada ainda mais (deixava um vão vazio grande antes
// do notebook) — veja o elemento Connector para ver como ele preenche o resto do caminho.
const VIEWBOX_H = 340;

const STOPS = [
  {
    key: "comunidade",
    side: "left",
    x: 30,
    y: 40,
    title: "Comunidade",
    description:
      "Você não anda essa jornada sozinho — troque experiências, tire dúvidas e cresça junto com milhares de alunos ativos todos os dias.",
    Icon: IconCommunity,
  },
  {
    key: "suporte",
    side: "right",
    x: 70,
    y: 110,
    title: "Suporte",
    description: "Dúvidas nunca ficam parada. Nosso time responde rápido pra você não travar em nenhuma etapa do aprendizado.",
    Icon: IconSupport,
  },
  {
    key: "mentorias",
    side: "left",
    x: 30,
    y: 180,
    title: "Mentorias e calls ao vivo",
    description:
      "Aulas ao vivo e mentorias com quem já trabalha na área, tirando suas dúvidas em tempo real e acelerando sua evolução.",
    Icon: IconMentoria,
  },
  {
    key: "plataforma",
    side: "right",
    x: 70,
    y: 250,
    title: "Plataforma de aulas",
    description: "Conteúdo estruturado, direto ao ponto, disponível quando e onde você quiser estudar — no seu ritmo.",
    Icon: IconPlatform,
  },
  {
    key: "calls-mercado",
    side: "left",
    x: 30,
    y: 320,
    title: "Calls voltada ao mercado de trabalho",
    description: "Calls para te ajudar a construir seu linkedin e currículo para seu tão esperado sim chegar.",
    Icon: IconBriefcase,
  },
];

// Começa bem no centro (x 50) lá no topo, depois curva para alcançar a primeira parada.
const LINE_PATH =
  "M 50 0 C 50 20, 30 20, 30 40 C 30 65, 70 85, 70 110 C 70 135, 30 155, 30 180 C 30 205, 70 225, 70 250 C 70 275, 30 295, 30 320 C 30 328, 50 330, 50 335";

// A troca de cor + revelação do card acontecem numa janela curta do progresso geral, bem
// quando a linha desenhada alcança o ponto daquela parada ao longo do path — não é um corte
// instantâneo, mas rápido o suficiente para passar a sensação de "chegou ali", e o card segue
// um instante depois para um stagger natural.
const COLOR_WINDOW = 0.025;
const CARD_WINDOW = 0.05;

// Fases de progresso do bloco do notebook: o conector desenha primeiro, depois a mensagem
// é digitada dentro da barra de composição, depois "envia" (a barra de composição limpa, a
// bolha assume no chat), depois os tiques de leitura. Reescalado por 200/240 a partir dos
// valores originais 0/0.1/0.7/0.8/0.9 (a distância cresceu de 2 para 2.4) para que cada uma
// dessas fases mantenha exatamente o mesmo tempo de scroll *absoluto* de antes — só a fase
// de encolhimento no final ganhou mais espaço, se estendendo por essa nova distância.
const CONNECTOR_END = 0.083;
const TYPE_START = 0.083;
const TYPE_END = 0.583;
const SEND_START = 0.583;
const SEND_END = 0.667;
const SENT_START = 0.667;
const SENT_END = 0.75;
// Depois que a mensagem é enviada e lida, o próprio notebook (imagem + UI do WhatsApp juntos)
// encolhe em direção ao centro e desaparece — esticado para 3x o comprimento de scroll
// anterior (era 20% da distância 2 = 20vh, agora 25% da distância 2.4 = 60vh) para que
// realmente dê para ver acontecendo, sem ser um piscar rápido, antes de liberar para a
// próxima seção.
const SHRINK_START = 0.75;
const SHRINK_END = 1;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Mede o quanto, ao longo do path *completo*, um determinado sub-path (a mesma string d,
// truncada logo após o ponto de uma parada) alcança, como uma fração 0..1 do comprimento
// total do path — é isso que permite que o tempo de troca de cor/revelação do card se alinhe
// exatamente com a linha visível sendo desenhada.
function measureStopProgress(fullPath, subPathD) {
  const totalLength = fullPath.getTotalLength();
  const temp = document.createElementNS("http://www.w3.org/2000/svg", "path");
  temp.setAttribute("d", subPathD);
  const subLength = temp.getTotalLength();
  return clamp01(subLength / totalLength);
}

export function Evolucao() {
  const trackRef = useRef(null);
  const pathRef = useRef(null);
  const haloPathRef = useRef(null);
  const tipRef = useRef(null);
  const tipHaloRef = useRef(null);
  const blueFaceRefs = useRef([]);
  const cardRefs = useRef([]);
  const stopProgressRef = useRef(STOPS.map(() => 0));
  const laptopContainerRef = useRef(null);
  const laptopStageRef = useRef(null);
  const connectorRef = useRef(null);
  const composeInputRef = useRef(null);
  const composeTextRef = useRef(null);
  const bubbleRef = useRef(null);
  const charsRef = useRef([]);
  const ticksRef = useRef(null);

  useEffect(() => {
    charsRef.current = composeTextRef.current ? Array.from(composeTextRef.current.querySelectorAll("[data-char]")) : [];
  }, []);

  const render = useCallback((progress) => {
    const path = pathRef.current;
    if (!path) return;
    const totalLength = path.getTotalLength();
    const offset = (totalLength * (1 - progress)).toFixed(2);

    path.style.strokeDashoffset = offset;
    // Mesmo `d` do path principal, então compartilha exatamente o mesmo comprimento — desenhado em sincronia.
    if (haloPathRef.current) haloPathRef.current.style.strokeDashoffset = offset;

    const tipPoint = path.getPointAtLength(totalLength * progress);
    const tipVisible = progress > 0.002 && progress < 0.998 ? "1" : "0";
    if (tipRef.current) {
      tipRef.current.setAttribute("cx", tipPoint.x.toFixed(2));
      tipRef.current.setAttribute("cy", tipPoint.y.toFixed(2));
      tipRef.current.style.opacity = tipVisible;
    }
    if (tipHaloRef.current) {
      tipHaloRef.current.setAttribute("cx", tipPoint.x.toFixed(2));
      tipHaloRef.current.setAttribute("cy", tipPoint.y.toFixed(2));
      tipHaloRef.current.style.opacity = tipVisible;
    }

    STOPS.forEach((_, i) => {
      const stopProgress = stopProgressRef.current[i];

      const colorT = easeOutCubic(clamp01((progress - stopProgress) / COLOR_WINDOW));
      if (blueFaceRefs.current[i]) blueFaceRefs.current[i].style.opacity = colorT.toFixed(3);

      const cardT = easeOutCubic(clamp01((progress - stopProgress) / CARD_WINDOW));
      const cardEl = cardRefs.current[i];
      if (cardEl) {
        cardEl.style.opacity = cardT.toFixed(3);
        cardEl.style.transform = `translateY(${(-50 + (1 - cardT) * 12).toFixed(2)}%)`;
      }
    });
  }, []);

  useEffect(() => {
    const path = pathRef.current;
    const track = trackRef.current;
    if (!path || !track) return undefined;

    const totalLength = path.getTotalLength();
    path.style.strokeDasharray = `${totalLength}`;
    path.style.strokeDashoffset = `${totalLength}`;
    if (haloPathRef.current) {
      haloPathRef.current.style.strokeDasharray = `${totalLength}`;
      haloPathRef.current.style.strokeDashoffset = `${totalLength}`;
    }

    // Pré-calcula exatamente onde ao longo do path (como uma fração de progresso) o ponto de
    // cada parada fica, medindo uma cópia truncada da mesma string do path até aquele ponto.
    const cutPoints = [
      "M 50 0 C 50 20, 30 20, 30 40",
      "M 50 0 C 50 20, 30 20, 30 40 C 30 65, 70 85, 70 110",
      "M 50 0 C 50 20, 30 20, 30 40 C 30 65, 70 85, 70 110 C 70 135, 30 155, 30 180",
      "M 50 0 C 50 20, 30 20, 30 40 C 30 65, 70 85, 70 110 C 70 135, 30 155, 30 180 C 30 205, 70 225, 70 250",
      "M 50 0 C 50 20, 30 20, 30 40 C 30 65, 70 85, 70 110 C 70 135, 30 155, 30 180 C 30 205, 70 225, 70 250 C 70 275, 30 295, 30 320",
    ];
    stopProgressRef.current = cutPoints.map((d) => measureStopProgress(path, d));

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: track,
        start: "top 80%",
        end: "bottom 70%",
        scrub: true,
        onUpdate: (self) => render(self.progress),
      });
    });

    return () => ctx.revert();
  }, [render]);

  const renderLaptop = useCallback((progress) => {
    // Conector desenha primeiro, como uma continuação da linha do Track, antes de qualquer outra coisa.
    if (connectorRef.current) {
      const connectorT = easeOutCubic(clamp01(progress / CONNECTOR_END));
      connectorRef.current.style.transform = `scaleY(${connectorT.toFixed(3)})`;
      connectorRef.current.style.opacity = connectorT > 0.02 ? "1" : "0";
    }

    // Mensagem é digitada letra por letra dentro da barra de composição.
    const chars = charsRef.current;
    const total = chars.length;
    const typeT = clamp01((progress - TYPE_START) / (TYPE_END - TYPE_START));
    const visibleCount = Math.floor(typeT * total);
    chars.forEach((el, i) => {
      el.style.opacity = i < visibleCount ? "1" : "0";
    });

    // Depois "envia": o texto da barra de composição some enquanto a bolha real do chat assume.
    const sendT = easeOutCubic(clamp01((progress - SEND_START) / (SEND_END - SEND_START)));
    if (composeInputRef.current) composeInputRef.current.style.opacity = (1 - sendT).toFixed(3);
    if (bubbleRef.current) {
      bubbleRef.current.style.opacity = sendT.toFixed(3);
      bubbleRef.current.style.transform = `translateY(${(6 * (1 - sendT)).toFixed(2)}px) scale(${(0.94 + 0.06 * sendT).toFixed(3)})`;
    }

    if (ticksRef.current) {
      const sentT = clamp01((progress - SENT_START) / (SENT_END - SENT_START));
      ticksRef.current.style.opacity = sentT.toFixed(3);
    }

    // Por fim, o próprio notebook encolhe em direção ao centro e desaparece, antes que essa
    // seção libere para o que vem a seguir.
    if (laptopStageRef.current) {
      const shrinkT = easeOutCubic(clamp01((progress - SHRINK_START) / (SHRINK_END - SHRINK_START)));
      laptopStageRef.current.style.transform = `scale(${(1 - shrinkT).toFixed(3)})`;
      laptopStageRef.current.style.opacity = (1 - shrinkT).toFixed(3);
    }
  }, []);

  useStickyScrub(laptopContainerRef, { distance: 2.4, onUpdate: renderLaptop });

  return (
    <>
      <Track ref={trackRef}>
        <LineSvg viewBox={`0 0 100 ${VIEWBOX_H}`} preserveAspectRatio="none">
          <LineHalo ref={haloPathRef} d={LINE_PATH} />
          <LinePath ref={pathRef} d={LINE_PATH} />
          <LineTipHalo ref={tipHaloRef} r="2.4" cx="50" cy="0" />
          <LineTip ref={tipRef} r="1.1" cx="50" cy="0" />
        </LineSvg>

        {STOPS.map((stop, i) => (
          <Fragment key={stop.key}>
            <Node style={{ left: `${stop.x}%`, top: `${(stop.y / VIEWBOX_H) * 100}%` }}>
              <NodeFaceGray>
                <stop.Icon />
              </NodeFaceGray>
              <NodeFaceBlue ref={(el) => (blueFaceRefs.current[i] = el)}>
                <stop.Icon />
              </NodeFaceBlue>
            </Node>

            <CardWrap
              ref={(el) => (cardRefs.current[i] = el)}
              $side={stop.side}
              style={{ top: `${(stop.y / VIEWBOX_H) * 100}%` }}
            >
              <Card>
                <CardTitle>{stop.title}</CardTitle>
                <CardDescription>{stop.description}</CardDescription>
              </Card>
            </CardWrap>
          </Fragment>
        ))}
      </Track>

      <LaptopWrapper ref={laptopContainerRef}>
        <Connector ref={connectorRef} />
        <LaptopStage ref={laptopStageRef}>
          <LaptopImage src={LAPTOP_SRC} alt="Notebook aberto com WhatsApp" />
          <LaptopVignette />
          <WhatsAppScreen>
            <WhatsAppHeader>
              <ContactAvatar>V</ContactAvatar>
              <ContactName>{CONTACT_NAME}</ContactName>
            </WhatsAppHeader>
            <ChatArea>
              <Bubble ref={bubbleRef}>
                <BubbleText>{MESSAGE}</BubbleText>
                <BubbleMeta>
                  21:42
                  <svg ref={ticksRef} viewBox="0 0 16 11" fill="none">
                    <path
                      d="M1 5.5 4 8.5 9.5 1.5M6.5 8.5 11 3.5M6.5 8.5 11.5 3"
                      stroke="#53bdeb"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </BubbleMeta>
              </Bubble>
            </ChatArea>
            <ComposeRow>
              <ComposeInput ref={composeInputRef}>
                <ComposeText ref={composeTextRef}>
                  {MESSAGE.split("").map((ch, i) => (
                    <span key={i} data-char style={{ opacity: 0 }}>
                      {ch}
                    </span>
                  ))}
                </ComposeText>
              </ComposeInput>
              <SendButton>
                <svg viewBox="0 0 24 24">
                  <path d="M4 12h16M14 6l6 6-6 6" />
                </svg>
              </SendButton>
            </ComposeRow>
          </WhatsAppScreen>
        </LaptopStage>
      </LaptopWrapper>
    </>
  );
}
