import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Contrast,
  Maximize2,
  Loader2,
  ImageIcon,
} from "lucide-react";

interface DicomViewerProps {
  fileUrl: string;
  fileName?: string;
}

const DicomViewer = ({ fileUrl, fileName }: DicomViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [imageData, setImageData] = useState<ImageBitmap | HTMLImageElement | null>(null);
  const [dicomInfo, setDicomInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!fileUrl) return;
    loadDicomFile(fileUrl);
  }, [fileUrl]);

  const loadDicomFile = async (url: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Check DICOM magic bytes "DICM" at offset 128
      const isDicom =
        bytes.length > 132 &&
        bytes[128] === 0x44 &&
        bytes[129] === 0x49 &&
        bytes[130] === 0x43 &&
        bytes[131] === 0x4d;

      if (isDicom) {
        await parseDicomManual(bytes);
      } else {
        // Fallback: treat as regular image
        const blob = new Blob([arrayBuffer]);
        const imgUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          setImageData(img);
          setDicomInfo({ "Formato": "Imagem convencional" });
          drawImage(img);
          setLoading(false);
        };
        img.onerror = () => {
          setError("Formato de arquivo não suportado.");
          setLoading(false);
        };
        img.src = imgUrl;
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar arquivo DICOM.");
      setLoading(false);
    }
  };

  const parseDicomManual = async (bytes: Uint8Array) => {
    try {
      // Extract basic DICOM metadata by parsing tags
      const info: Record<string, string> = {};
      let offset = 132; // After preamble + DICM

      let rows = 0, cols = 0, bitsAllocated = 16, bitsStored = 12;
      let pixelDataOffset = -1;
      let samplesPerPixel = 1;
      let photometricInterpretation = "MONOCHROME2";
      let windowCenter = 0, windowWidth = 0;
      let pixelRepresentation = 0;
      let rescaleIntercept = 0, rescaleSlope = 1;

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

      // Parse DICOM tags (simplified - handles explicit VR little endian)
      while (offset < bytes.length - 8) {
        const group = readUint16(offset);
        const element = readUint16(offset + 2);
        const vr = readString(offset + 4, 2);
        let dataOffset: number;
        let dataLength: number;

        const longVRs = ["OB", "OD", "OF", "OL", "OW", "SQ", "UC", "UN", "UR", "UT"];
        if (longVRs.includes(vr)) {
          dataLength = readUint32(offset + 8);
          dataOffset = offset + 12;
        } else if (vr.match(/^[A-Z]{2}$/)) {
          dataLength = readUint16(offset + 6);
          dataOffset = offset + 8;
        } else {
          // Implicit VR
          dataLength = readUint32(offset + 4);
          dataOffset = offset + 8;
        }

        if (dataLength === 0xFFFFFFFF || dataLength < 0) {
          // Undefined length — skip for now (sequence items)
          if (group === 0x7FE0 && element === 0x0010) {
            pixelDataOffset = dataOffset;
            break;
          }
          offset = dataOffset;
          continue;
        }

        const tag = `${group.toString(16).padStart(4, "0")}${element.toString(16).padStart(4, "0")}`;

        // Extract metadata
        switch (tag) {
          case "00100010": info["Paciente"] = readString(dataOffset, dataLength); break;
          case "00100020": info["ID Paciente"] = readString(dataOffset, dataLength); break;
          case "00080060": info["Modalidade"] = readString(dataOffset, dataLength); break;
          case "00081030": info["Estudo"] = readString(dataOffset, dataLength); break;
          case "0008103e": info["Série"] = readString(dataOffset, dataLength); break;
          case "00080020": info["Data Estudo"] = readString(dataOffset, dataLength); break;
          case "00080080": info["Instituição"] = readString(dataOffset, dataLength); break;
          case "00280010": rows = readUint16(dataOffset); info["Linhas"] = String(rows); break;
          case "00280011": cols = readUint16(dataOffset); info["Colunas"] = String(cols); break;
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

        if (group === 0x7FE0 && element === 0x0010) {
          pixelDataOffset = dataOffset;
          break;
        }

        offset = dataOffset + dataLength;
        // Ensure even alignment
        if (offset % 2 !== 0) offset++;
      }

      info["Formato"] = "DICOM";
      info["Bits"] = `${bitsStored}/${bitsAllocated}`;
      setDicomInfo(info);

      if (pixelDataOffset > 0 && rows > 0 && cols > 0) {
        renderPixelData(bytes, pixelDataOffset, rows, cols, bitsAllocated, bitsStored,
          samplesPerPixel, photometricInterpretation, windowCenter, windowWidth,
          pixelRepresentation, rescaleIntercept, rescaleSlope);
      } else {
        setError("Pixel data não encontrado no arquivo DICOM.");
      }
    } catch (err: any) {
      setError("Erro ao interpretar arquivo DICOM: " + err.message);
    }
    setLoading(false);
  };

  const renderPixelData = (
    bytes: Uint8Array, pixelOffset: number, rows: number, cols: number,
    bitsAllocated: number, bitsStored: number, samplesPerPixel: number,
    photometric: string, wc: number, ww: number,
    pixelRep: number, intercept: number, slope: number
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.createImageData(cols, rows);
    const totalPixels = rows * cols;

    if (samplesPerPixel === 3) {
      // RGB
      for (let i = 0; i < totalPixels; i++) {
        imgData.data[i * 4] = bytes[pixelOffset + i * 3];
        imgData.data[i * 4 + 1] = bytes[pixelOffset + i * 3 + 1];
        imgData.data[i * 4 + 2] = bytes[pixelOffset + i * 3 + 2];
        imgData.data[i * 4 + 3] = 255;
      }
    } else {
      // Grayscale
      const pixelValues = new Float32Array(totalPixels);
      let min = Infinity, max = -Infinity;

      for (let i = 0; i < totalPixels; i++) {
        let rawValue: number;
        if (bitsAllocated === 16) {
          const idx = pixelOffset + i * 2;
          rawValue = bytes[idx] | (bytes[idx + 1] << 8);
          if (pixelRep === 1 && rawValue > (1 << (bitsStored - 1))) {
            rawValue = rawValue - (1 << bitsStored);
          }
        } else {
          rawValue = bytes[pixelOffset + i];
        }

        const hu = rawValue * slope + intercept;
        pixelValues[i] = hu;
        if (hu < min) min = hu;
        if (hu > max) max = hu;
      }

      // Apply window/level
      const center = wc || (min + max) / 2;
      const width = ww || (max - min) || 1;
      const lower = center - width / 2;
      const upper = center + width / 2;
      const isMonochrome1 = photometric.includes("MONOCHROME1");

      for (let i = 0; i < totalPixels; i++) {
        let val = ((pixelValues[i] - lower) / (upper - lower)) * 255;
        val = Math.max(0, Math.min(255, val));
        if (isMonochrome1) val = 255 - val;
        imgData.data[i * 4] = val;
        imgData.data[i * 4 + 1] = val;
        imgData.data[i * 4 + 2] = val;
        imgData.data[i * 4 + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    setLoading(false);
  };

  const drawImage = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
  };

  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));
  const handleFullscreen = () => {
    containerRef.current?.requestFullscreen?.();
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
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
      <CardContent className="flex-1 flex flex-col gap-2 min-h-0">
        {/* Toolbar */}
        <div className="flex items-center gap-1 flex-wrap">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleRotate} title="Rotacionar">
            <RotateCw className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleFullscreen} title="Tela Cheia">
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
          <div className="flex items-center gap-1 ml-2">
            <Contrast className="w-3 h-3 text-muted-foreground" />
            <Slider
              value={[brightness]}
              onValueChange={([v]) => setBrightness(v)}
              min={0} max={200} step={5}
              className="w-20"
            />
            <span className="text-[10px] text-muted-foreground w-8">{brightness}%</span>
          </div>
          <div className="flex items-center gap-1 ml-1">
            <span className="text-[10px] text-muted-foreground">C</span>
            <Slider
              value={[contrast]}
              onValueChange={([v]) => setContrast(v)}
              min={0} max={300} step={5}
              className="w-20"
            />
            <span className="text-[10px] text-muted-foreground w-8">{contrast}%</span>
          </div>
        </div>

        {/* DICOM Info Strip */}
        {Object.keys(dicomInfo).length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-1">
            {Object.entries(dicomInfo).map(([k, v]) => (
              <span key={k}><strong>{k}:</strong> {v}</span>
            ))}
          </div>
        )}

        {/* Canvas Area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-black rounded-md flex items-center justify-center min-h-0"
        >
          {loading && (
            <div className="flex flex-col items-center gap-2 text-white/60">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">Carregando DICOM...</span>
            </div>
          )}
          {error && (
            <div className="text-red-400 text-sm text-center p-4">{error}</div>
          )}
          <canvas
            ref={canvasRef}
            className={loading ? "hidden" : ""}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              filter: `brightness(${brightness}%) contrast(${contrast}%)`,
              transition: "transform 0.2s, filter 0.1s",
              maxWidth: "100%",
              maxHeight: "100%",
              imageRendering: "pixelated",
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default DicomViewer;
