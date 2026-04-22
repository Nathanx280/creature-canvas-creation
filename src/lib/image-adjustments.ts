import { Adjustments } from "@/components/ImageAdjustments";

/**
 * Applies brightness/contrast/saturation/hue + flip/rotate to a source image
 * and returns a new ImageData. Conversion logic itself is untouched — this
 * runs BEFORE the PNT pipeline.
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

  // CSS-style filters
  const brightness = 100 + adj.brightness; // %
  const contrast = 100 + adj.contrast;
  const saturate = 100 + adj.saturation;
  const hue = adj.hue;
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hue}deg)`;

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((adj.rotate * Math.PI) / 180);
  ctx.scale(adj.flipH ? -1 : 1, adj.flipV ? -1 : 1);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  ctx.restore();

  return ctx.getImageData(0, 0, w, h);
}
