import { logError } from "@/lib/logger";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Phone, MessageSquare, Clock, Send, X, Video, Shield, Wifi, WifiOff,
  Maximize2, Minimize2
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import SEOHead from "@/components/SEOHead";

interface ChatMessage {
  id: string;
  sender: "patient" | "doctor";
  text: string;
  time: string;
}

const GuestConsultation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [guestPatient, setGuestPatient] = useState<{ full_name: string; phone: string; email?: string | null } | null>(null);
  const [doctorName, setDoctorName] = useState("");

  // Video / controls
  const [videoLoading, setVideoLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameContainerRef = useRef<HTMLDivElement>(null);
  const frameInitialized = useRef(false);

  useEffect(() => {
    if (token) fetchAppointmentByToken();
    else setError("Token de acesso não encontrado.");
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [token]);

  // Timer
  useEffect(() => {
    if (!videoLoading && !videoError) {
      timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [videoLoading, videoError]);

  // Network status
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  // Fullscreen
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const fetchAppointmentByToken = async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke("guest-consultation", {
        body: { token },
      });

      if (fnError || !data?.appointment) {
        setError("Consulta não encontrada ou link inválido.");
        setLoading(false);
        return;
      }

      setAppointment(data.appointment);
      setGuestPatient(data.guest_patient);
      setDoctorName(data.doctor_name);
      setLoading(false);

      // Initialize Metered video after appointment loads
      initMeteredRoom(data.appointment.id, data.guest_patient?.full_name);
    } catch {
      setError("Erro ao carregar consulta.");
      setLoading(false);
    }
  };

  const initMeteredRoom = async (appointmentId: string, userName?: string) => {
    if (frameInitialized.current) return;
    frameInitialized.current = true;

    try {
      const { data, error: fnError } = await supabase.functions.invoke("metered-room", {
        body: { appointmentId },
      });

      if (fnError || !data?.roomURL) {
        logError("GuestConsultation create room failed", fnError, { data });
        setVideoError("Não foi possível criar a sala de vídeo.");
        setVideoLoading(false);
        return;
      }

      const roomURL = data.roomURL;

      // Load Metered Frame SDK
      await new Promise<void>((resolve, reject) => {
        if (window.MeteredFrame) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://cdn.metered.ca/sdk/frame/1.4.3/sdk-frame.min.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Metered SDK"));
        document.head.appendChild(script);
      });

      if (!frameContainerRef.current) return;

      const frame = new (window as any).MeteredFrame();
      frame.init(
        {
          roomURL,
          autoJoin: true,
          name: userName || "Paciente",
          joinVideoOn: true,
          joinAudioOn: true,
          showInviteBox: false,
        },
        frameContainerRef.current
      );

      frame.on("participantJoined", () => setVideoLoading(false));
      frame.on("meetingEnded", () => endCall());
      setTimeout(() => setVideoLoading(false), 5000);
    } catch (err) {
      logError("GuestConsultation video init error", err);
      setVideoError("Erro ao inicializar a videochamada.");
      setVideoLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: "patient",
      text: chatInput.trim(),
      time: format(new Date(), "HH:mm"),
    };
    setMessages(prev => [...prev, msg]);
    setChatInput("");
  };

  const endCall = () => {
    if (!confirmEnd) {
      setConfirmEnd(true);
      setTimeout(() => setConfirmEnd(false), 4000);
      return;
    }
    toast.success("Consulta encerrada");
    const params = new URLSearchParams();
    if (appointment?.id) params.set("appointment", appointment.id);
    if (doctorName) params.set("doctor", doctorName);
    navigate(`/consulta/avaliacao?${params.toString()}`);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(220,30%,4%)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Video className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white">Preparando sua consulta</p>
            <p className="text-xs text-[hsl(220,15%,45%)] mt-1">Conectando à sala segura...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto flex items-center justify-center mb-4">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Link Inválido</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate("/")} variant="outline">Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(220,30%,4%)] flex flex-col">
      <SEOHead title="Consulta por Vídeo" description="Sala de videoconsulta avulsa da AloClinica." />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[hsl(220,20%,6%)] border-b border-[hsl(220,15%,12%)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center">
            <Video className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-[hsl(220,20%,95%)]">{doctorName || "Consulta"}</p>
            <p className="text-xs text-[hsl(220,15%,50%)]">Telemedicina — Consulta Avulsa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-[hsl(220,20%,10%,0.8)] border-[hsl(220,15%,25%)] text-[hsl(220,20%,85%)] gap-1.5 font-mono text-xs">
            <Clock className="w-3 h-3" />
            {formatTime(elapsed)}
          </Badge>
          <Badge variant="outline" className={`gap-1 text-[10px] ${isOnline ? "border-emerald-500/30 text-emerald-400" : "border-destructive/30 text-destructive"}`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? "Conectado" : "Offline"}
          </Badge>
          <Badge variant="outline" className="border-emerald-500/20 text-emerald-400/80 text-[10px] gap-1">
            <Shield className="w-3 h-3" />
            Criptografado
          </Badge>
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-lg bg-[hsl(220,20%,8%,0.75)] border border-[hsl(220,15%,20%)] flex items-center justify-center text-[hsl(220,20%,70%)] hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex relative">
        <div className="flex-1 relative bg-[hsl(220,30%,5%)]">
          {/* Loading overlay */}
          <AnimatePresence>
            {videoLoading && !videoError && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center bg-[hsl(220,30%,5%)]"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-[hsl(220,20%,85%)]">Conectando à videochamada...</p>
                    <p className="text-xs text-[hsl(220,15%,45%)]">Verifique se câmera e microfone estão permitidos</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video error */}
          {videoError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[hsl(220,30%,5%)]">
              <div className="flex flex-col items-center gap-4 text-center px-6">
                <Phone className="w-12 h-12 text-destructive" />
                <p className="text-sm text-[hsl(220,20%,85%)]">{videoError}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>Tentar novamente</Button>
              </div>
            </div>
          )}

          {/* Network warning */}
          <AnimatePresence>
            {!isOnline && !videoLoading && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-destructive/90 text-destructive-foreground text-xs font-medium flex items-center gap-2 shadow-lg"
              >
                <WifiOff className="w-4 h-4" />
                Conexão perdida. Reconectando...
              </motion.div>
            )}
          </AnimatePresence>

          {/* Metered Frame container */}
          <div ref={frameContainerRef} className="w-full h-full" style={{ minHeight: "400px" }} />
        </div>

        {/* Chat sidebar */}
        {showChat && (
          <div className="w-80 border-l border-[hsl(220,15%,12%)] bg-[hsl(220,20%,6%)] flex flex-col">
            <div className="p-3 border-b border-[hsl(220,15%,12%)] flex items-center justify-between">
              <p className="text-sm font-medium text-[hsl(220,20%,95%)]">Chat</p>
              <button onClick={() => setShowChat(false)}>
                <X className="w-4 h-4 text-[hsl(220,15%,50%)]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <div className="text-center mt-12 space-y-2">
                  <MessageSquare className="w-8 h-8 text-[hsl(220,15%,25%)] mx-auto" />
                  <p className="text-xs text-[hsl(220,15%,35%)]">Nenhuma mensagem ainda</p>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === "patient" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    msg.sender === "patient"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-[hsl(220,20%,13%)] text-[hsl(220,20%,90%)] rounded-bl-md border border-[hsl(220,15%,18%)]"
                  }`}>
                    <p>{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender === "patient" ? "text-primary-foreground/50" : "text-[hsl(220,15%,35%)]"}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-[hsl(220,15%,12%)] flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Mensagem..."
                className="flex-1 bg-[hsl(220,20%,10%)] border border-[hsl(220,15%,18%)] rounded-xl px-3 py-2 text-sm text-[hsl(220,20%,95%)] placeholder:text-[hsl(220,15%,30%)] outline-none focus:border-primary transition-colors"
              />
              <Button size="icon" variant="ghost" onClick={sendMessage} className="shrink-0">
                <Send className="w-4 h-4 text-primary" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-3 py-4 bg-[hsl(220,20%,6%)] border-t border-[hsl(220,15%,12%)]">
        <Button
          variant="ghost" size="icon"
          className={`rounded-full w-12 h-12 ${showChat ? "bg-primary text-primary-foreground" : "bg-[hsl(220,20%,12%)] text-[hsl(220,20%,85%)] hover:bg-[hsl(220,20%,16%)]"}`}
          onClick={() => setShowChat(!showChat)}
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
        <div className="w-px h-8 bg-[hsl(220,15%,15%)] mx-2" />
        <Button
          onClick={endCall}
          className={`rounded-full px-8 py-3 h-12 shadow-lg gap-2 font-semibold transition-all hover:scale-105 active:scale-95 ${
            confirmEnd
              ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/25"
              : "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-destructive/25"
          }`}
        >
          <Phone className="w-5 h-5 rotate-[135deg]" />
          {confirmEnd ? "Confirmar encerramento?" : "Finalizar Atendimento"}
        </Button>
      </div>
    </div>
  );
};

export default GuestConsultation;