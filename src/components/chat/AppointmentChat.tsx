import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Message {
  id: string;
  appointment_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface AppointmentChatProps {
  appointmentId: string;
  otherUserName?: string;
}

const AppointmentChat = ({ appointmentId, otherUserName }: AppointmentChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !appointmentId) return;
    fetchMessages();

    const channel = supabase
      .channel(`chat-${appointmentId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `appointment_id=eq.${appointmentId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          // Mark as read if from other user
          if (newMsg.sender_id !== user.id) {
            supabase.from("messages").update({ is_read: true }).eq("id", newMsg.id).then(() => {});
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, appointmentId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) ?? []);

    // Mark unread messages as read
    const unread = (data ?? []).filter((m: any) => !m.is_read && m.sender_id !== user!.id);
    if (unread.length > 0) {
      await supabase.from("messages").update({ is_read: true }).in("id", unread.map((m: any) => m.id));
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || sending) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      appointment_id: appointmentId,
      sender_id: user.id,
      content: input.trim(),
    });
    if (!error) setInput("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-lg bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          💬 Chat {otherUserName ? `com ${otherUserName}` : "da Consulta"}
        </h3>
      </div>

      <ScrollArea className="flex-1 p-4 max-h-[400px]">
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Nenhuma mensagem ainda. Envie a primeira!
            </p>
          )}
          {messages.map(m => {
            const isMine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {format(new Date(m.created_at), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          className="flex-1"
        />
        <Button size="icon" onClick={sendMessage} disabled={!input.trim() || sending}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AppointmentChat;
