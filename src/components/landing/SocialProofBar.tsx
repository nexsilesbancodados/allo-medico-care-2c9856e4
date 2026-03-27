import { forwardRef } from "react";
import { Shield, Award, Heart, Verified, Star, Users, Clock, Zap, Lock } from "lucide-react";

const badges = [
  { icon: Shield, text: "Regulamentado pelo CFM", color: "text-primary", bg: "bg-primary/10" },
  { icon: Award, text: "Nota 4.9 no Google", color: "text-warning", bg: "bg-warning/10" },
  { icon: Heart, text: "+12.500 pacientes", color: "text-destructive", bg: "bg-destructive/10" },
  { icon: Lock, text: "LGPD Compliant", color: "text-success", bg: "bg-success/10" },
  { icon: Verified, text: "CRM Verificado", color: "text-primary", bg: "bg-primary/10" },
  { icon: Star, text: "4.8★ Satisfação", color: "text-warning", bg: "bg-warning/10" },
  { icon: Users, text: "+500 médicos", color: "text-accent-foreground", bg: "bg-accent/60" },
  { icon: Clock, text: "Atendimento 24h", color: "text-success", bg: "bg-success/10" },
  { icon: Zap, text: "< 3s de carregamento", color: "text-warning", bg: "bg-warning/10" },
];

const BadgeItem = ({ icon: Icon, text, color, bg }: { icon: React.ElementType; text: string; color: string; bg: string }) => (
  <div className="flex items-center gap-2.5 shrink-0 rounded-full border border-border/40 bg-card/90 backdrop-blur-sm px-4 py-2.5 mx-1.5 shadow-sm">
    <div className={`flex items-center justify-center w-6 h-6 rounded-full ${bg}`}>
      <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
    </div>
    <span className="text-[13px] font-semibold text-foreground tracking-tight whitespace-nowrap">
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
