import { useEffect, useRef, useState } from "react";

/**
 * Extracts frames from a video file, in-browser (no server/ffmpeg dependency), so they can
 * be scrubbed on a canvas frame-by-frame in sync with scroll. Two passes:
 *
 * 1. Coarse: a quick, evenly-spaced sweep of `coarseCount` frames across the whole clip
 *    (resting/`priorityIndex` position captured first). Fast enough to build a rough-but-
 *    correct motion curve almost immediately, instead of scrubbing must wait for the full
 *    fine pass to have *any* correctly-paced motion.
 * 2. Fine: the full `frameCount` pass (priority frame first), refining smoothness once done.
 *
 * Both passes share the same ratio space (frame i represents time `i/(N-1) * duration`), so
 * a caller building a motion curve from either array is describing the same timeline — just
 * at different resolutions — and can hand off from coarse to fine without a jump.
 */
export function useVideoFrames(src, { frameCount = 60, priorityIndex, coarseCount = 16 } = {}) {
  const [ready, setReady] = useState(false);
  const [primaryReady, setPrimaryReady] = useState(false);
  const [coarseReady, setCoarseReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const framesRef = useRef([]);
  const coarseFramesRef = useRef([]);

  useEffect(() => {
    if (!src) return undefined;

    let cancelled = false;
    framesRef.current = new Array(frameCount).fill(null);
    coarseFramesRef.current = new Array(coarseCount).fill(null);
    setReady(false);
    setPrimaryReady(false);
    setCoarseReady(false);
    setLoadingProgress(0);
    setDuration(0);

    const video = document.createElement("video");
    video.src = src;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const seekTo = (time) =>
      new Promise((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
        video.currentTime = time;
      });

    const captureAtRatio = async (ratio, duration) => {
      const time = Math.min(ratio * duration, duration - 0.05);
      await seekTo(time);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return createImageBitmap(canvas);
    };

    const orderedIndices = (length, wantedFirst) => {
      const order = Array.from({ length }, (_, i) => i);
      if (wantedFirst != null && wantedFirst >= 0 && wantedFirst < length) {
        order.splice(order.indexOf(wantedFirst), 1);
        order.unshift(wantedFirst);
      }
      return order;
    };

    const extract = async () => {
      await new Promise((resolve, reject) => {
        video.addEventListener("loadedmetadata", resolve, { once: true });
        video.addEventListener("error", reject, { once: true });
      });
      if (cancelled) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      setDuration(duration);

      // priorityIndex is a fine-array index; translate it to the equivalent ratio so the
      // coarse pass can grab the same pose first too.
      const priorityRatio = priorityIndex != null ? priorityIndex / (frameCount - 1) : null;
      const coarsePriorityIndex =
        priorityRatio != null ? Math.round(priorityRatio * (coarseCount - 1)) : null;

      // Pass 1: coarse sweep, resting pose first — unlocks a correctly-paced (if chunky)
      // scrub almost immediately. Skipped entirely when coarseCount is 0 (callers that don't
      // need curve-corrected pacing, e.g. a plain looping clip) — primaryReady falls back to
      // firing from the fine pass in that case, further down.
      const usingCoarse = coarseCount > 0;
      if (usingCoarse) {
        for (const i of orderedIndices(coarseCount, coarsePriorityIndex)) {
          if (cancelled) return;
          const ratio = coarseCount > 1 ? i / (coarseCount - 1) : 0;
          coarseFramesRef.current[i] = await captureAtRatio(ratio, duration);
          if (i === (coarsePriorityIndex ?? 0)) setPrimaryReady(true);
        }
      }
      if (!cancelled) setCoarseReady(true);

      // Pass 2: fine sweep, refines to full smoothness.
      let done = 0;
      for (const index of orderedIndices(frameCount, priorityIndex)) {
        if (cancelled) return;
        const ratio = frameCount > 1 ? index / (frameCount - 1) : 0;
        framesRef.current[index] = await captureAtRatio(ratio, duration);
        done += 1;
        setLoadingProgress(done / frameCount);
        if (!usingCoarse && index === (priorityIndex ?? 0)) setPrimaryReady(true);
      }

      if (!cancelled) setReady(true);
    };

    extract().catch(() => {
      if (!cancelled) setReady(false);
    });

    return () => {
      cancelled = true;
      video.src = "";
    };
  }, [src, frameCount, priorityIndex, coarseCount]);

  return { frames: framesRef, coarseFrames: coarseFramesRef, ready, primaryReady, coarseReady, loadingProgress, duration };
}
