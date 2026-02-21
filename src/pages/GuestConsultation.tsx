import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, MicOff, Video, VideoOff, Phone, MessageSquare,
  Clock, Send, X
} from "lucide-react";
import { format } from "date-fns";
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
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [guestPatient, setGuestPatient] = useState<any>(null);
  const [doctorName, setDoctorName] = useState("");

  // Controls
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (token) fetchAppointmentByToken();
    else setError("Token de acesso não encontrado.");
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [token]);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const fetchAppointmentByToken = async () => {
    try {
      // Use edge function to fetch by token (since RLS blocks direct access)
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
    } catch {
      setError("Erro ao carregar consulta.");
      setLoading(false);
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
    toast({ title: "Consulta encerrada" });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(210,50%,5%)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
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
    <div className="min-h-screen bg-[hsl(210,50%,5%)] flex flex-col">
      <SEOHead title="Consulta por Vídeo" description="Sala de videoconsulta avulsa da AloClinica." />
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[hsl(210,50%,8%)] border-b border-[hsl(210,30%,18%)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center">
            <Video className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-[hsl(210,20%,95%)]">{doctorName || "Consulta"}</p>
            <p className="text-xs text-[hsl(210,15%,60%)]">Telemedicina — Consulta Avulsa</p>
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
        <div className="flex-1 relative flex items-center justify-center p-4">
          <div className="w-full max-w-4xl aspect-video rounded-2xl bg-[hsl(210,50%,10%)] border border-[hsl(210,30%,18%)] flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-hero mx-auto flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-primary-foreground">
                  {doctorName?.[0] ?? "?"}
                </span>
              </div>
              <p className="text-[hsl(210,20%,70%)] text-sm">Aguardando conexão de vídeo...</p>
              <p className="text-[hsl(210,15%,50%)] text-xs mt-1">
                Simulação — integre com Daily.co para vídeo real
              </p>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 w-40 h-28 rounded-xl bg-[hsl(210,50%,15%)] border border-[hsl(210,30%,25%)] flex items-center justify-center">
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

        {showChat && (
          <div className="w-80 border-l border-[hsl(210,30%,18%)] bg-[hsl(210,50%,8%)] flex flex-col">
            <div className="p-3 border-b border-[hsl(210,30%,18%)] flex items-center justify-between">
              <p className="text-sm font-medium text-[hsl(210,20%,95%)]">Chat</p>
              <button onClick={() => setShowChat(false)}>
                <X className="w-4 h-4 text-[hsl(210,15%,60%)]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <p className="text-xs text-[hsl(210,15%,50%)] text-center mt-8">Nenhuma mensagem ainda</p>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === "patient" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    msg.sender === "patient" ? "bg-primary text-primary-foreground" : "bg-[hsl(210,30%,15%)] text-[hsl(210,20%,90%)]"
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
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-3 py-4 bg-[hsl(210,50%,8%)] border-t border-[hsl(210,30%,18%)]">
        <Button
          variant="ghost" size="icon"
          className={`rounded-full w-12 h-12 ${micOn ? "bg-[hsl(210,30%,15%)] text-[hsl(210,20%,95%)]" : "bg-destructive text-destructive-foreground"}`}
          onClick={() => setMicOn(!micOn)}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>
        <Button
          variant="ghost" size="icon"
          className={`rounded-full w-12 h-12 ${camOn ? "bg-[hsl(210,30%,15%)] text-[hsl(210,20%,95%)]" : "bg-destructive text-destructive-foreground"}`}
          onClick={() => setCamOn(!camOn)}
        >
          {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>
        <Button
          variant="ghost" size="icon"
          className={`rounded-full w-12 h-12 ${showChat ? "bg-primary text-primary-foreground" : "bg-[hsl(210,30%,15%)] text-[hsl(210,20%,95%)]"}`}
          onClick={() => setShowChat(!showChat)}
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
        <div className="w-px h-8 bg-[hsl(210,30%,18%)] mx-2" />
        <Button onClick={endCall} className="rounded-full w-14 h-14 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
          <Phone className="w-6 h-6 rotate-[135deg]" />
        </Button>
      </div>
    </div>
  );
};

export default GuestConsultation;
