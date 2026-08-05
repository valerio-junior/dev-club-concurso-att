import { useEffect, useMemo, useRef, useState } from "react";
import {
  Wrapper,
  Inner,
  LeftCol,
  RightCol,
  Title,
  Description,
  Checklist,
  ChecklistItem,
  CheckIcon,
  ClosingLine,
  Stage,
  OrbitRing,
  LinesSvg,
  BrainImg,
  BrainCore,
  Node,
  TeacherBadge,
  IconBadge,
  EnergyDot,
} from "./Professores.styles";

const BRAIN_SRC = "/assets/generated/professores-cerebro-transparente.png";

const CHECKLIST = [
  "Melhor didática do mercado e conteúdos exclusivos",
  "Recrutadora te auxiliando frente a frente",
  "Terapeuta profissional para quebrar as barreiras da sua mente",
  "Profissional e perita em Inteligência Artificial",
  "Profissional fullstack te auxiliando da construção ao deploy",
];

// Anel interno — mais próximo do cérebro, um badge por professor.
const TEACHERS = [
  { id: "rodolfo", img: "/assets/professores/rodolfo-ceo.jpg" },
  { id: "fernanda", img: "/assets/professores/fernanda-mentora.jpg" },
  { id: "henrique", img: "/assets/professores/henrique-mentor.jpg" },
  { id: "juliana", img: "/assets/professores/juliana-recruter.jpg" },
  { id: "mateus", img: "/assets/professores/mateus-ia.jpg" },
  // Foto de corpo inteiro (não um headshot como as outras) — desloca o crop do badge para o
  // topo, priorizando cabeça/cabelo em vez de cortar no meio e mostrar só o torso.
  { id: "terapeuta", img: "/assets/professores/terapeuta.webp", objectPosition: "50% 12%" },
];

// Anel externo — ferramentas de IA misturadas com tecnologias principais, mais distante do cérebro.
const ICONS = [
  "/assets/logos/ai/gemini.svg",
  "/assets/logos/ai/chatgpt.svg",
  "/assets/logos/ai/claude.svg",
  "/assets/logos/ai/copilot.svg",
  "/assets/logos/ai/meta-ai.svg",
  "/assets/logos/ai/notion.svg",
  "/assets/logos/tech/html5.svg",
  "/assets/logos/tech/css3.svg",
  "/assets/logos/tech/react.svg",
  "/assets/logos/tech/typescript.svg",
  "/assets/logos/tech/nodedotjs.svg",
  "/assets/logos/tech/git.svg",
  "/assets/logos/tech/github.svg",
  "/assets/logos/terapia.svg",
].map((src, i) => ({ id: `icon-${i}`, src }));

// Uma cor de destaque (estilo marca) por ícone, na mesma ordem de ICONS — usada na borda/brilho do hover.
const ICON_COLORS = [
  "#8B5CF6", // Gemini
  "#10A37F", // ChatGPT
  "#D97757", // Claude
  "#3B82F6", // Copilot
  "#2E5FD9", // Meta AI
  "#E5E7EB", // Notion
  "#E34F26", // HTML5
  "#1572B6", // CSS3
  "#61DAFB", // React
  "#3178C6", // TypeScript
  "#339933", // Node.js
  "#F05032", // Git
  "#8250DF", // GitHub
  "#F472B6", // Terapia
];

// Os professores não têm uma "cor de marca" própria, então todos compartilham esse mesmo
// tom (o azul padrão do site) para a borda/brilho do hover.
const TEACHER_HOVER_COLOR = "#60A5FA";

// O hover/repulsão reage dentro dessa distância (px) tanto do badge quanto do fio dele — não
// precisa acertar exatamente em cima. A repulsão empurra até essa quantidade de px para longe
// do cursor, mais forte bem de perto e enfraquecendo até a borda desse raio.
const HOVER_RADIUS = 70;
const MAX_PUSH = 26;
// Com que velocidade o empurrão (e o retorno à posição de repouso) se aproxima do alvo a
// cada frame — quanto maior, mais rápido reage; quanto menor, mais "flutuante" fica.
const PUSH_EASE = 0.18;

const INNER_RADIUS_RATIO = 0.27;
const OUTER_RADIUS_RATIO = 0.47;

// Cada nó — professor ou ícone — se conecta ao cérebro com sua própria linha reta e direta
// (sem passar por nenhum outro), igual à referência: uma teia radial limpa, sem emaranhados.
// Só os fios dos ícones carregam partículas de energia, porém — um voo rápido assim que liberadas.
const INBOUND_DURATION = 2.4;

// Os ícones são liberados em pequenas rajadas escalonadas (2, depois 1, depois 1, depois 2, ...)
// em vez de um fluxo contínuo e uniformemente espaçado, para que as chegadas pareçam pequenas
// ondas distintas em vez de tudo se movendo o tempo todo. A soma precisa dar ICONS.length (14).
const RELEASE_GROUPS = [2, 1, 1, 2, 1, 2, 1, 1, 2, 1];
const GROUP_GAP = 0.6; // segundos entre o início de cada rajada
const RELEASE_OFFSETS = RELEASE_GROUPS.flatMap((count, groupIndex) => Array(count).fill(groupIndex * GROUP_GAP));
const CYCLE_LENGTH = RELEASE_GROUPS.length * GROUP_GAP;

// Um punhado de cores de "energia" variadas alternadas nos fios em vez de uma cor única,
// para que a rede inteira pareça mais rica/viva.
const PARTICLE_COLORS = ["#7ecbff", "#ffd166", "#ff9f5a", "#a78bfa", "#6ee7b7", "#ff8fb1"];

// O quanto o núcleo do cérebro deve continuar aceso após uma chegada, a cada frame em que não
// é reativado — é isso que transforma chegadas individuais em um pulso suave e decrescente,
// em vez de um piscar liga/desliga.
const CORE_DECAY = 0.95;

// Órbita ambiente contínua — os ícones giram no sentido anti-horário ("esquerda"), as fotos
// dos professores giram no sentido horário ("direita"), direções opostas, ambas lentas o
// suficiente para parecerem ambientes e não distrativas. Graus por segundo.
const ICON_ROTATION_SPEED = 5;
const TEACHER_ROTATION_SPEED = -5;

function angleFor(i, count) {
  return (i / count) * 360 - 90;
}

// Menor distância do ponto `p` até o segmento a->b — usada para que passar o mouse em
// qualquer ponto do fio conte como estar "perto" do badge, não só do badge em si.
function distanceToSegment(p, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;
  const t = lenSq > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq)) : 0;
  const cx = a.x + abx * t;
  const cy = a.y + aby * t;
  return Math.hypot(p.x - cx, p.y - cy);
}

export function Professores() {
  const wrapperRef = useRef(null);
  const stageRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [size, setSize] = useState(600);

  const inboundParticleRefs = useRef([]);
  const coreRef = useRef(null);
  const coreEnergyRef = useRef(0);
  const teacherNodeRefs = useRef([]);
  const iconNodeRefs = useRef([]);
  const teacherLineRefs = useRef([]);
  const iconLineRefs = useRef([]);
  const teacherBadgeRefs = useRef([]);
  const iconBadgeRefs = useRef([]);
  const mouseRef = useRef(null);
  const teacherPushRef = useRef(TEACHERS.map(() => ({ x: 0, y: 0 })));
  const iconPushRef = useRef(ICONS.map(() => ({ x: 0, y: 0 })));

  const handleStageMouseMove = (e) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const handleStageMouseLeave = () => {
    mouseRef.current = null;
  };

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const measure = () => {
      if (stageRef.current) setSize(stageRef.current.getBoundingClientRect().width);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const center = size / 2;
  const innerRadius = size * INNER_RADIUS_RATIO;
  const outerRadius = size * OUTER_RADIUS_RATIO;

  const innerPositions = useMemo(
    () =>
      TEACHERS.map((_, i) => {
        const rad = (angleFor(i, TEACHERS.length) * Math.PI) / 180;
        return { x: center + innerRadius * Math.cos(rad), y: center + innerRadius * Math.sin(rad) };
      }),
    [center, innerRadius]
  );

  const outerPositions = useMemo(
    () =>
      ICONS.map((_, i) => {
        const rad = (angleFor(i, ICONS.length) * Math.PI) / 180;
        return { x: center + outerRadius * Math.cos(rad), y: center + outerRadius * Math.sin(rad) };
      }),
    [center, outerRadius]
  );

  // Move cada partícula de energia (e o brilho do núcleo do cérebro) a cada frame — usando um
  // requestAnimationFrame comum (não vinculado ao scroll), do mesmo jeito que o resto dessa seção
  // se comporta como uma cena viva em vez de uma sequência controlada pelo scroll. Só roda
  // quando de fato está visível.
  useEffect(() => {
    if (!visible) return undefined;
    let raf;

    const animate = (time) => {
      const t = time / 1000;
      let arrivalEnergy = 0;

      const iconRotation = (t * ICON_ROTATION_SPEED) % 360;
      const teacherRotation = (t * TEACHER_ROTATION_SPEED) % 360;

      const mouse = mouseRef.current;

      // Os professores orbitam continuamente — cada frame recalcula o ângulo atual e então
      // atualiza o próprio fio (ponto final da linha) e a posição do badge para acompanhar,
      // assim o fio sempre fica preso à foto em vez da foto se afastar dele. Aproximar o cursor
      // de qualquer um dos dois (badge ou fio) faz com que ele se desvie e acenda.
      TEACHERS.forEach((_, i) => {
        const angleDeg = angleFor(i, TEACHERS.length) + teacherRotation;
        const rad = (angleDeg * Math.PI) / 180;
        const baseX = center + innerRadius * Math.cos(rad);
        const baseY = center + innerRadius * Math.sin(rad);

        const centerPoint = { x: center, y: center };
        const basePoint = { x: baseX, y: baseY };
        const segDist = mouse ? distanceToSegment(mouse, centerPoint, basePoint) : Infinity;
        const isHover = segDist < HOVER_RADIUS;

        const push = teacherPushRef.current[i];
        let targetPushX = 0;
        let targetPushY = 0;
        if (isHover) {
          const dist = Math.max(Math.hypot(baseX - mouse.x, baseY - mouse.y), 1);
          const strength = (1 - segDist / HOVER_RADIUS) * MAX_PUSH;
          targetPushX = ((baseX - mouse.x) / dist) * strength;
          targetPushY = ((baseY - mouse.y) / dist) * strength;
        }
        push.x += (targetPushX - push.x) * PUSH_EASE;
        push.y += (targetPushY - push.y) * PUSH_EASE;

        const x = baseX + push.x;
        const y = baseY + push.y;

        const lineEl = teacherLineRefs.current[i];
        if (lineEl) {
          lineEl.setAttribute("x2", x.toFixed(1));
          lineEl.setAttribute("y2", y.toFixed(1));
        }
        const nodeEl = teacherNodeRefs.current[i];
        if (nodeEl) {
          nodeEl.style.transform = `translate(-50%, -50%) translate(${(x - center).toFixed(1)}px, ${(y - center).toFixed(1)}px)`;
        }
        const badgeEl = teacherBadgeRefs.current[i];
        if (badgeEl) {
          badgeEl.style.borderColor = isHover ? TEACHER_HOVER_COLOR : "rgba(255, 255, 255, 0.18)";
          badgeEl.style.boxShadow = isHover
            ? `0 10px 30px rgba(0, 0, 0, 0.5), 0 0 22px 6px ${TEACHER_HOVER_COLOR}`
            : "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 18px rgba(120, 180, 255, 0.25)";
        }
      });

      // Os ícones orbitam na direção oposta, com a mesma lógica para o próprio fio + badge — e a
      // partícula de energia que chega usa exatamente essa mesma posição atual, então ela sempre
      // parte de onde o ícone está de fato, não de um ponto de partida desatualizado. Mesmo
      // tratamento de hover/desvio dos professores acima.
      ICONS.forEach((_, i) => {
        const angleDeg = angleFor(i, ICONS.length) + iconRotation;
        const rad = (angleDeg * Math.PI) / 180;
        const baseX = center + outerRadius * Math.cos(rad);
        const baseY = center + outerRadius * Math.sin(rad);
        const color = ICON_COLORS[i % ICON_COLORS.length];

        const centerPoint = { x: center, y: center };
        const basePoint = { x: baseX, y: baseY };
        const segDist = mouse ? distanceToSegment(mouse, centerPoint, basePoint) : Infinity;
        const isHover = segDist < HOVER_RADIUS;

        const push = iconPushRef.current[i];
        let targetPushX = 0;
        let targetPushY = 0;
        if (isHover) {
          const dist = Math.max(Math.hypot(baseX - mouse.x, baseY - mouse.y), 1);
          const strength = (1 - segDist / HOVER_RADIUS) * MAX_PUSH;
          targetPushX = ((baseX - mouse.x) / dist) * strength;
          targetPushY = ((baseY - mouse.y) / dist) * strength;
        }
        push.x += (targetPushX - push.x) * PUSH_EASE;
        push.y += (targetPushY - push.y) * PUSH_EASE;

        const x = baseX + push.x;
        const y = baseY + push.y;

        const lineEl = iconLineRefs.current[i];
        if (lineEl) {
          lineEl.setAttribute("x2", x.toFixed(1));
          lineEl.setAttribute("y2", y.toFixed(1));
          lineEl.setAttribute("stroke", isHover ? color : "rgba(150,190,255,0.16)");
        }
        const nodeEl = iconNodeRefs.current[i];
        if (nodeEl) {
          nodeEl.style.transform = `translate(-50%, -50%) translate(${(x - center).toFixed(1)}px, ${(y - center).toFixed(1)}px)`;
        }
        const badgeEl = iconBadgeRefs.current[i];
        if (badgeEl) {
          badgeEl.style.borderColor = isHover ? color : "rgba(255, 255, 255, 0.08)";
          badgeEl.style.boxShadow = isHover ? `0 8px 22px rgba(0, 0, 0, 0.45), 0 0 20px 6px ${color}` : "0 8px 22px rgba(0, 0, 0, 0.45)";
        }

        // A energia de cada ícone viaja em linha reta até o cérebro pela sua própria linha direta,
        // mas apenas durante sua própria janela de liberação (ver RELEASE_OFFSETS) — fora dessa
        // janela ela fica parada e invisível, esperando a próxima rajada chegar.
        const el = inboundParticleRefs.current[i];
        const localT = ((t - RELEASE_OFFSETS[i]) % CYCLE_LENGTH + CYCLE_LENGTH) % CYCLE_LENGTH;
        const traveling = localT < INBOUND_DURATION;
        if (!traveling) {
          if (el) el.style.opacity = "0";
          return;
        }

        const progress = localT / INBOUND_DURATION; // 0 -> 1 ao longo do voo
        const travel = 1 - progress; // 1 -> 0: começa no ícone, chega ao cérebro
        if (travel < 0.12) arrivalEnergy = Math.max(arrivalEnergy, 1 - travel / 0.12);
        if (!el) return;
        const px = center + (x - center) * travel;
        const py = center + (y - center) * travel;
        // Definido diretamente como atributos SVG (não um transform CSS em um elemento HTML
        // separado) — mesmo espaço de coordenadas da <line> que deveria estar seguindo, então é
        // fisicamente impossível ela sair dessa linha.
        el.setAttribute("cx", px.toFixed(1));
        el.setAttribute("cy", py.toFixed(1));
        // Aparece suavemente assim que é liberada e desaparece no trecho final da aproximação,
        // bem quando chega ao núcleo — passa a impressão de ser absorvida, não de simplesmente parar.
        let opacity = 1;
        if (progress < 0.08) opacity = progress / 0.08;
        else if (progress > 0.85) opacity = 1 - (progress - 0.85) / 0.15;
        el.style.opacity = opacity.toFixed(2);
      });

      // O brilho do núcleo do cérebro aumenta conforme a energia chega e diminui suavemente
      // caso contrário — decair em vez de cortar de uma vez mantém a sensação de pulso, não de piscar.
      coreEnergyRef.current = Math.max(arrivalEnergy, coreEnergyRef.current * CORE_DECAY);
      if (coreRef.current) {
        const e = coreEnergyRef.current;
        coreRef.current.style.transform = `translate(-50%, -50%) scale(${(1 + e * 0.9).toFixed(3)})`;
        coreRef.current.style.opacity = (0.55 + e * 0.45).toFixed(3);
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [visible, center, innerRadius, outerRadius]);

  return (
    <Wrapper id="professores" ref={wrapperRef}>
      <Inner>
        <LeftCol>
          <Title>Mentores com a melhor didática, te auxiliando e nivelando do básico ao avançado</Title>
          <Description>
            Esses professores ajudam e estão ajudando milhares de pessoas a ingressar no mercado de tecnologia.
          </Description>
          <Checklist>
            {CHECKLIST.map((text) => (
              <ChecklistItem key={text}>
                <CheckIcon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </CheckIcon>
                {text}
              </ChecklistItem>
            ))}
          </Checklist>
          <ClosingLine>Realmente profissionais que migraram de área e pode te auxiliar nessa sua fase</ClosingLine>
        </LeftCol>

        <RightCol>
          <Stage ref={stageRef} data-visible={visible} onMouseMove={handleStageMouseMove} onMouseLeave={handleStageMouseLeave}>
            <OrbitRing $size={38} />
            <OrbitRing $size={66} />

            <LinesSvg viewBox={`0 0 ${size} ${size}`}>
              {innerPositions.map((pos, i) => (
                <line
                  key={`inner-line-${i}`}
                  ref={(el) => (teacherLineRefs.current[i] = el)}
                  x1={center}
                  y1={center}
                  x2={pos.x}
                  y2={pos.y}
                  stroke="rgba(150,190,255,0.28)"
                  strokeWidth="1"
                />
              ))}
              {/* Cada ícone tem sua própria linha reta e direta até o cérebro — igual aos
                  professores acima, sem passar por mais ninguém. */}
              {outerPositions.map((pos, i) => (
                <line
                  key={`outer-line-${i}`}
                  ref={(el) => (iconLineRefs.current[i] = el)}
                  x1={center}
                  y1={center}
                  x2={pos.x}
                  y2={pos.y}
                  stroke="rgba(150,190,255,0.16)"
                  strokeWidth="1"
                />
              ))}

              {/* Usa exatamente o mesmo espaço de coordenadas das linhas acima, em vez de um
                  elemento HTML posicionado separadamente que poderia sair de sincronia com elas. */}
              {outerPositions.map((_, i) => {
                const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
                return (
                  <EnergyDot
                    key={`inbound-${i}`}
                    ref={(el) => (inboundParticleRefs.current[i] = el)}
                    r="4"
                    fill={color}
                    style={{ color }}
                    $delay={(i % PARTICLE_COLORS.length) * 0.15}
                  />
                );
              })}
            </LinesSvg>

            <BrainImg src={BRAIN_SRC} alt="" />
            <BrainCore ref={coreRef} />

            {TEACHERS.map((teacher, i) => (
              <Node
                key={teacher.id}
                ref={(el) => (teacherNodeRefs.current[i] = el)}
                style={{ transform: `translate(-50%, -50%) translate(${innerPositions[i].x - center}px, ${innerPositions[i].y - center}px)` }}
              >
                <TeacherBadge ref={(el) => (teacherBadgeRefs.current[i] = el)}>
                  <img src={teacher.img} alt="" style={teacher.objectPosition ? { objectPosition: teacher.objectPosition } : undefined} />
                </TeacherBadge>
              </Node>
            ))}

            {ICONS.map((icon, i) => (
              <Node
                key={icon.id}
                ref={(el) => (iconNodeRefs.current[i] = el)}
                style={{ transform: `translate(-50%, -50%) translate(${outerPositions[i].x - center}px, ${outerPositions[i].y - center}px)` }}
              >
                <IconBadge ref={(el) => (iconBadgeRefs.current[i] = el)}>
                  <img src={icon.src} alt="" />
                </IconBadge>
              </Node>
            ))}
          </Stage>
        </RightCol>
      </Inner>
    </Wrapper>
  );
}
