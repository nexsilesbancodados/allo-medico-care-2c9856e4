import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, CheckCircle2, X, Loader2, ShieldCheck, FileText, User, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type CaptureStep = "selfie" | "document" | "review";

interface PatientKYCCaptureProps {
  onComplete: (selfieBlob: Blob, documentBlob: Blob) => void;
  onCancel?: () => void;
  compact?: boolean;
}

const PatientKYCCapture = ({ onComplete, onCancel, compact = false }: PatientKYCCaptureProps) => {
  const [step, setStep] = useState<CaptureStep>("selfie");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [docBlob, setDocBlob] = useState<Blob | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async (facingMode: "user" | "environment") => {
    stopCamera();
    setCameraError(null);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err: any) {
      console.error("[KYC] Camera error:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Permissão de câmera negada. Habilite nas configurações do navegador."
          : err.name === "NotFoundError"
            ? "Nenhuma câmera encontrada neste dispositivo."
            : "Erro ao acessar a câmera. Tente novamente."
      );
    }
  }, [stopCamera]);

  // Start camera when step changes
  useEffect(() => {
    if (step === "selfie") startCamera("user");
    else if (step === "document") startCamera("environment");
    return () => { if (step !== "review") stopCamera(); };
  }, [step, startCamera, stopCamera]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  const captureFrame = useCallback((): Blob | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Mirror for selfie
    if (step === "selfie") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    let blob: Blob | null = null;
    canvas.toBlob(b => { blob = b; }, "image/jpeg", 0.92);
    // toBlob is async, use sync approach
    return null;
  }, [step]);

  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady) return;

    // Countdown
    setCapturing(true);
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(r => setTimeout(r, 700));
    }
    setCountdown(null);

    // Capture
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setCapturing(false); return; }

    if (step === "selfie") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) { setCapturing(false); return; }
      const url = URL.createObjectURL(blob);
      if (step === "selfie") {
        setSelfieBlob(blob);
        setSelfiePreview(url);
        stopCamera();
        // Auto-advance to document after brief preview
        setTimeout(() => setStep("document"), 600);
      } else if (step === "document") {
        setDocBlob(blob);
        setDocPreview(url);
        stopCamera();
        setTimeout(() => setStep("review"), 600);
      }
      setCapturing(false);
    }, "image/jpeg", 0.92);
  }, [step, cameraReady, stopCamera]);

  const handleRetake = (which: "selfie" | "document") => {
    if (which === "selfie") {
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
      setSelfieBlob(null);
      setSelfiePreview(null);
    } else {
      if (docPreview) URL.revokeObjectURL(docPreview);
      setDocBlob(null);
      setDocPreview(null);
    }
    setStep(which);
  };

  const handleConfirm = () => {
    if (!selfieBlob || !docBlob) {
      toast.error("Capture ambas as fotos");
      return;
    }
    onComplete(selfieBlob, docBlob);
  };

  const stepInfo = {
    selfie: {
      title: "Selfie de Verificação",
      subtitle: "Posicione seu rosto no centro da tela",
      icon: User,
      tips: ["Ambiente bem iluminado", "Sem óculos escuros ou chapéu", "Olhe diretamente para a câmera"],
    },
    document: {
      title: "Foto do Documento",
      subtitle: "Posicione RG, CNH ou passaporte",
      icon: FileText,
      tips: ["Apoie o documento em superfície plana", "Evite reflexos e sombras", "Todas as informações legíveis"],
    },
    review: {
      title: "Confirme suas fotos",
      subtitle: "Verifique se as imagens estão nítidas",
      icon: ShieldCheck,
      tips: [],
    },
  };

  const info = stepInfo[step];

  return (
    <div className={`space-y-4 ${compact ? "" : "max-w-md mx-auto"}`}>
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-primary/10 flex items-center justify-center">
          <info.icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-base font-bold text-foreground">{info.title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{info.subtitle}</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {(["selfie", "document", "review"] as CaptureStep[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step === s ? "bg-primary text-primary-foreground" :
              (s === "selfie" && selfieBlob) || (s === "document" && docBlob) || (s === "review" && selfieBlob && docBlob)
                ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              {(s === "selfie" && selfieBlob) || (s === "document" && docBlob) ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : i + 1}
            </div>
            {i < 2 && <div className="w-6 h-0.5 bg-muted rounded" />}
          </div>
        ))}
      </div>

      {/* Camera / Review area */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
          {step === "review" ? (
            <div className="space-y-3">
              {/* Selfie review */}
              <div className="rounded-2xl border border-border/50 p-3 bg-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Selfie</span>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleRetake("selfie")} className="h-7 text-xs">
                    <RotateCcw className="w-3 h-3 mr-1" /> Refazer
                  </Button>
                </div>
                {selfiePreview && <img src={selfiePreview} alt="Selfie" className="w-full h-36 object-cover rounded-xl" />}
              </div>

              {/* Document review */}
              <div className="rounded-2xl border border-border/50 p-3 bg-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Documento</span>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleRetake("document")} className="h-7 text-xs">
                    <RotateCcw className="w-3 h-3 mr-1" /> Refazer
                  </Button>
                </div>
                {docPreview && <img src={docPreview} alt="Documento" className="w-full h-36 object-cover rounded-xl" />}
              </div>

              {/* Confirm */}
              <Button onClick={handleConfirm} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20">
                <ShieldCheck className="w-5 h-5 mr-2" />
                Confirmar Verificação
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Camera view */}
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className={`w-full h-full object-cover ${step === "selfie" ? "scale-x-[-1]" : ""}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Camera loading */}
                {!cameraReady && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                    <p className="text-sm text-white/70">Abrindo câmera...</p>
                  </div>
                )}

                {/* Camera error */}
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4">
                    <AlertTriangle className="w-8 h-8 text-destructive mb-2" />
                    <p className="text-sm text-white/90 text-center">{cameraError}</p>
                    <Button size="sm" variant="secondary" className="mt-3" onClick={() => startCamera(step === "selfie" ? "user" : "environment")}>
                      Tentar novamente
                    </Button>
                  </div>
                )}

                {/* Countdown overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <motion.span
                      key={countdown}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      className="text-6xl font-black text-white drop-shadow-lg"
                    >
                      {countdown}
                    </motion.span>
                  </div>
                )}

                {/* Face guide overlay for selfie */}
                {step === "selfie" && cameraReady && !capturing && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-60 border-2 border-white/40 rounded-[50%]" />
                  </div>
                )}

                {/* Document guide overlay */}
                {step === "document" && cameraReady && !capturing && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                    <div className="w-full h-full border-2 border-white/40 rounded-xl" />
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                {info.tips.map(tip => (
                  <span key={tip} className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground">{tip}</span>
                ))}
              </div>

              {/* Capture button */}
              <div className="flex justify-center">
                <button
                  onClick={handleCapture}
                  disabled={!cameraReady || capturing}
                  className="w-16 h-16 rounded-full bg-white border-4 border-primary shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                    <Camera className="w-6 h-6 text-primary-foreground" />
                  </div>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Cancel */}
      {onCancel && (
        <button onClick={onCancel} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
          Cancelar
        </button>
      )}

      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
        🔒 Fotos capturadas ao vivo. Não é possível enviar imagens da galeria.
      </p>
    </div>
  );
};

export default PatientKYCCapture;
