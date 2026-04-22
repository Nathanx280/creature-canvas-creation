import { ARK_PALETTE } from "@/lib/ark-palette";
import { Palette } from "lucide-react";

interface ColorPaletteProps {
  enabledColors: Set<number>;
  onToggleColor: (index: number) => void;
  onEnableAll: () => void;
  onDisableAll: () => void;
  onApplyPreset: (indices: number[]) => void;
}

const PRESETS: { name: string; indices: number[] }[] = [
  { name: "All Colors", indices: ARK_PALETTE.map((c) => c.index) },
  { name: "Grayscale", indices: [4, 25, 15, 5] },
  { name: "Earth Tones", indices: [4, 6, 8, 18, 19, 20, 22, 24] },
  { name: "Warm", indices: [1, 10, 11, 13, 14, 19, 20, 21] },
  { name: "Cool", indices: [2, 3, 7, 8, 9, 16, 17, 23] },
  { name: "Pastel", indices: [12, 13, 17, 18, 15, 5] },
  { name: "Tribal", indices: [1, 4, 5, 10, 20] },
];

const ColorPalette = ({
  enabledColors,
  onToggleColor,
  onEnableAll,
  onDisableAll,
  onApplyPreset,
}: ColorPaletteProps) => {
  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Color Palette</h3>
          <span className="chip">{enabledColors.size}/{ARK_PALETTE.length}</span>
        </div>
        <div className="flex gap-2 text-xs">
          <button onClick={onEnableAll} className="text-primary hover:text-primary-glow transition-colors">
            All
          </button>
          <span className="text-muted-foreground">·</span>
          <button onClick={onDisableAll} className="text-primary hover:text-primary-glow transition-colors">
            None
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {ARK_PALETTE.map((color) => {
          const enabled = enabledColors.has(color.index);
          return (
            <button
              key={color.index}
              onClick={() => onToggleColor(color.index)}
              title={`${color.name} ${enabled ? "(enabled)" : "(disabled)"}`}
              className={`w-8 h-8 rounded-md border-2 transition-all ${
                enabled
                  ? "border-foreground/40 hover:border-primary scale-100 shadow-sm"
                  : "border-transparent opacity-25 scale-90 hover:opacity-60"
              }`}
              style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
            />
          );
        })}
      </div>

      <div className="border-t border-border/60 pt-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Presets</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => onApplyPreset(p.indices)}
              className="text-xs px-2.5 py-1 rounded-full bg-muted/60 hover:bg-primary/20 hover:text-primary text-muted-foreground transition-colors border border-border/50"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPalette;
