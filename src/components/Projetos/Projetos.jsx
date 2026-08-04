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

// Title depth-emerges first, then the ring starts forming (one project locking in at a time),
// and once all six are in place it keeps spinning for one full extra lap before the section
// lets go of scroll.
const TITLE_WINDOW = [0, 0.1];
const RING_START = 0.1;
const FORM_END = 0.65;
const SPIN_END = 1;

// Six evenly spaced stops starting at the left (180°) and sweeping over the top toward the
// right, then around the bottom back to the start.
const BASE_ANGLES = PROJECTS.map((_, i) => 180 - i * (360 / PROJECTS.length));

const RING_PADDING = 6; // px of breathing room between the ring's images and the stage's edge

// The journey each project image takes before joining the ring — offsets (vw, vh) from the
// ring's own center, walked in order. The final leg isn't listed here: it's whatever the ring
// formula currently targets for that image (see `render`), so the path always hands off cleanly
// into the spinning circle instead of aiming at a fixed point that rotation would drift past.
const PATH_WAYPOINTS = [
  { dx: -55, dy: 18 }, // enters off-screen, from the left
  { dx: 36, dy: -30 }, // risen, curving over to the right side
  { dx: 36, dy: 34 }, // descended, still on the right, near the bottom
  { dx: 18, dy: 34 }, // shifted a bit left
  { dx: 18, dy: 16 }, // risen a bit again
  { dx: 3, dy: 6 }, // back left, near the center — about to join the ring
];

// All six images walk the exact same path, at the exact same speed, along one shared timeline —
// each one just lags behind the previous by this fraction of a full traversal, so they read as
// one connected chain moving together (like a train, or a little snake) instead of six separate
// solo trips.
const SNAKE_GAP = 0.03;

const SCALE_START = 0.5;
const BLUR_START_PX = 14;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Progress arrives imperatively from PlataformaProjetos (the shared pinned Stage hosting this
// section, revealed underneath Plataforma's closing window) instead of this section pinning
// itself — see that component for the combined scroll choreography.
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

    // Constant (linear, not eased) angular speed — the ring turns steadily the whole time, both
    // while projects are still filling in and during the extra lap once the ring is complete.
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
    // The shared timeline P runs from 0 (leader starts) to 1 + (n-1)*SNAKE_GAP (tail finishes),
    // scaled so that final value lands exactly at FORM_END — every image travels the same
    // distance in the same amount of scroll, just time-shifted from the one ahead of it.
    const formT = clamp01((progress - RING_START) / formWindow);
    const sharedP = formT * (1 + (n - 1) * SNAKE_GAP);
    const radius = radiusRef.current;
    const vw = window.innerWidth / 100;
    const vh = window.innerHeight / 100;

    itemRefs.current.forEach((el, i) => {
      if (!el) return;

      // Each image rides the same rotating frame as the others (its base angle plus the
      // shared rotation) — it never spins in place itself, only its position sweeps around
      // the ring, like cabins on a Ferris wheel staying upright.
      const angleDeg = BASE_ANGLES[i] + rotationDeg;
      const rad = (angleDeg * Math.PI) / 180;
      const liveTarget = { x: radius * Math.cos(rad), y: radius * Math.sin(rad) };

      const t = clamp01(sharedP - i * SNAKE_GAP);

      // Walk the fixed waypoints, then hand off to the ring's own live target as the final leg.
      // Parametrized by actual arc length (not equal time per segment) and interpolated
      // linearly within each one — constant speed across the whole route, so every image keeps
      // exactly the same gap to the one ahead of it instead of bunching up on short segments and
      // spreading out on long ones.
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

      // Opacity/scale ramp in quickly right as the image starts its journey, then hold at full
      // strength for the rest of the flight — no need to linger half-transparent mid-path.
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
