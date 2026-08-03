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
  LaptopStage,
  LaptopImage,
  WhatsAppScreen,
  WhatsAppHeader,
  ContactAvatar,
  ContactName,
  ChatArea,
  Bubble,
  BubbleText,
  BubbleMeta,
} from "./Evolucao.styles";
import { useStickyScrub } from "../../hooks/useStickyScrub";

const LAPTOP_SRC = "/assets/generated/evolucao-laptop.png";
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

// Every coordinate here (node x/y, path d) shares one coordinate space (0..100 wide,
// 0..VIEWBOX_H tall) with the SVG's viewBox, so the drawn line is guaranteed to pass exactly
// through each node's center instead of just tracking near it. Tightened from 100-unit to
// 70-unit gaps between stops (and Track's min-height scaled down to match) so less scroll is
// needed between each one.
const VIEWBOX_H = 320;

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
    description: "Dúvida nunca fica parada. Nosso time responde rápido pra você não travar em nenhuma etapa do aprendizado.",
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
];

// Starts dead-center (x 50) at the very top, then curves out to reach the first stop.
const LINE_PATH =
  "M 50 0 C 50 20, 30 20, 30 40 C 30 65, 70 85, 70 110 C 70 135, 30 155, 30 180 C 30 205, 70 225, 70 250 C 70 275, 50 285, 50 300";

// The color swap + card reveal happen over a short window of overall progress right as the
// drawn line reaches that stop's point along the path — not an instant snap, but quick enough
// to read as "arriving there", and the card follows a beat behind for a natural stagger.
const COLOR_WINDOW = 0.025;
const CARD_WINDOW = 0.05;

const TYPE_END = 0.85;
const SENT_START = 0.85;
const SENT_END = 1;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Measures how far along the *full* path a given sub-path (the same d string, truncated right
// after a stop's point) reaches, as a 0..1 fraction of the full path's length — this is what
// lets the color-change/card-reveal timing line up exactly with the visible drawing line.
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
  const bubbleRef = useRef(null);
  const charsRef = useRef([]);
  const ticksRef = useRef(null);

  useEffect(() => {
    charsRef.current = bubbleRef.current ? Array.from(bubbleRef.current.querySelectorAll("[data-char]")) : [];
  }, []);

  const render = useCallback((progress) => {
    const path = pathRef.current;
    if (!path) return;
    const totalLength = path.getTotalLength();
    const offset = (totalLength * (1 - progress)).toFixed(2);

    path.style.strokeDashoffset = offset;
    // Same `d` as the main path, so it shares the exact same length — drawn in lockstep.
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

    // Precompute exactly where along the path (as a progress fraction) each stop's point
    // sits, by measuring a truncated copy of the same path string up to that point.
    const cutPoints = [
      "M 50 0 C 50 20, 30 20, 30 40",
      "M 50 0 C 50 20, 30 20, 30 40 C 30 65, 70 85, 70 110",
      "M 50 0 C 50 20, 30 20, 30 40 C 30 65, 70 85, 70 110 C 70 135, 30 155, 30 180",
      "M 50 0 C 50 20, 30 20, 30 40 C 30 65, 70 85, 70 110 C 70 135, 30 155, 30 180 C 30 205, 70 225, 70 250",
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
    const chars = charsRef.current;
    const total = chars.length;
    const visibleCount = Math.floor(clamp01(progress / TYPE_END) * total);
    chars.forEach((el, i) => {
      el.style.opacity = i < visibleCount ? "1" : "0";
    });

    if (ticksRef.current) {
      const sentT = clamp01((progress - SENT_START) / (SENT_END - SENT_START));
      ticksRef.current.style.opacity = sentT.toFixed(3);
    }
  }, []);

  useStickyScrub(laptopContainerRef, { distance: 2, onUpdate: renderLaptop });

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
        <LaptopStage>
          <LaptopImage src={LAPTOP_SRC} alt="Notebook aberto com WhatsApp" />
          <WhatsAppScreen>
            <WhatsAppHeader>
              <ContactAvatar>V</ContactAvatar>
              <ContactName>{CONTACT_NAME}</ContactName>
            </WhatsAppHeader>
            <ChatArea>
              <Bubble ref={bubbleRef}>
                <BubbleText>
                  {MESSAGE.split("").map((ch, i) => (
                    <span key={i} data-char style={{ opacity: 0 }}>
                      {ch}
                    </span>
                  ))}
                </BubbleText>
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
          </WhatsAppScreen>
        </LaptopStage>
      </LaptopWrapper>
    </>
  );
}
