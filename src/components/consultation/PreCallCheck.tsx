import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Mic, MicOff, CameraOff, CheckCircle2, AlertTriangle, Loader2, Users, Headphones, Volume2, Info, MessageCircle, Clock, Send, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import mascotImg from "@/assets/mascot-wave.png";
import { format, differenceInSeconds } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PreCallCheckProps {
  appointmentId?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  scheduledAt?: string;
  onReady: () => void;
  isDoctor?: boolean;
}

interface WaitingMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

const PreCallCheck = ({ appointmentId, doctorName, doctorSpecialty, scheduledAt, onReady, isDoctor = false }: PreCallCheckProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [volume, setVolume] = useState(0);
  const [doctorPresent, setDoctorPresent] = useState(false);
  const [pollingStatus, setPollingStatus] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [waitingPosition, setWaitingPosition] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<WaitingMessage[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!scheduledAt) return;
    const update = () => {
      const diff = differenceInSeconds(new Date(scheduledAt), new Date());
      setCountdown(Math.max(0, diff));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [scheduledAt]);

  // Device testing
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

    const checkNow = async () => {
      const { data } = await supabase.from("appointments").select("status").eq("id", appointmentId).single();
      if (data && (data.status === "medico_presente" || data.status === "in_progress")) {
        setDoctorPresent(true);
      }
    };
    checkNow();

    // Check waiting position
    const checkPosition = async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id")
        .in("status", ["waiting", "scheduled"])
        .lt("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true });
      if (data) {
        const idx = data.findIndex(a => a.id === appointmentId);
        setWaitingPosition(idx >= 0 ? idx + 1 : null);
      }
    };
    checkPosition();
    const posInterval = setInterval(checkPosition, 15000);

    return () => { supabase.removeChannel(channel); clearInterval(posInterval); };
  }, [appointmentId, isDoctor]);

  // Waiting room chat
  useEffect(() => {
    if (!appointmentId || !user) return;
    const roomChannel = supabase.channel(`waiting-chat-${appointmentId}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = roomChannel;
    roomChannel
      .on("broadcast", { event: "waiting-msg" }, ({ payload }) => {
        setChatMessages(prev => [...prev, payload as WaitingMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(roomChannel); };
  }, [appointmentId, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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
          setVolume(Math.min(avg / 80, 1));
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

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const msg: WaitingMessage = {
      id: Date.now().toString(),
      sender: isDoctor ? "doctor" : "patient",
      text: chatInput.trim(),
      time: format(new Date(), "HH:mm"),
    };
    setChatMessages(prev => [...prev, msg]);
    channelRef.current?.send({ type: "broadcast", event: "waiting-msg", payload: msg });
    setChatInput("");
  };

  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
    if (m > 0) return `${m}min ${String(s).padStart(2, "0")}s`;
    return `${s}s`;
  };

  const allGood = cameraOk === true && micOk === true;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full space-y-4 sm:space-y-5"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <img src={mascotImg} alt="Mascot" className="w-14 h-14 sm:w-16 sm:h-16 mx-auto" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {isDoctor ? "Preparar Atendimento" : "Sala de Espera"}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Vamos verificar se sua câmera e microfone estão funcionando
          </p>
        </div>

        {/* Countdown + Appointment details */}
        {!isDoctor && (doctorName || scheduledAt) && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {doctorName && (
                    <p className="text-sm font-semibold text-foreground truncate">
                      📋 Consulta com {doctorName}
                    </p>
                  )}
                  {doctorSpecialty && (
                    <p className="text-xs text-muted-foreground">{doctorSpecialty}</p>
                  )}
                  {scheduledAt && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(scheduledAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
                {countdown !== null && countdown > 0 && (
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-mono font-bold text-primary">
                        {formatCountdown(countdown)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">para começar</p>
                  </div>
                )}
                {countdown !== null && countdown === 0 && (
                  <Badge className="bg-secondary/10 text-secondary border-secondary/20 shrink-0">
                    ⏰ Horário chegou!
                  </Badge>
                )}
              </div>
              {waitingPosition !== null && waitingPosition > 0 && (
                <div className="mt-2 pt-2 border-t border-primary/10">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-primary" />
                    Você é o <strong className="text-primary">#{waitingPosition}</strong> na fila
                  </p>
                </div>
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

        {/* Device status */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Card className={`border ${cameraOk ? "border-secondary/30 bg-secondary/5" : cameraOk === false ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              {cameraOk ? (
                <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
              ) : cameraOk === false ? (
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground shrink-0" />
              )}
              <div>
                <p className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" /> Câmera
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {cameraOk ? "OK" : cameraOk === false ? "Erro" : "..."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={`border ${micOk ? "border-secondary/30 bg-secondary/5" : micOk === false ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              {micOk ? (
                <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
              ) : micOk === false ? (
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-1">
                  {micOk ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />} Mic
                </p>
                {micOk && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Volume2 className="w-3 h-3 text-muted-foreground shrink-0" />
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-secondary rounded-full"
                        animate={{ width: `${volume * 100}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>
                )}
                {!micOk && micOk !== null && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Erro</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Doctor status (patient only) */}
        {!isDoctor && appointmentId && (
          <Card className={`border ${doctorPresent ? "border-secondary/30 bg-secondary/5" : "border-primary/20 bg-primary/5"}`}>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${doctorPresent ? "bg-secondary/10" : "bg-primary/10"}`}>
                {doctorPresent ? (
                  <CheckCircle2 className={`w-5 h-5 text-secondary`} />
                ) : (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Loader2 className="w-5 h-5 text-primary" />
                  </motion.div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {doctorPresent ? (
                  <>
                    <p className="text-sm font-medium text-secondary">✅ Médico na sala!</p>
                    <p className="text-xs text-muted-foreground">Clique em "Entrar" para iniciar.</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">Aguardando o médico...</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {doctorName ? `${doctorName} foi notificado(a)` : "O médico será notificado"}
                    </p>
                  </>
                )}
              </div>
              <Badge variant="outline" className={`shrink-0 text-[10px] sm:text-xs ${doctorPresent ? "border-secondary/30 text-secondary" : "border-primary/30 text-primary"}`}>
                {doctorPresent ? "Pronto" : "Na fila"}
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Waiting room chat */}
        {!isDoctor && appointmentId && (
          <div>
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {showChat ? "Fechar chat" : "Abrir chat da sala de espera"}
              {chatMessages.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {chatMessages.length}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showChat && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Card className="border-border">
                    <CardContent className="p-3">
                      <div className="h-32 overflow-y-auto space-y-2 mb-2">
                        {chatMessages.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center mt-8">
                            Envie uma mensagem enquanto espera...
                          </p>
                        )}
                        {chatMessages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.sender === (isDoctor ? "doctor" : "patient") ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-xs ${
                              msg.sender === (isDoctor ? "doctor" : "patient")
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            }`}>
                              <p>{msg.text}</p>
                              <p className="text-[9px] opacity-50 mt-0.5">{msg.time}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && sendChatMessage()}
                          placeholder="Digite uma mensagem..."
                          className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                        />
                        <Button size="icon" variant="ghost" onClick={sendChatMessage} className="text-primary hover:bg-primary/10 rounded-xl h-8 w-8">
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Quick tips */}
        <Card className="border-border">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-primary" /> Dicas rápidas
            </p>
            <ul className="space-y-1 sm:space-y-1.5 text-[11px] sm:text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <Headphones className="w-3 h-3 sm:w-3.5 sm:h-3.5 mt-0.5 text-primary shrink-0" />
                Esteja em um lugar silencioso
              </li>
              <li className="flex items-start gap-2">
                <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 mt-0.5 text-primary shrink-0" />
                Verifique sua conexão com a internet
              </li>
              <li className="flex items-start gap-2">
                <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 mt-0.5 text-primary shrink-0" />
                Tenha seus exames em mãos
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-10 sm:h-10 active:scale-[0.97] transition-transform"
            onClick={testDevices}
            disabled={testing}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${testing ? "animate-spin" : ""}`} />
            Testar
          </Button>
          <Button
            className={`flex-1 h-10 sm:h-10 active:scale-[0.97] transition-transform ${
              doctorPresent ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : "bg-gradient-hero text-primary-foreground"
            }`}
            onClick={handleEnter}
            disabled={testing}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            {doctorPresent ? "Entrar na Consulta" : allGood ? "Entrar na Consulta" : "Entrar mesmo assim"}
          </Button>
        </div>

        {/* Support link */}
        <div className="text-center pb-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-[11px] sm:text-xs text-muted-foreground hover:text-primary gap-1.5"
            onClick={() => navigate("/dashboard/patient/support")}
          >
            <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Problemas? Fale com o Suporte
          </Button>
        </div>

        {!allGood && !testing && (
          <p className="text-[10px] sm:text-xs text-center text-muted-foreground pb-2">
            Alguns dispositivos não foram detectados. Você ainda pode entrar.
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default PreCallCheck;
