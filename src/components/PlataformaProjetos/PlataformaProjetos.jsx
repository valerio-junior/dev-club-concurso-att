import { useCallback, useRef } from "react";
import { useStickyScrub } from "../../hooks/useStickyScrub";
import { Plataforma } from "../Plataforma/Plataforma";
import { Projetos } from "../Projetos/Projetos";
import { Stage, Layer, ClosingFrame } from "./PlataformaProjetos.styles";

// Plataforma keeps its own exact scroll timing (unchanged from before) — it just now gets that
// same absolute scroll length (4.4 viewport heights) carved out of a bigger combined distance,
// with a dedicated phase appended afterward for the window-close exit into Projetos.
const PLATAFORMA_DISTANCE = 4.4;
const CLOSE_DISTANCE = 2.2;
const COMBINED_DISTANCE = PLATAFORMA_DISTANCE + CLOSE_DISTANCE;
const PLATAFORMA_SHARE = PLATAFORMA_DISTANCE / COMBINED_DISTANCE;

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

  const render = useCallback((progress) => {
    const plataformaProgress = clamp01(progress / PLATAFORMA_SHARE);
    plataformaRef.current?.render(plataformaProgress);

    const closeT = easeInOutCubic(clamp01((progress - PLATAFORMA_SHARE) / (1 - PLATAFORMA_SHARE)));
    if (closingFrameRef.current) {
      const inset = (closeT * MAX_INSET).toFixed(2);
      const radius = (closeT * MAX_RADIUS).toFixed(1);
      closingFrameRef.current.style.clipPath = `inset(${inset}% ${inset}% ${inset}% ${inset}% round ${radius}px)`;
    }
  }, []);

  useStickyScrub(containerRef, { distance: COMBINED_DISTANCE, onUpdate: render });

  return (
    <Stage ref={containerRef}>
      <Layer style={{ zIndex: 1 }}>
        <Projetos />
      </Layer>
      <ClosingFrame ref={closingFrameRef} style={{ zIndex: 2 }}>
        <Plataforma ref={plataformaRef} />
      </ClosingFrame>
    </Stage>
  );
}
