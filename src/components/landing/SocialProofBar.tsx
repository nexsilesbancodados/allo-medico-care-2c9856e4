import { motion } from "framer-motion";
import { Shield, Award, Heart, CheckCircle, Verified, Star, Users, Clock, Zap, Lock } from "lucide-react";

const badges = [
  { icon: Shield, text: "Regulamentado pelo CFM", tooltip: "Conselho Federal de Medicina", highlight: true },
  { icon: Award, text: "Nota 4.9 no Google", tooltip: "Baseado em +2.000 avaliações" },
  { icon: Heart, text: "+12.500 pacientes", tooltip: "Pacientes atendidos desde 2024" },
  { icon: Lock, text: "LGPD Compliant", tooltip: "Dados criptografados e protegidos", highlight: true },
  { icon: Verified, text: "CRM Verificado", tooltip: "Todos os médicos verificados" },
  { icon: Star, text: "4.8★ Satisfação", tooltip: "Net Promoter Score" },
  { icon: Users, text: "+500 médicos", tooltip: "Especialistas cadastrados" },
  { icon: Clock, text: "Atendimento 24h", tooltip: "Disponível todos os dias" },
  { icon: Zap, text: "< 3s de carregamento", tooltip: "Performance otimizada" },
];

// Double for seamless loop
const allBadges = [...badges, ...badges];

const SocialProofBar = () => (
  <section className="py-4 md:py-6 border-y border-border/50 bg-muted/30 overflow-hidden">
    <div className="relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-muted/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-muted/80 to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex gap-6 md:gap-10 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ x: { duration: 35, repeat: Infinity, ease: "linear" } }}
      >
        {allBadges.map((badge, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 text-muted-foreground shrink-0 group relative cursor-default"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
              badge.highlight
                ? "bg-primary/10 group-hover:bg-primary/20"
                : "bg-primary/5 group-hover:bg-primary/15"
            }`}>
              <badge.icon className={`w-4 h-4 ${badge.highlight ? "text-primary" : "text-primary/70"}`} />
            </div>
            <div className="flex flex-col">
              <span className={`text-xs md:text-sm font-semibold leading-tight ${badge.highlight ? "text-foreground" : ""}`}>
                {badge.text}
              </span>
              <span className="text-[9px] text-muted-foreground/60 leading-tight hidden md:block">
                {badge.tooltip}
              </span>
            </div>
            {badge.highlight && (
              <span className="w-1.5 h-1.5 rounded-full bg-medical-green animate-pulse" />
            )}
          </div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default SocialProofBar;
