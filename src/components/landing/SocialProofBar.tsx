import { forwardRef } from "react";
import { ShieldCheck, Medal, Heart, Lock, SealCheck, Star, UsersThree, Clock, Lightning } from "@phosphor-icons/react";

const badges = [
  { icon: ShieldCheck, text: "Regulamentado pelo CFM" },
  { icon: Medal, text: "Nota 4.9 no Google" },
  { icon: Heart, text: "+12.500 pacientes" },
  { icon: Lock, text: "LGPD Compliant" },
  { icon: SealCheck, text: "CRM Verificado" },
  { icon: Star, text: "4.8★ Satisfação" },
  { icon: UsersThree, text: "+500 médicos" },
  { icon: Clock, text: "Atendimento 24h" },
  { icon: Lightning, text: "< 3s de carregamento" },
];

const BadgeItem = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="flex items-center gap-2.5 shrink-0 rounded-full border border-border/20 bg-card/90 backdrop-blur-sm px-4 py-2.5 mx-2 shadow-sm hover:shadow-md hover:border-primary/15 hover:-translate-y-0.5 transition-all duration-300 cursor-default group">
    <Icon className="w-3.5 h-3.5 text-primary/60 shrink-0 group-hover:text-primary group-hover:scale-110 transition-all duration-300" weight="fill" />
    <span className="text-[12px] font-semibold text-muted-foreground whitespace-nowrap group-hover:text-foreground transition-colors duration-300">
      {text}
    </span>
  </div>
);

const SocialProofBar = forwardRef<HTMLElement>((_, ref) => (
  <section
    ref={ref}
    className="py-4 border-y border-border/15 bg-gradient-to-r from-muted/5 via-muted/10 to-muted/5 overflow-hidden select-none"
  >
    <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
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
