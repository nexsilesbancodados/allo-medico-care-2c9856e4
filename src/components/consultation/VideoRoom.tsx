import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare, FileText, Clock, Send, X
} from "lucide-react";
import ConsentTCLE from "./ConsentTCLE";
import VideoConsultation from "./VideoConsultation";
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
  const [hasConsent, setHasConsent] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(true);
  const [crmBlocked, setCrmBlocked] = useState(false);

  // State
  const [elapsed, setElapsed] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Chat & Notes
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [notes, setNotes] = useState("");

  const isDoctor = roles.includes("doctor") || roles.includes("admin");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ─── Check CRM verified (doctors only) ───
  useEffect(() => {
    if (!user || !isDoctor) return;
    const checkCrm = async () => {
      const { data } = await supabase
        .from("doctor_profiles")
        .select("crm_verified")
        .eq("user_id", user.id)
        .single();
      if (data && !data.crm_verified) setCrmBlocked(true);
    };
    checkCrm();
  }, [user, isDoctor]);

  // ─── Check existing TCLE consent (patients only) ───
  useEffect(() => {
    if (!appointmentId || !user) return;
    if (isDoctor) {
      setHasConsent(true);
      setCheckingConsent(false);
      return;
    }
    const checkConsent = async () => {
      const { data } = await supabase
        .from("patient_consents")
        .select("id")
        .eq("appointment_id", appointmentId)
        .eq("patient_id", user.id)
        .is("revoked_at", null)
        .limit(1);
      setHasConsent((data?.length ?? 0) > 0);
      setCheckingConsent(false);
    };
    checkConsent();
  }, [appointmentId, user, isDoctor]);

  useEffect(() => {
    if (appointmentId) fetchAppointment();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [appointmentId]);

  // ─── Timer ───
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ─── Realtime chat channel ───
  useEffect(() => {
    if (!appointmentId || !user) return;

    const roomChannel = supabase.channel(`video-room-${appointmentId}`, {
      config: { broadcast: { self: false } },
    });

    channelRef.current = roomChannel;

    roomChannel
      .on("broadcast", { event: "chat-message" }, ({ payload }) => {
        setMessages((prev) => [...prev, payload as ChatMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [appointmentId, user]);

  const fetchAppointment = async () => {
    const { data } = await supabase
      .from("appointments").select("*").eq("id", appointmentId).single();

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

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
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
    channelRef.current?.send({ type: "broadcast", event: "chat-message", payload: msg });
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

  const endCall = useCallback(async () => {
    if (isDoctor && notes) await saveNotes();
    await supabase.from("appointments").update({ status: "completed" }).eq("id", appointmentId);
    toast({ title: "Consulta encerrada" });
    if (isDoctor) navigate(`/dashboard/prescribe/${appointmentId}`);
    else navigate("/dashboard/appointments");
  }, [isDoctor, notes, appointmentId]);

  if (loading || checkingConsent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (crmBlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md text-center space-y-4 p-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">CRM não verificado</h2>
          <p className="text-muted-foreground text-sm">
            Seu CRM ainda não foi verificado pelo administrador. Você não pode acessar a sala de vídeo até que a verificação seja concluída.
          </p>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!hasConsent) {
    return (
      <ConsentTCLE
        appointmentId={appointmentId!}
        doctorName={otherPartyName || undefined}
        onConsented={() => setHasConsent(true)}
      />
    );
  }

  const currentUserName = isDoctor
    ? `Dr(a). ${user?.user_metadata?.first_name || "Médico"}`
    : user?.user_metadata?.first_name || "Paciente";

  return (
    <div className="min-h-screen bg-[hsl(210,50%,4%)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[hsl(210,50%,7%)] border-b border-border/15">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-hero flex items-center justify-center shadow-lg">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[hsl(210,20%,95%)]">{otherPartyName || "Consulta"}</p>
            <p className="text-xs text-[hsl(210,15%,55%)]">Jitsi Meet • Criptografado</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full ${showChat ? "bg-primary text-primary-foreground" : "text-[hsl(210,20%,70%)] hover:bg-[hsl(210,30%,14%)]"}`}
            onClick={() => { setShowChat(!showChat); setShowNotes(false); }}
          >
            <MessageSquare className="w-4 h-4 mr-1.5" />
            Chat
          </Button>

          {isDoctor && (
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full ${showNotes ? "bg-primary text-primary-foreground" : "text-[hsl(210,20%,70%)] hover:bg-[hsl(210,30%,14%)]"}`}
              onClick={() => { setShowNotes(!showNotes); setShowChat(false); }}
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Notas
            </Button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/15 text-destructive border border-destructive/20">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <Clock className="w-3.5 h-3.5" />
            <span className="text-sm font-mono font-semibold">{formatTime(elapsed)}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area — Jitsi */}
        <div className="flex-1 min-h-0">
          <VideoConsultation
            appointmentId={appointmentId!}
            userName={currentUserName}
            onEndCall={endCall}
          />
        </div>

        {/* Side panel */}
        <AnimatePresence>
          {(showChat || showNotes) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="border-l border-border/15 bg-[hsl(210,50%,6%)] flex flex-col overflow-hidden"
            >
              <div className="p-3 border-b border-border/15 flex items-center justify-between shrink-0">
                <p className="text-sm font-semibold text-[hsl(210,20%,90%)]">
                  {showChat ? "💬 Chat" : "📝 Anotações"}
                </p>
                <button onClick={() => { setShowChat(false); setShowNotes(false); }}>
                  <X className="w-4 h-4 text-[hsl(210,15%,50%)] hover:text-[hsl(210,20%,80%)]" />
                </button>
              </div>

              {showChat && (
                <>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center mt-12">
                        <MessageSquare className="w-8 h-8 text-[hsl(210,15%,25%)] mx-auto mb-2" />
                        <p className="text-xs text-[hsl(210,15%,35%)]">Nenhuma mensagem</p>
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
                            : "bg-[hsl(210,30%,15%)] text-[hsl(210,20%,90%)] rounded-bl-sm"
                        }`}>
                          <p>{msg.text}</p>
                          <p className="text-[10px] opacity-50 mt-1">{msg.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-border/15 flex gap-2 shrink-0">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Digite..."
                      className="flex-1 bg-[hsl(210,30%,10%)] border border-border/20 rounded-xl px-3 py-2 text-sm text-[hsl(210,20%,90%)] placeholder:text-[hsl(210,15%,35%)] outline-none focus:border-primary/50 transition-colors"
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
                    className="flex-1 bg-[hsl(210,30%,10%)] border-border/20 text-[hsl(210,20%,90%)] placeholder:text-[hsl(210,15%,35%)] resize-none rounded-xl"
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
    </div>
  );
};

export default VideoRoom;
