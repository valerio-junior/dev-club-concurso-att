import { useCallback, useEffect, useRef } from "react";
import { useStickyScrub } from "../../hooks/useStickyScrub";
import { useVideoFrames } from "../../hooks/useVideoFrames";
import { drawImageCover } from "../../lib/canvas";
import {
  Wrapper,
  TextColumn,
  TitleGroup,
  Eyebrow,
  Title,
  CardsCol,
  Card,
  NotebookStage,
  NotebookCanvas,
  Vignette,
  ScreenOverlay,
  LogoImg,
} from "./Empresas.styles";

const VIDEO_SRC = "/assets/generated/empresas-notebook.mp4";
const FRAME_COUNT = 40;

const LOGOS = [
  { src: "/assets/logos/netflix.svg", alt: "Netflix" },
  { src: "/assets/logos/amazon.svg", alt: "Amazon" },
  { src: "/assets/logos/ifood.svg", alt: "iFood" },
  { src: "/assets/logos/mercadolivre.svg", alt: "Mercado Livre" },
];

const EYEBROW_TEXT = "Mercado aquecido e você preparado";
const TITLE_TEXT = "Domine além do código";
const CARDS = [
  "Aqui você não só aprende a escrever código",
  "Você aprende como o mercado de trabalho funciona",
  "E como estar preparado para trabalhar em empresas de alto nível",
];

// Title (+ eyebrow) doesn't move — it just fades in slowly, in place — so it only needs
// [fadeInStart, fadeInEnd]; once in, it stays.
const TITLE_WINDOW = [0, 0.14];

// Cards: [fadeInStart, fadeInEnd, holdEnd, fadeOutEnd] in scroll-progress (0..1) —
// sequential, one fully gone before the next starts appearing. Fade-in windows are
// intentionally short (fast) now that easing does the work of making the rise feel smooth.
const CARD_WINDOWS = [
  [0.14, 0.24, 0.38, 0.43],
  [0.43, 0.53, 0.67, 0.72],
  [0.72, 0.82, 0.96, 1],
];

// Cards: opacity ramps to 1 within this fraction of the fade-in window — kept under 1 so
// the card is still visibly traveling (not just fading in place). The title has no travel,
// so it uses fraction 1 (opacity eases gradually across its whole window instead).
const CARD_OPACITY_FRACTION = 0.55;
const EXIT_RISE_PX = 48;
const ENTER_RISE_BUFFER_PX = 40;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Animates one sequential item: rises from `riseDistance` below into place (fully eased,
 * not linear — a linear translate reads as stiff/mechanical), then optionally holds, then
 * optionally fades out while drifting up. `riseDistance: 0` gives a pure in-place fade (used
 * for the title). Pass holdEnd/fadeOutEnd as Infinity for an item that should stay once in.
 */
function animateSequentialItem(t, fadeInStart, fadeInEnd, holdEnd, fadeOutEnd, riseDistance, opacityFraction = CARD_OPACITY_FRACTION) {
  if (t <= fadeInStart) return { opacity: 0, translateY: riseDistance };

  if (t < fadeInEnd) {
    const posT = (t - fadeInStart) / (fadeInEnd - fadeInStart);
    const easedPos = easeOutCubic(posT);
    const opacityT = clamp01(posT / opacityFraction);
    return { opacity: opacityT, translateY: (1 - easedPos) * riseDistance };
  }

  if (t <= holdEnd) return { opacity: 1, translateY: 0 };

  if (t < fadeOutEnd) {
    const exitT = (t - holdEnd) / (fadeOutEnd - holdEnd);
    return { opacity: 1 - exitT, translateY: -exitT * EXIT_RISE_PX };
  }

  return { opacity: 0, translateY: -EXIT_RISE_PX };
}

export function Empresas() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const titleGroupRef = useRef(null);
  const cardsColRef = useRef(null);
  const logoRefs = useRef([]);
  const cardRefs = useRef([]);
  const cardsRiseRef = useRef(400);

  const { frames, primaryReady } = useVideoFrames(VIDEO_SRC, {
    frameCount: FRAME_COUNT,
    priorityIndex: 0,
  });

  // How far below its resting spot the cards column must start to genuinely come from the
  // bottom edge of the screen — measured against the real viewport. The title doesn't move,
  // so it needs no such measurement (see the `riseDistance: 0` call further down).
  const measureRiseDistances = useCallback(() => {
    if (cardsColRef.current) {
      // CardsCol itself is never transformed (only the Card children inside it are),
      // so its position is always reliable to read directly.
      const rect = cardsColRef.current.getBoundingClientRect();
      cardsRiseRef.current = Math.max(window.innerHeight - rect.top + ENTER_RISE_BUFFER_PX, 0);
    }
  }, []);

  useEffect(() => {
    measureRiseDistances();
    window.addEventListener("resize", measureRiseDistances);
    return () => window.removeEventListener("resize", measureRiseDistances);
  }, [measureRiseDistances]);

  const render = useCallback(
    (progress) => {
      // Notebook: hand typing / steam looping, camera locked, so it maps 1:1 to scroll —
      // no reframing needed here (that was only for the Hero's costas->perfil turn).
      const canvas = canvasRef.current;
      const list = frames.current;
      if (canvas && list.length) {
        const floatIndex = progress * (list.length - 1);
        const indexA = Math.floor(floatIndex);
        const indexB = Math.min(indexA + 1, list.length - 1);
        const blend = floatIndex - indexA;
        const frameA = list[indexA];
        const frameB = list[indexB];

        if (frameA || frameB) {
          const ctx = canvas.getContext("2d");
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const targetW = Math.round(canvas.clientWidth * dpr);
          const targetH = Math.round(canvas.clientHeight * dpr);
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          if (frameA) {
            ctx.globalAlpha = 1;
            drawImageCover(ctx, frameA, canvas.width, canvas.height);
          }
          if (frameB && frameB !== frameA) {
            ctx.globalAlpha = frameA ? blend : 1;
            drawImageCover(ctx, frameB, canvas.width, canvas.height, { clear: !frameA });
            ctx.globalAlpha = 1;
          }
        }
      }

      // Screen: logos cross-fade in sequence, in sync with the same scroll progress.
      const floatLogoIndex = progress * (LOGOS.length - 1);
      logoRefs.current.forEach((el, i) => {
        if (!el) return;
        const opacity = Math.max(0, 1 - Math.abs(floatLogoIndex - i));
        el.style.opacity = opacity.toFixed(3);
      });

      // Title: no travel, just a slow in-place fade (riseDistance 0, opacity eases across
      // the whole window instead of a fast fraction of it) — then stays.
      if (titleGroupRef.current) {
        const [a, b] = TITLE_WINDOW;
        const { opacity } = animateSequentialItem(progress, a, b, Infinity, Infinity, 0, 1);
        titleGroupRef.current.style.opacity = opacity.toFixed(3);
      }

      // Cards: rise in visibly, hold, then fade while drifting up — sequential.
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const [a, b, c, d] = CARD_WINDOWS[i];
        const { opacity, translateY } = animateSequentialItem(progress, a, b, c, d, cardsRiseRef.current);
        el.style.opacity = opacity.toFixed(3);
        el.style.transform = `translateY(${translateY.toFixed(2)}px)`;
      });
    },
    [frames]
  );

  useStickyScrub(containerRef, { distance: 2.2, onUpdate: render });

  useEffect(() => {
    if (primaryReady) {
      measureRiseDistances();
      render(0);
    }
  }, [primaryReady, render, measureRiseDistances]);

  return (
    <Wrapper ref={containerRef}>
      <TextColumn>
        <TitleGroup ref={titleGroupRef}>
          <Eyebrow>{EYEBROW_TEXT}</Eyebrow>
          <Title>{TITLE_TEXT}</Title>
        </TitleGroup>
        <CardsCol ref={cardsColRef}>
          {CARDS.map((text, i) => (
            <Card key={i} ref={(el) => (cardRefs.current[i] = el)}>
              {text}
            </Card>
          ))}
        </CardsCol>
      </TextColumn>

      <NotebookStage>
        <NotebookCanvas ref={canvasRef} data-ready={primaryReady} />
        <Vignette />
        <ScreenOverlay>
          {LOGOS.map((logo, i) => (
            <LogoImg key={logo.alt} ref={(el) => (logoRefs.current[i] = el)} src={logo.src} alt={logo.alt} />
          ))}
        </ScreenOverlay>
      </NotebookStage>
    </Wrapper>
  );
}
