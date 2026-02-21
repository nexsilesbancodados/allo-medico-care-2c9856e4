import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera, Mic, MicOff, CameraOff, CheckCircle2, AlertTriangle,
  Loader2, Users, Volume2, MessageCircle, Clock, Send, RefreshCw,
  PhoneCall, Settings, ChevronDown, Wifi, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import mascotImg from "@/assets/mascot-wave.png";
import { format, differenceInSeconds } from "date-fns";
import { ptBR } from "date-fns/locale";
import PreConsultationForm from "@/components/patient/PreConsultationForm";
import HealthTipsCarousel from "./HealthTipsCarousel";

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
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
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
  const [symptomsSubmitted, setSymptomsSubmitted] = useState(false);
  const [showSymptomForm, setShowSymptomForm] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Check if symptoms already submitted
  useEffect(() => {
    if (!appointmentId || isDoctor) return;
    supabase.from("pre_consultation_symptoms")
      .select("id")
      .eq("appointment_id", appointmentId)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setSymptomsSubmitted(true);
        else setShowSymptomForm(true);
      });
  }, [appointmentId, isDoctor]);

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
      streamRef.current?.getTracks().forEach(t => t.stop());
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
      streamRef.current = mediaStream;
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

  const toggleCamera = useCallback(() => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOn(videoTrack.enabled);
    }
  }, [stream]);

  const toggleMic = useCallback(() => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  }, [stream]);

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
  const userName = user?.user_metadata?.first_name || (isDoctor ? "Médico" : "Paciente");

  return (
    <div className="min-h-screen bg-[hsl(220,20%,6%)] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-5xl"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={mascotImg} alt="Mascot" className="w-10 h-10" />
            <div>
              <h1 className="text-lg font-bold text-white">
                {isDoctor ? "Preparar Atendimento" : "Pronto para entrar?"}
              </h1>
              <p className="text-xs text-[hsl(220,15%,55%)]">
                Verifique seu áudio e vídeo antes de entrar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(150,60%,40%,0.15)] border border-[hsl(150,60%,40%,0.25)]">
              <Wifi className="w-3 h-3 text-[hsl(150,60%,45%)]" />
              <span className="text-[11px] text-[hsl(150,60%,55%)] font-medium">Conexão boa</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(220,20%,15%)] border border-[hsl(220,15%,25%)]">
              <Shield className="w-3 h-3 text-[hsl(220,15%,55%)]" />
              <span className="text-[11px] text-[hsl(220,15%,55%)] font-medium">Criptografado</span>
            </div>
          </div>
        </div>

        {/* Main content: two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Left: Video preview */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-[hsl(220,20%,10%)] border border-[hsl(220,15%,18%)] shadow-2xl">
              {/* Video aspect ratio container */}
              <div className="relative aspect-[4/3]">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${!cameraOn ? 'hidden' : ''}`}
                  style={{ transform: 'scaleX(-1)' }}
                />

                {/* Camera off state */}
                {(!cameraOn || (!cameraOk && !testing)) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[hsl(220,20%,12%)]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-24 h-24 rounded-full bg-[hsl(220,20%,20%)] flex items-center justify-center">
                        <span className="text-4xl font-bold text-[hsl(220,15%,55%)]">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-[hsl(220,15%,55%)]">
                        {!cameraOk && !testing ? "Câmera não detectada" : "Câmera desligada"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Loading overlay */}
                {testing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[hsl(220,20%,8%,0.7)] backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                      <p className="text-sm text-[hsl(220,15%,65%)]">Verificando dispositivos...</p>
                    </div>
                  </div>
                )}

                {/* User name badge */}
                <div className="absolute bottom-3 left-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(220,20%,8%,0.75)] backdrop-blur-md border border-[hsl(220,15%,20%)]">
                    <span className="text-sm font-medium text-white">{userName}</span>
                  </div>
                </div>

                {/* Mic volume indicator */}
                {micOn && micOk && (
                  <div className="absolute bottom-3 right-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[hsl(220,20%,8%,0.75)] backdrop-blur-md border border-[hsl(220,15%,20%)]">
                      <Volume2 className="w-3.5 h-3.5 text-[hsl(150,60%,50%)]" />
                      <div className="flex gap-0.5 items-end h-3">
                        {[0.2, 0.4, 0.6, 0.8, 1].map((threshold, i) => (
                          <motion.div
                            key={i}
                            className={`w-1 rounded-full ${volume >= threshold ? 'bg-[hsl(150,60%,50%)]' : 'bg-[hsl(220,15%,30%)]'}`}
                            animate={{ height: volume >= threshold ? `${60 + i * 10}%` : '30%' }}
                            transition={{ duration: 0.1 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls bar */}
              <div className="flex items-center justify-center gap-3 py-4 bg-[hsl(220,20%,9%)]">
                <button
                  onClick={toggleMic}
                  disabled={!micOk}
                  className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                    micOn && micOk
                      ? 'bg-[hsl(220,20%,18%)] hover:bg-[hsl(220,20%,23%)] text-white'
                      : 'bg-destructive/90 hover:bg-destructive text-destructive-foreground'
                  }`}
                  title={micOn ? "Desligar microfone" : "Ligar microfone"}
                >
                  {micOn && micOk ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  {micOk === false && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive flex items-center justify-center">
                      <AlertTriangle className="w-2.5 h-2.5 text-destructive-foreground" />
                    </div>
                  )}
                </button>

                <button
                  onClick={toggleCamera}
                  disabled={!cameraOk}
                  className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                    cameraOn && cameraOk
                      ? 'bg-[hsl(220,20%,18%)] hover:bg-[hsl(220,20%,23%)] text-white'
                      : 'bg-destructive/90 hover:bg-destructive text-destructive-foreground'
                  }`}
                  title={cameraOn ? "Desligar câmera" : "Ligar câmera"}
                >
                  {cameraOn && cameraOk ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                  {cameraOk === false && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive flex items-center justify-center">
                      <AlertTriangle className="w-2.5 h-2.5 text-destructive-foreground" />
                    </div>
                  )}
                </button>

                <div className="w-px h-8 bg-[hsl(220,15%,20%)] mx-1" />

                <button
                  onClick={testDevices}
                  disabled={testing}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-[hsl(220,20%,18%)] hover:bg-[hsl(220,20%,23%)] text-[hsl(220,15%,60%)] transition-all duration-200"
                  title="Re-testar dispositivos"
                >
                  <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Device status pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                cameraOk ? 'bg-[hsl(150,60%,40%,0.12)] text-[hsl(150,60%,55%)] border border-[hsl(150,60%,40%,0.2)]'
                         : cameraOk === false ? 'bg-destructive/10 text-destructive border border-destructive/20'
                         : 'bg-[hsl(220,20%,15%)] text-[hsl(220,15%,55%)] border border-[hsl(220,15%,22%)]'
              }`}>
                {cameraOk ? <CheckCircle2 className="w-3.5 h-3.5" /> : cameraOk === false ? <AlertTriangle className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Câmera {cameraOk ? 'OK' : cameraOk === false ? 'Erro' : '...'}
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                micOk ? 'bg-[hsl(150,60%,40%,0.12)] text-[hsl(150,60%,55%)] border border-[hsl(150,60%,40%,0.2)]'
                      : micOk === false ? 'bg-destructive/10 text-destructive border border-destructive/20'
                      : 'bg-[hsl(220,20%,15%)] text-[hsl(220,15%,55%)] border border-[hsl(220,15%,22%)]'
              }`}>
                {micOk ? <CheckCircle2 className="w-3.5 h-3.5" /> : micOk === false ? <AlertTriangle className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Microfone {micOk ? 'OK' : micOk === false ? 'Erro' : '...'}
              </div>
              {!allGood && !testing && (
                <p className="text-[11px] text-[hsl(220,15%,45%)]">
                  Dispositivos com erro não impedirão sua entrada.
                </p>
              )}
            </div>
          </div>

          {/* Right: Info panel */}
          <div className="space-y-4">
            {/* Appointment details */}
            {!isDoctor && (doctorName || scheduledAt) && (
              <div className="rounded-xl bg-[hsl(220,20%,10%)] border border-[hsl(220,15%,18%)] p-4 space-y-3">
                {doctorName && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">{doctorName.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{doctorName}</p>
                      {doctorSpecialty && (
                        <p className="text-xs text-[hsl(220,15%,50%)]">{doctorSpecialty}</p>
                      )}
                    </div>
                  </div>
                )}
                {scheduledAt && (
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[hsl(220,20%,13%)]">
                    <p className="text-xs text-[hsl(220,15%,55%)]">
                      {format(new Date(scheduledAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {countdown !== null && countdown > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-primary" />
                        <span className="text-xs font-mono font-bold text-primary">
                          {formatCountdown(countdown)}
                        </span>
                      </div>
                    )}
                    {countdown !== null && countdown === 0 && (
                      <Badge className="bg-[hsl(150,60%,40%,0.15)] text-[hsl(150,60%,55%)] border-[hsl(150,60%,40%,0.25)] text-[10px]">
                        Horário chegou!
                      </Badge>
                    )}
                  </div>
                )}
                {waitingPosition !== null && waitingPosition > 0 && (
                  <div className="flex items-center gap-2 text-xs text-[hsl(220,15%,55%)]">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    Posição na fila: <strong className="text-primary">#{waitingPosition}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Doctor status */}
            {!isDoctor && appointmentId && (
              <div className={`rounded-xl border p-4 flex items-center gap-3 ${
                doctorPresent
                  ? 'bg-[hsl(150,60%,40%,0.08)] border-[hsl(150,60%,40%,0.2)]'
                  : 'bg-[hsl(220,20%,10%)] border-[hsl(220,15%,18%)]'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  doctorPresent ? 'bg-[hsl(150,60%,40%,0.15)]' : 'bg-primary/10'
                }`}>
                  {doctorPresent ? (
                    <CheckCircle2 className="w-5 h-5 text-[hsl(150,60%,50%)]" />
                  ) : (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                      <Loader2 className="w-5 h-5 text-primary" />
                    </motion.div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {doctorPresent ? (
                    <>
                      <p className="text-sm font-medium text-[hsl(150,60%,55%)]">Médico na sala!</p>
                      <p className="text-xs text-[hsl(220,15%,50%)]">Clique para entrar na consulta.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-white">Aguardando o médico...</p>
                      <p className="text-xs text-[hsl(220,15%,50%)] truncate">
                        {doctorName ? `${doctorName} foi notificado(a)` : "O médico será notificado"}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Enter button */}
            <Button
              className={`w-full h-12 rounded-xl text-sm font-semibold shadow-lg transition-all duration-200 active:scale-[0.98] gap-2 ${
                doctorPresent
                  ? 'bg-[hsl(150,60%,40%)] hover:bg-[hsl(150,60%,35%)] text-white'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
              onClick={handleEnter}
              disabled={testing}
            >
              <PhoneCall className="w-5 h-5" />
              {doctorPresent ? "Entrar na Consulta" : allGood ? "Entrar na Consulta" : "Entrar mesmo assim"}
            </Button>

            {/* Waiting room chat */}
            {!isDoctor && appointmentId && (
              <div>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="flex items-center gap-2 text-xs font-medium text-[hsl(220,15%,55%)] hover:text-white transition-colors w-full"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  {showChat ? "Fechar chat" : "Chat da sala de espera"}
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
                      className="overflow-hidden mt-2"
                    >
                      <div className="rounded-xl bg-[hsl(220,20%,10%)] border border-[hsl(220,15%,18%)] p-3">
                        <div className="h-32 overflow-y-auto space-y-2 mb-2">
                          {chatMessages.length === 0 && (
                            <p className="text-xs text-[hsl(220,15%,40%)] text-center mt-8">
                              Envie uma mensagem enquanto espera...
                            </p>
                          )}
                          {chatMessages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === (isDoctor ? "doctor" : "patient") ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-xs ${
                                msg.sender === (isDoctor ? "doctor" : "patient")
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-[hsl(220,20%,18%)] text-white rounded-bl-sm"
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
                            className="flex-1 bg-[hsl(220,20%,15%)] border border-[hsl(220,15%,22%)] rounded-xl px-3 py-2 text-xs text-white placeholder:text-[hsl(220,15%,40%)] outline-none focus:border-primary/50 transition-colors"
                          />
                          <button onClick={sendChatMessage} className="text-primary hover:text-primary/80 px-2">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Pre-consultation questionnaire (patient only) */}
            {!isDoctor && appointmentId && showSymptomForm && !symptomsSubmitted && (
              <PreConsultationForm
                appointmentId={appointmentId}
                onComplete={() => { setSymptomsSubmitted(true); setShowSymptomForm(false); }}
              />
            )}
            {!isDoctor && symptomsSubmitted && (
              <div className="rounded-xl bg-[hsl(150,60%,40%,0.08)] border border-[hsl(150,60%,40%,0.2)] p-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[hsl(150,60%,50%)] shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[hsl(150,60%,55%)]">Sintomas enviados</p>
                  <p className="text-xs text-[hsl(220,15%,50%)]">O médico terá acesso aos seus sintomas.</p>
                </div>
              </div>
            )}

            {/* Tips toggle */}
            <button
              onClick={() => setShowTips(!showTips)}
              className="flex items-center gap-2 text-xs text-[hsl(220,15%,55%)] hover:text-white transition-colors w-full"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTips ? 'rotate-180' : ''}`} />
              Dicas para a consulta
            </button>
            <AnimatePresence>
              {showTips && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl bg-[hsl(220,20%,10%)] border border-[hsl(220,15%,18%)] p-4 space-y-2">
                    {[
                      { icon: "🎧", text: "Esteja em um lugar silencioso" },
                      { icon: "📶", text: "Verifique sua conexão com a internet" },
                      { icon: "📋", text: "Tenha seus exames em mãos" },
                      { icon: "💡", text: "Boa iluminação ajuda o médico a avaliar" },
                    ].map((tip, i) => (
                      <p key={i} className="text-xs text-[hsl(220,15%,55%)] flex items-center gap-2">
                        <span>{tip.icon}</span> {tip.text}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Support link */}
            <div className="text-center pt-2">
              <button
                className="text-[11px] text-[hsl(220,15%,45%)] hover:text-primary transition-colors flex items-center gap-1.5 mx-auto"
                onClick={() => navigate("/dashboard/patient/support")}
              >
                <MessageCircle className="w-3 h-3" />
                Problemas? Fale com o Suporte
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PreCallCheck;
