import { motion, AnimatePresence } from "framer-motion";
import { Stethoscope, Building2, MapPin, Phone, Clock, ArrowRight, Star, Users, Shield, CheckCircle, Wifi } from "lucide-react";
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

const clinicHighlights = [
  { icon: Star, value: "4.9", label: "Avaliação" },
  { icon: Users, value: "3.2k+", label: "Atendidos" },
  { icon: Shield, value: "100%", label: "Seguro" },
];

const clinicAmenities = [
  { icon: Wifi, label: "Wi-Fi gratuito" },
  { icon: CheckCircle, label: "Acessibilidade" },
  { icon: Clock, label: "Pontualidade" },
  { icon: Shield, label: "Protocolos sanitários" },
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
                className="text-background/70 text-lg max-w-lg mb-6 leading-relaxed"
              >
                Unimos atendimento presencial e digital com impacto direto na sua saúde. Consultas com especialistas na nossa clínica própria.
              </motion.p>

              {/* Clinic highlights */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 }}
                className="flex gap-4 mb-6"
              >
                {clinicHighlights.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="bg-background/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-background/5"
                  >
                    <h.icon className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-lg font-extrabold leading-none">{h.value}</p>
                    <p className="text-[10px] text-background/50 mt-0.5">{h.label}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Info pills */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 }}
                className="flex flex-wrap gap-2 mb-6"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/10 text-xs font-medium">
                  <Clock className="w-3 h-3" />
                  Seg-Sex 8h-18h • Sáb 8h-12h
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/10 text-xs font-medium">
                  <MapPin className="w-3 h-3" />
                  Boa Vista, RR
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-medical-green/20 text-medical-green text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-medical-green animate-pulse" />
                  Aberto agora
                </div>
              </motion.div>

              {/* Amenities */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.38 }}
                className="flex flex-wrap gap-2 mb-8"
              >
                {clinicAmenities.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/5 text-[10px] font-medium text-background/60">
                    <a.icon className="w-3 h-3" />
                    {a.label}
                  </span>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-3"
              >
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  onClick={() => navigate("/clinica")}
                >
                  Agendar presencial <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-background/30 text-background bg-transparent hover:bg-background/10 rounded-full px-6 backdrop-blur-sm"
                  onClick={() => window.open("https://wa.me/5511999999999?text=Olá! Gostaria de agendar uma consulta presencial.", "_blank")}
                >
                  <Phone className="w-4 h-4 mr-1.5" />
                  WhatsApp
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={clinicReceptionist}
                  alt="Recepcionista da clínica AloClinica"
                  className="w-full h-48 sm:h-64 md:h-80 object-cover"
                  loading="lazy"
                />
              </div>

              {/* Floating review card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, type: "spring" }}
                className="absolute -bottom-4 -left-4 bg-card text-foreground rounded-xl shadow-elevated px-4 py-3 max-w-[200px]"
              >
                <div className="flex gap-0.5 mb-1">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-[10px] text-muted-foreground italic leading-relaxed">"Atendimento excelente, equipe muito acolhedora!"</p>
                <p className="text-[9px] font-semibold text-foreground mt-1">— Maria S., paciente</p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Bottom section - Steps + Chat */}
        <div className="container mx-auto px-4 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Steps */}
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

            {/* Chat mockup */}
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
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-background/10">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-sm">Clínica AloClinica</span>
                      <p className="text-[10px] text-medical-green">Online</p>
                    </div>
                    <span className="text-[9px] text-background/40">agora</span>
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

                  {/* Input bar */}
                  <div className="px-4 py-2.5 border-t border-background/10 flex items-center gap-2">
                    <div className="flex-1 bg-background/5 rounded-full px-3 py-1.5 text-[10px] text-background/30">
                      Digite sua mensagem...
                    </div>
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
