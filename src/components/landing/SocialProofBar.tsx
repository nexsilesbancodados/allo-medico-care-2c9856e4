import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Shield, Award, Heart, Verified, Star, Users, Clock, Zap, Lock } from "lucide-react";

const badges = [
  { icon: Shield, text: "Regulamentado pelo CFM" },
  { icon: Award, text: "Nota 4.9 no Google" },
  { icon: Heart, text: "+12.500 pacientes" },
  { icon: Lock, text: "LGPD Compliant" },
  { icon: Verified, text: "CRM Verificado" },
  { icon: Star, text: "4.8★ Satisfação" },
  { icon: Users, text: "+500 médicos" },
  { icon: Clock, text: "Atendimento 24h" },
  { icon: Zap, text: "< 3s de carregamento" },
];

const doubled = [...badges, ...badges];

const SocialProofBar = forwardRef<HTMLElement>((_, ref) => (
  <section
    ref={ref}
    className="py-3.5 border-y border-border/30 bg-muted/10 overflow-hidden select-none"
  >
    <div className="relative">
      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex gap-10 md:gap-14 whitespace-nowrap will-change-transform"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ x: { duration: 45, repeat: Infinity, ease: "linear" } }}
      >
        {doubled.map((badge, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <badge.icon className="w-4 h-4 text-muted-foreground/60 shrink-0" />
            <span className="text-[13px] font-medium text-muted-foreground tracking-tight">
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
