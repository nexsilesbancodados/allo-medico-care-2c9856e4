import { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Headphones, Sparkles, CalendarDays, CreditCard, Stethoscope, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import mascotImg from "@/assets/mascot.png";
import { useIsMobile } from "@/hooks/use-mobile";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pingo-chat`;

async function streamChat({
  messages,
  context,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  context?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, context }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError(data.error || "Erro ao conectar com o Pingo");
    return;
  }

  if (!resp.body) {
    onError("Sem resposta do servidor");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

const PingoChatbot = forwardRef<HTMLDivElement>((_, _ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, roles, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLiveSupport, setShowLiveSupport] = useState(false);
  const [userContext, setUserContext] = useState<string>("");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const clearChat = useCallback(() => {
    setMessages([]);
    setShowLiveSupport(false);
  }, []);

  // Hide on consultation/video pages
  const isConsultationPage = location.pathname.includes("/consultation");

  // Listen for external open events (from bottom nav)
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-pingo-chat", handler);
    return () => window.removeEventListener("open-pingo-chat", handler);
  }, []);


  // Build patient context when user is logged in
  useEffect(() => {
    if (!user) return;
    const buildContext = async () => {
      const parts: string[] = [];
      
      if (profile) {
        parts.push(`Paciente: ${profile.first_name} ${profile.last_name}`);
      }
      parts.push(`Roles: ${roles.join(", ")}`);

      // Get upcoming appointments
      const { data: appts } = await supabase
        .from("appointments")
        .select("scheduled_at, status, doctor_id")
        .eq("patient_id", user.id)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at")
        .limit(3);

      if (appts && appts.length > 0) {
        const doctorIds = [...new Set(appts.map(a => a.doctor_id))];
        const { data: docs } = await supabase
          .from("doctor_profiles")
          .select("id, user_id")
          .in("id", doctorIds);
        
        if (docs) {
          const userIds = docs.map(d => d.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, first_name, last_name")
            .in("user_id", userIds);
          
          const nameMap = new Map(profiles?.map(p => [p.user_id, `Dr(a). ${p.first_name} ${p.last_name}`]) ?? []);
          const docNameMap = new Map(docs.map(d => [d.id, nameMap.get(d.user_id) ?? ""]));

          const apptTexts = appts.map(a => {
            const date = new Date(a.scheduled_at);
            return `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} - ${docNameMap.get(a.doctor_id) ?? "médico"} (${a.status})`;
          });
          parts.push(`Próximas consultas: ${apptTexts.join("; ")}`);
        }
      } else {
        parts.push("Sem consultas agendadas.");
      }

      // Get active subscription
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("status, plan_id, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1);

      if (subs && subs.length > 0) {
        const { data: plan } = await supabase.from("plans").select("name").eq("id", subs[0].plan_id).single();
        parts.push(`Plano ativo: ${plan?.name ?? "sim"}`);
      } else {
        parts.push("Sem plano ativo (consultas avulsas).");
      }

      setUserContext(parts.join("\n"));
    };
    buildContext();
  }, [user, profile, roles]);

  const handleLiveSupport = async () => {
    if (user && (roles.includes("support") || roles.includes("admin"))) {
      setOpen(false);
      navigate("/dashboard?role=support");
      return;
    }

    if (user) {
      // Create a support ticket and redirect to patient support chat
      setShowLiveSupport(true);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "🎧 Conectando você com nossa equipe de suporte..." },
      ]);

      const { data: ticket, error } = await supabase.from("support_tickets").insert({
        patient_id: user.id,
        subject: "Atendimento via Pingo",
        status: "waiting_human",
      }).select().single();

      if (!error && ticket) {
        // Send conversation summary as first message
        const summary = messages.filter(m => m.role === "user").map(m => m.content).join(" | ");
        await supabase.from("support_messages").insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          sender_role: "patient",
          content: summary ? `[Resumo do chat com IA] ${summary}` : "Olá! Preciso de ajuda humana.",
        });

        setTimeout(() => {
          setOpen(false);
          navigate("/dashboard/patient/support");
        }, 1000);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "😕 Erro ao conectar. Tente novamente ou envie um e-mail para contato@aloclinica.com.br." },
        ]);
      }
    } else {
      setShowLiveSupport(true);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "🎧 Para falar com o suporte ao vivo, faça login primeiro ou envie um e-mail para contato@aloclinica.com.br." },
      ]);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;
    setInput("");

    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        context: userContext || undefined,
        onDelta: upsert,
        onDone: () => {
          setIsLoading(false);
          // Detect [TRANSFERINDO] in the final assistant message and auto-escalate
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.content.includes("[TRANSFERINDO]")) {
              // Auto-escalate to human support
              handleLiveSupport();
            }
            return prev;
          });
        },
        onError: (err) => {
          setMessages((prev) => [...prev, { role: "assistant", content: `😕 ${err}` }]);
          setIsLoading(false);
        },
      });
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "😕 Ocorreu um erro. Tente novamente!" }]);
      setIsLoading(false);
    }
  };

  // Dynamic quick actions based on user state
  const quickActions = user
    ? [
        { label: "Minhas consultas", icon: CalendarDays, text: "Quais são minhas próximas consultas?" },
        { label: "Meu plano", icon: CreditCard, text: "Qual meu plano atual e quais os benefícios?" },
        { label: "Especialidades", icon: Stethoscope, text: "Quais especialidades estão disponíveis?" },
      ]
    : [
        { label: "Como funciona?", icon: Sparkles, text: "Como funciona a AloClínica?" },
        { label: "Especialidades", icon: Stethoscope, text: "Quais especialidades vocês oferecem?" },
        { label: "Quanto custa?", icon: CreditCard, text: "Quanto custa uma consulta?" },
      ];

  if (isConsultationPage) return null;

  return (
    <>
      {/* FAB Button — hidden on mobile (Pingo is in the bottom nav) */}
      <AnimatePresence>
        {!open && !isMobile && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setOpen(true)}
              data-pingo-chat
              className="relative w-16 h-16 rounded-full bg-primary shadow-lg flex items-center justify-center overflow-hidden border-2 border-primary-foreground/20 hover:shadow-xl transition-shadow"
            >
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
              <img src={mascotImg} alt="Pingo" className="w-14 h-14 object-cover relative z-10" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`fixed z-50 bg-card border border-border rounded-2xl shadow-elevated flex flex-col overflow-hidden ${
              isMobile
                ? "inset-x-0 bottom-[68px] mx-2 h-[calc(100vh-8rem)]"
                : "bottom-6 right-6 w-[380px] max-w-[calc(100vw-1rem)] h-[520px] max-h-[calc(100vh-6rem)]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-hero text-primary-foreground">
              <img src={mascotImg} alt="Pingo" className="w-10 h-10 rounded-full bg-white/20 object-cover" />
              <div className="flex-1">
                <p className="font-bold text-sm">Pingo 🐧</p>
                <p className="text-xs opacity-80">
                  {user && profile?.first_name ? `Olá, ${profile.first_name}!` : "Assistente virtual"}
                </p>
              </div>
              {messages.length > 0 && (
                <button onClick={clearChat} className="p-1 rounded-lg hover:bg-white/20 transition-colors" title="Nova conversa">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <img src={mascotImg} alt="Pingo" className="w-16 h-16 mx-auto mb-3 opacity-80" />
                  <p className="text-sm font-semibold text-foreground">
                    {user && profile?.first_name ? `Olá, ${profile.first_name}! 🐧` : "Olá! Eu sou o Pingo! 🐧"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Como posso te ajudar hoje?</p>
                  
                  <div className="flex flex-col gap-2 mt-4">
                    {quickActions.map((q) => {
                      const Icon = q.icon;
                      return (
                        <button
                          key={q.label}
                          onClick={() => send(q.text)}
                          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-muted/50 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors text-left"
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          {q.label}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleLiveSupport}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors font-medium"
                  >
                    <Headphones className="w-3.5 h-3.5" /> Falar com suporte ao vivo
                  </button>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-0.5 [&>ul]:my-1 [&>ol]:my-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-muted px-3 py-2 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border space-y-2">
              {messages.length > 0 && !showLiveSupport && (
                <button
                  onClick={handleLiveSupport}
                  className="w-full inline-flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                >
                  <Headphones className="w-3.5 h-3.5" /> Falar com suporte ao vivo
                </button>
              )}
              <form
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="flex gap-2"
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 text-sm"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}
              aria-label="Enviar">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

PingoChatbot.displayName = "PingoChatbot";
export default PingoChatbot;
