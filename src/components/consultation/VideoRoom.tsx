import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare, FileText, Clock, Send, X, PanelLeftClose, PanelLeft,
  UserRound, Pill
} from "lucide-react";
import ConsentTCLE from "./ConsentTCLE";
import VideoConsultation from "./VideoConsultation";
import VideoErrorBoundary from "./VideoErrorBoundary";
import PreCallCheck from "./PreCallCheck";
import ConnectionStatus from "./ConnectionStatus";
import MedicalAutocomplete from "./MedicalAutocomplete";
import SpeechToText from "./SpeechToText";
import PatientInfoPanel from "./PatientInfoPanel";
import DoctorInfoPanel from "./DoctorInfoPanel";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  const [appointment, setAppointment] = useState<any>(null);
  const [otherPartyName, setOtherPartyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasConsent, setHasConsent] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(true);
  const [crmBlocked, setCrmBlocked] = useState(false);
  const [deviceChecked, setDeviceChecked] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [doctorBusy, setDoctorBusy] = useState(false);

  const [elapsed, setElapsed] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  const presenceLogId = useRef<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [notes, setNotes] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const isDoctor = roles.includes("doctor") || roles.includes("admin");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // ─── Queue position check (patients only) ───
  useEffect(() => {
    if (!appointment || isDoctor) return;
    const checkQueue = async () => {
      const { data: activeAppts } = await supabase
        .from("appointments")
        .select("id, scheduled_at")
        .eq("doctor_id", appointment.doctor_id)
        .eq("status", "in_progress")
        .neq("id", appointmentId);

      if (activeAppts && activeAppts.length > 0) {
        setDoctorBusy(true);
        const { data: waitingAhead } = await supabase
          .from("appointments")
          .select("id")
          .eq("doctor_id", appointment.doctor_id)
          .in("status", ["waiting", "in_progress"])
          .neq("id", appointmentId)
          .lt("scheduled_at", appointment.scheduled_at);
        setQueuePosition((waitingAhead?.length ?? 0) + 1);
      } else {
        setDoctorBusy(false);
        setQueuePosition(null);
      }
    };
    checkQueue();

    const queueChannel = supabase
      .channel(`queue-${appointment.doctor_id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments", filter: `doctor_id=eq.${appointment.doctor_id}` }, () => {
        checkQueue();
      })
      .subscribe();

    return () => { supabase.removeChannel(queueChannel); };
  }, [appointment, isDoctor]);

  // ─── Timer ───
  useEffect(() => {
    if (!deviceChecked) return;
    timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [deviceChecked]);

  // ─── Realtime chat ───
  useEffect(() => {
    if (!appointmentId || !user) return;

    const roomChannel = supabase.channel(`video-room-${appointmentId}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = roomChannel;

    roomChannel
      .on("broadcast", { event: "chat-message" }, ({ payload }) => {
        setMessages((prev) => [...prev, payload as ChatMessage]);
        if (!showChat) setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [appointmentId, user]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear unread when opening chat
  useEffect(() => {
    if (showChat) setUnreadCount(0);
  }, [showChat]);

  const fetchAppointment = async () => {
    const { data } = await supabase
      .from("appointments").select("*").eq("id", appointmentId).single();

    if (!data) { setLoading(false); return; }
    setAppointment(data);

    if (isDoctor) {
      await supabase.from("appointments").update({ status: "in_progress" }).eq("id", appointmentId);
    }

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

  // ─── Video presence logging ───
  useEffect(() => {
    if (!appointmentId || !user || !deviceChecked) return;
    const logPresence = async () => {
      const { data } = await supabase.from("video_presence_logs").insert({
        appointment_id: appointmentId,
        user_id: user.id,
        user_role: isDoctor ? "doctor" : "patient",
      }).select("id").single();
      if (data) presenceLogId.current = data.id;
    };
    logPresence();

    return () => {
      if (presenceLogId.current) {
        supabase.from("video_presence_logs").update({
          left_at: new Date().toISOString(),
          duration_seconds: elapsed,
        }).eq("id", presenceLogId.current).then(() => {});
      }
    };
  }, [appointmentId, user, deviceChecked]);

  const notesRef = useRef(notes);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  const elapsedRef = useRef(elapsed);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  const endCall = useCallback(async () => {
    if (presenceLogId.current) {
      await supabase.from("video_presence_logs").update({
        left_at: new Date().toISOString(),
        duration_seconds: elapsedRef.current,
      }).eq("id", presenceLogId.current);
    }
    if (isDoctor && notesRef.current) await saveNotes();
    await supabase.from("appointments").update({ status: "completed" }).eq("id", appointmentId);
    toast({ title: "Consulta encerrada" });
    if (isDoctor) navigate(`/dashboard/prescribe/${appointmentId}`);
    else navigate(`/dashboard/rate/${appointmentId}`);
  }, [isDoctor, appointmentId]);

  const handleReconnect = useCallback(() => {
    setDeviceChecked(false);
    setTimeout(() => setDeviceChecked(true), 500);
  }, []);

  if (loading || checkingConsent) {
    return (
      <div className="min-h-screen bg-[hsl(220,30%,5%)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-[hsl(220,15%,55%)]">Carregando sala...</p>
        </div>
      </div>
    );
  }

  if (crmBlocked) {
    return (
      <div className="min-h-screen bg-[hsl(220,30%,5%)] flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4 p-8 rounded-2xl bg-[hsl(220,20%,10%)] border border-[hsl(220,15%,18%)]">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-white">CRM não verificado</h2>
          <p className="text-[hsl(220,15%,55%)] text-sm">
            Seu CRM ainda não foi verificado pelo administrador. Você não pode acessar a sala de vídeo até que a verificação seja concluída.
          </p>
          <Button onClick={() => navigate("/dashboard")} variant="outline" className="rounded-xl">
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

  if (!deviceChecked) {
    return (
      <PreCallCheck
        appointmentId={appointmentId}
        doctorName={otherPartyName || undefined}
        doctorSpecialty={undefined}
        scheduledAt={appointment?.scheduled_at}
        isDoctor={isDoctor}
        onReady={() => setDeviceChecked(true)}
      />
    );
  }

  const currentUserName = isDoctor
    ? `Dr(a). ${user?.user_metadata?.first_name || "Médico"}`
    : user?.user_metadata?.first_name || "Paciente";

  const showQueueBanner = !isDoctor && doctorBusy && queuePosition !== null;
  const showSidePanel = (showChat || showNotes || showInfo) && !isMobile;
  const showBottomSheet = (showChat || showNotes || showInfo) && isMobile;

  const chatPanel = (
    <>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center mt-12">
            <MessageSquare className="w-8 h-8 text-[hsl(220,15%,25%)] mx-auto mb-2" />
            <p className="text-xs text-[hsl(220,15%,35%)]">Nenhuma mensagem</p>
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
                : "bg-[hsl(220,20%,15%)] text-[hsl(220,20%,90%)] rounded-bl-sm"
            }`}>
              <p>{msg.text}</p>
              <p className="text-[10px] opacity-50 mt-1">{msg.time}</p>
            </div>
          </motion.div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="p-3 border-t border-[hsl(220,15%,15%)] flex gap-2 shrink-0">
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Digite..."
          className="flex-1 bg-[hsl(220,20%,10%)] border border-[hsl(220,15%,20%)] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[hsl(220,15%,35%)] outline-none focus:border-primary/50 transition-colors"
        />
        <Button size="icon" variant="ghost" onClick={sendMessage} className="text-primary hover:bg-primary/20 rounded-xl h-10 w-10">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </>
  );

  const notesPanel = (
    <div className="flex-1 flex flex-col p-3 gap-3 overflow-auto">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[hsl(220,15%,50%)]">Use o botão de ditado para falar</p>
        <SpeechToText onTranscript={(text) => setNotes(prev => prev ? prev + " " + text : text)} />
      </div>
      <MedicalAutocomplete
        value={notes}
        onChange={setNotes}
        field="notes"
        placeholder="Anotações da consulta... (a IA sugere ao digitar)"
        className="flex-1 bg-[hsl(220,20%,10%)] border-[hsl(220,15%,20%)] text-white placeholder:text-[hsl(220,15%,35%)] resize-none rounded-xl min-h-[150px]"
      />
      <Button onClick={saveNotes} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
        Salvar Anotações
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(220,30%,5%)] flex flex-col">
      <ConnectionStatus onReconnect={handleReconnect} />

      {/* Queue banner */}
      {showQueueBanner && (
        <div className="px-4 py-3 bg-[hsl(45,90%,55%,0.1)] border-b border-[hsl(45,90%,55%,0.2)] flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-[hsl(45,90%,55%)] animate-pulse" />
          <p className="text-sm text-[hsl(45,90%,70%)]">
            {queuePosition === 1
              ? "O médico está finalizando outro atendimento. Você é o próximo!"
              : `Posição na fila: ${queuePosition}º — aguarde, o médico atenderá em breve.`}
          </p>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 bg-[hsl(220,25%,7%)] border-b border-[hsl(220,15%,12%)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">
              {(otherPartyName || "C").charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{otherPartyName || "Consulta"}</p>
            <p className="text-[10px] text-[hsl(220,15%,45%)]">Criptografado • E2E</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">
          {/* Chat button with unread badge */}
          <button
            className={`relative flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              showChat
                ? "bg-primary text-primary-foreground"
                : "text-[hsl(220,15%,60%)] hover:bg-[hsl(220,20%,12%)]"
            }`}
            onClick={() => { setShowChat(!showChat); setShowNotes(false); setShowInfo(false); }}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {!isMobile && "Chat"}
            {unreadCount > 0 && !showChat && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {isDoctor && (
            <>
              <button
                className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  showNotes
                    ? "bg-primary text-primary-foreground"
                    : "text-[hsl(220,15%,60%)] hover:bg-[hsl(220,20%,12%)]"
                }`}
                onClick={() => { setShowNotes(!showNotes); setShowChat(false); setShowInfo(false); }}
              >
                <FileText className="w-3.5 h-3.5" />
                {!isMobile && "Notas"}
              </button>
              {!isMobile && (
                <button
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    splitMode
                      ? "bg-primary text-primary-foreground"
                      : "text-[hsl(220,15%,60%)] hover:bg-[hsl(220,20%,12%)]"
                  }`}
                  onClick={() => setSplitMode(!splitMode)}
                  title="Modo Split Screen"
                >
                  {splitMode ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
                </button>
              )}
            </>
          )}

          {/* Info panel button */}
          <button
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              showInfo
                ? "bg-primary text-primary-foreground"
                : "text-[hsl(220,15%,60%)] hover:bg-[hsl(220,20%,12%)]"
            }`}
            onClick={() => { setShowInfo(!showInfo); setShowChat(false); setShowNotes(false); }}
          >
            <UserRound className="w-3.5 h-3.5" />
            {!isMobile && (isDoctor ? "Paciente" : "Médico")}
          </button>

          {/* Quick prescription button (doctor only) */}
          {isDoctor && (
            <button
              className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-xs font-medium text-[hsl(220,15%,60%)] hover:bg-[hsl(220,20%,12%)] transition-all"
              onClick={() => window.open(`/dashboard/prescribe/${appointmentId}`, '_blank')}
              title="Abrir receita em nova aba"
            >
              <Pill className="w-3.5 h-3.5" />
              {!isMobile && "Receita"}
            </button>
          )}

          {/* Timer */
          }
          <div className="flex items-center gap-1 px-2 md:px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20">
            <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            <span className="text-[11px] md:text-xs font-mono font-semibold text-destructive">{formatTime(elapsed)}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video area */}
        <div className={splitMode && isDoctor && !isMobile ? "w-1/2" : "flex-1"} style={{ minHeight: 0 }}>
          <VideoErrorBoundary onEndCall={endCall}>
            <VideoConsultation
              appointmentId={appointmentId!}
              userName={currentUserName}
              onEndCall={endCall}
            />
          </VideoErrorBoundary>
        </div>

        {/* Split screen notes (desktop doctor) */}
        {splitMode && isDoctor && !isMobile && (
          <div className="w-1/2 border-l border-[hsl(220,15%,12%)] bg-[hsl(220,25%,7%)] flex flex-col overflow-hidden">
            <div className="p-3 border-b border-[hsl(220,15%,12%)] flex items-center justify-between">
              <p className="text-sm font-semibold text-white">📋 Prontuário — Modo Focado</p>
              <SpeechToText onTranscript={(text) => setNotes(prev => prev ? prev + " " + text : text)} />
            </div>
            {notesPanel}
          </div>
        )}

        {/* Desktop side panel */}
        <AnimatePresence>
          {showSidePanel && !splitMode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isMobile ? "100%" : 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="border-l border-[hsl(220,15%,12%)] bg-[hsl(220,25%,7%)] flex flex-col overflow-hidden"
            >
              <div className="p-3 border-b border-[hsl(220,15%,12%)] flex items-center justify-between shrink-0">
                <p className="text-sm font-semibold text-white">
                  {showChat ? "💬 Chat" : showNotes ? "📝 Anotações" : isDoctor ? "🩺 Paciente" : "👨‍⚕️ Médico"}
                </p>
                <button onClick={() => { setShowChat(false); setShowNotes(false); setShowInfo(false); }}>
                  <X className="w-4 h-4 text-[hsl(220,15%,45%)] hover:text-white" />
                </button>
              </div>
              {showChat && chatPanel}
              {showNotes && isDoctor && notesPanel}
              {showInfo && isDoctor && appointment?.patient_id && (
                <PatientInfoPanel patientId={appointment.patient_id} appointmentId={appointmentId!} />
              )}
              {showInfo && !isDoctor && appointment?.doctor_id && (
                <DoctorInfoPanel doctorId={appointment.doctor_id} appointmentId={appointmentId!} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile bottom sheet */}
        <AnimatePresence>
          {showBottomSheet && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 bg-black/40"
                onClick={() => { setShowChat(false); setShowNotes(false); setShowInfo(false); }}
              />
              {/* Sheet */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 350, damping: 35 }}
                className="absolute bottom-0 left-0 right-0 z-40 bg-[hsl(220,25%,7%)] rounded-t-2xl border-t border-[hsl(220,15%,15%)] flex flex-col"
                style={{ maxHeight: "70vh" }}
              >
                {/* Handle */}
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-10 h-1 rounded-full bg-[hsl(220,15%,25%)]" />
                </div>
                <div className="px-4 pb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">
                    {showChat ? "💬 Chat" : showNotes ? "📝 Anotações" : isDoctor ? "🩺 Paciente" : "👨‍⚕️ Médico"}
                  </p>
                  <button onClick={() => { setShowChat(false); setShowNotes(false); setShowInfo(false); }}>
                    <X className="w-4 h-4 text-[hsl(220,15%,45%)]" />
                  </button>
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                  {showChat && chatPanel}
                  {showNotes && isDoctor && notesPanel}
                  {showInfo && isDoctor && appointment?.patient_id && (
                    <PatientInfoPanel patientId={appointment.patient_id} appointmentId={appointmentId!} />
                  )}
                  {showInfo && !isDoctor && appointment?.doctor_id && (
                    <DoctorInfoPanel doctorId={appointment.doctor_id} appointmentId={appointmentId!} />
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VideoRoom;
