import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { ScrollTrigger } from "../../lib/gsap";
import { Wrapper, Title, RingStage, ProjectItem, ProjectImg } from "./Projetos.styles";

const PROJECTS = [
  "/assets/projetos/projeto-1.jpg",
  "/assets/projetos/projeto-2.jpg",
  "/assets/projetos/projeto-3.jpg",
  "/assets/projetos/projeto-4.jpg",
  "/assets/projetos/projeto-5.jpg",
  "/assets/projetos/projeto-6.jpg",
];

// O título surge em profundidade primeiro, depois o anel começa a se formar (um projeto se
// encaixando de cada vez), e assim que os seis estiverem no lugar ele continua girando por uma
// volta extra completa antes da seção soltar o scroll.
const TITLE_WINDOW = [0, 0.1];
const RING_START = 0.1;
const FORM_END = 0.65;
const SPIN_END = 1;

// Seis paradas igualmente espaçadas começando na esquerda (180°) e varrendo por cima em direção
// à direita, depois em volta por baixo de volta ao início.
const BASE_ANGLES = PROJECTS.map((_, i) => 180 - i * (360 / PROJECTS.length));

const RING_PADDING = 6; // px de espaço de respiro entre as imagens do anel e a borda do stage

// A jornada que cada imagem de projeto percorre antes de entrar no anel — offsets (vw, vh) a
// partir do próprio centro do anel, percorridos em ordem. O trecho final não está listado aqui: é
// o que a fórmula do anel estiver mirando naquele momento para essa imagem (ver `render`), então o
// caminho sempre entrega de forma limpa para o círculo giratório em vez de mirar num ponto fixo que
// a rotação acabaria ultrapassando.
const PATH_WAYPOINTS = [
  { dx: -55, dy: 18 }, // entra fora da tela, pela esquerda
  { dx: 36, dy: -30 }, // subiu, curvando para o lado direito
  { dx: 36, dy: 34 }, // desceu, ainda na direita, perto da base
  { dx: 18, dy: 34 }, // deslocou um pouco para a esquerda
  { dx: 18, dy: 16 }, // subiu um pouco de novo
  { dx: 3, dy: 6 }, // de volta à esquerda, perto do centro — prestes a entrar no anel
];

// As seis imagens percorrem exatamente o mesmo caminho, na mesma velocidade, ao longo de uma
// única linha do tempo compartilhada — cada uma só fica atrasada em relação à anterior por essa
// fração de um percurso completo, então elas parecem uma corrente conectada se movendo junta (como
// um trem, ou uma cobrinha) em vez de seis viagens solo separadas.
const SNAKE_GAP = 0.03;

const SCALE_START = 0.5;
const BLUR_START_PX = 14;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// O progresso chega de forma imperativa a partir do PlataformaProjetos (o Stage fixado
// compartilhado que hospeda essa seção, revelada por baixo da janela de fechamento do Plataforma)
// em vez dessa seção fixar a si mesma — veja aquele componente para a coreografia de scroll
// combinada.
export const Projetos = forwardRef(function Projetos(_props, ref) {
  const titleRef = useRef(null);
  const ringStageRef = useRef(null);
  const itemRefs = useRef([]);
  const radiusRef = useRef(200);
  const progressRef = useRef(0);

  const measure = useCallback(() => {
    const stage = ringStageRef.current;
    const firstItem = itemRefs.current[0];
    if (!stage || !firstItem) return;
    const stageSize = stage.getBoundingClientRect().width;
    const itemSize = firstItem.getBoundingClientRect().width;
    radiusRef.current = Math.max((stageSize - itemSize) / 2 - RING_PADDING, 0);
  }, []);

  const render = useCallback((progress) => {
    if (titleRef.current) {
      const [start, end] = TITLE_WINDOW;
      const t = easeOutCubic(clamp01((progress - start) / (end - start)));
      titleRef.current.style.opacity = t.toFixed(3);
      titleRef.current.style.transform = `scale(${(SCALE_START + (1 - SCALE_START) * t).toFixed(3)})`;
      titleRef.current.style.filter = `blur(${(BLUR_START_PX * (1 - t)).toFixed(2)}px)`;
    }

    // Velocidade angular constante (linear, sem easing) — o anel gira de forma constante o tempo
    // todo, tanto enquanto os projetos ainda estão entrando quanto durante a volta extra assim que o
    // anel está completo.
    let turns;
    if (progress <= RING_START) {
      turns = 0;
    } else if (progress <= FORM_END) {
      turns = clamp01((progress - RING_START) / (FORM_END - RING_START));
    } else {
      turns = 1 + clamp01((progress - FORM_END) / (SPIN_END - FORM_END));
    }
    const rotationDeg = turns * 360;

    const n = PROJECTS.length;
    const formWindow = FORM_END - RING_START;
    // A linha do tempo compartilhada P vai de 0 (o líder começa) até 1 + (n-1)*SNAKE_GAP (a cauda
    // termina), escalada para que o valor final caia exatamente em FORM_END — toda imagem percorre a
    // mesma distância na mesma quantidade de scroll, só deslocada no tempo em relação à que está na
    // frente dela.
    const formT = clamp01((progress - RING_START) / formWindow);
    const sharedP = formT * (1 + (n - 1) * SNAKE_GAP);
    const radius = radiusRef.current;
    const vw = window.innerWidth / 100;
    const vh = window.innerHeight / 100;

    itemRefs.current.forEach((el, i) => {
      if (!el) return;

      // Cada imagem acompanha o mesmo referencial giratório que as outras (seu ângulo base mais a
      // rotação compartilhada) — ela nunca gira no próprio eixo, só sua posição varre em volta do
      // anel, como cabines de uma roda-gigante que permanecem eretas.
      const angleDeg = BASE_ANGLES[i] + rotationDeg;
      const rad = (angleDeg * Math.PI) / 180;
      const liveTarget = { x: radius * Math.cos(rad), y: radius * Math.sin(rad) };

      const t = clamp01(sharedP - i * SNAKE_GAP);

      // Percorre os waypoints fixos, e então entrega para o alvo ao vivo do próprio anel como o
      // trecho final. Parametrizado pelo comprimento de arco real (não tempo igual por segmento) e
      // interpolado linearmente dentro de cada um — velocidade constante em toda a rota, então cada
      // imagem mantém exatamente a mesma distância da que está à sua frente, em vez de se aglomerar
      // em segmentos curtos e se espalhar em segmentos longos.
      const points = [...PATH_WAYPOINTS.map((p) => ({ x: p.dx * vw, y: p.dy * vh })), liveTarget];
      const segLengths = [];
      let total = 0;
      for (let k = 0; k < points.length - 1; k++) {
        const segDx = points[k + 1].x - points[k].x;
        const segDy = points[k + 1].y - points[k].y;
        const len = Math.hypot(segDx, segDy);
        segLengths.push(len);
        total += len;
      }
      const targetDist = t * total;
      let acc = 0;
      let segIndex = segLengths.length - 1;
      let localT = 1;
      for (let k = 0; k < segLengths.length; k++) {
        if (k === segLengths.length - 1 || targetDist <= acc + segLengths[k]) {
          segIndex = k;
          localT = segLengths[k] > 0 ? clamp01((targetDist - acc) / segLengths[k]) : 1;
          break;
        }
        acc += segLengths[k];
      }
      const a = points[segIndex];
      const b = points[segIndex + 1];
      const x = a.x + (b.x - a.x) * localT;
      const y = a.y + (b.y - a.y) * localT;

      // Opacidade/escala sobem rapidamente bem quando a imagem começa sua jornada, depois seguram na
      // força total pelo resto do voo — sem necessidade de ficar semitransparente no meio do caminho.
      const fadeT = easeOutCubic(clamp01(t / 0.2));

      el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(SCALE_START + (1 - SCALE_START) * fadeT).toFixed(3)})`;
      el.style.opacity = fadeT.toFixed(3);
    });
  }, []);

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
    <Wrapper>
      <Title ref={titleRef}>Projetos reais</Title>
      <RingStage ref={ringStageRef}>
        {PROJECTS.map((src, i) => (
          <ProjectItem key={src} ref={(el) => (itemRefs.current[i] = el)}>
            <ProjectImg src={src} alt={`Projeto ${i + 1}`} />
          </ProjectItem>
        ))}
      </RingStage>
    </Wrapper>
  );
});
