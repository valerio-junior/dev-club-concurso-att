import { Fragment, useCallback, useEffect, useMemo, useRef } from "react";
import { useStickyScrub } from "../../hooks/useStickyScrub";
import { useVideoFrames } from "../../hooks/useVideoFrames";
import { drawImageCover, computeMotionCurve, curveIndexAt } from "../../lib/canvas";
import { theme } from "../../styles/theme";
import { Wrapper, Inner, TextCol, Heading, Word, Char, CharacterStage, CharacterCanvas, Vignette } from "./Hero.styles";

const VIDEO_SRC = "/assets/generated/hero-rodolfo.mp4";
// Finer sampling keeps neighboring frames close in pose, so the cross-fade below blends
// near-identical images instead of visibly different ones (which reads as a "ghosted" jump).
const FRAME_COUNT = 60;
// A quick, coarse sweep (see useVideoFrames) so we have a correct *pacing* curve almost
// immediately on load. That curve is kept forever once computed — the fine 60-frame set only
// adds more images to sample from (visual smoothness), it never recomputes/replaces the
// pacing itself, so there's no "hand-off" moment that can ever jump or glitch.
const COARSE_COUNT = 16;
const MAX_BLUR_PX = 7;
// Blur falls off with (1 - eased) raised to this power instead of linearly — a linear falloff
// kept him uncomfortably blurry through the middle of the turn. A higher power front-loads the
// blur onto "de costas" (still fully blurred there) and clears up quickly once he starts turning.
const BLUR_FALLOFF_POWER = 2.5;
const RIGHT_MARGIN_RATIO = 0.06;
const ZOOM_START = 1;
const ZOOM_END = 1.18;
const FOCUS_Y = 0.42;
// The clip runs frontal -> turning away (the model anchors the reference photo to raw frame 0),
// so we scrub it in reverse for costas -> quase de frente (not fully frontal).
const RAW_START_RATIO = 1; // eased = 0 -> de costas (resting frame, extracted first)
const RAW_END_RATIO = 0.2; // eased = 1 -> quase de frente, stops short of the reference photo
// Safety net regardless of how the source clip's background actually behaves: nudges any
// residual light/gray background back toward the page's near-black. Light near "de costas"
// (already reliable) so we don't muddy it, ramping up toward the frontal end (where the
// model has drifted gray/white before) without needing to know the exact clip in advance.
const BACKGROUND_CRUSH_MIN = 0.08;
const BACKGROUND_CRUSH_MAX = 0.4;

const HEADING_TEXT = "Venha fazer parte da maior escola de tecnologia do mercado igual +25 mil alunos";
// How much of the whole scroll range each letter takes to go from invisible to fully
// visible. Letters start their reveal staggered across the range, so a wider window means
// more overlap between neighbors (a flowing wave) instead of a strict one-by-one typewriter.
const LETTER_REVEAL_WINDOW = 0.45;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Maps `eased` (0..1 scroll progress) to a target ratio (0..1 position in the raw clip) via
// the motion curve — independent of which frame array we'll eventually sample from.
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

  // Computed once, from the fast coarse sweep, and never recomputed — see the note on
  // COARSE_COUNT above for why that matters.
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
      // Fine frames refine visual smoothness once fully loaded; coarse frames (ready much
      // sooner) are the fallback. Either way the curve above is the same, so switching from
      // one array to the other just picks a nearer frame on the same timeline — never a jump.
      const usingFine = ready && frames.current.length > 0;
      const list = usingFine ? frames.current : coarseFrames.current;

      if (canvas && list.length) {
        const floatIndex = curve
          ? targetRawRatio(curve, eased) * (list.length - 1)
          : Math.round(RAW_START_RATIO * (list.length - 1));

        // Cross-fading between neighbors only looks good when they're close in pose, which
        // is only guaranteed with the dense 60-frame set — the sparse 16-frame coarse set has
        // neighbors far enough apart in pose that blending them ghosts into a double-exposure.
        // So: blend on the fine set, hard-cut to the single nearest frame on the coarse one.
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

          // Cross-fade between the two neighboring frames instead of hard-cutting to the
          // nearest one — smooths out any abrupt pose jump baked into the source clip.
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
        // If neither neighboring frame has finished extracting yet, keep whatever the
        // canvas already shows rather than flashing it blank.
      }
    },
    [frames, coarseFrames, ready]
  );

  useStickyScrub(containerRef, { distance: 2, onUpdate: render, progressRef: scrollProgressRef });

  // Paint the resting (progress = 0) frame as soon as it's captured, before any scroll.
  useEffect(() => {
    if (primaryReady) {
      measurePositions();
      render(0);
    }
  }, [primaryReady, render, measurePositions]);

  // Once the (only, permanent) motion curve is ready, re-paint at the current scroll position
  // so correctly-paced scrubbing takes effect immediately instead of waiting for the next tick.
  useEffect(() => {
    if (coarseReady) {
      render(scrollProgressRef.current);
    }
  }, [coarseReady, render]);

  // Once the fine frames are fully loaded, re-paint again — refines to full visual smoothness
  // (same pacing as above, just more frames to choose from).
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
