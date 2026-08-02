import { useEffect, useRef, useState } from "react";

/**
 * Extracts `frameCount` evenly-spaced frames from a video file, in-browser (no server/ffmpeg
 * dependency), so they can be scrubbed on a canvas frame-by-frame in sync with scroll.
 *
 * `priorityIndex` (if given) is captured first so callers can show real content almost
 * immediately (one seek) instead of waiting for every frame to finish extracting.
 */
export function useVideoFrames(src, { frameCount = 60, priorityIndex } = {}) {
  const [ready, setReady] = useState(false);
  const [primaryReady, setPrimaryReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const framesRef = useRef([]);

  useEffect(() => {
    if (!src) return undefined;

    let cancelled = false;
    framesRef.current = new Array(frameCount).fill(null);
    setReady(false);
    setPrimaryReady(false);
    setLoadingProgress(0);

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

    const captureIndex = async (index, duration) => {
      const time = Math.min((index / (frameCount - 1)) * duration, duration - 0.05);
      await seekTo(time);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      framesRef.current[index] = await createImageBitmap(canvas);
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

      const order = Array.from({ length: frameCount }, (_, i) => i);
      if (priorityIndex != null && priorityIndex >= 0 && priorityIndex < frameCount) {
        order.splice(order.indexOf(priorityIndex), 1);
        order.unshift(priorityIndex);
      }

      let done = 0;
      for (const index of order) {
        if (cancelled) return;
        await captureIndex(index, duration);
        done += 1;
        setLoadingProgress(done / frameCount);
        if (index === (priorityIndex ?? order[0])) setPrimaryReady(true);
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
  }, [src, frameCount, priorityIndex]);

  return { frames: framesRef, ready, primaryReady, loadingProgress };
}
