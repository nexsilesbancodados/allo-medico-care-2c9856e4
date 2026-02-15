import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, MicOff, Video, VideoOff, Phone, MessageSquare,
  FileText, Clock, Send, X, Maximize2, Minimize2
} from "lucide-react";
import { format } from "date-fns";

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

  // Controls
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Notes (doctor only)
  const [notes, setNotes] = useState("");

  const isDoctor = roles.includes("doctor") || roles.includes("admin");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (appointmentId) fetchAppointment();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [appointmentId]);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
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

    // Update status to in_progress
    await supabase
      .from("appointments")
      .update({ status: "in_progress" })
      .eq("id", appointmentId);

    // Get other party name
    const otherUserId = isDoctor ? data.patient_id : null;
    const otherDoctorId = !isDoctor ? data.doctor_id : null;

    if (otherUserId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", otherUserId)
        .single();
      if (profile) setOtherPartyName(`${profile.first_name} ${profile.last_name}`);
    } else if (otherDoctorId) {
      const { data: doc } = await supabase
        .from("doctor_profiles")
        .select("user_id")
        .eq("id", otherDoctorId)
        .single();
      if (doc) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", doc.user_id)
          .single();
        if (profile) setOtherPartyName(`Dr(a). ${profile.first_name} ${profile.last_name}`);
      }
    }

    // Load existing notes
    if (isDoctor) {
      const { data: noteData } = await supabase
        .from("consultation_notes")
        .select("content")
        .eq("appointment_id", appointmentId)
        .single();
      if (noteData) setNotes(noteData.content);
    }

    setLoading(false);
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
      sender: isDoctor ? "doctor" : "patient",
      text: chatInput.trim(),
      time: format(new Date(), "HH:mm"),
    };
    setMessages(prev => [...prev, msg]);
    setChatInput("");
  };

  const saveNotes = async () => {
    if (!appointmentId || !appointment) return;

    const { data: doc } = await supabase
      .from("doctor_profiles")
      .select("id")
      .eq("user_id", user!.id)
      .single();

    if (!doc) return;

    const { data: existing } = await supabase
      .from("consultation_notes")
      .select("id")
      .eq("appointment_id", appointmentId)
      .single();

    if (existing) {
      await supabase.from("consultation_notes").update({ content: notes }).eq("id", existing.id);
    } else {
      await supabase.from("consultation_notes").insert({
        appointment_id: appointmentId,
        doctor_id: doc.id,
        content: notes,
      });
    }
    toast({ title: "Anotações salvas!" });
  };

  const endCall = async () => {
    if (isDoctor && notes) await saveNotes();

    await supabase
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", appointmentId);

    toast({ title: "Consulta encerrada" });

    if (isDoctor) {
      navigate(`/dashboard/prescribe/${appointmentId}`);
    } else {
      navigate("/dashboard/appointments");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(210,50%,5%)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[hsl(210,50%,8%)] border-b border-[hsl(210,30%,18%)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center">
            <Video className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-[hsl(210,20%,95%)]">{otherPartyName || "Consulta"}</p>
            <p className="text-xs text-[hsl(210,15%,60%)]">Telemedicina</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/20 text-destructive">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-sm font-mono">{formatTime(elapsed)}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Video area */}
        <div className="flex-1 relative flex items-center justify-center p-4">
          {/* Main video (other party) */}
          <div className="w-full max-w-4xl aspect-video rounded-2xl bg-[hsl(210,50%,10%)] border border-[hsl(210,30%,18%)] flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-hero mx-auto flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-primary-foreground">
                  {otherPartyName?.[0] ?? "?"}
                </span>
              </div>
              <p className="text-[hsl(210,20%,70%)] text-sm">Aguardando conexão de vídeo...</p>
              <p className="text-[hsl(210,15%,50%)] text-xs mt-1">
                Simulação — integre com Daily.co para vídeo real
              </p>
            </div>
          </div>

          {/* Self video (pip) */}
          <div className="absolute bottom-6 right-6 w-40 h-28 rounded-xl bg-[hsl(210,50%,15%)] border border-[hsl(210,30%,25%)] flex items-center justify-center overflow-hidden">
            {camOn ? (
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary/30 mx-auto flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">Eu</span>
                </div>
              </div>
            ) : (
              <VideoOff className="w-6 h-6 text-[hsl(210,15%,50%)]" />
            )}
          </div>
        </div>

        {/* Side panel (chat or notes) */}
        {(showChat || showNotes) && (
          <div className="w-80 border-l border-[hsl(210,30%,18%)] bg-[hsl(210,50%,8%)] flex flex-col">
            <div className="p-3 border-b border-[hsl(210,30%,18%)] flex items-center justify-between">
              <p className="text-sm font-medium text-[hsl(210,20%,95%)]">
                {showChat ? "Chat" : "Anotações"}
              </p>
              <button onClick={() => { setShowChat(false); setShowNotes(false); }}>
                <X className="w-4 h-4 text-[hsl(210,15%,60%)]" />
              </button>
            </div>

            {showChat && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.length === 0 && (
                    <p className="text-xs text-[hsl(210,15%,50%)] text-center mt-8">Nenhuma mensagem ainda</p>
                  )}
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === (isDoctor ? "doctor" : "patient") ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        msg.sender === (isDoctor ? "doctor" : "patient")
                          ? "bg-primary text-primary-foreground"
                          : "bg-[hsl(210,30%,15%)] text-[hsl(210,20%,90%)]"
                      }`}>
                        <p>{msg.text}</p>
                        <p className="text-[10px] opacity-60 mt-1">{msg.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-[hsl(210,30%,18%)] flex gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                    placeholder="Digite..."
                    className="flex-1 bg-[hsl(210,30%,12%)] border border-[hsl(210,30%,20%)] rounded-lg px-3 py-2 text-sm text-[hsl(210,20%,95%)] placeholder:text-[hsl(210,15%,40%)] outline-none focus:border-primary"
                  />
                  <Button size="icon" variant="ghost" onClick={sendMessage}>
                    <Send className="w-4 h-4 text-primary" />
                  </Button>
                </div>
              </>
            )}

            {showNotes && isDoctor && (
              <div className="flex-1 flex flex-col p-3">
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Anotações da consulta..."
                  className="flex-1 bg-[hsl(210,30%,12%)] border-[hsl(210,30%,20%)] text-[hsl(210,20%,95%)] placeholder:text-[hsl(210,15%,40%)] resize-none"
                />
                <Button onClick={saveNotes} size="sm" className="mt-2 bg-gradient-hero text-primary-foreground">
                  Salvar Anotações
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-3 py-4 bg-[hsl(210,50%,8%)] border-t border-[hsl(210,30%,18%)]">
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full w-12 h-12 ${micOn ? "bg-[hsl(210,30%,15%)] text-[hsl(210,20%,95%)]" : "bg-destructive text-destructive-foreground"}`}
          onClick={() => setMicOn(!micOn)}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full w-12 h-12 ${camOn ? "bg-[hsl(210,30%,15%)] text-[hsl(210,20%,95%)]" : "bg-destructive text-destructive-foreground"}`}
          onClick={() => setCamOn(!camOn)}
        >
          {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full w-12 h-12 ${showChat ? "bg-primary text-primary-foreground" : "bg-[hsl(210,30%,15%)] text-[hsl(210,20%,95%)]"}`}
          onClick={() => { setShowChat(!showChat); setShowNotes(false); }}
        >
          <MessageSquare className="w-5 h-5" />
        </Button>

        {isDoctor && (
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full w-12 h-12 ${showNotes ? "bg-primary text-primary-foreground" : "bg-[hsl(210,30%,15%)] text-[hsl(210,20%,95%)]"}`}
            onClick={() => { setShowNotes(!showNotes); setShowChat(false); }}
          >
            <FileText className="w-5 h-5" />
          </Button>
        )}

        <div className="w-px h-8 bg-[hsl(210,30%,18%)] mx-2" />

        <Button
          onClick={endCall}
          className="rounded-full w-14 h-14 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        >
          <Phone className="w-6 h-6 rotate-[135deg]" />
        </Button>
      </div>
    </div>
  );
};

export default VideoRoom;
