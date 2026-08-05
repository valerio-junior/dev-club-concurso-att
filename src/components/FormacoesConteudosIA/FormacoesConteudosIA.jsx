import { useCallback, useRef } from "react";
import { useStickyScrub } from "../../hooks/useStickyScrub";
import { Formacoes } from "../Formacoes/Formacoes";
import { ConteudosIA } from "../ConteudosIA/ConteudosIA";
import { Stage, Layer } from "./FormacoesConteudosIA.styles";

// Distância total de scroll (em alturas de viewport) para toda a sequência combinada — as duas
// seções compartilham esse único pin em vez de cada uma reservar o seu próprio.
const COMBINED_DISTANCE = 7;

// A própria esteira do Formações termina (último card totalmente saído, mesma matemática de
// sempre) nessa fração do progresso combinado.
const FORMACOES_END = 0.6;
// A camada do Formações desaparece com fade ao longo dessa janela, revelando o ConteudosIA (já
// montado por baixo) em vez das duas simplesmente se revezarem uma após a outra.
const FADE_START = 0.48;
const FADE_END = 0.62;
// A própria revelação do ConteudosIA (texto, ícones, e eventualmente o vídeo) só começa depois
// que o Formações termina de desaparecer com fade (corresponde a FADE_END) — começar antes fazia o
// título ficar visível enquanto um card do Formações ainda estava sólido na tela, o que dava a
// sensação de um choque visual.
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
