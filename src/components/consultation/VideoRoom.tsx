import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, MicOff, Video, VideoOff, Phone, MessageSquare,
  FileText, Clock, Send, X, Monitor, MonitorOff
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  sender: "patient" | "doctor";
  text: string;
  time: string;
}

const VideoRoom = () => {
  const { appointmentId } = useParams();
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [appointment, setAppointment] = useState<any>(null);
  const [otherPartyName, setOtherPartyName] = useState("");
  const [loading, setLoading] = useState(true);

  // Media
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Controls
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaError, setMediaError] = useState("");

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Notes (doctor only)
  const [notes, setNotes] = useState("");

  const isDoctor = roles.includes("doctor") || roles.includes("admin");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize media
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setMediaReady(true);
      } catch (err: any) {
        console.error("Media error:", err);
        setMediaError(
          err.name === "NotAllowedError"
            ? "Permissão de câmera/microfone negada. Habilite nas configurações do navegador."
            : "Erro ao acessar câmera/microfone. Verifique se estão conectados."
        );
      }
    };

    initMedia();
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (appointmentId) fetchAppointment();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [appointmentId]);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const fetchAppointment = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (!data) { setLoading(false); return; }
    setAppointment(data);

    await supabase.from("appointments").update({ status: "in_progress" }).eq("id", appointmentId);

    const otherUserId = isDoctor ? data.patient_id : null;
    const otherDoctorId = !isDoctor ? data.doctor_id : null;

    if (otherUserId) {
      const { data: profile } = await supabase
        .from("profiles").select("first_name, last_name").eq("user_id", otherUserId).single();
      if (profile) setOtherPartyName(`${profile.first_name} ${profile.last_name}`);
    } else if (otherDoctorId) {
      const { data: doc } = await supabase
        .from("doctor_profiles").select("user_id").eq("id", otherDoctorId).single();
      if (doc) {
        const { data: profile } = await supabase
          .from("profiles").select("first_name, last_name").eq("user_id", doc.user_id).single();
        if (profile) setOtherPartyName(`Dr(a). ${profile.first_name} ${profile.last_name}`);
      }
    }

    if (isDoctor) {
      const { data: noteData } = await supabase
        .from("consultation_notes").select("content").eq("appointment_id", appointmentId).single();
      if (noteData) setNotes(noteData.content);
    }

    setLoading(false);
  };

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
      setMicOn((prev) => !prev);
    }
  }, []);

  const toggleCam = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
      setCamOn((prev) => !prev);
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (screenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      // Restore camera
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setScreenSharing(false);
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screen;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screen;
        }
        screen.getVideoTracks()[0].onended = () => {
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
          setScreenSharing(false);
        };
        setScreenSharing(true);
      } catch (err) {
        console.error("Screen share error:", err);
      }
    }
  }, [screenSharing]);

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
      sender: isDoctor ? "doctor" : "patient",
      text: chatInput.trim(),
      time: format(new Date(), "HH:mm"),
    };
    setMessages((prev) => [...prev, msg]);
    setChatInput("");
  };

  const saveNotes = async () => {
    if (!appointmentId || !appointment) return;
    const { data: doc } = await supabase
      .from("doctor_profiles").select("id").eq("user_id", user!.id).single();
    if (!doc) return;

    const { data: existing } = await supabase
      .from("consultation_notes").select("id").eq("appointment_id", appointmentId).single();

    if (existing) {
      await supabase.from("consultation_notes").update({ content: notes }).eq("id", existing.id);
    } else {
      await supabase.from("consultation_notes").insert({
        appointment_id: appointmentId, doctor_id: doc.id, content: notes,
      });
    }
    toast({ title: "Anotações salvas!" });
  };

  const endCall = async () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());

    if (isDoctor && notes) await saveNotes();

    await supabase.from("appointments").update({ status: "completed" }).eq("id", appointmentId);
    toast({ title: "Consulta encerrada" });

    if (isDoctor) {
      navigate(`/dashboard/prescribe/${appointmentId}`);
    } else {
      navigate("/dashboard/appointments");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--foreground)/0.97)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card/10 border-b border-border/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-hero flex items-center justify-center shadow-lg">
            <Video className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-foreground">{otherPartyName || "Consulta"}</p>
            <p className="text-xs text-primary-foreground/50">Telemedicina • Alô Médico</p>
          </div>
        </div>

        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/20 text-destructive border border-destructive/30"
        >
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <Clock className="w-3.5 h-3.5" />
          <span className="text-sm font-mono font-semibold">{formatTime(elapsed)}</span>
        </motion.div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 relative flex items-center justify-center p-4">
          {/* Main video / Waiting */}
          <div className="w-full max-w-4xl aspect-video rounded-2xl bg-[hsl(210,50%,8%)] border border-border/20 flex items-center justify-center overflow-hidden shadow-2xl">
            {mediaError ? (
              <div className="text-center p-8">
                <VideoOff className="w-16 h-16 text-destructive/60 mx-auto mb-4" />
                <p className="text-primary-foreground/70 text-sm max-w-sm">{mediaError}</p>
              </div>
            ) : (
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-28 h-28 rounded-full bg-gradient-hero mx-auto flex items-center justify-center mb-4 shadow-xl"
                >
                  <span className="text-4xl font-bold text-primary-foreground">
                    {otherPartyName?.[0] ?? "?"}
                  </span>
                </motion.div>
                <p className="text-primary-foreground/60 text-sm font-medium">
                  Aguardando {otherPartyName || "participante"}...
                </p>
                <p className="text-primary-foreground/30 text-xs mt-2">
                  A videochamada iniciará quando ambos estiverem conectados
                </p>
              </div>
            )}
          </div>

          {/* Self video (PiP) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-6 right-6 w-44 h-32 rounded-xl overflow-hidden shadow-2xl border-2 border-primary/30"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!camOn ? "hidden" : ""}`}
            />
            {!camOn && (
              <div className="w-full h-full bg-[hsl(210,50%,12%)] flex items-center justify-center">
                <div className="text-center">
                  <VideoOff className="w-6 h-6 text-primary-foreground/40 mx-auto" />
                  <p className="text-primary-foreground/40 text-[10px] mt-1">Câmera desligada</p>
                </div>
              </div>
            )}
            {/* Mic indicator */}
            <div className={`absolute bottom-2 left-2 w-6 h-6 rounded-full flex items-center justify-center ${micOn ? "bg-primary/80" : "bg-destructive/80"}`}>
              {micOn ? <Mic className="w-3 h-3 text-primary-foreground" /> : <MicOff className="w-3 h-3 text-destructive-foreground" />}
            </div>
            {screenSharing && (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-secondary/80 text-secondary-foreground text-[10px] font-semibold">
                Compartilhando tela
              </div>
            )}
          </motion.div>
        </div>

        {/* Side panel */}
        <AnimatePresence>
          {(showChat || showNotes) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="border-l border-border/20 bg-card/5 backdrop-blur-sm flex flex-col overflow-hidden"
            >
              <div className="p-3 border-b border-border/20 flex items-center justify-between shrink-0">
                <p className="text-sm font-semibold text-primary-foreground">
                  {showChat ? "💬 Chat" : "📝 Anotações"}
                </p>
                <button onClick={() => { setShowChat(false); setShowNotes(false); }}>
                  <X className="w-4 h-4 text-primary-foreground/50 hover:text-primary-foreground" />
                </button>
              </div>

              {showChat && (
                <>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center mt-12">
                        <MessageSquare className="w-8 h-8 text-primary-foreground/20 mx-auto mb-2" />
                        <p className="text-xs text-primary-foreground/30">Nenhuma mensagem ainda</p>
                      </div>
                    )}
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.sender === (isDoctor ? "doctor" : "patient") ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                          msg.sender === (isDoctor ? "doctor" : "patient")
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-card/20 text-primary-foreground/90 rounded-bl-sm"
                        }`}>
                          <p>{msg.text}</p>
                          <p className="text-[10px] opacity-50 mt-1">{msg.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-border/20 flex gap-2 shrink-0">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 bg-card/10 border border-border/20 rounded-xl px-3 py-2 text-sm text-primary-foreground placeholder:text-primary-foreground/30 outline-none focus:border-primary/50 transition-colors"
                    />
                    <Button size="icon" variant="ghost" onClick={sendMessage} className="text-primary hover:bg-primary/20 rounded-xl">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}

              {showNotes && isDoctor && (
                <div className="flex-1 flex flex-col p-3 gap-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anotações da consulta..."
                    className="flex-1 bg-card/10 border-border/20 text-primary-foreground placeholder:text-primary-foreground/30 resize-none rounded-xl"
                  />
                  <Button onClick={saveNotes} size="sm" className="bg-gradient-hero text-primary-foreground rounded-xl">
                    Salvar Anotações
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-2 md:gap-3 py-4 bg-card/5 border-t border-border/20 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full w-12 h-12 transition-all ${micOn ? "bg-card/15 text-primary-foreground hover:bg-card/25" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}`}
          onClick={toggleMic}
          title={micOn ? "Desligar microfone" : "Ligar microfone"}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full w-12 h-12 transition-all ${camOn ? "bg-card/15 text-primary-foreground hover:bg-card/25" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}`}
          onClick={toggleCam}
          title={camOn ? "Desligar câmera" : "Ligar câmera"}
        >
          {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full w-12 h-12 transition-all ${screenSharing ? "bg-secondary text-secondary-foreground" : "bg-card/15 text-primary-foreground hover:bg-card/25"}`}
          onClick={toggleScreenShare}
          title={screenSharing ? "Parar compartilhamento" : "Compartilhar tela"}
        >
          {screenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full w-12 h-12 transition-all ${showChat ? "bg-primary text-primary-foreground" : "bg-card/15 text-primary-foreground hover:bg-card/25"}`}
          onClick={() => { setShowChat(!showChat); setShowNotes(false); }}
          title="Chat"
        >
          <MessageSquare className="w-5 h-5" />
        </Button>

        {isDoctor && (
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full w-12 h-12 transition-all ${showNotes ? "bg-primary text-primary-foreground" : "bg-card/15 text-primary-foreground hover:bg-card/25"}`}
            onClick={() => { setShowNotes(!showNotes); setShowChat(false); }}
            title="Anotações"
          >
            <FileText className="w-5 h-5" />
          </Button>
        )}

        <div className="w-px h-8 bg-border/20 mx-1" />

        <Button
          onClick={endCall}
          className="rounded-full w-14 h-14 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg transition-transform hover:scale-105"
          title="Encerrar consulta"
        >
          <Phone className="w-6 h-6 rotate-[135deg]" />
        </Button>
      </div>
    </div>
  );
};

export default VideoRoom;
