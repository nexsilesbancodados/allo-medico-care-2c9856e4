import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Clock, Star, Users, MessageCircle, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const trustBadges = [
  { icon: Shield, text: "Dados criptografados" },
  { icon: Clock, text: "Atendimento 24h" },
  { icon: Star, text: "4.9★ avaliação" },
];

const comparisonRows = [
  { feature: "Espera", us: "~15 min", them: "2-5 horas" },
  { feature: "Receita digital", us: true, them: false },
  { feature: "Acesso 24h", us: true, them: false },
  { feature: "Preço", us: "A partir de R$89", them: "R$200-400" },
];

const CTABanner = () => {
  const navigate = useNavigate();
  const [onlineNow, setOnlineNow] = useState(47);

  // Countdown for urgency (resets every day)
  const getTimeLeft = () => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const diff = endOfDay.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fake fluctuating online counter
  useEffect(() => {
    const timer = setInterval(() => {
      setOnlineNow((prev) => Math.max(30, Math.min(80, prev + Math.floor(Math.random() * 7) - 3)));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <section className="py-10 md:py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, type: "spring", stiffness: 80 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 md:p-16 text-center shadow-elevated"
        >
          {/* Animated orbs */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.08, 0.05] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2"
          />

          {/* Floating sparkle particles */}
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/30"
              style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%` }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.7, 0.2],
                scale: [0.8, 1.4, 0.8],
              }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.6 }}
            />
          ))}

          <div className="relative z-10">
            {/* Social proof + countdown row */}
            <div className="flex flex-wrap justify-center gap-3 mb-5">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-primary-foreground text-sm font-medium backdrop-blur-sm"
              >
                <Users className="w-4 h-4" />
                <motion.span
                  key={onlineNow}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {onlineNow} pessoas online agora
                </motion.span>
                <span className="w-2 h-2 rounded-full bg-medical-green animate-pulse" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-primary-foreground text-sm font-medium backdrop-blur-sm"
              >
                <Sparkles className="w-4 h-4" />
                Primeira consulta com desconto
              </motion.div>
            </div>

            {/* Countdown timer */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="flex items-center justify-center gap-1.5 mb-6"
            >
              <span className="text-primary-foreground/60 text-xs font-medium">Oferta expira em:</span>
              <div className="flex gap-1">
                {[
                  { val: pad(timeLeft.hours), label: "h" },
                  { val: pad(timeLeft.minutes), label: "m" },
                  { val: pad(timeLeft.seconds), label: "s" },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-0.5">
                    <span className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 text-sm font-bold text-primary-foreground tabular-nums">
                      {t.val}
                    </span>
                    <span className="text-primary-foreground/50 text-[10px]">{t.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-5xl font-extrabold text-primary-foreground mb-4 leading-tight max-w-2xl mx-auto"
            >
              Comece a cuidar da sua saúde hoje mesmo
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-primary-foreground/80 text-base md:text-lg max-w-lg mx-auto mb-8"
            >
              Cadastre-se gratuitamente e agende sua primeira consulta com um especialista em minutos.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-3 mb-6"
            >
              <Button
                size="lg"
                className="bg-card text-primary hover:bg-card/90 rounded-full px-8 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                onClick={() => navigate("/paciente")}
              >
                Criar minha conta <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-primary-foreground hover:bg-white/10 rounded-full px-8 transition-all duration-300 hover:scale-105"
                onClick={() => navigate("/consulta-avulsa")}
              >
                Consulta sem cadastro
              </Button>
            </motion.div>

            {/* WhatsApp CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.55 }}
              className="mb-8"
            >
              <button
                onClick={() => window.open("https://wa.me/5511999999999?text=Olá! Quero saber mais sobre a AloClinica.", "_blank")}
                className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Prefere WhatsApp? Fale com a gente
              </button>
            </motion.div>

            {/* Mini comparison table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="max-w-sm mx-auto mb-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 overflow-hidden"
            >
              <div className="grid grid-cols-3 text-[11px] font-bold text-primary-foreground/80 p-3 border-b border-white/10">
                <span></span>
                <span className="text-center">AloClinica</span>
                <span className="text-center opacity-50">Consulta Tradicional</span>
              </div>
              {comparisonRows.map((row, i) => (
                <div key={i} className={`grid grid-cols-3 text-[11px] text-primary-foreground/70 p-2.5 ${i < comparisonRows.length - 1 ? "border-b border-white/5" : ""}`}>
                  <span className="font-medium">{row.feature}</span>
                  <span className="text-center font-semibold text-primary-foreground">
                    {typeof row.us === "boolean" ? (
                      row.us ? <Check className="w-3.5 h-3.5 text-medical-green mx-auto" /> : <X className="w-3.5 h-3.5 opacity-40 mx-auto" />
                    ) : row.us}
                  </span>
                  <span className="text-center opacity-50">
                    {typeof row.them === "boolean" ? (
                      row.them ? <Check className="w-3.5 h-3.5 mx-auto" /> : <X className="w-3.5 h-3.5 mx-auto" />
                    ) : row.them}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.65 }}
              className="flex flex-wrap justify-center gap-4 md:gap-6"
            >
              {trustBadges.map((badge) => (
                <div key={badge.text} className="flex items-center gap-1.5 text-primary-foreground/70 text-xs font-medium">
                  <badge.icon className="w-3.5 h-3.5" />
                  {badge.text}
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTABanner;
