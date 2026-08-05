import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useVideoFrames } from "../../hooks/useVideoFrames";
import { drawImageCover } from "../../lib/canvas";
import {
  Wrapper,
  Inner,
  LeftCol,
  DescriptionStack,
  Description,
  DescriptionOverlay,
  IconRow,
  IconWrap,
  IconImg,
  Shine,
  RightCol,
  VideoStage,
  VideoCanvas,
  Vignette,
} from "./ConteudosIA.styles";

const VIDEO_SRC = "/assets/generated/ia-rodolfo.mp4";
const FRAME_COUNT = 60;
// Os primeiros segundos do clipe original mostram ele sorrindo em um fundo cinza chapado
// antes da transformação humano->robô realmente começar — pulados deslocando de onde no clipe
// bruto começamos a amostrar, em vez de recortar o próprio arquivo.
const SKIP_SECONDS = 2.5;

const ICONS = [
  { src: "/assets/logos/ai/gemini.svg", alt: "Gemini", background: "linear-gradient(135deg, #4C8DF6, #9B72CB)" },
  { src: "/assets/logos/ai/chatgpt.svg", alt: "ChatGPT" },
  { src: "/assets/logos/ai/claude.svg", alt: "Claude", background: "linear-gradient(135deg, #F0A875, #D97757)" },
  { src: "/assets/logos/ai/copilot.svg", alt: "Copilot" },
  { src: "/assets/logos/ai/meta-ai.svg", alt: "Meta AI", background: "linear-gradient(135deg, #4E7FE1, #2E5FD9)" },
];
// A varredura de brilho de cada ícone tem seu próprio espaço no loop (o ícone i começa em
// i * SHINE_CYCLE / count), então só um ícone está no meio da varredura por vez, em sequência da
// esquerda para a direita.
const SHINE_CYCLE = 6;

const TEXT_WINDOW = 0.15;
const ICONS_START = 0.13;
const ICONS_END = 0.32;
const ICONS_REVEAL_FRACTION = 0.55;
// Janela de fade-in larga (era um 0.08 rápido demais — passava a sensação de "surgir de repente"
// em vez de acompanhar o scroll), então o estágio do vídeo aparece gradualmente enquanto o usuário
// rola, se sobrepondo ao final da revelação dos ícones em vez de só começar quando eles terminam
// completamente.
const VIDEO_FADE_START = 0.25;
const VIDEO_FADE_END = 0.55;
const VIDEO_SCRUB_START = 0.55;
// A primeira descrição faz crossfade para a segunda durante essa janela, sincronizada com a
// transformação do Rodolfo já em andamento (VIDEO_SCRUB_START) — a fileira de ícones não é afetada
// por isso e permanece visível o tempo todo.
const DESC_SWAP_START = 0.6;
const DESC_SWAP_END = 0.82;
const FOCUS_Y = 0.38;
// O fundo do próprio clipe regenerado agora já bate com #0d131a (corrigido na origem através de
// uma foto de referência com fundo chapado), então isso voltou a ser apenas uma rede de segurança
// leve para qualquer pequeno desvio residual, igual à versão do Hero — não está mais compensando
// uma incompatibilidade real.
const BACKGROUND_CRUSH_MIN = 0.05;
const BACKGROUND_CRUSH_MAX = 0.2;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export const ConteudosIA = forwardRef(function ConteudosIA(_props, ref) {
  const containerRef = useRef(null);
  const descRef = useRef(null);
  const desc2Ref = useRef(null);
  const iconRefs = useRef([]);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const progressRef = useRef(0);

  // Só começa a decodificar/extrair o vídeo dessa seção quando ela realmente está se aproximando
  // do viewport — montar o trabalho de vídeo de todas as seções de forma antecipada no carregamento
  // da página faz todas competirem pelo decodificador de vídeo do navegador ao mesmo tempo, o que
  // foi o que causou a própria curva de movimento do Hero atrasar e pular visivelmente antes.
  const [shouldLoad, setShouldLoad] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || shouldLoad) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px 600px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLoad]);

  // A passada grosseira termina bem mais rápido que a completa de 60 frames, então dar scrub em
  // qualquer ponto da transformação sempre tem *algum* frame para desenhar enquanto a passada fina
  // continua refinando em segundo plano — sem isso, um scroll rápido pode ultrapassar a extração e
  // ficar travado em qualquer frame que tenha carregado primeiro (mesma correção do vídeo do
  // notebook do Empresas, mesma causa raiz).
  const { frames, coarseFrames, ready, coarseReady, duration } = useVideoFrames(shouldLoad ? VIDEO_SRC : null, {
    frameCount: FRAME_COUNT,
    coarseCount: 16,
  });

  const render = useCallback(
    (progress) => {
      // Primeira descrição: aparece com fade/sobe como antes, depois — assim que a transformação já
      // está bem encaminhada — desaparece com fade/deslocando para cima enquanto a segunda descrição
      // faz crossfade por cima dela.
      if (descRef.current) {
        let opacity;
        let y;
        if (progress < TEXT_WINDOW) {
          const t = clamp01(progress / TEXT_WINDOW);
          opacity = t;
          y = (1 - t) * 24;
        } else if (progress <= DESC_SWAP_START) {
          opacity = 1;
          y = 0;
        } else {
          const t = easeOutCubic(clamp01((progress - DESC_SWAP_START) / (DESC_SWAP_END - DESC_SWAP_START)));
          opacity = 1 - t;
          y = -t * 24;
        }
        descRef.current.style.opacity = opacity.toFixed(3);
        descRef.current.style.transform = `translateY(${y.toFixed(2)}px)`;
      }

      // Segunda descrição: faz crossfade por cima da primeira durante a mesma janela de troca, depois
      // fica parada — é a que continua visível quando a transformação termina.
      if (desc2Ref.current) {
        const t = easeOutCubic(clamp01((progress - DESC_SWAP_START) / (DESC_SWAP_END - DESC_SWAP_START)));
        desc2Ref.current.style.opacity = t.toFixed(3);
        desc2Ref.current.style.transform = `translateY(${((1 - t) * 24).toFixed(2)}px)`;
      }

      const iconsRange = ICONS_END - ICONS_START;
      const iconWindow = iconsRange * ICONS_REVEAL_FRACTION;
      const count = iconRefs.current.length;
      iconRefs.current.forEach((el, i) => {
        if (!el) return;
        const start = ICONS_START + (count > 1 ? (i / (count - 1)) * (iconsRange - iconWindow) : 0);
        const t = easeOutCubic(clamp01((progress - start) / iconWindow));
        el.style.opacity = t.toFixed(3);
        el.style.transform = `translateY(${((1 - t) * 18).toFixed(2)}px)`;
      });

      const fadeT = easeOutCubic(clamp01((progress - VIDEO_FADE_START) / (VIDEO_FADE_END - VIDEO_FADE_START)));
      if (stageRef.current) {
        stageRef.current.style.opacity = fadeT.toFixed(3);
        stageRef.current.style.transform = `scale(${(0.94 + 0.06 * fadeT).toFixed(3)})`;
      }

      const canvas = canvasRef.current;
      const list = ready ? frames.current : coarseFrames.current;
      if (canvas && list && list.length) {
        const skipRatio = duration > 0 ? Math.min(SKIP_SECONDS / duration, 0.9) : 0;
        const scrubT = clamp01((progress - VIDEO_SCRUB_START) / (1 - VIDEO_SCRUB_START));
        const rawRatio = skipRatio + (1 - skipRatio) * scrubT;
        const floatIndex = rawRatio * (list.length - 1);
        const indexA = Math.floor(floatIndex);
        const indexB = Math.min(indexA + 1, list.length - 1);
        const blend = floatIndex - indexA;
        const frameA = list[indexA];
        const frameB = list[indexB];

        if (frameA || frameB) {
          const ctx = canvas.getContext("2d");
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const displayWidth = canvas.clientWidth;
          const displayHeight = canvas.clientHeight;
          const targetW = Math.round(displayWidth * dpr);
          const targetH = Math.round(displayHeight * dpr);
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          if (frameA) {
            ctx.globalAlpha = 1;
            drawImageCover(ctx, frameA, canvas.width, canvas.height, { focusY: FOCUS_Y });
          }
          if (frameB && frameB !== frameA) {
            ctx.globalAlpha = frameA ? blend : 1;
            drawImageCover(ctx, frameB, canvas.width, canvas.height, { focusY: FOCUS_Y, clear: !frameA });
            ctx.globalAlpha = 1;
          }

          ctx.fillStyle = "#0d131a";
          ctx.globalAlpha = BACKGROUND_CRUSH_MIN + (BACKGROUND_CRUSH_MAX - BACKGROUND_CRUSH_MIN) * scrubT;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = 1;
        }
        // Se nenhum dos frames vizinhos terminou de extrair ainda, mantém o que o canvas já está
        // mostrando em vez de piscar em branco.
      }
    },
    [frames, coarseFrames, ready, duration]
  );

  // O progresso chega de forma imperativa a partir do FormacoesConteudosIA (o Stage fixado
  // compartilhado que hospeda essa seção junto com Formacoes) em vez dessa seção fixar a si mesma.
  const renderAtProgress = useCallback(
    (progress) => {
      progressRef.current = progress;
      render(progress);
    },
    [render]
  );

  useImperativeHandle(ref, () => ({ render: renderAtProgress }), [renderAtProgress]);

  useEffect(() => {
    if (coarseReady || ready) {
      render(progressRef.current);
    }
  }, [coarseReady, ready, render]);

  return (
    <Wrapper ref={containerRef}>
      <Inner>
        <LeftCol>
          <DescriptionStack>
            <Description ref={descRef}>
              Todas as IAs do mercado ilimitadas, sem créditos e sem limite de uso
            </Description>
            <DescriptionOverlay ref={desc2Ref}>
              E com essas ferramentas você é capaz de fazer transformações como essa
            </DescriptionOverlay>
          </DescriptionStack>
          <IconRow>
            {ICONS.map((icon, i) => (
              <IconWrap key={icon.alt} ref={(el) => (iconRefs.current[i] = el)} $background={icon.background}>
                <IconImg src={icon.src} alt={icon.alt} />
                <Shine $cycle={SHINE_CYCLE} $delay={i * (SHINE_CYCLE / ICONS.length)} />
              </IconWrap>
            ))}
          </IconRow>
        </LeftCol>

        <RightCol>
          <VideoStage ref={stageRef}>
            <VideoCanvas ref={canvasRef} />
            <Vignette />
          </VideoStage>
        </RightCol>
      </Inner>
    </Wrapper>
  );
});
