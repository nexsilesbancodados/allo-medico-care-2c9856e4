import { memo } from "react";
import { motion } from "framer-motion";
import { Video, Brain, CreditCard, ShieldCheck, Star, Clock, Stethoscope, FileText } from "lucide-react";

import heroServices from "@/assets/hero-services.jpg";

/** Floating badge component */
const FloatingBadge = ({
  children,
  className,
  delay = 0,
  y = [0, -12, 0],
  duration = 5,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number[];
  duration?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ delay: delay * 0.15, duration: 0.5, ease: "easeOut" }}
    className={className}
  >
    <motion.div
      animate={{ y }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay: delay * 0.3 }}
    >
      {children}
    </motion.div>
  </motion.div>
);

function HorizontalScrollCards() {
  return (
    <section
      className="relative py-16 sm:py-24 overflow-hidden bg-background"
      aria-label="Nossos serviços"
    >
      {/* Subtle ambient gradients */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.04),transparent_50%)]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--secondary)/0.04),transparent_50%)]" />

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28 relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-primary/60 mb-3 block">
            Plataforma completa
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
            Saúde digital de{" "}
            <span className="text-primary">excelência</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-sm sm:text-base">
            Teleconsulta, telelaudo e cartão saúde — tudo integrado em uma plataforma segura e acessível.
          </p>
        </motion.div>

        {/* Main visual area */}
        <div className="relative rounded-3xl overflow-hidden min-h-[480px] sm:min-h-[540px] lg:min-h-[580px]">
          {/* Hero image */}
          <motion.img
            src={heroServices}
            alt="Médica realizando teleconsulta em ambiente moderno"
            width={1920}
            height={1080}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            initial={{ scale: 1.05 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--medical-navy))]/80 via-[hsl(var(--medical-navy))]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--medical-navy))]/60 via-transparent to-transparent" />

          {/* Left content overlay */}
          <div className="relative z-10 flex flex-col justify-center h-full min-h-[480px] sm:min-h-[540px] lg:min-h-[580px] p-8 sm:p-12 lg:p-16 max-w-xl">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                  Online agora
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
                Cuidado médico ao alcance de um clique
              </h3>
              <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-6 max-w-md">
                Consulte médicos por vídeo 24h, receba receitas digitais válidas e acompanhe sua saúde de qualquer lugar do Brasil.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Video, text: "Teleconsulta" },
                  { icon: FileText, text: "Telelaudo" },
                  { icon: CreditCard, text: "Cartão Saúde" },
                ].map(({ icon: I, text }) => (
                  <span
                    key={text}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm"
                  >
                    <I className="w-3.5 h-3.5" />
                    {text}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Floating items ── */}

          {/* Rating card */}
          <FloatingBadge
            className="absolute top-8 right-6 sm:top-12 sm:right-12 z-20"
            delay={1}
            y={[0, -10, 0]}
            duration={4.5}
          >
            <div className="bg-white/95 dark:bg-card/95 backdrop-blur-xl rounded-2xl px-5 py-4 shadow-xl border border-border/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-warning fill-current" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">4.9 / 5.0</p>
                <p className="text-[10px] text-muted-foreground">+2.500 avaliações</p>
              </div>
            </div>
          </FloatingBadge>

          {/* 24h badge */}
          <FloatingBadge
            className="absolute top-1/3 right-4 sm:right-10 z-20 hidden sm:block"
            delay={3}
            y={[0, -14, 0]}
            duration={5.5}
          >
            <div className="bg-primary/95 backdrop-blur-xl rounded-2xl px-5 py-4 shadow-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Plantão 24h</p>
                <p className="text-[10px] text-white/70">Médicos disponíveis</p>
              </div>
            </div>
          </FloatingBadge>

          {/* Shield badge */}
          <FloatingBadge
            className="absolute bottom-24 right-6 sm:bottom-28 sm:right-16 z-20"
            delay={5}
            y={[0, -8, 0]}
            duration={6}
          >
            <div className="bg-white/95 dark:bg-card/95 backdrop-blur-xl rounded-2xl px-5 py-4 shadow-xl border border-border/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">LGPD & CFM</p>
                <p className="text-[10px] text-muted-foreground">100% regulamentado</p>
              </div>
            </div>
          </FloatingBadge>

          {/* AI badge - hidden on small */}
          <FloatingBadge
            className="absolute bottom-10 right-1/3 z-20 hidden lg:block"
            delay={7}
            y={[0, -11, 0]}
            duration={5}
          >
            <div className="bg-secondary/95 backdrop-blur-xl rounded-2xl px-5 py-4 shadow-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">IA Integrada</p>
                <p className="text-[10px] text-white/70">Triagem inteligente</p>
              </div>
            </div>
          </FloatingBadge>

          {/* Stethoscope pill - top left area */}
          <FloatingBadge
            className="absolute top-6 left-1/2 sm:left-auto sm:right-1/3 z-20 hidden md:block"
            delay={2}
            y={[0, -9, 0]}
            duration={4}
          >
            <div className="bg-white/90 backdrop-blur-xl rounded-full px-4 py-2.5 shadow-lg border border-border/40 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">+30 especialidades</span>
            </div>
          </FloatingBadge>
        </div>

        {/* Bottom stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8"
        >
          {[
            { value: "24h", label: "Disponibilidade", icon: Clock },
            { value: "+30", label: "Especialidades", icon: Stethoscope },
            { value: "4.9★", label: "Avaliação", icon: Star },
            { value: "100%", label: "Digital e seguro", icon: ShieldCheck },
          ].map(({ value, label, icon: StatIcon }) => (
            <div
              key={label}
              className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <StatIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-foreground leading-none">{value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default memo(HorizontalScrollCards);
