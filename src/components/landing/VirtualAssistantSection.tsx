import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronRight, Sparkles, Send } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import mascotWave from "@/assets/mascot-wave.png";

const chatDemo = [
  { role: "user", text: "Olá, preciso de ajuda!" },
  { role: "bot", text: "Oi! 👋 Sou o Pingo, seu assistente virtual. Como posso te ajudar?" },
  { role: "user", text: "Quero agendar uma consulta" },
  { role: "bot", text: "Claro! Temos várias especialidades. Qual é a sua necessidade? 🩺" },
  { role: "user", text: "Dermatologia" },
  { role: "bot", text: "Ótimo! Encontrei 3 dermatologistas disponíveis hoje. Quer ver os horários? 📅" },
];

const VirtualAssistantSection = () => {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const advanceChat = useCallback(() => {
    if (visibleMessages >= chatDemo.length) {
      // Reset after pause
      setTimeout(() => setVisibleMessages(0), 3000);
      return;
    }

    const nextMsg = chatDemo[visibleMessages];
    if (nextMsg?.role === "bot") {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setVisibleMessages((p) => p + 1);
      }, 1200);
    } else {
      setVisibleMessages((p) => p + 1);
    }
  }, [visibleMessages]);

  useEffect(() => {
    const timer = setTimeout(advanceChat, visibleMessages === 0 ? 1500 : 2000);
    return () => clearTimeout(timer);
  }, [visibleMessages, advanceChat]);

  return (
    <section aria-label="Assistente virtual Pingo" className="py-10 md:py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-muted/60 dark:bg-muted/30 p-10 md:p-16 border border-border/30"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Chat demo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative"
            >
              <div className="bg-card rounded-2xl shadow-elevated border border-border overflow-hidden max-w-sm mx-auto">
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                  <div className="relative">
                    <img src={mascotWave} alt="Pingo" className="w-9 h-9 rounded-full object-contain bg-primary/10 p-0.5" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-medical-green border-2 border-card" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Pingo</p>
                    <p className="text-[10px] text-medical-green font-medium">Online agora</p>
                  </div>
                </div>

                {/* Messages area */}
                <div className="p-4 space-y-3 min-h-[280px] max-h-[320px] overflow-hidden">
                  <AnimatePresence>
                    {chatDemo.slice(0, visibleMessages).map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                          {[0, 1, 2].map((dot) => (
                            <motion.div
                              key={dot}
                              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: dot * 0.15 }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input bar */}
                <div className="px-4 py-3 border-t border-border flex items-center gap-2">
                  <div className="flex-1 bg-muted/50 rounded-full px-4 py-2 text-xs text-muted-foreground">
                    Digite sua mensagem...
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Send className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Text */}
            <div className="relative z-10">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 text-primary text-sm font-semibold mb-6"
              >
                <Sparkles className="w-4 h-4" />
                Inteligência Artificial
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-4"
              >
                Conheça o <span className="text-gradient">Pingo</span> 🐧
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-base md:text-lg max-w-md mb-6 leading-relaxed"
              >
                Seu atendente virtual está sempre disponível. Tire dúvidas, agende consultas e receba orientações — tudo direto pelo chat, sem complicação.
              </motion.p>

              {/* Feature pills */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 }}
                className="flex flex-wrap gap-2 mb-8"
              >
                {["Disponível 24h", "Triagem inteligente", "Agendamento rápido", "Respostas em segundos"].map((feat, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                  >
                    {feat}
                  </span>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Button
                  size="lg"
                  className="bg-gradient-hero text-primary-foreground rounded-full px-6 gap-2 font-semibold hover:opacity-90 transition-all hover:scale-105"
                  onClick={() => {
                    const chatBtn = document.querySelector('[data-pingo-chat]') as HTMLButtonElement;
                    if (chatBtn) chatBtn.click();
                    else window.dispatchEvent(new CustomEvent("open-pingo-chat"));
                  }}
                >
                  <MessageCircle className="w-5 h-5" />
                  Falar com o Pingo
                </Button>
              </motion.div>

              <motion.a
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                href="#como-funciona"
                className="inline-flex items-center gap-1 mt-4 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Veja como funciona <ChevronRight className="w-4 h-4" /><ChevronRight className="w-4 h-4 -ml-3" />
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VirtualAssistantSection;
