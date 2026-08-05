import { useCallback, useRef } from "react";
import { useStickyScrub } from "../../hooks/useStickyScrub";
import { Plataforma } from "../Plataforma/Plataforma";
import { Projetos } from "../Projetos/Projetos";
import { Stage, Layer, ClosingFrame } from "./PlataformaProjetos.styles";

// Plataforma mantém seu próprio tempo de scroll exato (sem mudanças em relação a antes) — só que agora esse
// mesmo comprimento de scroll absoluto é reservado dentro de uma distância combinada maior, seguido pela
// fase de fechamento da janela, seguida pela própria sequência de título + anel giratório do Projetos.
const PLATAFORMA_DISTANCE = 4.4;
const CLOSE_DISTANCE = 2.2;
// Aumentado de 4 para 13 para dar ao caminho de entrada compartilhado em "cobra" dos projetos (ver Projetos.jsx)
// espaço de scroll suficiente para parecer lento e fluido em vez de apressado.
const PROJETOS_DISTANCE = 13;
const COMBINED_DISTANCE = PLATAFORMA_DISTANCE + CLOSE_DISTANCE + PROJETOS_DISTANCE;

const PLATAFORMA_END = PLATAFORMA_DISTANCE / COMBINED_DISTANCE;
const CLOSE_END = (PLATAFORMA_DISTANCE + CLOSE_DISTANCE) / COMBINED_DISTANCE;

// As porcentagens de inset() são relativas à própria caixa do frame, então 50% em cada lado é o ponto
// em que topo+base (e esquerda+direita) se sobrepõem completamente — a janela visível colapsa a nada
// exatamente no centro, com as quatro bordas convergindo juntas em vez de apenas encolher a escala.
const MAX_INSET = 50;
// Os cantos da janela arredondam conforme ela encolhe, ecoando a linguagem de cards do site (painéis
// arredondados em outras partes) em vez de fechar como um retângulo reto.
const MAX_RADIUS = 56;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
// Acelera ao entrar no fechamento e desacelera suavemente até o ponto final — passa a sensação de um
// movimento deliberado e com peso que o usuário consegue acompanhar durante o scroll, em vez de um
// encolhimento linear/mecânico.
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
