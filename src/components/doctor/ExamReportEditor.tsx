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
  Loader2, FileSignature, Download, Save, ImageIcon, Upload,
  Mic, MicOff, Sparkles, Wand2, BookText, ChevronDown, Lightbulb,
  ZoomIn, ZoomOut, RotateCw, Contrast, Maximize2, Sun, Move, Ruler,
  ArrowLeft, ChevronLeft, ChevronRight, Grid3X3, Monitor, Eye,
  Crosshair, RotateCcw, FlipHorizontal, FlipVertical, Pencil,
  Type, Play, MoreHorizontal, Keyboard, FileText, Clock, AlertTriangle,
  Info, Clipboard
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gerarHashDocumento, gerarCodigoVerificacao } from "@/lib/signature";
import { REPORT_MACROS, findMacro, applyMacro } from "@/lib/report-macros";
import jsPDF from "jspdf";
import type { ExamRequest, ExamReport, ReportTemplate } from "@/types/domain";

// ==================== WL PRESETS (Weasis/OsiriX) ====================
const WL_PRESETS = [
  { label: "Default", ww: 0, wl: 0, icon: "🔄" },
  { label: "Osso", ww: 2500, wl: 480, icon: "🦴" },
  { label: "Pulmão", ww: 1500, wl: -600, icon: "🫁" },
  { label: "Abdômen", ww: 400, wl: 50, icon: "🫃" },
  { label: "Cérebro", ww: 80, wl: 40, icon: "🧠" },
  { label: "Mediastino", ww: 350, wl: 50, icon: "❤️" },
  { label: "Fígado", ww: 150, wl: 30, icon: "🫀" },
  { label: "Tecido Mole", ww: 400, wl: 40, icon: "💪" },
];

type Measurement = {
  id: string;
  type: "length" | "angle" | "ellipse" | "rectangle" | "bidirectional";
  points: { x: number; y: number }[];
  value?: string;
};

type Annotation = {
  id: string;
  x: number;
  y: number;
  text: string;
};

// ==================== DICOM VIEWER PANEL (PACS-style Pro) ====================
const PacsViewer = ({
  fileUrls,
  examRequest,
  onFilesUploaded,
}: {
  fileUrls: string[];
  examRequest: ExamRequest | null;
  onFilesUploaded?: (newUrls: string[]) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [loading, setLoading] = useState(false);
  const [tool, setTool] = useState<"pan" | "zoom" | "wl" | "measure" | "angle" | "ellipse" | "rectangle" | "bidirectional" | "annotate" | "magnify" | "stackScroll" | "windowROI" | "proof">("pan");
  const [showMeasurementsPanel, setShowMeasurementsPanel] = useState(false);
  const [dicomInfo, setDicomInfo] = useState<Record<string, string>>({});
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [invert, setInvert] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; hu?: number } | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeMeasurement, setActiveMeasurement] = useState<Measurement | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [activePreset, setActivePreset] = useState("Default");
  const [cinePlay, setCinePlay] = useState(false);
  const [cineSpeed, setCineSpeed] = useState(200);
  const cineRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pixelDataRef = useRef<{ values: Float32Array; rows: number; cols: number } | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const [dualView, setDualView] = useState(false);
  const [dualIndex, setDualIndex] = useState(1);
  const [showSidebar, setShowSidebar] = useState(true);
  const [imageNaturalSize, setImageNaturalSize] = useState({ w: 0, h: 0 });

  const activeUrl = fileUrls[activeIndex] || null;

  // CINE playback (OHIF-inspired)
  useEffect(() => {
    if (cinePlay && fileUrls.length > 1) {
      cineRef.current = setInterval(() => {
        setActiveIndex(i => (i + 1) % fileUrls.length);
      }, cineSpeed);
    } else {
      if (cineRef.current) clearInterval(cineRef.current);
    }
    return () => { if (cineRef.current) clearInterval(cineRef.current); };
  }, [cinePlay, fileUrls.length, cineSpeed]);

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
          setImageNaturalSize({ w: img.width, h: img.height });
          pixelDataRef.current = null;
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
          case "00100030": info["Nascimento"] = readString(dataOffset, dataLength); break;
          case "00100040": info["Sexo"] = readString(dataOffset, dataLength); break;
          case "00080060": info["Modalidade"] = readString(dataOffset, dataLength); break;
          case "00081030": info["Estudo"] = readString(dataOffset, dataLength); break;
          case "0008103e": info["Série"] = readString(dataOffset, dataLength); break;
          case "00080020": info["Data Estudo"] = readString(dataOffset, dataLength); break;
          case "00080030": info["Hora Estudo"] = readString(dataOffset, dataLength); break;
          case "00080080": info["Instituição"] = readString(dataOffset, dataLength); break;
          case "00080090": info["Médico Ref."] = readString(dataOffset, dataLength); break;
          case "00181030": info["Protocolo"] = readString(dataOffset, dataLength); break;
          case "00200013": info["Instância"] = readString(dataOffset, dataLength); break;
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
          case "00280030": info["Pixel Spacing"] = readString(dataOffset, dataLength); break;
          case "00180050": info["Espessura"] = readString(dataOffset, dataLength) + " mm"; break;
        }
        if (group === 0x7FE0 && element === 0x0010) { pixelDataOffset = dataOffset; break; }
        offset = dataOffset + dataLength;
        if (offset % 2 !== 0) offset++;
      }

      info["Formato"] = "DICOM";
      info["Dimensões"] = `${cols}×${rows}`;
      setImageNaturalSize({ w: cols, h: rows });
      info["Bits"] = `${bitsStored}/${bitsAllocated}`;
      if (wc) info["WC"] = String(Math.round(wc));
      if (ww) info["WW"] = String(Math.round(ww));
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
          pixelDataRef.current = null;
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
          // Store pixel data for HU readout (OsiriX feature)
          pixelDataRef.current = { values: pixelValues, rows, cols };

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

  // Apply WL preset (Weasis-inspired)
  const applyPreset = (preset: typeof WL_PRESETS[0]) => {
    setActivePreset(preset.label);
    if (preset.label === "Default") {
      setBrightness(100); setContrast(100);
    } else {
      // Map WW/WL to brightness/contrast CSS filters
      const normBrightness = Math.max(20, Math.min(300, 100 + (preset.wl / 10)));
      const normContrast = Math.max(20, Math.min(300, 50 + (preset.ww / 20)));
      setBrightness(normBrightness);
      setContrast(normContrast);
    }
    setShowPresets(false);
    toast.success(`Preset: ${preset.icon} ${preset.label}`);
  };

  const resetView = () => {
    setZoom(1); setRotation(0); setBrightness(100); setContrast(100);
    setFlipH(false); setFlipV(false); setInvert(false);
    setActivePreset("Default"); setPanOffset({ x: 0, y: 0 });
    setMeasurements([]); setAnnotations([]);
  };

  // Mouse handlers for measurements and pan (OHIF-inspired)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (tool === "pan" || tool === "stackScroll") {
      isPanningRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    } else if (tool === "measure" || tool === "angle" || tool === "bidirectional") {
      const newM: Measurement = {
        id: crypto.randomUUID(),
        type: tool === "measure" ? "length" : tool === "angle" ? "angle" : "bidirectional",
        points: [{ x, y }],
      };
      setActiveMeasurement(newM);
    } else if (tool === "ellipse" || tool === "rectangle") {
      const newM: Measurement = {
        id: crypto.randomUUID(),
        type: tool === "ellipse" ? "ellipse" : "rectangle",
        points: [{ x, y }],
      };
      setActiveMeasurement(newM);
    } else if (tool === "annotate") {
      const text = prompt("Texto da anotação:");
      if (text) {
        setAnnotations(prev => [...prev, { id: crypto.randomUUID(), x, y, text }]);
      }
    } else if (tool === "windowROI") {
      // Window ROI - measure mean HU in a region
      const newM: Measurement = {
        id: crypto.randomUUID(),
        type: "rectangle",
        points: [{ x, y }],
      };
      setActiveMeasurement(newM);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / zoom);
    const y = Math.round((e.clientY - rect.top) / zoom);

    // HU readout (OsiriX feature)
    if (pixelDataRef.current) {
      const { values, rows, cols } = pixelDataRef.current;
      if (x >= 0 && x < cols && y >= 0 && y < rows) {
        const hu = values[y * cols + x];
        setCursorPos({ x, y, hu: Math.round(hu) });
      } else {
        setCursorPos({ x, y });
      }
    } else {
      setCursorPos({ x, y });
    }

    // Pan or Stack Scroll
    if (isPanningRef.current && tool === "pan") {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    } else if (isPanningRef.current && tool === "stackScroll" && fileUrls.length > 1) {
      const dy = e.clientY - lastMouseRef.current.y;
      if (Math.abs(dy) > 15) {
        if (dy > 0) setActiveIndex(i => Math.min(fileUrls.length - 1, i + 1));
        else setActiveIndex(i => Math.max(0, i - 1));
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    }

    // Active measurement
    if (activeMeasurement) {
      const updatedPoints = [...activeMeasurement.points];
      if (updatedPoints.length === 1) {
        updatedPoints.push({ x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom });
      } else {
        updatedPoints[updatedPoints.length - 1] = { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
      }
      setActiveMeasurement({ ...activeMeasurement, points: updatedPoints });
    }
  };

  const handleCanvasMouseUp = () => {
    isPanningRef.current = false;
    if (activeMeasurement && activeMeasurement.points.length >= 2) {
      const p = activeMeasurement.points;
      let value = "";
      if (activeMeasurement.type === "length") {
        const dx = p[1].x - p[0].x;
        const dy = p[1].y - p[0].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const spacing = dicomInfo["Pixel Spacing"];
        if (spacing) {
          const [sy, sx] = spacing.split("\\").map(Number);
          value = `${(dist * ((sx + sy) / 2)).toFixed(1)} mm`;
        } else {
          value = `${dist.toFixed(1)} px`;
        }
      } else if (activeMeasurement.type === "angle" && p.length >= 2) {
        value = `${Math.round(Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x) * 180 / Math.PI)}°`;
      } else if (activeMeasurement.type === "ellipse") {
        const rx = Math.abs(p[1].x - p[0].x);
        const ry = Math.abs(p[1].y - p[0].y);
        const area = Math.PI * rx * ry;
        value = `Área: ${area.toFixed(0)} px²`;
      } else if (activeMeasurement.type === "rectangle") {
        const w = Math.abs(p[1].x - p[0].x);
        const h = Math.abs(p[1].y - p[0].y);
        const area = w * h;
        const spacing = dicomInfo["Pixel Spacing"];
        if (spacing) {
          const [sy, sx] = spacing.split("\\").map(Number);
          value = `${(w * sx).toFixed(1)}×${(h * sy).toFixed(1)} mm — Área: ${(area * sx * sy).toFixed(0)} mm²`;
        } else {
          value = `${w.toFixed(0)}×${h.toFixed(0)} px — Área: ${area.toFixed(0)} px²`;
        }
      } else if (activeMeasurement.type === "bidirectional") {
        const dx = p[1].x - p[0].x;
        const dy = p[1].y - p[0].y;
        const major = Math.sqrt(dx * dx + dy * dy);
        // Perpendicular bisector line (approximate)
        const spacing = dicomInfo["Pixel Spacing"];
        if (spacing) {
          const [sy, sx] = spacing.split("\\").map(Number);
          value = `Maior: ${(major * ((sx + sy) / 2)).toFixed(1)} mm`;
        } else {
          value = `Maior: ${major.toFixed(1)} px`;
        }
      }
      setMeasurements(prev => [...prev, { ...activeMeasurement, value }]);
      setActiveMeasurement(null);
    }
  };

  // Draw measurement overlays
  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    const main = canvasRef.current;
    if (!overlay || !main) return;
    overlay.width = main.width || 512;
    overlay.height = main.height || 512;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const allMeasurements = [...measurements, ...(activeMeasurement ? [activeMeasurement] : [])];

    allMeasurements.forEach(m => {
      if (m.points.length < 2) return;
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);

      if (m.type === "length") {
        ctx.beginPath();
        ctx.moveTo(m.points[0].x, m.points[0].y);
        ctx.lineTo(m.points[1].x, m.points[1].y);
        ctx.stroke();
        [m.points[0], m.points[1]].forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#00ff00";
          ctx.fill();
        });
      } else if (m.type === "ellipse") {
        const cx = (m.points[0].x + m.points[1].x) / 2;
        const cy = (m.points[0].y + m.points[1].y) / 2;
        const rx = Math.abs(m.points[1].x - m.points[0].x) / 2;
        const ry = Math.abs(m.points[1].y - m.points[0].y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (m.type === "rectangle") {
        const x0 = Math.min(m.points[0].x, m.points[1].x);
        const y0 = Math.min(m.points[0].y, m.points[1].y);
        const w = Math.abs(m.points[1].x - m.points[0].x);
        const h = Math.abs(m.points[1].y - m.points[0].y);
        ctx.strokeRect(x0, y0, w, h);
        // Corner markers
        [m.points[0], m.points[1], { x: m.points[0].x, y: m.points[1].y }, { x: m.points[1].x, y: m.points[0].y }].forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = "#00ff00";
          ctx.fill();
        });
      } else if (m.type === "bidirectional") {
        // Main axis
        ctx.beginPath();
        ctx.moveTo(m.points[0].x, m.points[0].y);
        ctx.lineTo(m.points[1].x, m.points[1].y);
        ctx.stroke();
        // Perpendicular bisector (short cross)
        const cx = (m.points[0].x + m.points[1].x) / 2;
        const cy = (m.points[0].y + m.points[1].y) / 2;
        const dx = m.points[1].x - m.points[0].x;
        const dy = m.points[1].y - m.points[0].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const perpLen = len * 0.3;
        const nx = -dy / len * perpLen;
        const ny = dx / len * perpLen;
        ctx.beginPath();
        ctx.moveTo(cx + nx, cy + ny);
        ctx.lineTo(cx - nx, cy - ny);
        ctx.stroke();
        // Endpoints
        [m.points[0], m.points[1], { x: cx + nx, y: cy + ny }, { x: cx - nx, y: cy - ny }].forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#00ff00";
          ctx.fill();
        });
      } else if (m.type === "angle") {
        ctx.beginPath();
        ctx.moveTo(m.points[0].x, m.points[0].y);
        ctx.lineTo(m.points[1].x, m.points[1].y);
        ctx.stroke();
      }

      // Label
      if (m.value) {
        const labelX = (m.points[0].x + m.points[1].x) / 2;
        const labelY = (m.points[0].y + m.points[1].y) / 2 - 8;
        ctx.font = "bold 12px monospace";
        ctx.fillStyle = "#00ff00";
        ctx.fillText(m.value, labelX, labelY);
      }
    });

    // Draw annotations
    annotations.forEach(a => {
      ctx.font = "bold 11px monospace";
      ctx.fillStyle = "#ffff00";
      ctx.fillText(a.text, a.x, a.y);
      ctx.beginPath();
      ctx.arc(a.x - 4, a.y - 4, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffff00";
      ctx.fill();
    });
  }, [measurements, activeMeasurement, annotations]);

  // Download current image
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `exam-${activeIndex + 1}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Imagem baixada!");
  };

  const toolButtons: { id: typeof tool; icon: typeof Move; label: string }[] = [
    { id: "stackScroll", icon: ChevronDown, label: "Stack Scroll" },
    { id: "pan", icon: Move, label: "Arrastar (Pan)" },
    { id: "zoom", icon: ZoomIn, label: "Zoom" },
    { id: "wl", icon: Sun, label: "Janela/Nível (W/L)" },
    { id: "measure", icon: Ruler, label: "Medição Linear" },
    { id: "bidirectional", icon: Pencil, label: "Bidirecional" },
    { id: "angle", icon: Crosshair, label: "Ângulo" },
    { id: "ellipse", icon: Eye, label: "ROI Elíptica" },
    { id: "rectangle", icon: Grid3X3, label: "Retângulo ROI" },
    { id: "windowROI", icon: Monitor, label: "Janela ROI" },
    { id: "annotate", icon: Type, label: "Anotação" },
    { id: "magnify", icon: ZoomIn, label: "Lupa" },
  ];

  return (
    <div className="flex flex-col h-full bg-black text-white/80">
      {/* PACS Toolbar - Weasis/OHIF style */}
      <div className="flex items-center gap-0.5 px-2 py-1 bg-[#1a2332] border-b border-white/10 text-[11px] flex-wrap">
        <TooltipProvider delayDuration={200}>
          {/* Series navigation */}
          <div className="flex items-center gap-0.5 mr-1">
            <Tooltip><TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setActiveIndex(i => Math.max(0, i - 1))} disabled={activeIndex === 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="bottom">Série anterior</TooltipContent></Tooltip>
            <span className="text-[10px] text-white/50 min-w-[36px] text-center font-mono">
              {fileUrls.length > 0 ? `${activeIndex + 1}/${fileUrls.length}` : "—"}
            </span>
            <Tooltip><TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setActiveIndex(i => Math.min(fileUrls.length - 1, i + 1))} disabled={activeIndex >= fileUrls.length - 1}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="bottom">Próxima série</TooltipContent></Tooltip>
          </div>

          <Separator orientation="vertical" className="h-5 bg-white/10 mx-0.5" />

          {/* Tools */}
          {toolButtons.map(t => (
            <Tooltip key={t.id}><TooltipTrigger asChild>
              <Button size="icon" variant="ghost"
                className={`h-7 w-7 ${tool === t.id ? "bg-primary/30 text-primary ring-1 ring-primary/50" : "text-white/60 hover:text-white hover:bg-white/10"}`}
                onClick={() => setTool(t.id)}>
                <t.icon className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent side="bottom">{t.label}</TooltipContent></Tooltip>
          ))}

          <Separator orientation="vertical" className="h-5 bg-white/10 mx-0.5" />

          {/* Zoom controls */}
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setZoom(z => Math.min(z + 0.25, 8))}>
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Zoom +</TooltipContent></Tooltip>
          <span className="text-[9px] text-white/40 min-w-[28px] text-center font-mono">{Math.round(zoom * 100)}%</span>
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setZoom(z => Math.max(z - 0.25, 0.1))}>
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Zoom −</TooltipContent></Tooltip>

          <Separator orientation="vertical" className="h-5 bg-white/10 mx-0.5" />

          {/* WL Presets (Weasis) */}
          <Popover open={showPresets} onOpenChange={setShowPresets}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] text-white/60 hover:text-white hover:bg-white/10 px-2">
                <Contrast className="w-3.5 h-3.5 mr-1" />
                {activePreset}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1 bg-[#1a2332] border-white/20" align="start">
              {WL_PRESETS.map(p => (
                <Button key={p.label} variant="ghost" size="sm"
                  className={`w-full justify-start text-[11px] h-7 ${activePreset === p.label ? "bg-primary/20 text-primary" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                  onClick={() => applyPreset(p)}>
                  <span className="mr-2">{p.icon}</span> {p.label}
                  {p.ww > 0 && <span className="ml-auto text-[9px] text-white/30">{p.ww}/{p.wl}</span>}
                </Button>
              ))}
            </PopoverContent>
          </Popover>

          {/* W/L sliders */}
          <div className="flex items-center gap-0.5">
            <Sun className="w-3 h-3 text-white/30" />
            <input type="range" min="0" max="300" value={brightness}
              onChange={e => { setBrightness(+e.target.value); setActivePreset("Custom"); }}
              className="w-12 h-1 accent-primary cursor-pointer" />
            <span className="text-[8px] text-white/30 w-5">{brightness}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Contrast className="w-3 h-3 text-white/30" />
            <input type="range" min="0" max="300" value={contrast}
              onChange={e => { setContrast(+e.target.value); setActivePreset("Custom"); }}
              className="w-12 h-1 accent-primary cursor-pointer" />
            <span className="text-[8px] text-white/30 w-5">{contrast}</span>
          </div>

          <Separator orientation="vertical" className="h-5 bg-white/10 mx-0.5" />

          {/* Transform tools */}
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setRotation(r => (r + 90) % 360)}>
              <RotateCw className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Rotacionar 90°</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className={`h-7 w-7 ${flipH ? "bg-primary/30 text-primary" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              onClick={() => setFlipH(f => !f)}>
              <FlipHorizontal className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Espelhar H</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className={`h-7 w-7 ${flipV ? "bg-primary/30 text-primary" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              onClick={() => setFlipV(f => !f)}>
              <FlipVertical className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Espelhar V</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className={`h-7 w-7 ${invert ? "bg-yellow-500/30 text-yellow-400" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              onClick={() => setInvert(i => !i)}>
              <Contrast className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Inverter (Negativo)</TooltipContent></Tooltip>

          <Separator orientation="vertical" className="h-5 bg-white/10 mx-0.5" />

          {/* CINE (OHIF) */}
          {fileUrls.length > 1 && (
            <>
              <Tooltip><TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className={`h-7 w-7 ${cinePlay ? "bg-green-500/30 text-green-400 animate-pulse" : "text-white/60 hover:text-white hover:bg-white/10"}`}
                  onClick={() => setCinePlay(p => !p)}>
                  <Play className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger><TooltipContent side="bottom">{cinePlay ? "Parar CINE" : "CINE Play"}</TooltipContent></Tooltip>
              {cinePlay && (
                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-white/30">Cine Loop</span>
                  <input type="range" min="50" max="1000" value={cineSpeed}
                    onChange={e => setCineSpeed(+e.target.value)}
                    className="w-16 h-1 accent-green-400 cursor-pointer" />
                </div>
              )}
            </>
          )}

          {/* Reset */}
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={resetView}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Restaurar tudo</TooltipContent></Tooltip>

          {/* Clear measurements */}
          {measurements.length > 0 && (
            <Tooltip><TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 text-[10px] text-red-400/70 hover:text-red-400 hover:bg-red-500/10 px-2"
                onClick={() => { setMeasurements([]); setAnnotations([]); }}>
                Limpar ({measurements.length})
              </Button>
            </TooltipTrigger><TooltipContent side="bottom">Limpar medições e anotações</TooltipContent></Tooltip>
          )}

          <div className="flex-1" />

          {/* Download */}
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={handleDownloadImage}>
              <Download className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Baixar imagem</TooltipContent></Tooltip>

          {/* Measurements panel toggle */}
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className={`h-7 w-7 ${showMeasurementsPanel ? "bg-primary/30 text-primary" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              onClick={() => setShowMeasurementsPanel(p => !p)}>
              <Ruler className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Medições</TooltipContent></Tooltip>

          {/* Info panel toggle */}
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className={`h-7 w-7 ${showInfoPanel ? "bg-primary/30 text-primary" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              onClick={() => setShowInfoPanel(p => !p)}>
              <FileText className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Info DICOM</TooltipContent></Tooltip>

          {/* Fullscreen / Layout */}
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => containerRef.current?.requestFullscreen?.()}>
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Tela cheia</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className={`h-7 w-7 ${dualView ? "bg-primary/30 text-primary" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              onClick={() => { setDualView(d => !d); if (!dualView && fileUrls.length > 1) setDualIndex(activeIndex === 0 ? 1 : 0); }}>
              <Grid3X3 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">{dualView ? "Visão única" : "Comparação lado a lado"}</TooltipContent></Tooltip>
        </TooltipProvider>
      </div>

      {/* Main viewer area */}
      <div className="flex flex-1 min-h-0">
        {/* Series thumbnails sidebar (OsiriX-style) */}
        {showSidebar && (
          <div className="w-[140px] border-r border-white/10 bg-[#0d1117] overflow-y-auto flex-shrink-0 flex flex-col">
            <div className="p-1 text-[9px] text-amber-400/80 uppercase tracking-wider px-2 py-1.5 border-b border-white/5 font-bold flex items-center justify-between">
              <span className="truncate">{dicomInfo["Paciente"] || "Séries"}</span>
              <Button size="icon" variant="ghost" className="h-4 w-4 text-white/30 hover:text-white shrink-0" onClick={() => setShowSidebar(false)}>×</Button>
            </div>
            {dicomInfo["ID"] && (
              <div className="px-2 py-1 text-[8px] text-amber-400/50 border-b border-white/5 font-mono">
                ID: {dicomInfo["ID"]}
              </div>
            )}
            {dicomInfo["Estudo"] && (
              <div className="px-2 py-0.5 text-[8px] text-white/30 border-b border-white/5">
                [{dicomInfo["Estudo"] || "No study description"}]
              </div>
            )}
            <div className="px-2 py-0.5 text-[8px] text-white/30 border-b border-white/5">
              {dicomInfo["Data Estudo"] || ""} {fileUrls.length > 0 ? `${fileUrls.length} Series` : ""}
            </div>
            {/* Series group */}
            <div className="px-1 py-1 text-[8px] text-amber-400/60 font-mono border-b border-white/5 cursor-pointer hover:bg-white/5">
              {dicomInfo["Modalidade"] || "DX"} - [{dicomInfo["Série"] || "No study description"}]
            </div>
            <div className="p-1 space-y-1 flex-1 overflow-y-auto">
              {fileUrls.length > 0 ? fileUrls.map((url, i) => {
                const originalPath = (examRequest?.file_urls as string[])?.[i] || "";
                const isDicom = originalPath.toLowerCase().endsWith(".dcm") || originalPath.toLowerCase().endsWith(".dicom");
                const isActive = i === activeIndex;
                const isDualActive = dualView && i === dualIndex;
                return (
                  <button
                    key={i}
                    onClick={() => { if (dualView && i !== activeIndex) setDualIndex(i); else { setActiveIndex(i); setCinePlay(false); } }}
                    className={`w-full rounded overflow-hidden border-2 transition-all ${
                      isActive ? "border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                      : isDualActive ? "border-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]"
                      : "border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="aspect-square bg-black flex items-center justify-center relative">
                      {isDicom ? (
                        <ImageIcon className="w-5 h-5 text-white/20" />
                      ) : (
                        <img src={url} alt={`S${i + 1}`} className="w-full h-full object-cover opacity-80" />
                      )}
                      <div className="absolute top-0.5 right-0.5">
                        <span className="text-[7px] text-red-400 font-bold">■</span>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent px-1 py-0.5 flex justify-between items-end">
                        <span className="text-[7px] text-amber-400/60 font-mono">{fileUrls.length} Imgs</span>
                      </div>
                    </div>
                  </button>
                );
              }) : (
                <div className="text-center text-[9px] text-white/20 py-4">Sem imagens</div>
              )}
            </div>
          </div>
        )}
        {!showSidebar && (
          <Button size="icon" variant="ghost" className="absolute top-12 left-0 z-30 h-8 w-5 bg-[#1a2332]/80 text-white/40 hover:text-white rounded-none rounded-r"
            onClick={() => setShowSidebar(true)}>
            <ChevronRight className="w-3 h-3" />
          </Button>
        )}

        {/* Main canvas area */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-black"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => { setCursorPos(null); isPanningRef.current = false; }}
          style={{ cursor: tool === "pan" ? "grab" : tool === "measure" || tool === "angle" || tool === "ellipse" ? "crosshair" : tool === "annotate" ? "text" : "default" }}
        >
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-[10px] text-white/40">Carregando DICOM...</span>
              </div>
            </div>
          )}

          {!activeUrl && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/20">
              <Monitor className="w-20 h-20" />
              <p className="text-sm">Nenhum arquivo de exame</p>
              <p className="text-[10px] text-white/10">Faça upload de imagens DICOM ou imagens comuns para visualizar</p>
              <label className="cursor-pointer">
                <input type="file" className="hidden" accept=".dcm,.dicom,.jpg,.jpeg,.png,.bmp,.tiff,image/*" multiple
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files?.length || !examRequest?.id) return;
                    const paths: string[] = [];
                    for (const file of Array.from(files)) {
                      const ext = file.name.split(".").pop() || "dcm";
                      const path = `${examRequest.id}/${crypto.randomUUID()}.${ext}`;
                      const { error } = await supabase.storage.from("exam-files").upload(path, file);
                      if (error) { toast.error(`Erro ao enviar ${file.name}`); continue; }
                      paths.push(path);
                    }
                    if (paths.length > 0) {
                      const existing = (examRequest.file_urls as string[]) || [];
                      const updated = [...existing, ...paths];
                      await supabase.from("exam_requests" as any).update({ file_urls: updated } as any).eq("id", examRequest.id);
                      // Resolve URLs
                      const resolved = await Promise.all(paths.map(async p => {
                        const { data } = await supabase.storage.from("exam-files").createSignedUrl(p, 3600);
                        return data?.signedUrl || "";
                      }));
                      onFilesUploaded?.(resolved.filter(Boolean));
                      toast.success(`${paths.length} arquivo(s) enviado(s)!`);
                    }
                  }}
                />
                <Button variant="outline" size="sm" className="text-white/50 border-white/20 hover:bg-white/10 hover:text-white" asChild>
                  <span><Upload className="w-4 h-4 mr-2" /> Upload de Arquivos</span>
                </Button>
              </label>
            </div>
          )}

          {/* Image container with pan */}
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
            <div className="relative">
              <canvas
                ref={canvasRef}
                className={loading && !canvasRef.current?.width ? "hidden" : ""}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                  filter: `brightness(${brightness}%) contrast(${contrast}%) ${invert ? "invert(1)" : ""}`,
                  transition: "filter 0.15s ease",
                  imageRendering: "auto",
                }}
              />
              {/* Measurement overlay canvas */}
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                }}
              />
            </div>
          </div>

          {/* Patient info overlay — top-left (OsiriX orange style) */}
          {Object.keys(dicomInfo).length > 0 && (
            <div className="absolute top-2 left-2 text-[10px] font-mono leading-snug pointer-events-none z-20">
              {dicomInfo["Paciente"] && <div className="text-amber-400/90">Nome: <strong>{dicomInfo["Paciente"]}</strong></div>}
              {dicomInfo["ID"] && <div className="text-amber-400/60">ID: {dicomInfo["ID"]}</div>}
              {dicomInfo["Nascimento"] && <div className="text-amber-400/60">Nasc: {dicomInfo["Nascimento"]}</div>}
              {dicomInfo["Sexo"] && <div className="text-amber-400/60">Sexo: {dicomInfo["Sexo"]}</div>}
              {dicomInfo["Instituição"] && (
                <div className="text-amber-300/50 mt-1">
                  Nome do departamento : {dicomInfo["Instituição"]}
                </div>
              )}
            </div>
          )}

          {/* Study info overlay — top-right */}
          {Object.keys(dicomInfo).length > 0 && (
            <div className="absolute top-2 right-2 text-[10px] font-mono text-right leading-snug pointer-events-none z-20">
              {dicomInfo["Data Estudo"] && <div className="text-white/50">{dicomInfo["Data Estudo"]}</div>}
              {dicomInfo["Estudo"] && <div className="text-white/40">[{dicomInfo["Estudo"]}]</div>}
              {dicomInfo["Modalidade"] && <div className="text-white/50">{dicomInfo["Modalidade"]} {dicomInfo["Protocolo"] ? `· ${dicomInfo["Protocolo"]}` : ""}</div>}
            </div>
          )}

          {/* Cursor position + HU readout — bottom-left (OsiriX) */}
          {cursorPos && (
            <div className="absolute bottom-6 left-2 text-[10px] font-mono text-green-400/80 pointer-events-none z-20 bg-black/50 px-1.5 py-0.5 rounded">
              x: {cursorPos.x} y: {cursorPos.y}
              {cursorPos.hu !== undefined && <span className="ml-2 text-yellow-300/80">HU: {cursorPos.hu}</span>}
            </div>
          )}

          {/* Bottom status bar (OsiriX-style) */}
          <div className="absolute bottom-0 inset-x-0 h-5 bg-black/70 border-t border-white/5 flex items-center justify-between px-3 text-[9px] font-mono text-white/40 pointer-events-none z-20">
            <div className="flex items-center gap-4">
              <span>Image size:{imageNaturalSize.w}x{imageNaturalSize.h}</span>
              <span>Zoom: {Math.round(zoom * 100)}%</span>
              {dicomInfo["Formato"] === "DICOM" && <span>DERIVED\\PRIMARY</span>}
            </div>
            <div className="flex items-center gap-4">
              {fileUrls.length > 0 && <span>Images:{activeIndex + 1}/ {fileUrls.length}</span>}
              <span>WL: {brightness} / WW: {contrast}</span>
              {dicomInfo["Modalidade"] && <span>({dicomInfo["Modalidade"]})</span>}
            </div>
          </div>

          {/* Measurements list — bottom-center */}
          {measurements.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-mono text-green-400/70 pointer-events-none z-20 space-y-0.5">
              {measurements.map(m => (
                <div key={m.id} className="bg-black/60 px-2 py-0.5 rounded">
                  {m.type === "length" ? "📏" : m.type === "angle" ? "📐" : "⭕"} {m.value}
                </div>
              ))}
            </div>
          )}

          {/* Técnico Responsável overlay — bottom-right above status bar */}
          {dicomInfo["Médico Ref."] && (
            <div className="absolute bottom-6 right-2 text-[10px] font-mono text-red-400/80 pointer-events-none z-20">
              Técnico Responsável : <strong>{dicomInfo["Médico Ref."]}</strong>
            </div>
          )}
        </div>

        {/* Dual viewport (comparison side-by-side) */}
        {dualView && fileUrls.length > 1 && (
          <div className="flex-1 relative overflow-hidden bg-black border-l-2 border-white/10">
            <img
              src={fileUrls[dualIndex] || fileUrls[1] || ""}
              alt="Comparison"
              className="absolute inset-0 w-full h-full object-contain"
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%) ${invert ? "invert(1)" : ""}`,
              }}
            />
            {/* Dual view overlays */}
            {Object.keys(dicomInfo).length > 0 && (
              <div className="absolute top-2 left-2 text-[10px] font-mono leading-snug pointer-events-none z-20">
                {dicomInfo["Paciente"] && <div className="text-amber-400/90">{dicomInfo["Paciente"]}</div>}
                {dicomInfo["ID"] && <div className="text-amber-400/60">{dicomInfo["ID"]}</div>}
              </div>
            )}
            <div className="absolute top-2 right-2 text-[10px] font-mono text-white/50 pointer-events-none z-20">
              {dicomInfo["Data Estudo"]}
            </div>
            <div className="absolute bottom-0 inset-x-0 h-5 bg-black/70 border-t border-white/5 flex items-center justify-between px-3 text-[9px] font-mono text-white/40 pointer-events-none z-20">
              <span>Image size:{imageNaturalSize.w}x{imageNaturalSize.h}</span>
              <span>Images:{dualIndex + 1}/ {fileUrls.length}</span>
              <span>WL: {brightness} / WW: {contrast}</span>
            </div>
          </div>
        )}

        {/* DICOM Info Side Panel (Weasis-style) */}
        {showInfoPanel && Object.keys(dicomInfo).length > 0 && (
          <div className="w-56 border-l border-white/10 bg-[#0d1117] overflow-y-auto flex-shrink-0">
            <div className="p-1.5 text-[9px] text-white/40 uppercase tracking-wider px-2 py-1.5 border-b border-white/5 font-semibold flex items-center justify-between">
              DICOM Tags
              <Button size="icon" variant="ghost" className="h-5 w-5 text-white/30 hover:text-white" onClick={() => setShowInfoPanel(false)}>
                ×
              </Button>
            </div>
            <div className="p-2 space-y-1">
              {Object.entries(dicomInfo).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 text-[10px] py-0.5 border-b border-white/5">
                  <span className="text-white/40 shrink-0">{k}</span>
                  <span className="text-white/70 text-right truncate">{v}</span>
                </div>
              ))}
            </div>
            {/* Measurements summary */}
            {measurements.length > 0 && (
              <>
                <div className="p-1.5 text-[9px] text-white/40 uppercase tracking-wider px-2 py-1.5 border-t border-b border-white/5 font-semibold">
                  Medições ({measurements.length})
                </div>
                <div className="p-2 space-y-1">
                  {measurements.map((m, i) => (
                    <div key={m.id} className="text-[10px] text-green-400/70 flex justify-between">
                      <span>{i + 1}. {m.type === "length" ? "Comprimento" : m.type === "angle" ? "Ângulo" : m.type === "rectangle" ? "Retângulo" : m.type === "bidirectional" ? "Bidirecional" : "ROI"}</span>
                      <span className="font-mono">{m.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Measurements Panel (Zafaz-style) */}
        {showMeasurementsPanel && (
          <div className="w-56 border-l border-white/10 bg-[#0d1117] overflow-y-auto flex-shrink-0">
            <div className="p-1.5 text-[9px] text-white/40 uppercase tracking-wider px-2 py-1.5 border-b border-white/5 font-semibold flex items-center justify-between">
              Measurements
              <Button size="icon" variant="ghost" className="h-5 w-5 text-white/30 hover:text-white" onClick={() => setShowMeasurementsPanel(false)}>
                ×
              </Button>
            </div>
            {measurements.length === 0 && annotations.length === 0 ? (
              <div className="p-4 text-center text-[10px] text-white/20">
                <Ruler className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Nenhuma medição
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                {measurements.map((m, i) => (
                  <div key={m.id} className="flex items-center justify-between gap-1 text-[10px] py-1 px-1.5 rounded bg-white/5 hover:bg-white/10 group">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-green-400/80">
                        {m.type === "length" ? "📏" : m.type === "angle" ? "📐" : m.type === "ellipse" ? "⭕" : m.type === "rectangle" ? "⬜" : m.type === "bidirectional" ? "↔️" : "📍"}
                      </span>
                      <span className="text-white/50 shrink-0">{i + 1}.</span>
                      <span className="text-white/70 truncate">{m.type === "length" ? "Comp." : m.type === "angle" ? "Ângulo" : m.type === "ellipse" ? "Elipse" : m.type === "rectangle" ? "Retângulo" : m.type === "bidirectional" ? "Bidirec." : m.type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-green-400/90 text-[9px]">{m.value}</span>
                      <Button size="icon" variant="ghost" className="h-4 w-4 opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400"
                        onClick={() => setMeasurements(prev => prev.filter(x => x.id !== m.id))}>
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
                {annotations.map((a, i) => (
                  <div key={a.id} className="flex items-center justify-between gap-1 text-[10px] py-1 px-1.5 rounded bg-white/5 hover:bg-white/10 group">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-yellow-400/80">📝</span>
                      <span className="text-white/70 truncate">{a.text}</span>
                    </div>
                    <Button size="icon" variant="ghost" className="h-4 w-4 opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400"
                      onClick={() => setAnnotations(prev => prev.filter(x => x.id !== a.id))}>
                      ×
                    </Button>
                  </div>
                ))}
                <Separator className="bg-white/10 my-1" />
                <Button variant="ghost" size="sm" className="w-full text-[10px] h-6 text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                  onClick={() => { setMeasurements([]); setAnnotations([]); }}>
                  Limpar tudo
                </Button>
              </div>
            )}
          </div>
        )}
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
            <PacsViewer fileUrls={fileUrls} examRequest={examRequest || null} onFilesUploaded={(newUrls) => setFileUrls(prev => [...prev, ...newUrls])} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Report Editor */}
          <ResizablePanel defaultSize={45} minSize={25}>
            <div className="flex flex-col h-full bg-card">
              {/* Clinical info bar */}
              {examRequest?.clinical_info && (
                <div className="px-3 py-2 border-b border-border bg-warning/5">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-warning uppercase tracking-wider">Informações Clínicas</p>
                      <p className="text-xs text-foreground/80 leading-relaxed">{examRequest.clinical_info}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient info bar */}
              {examRequest?.patient_id && (
                <div className="px-3 py-1.5 border-b border-border bg-muted/30 flex items-center gap-2">
                  <Clipboard className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    Exame: <strong>{examRequest.exam_type}</strong>
                    {examRequest.priority === "urgent" && <span className="text-destructive ml-2 font-bold">● URGENTE</span>}
                    {examRequest.sla_deadline && (
                      <span className="ml-2">
                        SLA: {new Date(examRequest.sla_deadline).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </span>
                </div>
              )}

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
