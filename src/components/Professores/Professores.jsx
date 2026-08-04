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
  "Recrutadora de auxiliando frente a frente",
  "Profissional e perita em Inteligência Artificial",
  "Profissional fullstack te auxiliando da construção ao deploy",
];

// Inner ring — closer to the brain, one badge per teacher.
const TEACHERS = [
  { id: "rodolfo", img: "/assets/professores/rodolfo-ceo.jpg" },
  { id: "fernanda", img: "/assets/professores/fernanda-mentora.jpg" },
  { id: "henrique", img: "/assets/professores/henrique-mentor.jpg" },
  { id: "juliana", img: "/assets/professores/juliana-recruter.jpg" },
  { id: "mateus", img: "/assets/professores/mateus-ia.jpg" },
];

// Outer ring — AI tools mixed with core tech, further from the brain.
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
].map((src, i) => ({ id: `icon-${i}`, src }));

const INNER_RADIUS_RATIO = 0.27;
const OUTER_RADIUS_RATIO = 0.47;

// Every node — teacher or icon — connects to the brain with its own straight, direct line
// (no routing through anyone else), matching the reference: a clean radial web, not a tangle.
// Only the icon wires carry energy particles, though — a brisk flight once released.
const INBOUND_DURATION = 2.4;

// Icons release in small staggered bursts (2, then 1, then 1, then 2, ...) instead of an
// evenly-spaced continuous stream, so arrivals read as distinct little waves rather than
// everything moving constantly at once. Must sum to ICONS.length (13).
const RELEASE_GROUPS = [2, 1, 1, 2, 1, 2, 1, 1, 2];
const GROUP_GAP = 0.6; // seconds between the start of each burst
const RELEASE_OFFSETS = RELEASE_GROUPS.flatMap((count, groupIndex) => Array(count).fill(groupIndex * GROUP_GAP));
const CYCLE_LENGTH = RELEASE_GROUPS.length * GROUP_GAP;

// A handful of varied "energy" colors cycled across the wires instead of one flat color, so
// the whole network reads as richer/more alive.
const PARTICLE_COLORS = ["#7ecbff", "#ffd166", "#ff9f5a", "#a78bfa", "#6ee7b7", "#ff8fb1"];

// How much the brain's core should still be lit up from an arrival, per frame it's not
// actively refreshed — this is what turns individual arrivals into a smooth, decaying pulse
// rather than an on/off flicker.
const CORE_DECAY = 0.95;

function angleFor(i, count) {
  return (i / count) * 360 - 90;
}

export function Professores() {
  const wrapperRef = useRef(null);
  const stageRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [size, setSize] = useState(600);

  const inboundParticleRefs = useRef([]);
  const coreRef = useRef(null);
  const coreEnergyRef = useRef(0);

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

  // Drives every energy particle (and the brain's core glow) each frame — plain
  // requestAnimationFrame (not scroll-linked), matching how the rest of this section behaves
  // like a living scene instead of a scrubbed sequence. Only runs once actually visible.
  useEffect(() => {
    if (!visible) return undefined;
    let raf;

    const animate = (time) => {
      const t = time / 1000;
      let arrivalEnergy = 0;

      // Every icon's own energy travels straight to the brain along its own direct line, but
      // only during its own release window (see RELEASE_OFFSETS) — outside of that window it's
      // just idle and invisible, waiting for its next burst to come around.
      outerPositions.forEach((pos, i) => {
        const el = inboundParticleRefs.current[i];
        const localT = ((t - RELEASE_OFFSETS[i]) % CYCLE_LENGTH + CYCLE_LENGTH) % CYCLE_LENGTH;
        const traveling = localT < INBOUND_DURATION;
        if (!traveling) {
          if (el) el.style.opacity = "0";
          return;
        }

        const progress = localT / INBOUND_DURATION; // 0 -> 1 across the flight
        const travel = 1 - progress; // 1 -> 0: starts at the icon, arrives at the brain
        if (travel < 0.12) arrivalEnergy = Math.max(arrivalEnergy, 1 - travel / 0.12);
        if (!el) return;
        const x = center + (pos.x - center) * travel;
        const y = center + (pos.y - center) * travel;
        // Set directly as SVG attributes (not a CSS transform on a separate HTML element) —
        // same coordinate space as the <line> it's supposed to be riding, so it's physically
        // impossible for it to drift off that line.
        el.setAttribute("cx", x.toFixed(1));
        el.setAttribute("cy", y.toFixed(1));
        // Fades in right as it's released and fades out over the final stretch of the
        // approach, right as it reaches the core — reads as being absorbed, not just stopping.
        let opacity = 1;
        if (progress < 0.08) opacity = progress / 0.08;
        else if (progress > 0.85) opacity = 1 - (progress - 0.85) / 0.15;
        el.style.opacity = opacity.toFixed(2);
      });

      // The brain's core glow brightens as energy arrives and eases back down otherwise —
      // decaying rather than snapping keeps it reading as a pulse, not a flicker.
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
  }, [visible, outerPositions, center]);

  return (
    <Wrapper ref={wrapperRef}>
      <Inner>
        <LeftCol>
          <Title>Mentores com a melhor didática e te auxiliando e nivelando do básico ao avançado</Title>
          <Description>
            Esses professores ajudam e vêm ajudando milhares de pessoas a ingressar no mercado de tecnologia.
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
          <Stage ref={stageRef} data-visible={visible}>
            <OrbitRing $size={INNER_RADIUS_RATIO * 2 * 100 + 6} />
            <OrbitRing $size={OUTER_RADIUS_RATIO * 2 * 100 + 4} />

            <LinesSvg viewBox={`0 0 ${size} ${size}`}>
              {innerPositions.map((pos, i) => (
                <line key={`inner-line-${i}`} x1={center} y1={center} x2={pos.x} y2={pos.y} stroke="rgba(150,190,255,0.28)" strokeWidth="1" />
              ))}
              {/* Every icon gets its own straight, direct line to the brain — same as the
                  teachers above, no routing through anyone else. */}
              {outerPositions.map((pos, i) => (
                <line key={`outer-line-${i}`} x1={center} y1={center} x2={pos.x} y2={pos.y} stroke="rgba(150,190,255,0.16)" strokeWidth="1" />
              ))}

              {/* Riding the exact same coordinate space as the lines above, instead of a
                  separately-positioned HTML element that could drift out of sync with them. */}
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
                style={{ transform: `translate(-50%, -50%) translate(${innerPositions[i].x - center}px, ${innerPositions[i].y - center}px)` }}
              >
                <TeacherBadge>
                  <img src={teacher.img} alt="" />
                </TeacherBadge>
              </Node>
            ))}

            {ICONS.map((icon, i) => (
              <Node
                key={icon.id}
                style={{ transform: `translate(-50%, -50%) translate(${outerPositions[i].x - center}px, ${outerPositions[i].y - center}px)` }}
              >
                <IconBadge>
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
