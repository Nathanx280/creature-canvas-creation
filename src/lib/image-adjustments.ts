import { Adjustments } from "@/components/ImageAdjustments";

/**
 * Applies pre-conversion adjustments to a source image and returns ImageData.
 * The PNT conversion pipeline itself is untouched — this only prepares pixels.
 *
 * Pipeline order:
 *  1. Rotate / flip onto a canvas sized to the rotated dimensions
 *  2. CSS-style filters: brightness, contrast, saturation, hue, blur, sepia, grayscale, invert
 *  3. Per-pixel ops on resulting ImageData: gamma, threshold, posterize, vignette, background fill
 */
export function applyAdjustments(
  source: HTMLImageElement,
  adj: Adjustments
): ImageData {
  const rotated = adj.rotate === 90 || adj.rotate === 270;
  const w = rotated ? source.height : source.width;
  const h = rotated ? source.width : source.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Optional solid background (lets you replace transparency before conversion)
  if (adj.bgEnabled) {
    ctx.fillStyle = adj.bgColor;
    ctx.fillRect(0, 0, w, h);
  }

  const filters: string[] = [];
  filters.push(`brightness(${100 + adj.brightness}%)`);
  filters.push(`contrast(${100 + adj.contrast}%)`);
  filters.push(`saturate(${100 + adj.saturation}%)`);
  filters.push(`hue-rotate(${adj.hue}deg)`);
  if (adj.blur > 0) filters.push(`blur(${adj.blur}px)`);
  if (adj.sepia > 0) filters.push(`sepia(${adj.sepia}%)`);
  if (adj.grayscale > 0) filters.push(`grayscale(${adj.grayscale}%)`);
  if (adj.invert) filters.push(`invert(100%)`);
  ctx.filter = filters.join(" ");

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((adj.rotate * Math.PI) / 180);
  ctx.scale(adj.flipH ? -1 : 1, adj.flipV ? -1 : 1);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  ctx.restore();
  ctx.filter = "none";

  // Per-pixel post-pass
  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;

  const needsGamma = adj.gamma !== 1;
  const needsThreshold = adj.threshold > 0;
  const needsPosterize = adj.posterize > 0 && adj.posterize < 8;
  const needsVignette = adj.vignette > 0;
  const needsSharpen = adj.sharpen > 0;

  // Build gamma LUT once
  let lut: Uint8ClampedArray | null = null;
  if (needsGamma) {
    lut = new Uint8ClampedArray(256);
    const inv = 1 / Math.max(0.05, adj.gamma);
    for (let i = 0; i < 256; i++) lut[i] = Math.round(255 * Math.pow(i / 255, inv));
  }

  // Posterize step
  const levels = needsPosterize ? Math.max(2, Math.round(adj.posterize)) : 0;
  const step = levels ? 255 / (levels - 1) : 0;

  const cx = w / 2;
  const cy = h / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const vStrength = adj.vignette / 100;

  if (needsGamma || needsThreshold || needsPosterize || needsVignette) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        let r = data[i], g = data[i + 1], b = data[i + 2];
        if (lut) { r = lut[r]; g = lut[g]; b = lut[b]; }
        if (needsPosterize) {
          r = Math.round(Math.round(r / step) * step);
          g = Math.round(Math.round(g / step) * step);
          b = Math.round(Math.round(b / step) * step);
        }
        if (needsThreshold) {
          const v = (r * 0.299 + g * 0.587 + b * 0.114) >= adj.threshold ? 255 : 0;
          r = g = b = v;
        }
        if (needsVignette) {
          const dx = x - cx;
          const dy = y - cy;
          const d = Math.sqrt(dx * dx + dy * dy) / maxDist;
          const k = 1 - vStrength * d * d;
          r = Math.max(0, Math.min(255, r * k));
          g = Math.max(0, Math.min(255, g * k));
          b = Math.max(0, Math.min(255, b * k));
        }
        data[i] = r; data[i + 1] = g; data[i + 2] = b;
      }
    }
  }

  // Simple unsharp mask (3x3 kernel)
  if (needsSharpen) {
    const amount = adj.sharpen / 100;
    const src = new Uint8ClampedArray(data);
    const k = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let ki = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              sum += src[((y + dy) * w + (x + dx)) * 4 + c] * k[ki++];
            }
          }
          const orig = src[(y * w + x) * 4 + c];
          const v = orig * (1 - amount) + sum * amount;
          data[(y * w + x) * 4 + c] = Math.max(0, Math.min(255, v));
        }
      }
    }
  }

  return img;
}
