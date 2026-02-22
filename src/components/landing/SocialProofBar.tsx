import { motion } from "framer-motion";
import { Shield, Award, Heart, CheckCircle, Verified, Star, Users, Clock } from "lucide-react";

const badges = [
  { icon: Shield, text: "Regulamentado pelo CFM" },
  { icon: Award, text: "Nota 4.9 no Google" },
  { icon: Heart, text: "+12.500 pacientes" },
  { icon: CheckCircle, text: "LGPD Compliant" },
  { icon: Verified, text: "CRM Verificado" },
  { icon: Star, text: "4.8★ App Store" },
  { icon: Users, text: "+500 médicos" },
  { icon: Clock, text: "Atendimento 24h" },
];

// Double the badges for seamless loop
const allBadges = [...badges, ...badges];

const SocialProofBar = () => (
  <section className="py-4 md:py-6 border-y border-border/50 bg-muted/30 overflow-hidden">
    <div className="relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex gap-6 md:gap-10 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ x: { duration: 30, repeat: Infinity, ease: "linear" } }}
      >
        {allBadges.map((badge, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 text-muted-foreground shrink-0 group"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <badge.icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs md:text-sm font-semibold">{badge.text}</span>
          </div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default SocialProofBar;
