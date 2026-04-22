import { Upload, Download, Settings, RotateCcw, Zap, Sparkles, Copy, Check } from "lucide-react";
import { useRef, useState, useCallback, ChangeEvent, useEffect } from "react";
import { PAINTING_TARGETS, convertImageToPNT, downloadPNT } from "@/lib/pnt-converter";
import { ARK_PALETTE } from "@/lib/ark-palette";
import { applyAdjustments } from "@/lib/image-adjustments";
import ColorPalette from "@/components/ColorPalette";
import ImagePreview from "@/components/ImagePreview";
import TargetSelector from "@/components/TargetSelector";
import ImageAdjustments, { Adjustments, DEFAULT_ADJUSTMENTS } from "@/components/ImageAdjustments";

const Index = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceImageData, setSourceImageData] = useState<ImageData | null>(null);
  const [fileName, setFileName] = useState("MyPainting");
  const [selectedTarget, setSelectedTarget] = useState(0);
  const [dithering, setDithering] = useState(true);
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [enabledColors, setEnabledColors] = useState<Set<number>>(
    () => new Set(ARK_PALETTE.map((c) => c.index))
  );
  const [previewImageData, setPreviewImageData] = useState<ImageData | null>(null);
  const [pntData, setPntData] = useState<ArrayBuffer | null>(null);
  const [converting, setConverting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [recentTargets, setRecentTargets] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  const target = PAINTING_TARGETS[selectedTarget];
  const finalFileName = `${fileName}${target.suffix}.pnt`;

  const loadImage = useCallback((file: File) => {
    const baseName = file.name.replace(/\.[^.]+$/, "");
    setFileName(baseName);

    const img = new Image();
    img.onload = () => {
      setSourceImage(img);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      setSourceImageData(ctx.getImageData(0, 0, img.width, img.height));
    };
    img.src = URL.createObjectURL(file);
  }, []);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImage(file);
  }, [loadImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) loadImage(file);
  }, [loadImage]);

  // Re-derive sourceImageData when adjustments change
  useEffect(() => {
    if (!sourceImage) return;
    const data = applyAdjustments(sourceImage, adjustments);
    setSourceImageData(data);
  }, [sourceImage, adjustments]);

  // Auto-convert when settings change (untouched conversion logic)
  useEffect(() => {
    if (!sourceImageData) return;

    setConverting(true);
    const timeout = setTimeout(() => {
      const result = convertImageToPNT(
        sourceImageData,
        target.width,
        target.height,
        enabledColors,
        dithering
      );
      setPreviewImageData(result.previewImageData);
      setPntData(result.pntData);
      setConverting(false);
    }, 50);

    return () => clearTimeout(timeout);
  }, [sourceImageData, selectedTarget, enabledColors, dithering, target.width, target.height]);

  const handleSelectTarget = (idx: number) => {
    setSelectedTarget(idx);
    setRecentTargets((prev) => {
      const next = [idx, ...prev.filter((i) => i !== idx)].slice(0, 5);
      return next;
    });
  };

  const handleDownload = () => {
    if (!pntData) return;
    downloadPNT(pntData, finalFileName);
  };

  const handleToggleColor = (index: number) => {
    setEnabledColors((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleReset = () => {
    setSourceImage(null);
    setSourceImageData(null);
    setPreviewImageData(null);
    setPntData(null);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopyName = async () => {
    await navigator.clipboard.writeText(finalFileName);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <header className="border-b border-border/60 px-6 py-4 backdrop-blur-md sticky top-0 z-40 bg-background/70">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">
                ARK <span className="text-gradient">PNT Studio</span>
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Convert · Adjust · Paint
              </p>
            </div>
          </div>
          <a
            href="https://ark.fandom.com/wiki/Painting"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex chip hover:text-primary transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            ARK Painting Wiki
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Upload Zone */}
        {!sourceImage && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`glass p-16 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-primary/60 ${
              dragOver ? "border-primary/80 !bg-primary/5 scale-[1.01]" : ""
            }`}
            style={{ minHeight: 360 }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--gradient-hero)" }}>
              <Upload className="w-8 h-8 text-primary-foreground" />
            </div>
            <p className="text-xl font-semibold text-foreground mb-1">
              Drop your image here
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse · PNG, JPG, JPEG, BMP, WEBP
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              <span className="chip">🦖 80+ creature targets</span>
              <span className="chip">🧑 Human characters</span>
              <span className="chip">🪧 Signs & flags</span>
              <span className="chip">⚡ Tek dinos</span>
            </div>
          </div>
        )}

        {/* Editor */}
        {sourceImage && (
          <>
            {/* Settings Bar */}
            <div className="glass p-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 mr-2">
                <Settings className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Target</span>
              </div>

              <TargetSelector selectedIndex={selectedTarget} onChange={handleSelectTarget} />

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Dithering</span>
                <button
                  onClick={() => setDithering(!dithering)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    dithering ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background transition-transform ${
                      dithering ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Name</span>
                <input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="bg-muted/60 text-foreground text-sm rounded-lg px-2.5 py-1.5 border border-border w-40 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button onClick={handleReset} className="btn-ghost flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  New Image
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!pntData || converting}
                  className="btn-primary flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .pnt
                </button>
              </div>
            </div>

            {/* Filename hint with copy */}
            <div className="glass p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground shrink-0">Will save as</span>
                <code className="text-xs text-primary truncate">{finalFileName}</code>
              </div>
              <button onClick={handleCopyName} className="btn-ghost flex items-center gap-1.5 shrink-0">
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {/* Recently used */}
            {recentTargets.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Recent</span>
                {recentTargets.map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTarget(idx)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      idx === selectedTarget
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {PAINTING_TARGETS[idx].name}
                  </button>
                ))}
              </div>
            )}

            {/* Previews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-4 flex flex-col items-center">
                <h3 className="text-sm font-semibold text-foreground mb-3">Original</h3>
                <img
                  src={sourceImage.src}
                  alt="Original"
                  className="max-w-full h-auto rounded-lg border border-border"
                  style={{ maxHeight: 400 }}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {sourceImage.width} × {sourceImage.height} px
                </p>
              </div>

              <ImagePreview
                imageData={previewImageData}
                width={target.width}
                height={target.height}
                label={converting ? "Converting..." : `Preview (${target.name})`}
              />
            </div>

            {/* Adjustments */}
            <ImageAdjustments value={adjustments} onChange={setAdjustments} />

            {/* Color Palette */}
            <ColorPalette
              enabledColors={enabledColors}
              onToggleColor={handleToggleColor}
              onEnableAll={() => setEnabledColors(new Set(ARK_PALETTE.map((c) => c.index)))}
              onDisableAll={() => setEnabledColors(new Set())}
              onApplyPreset={(indices) => setEnabledColors(new Set(indices))}
            />
          </>
        )}

        {/* Footer Info */}
        <div className="glass p-4">
          <p className="text-xs text-muted-foreground mb-1">
            📂 Place downloaded <code className="text-primary">.pnt</code> files in your ARK MyPaintings folder:
          </p>
          <code className="text-xs text-foreground/80 break-all">
            Steam/steamapps/common/ARK/ShooterGame/Saved/MyPaintings/
          </code>
        </div>
      </main>
    </div>
  );
};

export default Index;
