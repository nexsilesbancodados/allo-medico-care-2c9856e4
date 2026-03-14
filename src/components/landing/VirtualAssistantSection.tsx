import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Sparkles, Send, Clock, Brain, Zap, Shield, FileText, Stethoscope } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import pingoAssistant from "@/assets/pingo-virtual-assistant.png";
import mascotWave from "@/assets/mascot-wave.png";

const chatDemo = [
  { role: "user", text: "Olá, preciso de ajuda!" },
  { role: "bot", text: "Oi! 👋 Sou o Pingo, seu assistente virtual. Como posso te ajudar?" },
  { role: "user", text: "Quero agendar uma consulta" },
  { role: "bot", text: "Claro! Temos várias especialidades. Qual é a sua necessidade? 🩺" },
  { role: "user", text: "Dermatologia" },
  { role: "bot", text: "Ótimo! Encontrei 3 dermatologistas disponíveis hoje. Quer ver os horários? 📅" },
];

const capabilities = [
  { icon: Brain, label: "Triagem inteligente", desc: "Analisa sintomas e sugere especialidade" },
  { icon: Clock, label: "Disponível 24/7", desc: "Sem filas, sem espera" },
  { icon: FileText, label: "Resumos clínicos", desc: "Gera resumos de consultas com IA" },
  { icon: Shield, label: "Privacidade total", desc: "Seus dados são criptografados" },
  { icon: Stethoscope, label: "Agendamento", desc: "Marca consultas em segundos" },
  { icon: Zap, label: "Respostas instantâneas", desc: "Powered by DeepSeek AI" },
];

const pingoStats = [
  { value: "50k+", label: "Mensagens" },
  { value: "< 3s", label: "Resposta" },
  { value: "98%", label: "Satisfação" },
];

const VirtualAssistantSection = () => {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const advanceChat = useCallback(() => {
    if (visibleMessages >= chatDemo.length) {
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
    <section aria-label="Assistente virtual Pingo" className="py-10 md:py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Hero header with Pingo mascot */}
        <div className="text-center mb-10 md:mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-block mb-6"
          >
            <div className="relative">
              <img
                src={mascotWave}
                alt="Pingo - Assistente Virtual"
                className="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-xl mx-auto"
              />
              {/* Online badge */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border shadow-md">
                <span className="w-2 h-2 rounded-full bg-medical-green animate-pulse" />
                <span className="text-[10px] font-bold text-medical-green">Online</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-primary text-sm font-semibold">
              <Sparkles className="w-4 h-4" />
              Inteligência Artificial
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground">
              Conheça o <span className="text-gradient">Pingo</span> 🐧
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Seu atendente virtual está sempre disponível. Tire dúvidas, agende consultas e receba orientações — tudo direto pelo chat.
            </p>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-8 mt-6"
          >
            {pingoStats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Two column: capabilities + chat */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Capabilities grid */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
              {capabilities.map((cap, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.05, type: "spring", stiffness: 200, damping: 15 }}
                  whileHover={{ y: -4 }}
                  className="card-interactive p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/20 cursor-default group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                    <cap.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-foreground mb-1">{cap.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cap.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-6"
            >
              <Button
                size="lg"
                className="bg-gradient-hero text-primary-foreground rounded-full px-8 gap-2 font-semibold hover:opacity-90 transition-all w-full sm:w-auto"
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
          </motion.div>

          {/* Chat demo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="bg-card rounded-2xl shadow-elevated border border-border overflow-hidden max-w-sm mx-auto lg:ml-auto">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                <div className="relative">
                  <img src={pingoAssistant} alt="Pingo" className="w-9 h-9 rounded-full object-contain bg-primary/10 p-0.5" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-medical-green border-2 border-card" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Pingo</p>
                  <p className="text-[10px] text-medical-green font-medium">Online agora</p>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/5 text-primary">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-[10px] font-semibold">IA</span>
                </div>
              </div>

              {/* Messages */}
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

              {/* Input */}
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
        </div>
      </div>
    </section>
  );
};

export default VirtualAssistantSection;
