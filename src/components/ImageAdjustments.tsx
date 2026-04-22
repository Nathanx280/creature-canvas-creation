import { Sliders, RotateCw, FlipHorizontal, FlipVertical, RefreshCw } from "lucide-react";

export interface Adjustments {
  brightness: number; // -100..100
  contrast: number;   // -100..100
  saturation: number; // -100..100
  hue: number;        // -180..180
  flipH: boolean;
  flipV: boolean;
  rotate: 0 | 90 | 180 | 270;
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  flipH: false,
  flipV: false,
  rotate: 0,
};

interface Props {
  value: Adjustments;
  onChange: (next: Adjustments) => void;
}

const Slider = ({
  label, value, min, max, onChange,
}: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-mono text-foreground tabular-nums">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full bg-muted appearance-none cursor-pointer accent-primary"
    />
  </div>
);

const ImageAdjustments = ({ value, onChange }: Props) => {
  const set = <K extends keyof Adjustments>(k: K, v: Adjustments[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="glass p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Image Adjustments</h3>
        </div>
        <button
          onClick={() => onChange(DEFAULT_ADJUSTMENTS)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Slider label="Brightness" value={value.brightness} min={-100} max={100} onChange={(v) => set("brightness", v)} />
        <Slider label="Contrast" value={value.contrast} min={-100} max={100} onChange={(v) => set("contrast", v)} />
        <Slider label="Saturation" value={value.saturation} min={-100} max={100} onChange={(v) => set("saturation", v)} />
        <Slider label="Hue" value={value.hue} min={-180} max={180} onChange={(v) => set("hue", v)} />
      </div>

      <div className="flex flex-wrap gap-2 pt-1 border-t border-border/60">
        <button
          onClick={() => set("flipH", !value.flipH)}
          className={`btn-ghost flex items-center gap-1.5 ${value.flipH ? "!bg-primary/20 !text-primary" : ""}`}
        >
          <FlipHorizontal className="w-3.5 h-3.5" /> Flip H
        </button>
        <button
          onClick={() => set("flipV", !value.flipV)}
          className={`btn-ghost flex items-center gap-1.5 ${value.flipV ? "!bg-primary/20 !text-primary" : ""}`}
        >
          <FlipVertical className="w-3.5 h-3.5" /> Flip V
        </button>
        <button
          onClick={() => set("rotate", ((value.rotate + 90) % 360) as Adjustments["rotate"])}
          className="btn-ghost flex items-center gap-1.5"
        >
          <RotateCw className="w-3.5 h-3.5" /> Rotate ({value.rotate}°)
        </button>
      </div>
    </div>
  );
};

export default ImageAdjustments;
