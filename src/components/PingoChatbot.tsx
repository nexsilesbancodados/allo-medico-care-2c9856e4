import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import mascotImg from "@/assets/mascot.png";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pingo-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
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
    body: JSON.stringify({ messages }),
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

const PingoChatbot = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLiveSupport, setShowLiveSupport] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLiveSupport = () => {
    if (user && (roles.includes("support") || roles.includes("admin"))) {
      setOpen(false);
      navigate("/dashboard?role=support");
    } else {
      setShowLiveSupport(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "🎧 Para falar com o suporte ao vivo, envie um e-mail para contato@aloclinica.com.br ou ligue para (11) 99999-0000. Nossa equipe responde em até 30 minutos durante o horário comercial (seg-sex, 8h-18h).",
        },
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

  const send = async () => {
    const text = input.trim();
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
        onDelta: upsert,
        onDone: () => setIsLoading(false),
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

  return (
    <>
      {/* FAB Button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end gap-2"
          >
            {/* Tooltip label — visível apenas em mobile */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="md:hidden bg-card border border-border text-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap"
            >
              💬 Falar com o Pingo
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setOpen(true)}
              className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary shadow-lg flex items-center justify-center overflow-hidden border-2 border-primary-foreground/20 hover:shadow-xl transition-shadow"
            >
              {/* Pulso animado */}
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
            className="fixed bottom-20 md:bottom-6 right-2 md:right-6 z-50 w-[380px] max-w-[calc(100vw-1rem)] h-[480px] md:h-[520px] max-h-[calc(100vh-6rem)] bg-card border border-border rounded-2xl shadow-elevated flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-hero text-primary-foreground">
              <img src={mascotImg} alt="Pingo" className="w-10 h-10 rounded-full bg-white/20 object-cover" />
              <div className="flex-1">
                <p className="font-bold text-sm">Pingo 🐧</p>
                <p className="text-xs opacity-80">Assistente virtual</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <img src={mascotImg} alt="Pingo" className="w-20 h-20 mx-auto mb-3 opacity-80" />
                  <p className="text-sm font-semibold text-foreground">Olá! Eu sou o Pingo! 🐧</p>
                  <p className="text-xs text-muted-foreground mt-1">Como posso te ajudar hoje?</p>
                   <div className="flex flex-wrap gap-2 mt-4 justify-center">
                     {["Como funciona?", "Quais especialidades?", "Quanto custa?"].map((q) => (
                       <button
                         key={q}
                         onClick={() => { setInput(q); }}
                         className="text-xs px-3 py-1.5 rounded-full bg-medical-blue-light text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                       >
                         {q}
                       </button>
                     ))}
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
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
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
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PingoChatbot;
