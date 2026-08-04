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

// One brand-ish accent color per icon, same order as ICONS — used for its hover border/glow.
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
];

// Teachers don't have a "brand color" of their own, so they all share this one consistent
// accent (the site's usual blue) for their hover border/glow.
const TEACHER_HOVER_COLOR = "#60A5FA";

// Hover/repel reacts within this distance (px) of either the badge itself or its wire — no
// need to land exactly on it. Repulsion pushes up to this many px away from the cursor,
// strongest right up close and fading out toward the edge of that radius.
const HOVER_RADIUS = 70;
const MAX_PUSH = 26;
// How quickly the push (and its release back to resting position) eases toward its target
// each frame — higher reacts faster, lower feels floatier.
const PUSH_EASE = 0.18;

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

// Continuous ambient orbiting — icons drift counter-clockwise ("left"), teacher photos drift
// clockwise ("right"), opposite directions, both slow enough to read as ambient rather than
// distracting. Degrees per second.
const ICON_ROTATION_SPEED = 5;
const TEACHER_ROTATION_SPEED = -5;

function angleFor(i, count) {
  return (i / count) * 360 - 90;
}

// Shortest distance from point `p` to the segment a->b — used so hovering anywhere along a
// wire counts as being "near" its badge, not just the badge itself.
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

  // Drives every energy particle (and the brain's core glow) each frame — plain
  // requestAnimationFrame (not scroll-linked), matching how the rest of this section behaves
  // like a living scene instead of a scrubbed sequence. Only runs once actually visible.
  useEffect(() => {
    if (!visible) return undefined;
    let raf;

    const animate = (time) => {
      const t = time / 1000;
      let arrivalEnergy = 0;

      const iconRotation = (t * ICON_ROTATION_SPEED) % 360;
      const teacherRotation = (t * TEACHER_ROTATION_SPEED) % 360;

      const mouse = mouseRef.current;

      // Teachers continuously orbit — each frame recomputes its live angle, then updates its
      // own wire (line endpoint) and badge position to match, so the wire always stays
      // attached to the photo instead of the photo drifting away from it. Getting the cursor
      // near either one (badge or wire) makes it dodge away and light up.
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

      // Icons orbit the opposite direction, same idea for their own wire + badge — and their
      // inbound energy particle rides this exact same live position, so it's always departing
      // from wherever the icon currently is, not a stale starting point. Same hover/dodge
      // treatment as the teachers above.
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

        // Every icon's own energy travels straight to the brain along its own direct line,
        // but only during its own release window (see RELEASE_OFFSETS) — outside of that
        // window it's idle and invisible, waiting for its next burst to come around.
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
        const px = center + (x - center) * travel;
        const py = center + (y - center) * travel;
        // Set directly as SVG attributes (not a CSS transform on a separate HTML element) —
        // same coordinate space as the <line> it's supposed to be riding, so it's physically
        // impossible for it to drift off that line.
        el.setAttribute("cx", px.toFixed(1));
        el.setAttribute("cy", py.toFixed(1));
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
  }, [visible, center, innerRadius, outerRadius]);

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
              {/* Every icon gets its own straight, direct line to the brain — same as the
                  teachers above, no routing through anyone else. */}
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
                ref={(el) => (teacherNodeRefs.current[i] = el)}
                style={{ transform: `translate(-50%, -50%) translate(${innerPositions[i].x - center}px, ${innerPositions[i].y - center}px)` }}
              >
                <TeacherBadge ref={(el) => (teacherBadgeRefs.current[i] = el)}>
                  <img src={teacher.img} alt="" />
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
