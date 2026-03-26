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

const BadgeItem = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="flex items-center gap-2 shrink-0 rounded-full border border-border/50 bg-background/80 px-3.5 py-2 mx-1.5">
    <Icon className="w-4 h-4 text-muted-foreground/60 shrink-0" />
    <span className="text-[13px] font-medium text-muted-foreground tracking-tight whitespace-nowrap">
      {text}
    </span>
  </div>
);

const SocialProofBar = forwardRef<HTMLElement>((_, ref) => (
  <section
    ref={ref}
    className="py-3.5 border-y border-border/30 bg-muted/10 overflow-hidden select-none"
  >
    <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {[...badges, ...badges].map((badge, i) => (
          <BadgeItem key={`${badge.text}-${i}`} icon={badge.icon} text={badge.text} />
        ))}
      </div>
    </div>
  </section>
));

SocialProofBar.displayName = "SocialProofBar";
export default SocialProofBar;
