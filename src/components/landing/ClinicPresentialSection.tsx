import { motion, AnimatePresence } from "framer-motion";
import { Stethoscope, Building2, MapPin, Phone, Clock, ArrowRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import clinicReceptionist from "@/assets/clinic-receptionist.png";
import clinicPatientChat from "@/assets/clinic-patient-chat.png";

const steps = [
  { icon: Phone, title: "Porta de entrada", desc: "Acesso pelo WhatsApp, app ou site, 24h por dia, 7 dias por semana." },
  { icon: Stethoscope, title: "Acolhimento", desc: "Triagem humanizada com profissionais qualificados." },
  { icon: Building2, title: "Atendimento", desc: "Consulta presencial ou por vídeo com especialistas." },
  { icon: ArrowRight, title: "Encaminhamento", desc: "Exames, receitas digitais e acompanhamento contínuo." },
];

const chatMessages = [
  { type: "sent", text: "Oi! Boa tarde!" },
  { type: "received", text: "Olá! Boa tarde. Bem-vinda à AloClinica. 😊" },
  { type: "received", text: "Aqui você cuida da sua saúde de um jeito fácil e completo." },
  { type: "sent", text: "Quero agendar uma consulta presencial" },
  { type: "received", text: "Claro! Temos diversas especialidades. Qual horário é melhor para você? 📅" },
];

const ClinicPresentialSection = () => {
  const navigate = useNavigate();
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const advanceChat = useCallback(() => {
    if (visibleMessages >= chatMessages.length) {
      setTimeout(() => setVisibleMessages(0), 4000);
      return;
    }
    const nextMsg = chatMessages[visibleMessages];
    if (nextMsg?.type === "received") {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setVisibleMessages((p) => p + 1);
      }, 1000);
    } else {
      setVisibleMessages((p) => p + 1);
    }
  }, [visibleMessages]);

  useEffect(() => {
    const timer = setTimeout(advanceChat, visibleMessages === 0 ? 2000 : 1800);
    return () => clearTimeout(timer);
  }, [visibleMessages, advanceChat]);

  return (
    <section aria-label="Clínica presencial" className="py-0 px-0">
      <div className="bg-foreground text-background">
        {/* Top section */}
        <div className="container mx-auto px-4 pt-16 pb-12">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="pt-8">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-6"
              >
                <MapPin className="w-3.5 h-3.5" />
                Atendimento presencial
              </motion.span>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3 mb-6"
              >
                <Building2 className="w-10 h-10 text-primary" />
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold">
                  Clínica <span className="text-primary">AloClinica</span>
                </h2>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-background/70 text-lg max-w-lg mb-8 leading-relaxed"
              >
                Unimos atendimento presencial e digital com impacto direto na sua saúde. Consultas com especialistas na nossa clínica própria.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-3 mb-8"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/10 text-xs font-medium">
                  <Clock className="w-3 h-3" />
                  Seg-Sex 8h-18h
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/10 text-xs font-medium">
                  <MapPin className="w-3 h-3" />
                  São Paulo, SP
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 }}
              >
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  onClick={() => navigate("/clinica")}
                >
                  Agendar presencial <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={clinicReceptionist}
                  alt="Recepcionista da clínica AloClinica"
                  className="w-full h-48 sm:h-64 md:h-80 object-cover"
                  loading="lazy"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom section - Steps + Chat */}
        <div className="container mx-auto px-4 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Steps with icons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-0"
            >
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="py-5 border-b border-background/10 last:border-b-0 flex items-start gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/25 transition-colors">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{i + 1}</span>
                      {step.title}
                    </h3>
                    <p className="text-background/50 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Chat mockup with animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="relative"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-48 flex-shrink-0 rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src={clinicPatientChat}
                    alt="Paciente agendando consulta"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="flex-1 bg-background/10 backdrop-blur-sm rounded-2xl border border-background/10 shadow-xl overflow-hidden">
                  {/* Chat header */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-background/10">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-semibold text-sm">Clínica AloClinica</span>
                      <p className="text-[10px] text-medical-green">Online</p>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 min-h-[240px] max-h-[280px] overflow-hidden">
                    <AnimatePresence>
                      {chatMessages.slice(0, visibleMessages).map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                          className={`flex ${msg.type === "sent" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                              msg.type === "sent"
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-background/10 rounded-bl-sm"
                            }`}
                          >
                            <p>{msg.text}</p>
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
                          <div className="bg-background/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                            {[0, 1, 2].map((dot) => (
                              <motion.div
                                key={dot}
                                className="w-1.5 h-1.5 rounded-full bg-background/40"
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: dot * 0.15 }}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClinicPresentialSection;
