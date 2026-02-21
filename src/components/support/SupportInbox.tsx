import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Send, User, Headset, Search, ArrowLeft, MessageCircle, Loader2, Inbox } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Conversation {
  user_id: string;
  user_name: string;
  last_message: string;
  last_at: string;
  unread: number;
  messages: ChatMessage[];
}

const SupportInbox = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    // Fetch all support chat messages (support/admin can see all via RLS)
    const { data: messages, error } = await supabase
      .from("support_chat_messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      setLoading(false);
      return;
    }

    // Get unique user_ids
    const userIds = [...new Set((messages ?? []).map((m) => m.user_id))];

    // Fetch profiles for those users
    const { data: profiles } = userIds.length > 0
      ? await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds)
      : { data: [] };

    const profileMap = new Map<string, string>();
    (profiles ?? []).forEach((p) => {
      profileMap.set(p.user_id, `${p.first_name} ${p.last_name}`.trim() || "Sem nome");
    });

    // Group messages by user_id
    const groupedMap = new Map<string, ChatMessage[]>();
    (messages ?? []).forEach((m) => {
      if (!groupedMap.has(m.user_id)) groupedMap.set(m.user_id, []);
      groupedMap.get(m.user_id)!.push(m);
    });

    const convs: Conversation[] = [];
    groupedMap.forEach((msgs, uid) => {
      // Filter out support's own conversations (support agents chatting with AI)
      // We want to show conversations from patients/users who need help
      const hasUserMessages = msgs.some((m) => m.role === "user");
      if (!hasUserMessages) return;

      const lastMsg = msgs[msgs.length - 1];
      // Count messages from user that don't have a support reply after them
      const lastSupportReply = [...msgs].reverse().findIndex((m) => m.role === "support");
      const lastUserMsg = [...msgs].reverse().findIndex((m) => m.role === "user");
      const unread = lastSupportReply === -1 ? msgs.filter((m) => m.role === "user").length 
        : lastUserMsg < lastSupportReply ? 0 : 1;

      convs.push({
        user_id: uid,
        user_name: profileMap.get(uid) ?? "Usuário",
        last_message: lastMsg.content,
        last_at: lastMsg.created_at,
        unread,
        messages: msgs,
      });
    });

    // Sort by last message (most recent first)
    convs.sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());
    setConversations(convs);
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Realtime: listen for new messages
  useEffect(() => {
    const channel = supabase
      .channel("support-inbox-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_chat_messages" }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Scroll to bottom when viewing a conversation
  useEffect(() => {
    if (selectedUserId && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [selectedUserId, conversations]);

  const selectedConv = conversations.find((c) => c.user_id === selectedUserId);

  const sendReply = async () => {
    if (!input.trim() || !selectedUserId || !user || sending) return;
    setSending(true);

    const { error } = await supabase.from("support_chat_messages").insert({
      user_id: selectedUserId,
      role: "support",
      content: input.trim(),
    });

    if (error) {
      console.error("Error sending reply:", error);
      toast.error("Erro ao enviar resposta");
    } else {
      setInput("");
      toast.success("Resposta enviada!");
      await fetchConversations();
    }
    setSending(false);
  };

  const filteredConversations = conversations.filter((c) =>
    c.user_name.toLowerCase().includes(search.toLowerCase()) ||
    c.last_message.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "user":
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">Paciente</Badge>;
      case "support":
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-success/30 text-success">Suporte</Badge>;
      case "assistant":
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-secondary/30 text-secondary">IA</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="border-border h-[600px] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  // Conversation detail view
  if (selectedConv) {
    return (
      <Card className="border-border h-[600px] flex flex-col">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => setSelectedUserId(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold truncate">{selectedConv.user_name}</CardTitle>
                <p className="text-[10px] text-muted-foreground">{selectedConv.messages.length} mensagens</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-3">
              {selectedConv.messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className="max-w-[80%]">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {getRoleBadge(msg.role)}
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div
                      className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-muted text-foreground"
                          : msg.role === "support"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/10 text-foreground"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                  {msg.role === "support" && (
                    <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-1">
                      <Headset className="w-4 h-4 text-success" />
                    </div>
                  )}
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-1">
                      <MessageCircle className="w-4 h-4 text-secondary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
              placeholder="Responder ao paciente..."
              disabled={sending}
              className="flex-1"
            />
            <Button size="icon" onClick={sendReply} disabled={sending || !input.trim()}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Conversation list view
  return (
    <Card className="border-border h-[600px] flex flex-col">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-lg flex items-center gap-2">
          <Inbox className="w-5 h-5 text-primary" />
          Inbox de Suporte
          {conversations.filter((c) => c.unread > 0).length > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {conversations.filter((c) => c.unread > 0).length} pendente{conversations.filter((c) => c.unread > 0).length > 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversas..."
              className="pl-10"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">Nenhuma conversa encontrada</p>
              <p className="text-xs mt-1">Quando pacientes enviarem mensagens no chat, elas aparecerão aqui.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.user_id}
                  onClick={() => setSelectedUserId(conv.user_id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    {conv.unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${conv.unread > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                        {conv.user_name}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {formatDistanceToNow(new Date(conv.last_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${conv.unread > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                      {conv.last_message}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SupportInbox;
