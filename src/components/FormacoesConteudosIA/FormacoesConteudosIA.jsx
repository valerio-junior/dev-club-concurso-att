import { useCallback, useRef } from "react";
import { useStickyScrub } from "../../hooks/useStickyScrub";
import { Formacoes } from "../Formacoes/Formacoes";
import { ConteudosIA } from "../ConteudosIA/ConteudosIA";
import { Stage, Layer } from "./FormacoesConteudosIA.styles";

// Total scroll distance (in viewport heights) for the whole combined sequence — both
// sections share this single pin instead of each reserving their own.
const COMBINED_DISTANCE = 7;

// Formações' own belt finishes (last card fully exited, same math it always had) at this
// fraction of the combined progress.
const FORMACOES_END = 0.6;
// Formações' layer fades out over this window, uncovering ConteudosIA (already mounted
// underneath) instead of the two simply handing off back-to-back.
const FADE_START = 0.48;
const FADE_END = 0.62;
// ConteudosIA's own reveal (text, icons, eventually video) only starts once Formações has
// fully faded out (matches FADE_END) — starting it earlier had the title becoming visible
// while a Formações card was still solidly on screen, reading as a visual clash.
const IA_START = FADE_END;

const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function FormacoesConteudosIA() {
  const containerRef = useRef(null);
  const formacoesLayerRef = useRef(null);
  const formacoesRef = useRef(null);
  const iaRef = useRef(null);

  const render = useCallback((progress) => {
    const formacoesProgress = clamp01(progress / FORMACOES_END);
    formacoesRef.current?.render(formacoesProgress);

    const iaProgress = clamp01((progress - IA_START) / (1 - IA_START));
    iaRef.current?.render(iaProgress);

    if (formacoesLayerRef.current) {
      const fadeT = clamp01((progress - FADE_START) / (FADE_END - FADE_START));
      formacoesLayerRef.current.style.opacity = (1 - fadeT).toFixed(3);
    }
  }, []);

  useStickyScrub(containerRef, { distance: COMBINED_DISTANCE, onUpdate: render });

  return (
    <Stage ref={containerRef}>
      <Layer ref={formacoesLayerRef} style={{ zIndex: 2 }}>
        <Formacoes ref={formacoesRef} />
      </Layer>
      <Layer style={{ zIndex: 1 }}>
        <ConteudosIA ref={iaRef} />
      </Layer>
    </Stage>
  );
}
