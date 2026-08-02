const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Draws `image` onto the canvas context filling width/height, cropping like CSS `object-fit: cover`.
 * `zoom` (>= 1) tightens the crop around (focusX, focusY) — a digital push-in without CSS-scaling
 * the canvas element (which would blur it). `focusX`/`focusY` are 0..1 fractions of the image.
 */
export function drawImageCover(ctx, image, width, height, { zoom = 1, focusX = 0.5, focusY = 0.5, clear = true } = {}) {
  const iw = image.width;
  const ih = image.height;
  const canvasRatio = width / height;
  const imageRatio = iw / ih;

  let baseW, baseH;
  if (imageRatio > canvasRatio) {
    baseH = ih;
    baseW = ih * canvasRatio;
  } else {
    baseW = iw;
    baseH = iw / canvasRatio;
  }

  const sw = baseW / zoom;
  const sh = baseH / zoom;
  const sx = clamp(iw * focusX - sw / 2, 0, iw - sw);
  const sy = clamp(ih * focusY - sh / 2, 0, ih - sh);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (clear) ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
}

/**
 * Measures how much each frame visually changes from the next (by comparing downsampled
 * luminance), then returns a monotonic 0..1 "motion curve" — cumulative visual change up to
 * each frame index. A source clip rarely turns at a constant pace (it may hold a pose, then
 * jump); mapping scroll progress through this curve instead of raw frame index compensates
 * for that, so the on-screen motion reads as constant speed regardless of the source's pacing.
 */
export function computeMotionCurve(frames, sampleSize = 24) {
  const canvas = document.createElement("canvas");
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const luma = (frame) => {
    ctx.clearRect(0, 0, sampleSize, sampleSize);
    ctx.drawImage(frame, 0, 0, sampleSize, sampleSize);
    const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);
    const out = new Float32Array(sampleSize * sampleSize);
    for (let p = 0, i = 0; p < data.length; p += 4, i++) {
      out[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
    }
    return out;
  };

  const lumas = frames.map((f) => (f ? luma(f) : null));

  const diffs = [];
  for (let i = 0; i < lumas.length - 1; i++) {
    const a = lumas[i];
    const b = lumas[i + 1];
    if (!a || !b) {
      diffs.push(0);
      continue;
    }
    let sum = 0;
    for (let p = 0; p < a.length; p++) sum += Math.abs(a[p] - b[p]);
    diffs.push(sum);
  }

  const cumulative = [0];
  for (let i = 0; i < diffs.length; i++) cumulative.push(cumulative[i] + diffs[i]);
  const total = cumulative[cumulative.length - 1] || 1;
  return cumulative.map((v) => v / total);
}

/** Inverse-lookup: the (possibly fractional) index in `curve` whose value equals `target`. */
export function curveIndexAt(curve, target) {
  const n = curve.length;
  if (target <= curve[0]) return 0;
  if (target >= curve[n - 1]) return n - 1;

  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (curve[mid] <= target) lo = mid;
    else hi = mid;
  }
  const span = curve[hi] - curve[lo] || 1e-6;
  return lo + (target - curve[lo]) / span;
}
