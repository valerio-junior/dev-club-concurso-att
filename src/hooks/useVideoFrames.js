import { useEffect, useRef, useState } from "react";

/**
 * Extrai frames de um arquivo de vídeo, direto no navegador (sem depender de servidor/ffmpeg),
 * para que possam ser controlados num canvas frame a frame em sincronia com o scroll. Duas
 * passadas:
 *
 * 1. Grosseira: uma varredura rápida e igualmente espaçada de `coarseCount` frames por todo o
 *    clipe (a posição de repouso/`priorityIndex` é capturada primeiro). Rápida o suficiente para
 *    construir uma curva de movimento aproximada-mas-correta quase imediatamente, em vez de o
 *    scrub precisar esperar a passada fina completa para ter *qualquer* movimento com o ritmo certo.
 * 2. Fina: a passada completa de `frameCount` (frame de prioridade primeiro), refinando a suavidade
 *    quando terminada.
 *
 * As duas passadas compartilham o mesmo espaço de proporção (o frame i representa o tempo
 * `i/(N-1) * duration`), então um chamador construindo uma curva de movimento a partir de qualquer
 * um dos dois arrays está descrevendo a mesma linha do tempo — só que em resoluções diferentes — e
 * pode fazer a transição da grosseira para a fina sem saltos.
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

      // priorityIndex é um índice do array fino; traduz para a proporção equivalente para que a
      // passada grosseira também consiga pegar a mesma pose primeiro.
      const priorityRatio = priorityIndex != null ? priorityIndex / (frameCount - 1) : null;
      const coarsePriorityIndex =
        priorityRatio != null ? Math.round(priorityRatio * (coarseCount - 1)) : null;

      // Passada 1: varredura grosseira, pose de repouso primeiro — libera um scrub com ritmo correto
      // (ainda que meio truncado) quase imediatamente. Pulada por completo quando coarseCount é 0
      // (chamadores que não precisam do ritmo corrigido pela curva, ex: um clipe simples em loop) —
      // nesse caso o primaryReady acaba disparando a partir da passada fina, mais abaixo.
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

      // Passada 2: varredura fina, refina até a suavidade completa.
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
