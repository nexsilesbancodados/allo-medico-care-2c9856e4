import { motion } from "framer-motion";
import { HelpCircle, Headphones, MessageCircle, Mail, Clock, Shield } from "lucide-react";
import mascotImg from "@/assets/mascot-thumbsup.png";

const channels = [
  {
    icon: HelpCircle,
    title: "Central de dúvidas",
    description: "Encontre respostas rápidas para as perguntas mais comuns.",
    action: () => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" }),
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Headphones,
    title: "Suporte geral",
    description: "Atendimento humanizado via WhatsApp para todos os usuários.",
    action: () => window.open("https://wa.me/5511999999999?text=Olá! Preciso de suporte.", "_blank"),
    color: "bg-medical-green/10 text-medical-green",
  },
  {
    icon: MessageCircle,
    title: "Suporte médico",
    description: "Canal exclusivo para profissionais de saúde da plataforma.",
    action: () => window.open("https://wa.me/5511999999999?text=Olá! Sou médico e preciso de suporte.", "_blank"),
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: Mail,
    title: "E-mail",
    description: "Envie sua solicitação e respondemos em até 24h úteis.",
    action: () => window.open("mailto:contato@aloclinica.com.br"),
    color: "bg-accent/10 text-accent-foreground",
  },
];

const SupportSection = () => {
  return (
    <section aria-label="Suporte" className="py-10 md:py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-muted/60 rounded-3xl p-8 md:p-12 lg:p-16 border border-border/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
        >
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4"
              >
                <Shield className="w-3 h-3" />
                Suporte humano + IA
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 leading-tight"
              >
                Ficou com alguma <span className="text-gradient">dúvida?</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-base md:text-lg mb-8 max-w-md"
              >
                Estamos sempre disponíveis para te ajudar. Escolha o canal que preferir.
              </motion.p>

              {/* Support channel cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {channels.map((ch, i) => (
                  <motion.button
                    key={ch.title}
                    initial={{ opacity: 0, scale: 0.85, y: 15 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.35 + i * 0.08, type: "spring", stiffness: 200, damping: 15 }}
                    whileHover={{ y: -6, scale: 1.04, boxShadow: "0 12px 30px -8px hsl(210 90% 45% / 0.12)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={ch.action}
                    className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border shadow-card hover:border-primary/20 transition-colors text-left cursor-pointer group"
                  >
                    <motion.div
                      className={`w-10 h-10 rounded-xl ${ch.color} flex items-center justify-center shrink-0`}
                      whileHover={{ rotate: 8 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <ch.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-0.5">{ch.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{ch.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Availability indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-2 mt-6 text-xs text-muted-foreground"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Tempo médio de resposta: <strong className="text-foreground">menos de 5 min</strong></span>
                <span className="w-2 h-2 rounded-full bg-medical-green shimmer-v2 ml-1" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex justify-center"
            >
              <motion.img
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ duration: 0.3 }}
                src={mascotImg}
                alt="Pingo - Suporte"
                className="w-full max-w-xs rounded-2xl object-cover drop-shadow-2xl"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SupportSection;
