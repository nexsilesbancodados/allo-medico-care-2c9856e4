import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Shield, Award, Heart, Verified, Star, Users, Clock, Zap, Lock } from "lucide-react";

const badges = [
  { icon: Shield, text: "Regulamentado pelo CFM", highlight: true },
  { icon: Award, text: "Nota 4.9 no Google" },
  { icon: Heart, text: "+12.500 pacientes" },
  { icon: Lock, text: "LGPD Compliant", highlight: true },
  { icon: Verified, text: "CRM Verificado" },
  { icon: Star, text: "4.8★ Satisfação" },
  { icon: Users, text: "+500 médicos" },
  { icon: Clock, text: "Atendimento 24h" },
  { icon: Zap, text: "< 3s de carregamento" },
];

const allBadges = [...badges, ...badges];

const SocialProofBar = forwardRef<HTMLElement>((_, ref) => (
  <section className="py-5 md:py-6 border-y border-border/40 bg-muted/20 overflow-hidden">
    <div className="relative">
      <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex gap-8 md:gap-12 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ x: { duration: 40, repeat: Infinity, ease: "linear" } }}
      >
        {allBadges.map((badge, i) => (
          <div key={i} className="flex items-center gap-2.5 shrink-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              badge.highlight ? "bg-primary/10" : "bg-muted/60"
            }`}>
              <badge.icon className={`w-3.5 h-3.5 ${badge.highlight ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <span className={`text-xs md:text-sm font-medium ${badge.highlight ? "text-foreground" : "text-muted-foreground"}`}>
              {badge.text}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  </section>
));
SocialProofBar.displayName = "SocialProofBar";
export default SocialProofBar;
