import { forwardRef } from "react";
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

const SocialProofBar = forwardRef<HTMLElement>((_, ref) => (
  <section
    ref={ref}
    className="py-3.5 border-y border-border/30 bg-muted/10 overflow-hidden select-none"
  >
    <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
      <div className="flex gap-2 overflow-x-auto py-1 mobile-scroll sm:flex-wrap sm:justify-center sm:overflow-visible">
        {badges.map((badge) => (
          <div key={badge.text} className="flex items-center gap-2 shrink-0 rounded-full border border-border/50 bg-background/80 px-3 py-2">
            <badge.icon className="w-4 h-4 text-muted-foreground/60 shrink-0" />
            <span className="text-[13px] font-medium text-muted-foreground tracking-tight whitespace-nowrap">
              {badge.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  </section>
));

SocialProofBar.displayName = "SocialProofBar";
export default SocialProofBar;
