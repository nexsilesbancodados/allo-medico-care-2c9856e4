import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Loader2, FileSignature, Download, Save, ImageIcon,
  Mic, MicOff, Sparkles, Wand2, BookText, ChevronDown, Lightbulb,
  ZoomIn, ZoomOut, RotateCw, Contrast, Maximize2, Sun, Move, Ruler,
  ArrowLeft, ChevronLeft, ChevronRight, Grid3X3, Monitor, Eye,
  Crosshair, RotateCcw, FlipHorizontal, FlipVertical, Pencil,
  Type, Play, MoreHorizontal, Keyboard, FileText, Clock, AlertTriangle
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gerarHashDocumento, gerarCodigoVerificacao } from "@/lib/signature";
import { REPORT_MACROS, findMacro, applyMacro } from "@/lib/report-macros";
import jsPDF from "jspdf";
import type { ExamRequest, ExamReport, ReportTemplate } from "@/types/domain";

// ==================== DICOM VIEWER PANEL (PACS-style) ====================
const PacsViewer = ({
  fileUrls,
  examRequest,
}: {
  fileUrls: string[];
  examRequest: ExamRequest | null;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [loading, setLoading] = useState(false);
  const [tool, setTool] = useState<"pan" | "zoom" | "measure" | "annotate">("pan");
  const [dicomInfo, setDicomInfo] = useState<Record<string, string>>({});
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const activeUrl = fileUrls[activeIndex] || null;

  useEffect(() => {
    if (!activeUrl) return;
    loadImage(activeUrl);
  }, [activeUrl]);

  const loadImage = async (url: string) => {
    setLoading(true);
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const isDicom =
        bytes.length > 132 &&
        bytes[128] === 0x44 && bytes[129] === 0x49 &&
        bytes[130] === 0x43 && bytes[131] === 0x4d;

      if (isDicom) {
        await parseDicom(bytes);
      } else {
        const blob = new Blob([arrayBuffer]);
        const imgUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.drawImage(img, 0, 0);
          setDicomInfo({ Formato: "Imagem" });
          setLoading(false);
        };
        img.onerror = () => { setLoading(false); };
        img.src = imgUrl;
      }
    } catch {
      setLoading(false);
    }
  };

  const parseDicom = async (bytes: Uint8Array) => {
    try {
      const info: Record<string, string> = {};
      let offset = 132;
      let rows = 0, cols = 0, bitsAllocated = 16, bitsStored = 12;
      let pixelDataOffset = -1, samplesPerPixel = 1;
      let photometric = "MONOCHROME2", wc = 0, ww = 0;
      let pixelRep = 0, intercept = 0, slope = 1;

      const readUint16 = (o: number) => bytes[o] | (bytes[o + 1] << 8);
      const readUint32 = (o: number) => bytes[o] | (bytes[o + 1] << 8) | (bytes[o + 2] << 16) | (bytes[o + 3] << 24);
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
        if (longVRs.includes(vr)) { dataLength = readUint32(offset + 8); dataOffset = offset + 12; }
        else if (vr.match(/^[A-Z]{2}$/)) { dataLength = readUint16(offset + 6); dataOffset = offset + 8; }
        else { dataLength = readUint32(offset + 4); dataOffset = offset + 8; }

        if (dataLength === 0xFFFFFFFF || dataLength < 0) {
          if (group === 0x7FE0 && element === 0x0010) { pixelDataOffset = dataOffset; break; }
          offset = dataOffset; continue;
        }

        const tag = `${group.toString(16).padStart(4, "0")}${element.toString(16).padStart(4, "0")}`;
        switch (tag) {
          case "00100010": info["Paciente"] = readString(dataOffset, dataLength); break;
          case "00100020": info["ID"] = readString(dataOffset, dataLength); break;
          case "00080060": info["Modalidade"] = readString(dataOffset, dataLength); break;
          case "00081030": info["Estudo"] = readString(dataOffset, dataLength); break;
          case "0008103e": info["Série"] = readString(dataOffset, dataLength); break;
          case "00080020": info["Data"] = readString(dataOffset, dataLength); break;
          case "00080080": info["Instituição"] = readString(dataOffset, dataLength); break;
          case "00280010": rows = readUint16(dataOffset); break;
          case "00280011": cols = readUint16(dataOffset); break;
          case "00280100": bitsAllocated = readUint16(dataOffset); break;
          case "00280101": bitsStored = readUint16(dataOffset); break;
          case "00280002": samplesPerPixel = readUint16(dataOffset); break;
          case "00280004": photometric = readString(dataOffset, dataLength); break;
          case "00281050": wc = parseFloat(readString(dataOffset, dataLength)) || 0; break;
          case "00281051": ww = parseFloat(readString(dataOffset, dataLength)) || 0; break;
          case "00280103": pixelRep = readUint16(dataOffset); break;
          case "00281052": intercept = parseFloat(readString(dataOffset, dataLength)) || 0; break;
          case "00281053": slope = parseFloat(readString(dataOffset, dataLength)) || 1; break;
        }
        if (group === 0x7FE0 && element === 0x0010) { pixelDataOffset = dataOffset; break; }
        offset = dataOffset + dataLength;
        if (offset % 2 !== 0) offset++;
      }

      info["Formato"] = "DICOM";
      info["Dimensões"] = `${cols}×${rows}`;
      info["Bits"] = `${bitsStored}/${bitsAllocated}`;
      setDicomInfo(info);

      if (pixelDataOffset > 0 && rows > 0 && cols > 0) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = cols;
        canvas.height = rows;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const imgData = ctx.createImageData(cols, rows);
        const totalPixels = rows * cols;

        if (samplesPerPixel === 3) {
          for (let i = 0; i < totalPixels; i++) {
            imgData.data[i * 4] = bytes[pixelDataOffset + i * 3];
            imgData.data[i * 4 + 1] = bytes[pixelDataOffset + i * 3 + 1];
            imgData.data[i * 4 + 2] = bytes[pixelDataOffset + i * 3 + 2];
            imgData.data[i * 4 + 3] = 255;
          }
        } else {
          const pixelValues = new Float32Array(totalPixels);
          let min = Infinity, max = -Infinity;
          for (let i = 0; i < totalPixels; i++) {
            let rawValue: number;
            if (bitsAllocated === 16) {
              const idx = pixelDataOffset + i * 2;
              rawValue = bytes[idx] | (bytes[idx + 1] << 8);
              if (pixelRep === 1 && rawValue > (1 << (bitsStored - 1))) rawValue -= (1 << bitsStored);
            } else { rawValue = bytes[pixelDataOffset + i]; }
            const hu = rawValue * slope + intercept;
            pixelValues[i] = hu;
            if (hu < min) min = hu;
            if (hu > max) max = hu;
          }
          const center = wc || (min + max) / 2;
          const width = ww || (max - min) || 1;
          const lower = center - width / 2;
          const upper = center + width / 2;
          const isMono1 = photometric.includes("MONOCHROME1");
          for (let i = 0; i < totalPixels; i++) {
            let val = ((pixelValues[i] - lower) / (upper - lower)) * 255;
            val = Math.max(0, Math.min(255, val));
            if (isMono1) val = 255 - val;
            imgData.data[i * 4] = val;
            imgData.data[i * 4 + 1] = val;
            imgData.data[i * 4 + 2] = val;
            imgData.data[i * 4 + 3] = 255;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }
    } catch { /* parse error */ }
    setLoading(false);
  };

  const resetView = () => { setZoom(1); setRotation(0); setBrightness(100); setContrast(100); setFlipH(false); setFlipV(false); };

  const toolButtons = [
    { id: "pan" as const, icon: Move, label: "Arrastar" },
    { id: "zoom" as const, icon: ZoomIn, label: "Zoom" },
    { id: "measure" as const, icon: Ruler, label: "Medição" },
    { id: "annotate" as const, icon: Pencil, label: "Anotação" },
  ];

  return (
    <div className="flex flex-col h-full bg-black text-white/80">
      {/* PACS Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 bg-[hsl(var(--card))]/90 border-b border-white/10 text-[11px] flex-wrap">
        <TooltipProvider delayDuration={200}>
          {/* Series navigation */}
          <div className="flex items-center gap-0.5 mr-2">
            <Tooltip><TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setActiveIndex(i => Math.max(0, i - 1))} disabled={activeIndex === 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="bottom">Série anterior</TooltipContent></Tooltip>
            <span className="text-[10px] text-white/50 min-w-[40px] text-center">
              {fileUrls.length > 0 ? `${activeIndex + 1}/${fileUrls.length}` : "0/0"}
            </span>
            <Tooltip><TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setActiveIndex(i => Math.min(fileUrls.length - 1, i + 1))} disabled={activeIndex >= fileUrls.length - 1}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="bottom">Próxima série</TooltipContent></Tooltip>
          </div>

          <Separator orientation="vertical" className="h-5 bg-white/10 mx-1" />

          {/* Tools */}
          {toolButtons.map(t => (
            <Tooltip key={t.id}><TooltipTrigger asChild>
              <Button size="icon" variant="ghost"
                className={`h-7 w-7 ${tool === t.id ? "bg-primary/30 text-primary" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                onClick={() => setTool(t.id)}>
                <t.icon className="w-4 h-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="bottom">{t.label}</TooltipContent></Tooltip>
          ))}

          <Separator orientation="vertical" className="h-5 bg-white/10 mx-1" />

          {/* Zoom controls */}
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setZoom(z => Math.min(z + 0.25, 6))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Zoom +</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setZoom(z => Math.max(z - 0.25, 0.1))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Zoom −</TooltipContent></Tooltip>
          <span className="text-[10px] text-white/40 mx-1 min-w-[32px] text-center">{Math.round(zoom * 100)}%</span>

          <Separator orientation="vertical" className="h-5 bg-white/10 mx-1" />

          {/* Window/Level */}
          <div className="flex items-center gap-1">
            <Sun className="w-3 h-3 text-white/40" />
            <input type="range" min="0" max="300" value={brightness}
              onChange={e => setBrightness(+e.target.value)}
              className="w-14 h-1 accent-primary cursor-pointer" />
          </div>
          <div className="flex items-center gap-1">
            <Contrast className="w-3 h-3 text-white/40" />
            <input type="range" min="0" max="300" value={contrast}
              onChange={e => setContrast(+e.target.value)}
              className="w-14 h-1 accent-primary cursor-pointer" />
          </div>

          <Separator orientation="vertical" className="h-5 bg-white/10 mx-1" />

          {/* Transform */}
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setRotation(r => (r + 90) % 360)}>
              <RotateCw className="w-4 h-4" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Rotacionar</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className={`h-7 w-7 ${flipH ? "bg-primary/30 text-primary" : "text-white/70 hover:text-white hover:bg-white/10"}`}
              onClick={() => setFlipH(f => !f)}>
              <FlipHorizontal className="w-4 h-4" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Espelhar H</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className={`h-7 w-7 ${flipV ? "bg-primary/30 text-primary" : "text-white/70 hover:text-white hover:bg-white/10"}`}
              onClick={() => setFlipV(f => !f)}>
              <FlipVertical className="w-4 h-4" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Espelhar V</TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
              onClick={resetView}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Restaurar</TooltipContent></Tooltip>

          <div className="flex-1" />

          {/* Layout / Fullscreen */}
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => containerRef.current?.requestFullscreen?.()}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Tela cheia</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10">
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Layout</TooltipContent></Tooltip>
        </TooltipProvider>
      </div>

      {/* Main viewer area */}
      <div className="flex flex-1 min-h-0">
        {/* Series thumbnails sidebar */}
        {fileUrls.length > 1 && (
          <div className="w-36 border-r border-white/10 bg-black/80 overflow-y-auto flex-shrink-0">
            <div className="p-1.5 space-y-1.5">
              {fileUrls.map((url, i) => {
                const originalPath = (examRequest?.file_urls as string[])?.[i] || "";
                const isDicom = originalPath.toLowerCase().endsWith(".dcm") || originalPath.toLowerCase().endsWith(".dicom");
                return (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`w-full rounded overflow-hidden border-2 transition-all ${
                      i === activeIndex
                        ? "border-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="aspect-square bg-black/60 flex items-center justify-center relative">
                      {isDicom ? (
                        <ImageIcon className="w-6 h-6 text-white/30" />
                      ) : (
                        <img src={url} alt={`Série ${i + 1}`} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5 flex justify-between">
                        <span className="text-[9px] text-white/60">s: {i + 1}</span>
                        <span className="text-[9px] text-primary">📁 {i + 1}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main canvas */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!activeUrl && !loading && (
            <div className="flex flex-col items-center gap-3 text-white/30">
              <Monitor className="w-16 h-16" />
              <p className="text-sm">Nenhum arquivo de exame disponível</p>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className={loading && !canvasRef.current?.width ? "hidden" : ""}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
              filter: `brightness(${brightness}%) contrast(${contrast}%)`,
              transition: "transform 0.15s ease, filter 0.1s ease",
              maxWidth: "100%",
              maxHeight: "100%",
              imageRendering: "auto",
            }}
          />

          {/* Patient info overlay (top-left) */}
          {Object.keys(dicomInfo).length > 0 && (
            <div className="absolute top-2 left-2 text-[11px] font-mono text-cyan-300/80 leading-relaxed pointer-events-none">
              {dicomInfo["Paciente"] && <div>Nome: {dicomInfo["Paciente"]}</div>}
              {dicomInfo["Data"] && <div>Data: {dicomInfo["Data"]}</div>}
              {dicomInfo["Modalidade"] && <div>Mod: {dicomInfo["Modalidade"]}</div>}
              {dicomInfo["Estudo"] && <div>{dicomInfo["Estudo"]}</div>}
            </div>
          )}

          {/* Dimensions overlay (top-right) */}
          {dicomInfo["Dimensões"] && (
            <div className="absolute top-2 right-2 text-[10px] font-mono text-white/40 pointer-events-none">
              {dicomInfo["Dimensões"]} · {dicomInfo["Bits"]}
            </div>
          )}

          {/* Clinical info overlay (bottom) */}
          {examRequest?.clinical_info && (
            <div className="absolute bottom-2 left-2 right-2 text-[10px] font-mono text-yellow-300/60 pointer-events-none truncate">
              Clínica: {examRequest.clinical_info}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN EDITOR ====================
const ExamReportEditor = () => {
  const { examId } = useParams<{ examId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLaudista = location.pathname.includes("/laudista/");
  const backRoute = isLaudista ? "/dashboard/laudista/queue?role=doctor" : "/dashboard/doctor/report-queue?role=doctor";
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [signing, setSigning] = useState(false);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Voice
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recognitionRef = useRef<Record<string, unknown> | null>(null);
  const [interimText, setInterimText] = useState("");

  // AI
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiMode, setAiMode] = useState<"structure" | "improve" | "suggest_conclusion">("structure");

  // Macros
  const [showMacros, setShowMacros] = useState(false);
  const macroCategories = [...new Set(REPORT_MACROS.map((m) => m.category))];

  // ---- Speech Recognition ----
  useEffect(() => {
    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition) { setVoiceSupported(false); return; }

    let audioStream: MediaStream | null = null;
    const initNoiseFilter = async () => {
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch { /* fallback */ }
    };

    const recognition = new (SpeechRecognition as unknown as { new(): { lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: SpeechRecognitionEvent) => void) | null; onerror: ((e: SpeechRecognitionErrorEvent) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void } })();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "", finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript + " ";
        else interim += transcript;
      }
      setInterimText(interim);
      if (finalText.trim()) {
        setContent(prev => {
          const newContent = prev ? prev + " " + finalText.trim() : finalText.trim();
          const macro = findMacro(newContent);
          if (macro) { toast("📝 Macro aplicada", { description: macro.label }); return applyMacro(newContent, macro); }
          return newContent;
        });
      }
    };
    recognition.onerror = () => { setListening(false); setInterimText(""); };
    recognition.onend = () => {
      const ref = recognitionRef.current;
      if (ref?._shouldRestart) { try { recognition.start(); } catch {} }
      else { setListening(false); setInterimText(""); }
    };

    recognitionRef.current = recognition as unknown as Record<string, unknown>;
    (recognitionRef.current as Record<string, unknown>)._initNoise = initNoiseFilter;

    return () => {
      try { (recognition as { stop: () => void }).stop(); } catch {}
      if (audioStream) audioStream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const toggleListening = useCallback(async () => {
    const ref = recognitionRef.current;
    if (!ref) return;
    if (listening) {
      ref._shouldRestart = false;
      (ref as unknown as { stop: () => void }).stop();
      setListening(false); setInterimText("");
    } else {
      try {
        if (typeof ref._initNoise === "function") {
          await (ref._initNoise as () => Promise<void>)();
          ref._initNoise = null;
        }
        ref._shouldRestart = true;
        (ref as unknown as { start: () => void }).start();
        setListening(true);
        toast("🎙️ Ditado ativado", { description: "Filtro de ruído ativo." });
      } catch { /* fail */ }
    }
  }, [listening]);

  // ---- Queries ----
  const { data: doctorProfile } = useQuery({
    queryKey: ["doctor-profile-editor", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("doctor_profiles").select("id, crm, crm_state").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-editor", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: examRequest, isLoading: loadingExam } = useQuery({
    queryKey: ["exam-request-detail", examId],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_requests" as never).select("*").eq("id", examId!).maybeSingle();
      if (error) throw error;
      return data as unknown as ExamRequest | null;
    },
    enabled: !!examId,
  });

  const { data: existingReport } = useQuery({
    queryKey: ["exam-report-existing", examId],
    queryFn: async () => {
      const { data } = await supabase.from("exam_reports" as never).select("*").eq("exam_request_id", examId!).maybeSingle();
      return data as unknown as ExamReport | null;
    },
    enabled: !!examId,
  });

  const { data: templates } = useQuery({
    queryKey: ["report-templates"],
    queryFn: async () => {
      const { data } = await supabase.from("report_templates" as never).select("*").eq("is_active", true).order("title");
      return (data ?? []) as unknown as ReportTemplate[];
    },
  });

  // ---- Auto-save ----
  const autoSaveDraft = useCallback(async (text: string) => {
    if (!doctorProfile?.id || !examId || !text.trim()) return;
    setAutoSaveStatus("saving");
    try {
      if (existingReport?.id) {
        await supabase.from("exam_reports" as any).update({ content_text: text } as any).eq("id", existingReport.id);
      } else {
        await supabase.from("exam_reports" as any).insert({ exam_request_id: examId, reporter_id: doctorProfile.id, content_text: text } as any);
        queryClient.invalidateQueries({ queryKey: ["exam-report-existing", examId] });
      }
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    } catch { setAutoSaveStatus("idle"); }
  }, [doctorProfile?.id, examId, existingReport?.id, queryClient]);

  const handleContentChange = (newContent: string) => {
    const macro = findMacro(newContent);
    if (macro) {
      const applied = applyMacro(newContent, macro);
      setContent(applied);
      toast("📝 Macro aplicada", { description: macro.label });
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => autoSaveDraft(applied), 5000);
      return;
    }
    setContent(newContent);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => autoSaveDraft(newContent), 5000);
  };

  useEffect(() => { if (existingReport?.content_text) setContent(existingReport.content_text); }, [existingReport]);

  useEffect(() => {
    if (!existingReport || !doctorProfile) return;
    if (existingReport.reporter_id && existingReport.reporter_id !== doctorProfile.id) {
      toast.error("Acesso negado"); navigate(backRoute);
    }
  }, [existingReport, doctorProfile]);

  // ---- File URLs ----
  useEffect(() => {
    if (!examRequest?.file_urls) return;
    const urls = examRequest.file_urls as string[];
    if (!urls.length) return;
    Promise.all(
      urls.map(async (path: string) => {
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        if (path.startsWith("/")) return path;
        const { data } = await supabase.storage.from("exam-files").createSignedUrl(path, 3600);
        return data?.signedUrl || "";
      })
    ).then(resolved => setFileUrls(resolved.filter(Boolean)));
  }, [examRequest]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = templates?.find((t: { id: string; body_text: string }) => t.id === templateId);
    if (tpl) setContent(tpl.body_text);
  };

  // ---- AI ----
  const handleAiProcess = async (mode: "structure" | "improve" | "suggest_conclusion") => {
    if (!content.trim()) { toast.error("Texto vazio"); return; }
    setAiProcessing(true); setAiMode(mode);
    try {
      const { data, error } = await supabase.functions.invoke("structure-report", {
        body: { raw_text: content, exam_type: examRequest?.exam_type || "", clinical_info: examRequest?.clinical_info || "", mode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.structured_text) {
        if (mode === "suggest_conclusion") setContent(prev => prev + "\n\n" + data.structured_text);
        else setContent(data.structured_text);
        toast.success("✨ IA aplicada");
      }
    } catch (err: unknown) {
      toast.error("Erro na IA", { description: err instanceof Error ? err.message : "Tente novamente." });
    } finally { setAiProcessing(false); }
  };

  const insertMacro = (macroId: string) => {
    const macro = REPORT_MACROS.find(m => m.id === macroId);
    if (!macro) return;
    setContent(prev => prev ? `${prev}\n\n${macro.text}` : macro.text);
    setShowMacros(false);
    toast("📝 Macro inserida", { description: macro.label });
  };

  // ---- Sign ----
  const handleSignAndFinalize = async () => {
    if (!doctorProfile?.id || !content.trim()) { toast.error("Preencha o laudo antes de assinar."); return; }
    setSigning(true);
    try {
      const documentHash = await gerarHashDocumento(content);
      const verificationCode = gerarCodigoVerificacao();
      const doctorName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();

      const pdf = new jsPDF();
      pdf.setFontSize(16);
      pdf.text("LAUDO MÉDICO", 105, 20, { align: "center" });
      pdf.setFontSize(10);
      pdf.text(`Tipo de Exame: ${examRequest?.exam_type || ""}`, 20, 35);
      pdf.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 20, 42);
      pdf.text(`Médico Laudista: Dr(a). ${doctorName}`, 20, 49);
      pdf.text(`CRM: ${doctorProfile.crm}/${doctorProfile.crm_state}`, 20, 56);

      if (examRequest?.clinical_info) {
        pdf.setFontSize(11);
        pdf.text("Informações Clínicas:", 20, 68);
        pdf.setFontSize(9);
        const clinicalLines = pdf.splitTextToSize(examRequest.clinical_info, 170);
        pdf.text(clinicalLines, 20, 75);
      }

      pdf.setFontSize(11);
      const yStart = examRequest?.clinical_info ? 75 + pdf.splitTextToSize(examRequest.clinical_info, 170).length * 5 + 10 : 68;
      pdf.text("Laudo:", 20, yStart);
      pdf.setFontSize(9);
      const contentLines = pdf.splitTextToSize(content, 170);
      pdf.text(contentLines, 20, yStart + 7);

      pdf.setFontSize(7);
      pdf.text(`Código de Verificação: ${verificationCode}`, 20, 280);
      pdf.text(`Hash SHA-256: ${documentHash.substring(0, 32)}...`, 20, 284);

      const pdfBlob = pdf.output("blob");
      const pdfPath = `reports/${examId}/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage.from("prescriptions").upload(pdfPath, pdfBlob, { contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      if (existingReport?.id) {
        const { error } = await supabase.from("exam_reports" as any).update({
          content_text: content, template_id: selectedTemplateId || null, pdf_url: pdfPath,
          document_hash: documentHash, verification_code: verificationCode, signed_at: new Date().toISOString(),
        } as any).eq("id", existingReport.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exam_reports" as any).insert({
          exam_request_id: examId, reporter_id: doctorProfile.id, content_text: content,
          template_id: selectedTemplateId || null, pdf_url: pdfPath, document_hash: documentHash,
          verification_code: verificationCode, signed_at: new Date().toISOString(),
        } as any);
        if (error) throw error;
      }

      await supabase.from("exam_requests" as any).update({ status: "reported" } as any).eq("id", examId);

      try {
        await supabase.functions.invoke("vidaas-sign", {
          body: { action: "sign", document_hash: documentHash, document_type: "exam_report", doctor_name: doctorName, doctor_crm: `${doctorProfile.crm}/${doctorProfile.crm_state}`, verification_code: verificationCode },
        });
      } catch {}

      await supabase.from("document_verifications").insert({
        doctor_name: doctorName, doctor_crm: `${doctorProfile.crm}/${doctorProfile.crm_state}`,
        patient_name: "Paciente", document_type: "exam_report", document_hash: documentHash, verification_code: verificationCode,
      });

      if (examRequest?.requesting_doctor_id) {
        const { data: reqDoctor } = await supabase.from("doctor_profiles").select("user_id").eq("id", examRequest.requesting_doctor_id).maybeSingle();
        if (reqDoctor?.user_id) {
          await supabase.from("notifications").insert({ user_id: reqDoctor.user_id, title: "📋 Laudo Concluído", message: `O laudo do exame ${examRequest.exam_type} foi finalizado.`, type: "exam_report", link: `/dashboard/doctor/report-editor/${examId}?role=doctor` });
        }
      }
      if (examRequest?.patient_id) {
        const { data: patientProfile } = await supabase.from("profiles").select("user_id, first_name, phone").eq("user_id", examRequest.patient_id).maybeSingle();
        if (patientProfile) {
          await supabase.from("notifications").insert({ user_id: patientProfile.user_id, title: "📋 Seu laudo está pronto!", message: `O laudo do exame ${examRequest.exam_type} foi concluído.`, type: "exam_report", link: "/dashboard/health" });
          if (patientProfile.phone) {
            supabase.functions.invoke("send-whatsapp", { body: { phone: patientProfile.phone, message: `🩺 *Allo Médico* — Laudo Pronto!\n\nOlá, ${patientProfile.first_name}!\nSeu laudo de *${examRequest.exam_type}* foi finalizado pelo Dr(a). ${doctorName}.\n\nCódigo: ${verificationCode}` } }).catch(() => {});
          }
        }
      }

      toast.success("Laudo assinado e finalizado!", { description: `Código: ${verificationCode}` });
      queryClient.invalidateQueries({ queryKey: ["exam-requests-queue"] });
      navigate(backRoute);
    } catch (err: unknown) {
      toast.error("Erro ao assinar", { description: err instanceof Error ? err.message : "Erro desconhecido" });
    } finally { setSigning(false); }
  };

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (content.trim()) autoSaveDraft(content);
        toast.success("Salvo!");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isReported) handleSignAndFinalize();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [content, autoSaveDraft]);

  if (loadingExam) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isReported = examRequest?.status === "reported" && existingReport?.signed_at;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border bg-card text-sm shrink-0">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigate(backRoute)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          <FileSignature className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold truncate">Editor de Laudo</span>
          {examRequest?.exam_type && (
            <Badge variant="outline" className="text-[10px] shrink-0">{examRequest.exam_type}</Badge>
          )}
          {examRequest?.priority === "urgent" && (
            <Badge variant="destructive" className="text-[10px] shrink-0">
              <AlertTriangle className="w-3 h-3 mr-0.5" /> Urgente
            </Badge>
          )}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Keyboard className="w-3 h-3" />
          <span>Ctrl+S salvar · Ctrl+Enter assinar</span>
        </div>
      </div>

      {/* Main content: PACS viewer + Editor */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          {/* DICOM Viewer */}
          <ResizablePanel defaultSize={55} minSize={30}>
            <PacsViewer fileUrls={fileUrls} examRequest={examRequest || null} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Report Editor */}
          <ResizablePanel defaultSize={45} minSize={25}>
            <div className="flex flex-col h-full bg-card">
              {/* Editor header */}
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{isReported ? "Laudo Finalizado" : "Redigir Laudo"}</span>
                </div>
                {autoSaveStatus !== "idle" && !isReported && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    {autoSaveStatus === "saving" && <><Loader2 className="w-3 h-3 animate-spin" /> Salvando...</>}
                    {autoSaveStatus === "saved" && <><Save className="w-3 h-3 text-green-500" /> Salvo</>}
                  </div>
                )}
              </div>

              {/* Editor toolbar */}
              {!isReported && (
                <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 border-b border-border bg-muted/30">
                  {templates && templates.length > 0 && (
                    <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                      <SelectTrigger className="h-7 text-[11px] w-auto min-w-[120px]">
                        <SelectValue placeholder="Template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t: { id: string; title: string; exam_type: string }) => (
                          <SelectItem key={t.id} value={t.id}>{t.title} ({t.exam_type})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {voiceSupported && (
                    <Button type="button" variant={listening ? "destructive" : "outline"} size="sm"
                      onClick={toggleListening} className="h-7 text-[11px] px-2">
                      {listening ? <><MicOff className="w-3 h-3 mr-1" /><span className="animate-pulse">Ditando</span></> :
                        <><Mic className="w-3 h-3 mr-1" />Ditar</>}
                    </Button>
                  )}

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" disabled={aiProcessing}>
                        {aiProcessing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        IA <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-1.5" align="start">
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7" onClick={() => handleAiProcess("structure")} disabled={aiProcessing}>
                        <Wand2 className="w-3 h-3 mr-2" /> Estruturar Laudo
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7" onClick={() => handleAiProcess("improve")} disabled={aiProcessing}>
                        <Sparkles className="w-3 h-3 mr-2" /> Melhorar Redação
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7" onClick={() => handleAiProcess("suggest_conclusion")} disabled={aiProcessing}>
                        <Lightbulb className="w-3 h-3 mr-2" /> Sugerir Conclusão
                      </Button>
                      <p className="text-[9px] text-muted-foreground mt-1 px-1">A IA auxilia na redação. Revise sempre.</p>
                    </PopoverContent>
                  </Popover>

                  <Popover open={showMacros} onOpenChange={setShowMacros}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2">
                        <BookText className="w-3 h-3 mr-1" /> Macros
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-1.5 max-h-72 overflow-y-auto" align="start">
                      {macroCategories.map(cat => (
                        <div key={cat} className="mb-1.5">
                          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-0.5">{cat}</p>
                          {REPORT_MACROS.filter(m => m.category === cat).map(m => (
                            <Button key={m.id} variant="ghost" size="sm" className="w-full justify-start text-[11px] h-6" onClick={() => insertMacro(m.id)}>
                              {m.label} <span className="ml-auto text-muted-foreground font-mono text-[9px]">{m.trigger}</span>
                            </Button>
                          ))}
                        </div>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Voice interim */}
              {listening && interimText && (
                <div className="mx-3 mt-1.5 bg-primary/5 border border-primary/20 rounded px-2 py-1 text-xs text-primary animate-pulse">
                  🎙️ {interimText}
                </div>
              )}

              {/* Editor area */}
              <div className="flex-1 relative min-h-0 p-3">
                <Textarea
                  value={content}
                  onChange={e => handleContentChange(e.target.value)}
                  placeholder={listening ? "Fale agora..." : "Digite o laudo ou use /comandos para macros..."}
                  className="h-full resize-none text-sm font-mono leading-relaxed border-0 bg-transparent focus-visible:ring-0 p-0"
                  readOnly={!!isReported}
                />
                {aiProcessing && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-md">
                    <div className="flex items-center gap-2 bg-card border rounded-lg px-4 py-2 shadow-lg">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm">
                        {aiMode === "structure" ? "Estruturando..." : aiMode === "improve" ? "Melhorando..." : "Gerando conclusão..."}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-3 py-2 border-t border-border">
                {isReported ? (
                  <div className="space-y-1.5">
                    <Badge className="bg-primary/10 text-primary border-primary/30" variant="outline">
                      ✅ Assinado em {existingReport?.signed_at ? new Date(existingReport.signed_at).toLocaleString("pt-BR") : ""}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground">
                      Código: {existingReport?.verification_code} | Hash: {existingReport?.document_hash?.substring(0, 16)}...
                    </p>
                    {existingReport?.pdf_url && (
                      <Button size="sm" variant="outline" onClick={async () => {
                        const { data } = await supabase.storage.from("prescriptions").createSignedUrl(existingReport.pdf_url!, 3600);
                        if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                      }}>
                        <Download className="w-3 h-3 mr-1" /> Baixar PDF
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button onClick={handleSignAndFinalize} disabled={signing || !content.trim()} className="w-full h-9">
                    {signing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSignature className="w-4 h-4 mr-2" />}
                    {signing ? "Assinando..." : "Assinar e Finalizar Laudo"}
                  </Button>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default ExamReportEditor;
