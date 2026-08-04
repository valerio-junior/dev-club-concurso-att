import { useCallback, useEffect, useRef } from "react";
import { useStickyScrub } from "../../hooks/useStickyScrub";
import { useVideoFrames } from "../../hooks/useVideoFrames";
import { drawImageCover } from "../../lib/canvas";
import { ScrollTrigger } from "../../lib/gsap";
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
// Longer clip now (opening + typing, ~10s vs the previous 5s loop), so more samples to
// keep the same temporal resolution.
const FRAME_COUNT = 64;

// Fraction of the scroll-progress range where the lid finishes opening AND the hands have
// had time to settle onto the keyboard — estimated, not measured from an actual frame (may
// need a calibration pass once seen). Pushed further out than the lid-open point itself so
// logos don't start while the hands are still mid-air moving down to the keys.
// NOTE: this fraction maps directly to a raw video frame (floatIndex = progress * frameCount)
// regardless of `distance` — distance only changes how much physical scrolling a given
// progress fraction takes, never which video frame it shows. So this must NOT be rescaled
// when distance changes (an earlier attempt to do that made logos start before the lid had
// actually finished opening in the video). 0.8 instead of the original 0.78 adds a touch more
// buffer, per request, on top of fixing that regression.
const OPEN_THRESHOLD = 0.8;
const SCREEN_FADE_IN = 0.08; // how much extra progress the screen itself takes to fade in after that

const LOGOS = [
  { src: "/assets/logos/netflix.svg", alt: "Netflix" },
  { src: "/assets/logos/amazon.svg", alt: "Amazon" },
  { src: "/assets/logos/ifood.svg", alt: "iFood" },
  { src: "/assets/logos/mercadolivre.svg", alt: "Mercado Livre" },
];

// Each logo gets a real hold (a pause at full opacity) instead of directly cross-fading into
// the next one — [fadeInStart, fadeInEnd, holdEnd, fadeOutEnd], sequential within the range
// left after OPEN_THRESHOLD. The last entry's holdEnd/fadeOutEnd are overridden to Infinity
// at render time (see the isLast check below), so it stays instead of fading out.
// Widened to fill [OPEN_THRESHOLD, 1] (now 0.2 wide instead of the original 0.22 — narrower
// fraction, but distance grew from 3.6 to 4.39, so the *absolute* scroll for this whole phase
// still ends up larger than before) — same shape/order per logo, just more room per hold.
const LOGO_WINDOWS = [
  [0.8, 0.818, 0.841, 0.85],
  [0.85, 0.868, 0.891, 0.9],
  [0.9, 0.918, 0.941, 0.95],
  [0.95, 0.968, 0.991, 1],
];

const EYEBROW_TEXT = "Mercado aquecido e você preparado";
const TITLE_TEXT = "Domine além do código";
const CARDS = [
  "Aqui você não só aprende a escrever código",
  "Você aprende como o mercado de trabalho funciona",
  "E como estar preparado para trabalhar em empresas de alto nível",
];

// Title (+ eyebrow) doesn't move — it just fades in slowly, in place — so it only needs
// [fadeInStart, fadeInEnd]; once in, it stays. Rescaled (same 0.82 factor as OPEN_THRESHOLD)
// to keep its absolute scroll timing identical after distance grew — see OPEN_THRESHOLD above.
const TITLE_WINDOW = [0, 0.115];

// Cards: [fadeInStart, fadeInEnd, holdEnd, fadeOutEnd] in scroll-progress (0..1) —
// sequential, one fully gone before the next starts appearing. Fade-in windows are
// intentionally short (fast) now that easing does the work of making the rise feel smooth.
// Rescaled along with TITLE_WINDOW/OPEN_THRESHOLD — same absolute scroll timing as before.
const CARD_WINDOWS = [
  [0.115, 0.197, 0.312, 0.353],
  [0.353, 0.435, 0.549, 0.59],
  [0.59, 0.672, 0.787, 0.82],
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
  const screenOverlayRef = useRef(null);
  const titleGroupRef = useRef(null);
  const cardsColRef = useRef(null);
  const logoRefs = useRef([]);
  const cardRefs = useRef([]);
  const cardsRiseRef = useRef(400);

  // Loads eagerly at mount, same as before — delaying the start (tried via both viewport
  // proximity and a flat timer) only shrinks the head start it gets while the user is still
  // scrolling through Hero, which made fast-scrolling arrivals worse, not better. The actual
  // fix for that is the coarse pass below: a quick low-frame-count sweep across the whole clip
  // finishes far faster than the full 64-frame pass, so scrubbing anywhere in the section
  // always has *some* frame to show — not stuck on frame 0 (its priority frame) — while the
  // fine pass keeps refining in the background.
  const { frames, coarseFrames, ready, primaryReady } = useVideoFrames(VIDEO_SRC, {
    frameCount: FRAME_COUNT,
    priorityIndex: 0,
    coarseCount: 16,
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
    // Sibling sections added later (their pin-spacers, videos, etc.) can shift overall page
    // layout after this section's own initial measurement — GSAP's "refresh" event fires
    // whenever ScrollTrigger recalculates anything, which is the general signal to re-measure.
    ScrollTrigger.addEventListener("refresh", measureRiseDistances);
    return () => {
      window.removeEventListener("resize", measureRiseDistances);
      ScrollTrigger.removeEventListener("refresh", measureRiseDistances);
    };
  }, [measureRiseDistances]);

  const render = useCallback(
    (progress) => {
      // Notebook: hand typing / steam looping, camera locked, so it maps 1:1 to scroll —
      // no reframing needed here (that was only for the Hero's costas->perfil turn). Draws
      // from the fast-arriving coarse set until the full fine set has finished extracting,
      // same switchover Hero already does — same ratio space either way (see useVideoFrames),
      // so there's no jump when it hands off.
      const canvas = canvasRef.current;
      const list = ready ? frames.current : coarseFrames.current;
      if (canvas && list.length) {
        const floatIndex = progress * (list.length - 1);
        // The coarse set's frames sit far enough apart in time that cross-fading between two
        // of them reads as a double-exposure ghost (very different poses blended together)
        // instead of smooth motion — so while only the coarse set is available, just hold the
        // single nearest frame with no blend. The fine set's frames are close enough together
        // for the blend to read as motion instead, so it keeps doing that once ready.
        const indexA = ready ? Math.floor(floatIndex) : Math.round(floatIndex);
        const indexB = ready ? Math.min(indexA + 1, list.length - 1) : indexA;
        const blend = ready ? floatIndex - indexA : 0;
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

      // Screen: hidden while the lid is closed/opening (nothing to show yet), fades in
      // right as the lid finishes opening, then the logos cross-fade within what's left
      // of the scroll range — not the full 0..1 range like before.
      if (screenOverlayRef.current) {
        const screenOpacity = clamp01((progress - OPEN_THRESHOLD) / SCREEN_FADE_IN);
        screenOverlayRef.current.style.opacity = screenOpacity.toFixed(3);
      }
      // Each logo fades in, holds, then fades out before the next one starts — except the
      // last one (Mercado Livre), which stays once it arrives instead of leaving the screen
      // blank at the end of the scroll.
      const lastLogoIndex = LOGOS.length - 1;
      logoRefs.current.forEach((el, i) => {
        if (!el) return;
        const [a, b, c, d] = LOGO_WINDOWS[i];
        const isLast = i === lastLogoIndex;
        const { opacity } = animateSequentialItem(progress, a, b, isLast ? Infinity : c, isLast ? Infinity : d, 0, 1);
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
    [frames, coarseFrames, ready]
  );

  // Grew from 3.6 to 4.39 solely to give the logo phase more absolute scroll room — every
  // other window above was rescaled by the same 3.6/4.39 factor so its absolute scroll timing
  // (when the lid finishes opening, when each card enters/exits) stays exactly as it was.
  useStickyScrub(containerRef, { distance: 4.39, onUpdate: render });

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
        <ScreenOverlay ref={screenOverlayRef}>
          {LOGOS.map((logo, i) => (
            <LogoImg key={logo.alt} ref={(el) => (logoRefs.current[i] = el)} src={logo.src} alt={logo.alt} />
          ))}
        </ScreenOverlay>
      </NotebookStage>
    </Wrapper>
  );
}
