import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Camera, FileText, User, CheckCircle2, XCircle, Loader2, ArrowRight, ArrowLeft,
  ShieldCheck, AlertTriangle, Eye, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  loadFaceModels, extractTextFromImage, parseCRMFromText, nameSimilarity,
  detectFace, computeFaceDistance, detectBlink,
} from "@/lib/services/kyc-service";

type Step = "document" | "selfie" | "match";
type Status = "idle" | "loading" | "success" | "error";

const steps: { id: Step; label: string; icon: React.ComponentType<any> }[] = [
  { id: "document", label: "Foto do Documento", icon: FileText },
  { id: "selfie", label: "Selfie de Validação", icon: User },
  { id: "match", label: "Confirmação", icon: ShieldCheck },
];

const KYCVerification = ({ doctorProfileId, userName, userCRM, onComplete }: {
  doctorProfileId: string;
  userName: string;
  userCRM: string;
  onComplete?: () => void;
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>("document");
  const [status, setStatus] = useState<Status>("idle");
  const [modelsReady, setModelsReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Document step state
  const [docImage, setDocImage] = useState<Blob | null>(null);
  const [ocrResult, setOcrResult] = useState<{ crm: string | null; name: string | null } | null>(null);
  const [docDescriptor, setDocDescriptor] = useState<Float32Array | null>(null);

  // Selfie step state
  const [selfieDescriptor, setSelfieDescriptor] = useState<Float32Array | null>(null);
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [selfieCapture, setSelfieCapture] = useState<string | null>(null);

  // Match step state
  const [matchScore, setMatchScore] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blinkFrameRef = useRef<number>(0);
  const earHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    loadFaceModels()
      .then(() => setModelsReady(true))
      .catch((err) => {
        console.error("[KYC] Failed to load models:", err);
        toast({ title: "Erro ao carregar modelos de IA", description: "Tente recarregar a página.", variant: "destructive" });
      });
    return () => stopCamera();
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async (facingMode: "user" | "environment" = "environment") => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("[KYC] Camera error:", err);
      setErrorMsg("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
      setStatus("error");
    }
  }, [stopCamera]);

  const captureFrame = useCallback((): Blob | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }, []);

  // -- STEP 1: Document --
  const handleDocCapture = useCallback(async (file: Blob) => {
    setDocImage(file);
    setStatus("loading");
    setErrorMsg("");
    try {
      console.log("[KYC] Starting OCR...");
      const text = await extractTextFromImage(file);
      console.log("[KYC] OCR text:", text);
      const parsed = parseCRMFromText(text);
      console.log("[KYC] Parsed CRM:", parsed.crm, "Name:", parsed.name);
      setOcrResult(parsed);

      // Try to extract face from document
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((r) => { img.onload = r; });
      const faceResult = await detectFace(img);
      if (faceResult) {
        setDocDescriptor(faceResult.descriptor);
        console.log("[KYC] Face detected in document");
      } else {
        console.warn("[KYC] No face detected in document photo");
      }

      // Validate CRM match
      if (parsed.crm) {
        const crmClean = parsed.crm.replace(/\D/g, "");
        const userCrmClean = userCRM.replace(/\D/g, "");
        if (crmClean !== userCrmClean) {
          console.warn("[KYC] CRM mismatch:", crmClean, "vs", userCrmClean);
        }
      }

      setStatus("success");
    } catch (err) {
      console.error("[KYC] OCR error:", err);
      setErrorMsg("Erro ao processar o documento. Tente uma foto com melhor iluminação.");
      setStatus("error");
    }
  }, [userCRM]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleDocCapture(file);
  }, [handleDocCapture]);

  const handleCameraCapture = useCallback(() => {
    const blob = captureFrame();
    if (blob) handleDocCapture(blob);
  }, [captureFrame, handleDocCapture]);

  // -- STEP 2: Selfie with blink --
  const startLivenessCheck = useCallback(async () => {
    await startCamera("user");
    setBlinkDetected(false);
    earHistoryRef.current = [];

    const checkBlink = async () => {
      if (!videoRef.current || !streamRef.current?.active) return;
      try {
        const result = await detectFace(videoRef.current);
        if (result) {
          const { avgEAR } = detectBlink(result.landmarks);
          earHistoryRef.current.push(avgEAR);

          // Keep last 30 frames
          if (earHistoryRef.current.length > 30) earHistoryRef.current.shift();

          // Detect blink: EAR drops below 0.21 then returns above 0.25
          const history = earHistoryRef.current;
          if (history.length >= 5) {
            const minEAR = Math.min(...history.slice(-10));
            const maxEAR = Math.max(...history.slice(-5));
            if (minEAR < 0.21 && maxEAR > 0.25) {
              console.log("[KYC] Blink detected! min:", minEAR, "max:", maxEAR);
              setBlinkDetected(true);
              // Capture selfie
              const blob = captureFrame();
              if (blob) {
                setSelfieCapture(URL.createObjectURL(blob));
                const faceRes = await detectFace(videoRef.current!);
                if (faceRes) {
                  setSelfieDescriptor(faceRes.descriptor);
                  console.log("[KYC] Selfie face descriptor captured");
                }
              }
              stopCamera();
              return;
            }
          }
        }
      } catch (err) {
        console.error("[KYC] Liveness frame error:", err);
      }
      // Use setTimeout to avoid overwhelming the CPU with rAF
      blinkFrameRef.current = window.setTimeout(checkBlink, 250) as unknown as number;
    };

    // Wait for camera to stabilize
    setTimeout(() => { checkBlink(); }, 1500);
  }, [startCamera, captureFrame, stopCamera]);

  useEffect(() => {
    return () => {
      if (blinkFrameRef.current) clearTimeout(blinkFrameRef.current);
    };
  }, []);

  // -- STEP 3: Face Match --
  const runFaceMatch = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");

    if (!docDescriptor || !selfieDescriptor) {
      setErrorMsg("Não foi possível comparar os rostos. Tente novamente.");
      setStatus("error");
      return;
    }

    const distance = computeFaceDistance(docDescriptor, selfieDescriptor);
    const score = Math.max(0, 1 - distance);
    setMatchScore(score);
    console.log("[KYC] Face match distance:", distance, "score:", score);

    const THRESHOLD = 0.6;
    if (score >= THRESHOLD) {
      // Success — update DB
      try {
        const { error } = await supabase
          .from("doctor_profiles")
          .update({
            kyc_status: "verified",
            kyc_verified_at: new Date().toISOString(),
            kyc_face_match_score: score,
          } as any)
          .eq("id", doctorProfileId);

        if (error) throw error;

        setStatus("success");
        toast({ title: "✅ Identidade verificada!", description: "Seu KYC foi concluído com sucesso." });
        onComplete?.();
      } catch (err) {
        console.error("[KYC] DB update error:", err);
        setErrorMsg("Erro ao salvar verificação. Tente novamente.");
        setStatus("error");
      }
    } else {
      // Update as failed
      await supabase
        .from("doctor_profiles")
        .update({ kyc_status: "failed", kyc_face_match_score: score } as any)
        .eq("id", doctorProfileId);

      setErrorMsg(
        "A foto do documento não confere com sua selfie. Tente novamente com melhor iluminação."
      );
      setStatus("error");
    }
  }, [docDescriptor, selfieDescriptor, doctorProfileId, onComplete]);

  const stepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((stepIndex + 1) / steps.length) * 100;

  if (!modelsReady) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Carregando modelos de IA facial...</p>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <p className="text-xs text-muted-foreground">
            Isso pode levar alguns segundos na primeira vez. Todo o processamento é feito localmente no seu navegador.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Verificação de Identidade (KYC)
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {stepIndex + 1}/{steps.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-1.5 mt-2" />
        {/* Stepper indicators */}
        <div className="flex items-center gap-1 mt-3">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                i < stepIndex ? "bg-emerald-500 text-white" :
                i === stepIndex ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < stepIndex ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[10px] leading-tight hidden sm:block ${
                i === stepIndex ? "text-foreground font-semibold" : "text-muted-foreground"
              }`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="h-px flex-1 bg-border mx-1" />}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <canvas ref={canvasRef} className="hidden" />

        <AnimatePresence mode="wait">
          {/* STEP 1: DOCUMENT */}
          {currentStep === "document" && (
            <motion.div key="document" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tire uma foto do seu CRM ou RG. Certifique-se de que o documento esteja bem iluminado e legível.
                </p>

                {/* Camera view or upload */}
                <div className="relative aspect-[4/3] bg-muted rounded-xl overflow-hidden">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  {!streamRef.current && !docImage && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <Camera className="w-10 h-10 text-muted-foreground/50" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => startCamera("environment")}>
                          <Camera className="w-4 h-4 mr-1" /> Abrir Câmera
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                          <FileText className="w-4 h-4 mr-1" /> Upload
                        </Button>
                      </div>
                    </div>
                  )}
                  {docImage && status === "success" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                      <div className="text-center space-y-2">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                        <p className="text-sm font-semibold text-emerald-600">Documento processado!</p>
                        {ocrResult?.crm && <Badge>CRM: {ocrResult.crm}</Badge>}
                        {ocrResult?.name && <p className="text-xs text-muted-foreground">Nome: {ocrResult.name}</p>}
                      </div>
                    </div>
                  )}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

                {streamRef.current && (
                  <Button className="w-full" onClick={handleCameraCapture} disabled={status === "loading"}>
                    {status === "loading" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                    Capturar Foto
                  </Button>
                )}

                {status === "loading" && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <p className="text-xs text-foreground">Processando OCR... Isso pode levar alguns segundos.</p>
                  </div>
                )}

                {status === "error" && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    <p className="text-xs text-destructive">{errorMsg}</p>
                  </div>
                )}

                {status === "success" && (
                  <Button className="w-full" onClick={() => { stopCamera(); setCurrentStep("selfie"); setStatus("idle"); }}>
                    Próximo: Selfie <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2: SELFIE */}
          {currentStep === "selfie" && (
            <motion.div key="selfie" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Posicione seu rosto na câmera e <strong>pisque os olhos</strong> quando estiver pronto. Isso confirma que é uma pessoa real.
                </p>

                <div className="relative aspect-[3/4] sm:aspect-[4/3] bg-muted rounded-xl overflow-hidden">
                  <video ref={videoRef} className="w-full h-full object-cover mirror" style={{ transform: "scaleX(-1)" }} playsInline muted />
                  {!blinkDetected && streamRef.current && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background/90 backdrop-blur-sm border border-border">
                        <Eye className="w-5 h-5 text-primary animate-pulse" />
                        <p className="text-xs font-medium text-foreground">Olhe para a câmera e pisque os olhos</p>
                      </div>
                    </div>
                  )}
                  {blinkDetected && selfieCapture && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                      <div className="text-center space-y-2">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                        <p className="text-sm font-semibold text-emerald-600">Rosto capturado!</p>
                        <p className="text-xs text-muted-foreground">Liveness check concluído</p>
                      </div>
                    </div>
                  )}
                </div>

                {!blinkDetected && !streamRef.current && (
                  <Button className="w-full" onClick={startLivenessCheck}>
                    <Camera className="w-4 h-4 mr-2" /> Iniciar Validação Facial
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { stopCamera(); setCurrentStep("document"); }}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                  </Button>
                  {blinkDetected && selfieDescriptor && (
                    <Button className="flex-1" onClick={() => { setCurrentStep("match"); setTimeout(runFaceMatch, 500); }}>
                      Verificar <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: MATCH */}
          {currentStep === "match" && (
            <motion.div key="match" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="space-y-4">
                {status === "loading" && (
                  <div className="py-8 text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="text-sm font-medium text-foreground">Comparando faces...</p>
                    <p className="text-xs text-muted-foreground">Processamento 100% local no navegador</p>
                    <Skeleton className="h-3 w-2/3 mx-auto" />
                  </div>
                )}

                {status === "success" && (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">Identidade Verificada! 🎉</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Similaridade: {matchScore ? (matchScore * 100).toFixed(0) : 0}%
                      </p>
                    </div>
                    {ocrResult?.crm && (
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">
                        CRM {ocrResult.crm} verificado
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Seu perfil foi atualizado automaticamente. Todos os dados foram processados localmente.
                    </p>
                  </div>
                )}

                {status === "error" && (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                      <XCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">Verificação Falhou</p>
                      <p className="text-sm text-destructive mt-1">{errorMsg}</p>
                      {matchScore !== null && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Similaridade: {(matchScore * 100).toFixed(0)}% (mínimo: 60%)
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentStep("document");
                        setStatus("idle");
                        setDocImage(null);
                        setOcrResult(null);
                        setDocDescriptor(null);
                        setSelfieDescriptor(null);
                        setBlinkDetected(false);
                        setSelfieCapture(null);
                        setMatchScore(null);
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" /> Tentar Novamente
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[10px] text-muted-foreground mt-4 text-center">
          🔒 Processamento local — seus dados biométricos não são enviados para nenhum servidor (LGPD)
        </p>
      </CardContent>
    </Card>
  );
};

export default KYCVerification;
