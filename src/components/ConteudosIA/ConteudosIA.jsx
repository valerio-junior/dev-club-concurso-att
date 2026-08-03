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
// The first couple seconds of the source clip show him smiling against a flat gray
// background before the actual human->robot transformation begins — skipped by shifting
// where in the raw clip we start sampling from, instead of re-cutting the file itself.
const SKIP_SECONDS = 2.5;

const ICONS = [
  { src: "/assets/logos/ai/gemini.svg", alt: "Gemini", background: "linear-gradient(135deg, #4C8DF6, #9B72CB)" },
  { src: "/assets/logos/ai/chatgpt.svg", alt: "ChatGPT" },
  { src: "/assets/logos/ai/claude.svg", alt: "Claude", background: "linear-gradient(135deg, #F0A875, #D97757)" },
  { src: "/assets/logos/ai/copilot.svg", alt: "Copilot" },
  { src: "/assets/logos/ai/meta-ai.svg", alt: "Meta AI", background: "linear-gradient(135deg, #4E7FE1, #2E5FD9)" },
];
// Each icon's shine sweep gets its own slot in the loop (icon i starts at i * SHINE_CYCLE /
// count), so only one icon is ever mid-sweep at a time, in left-to-right sequence.
const SHINE_CYCLE = 6;

const TEXT_WINDOW = 0.15;
const ICONS_START = 0.13;
const ICONS_END = 0.32;
const ICONS_REVEAL_FRACTION = 0.55;
// Wide fade-in window (was a snappy 0.08 — read as "popping in" instead of tracking scroll) so
// the video stage eases in gradually as the user scrolls, overlapping the tail of the icons
// reveal instead of only starting once they're fully done.
const VIDEO_FADE_START = 0.25;
const VIDEO_FADE_END = 0.55;
const VIDEO_SCRUB_START = 0.55;
// The first description crossfades into the second one during this window, synced with the
// Rodolfo transformation already underway (VIDEO_SCRUB_START) — the icons row is untouched by
// this and stays visible throughout.
const DESC_SWAP_START = 0.6;
const DESC_SWAP_END = 0.82;
const FOCUS_Y = 0.38;
// The regenerated clip's own background now already matches #0d131a (fixed at the source via
// a flat-background reference photo), so this is back to a light safety net for any minor
// residual drift, same as the Hero's version — not compensating for a real mismatch anymore.
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

  // Only start decoding/extracting this section's video once it's actually approaching the
  // viewport — mounting every section's video work eagerly at page load makes them all
  // compete for the browser's video decoder at once, which is what caused the Hero's own
  // motion curve to lag and visibly jump earlier.
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

  const { frames, ready, duration } = useVideoFrames(shouldLoad ? VIDEO_SRC : null, {
    frameCount: FRAME_COUNT,
    coarseCount: 0,
  });

  const render = useCallback(
    (progress) => {
      // First description: fades/rises in as before, then — once the transformation is well
      // underway — fades/drifts back out as the second description crossfades over it.
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

      // Second description: crossfades in over the first during the same swap window, then
      // stays put — it's the one still visible once the transformation finishes.
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
      const list = frames.current;
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
        // If neither neighboring frame has finished extracting yet, keep whatever the canvas
        // already shows rather than flashing it blank.
      }
    },
    [frames, duration]
  );

  // Progress arrives imperatively from FormacoesConteudosIA (the shared pinned Stage hosting
  // this section together with Formacoes) instead of this section pinning itself.
  const renderAtProgress = useCallback(
    (progress) => {
      progressRef.current = progress;
      render(progress);
    },
    [render]
  );

  useImperativeHandle(ref, () => ({ render: renderAtProgress }), [renderAtProgress]);

  useEffect(() => {
    if (ready) {
      render(progressRef.current);
    }
  }, [ready, render]);

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
