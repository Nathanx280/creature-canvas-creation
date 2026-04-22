import { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface ImagePreviewProps {
  imageData: ImageData | null;
  width: number;
  height: number;
  label: string;
}

const ImagePreview = ({ imageData, width, height, label }: ImagePreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!canvasRef.current || !imageData) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    canvasRef.current.width = width;
    canvasRef.current.height = height;
    ctx.putImageData(imageData, 0, 0);
  }, [imageData, width, height]);

  return (
    <div className="glass p-4 flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-3">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        {imageData && (
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.5))} className="btn-ghost !p-1.5" title="Zoom out">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-muted-foreground tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(8, z + 0.5))} className="btn-ghost !p-1.5" title="Zoom in">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setZoom(1)} className="btn-ghost !p-1.5" title="Reset zoom">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {imageData ? (
        <div className="w-full overflow-auto scrollbar-thin rounded-lg border border-border bg-[linear-gradient(45deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(-45deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(45deg,transparent_75%,hsl(var(--muted))_75%),linear-gradient(-45deg,transparent_75%,hsl(var(--muted))_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0]" style={{ maxHeight: 420 }}>
          <div className="flex items-center justify-center min-h-[400px] p-4">
            <canvas
              ref={canvasRef}
              style={{
                imageRendering: "pixelated",
                width: width * zoom,
                height: height * zoom,
                maxWidth: "none",
              }}
            />
          </div>
        </div>
      ) : (
        <div className="w-full h-48 flex items-center justify-center rounded-lg border border-border border-dashed">
          <p className="text-muted-foreground text-sm">No preview yet</p>
        </div>
      )}
      {imageData && (
        <p className="text-xs text-muted-foreground mt-2">
          {width} × {height} px
        </p>
      )}
    </div>
  );
};

export default ImagePreview;
