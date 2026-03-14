import { ReactNode, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  /** Tailwind gradient e.g. "from-blue-500 to-cyan-500" */
  gradient?: string;
  suffix?: string;
  decimals?: number;
  description?: string;
  onClick?: () => void;
  className?: string;
  /** Animate number from 0 → value */
  animate?: boolean;
}

/**
 * Premium KPI card with optional GSAP number counter animation.
 * Use role="listitem" on the wrapper and role="list" on the grid.
 */
const KpiCard = ({
  label, value, icon, gradient = "from-primary/80 to-primary",
  suffix = "", decimals = 0, description, onClick, className, animate = true,
}: KpiCardProps) => {
  const numRef   = useRef<HTMLSpanElement>(null);
  const cardRef  = useRef<HTMLDivElement>(null);
  const isNum    = typeof value === "number";

  // GSAP counter
  useEffect(() => {
    if (!isNum || !animate || !numRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (numRef.current) {
        numRef.current.textContent = decimals > 0
          ? (value as number).toFixed(decimals)
          : (value as number).toLocaleString("pt-BR");
      }
      return;
    }
    const el = numRef.current;
    const obj = { val: 0 };
    let tween: gsap.core.Tween;
    const trigger = ScrollTrigger.create({
      trigger: cardRef.current,
      start: "top 90%",
      once: true,
      onEnter: () => {
        tween = gsap.to(obj, {
          val: value as number,
          duration: 1.4,
          ease: "power2.out",
          onUpdate: () => {
            if (el) el.textContent = decimals > 0
              ? obj.val.toFixed(decimals)
              : Math.round(obj.val).toLocaleString("pt-BR");
          },
        });
      },
    });
    return () => { trigger.kill(); tween?.kill(); };
  }, [value, decimals, isNum, animate]);

  const Tag = onClick ? motion.button : motion.div;

  return (
    <Tag
      ref={cardRef as React.RefObject<HTMLDivElement & HTMLButtonElement>}
      onClick={onClick}
      whileHover={{ y: -2, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/40 bg-card p-4 text-left transition-shadow duration-200",
        "hover:shadow-lg hover:shadow-black/5 hover:border-border/60",
        onClick && "cursor-pointer",
        className
      )}
      role="listitem"
      aria-label={`${label}: ${isNum ? value : value}${suffix}`}
    >
      {/* Ambient glow */}
      <div
        className={cn("absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-15 pointer-events-none bg-gradient-to-br", gradient)}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-3">
        {/* Icon */}
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-gradient-to-br text-white", gradient)}>
          <span className="[&>svg]:w-4.5 [&>svg]:h-4.5" aria-hidden="true">{icon}</span>
        </div>

        {/* Number */}
        <div className="text-right">
          <p className="text-2xl font-extrabold tracking-tight text-foreground leading-none tabular-nums">
            {isNum ? (
              <>
                <span ref={numRef}>{(value as number).toLocaleString("pt-BR")}</span>
                {suffix && <span className="text-base font-semibold text-muted-foreground ml-0.5">{suffix}</span>}
              </>
            ) : (
              <span>{value}{suffix}</span>
            )}
          </p>
        </div>
      </div>

      <div className="relative mt-3">
        <p className="text-xs font-semibold text-foreground/80">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{description}</p>}
      </div>
    </Tag>
  );
};

export default KpiCard;
