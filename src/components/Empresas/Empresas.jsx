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
  "E ficar preparado para trabalhar em empresas de alto nível",
];

// Title (+ eyebrow, animated together) only has [fadeInStart, fadeInEnd] — once in, stays.
const TITLE_WINDOW = [0, 0.22];

// Cards: [fadeInStart, fadeInEnd, holdEnd, fadeOutEnd] in scroll-progress (0..1) —
// sequential, one fully gone before the next starts appearing.
const CARD_WINDOWS = [
  [0.22, 0.38, 0.44, 0.48],
  [0.48, 0.64, 0.7, 0.74],
  [0.74, 0.9, 0.96, 1],
];

// While entering, opacity ramps to 1 within this fraction of the fade-in window — kept
// well under 1 so the item is still visibly traveling (not just fading in place), but
// raised so the fade-in itself reads as gradual rather than near-instant.
const ENTER_OPACITY_FRACTION = 0.45;
const EXIT_RISE_PX = 48;
const ENTER_RISE_BUFFER_PX = 40;

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/**
 * Animates one sequential item: rises from `riseDistance` below into place (visible early,
 * per ENTER_OPACITY_FRACTION), optionally holds, then optionally fades out while drifting up.
 * Pass holdEnd/fadeOutEnd as Infinity for an item that should stay in place once it arrives
 * (used for the title).
 */
function animateSequentialItem(t, fadeInStart, fadeInEnd, holdEnd, fadeOutEnd, riseDistance) {
  if (t <= fadeInStart) return { opacity: 0, translateY: riseDistance };

  if (t < fadeInEnd) {
    const posT = (t - fadeInStart) / (fadeInEnd - fadeInStart);
    const opacityT = clamp01((t - fadeInStart) / ((fadeInEnd - fadeInStart) * ENTER_OPACITY_FRACTION));
    return { opacity: opacityT, translateY: (1 - posT) * riseDistance };
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
  const titleRiseRef = useRef(400);
  const cardsRiseRef = useRef(400);

  const { frames, primaryReady } = useVideoFrames(VIDEO_SRC, {
    frameCount: FRAME_COUNT,
    priorityIndex: 0,
  });

  // How far below its resting spot an element must start to genuinely come from the
  // bottom edge of the screen — measured against the real viewport, per element (the
  // title and the cards rest at different heights, so each needs its own distance).
  const measureRiseDistances = useCallback(() => {
    if (titleGroupRef.current) {
      // The title itself gets a transform once animated, so reset it before measuring —
      // otherwise we'd be measuring its already-shifted position, not its resting one.
      const el = titleGroupRef.current;
      const prevTransform = el.style.transform;
      el.style.transform = "none";
      const rect = el.getBoundingClientRect();
      el.style.transform = prevTransform;
      titleRiseRef.current = Math.max(window.innerHeight - rect.top + ENTER_RISE_BUFFER_PX, 0);
    }
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

      // Title: rises once, then stays.
      if (titleGroupRef.current) {
        const [a, b] = TITLE_WINDOW;
        const { opacity, translateY } = animateSequentialItem(progress, a, b, Infinity, Infinity, titleRiseRef.current);
        titleGroupRef.current.style.opacity = opacity.toFixed(3);
        titleGroupRef.current.style.transform = `translateY(${translateY.toFixed(2)}px)`;
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
