import { useEffect, useRef, useState, useCallback, type MouseEvent as ReactMouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Loader2,
  ImageIcon,
  FlipHorizontal,
  RotateCcw,
  Move,
  Crosshair,
  SunMedium,
} from "lucide-react";

// ── W/L Presets by modality ──
const WL_PRESETS: Record<string, { label: string; wc: number; ww: number }[]> = {
  CT: [
    { label: "Abdômen", wc: 40, ww: 400 },
    { label: "Pulmão", wc: -600, ww: 1500 },
    { label: "Osso", wc: 400, ww: 2000 },
    { label: "Cérebro", wc: 40, ww: 80 },
    { label: "Mediastino", wc: 50, ww: 350 },
    { label: "Fígado", wc: 60, ww: 150 },
  ],
  MR: [
    { label: "T1 Padrão", wc: 500, ww: 1000 },
    { label: "T2 Padrão", wc: 300, ww: 600 },
    { label: "FLAIR", wc: 400, ww: 800 },
  ],
  CR: [
    { label: "Tórax", wc: 2048, ww: 4096 },
    { label: "Osso", wc: 1024, ww: 2048 },
  ],
  DX: [
    { label: "Tórax", wc: 2048, ww: 4096 },
    { label: "Osso", wc: 1024, ww: 2048 },
  ],
  DEFAULT: [
    { label: "Auto", wc: 0, ww: 0 },
  ],
};

interface DicomViewerProps {
  fileUrl: string;
  fileName?: string;
}

interface PixelState {
  values: Float32Array | null;
  rows: number;
  cols: number;
  intercept: number;
  slope: number;
  photometric: string;
  samplesPerPixel: number;
  bitsAllocated: number;
  bitsStored: number;
  pixelRep: number;
  rawBytes: Uint8Array | null;
  pixelOffset: number;
  autoWC: number;
  autoWW: number;
}

const DicomViewer = ({ fileUrl, fileName }: DicomViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [inverted, setInverted] = useState(false);
  const [wc, setWC] = useState(0);
  const [ww, setWW] = useState(0);
  const [huValue, setHuValue] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [dicomInfo, setDicomInfo] = useState<Record<string, string>>({});
  const [modality, setModality] = useState("DEFAULT");
  const [activePreset, setActivePreset] = useState<string | null>("Auto");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const pixelState = useRef<PixelState>({
    values: null, rows: 0, cols: 0, intercept: 0, slope: 1,
    photometric: "MONOCHROME2", samplesPerPixel: 1, bitsAllocated: 16,
    bitsStored: 12, pixelRep: 0, rawBytes: null, pixelOffset: -1,
    autoWC: 0, autoWW: 0,
  });

  useEffect(() => {
    if (!fileUrl) return;
    loadDicomFile(fileUrl);
  }, [fileUrl]);

  // Re-render when W/L or invert changes
  useEffect(() => {
    const ps = pixelState.current;
    if (ps.values && ps.rows > 0) {
      applyWindowLevel(ps.values, ps.rows, ps.cols, wc, ww, ps.photometric, inverted);
    }
  }, [wc, ww, inverted]);

  const loadDicomFile = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const isDicom =
        bytes.length > 132 &&
        bytes[128] === 0x44 && bytes[129] === 0x49 &&
        bytes[130] === 0x43 && bytes[131] === 0x4d;

      if (isDicom) {
        await parseDicomManual(bytes);
      } else {
        const blob = new Blob([arrayBuffer]);
        const imgUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0);
          }
          setDicomInfo({ "Formato": "Imagem convencional" });
          setLoading(false);
        };
        img.onerror = () => { setError("Formato de arquivo não suportado."); setLoading(false); };
        img.src = imgUrl;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar arquivo DICOM.");
      setLoading(false);
    }
  };

  const parseDicomManual = async (bytes: Uint8Array) => {
    try {
      const info: Record<string, string> = {};
      let offset = 132;
      let rows = 0, cols = 0, bitsAllocated = 16, bitsStored = 12;
      let pixelDataOffset = -1, samplesPerPixel = 1;
      let photometricInterpretation = "MONOCHROME2";
      let windowCenter = 0, windowWidth = 0, pixelRepresentation = 0;
      let rescaleIntercept = 0, rescaleSlope = 1;
      let detectedModality = "DEFAULT";

      const readUint16 = (o: number) => bytes[o] | (bytes[o + 1] << 8);
      const readUint32 = (o: number) =>
        bytes[o] | (bytes[o + 1] << 8) | (bytes[o + 2] << 16) | (bytes[o + 3] << 24);
      const readString = (o: number, len: number) => {
        let str = "";
        for (let i = 0; i < len; i++) {
          const ch = bytes[o + i];
          if (ch === 0) break;
          str += String.fromCharCode(ch);
        }
        return str.trim();
      };

      while (offset < bytes.length - 8) {
        const group = readUint16(offset);
        const element = readUint16(offset + 2);
        const vr = readString(offset + 4, 2);
        let dataOffset: number, dataLength: number;

        const longVRs = ["OB", "OD", "OF", "OL", "OW", "SQ", "UC", "UN", "UR", "UT"];
        if (longVRs.includes(vr)) {
          dataLength = readUint32(offset + 8);
          dataOffset = offset + 12;
        } else if (vr.match(/^[A-Z]{2}$/)) {
          dataLength = readUint16(offset + 6);
          dataOffset = offset + 8;
        } else {
          dataLength = readUint32(offset + 4);
          dataOffset = offset + 8;
        }

        if (dataLength === 0xFFFFFFFF || dataLength < 0) {
          if (group === 0x7FE0 && element === 0x0010) { pixelDataOffset = dataOffset; break; }
          offset = dataOffset;
          continue;
        }

        const tag = `${group.toString(16).padStart(4, "0")}${element.toString(16).padStart(4, "0")}`;

        switch (tag) {
          case "00100010": info["Paciente"] = readString(dataOffset, dataLength); break;
          case "00100020": info["ID"] = readString(dataOffset, dataLength); break;
          case "00080060": {
            const mod = readString(dataOffset, dataLength);
            info["Modalidade"] = mod;
            detectedModality = mod;
            break;
          }
          case "00081030": info["Estudo"] = readString(dataOffset, dataLength); break;
          case "0008103e": info["Série"] = readString(dataOffset, dataLength); break;
          case "00080020": info["Data"] = readString(dataOffset, dataLength); break;
          case "00080080": info["Instituição"] = readString(dataOffset, dataLength); break;
          case "00280010": rows = readUint16(dataOffset); break;
          case "00280011": cols = readUint16(dataOffset); break;
          case "00280100": bitsAllocated = readUint16(dataOffset); break;
          case "00280101": bitsStored = readUint16(dataOffset); break;
          case "00280002": samplesPerPixel = readUint16(dataOffset); break;
          case "00280004": photometricInterpretation = readString(dataOffset, dataLength); break;
          case "00281050": windowCenter = parseFloat(readString(dataOffset, dataLength)) || 0; break;
          case "00281051": windowWidth = parseFloat(readString(dataOffset, dataLength)) || 0; break;
          case "00280103": pixelRepresentation = readUint16(dataOffset); break;
          case "00281052": rescaleIntercept = parseFloat(readString(dataOffset, dataLength)) || 0; break;
          case "00281053": rescaleSlope = parseFloat(readString(dataOffset, dataLength)) || 1; break;
        }

        if (group === 0x7FE0 && element === 0x0010) { pixelDataOffset = dataOffset; break; }
        offset = dataOffset + dataLength;
        if (offset % 2 !== 0) offset++;
      }

      info["Formato"] = "DICOM";
      info["Matriz"] = `${cols}×${rows}`;
      info["Bits"] = `${bitsStored}/${bitsAllocated}`;
      setDicomInfo(info);
      setModality(detectedModality);

      if (pixelDataOffset > 0 && rows > 0 && cols > 0) {
        const totalPixels = rows * cols;
        const pixelValues = new Float32Array(totalPixels);
        let min = Infinity, max = -Infinity;

        if (samplesPerPixel === 1) {
          for (let i = 0; i < totalPixels; i++) {
            let rawValue: number;
            if (bitsAllocated === 16) {
              const idx = pixelDataOffset + i * 2;
              rawValue = bytes[idx] | (bytes[idx + 1] << 8);
              if (pixelRepresentation === 1 && rawValue > (1 << (bitsStored - 1))) {
                rawValue = rawValue - (1 << bitsStored);
              }
            } else {
              rawValue = bytes[pixelDataOffset + i];
            }
            const hu = rawValue * rescaleSlope + rescaleIntercept;
            pixelValues[i] = hu;
            if (hu < min) min = hu;
            if (hu > max) max = hu;
          }
        }

        const autoWC = windowCenter || (min + max) / 2;
        const autoWW = windowWidth || (max - min) || 1;

        pixelState.current = {
          values: pixelValues, rows, cols, intercept: rescaleIntercept,
          slope: rescaleSlope, photometric: photometricInterpretation,
          samplesPerPixel, bitsAllocated, bitsStored, pixelRep: pixelRepresentation,
          rawBytes: bytes, pixelOffset: pixelDataOffset, autoWC, autoWW,
        };

        setWC(autoWC);
        setWW(autoWW);
        setActivePreset("Auto");

        if (samplesPerPixel === 3) {
          renderRGB(bytes, pixelDataOffset, rows, cols);
        } else {
          applyWindowLevel(pixelValues, rows, cols, autoWC, autoWW, photometricInterpretation, false);
        }
      } else {
        setError("Pixel data não encontrado no arquivo DICOM.");
      }
    } catch (err: unknown) {
      setError("Erro ao interpretar DICOM: " + (err instanceof Error ? err.message : "desconhecido"));
    }
    setLoading(false);
  };

  const renderRGB = (bytes: Uint8Array, pixelOffset: number, rows: number, cols: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imgData = ctx.createImageData(cols, rows);
    const totalPixels = rows * cols;
    for (let i = 0; i < totalPixels; i++) {
      imgData.data[i * 4] = bytes[pixelOffset + i * 3];
      imgData.data[i * 4 + 1] = bytes[pixelOffset + i * 3 + 1];
      imgData.data[i * 4 + 2] = bytes[pixelOffset + i * 3 + 2];
      imgData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    setLoading(false);
  };

  const applyWindowLevel = useCallback((
    pixelValues: Float32Array, rows: number, cols: number,
    center: number, width: number, photometric: string, invert: boolean
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.createImageData(cols, rows);
    const lower = center - width / 2;
    const upper = center + width / 2;
    const isMonochrome1 = photometric.includes("MONOCHROME1");
    const shouldInvert = isMonochrome1 !== invert;

    for (let i = 0; i < pixelValues.length; i++) {
      let val = ((pixelValues[i] - lower) / (upper - lower)) * 255;
      val = Math.max(0, Math.min(255, val));
      if (shouldInvert) val = 255 - val;
      imgData.data[i * 4] = val;
      imgData.data[i * 4 + 1] = val;
      imgData.data[i * 4 + 2] = val;
      imgData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  }, []);

  // ── HU readout on mouse move ──
  const handleCanvasMouseMove = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ps = pixelState.current;
    if (!canvas || !ps.values || ps.samplesPerPixel !== 1) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    if (x >= 0 && x < ps.cols && y >= 0 && y < ps.rows) {
      const hu = ps.values[y * ps.cols + x];
      setHuValue(`HU: ${Math.round(hu)} | (${x}, ${y})`);
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleCanvasMouseLeave = () => { setHuValue(null); setCursorPos(null); };

  // ── W/L drag ──
  const handleMouseDown = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) { setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); }
  };

  const handleMouseUp = () => { setIsDragging(false); setDragStart(null); };

  const handleMouseMoveDrag = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    handleCanvasMouseMove(e);
    if (!isDragging || !dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setWW(prev => Math.max(1, prev + dx * 2));
    setWC(prev => prev - dy * 2);
    setDragStart({ x: e.clientX, y: e.clientY });
    setActivePreset(null);
  };

  // ── Scroll wheel zoom ──
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setZoom(prev => {
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      return Math.max(0.1, Math.min(5, prev + delta));
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleRotate = () => setRotation(r => (r + 90) % 360);
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 5));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.1));
  const handleInvert = () => setInverted(i => !i);
  const handleFullscreen = () => containerRef.current?.requestFullscreen?.();

  const handleReset = () => {
    const ps = pixelState.current;
    setZoom(1);
    setRotation(0);
    setInverted(false);
    setWC(ps.autoWC);
    setWW(ps.autoWW);
    setActivePreset("Auto");
  };

  const applyPreset = (preset: { label: string; wc: number; ww: number }) => {
    if (preset.label === "Auto") {
      setWC(pixelState.current.autoWC);
      setWW(pixelState.current.autoWW);
    } else {
      setWC(preset.wc);
      setWW(preset.ww);
    }
    setActivePreset(preset.label);
  };

  const presets = WL_PRESETS[modality] || WL_PRESETS.DEFAULT;

  const ToolBtn = ({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) => (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant={active ? "secondary" : "ghost"}
            className="h-7 w-7"
            onClick={onClick}
            aria-label={label}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-1 px-3 pt-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          Visualizador DICOM
          {dicomInfo["Modalidade"] && (
            <Badge variant="outline" className="text-xs">{dicomInfo["Modalidade"]}</Badge>
          )}
          {fileName && (
            <span className="text-xs text-muted-foreground truncate ml-auto">{fileName}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-1 min-h-0 px-3 pb-2">
        {/* ── Primary Toolbar ── */}
        <div className="flex items-center gap-0.5 flex-wrap">
          <ToolBtn icon={<ZoomIn className="w-3.5 h-3.5" />} label="Zoom In" onClick={handleZoomIn} />
          <ToolBtn icon={<ZoomOut className="w-3.5 h-3.5" />} label="Zoom Out" onClick={handleZoomOut} />
          <ToolBtn icon={<RotateCw className="w-3.5 h-3.5" />} label="Rotacionar 90°" onClick={handleRotate} />
          <ToolBtn icon={<FlipHorizontal className="w-3.5 h-3.5" />} label="Inverter" onClick={handleInvert} active={inverted} />
          <ToolBtn icon={<Maximize2 className="w-3.5 h-3.5" />} label="Tela Cheia" onClick={handleFullscreen} />
          <ToolBtn icon={<RotateCcw className="w-3.5 h-3.5" />} label="Resetar" onClick={handleReset} />

          <div className="h-4 w-px bg-border mx-1" />

          {/* W/L Presets */}
          <div className="flex items-center gap-0.5 flex-wrap">
            <SunMedium className="w-3 h-3 text-muted-foreground mr-0.5" />
            {presets.map((p) => (
              <Button
                key={p.label}
                size="sm"
                variant={activePreset === p.label ? "secondary" : "ghost"}
                className="h-6 text-[10px] px-1.5"
                onClick={() => applyPreset(p)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          {/* W/L values */}
          <div className="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
            <span>WC:{Math.round(wc)}</span>
            <span>WW:{Math.round(ww)}</span>
            <span>×{zoom.toFixed(1)}</span>
          </div>
        </div>

        {/* ── DICOM Info Strip ── */}
        {Object.keys(dicomInfo).length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
            {Object.entries(dicomInfo).map(([k, v]) => (
              <span key={k}><strong>{k}:</strong> {v}</span>
            ))}
          </div>
        )}

        {/* ── Canvas Area ── */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden bg-black rounded-md flex items-center justify-center min-h-0 relative select-none"
          style={{ cursor: isDragging ? "grabbing" : "crosshair" }}
        >
          {loading && (
            <div className="flex flex-col items-center gap-2 text-white/60">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">Carregando DICOM...</span>
            </div>
          )}
          {error && (
            <div className="text-destructive text-sm text-center p-4">{error}</div>
          )}
          <canvas
            ref={canvasRef}
            className={loading ? "hidden" : ""}
            onMouseMove={handleMouseMoveDrag}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { handleMouseUp(); handleCanvasMouseLeave(); }}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: isDragging ? "none" : "transform 0.2s",
              maxWidth: "100%",
              maxHeight: "100%",
              imageRendering: "pixelated",
            }}
          />

          {/* HU Readout overlay */}
          {huValue && cursorPos && (
            <div
              className="absolute pointer-events-none bg-black/80 text-amber-400 text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ left: cursorPos.x + 12, top: cursorPos.y - 20 }}
            >
              {huValue}
            </div>
          )}

          {/* Drag hint */}
          {!loading && !error && pixelState.current.values && (
            <div className="absolute bottom-1 left-1 flex items-center gap-1 text-[9px] text-white/30">
              <Move className="w-3 h-3" />
              Arraste para W/L
              <Crosshair className="w-3 h-3 ml-1" />
              HU no cursor
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DicomViewer;
