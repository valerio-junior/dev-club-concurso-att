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
  Node,
  TeacherBadge,
  IconBadge,
  Particle,
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

// Continuous inward flow (teacher -> brain), one loop per line, each offset by its own phase
// so they read as an ongoing stream rather than a synchronized pulse.
const INBOUND_DURATION = 2.6;
// The brain's own outward pulses run on every line (teachers and icons alike) but on a
// sparser, gapped cycle — it "answers" less often than it receives, which is what reads as
// gathering energy before radiating it back out.
const OUTBOUND_DURATION = 3.4;
const OUTBOUND_GAP = 2.2;

function angleFor(i, count) {
  return (i / count) * 360 - 90;
}

export function Professores() {
  const wrapperRef = useRef(null);
  const stageRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [size, setSize] = useState(600);

  const inboundParticleRefs = useRef([]);
  const outboundParticleRefs = useRef([]);

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

  const allPositions = useMemo(() => [...innerPositions, ...outerPositions], [innerPositions, outerPositions]);

  // Drives every energy particle each frame — plain requestAnimationFrame (not scroll-linked),
  // matching how the rest of this section behaves like a living scene instead of a scrubbed
  // sequence. Only runs once the section is actually visible.
  useEffect(() => {
    if (!visible) return undefined;
    let raf;

    const animate = (time) => {
      const t = time / 1000;

      innerPositions.forEach((pos, i) => {
        const el = inboundParticleRefs.current[i];
        if (!el) return;
        const phase = (t / INBOUND_DURATION + i / innerPositions.length) % 1;
        const travel = 1 - phase; // 1 -> 0: starts at the teacher's photo, arrives at the brain
        const x = center + (pos.x - center) * travel;
        const y = center + (pos.y - center) * travel;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        el.style.opacity = phase > 0.94 ? (1 - (phase - 0.94) / 0.06).toFixed(2) : "1";
      });

      const cycle = OUTBOUND_DURATION + OUTBOUND_GAP;
      allPositions.forEach((pos, i) => {
        const el = outboundParticleRefs.current[i];
        if (!el) return;
        const localT = (t / cycle + i / allPositions.length) % 1;
        const activeFraction = OUTBOUND_DURATION / cycle;
        if (localT >= activeFraction) {
          el.style.opacity = "0";
          return;
        }
        const travel = localT / activeFraction; // 0 -> 1: leaves the brain, arrives at the node
        const x = center + (pos.x - center) * travel;
        const y = center + (pos.y - center) * travel;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        el.style.opacity = travel < 0.08 ? (travel / 0.08).toFixed(2) : "1";
      });

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [visible, innerPositions, allPositions, center]);

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
              {outerPositions.map((pos, i) => (
                <line key={`outer-line-${i}`} x1={center} y1={center} x2={pos.x} y2={pos.y} stroke="rgba(150,190,255,0.16)" strokeWidth="1" />
              ))}
            </LinesSvg>

            {innerPositions.map((_, i) => (
              <Particle key={`inbound-${i}`} ref={(el) => (inboundParticleRefs.current[i] = el)} />
            ))}
            {allPositions.map((_, i) => (
              <Particle key={`outbound-${i}`} ref={(el) => (outboundParticleRefs.current[i] = el)} style={{ background: "#8fd3ff" }} />
            ))}

            <BrainImg src={BRAIN_SRC} alt="" />

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
