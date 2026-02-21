import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Mic, MicOff, CameraOff, CheckCircle2, AlertTriangle, Loader2, Users, Headphones, Volume2, Info, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import mascotImg from "@/assets/mascot-wave.png";

interface PreCallCheckProps {
  appointmentId?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  scheduledAt?: string;
  onReady: () => void;
  isDoctor?: boolean;
}

const PreCallCheck = ({ appointmentId, doctorName, doctorSpecialty, scheduledAt, onReady, isDoctor = false }: PreCallCheckProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [volume, setVolume] = useState(0);
  const [doctorPresent, setDoctorPresent] = useState(false);
  const [pollingStatus, setPollingStatus] = useState(false);

  useEffect(() => {
    testDevices();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Poll appointment status for doctor presence
  useEffect(() => {
    if (!appointmentId || isDoctor) return;
    setPollingStatus(true);

    const channel = supabase
      .channel(`precall-${appointmentId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "appointments", filter: `id=eq.${appointmentId}` },
        (payload) => {
          if (payload.new.status === "medico_presente" || payload.new.status === "in_progress") {
            setDoctorPresent(true);
          }
        }
      )
      .subscribe();

    // Also check immediately
    const checkNow = async () => {
      const { data } = await supabase.from("appointments").select("status").eq("id", appointmentId).single();
      if (data && (data.status === "medico_presente" || data.status === "in_progress")) {
        setDoctorPresent(true);
      }
    };
    checkNow();

    return () => { supabase.removeChannel(channel); };
  }, [appointmentId, isDoctor]);

  const testDevices = async () => {
    setTesting(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const videoTrack = mediaStream.getVideoTracks()[0];
      setCameraOk(videoTrack?.readyState === "live");

      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
        const analyser = audioCtx.createAnalyser();
        source.connect(analyser);
        analyser.fftSize = 256;
        const dataArr = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          analyser.getByteFrequencyData(dataArr);
          const avg = dataArr.reduce((sum, v) => sum + v, 0) / dataArr.length;
          setVolume(Math.min(avg / 80, 1)); // Normalize 0-1
          animFrameRef.current = requestAnimationFrame(updateVolume);
        };
        updateVolume();
        setMicOk(true);
      } else {
        setMicOk(false);
      }
    } catch {
      setCameraOk(false);
      setMicOk(false);
    }
    setTesting(false);
  };

  const handleEnter = useCallback(() => {
    stream?.getTracks().forEach(t => t.stop());
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    onReady();
  }, [stream, onReady]);

  const allGood = cameraOk === true && micOk === true;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full space-y-5"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <img src={mascotImg} alt="Mascot" className="w-16 h-16 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">
            {isDoctor ? "Preparar Atendimento" : "Sala de Espera"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Vamos verificar se sua câmera e microfone estão funcionando
          </p>
        </div>

        {/* Appointment details (for patients) */}
        {!isDoctor && (doctorName || scheduledAt) && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-1">
              {doctorName && (
                <p className="text-sm font-semibold text-foreground">
                  📋 Consulta com {doctorName}
                </p>
              )}
              {doctorSpecialty && (
                <p className="text-xs text-muted-foreground">Especialidade: {doctorSpecialty}</p>
              )}
              {scheduledAt && (
                <p className="text-xs text-muted-foreground">
                  Horário: {new Date(scheduledAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </p>
              )}
            </CardContent>
          </Card>
        )}

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

        {/* Device status + volume bar */}
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
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  {micOk ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />} Microfone
                </p>
                {micOk && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Volume2 className="w-3 h-3 text-muted-foreground" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-secondary rounded-full"
                        animate={{ width: `${volume * 100}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>
                )}
                {!micOk && micOk !== null && (
                  <p className="text-xs text-muted-foreground">Não detectado</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Doctor status (patient only) */}
        {!isDoctor && appointmentId && (
          <Card className={`border ${doctorPresent ? "border-secondary/30 bg-secondary/5" : "border-primary/20 bg-primary/5"}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${doctorPresent ? "bg-secondary/10" : "bg-primary/10"}`}>
                <Users className={`w-5 h-5 ${doctorPresent ? "text-secondary" : "text-primary"}`} />
              </div>
              <div className="flex-1">
                {doctorPresent ? (
                  <>
                    <p className="text-sm font-medium text-secondary">Médico na sala!</p>
                    <p className="text-xs text-muted-foreground">Clique em "Entrar na Consulta" para iniciar.</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      Aguardando o médico entrar...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doctorName ? `${doctorName} já foi notificado(a). Você é o próximo da fila.` : "O médico será notificado quando entrar."}
                    </p>
                  </>
                )}
              </div>
              <Badge variant="outline" className={`shrink-0 text-xs ${doctorPresent ? "border-secondary/30 text-secondary" : "border-primary/30 text-primary"}`}>
                {doctorPresent ? "Pronto" : "Na fila"}
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Quick tips */}
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-primary" /> Dicas rápidas
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <Headphones className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                Certifique-se de estar em um lugar silencioso
              </li>
              <li className="flex items-start gap-2">
                <Volume2 className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                Verifique sua conexão com a internet
              </li>
              <li className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                Tenha seus documentos e exames em mãos
              </li>
            </ul>
          </CardContent>
        </Card>

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
          {doctorPresent || isDoctor ? (
            <Button
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={handleEnter}
              disabled={testing}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Entrar na Consulta
            </Button>
          ) : (
            <Button
              className="flex-1 bg-gradient-hero text-primary-foreground"
              onClick={handleEnter}
              disabled={testing}
            >
              {allGood ? "Entrar na Consulta" : "Entrar mesmo assim"}
            </Button>
          )}
        </div>

        {/* Support link */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-primary gap-1.5"
            onClick={() => navigate("/dashboard/support")}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Problemas com câmera ou microfone? Fale com o Suporte
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
