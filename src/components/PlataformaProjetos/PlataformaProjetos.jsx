import { useCallback, useRef } from "react";
import { useStickyScrub } from "../../hooks/useStickyScrub";
import { Plataforma } from "../Plataforma/Plataforma";
import { Projetos } from "../Projetos/Projetos";
import { Stage, Layer, ClosingFrame } from "./PlataformaProjetos.styles";

// Plataforma keeps its own exact scroll timing (unchanged from before) — it just now gets that
// same absolute scroll length carved out of a bigger combined distance, followed by the
// window-close phase, followed by Projetos' own title + spinning-ring sequence.
const PLATAFORMA_DISTANCE = 4.4;
const CLOSE_DISTANCE = 2.2;
// Grew from 4 to 13 to give the projects' shared "snake" entrance path (see Projetos.jsx) enough
// scroll room to read as slow and fluid instead of rushed.
const PROJETOS_DISTANCE = 13;
const COMBINED_DISTANCE = PLATAFORMA_DISTANCE + CLOSE_DISTANCE + PROJETOS_DISTANCE;

const PLATAFORMA_END = PLATAFORMA_DISTANCE / COMBINED_DISTANCE;
const CLOSE_END = (PLATAFORMA_DISTANCE + CLOSE_DISTANCE) / COMBINED_DISTANCE;

// inset() percentages are relative to the frame's own box, so 50% on every side is the point
// where top+bottom (and left+right) fully overlap — the visible window collapses to nothing
// exactly at the center, from all four edges converging together instead of just scaling down.
const MAX_INSET = 50;
// The window's corners round out as it shrinks, echoing the site's card language (rounded
// panels elsewhere) instead of closing as a hard rectangle.
const MAX_RADIUS = 56;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
// Accelerates into the close and eases into its final point — reads as a deliberate, weighted
// motion the user can track while scrolling, rather than a linear/mechanical shrink.
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function PlataformaProjetos() {
  const containerRef = useRef(null);
  const plataformaRef = useRef(null);
  const closingFrameRef = useRef(null);
  const projetosRef = useRef(null);

  const render = useCallback((progress) => {
    const plataformaProgress = clamp01(progress / PLATAFORMA_END);
    plataformaRef.current?.render(plataformaProgress);

    const closeT = easeInOutCubic(clamp01((progress - PLATAFORMA_END) / (CLOSE_END - PLATAFORMA_END)));
    if (closingFrameRef.current) {
      const inset = (closeT * MAX_INSET).toFixed(2);
      const radius = (closeT * MAX_RADIUS).toFixed(1);
      closingFrameRef.current.style.clipPath = `inset(${inset}% ${inset}% ${inset}% ${inset}% round ${radius}px)`;
    }

    const projetosProgress = clamp01((progress - CLOSE_END) / (1 - CLOSE_END));
    projetosRef.current?.render(projetosProgress);
  }, []);

  useStickyScrub(containerRef, { distance: COMBINED_DISTANCE, onUpdate: render });

  return (
    <Stage id="projetos" ref={containerRef}>
      <Layer style={{ zIndex: 1 }}>
        <Projetos ref={projetosRef} />
      </Layer>
      <ClosingFrame ref={closingFrameRef} style={{ zIndex: 2 }}>
        <Plataforma ref={plataformaRef} />
      </ClosingFrame>
    </Stage>
  );
}
