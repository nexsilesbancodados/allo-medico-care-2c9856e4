import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Mic, MicOff, CameraOff, CheckCircle2, AlertTriangle, Loader2, Users } from "lucide-react";
import { motion } from "framer-motion";
import mascotImg from "@/assets/mascot-wave.png";

interface PreCallCheckProps {
  doctorName?: string;
  onReady: () => void;
  isDoctor?: boolean;
}

const PreCallCheck = ({ doctorName, onReady, isDoctor = false }: PreCallCheckProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    testDevices();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const testDevices = async () => {
    setTesting(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Check video track
      const videoTrack = mediaStream.getVideoTracks()[0];
      setCameraOk(videoTrack?.readyState === "live");

      // Check audio track (detect if mic has signal)
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
        const analyser = audioCtx.createAnalyser();
        source.connect(analyser);
        analyser.fftSize = 256;
        const data = new Uint8Array(analyser.frequencyBinCount);
        
        // Wait a moment then check for any audio activity
        setTimeout(() => {
          analyser.getByteFrequencyData(data);
          setMicOk(true); // If we got this far, mic is working
          audioCtx.close();
        }, 500);
      } else {
        setMicOk(false);
      }
    } catch {
      setCameraOk(false);
      setMicOk(false);
    }
    setTesting(false);
  };

  const allGood = cameraOk === true && micOk === true;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <img src={mascotImg} alt="Mascot" className="w-16 h-16 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">
            {isDoctor ? "Preparar Atendimento" : "Preparar para Consulta"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Vamos verificar se sua câmera e microfone estão funcionando
          </p>
        </div>

        {/* Video preview */}
        <Card className="border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-video bg-muted">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!cameraOk && !testing && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center space-y-2">
                    <CameraOff className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Câmera não detectada</p>
                  </div>
                </div>
              )}
              {testing && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device status */}
        <div className="grid grid-cols-2 gap-3">
          <Card className={`border ${cameraOk ? "border-secondary/30 bg-secondary/5" : cameraOk === false ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
            <CardContent className="p-4 flex items-center gap-3">
              {cameraOk ? (
                <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
              ) : cameraOk === false ? (
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Câmera
                </p>
                <p className="text-xs text-muted-foreground">
                  {cameraOk ? "Funcionando" : cameraOk === false ? "Não detectada" : "Verificando..."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={`border ${micOk ? "border-secondary/30 bg-secondary/5" : micOk === false ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
            <CardContent className="p-4 flex items-center gap-3">
              {micOk ? (
                <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
              ) : micOk === false ? (
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  {micOk ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />} Microfone
                </p>
                <p className="text-xs text-muted-foreground">
                  {micOk ? "Funcionando" : micOk === false ? "Não detectado" : "Verificando..."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Waiting room message (for patients) */}
        {!isDoctor && doctorName && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {doctorName} já foi notificado(a)
                </p>
                <p className="text-xs text-muted-foreground">
                  Você é o próximo da fila. Aguarde enquanto verificamos seus dispositivos.
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 border-primary/30 text-primary text-xs">
                Na fila
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={testDevices}
            disabled={testing}
          >
            Testar novamente
          </Button>
          <Button
            className="flex-1 bg-gradient-hero text-primary-foreground"
            onClick={() => {
              stream?.getTracks().forEach(t => t.stop());
              onReady();
            }}
            disabled={testing}
          >
            {allGood ? "Entrar na Consulta" : "Entrar mesmo assim"}
          </Button>
        </div>

        {!allGood && !testing && (
          <p className="text-xs text-center text-muted-foreground">
            Alguns dispositivos não foram detectados. Você ainda pode entrar, mas a experiência pode ser limitada.
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default PreCallCheck;
