import { useState, useEffect, useRef, useCallback } from "react";
import pingoSupport from "@/assets/pingo-support.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Headset, User, Loader2, ArrowLeft, MessageCircle, Plus, Clock, CheckCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getPatientNav } from "@/components/patient/patientNav";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  bot: { label: "Bot", color: "bg-secondary/10 text-secondary" },
  waiting_human: { label: "Aguardando suporte", color: "bg-warning/10 text-warning" },
  in_service: { label: "Em atendimento", color: "bg-success/10 text-success" },
  closed: { label: "Encerrado", color: "bg-muted text-muted-foreground" },
};

const PatientSupportChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("patient_id", user.id)
      .order("updated_at", { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  }, [user]);

  const fetchMessages = useCallback(async (ticketId: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);

    // Mark support messages as read
    if (user) {
      await supabase.from("support_messages")
        .update({ is_read: true })
        .eq("ticket_id", ticketId)
        .eq("sender_role", "support")
        .eq("is_read", false);
    }
  }, [user]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useEffect(() => {
    if (!selectedTicket) return;
    fetchMessages(selectedTicket.id);
  }, [selectedTicket, fetchMessages]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("patient-support-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, (payload) => {
        const msg = payload.new as TicketMessage;
        if (selectedTicket && msg.ticket_id === selectedTicket.id) {
          setMessages(prev => [...prev, msg]);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "support_tickets" }, () => {
        fetchTickets();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, selectedTicket, fetchTickets]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current?.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const createNewTicket = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("support_tickets").insert({
      patient_id: user.id,
      subject: "Novo atendimento",
      status: "waiting_human",
    }).select().single();

    if (error) {
      toast.error("Erro ao criar ticket");
      return;
    }

    // Send initial message
    await supabase.from("support_messages").insert({
      ticket_id: data.id,
      sender_id: user.id,
      sender_role: "patient",
      content: "Olá! Preciso de ajuda humana.",
    });

    toast.success("Solicitação enviada! Um agente irá atendê-lo em breve.");
    setSelectedTicket(data as Ticket);
    fetchTickets();
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedTicket || !user || sending) return;
    setSending(true);
    const { error } = await supabase.from("support_messages").insert({
      ticket_id: selectedTicket.id,
      sender_id: user.id,
      sender_role: "patient",
      content: input.trim(),
    });
    if (error) toast.error("Erro ao enviar mensagem");
    else setInput("");
    setSending(false);
  };

  const nav = getPatientNav("support");

  if (loading) {
    return (
      <DashboardLayout title="Paciente" nav={nav} role="patient">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // Chat view
  if (selectedTicket) {
    const statusConf = STATUS_LABELS[selectedTicket.status] ?? STATUS_LABELS.bot;
    return (
      <DashboardLayout title="Paciente" nav={nav} role="patient">
        <div className="w-full mx-auto max-w-2xl pb-24 md:pb-6">
          <Card className="border-border h-[550px] flex flex-col">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Ação" onClick={() =>  setSelectedTicket(null)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm">Atendimento</CardTitle>
                  <Badge variant="outline" className={`text-[10px] mt-0.5 ${statusConf.color}`}>{statusConf.label}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">Aguardando resposta do suporte...</p>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 ${msg.sender_role === "patient" ? "justify-end" : "justify-start"}`}>
                      {msg.sender_role === "support" && (
                        <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-1">
                          <Headset className="w-4 h-4 text-success" />
                        </div>
                      )}
                      <div className="max-w-[80%]">
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                        </span>
                        <div className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                          msg.sender_role === "patient" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}>
                          {msg.sender_role === "support" && (
                            <span className="text-[10px] font-medium text-success block mb-0.5">Equipe de Suporte</span>
                          )}
                          {msg.content}
                        </div>
                      </div>
                      {msg.sender_role === "patient" && (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {selectedTicket.status !== "closed" && (
                <div className="p-3 border-t border-border flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Digite sua mensagem..."
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={sendMessage} disabled={sending || !input.trim()} aria-label="Ação">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              )}
              {selectedTicket.status === "closed" && (
                <div className="p-3 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">Este atendimento foi encerrado.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Tickets list
  return (
    <DashboardLayout title="Paciente" nav={nav} role="patient">
      <div className="w-full mx-auto max-w-2xl pb-24 md:pb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard?role=patient")} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </Button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground tabular-nums">Suporte</h1>
            <p className="text-sm text-muted-foreground">Fale com nossa equipe de atendimento</p>
          </div>
          <Button onClick={createNewTicket} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Atendimento
          </Button>
        </div>

        {tickets.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <><img src={pingoSupport} alt="Pingo" className="w-20 h-20 object-contain mx-auto drop-shadow-md mb-2 select-none" /><p className="text-[13px] font-semibold text-foreground">Nenhum atendimento aberto</p></>
              <p className="text-xs text-muted-foreground mt-1">Clique em "Novo Atendimento" para falar com nossa equipe.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {tickets.map(ticket => {
              const statusConf = STATUS_LABELS[ticket.status] ?? STATUS_LABELS.bot;
              return (
                <Card
                  key={ticket.id}
                  className="border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      ticket.status === "in_service" ? "bg-success/10" : ticket.status === "waiting_human" ? "bg-warning/10" : "bg-muted"
                    }`}>
                      {ticket.status === "closed" ? <CheckCircle className="w-5 h-5 text-muted-foreground" /> :
                       ticket.status === "in_service" ? <Headset className="w-5 h-5 text-success" /> :
                       <Clock className="w-5 h-5 text-warning" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${statusConf.color}`}>{statusConf.label}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientSupportChat;
