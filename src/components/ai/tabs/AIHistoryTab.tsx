import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Trash2, MessageSquare, Loader2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  id: string;
  title: string;
  messages: any[];
  role_context: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  primaryRole: string;
}

const AIHistoryTab = ({ primaryRole }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_conversations" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setConversations((data as any[]).map((c: any) => ({
        ...c,
        messages: typeof c.messages === "string" ? JSON.parse(c.messages) : c.messages,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  const deleteConversation = async (id: string) => {
    const { error } = await supabase.from("ai_conversations" as any).delete().eq("id", id);
    if (!error) {
      setConversations(prev => prev.filter(c => c.id !== id));
      if (selectedConv?.id === id) setSelectedConv(null);
      toast({ title: "Conversa excluída" });
    }
  };

  const roleLabels: Record<string, string> = {
    patient: "Paciente", doctor: "Médico", admin: "Admin",
    receptionist: "Recepção", support: "Suporte", clinic: "Clínica",
    partner: "Parceiro", affiliate: "Afiliado",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedConv) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{selectedConv.title}</h3>
            <p className="text-xs text-muted-foreground">
              {format(new Date(selectedConv.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSelectedConv(null)} className="text-xs">
            ← Voltar
          </Button>
        </div>

        <div className="space-y-3">
          {selectedConv.messages.map((msg: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3"
                  : "bg-muted rounded-2xl rounded-bl-md px-4 py-3"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <History className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Conversas Salvas</h3>
        <span className="text-xs text-muted-foreground">({conversations.length})</span>
      </div>

      {conversations.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma conversa salva ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Use o botão "Salvar" no Chat para guardar conversas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {conversations.map((conv) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card
                  className="border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => setSelectedConv(conv)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{conv.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(conv.updated_at), "dd/MM/yy HH:mm")}
                        </span>
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          {roleLabels[conv.role_context] || conv.role_context}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {conv.messages.length} msgs
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AIHistoryTab;
