import { Fragment, useCallback, useEffect, useMemo, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { useStickyScrub } from "../../hooks/useStickyScrub";
import { useVideoFrames } from "../../hooks/useVideoFrames";
import { drawImageCover, computeMotionCurve, curveIndexAt } from "../../lib/canvas";
import { theme } from "../../styles/theme";
import { Wrapper, Inner, TextCol, Heading, Word, Char, CharacterStage, CharacterCanvas, Vignette } from "./Hero.styles";

const VIDEO_SRC = "/assets/generated/hero-rodolfo.mp4";
// Uma amostragem mais fina mantém os frames vizinhos com poses próximas, então o crossfade
// abaixo mistura imagens quase idênticas em vez de imagens visivelmente diferentes (o que passaria
// a sensação de um salto "fantasma").
const FRAME_COUNT = 60;
// Uma varredura rápida e grosseira (ver useVideoFrames) para termos uma curva de *ritmo*
// correta quase imediatamente ao carregar. Essa curva é mantida para sempre depois de calculada —
// o conjunto fino de 60 frames só adiciona mais imagens para amostrar (suavidade visual), nunca
// recalcula/substitui o ritmo em si, então não existe um momento de "transição" que possa saltar
// ou falhar.
const COARSE_COUNT = 16;
const MAX_BLUR_PX = 7;
// O desfoque diminui com (1 - eased) elevado a essa potência em vez de linearmente — uma queda
// linear deixava ele desconfortavelmente desfocado no meio da virada. Uma potência maior concentra
// o desfoque no "de costas" (ainda totalmente desfocado ali) e clareia rápido assim que ele começa
// a virar.
const BLUR_FALLOFF_POWER = 2.5;
const RIGHT_MARGIN_RATIO = 0.06;
const ZOOM_START = 1;
const ZOOM_END = 1.18;
const FOCUS_Y = 0.42;
// O clipe roda de frontal -> virando de costas (o modelo ancora a foto de referência no frame 0
// bruto), então damos scrub nele ao contrário para ir de costas -> quase de frente (não totalmente
// de frente).
const RAW_START_RATIO = 1; // eased = 0 -> de costas (frame de repouso, extraído primeiro)
const RAW_END_RATIO = 0.2; // eased = 1 -> quase de frente, para antes de chegar na foto de referência
// Rede de segurança independente de como o fundo do clipe original realmente se comporta:
// empurra qualquer fundo cinza/claro residual de volta para o quase-preto da página. Leve perto do
// "de costas" (já confiável) para não sujar, aumentando em direção ao final frontal (onde o modelo
// já desviou para cinza/branco antes) sem precisar saber o clipe exato de antemão.
const BACKGROUND_CRUSH_MIN = 0.08;
const BACKGROUND_CRUSH_MAX = 0.4;

const HEADING_TEXT = "Venha fazer parte da maior escola de tecnologia do mercado igual +25 mil alunos";
// Quanto do intervalo total de scroll cada letra leva para ir de invisível a totalmente
// visível. As letras começam sua revelação escalonadas ao longo do intervalo, então uma janela
// mais larga significa mais sobreposição entre vizinhas (uma onda fluida) em vez de uma máquina
// de escrever estrita, letra por letra.
const LETTER_REVEAL_WINDOW = 0.45;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Mapeia `eased` (progresso de scroll 0..1) para uma proporção alvo (posição 0..1 no clipe bruto)
// através da curva de movimento — independente de qual array de frames vamos acabar amostrando.
function targetRawRatio(curve, eased) {
  const startIndex = Math.round(RAW_START_RATIO * (curve.length - 1));
  const endIndex = Math.round(RAW_END_RATIO * (curve.length - 1));
  const motionAtStart = curve[startIndex];
  const motionAtEnd = curve[endIndex];
  const targetMotion = motionAtStart + (motionAtEnd - motionAtStart) * eased;
  const curveIndex = curveIndexAt(curve, targetMotion);
  return curveIndex / (curve.length - 1);
}

export function Hero() {
  const containerRef = useRef(null);
  const headingRef = useRef(null);
  const charsRef = useRef([]);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const positionsRef = useRef({ centerX: 0, rightX: 0 });
  const motionCurveRef = useRef(null);
  const scrollProgressRef = useRef(0);
  // Faz a mistura do frame do canvas, da pose de repouso fixa até a correta pela curva, assim que
  // a curva de movimento estiver pronta, em vez de saltar direto para ela — o salto só é invisível
  // quando a curva termina quase instantaneamente (o caso normal); se algum dia atrasar (rede lenta,
  // dispositivo sobrecarregado), isso mantém a correção como um pequeno deslize em vez de um salto
  // visível.
  const catchupBlendRef = useRef(1);
  const catchupDoneRef = useRef(false);

  const words = useMemo(() => HEADING_TEXT.split(" "), []);

  useEffect(() => {
    charsRef.current = headingRef.current ? Array.from(headingRef.current.querySelectorAll("[data-char]")) : [];
  }, []);

  const restingFrameIndex = useMemo(() => Math.round(RAW_START_RATIO * (FRAME_COUNT - 1)), []);
  const { frames, coarseFrames, primaryReady, coarseReady, ready } = useVideoFrames(VIDEO_SRC, {
    frameCount: FRAME_COUNT,
    priorityIndex: restingFrameIndex,
    coarseCount: COARSE_COUNT,
  });

  const measurePositions = useCallback(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    const containerWidth = container.clientWidth;
    const stageWidth = stage.offsetWidth;
    const rightMargin = containerWidth * RIGHT_MARGIN_RATIO;

    positionsRef.current = {
      centerX: containerWidth / 2 - stageWidth / 2,
      rightX: containerWidth - stageWidth - rightMargin,
    };
  }, []);

  useEffect(() => {
    measurePositions();
    window.addEventListener("resize", measurePositions);
    return () => window.removeEventListener("resize", measurePositions);
  }, [measurePositions]);

  // Calculada uma vez, a partir da varredura grosseira rápida, e nunca recalculada — ver a nota
  // sobre COARSE_COUNT acima para entender por que isso importa.
  useEffect(() => {
    if (coarseReady && !motionCurveRef.current) {
      motionCurveRef.current = computeMotionCurve(coarseFrames.current);
    }
  }, [coarseReady, coarseFrames]);

  const render = useCallback(
    (progress) => {
      const eased = easeOutCubic(progress);

      const chars = charsRef.current;
      const charCount = chars.length;
      for (let i = 0; i < charCount; i++) {
        const start = charCount > 1 ? (i / (charCount - 1)) * (1 - LETTER_REVEAL_WINDOW) : 0;
        const t = Math.max(0, Math.min(1, (eased - start) / LETTER_REVEAL_WINDOW));
        const el = chars[i];
        el.style.opacity = t.toFixed(3);
        el.style.transform = `translateY(${((1 - t) * 0.3).toFixed(3)}em)`;
      }

      const stage = stageRef.current;
      if (stage) {
        const { centerX, rightX } = positionsRef.current;
        const left = centerX + (rightX - centerX) * eased;
        stage.style.left = `${left}px`;
        stage.style.transform = "translateY(-50%)";
        const blurAmount = MAX_BLUR_PX * Math.pow(1 - eased, BLUR_FALLOFF_POWER);
        stage.style.filter = `blur(${blurAmount.toFixed(2)}px)`;
      }

      const canvas = canvasRef.current;
      const curve = motionCurveRef.current;
      // Os frames finos refinam a suavidade visual assim que totalmente carregados; os frames
      // grosseiros (prontos bem mais cedo) são o fallback. De qualquer forma a curva acima é a
      // mesma, então trocar de um array para o outro só escolhe um frame mais próximo na mesma linha
      // do tempo — nunca um salto.
      const usingFine = ready && frames.current.length > 0;
      const list = usingFine ? frames.current : coarseFrames.current;

      if (canvas && list.length) {
        const restingFloatIndex = Math.round(RAW_START_RATIO * (list.length - 1));
        // Enquanto a curva ainda não está pronta, o blend fica travado no valor inicial (1, mas a curva
        // é null então esse branch é pulado inteiramente — ver o fallback simples de repouso abaixo).
        // Assim que pronta, o blend começa em 0 (ainda em repouso) e desliza até 1 (totalmente correto pela curva).
        const floatIndex = curve
          ? restingFloatIndex + (targetRawRatio(curve, eased) * (list.length - 1) - restingFloatIndex) * catchupBlendRef.current
          : restingFloatIndex;

        // Fazer crossfade entre vizinhos só fica bom quando eles têm poses próximas, o que só é
        // garantido com o conjunto denso de 60 frames — o conjunto grosseiro esparso de 16 frames tem
        // vizinhos distantes o bastante em pose para que misturá-los vire um fantasma de dupla
        // exposição. Então: mistura no conjunto fino, corte seco para o único frame mais próximo no
        // grosseiro.
        const indexA = usingFine ? Math.floor(floatIndex) : Math.round(floatIndex);
        const indexB = usingFine ? Math.min(indexA + 1, list.length - 1) : indexA;
        const blend = usingFine ? floatIndex - indexA : 0;
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
          const zoom = ZOOM_START + (ZOOM_END - ZOOM_START) * eased;

          // Faz crossfade entre os dois frames vizinhos em vez de cortar direto para o mais próximo —
          // suaviza qualquer salto brusco de pose que já esteja embutido no clipe original.
          if (frameA) {
            ctx.globalAlpha = 1;
            drawImageCover(ctx, frameA, canvas.width, canvas.height, { zoom, focusY: FOCUS_Y });
          }
          if (frameB && frameB !== frameA) {
            ctx.globalAlpha = frameA ? blend : 1;
            drawImageCover(ctx, frameB, canvas.width, canvas.height, {
              zoom,
              focusY: FOCUS_Y,
              clear: !frameA,
            });
            ctx.globalAlpha = 1;
          }

          ctx.fillStyle = theme.colors.background;
          ctx.globalAlpha = BACKGROUND_CRUSH_MIN + (BACKGROUND_CRUSH_MAX - BACKGROUND_CRUSH_MIN) * eased;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = 1;
        }
        // Se nenhum dos frames vizinhos terminou de extrair ainda, mantém o que o canvas já está
        // mostrando em vez de piscar em branco.
      }
    },
    [frames, coarseFrames, ready]
  );

  useStickyScrub(containerRef, { distance: 2, onUpdate: render, progressRef: scrollProgressRef });

  // Pinta o frame de repouso (progress = 0) assim que ele é capturado, antes de qualquer scroll.
  useEffect(() => {
    if (primaryReady) {
      measurePositions();
      render(0);
    }
  }, [primaryReady, render, measurePositions]);

  // Assim que a curva de movimento (única, permanente) estiver pronta, desliza da pose de repouso
  // até a correta pela curva em vez de saltar para ela num único frame — ver catchupBlendRef acima.
  // Protegido para rodar só uma vez: esse effect pode disparar de novo depois quando `render` mudar
  // de identidade (ex: quando os frames finos terminarem de carregar), e rodar o deslize de novo
  // nesse momento introduziria um segundo salto/deslize indesejado próprio.
  useEffect(() => {
    if (coarseReady && !catchupDoneRef.current) {
      catchupDoneRef.current = true;
      catchupBlendRef.current = 0;
      const tween = gsap.to(catchupBlendRef, {
        current: 1,
        duration: 0.6,
        ease: "power2.out",
        onUpdate: () => render(scrollProgressRef.current),
      });
      return () => tween.kill();
    }
    return undefined;
  }, [coarseReady, render]);

  // Assim que os frames finos estiverem totalmente carregados, pinta de novo — refina até a
  // suavidade visual completa (mesmo ritmo de antes, só com mais frames para escolher).
  useEffect(() => {
    if (ready) {
      render(scrollProgressRef.current);
    }
  }, [ready, render]);

  return (
    <Wrapper ref={containerRef}>
      <Inner>
        <TextCol>
          <Heading ref={headingRef}>
            {words.map((word, wi) => (
              <Fragment key={wi}>
                <Word>
                  {word.split("").map((ch, ci) => (
                    <Char key={ci} data-char="">
                      {ch}
                    </Char>
                  ))}
                </Word>
                {wi < words.length - 1 ? " " : null}
              </Fragment>
            ))}
          </Heading>
        </TextCol>

        <CharacterStage ref={stageRef}>
          <CharacterCanvas ref={canvasRef} data-ready={primaryReady} />
          <Vignette />
        </CharacterStage>
      </Inner>
    </Wrapper>
  );
}