import { motion } from "framer-motion";
import { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface KpiItem { label: string; value: string | number; }

interface HeroBannerProps {
  gradient: string;
  tag?: string;
  liveDot?: boolean;
  liveColor?: "green" | "red";
  name?: string;
  subtitle?: string;
  bubble?: { greeting?: string; name?: string; sub?: string };
  pingoSrc: string;
  pingoAlt?: string;
  kpis?: KpiItem[];
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  topRight?: ReactNode;
  className?: string;
}

export function HeroBanner({
  gradient, tag, liveDot = false, liveColor = "green",
  name, subtitle, bubble, pingoSrc, pingoAlt = "Pingo",
  kpis = [], loading = false, onRefresh, refreshing = false,
  topRight, className,
}: HeroBannerProps) {
  const LiveDotEl = () => (
    <span className={cn(
      "inline-block h-[5px] w-[5px] rounded-full animate-pulse",
      liveColor === "red" ? "bg-red-400" : "bg-emerald-400"
    )} />
  );

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-b-3xl md:rounded-3xl",
        gradient, className
      )}
      style={{ boxShadow: "0 8px 40px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.12)" }}
    >
      {/* Orbs maiores e mais suaves */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-white/[0.04] blur-2xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      {/* Textura sutil de noise */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                backgroundSize: "200px" }} />

      <div className="relative z-10 px-4 pt-5 pb-0 md:px-6 md:pt-6">
        <div className="flex items-start gap-3 md:gap-6">

          {/* LEFT: bubble/name + kpis */}
          <div className="min-w-0 flex-1">
            {bubble ? (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.93 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative mb-3.5 inline-block rounded-[18px] rounded-bl-[5px] border border-white/25 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-[0_6px_24px_rgba(0,0,0,.16)]"
                style={{ maxWidth: "min(220px, 72vw)" }}
              >
                {bubble.greeting && (
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-primary leading-none">{bubble.greeting}</p>
                )}
                {bubble.name && (
                  <p className="mt-0.5 text-[13.5px] font-black tracking-tight text-foreground leading-tight md:text-[15.5px]">{bubble.name}</p>
                )}
                {bubble.sub && (
                  <p className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    {liveDot && <LiveDotEl />}
                    {bubble.sub}
                  </p>
                )}
                <div className="absolute -bottom-[8px] left-4 h-0 w-0 border-l-[8px] border-r-0 border-t-[9px] border-l-transparent border-t-white/95" />
              </motion.div>
            ) : (
              <div className="mb-2.5">
                {tag && (
                  <p className="mb-1.5 flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-white/60">
                    {liveDot && <LiveDotEl />}{tag}
                  </p>
                )}
                {name && <h1 className="text-[21px] font-black leading-tight tracking-tight text-white drop-shadow-sm md:text-[25px]">{name}</h1>}
                {subtitle && <p className="mt-1 text-[10.5px] text-white/55 font-medium">{subtitle}</p>}
              </div>
            )}

            {/* KPI strip — glassmorphism aprimorado */}
            {kpis.length > 0 && (
              <div
                className="flex overflow-x-auto rounded-2xl border border-white/20 bg-white/[0.13] backdrop-blur-md scrollbar-none md:grid md:overflow-visible"
                style={{
                  gridTemplateColumns: kpis.length > 3 ? `repeat(${kpis.length}, 1fr)` : undefined,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.15), 0 2px 12px rgba(0,0,0,.1)"
                }}
              >
                {loading
                  ? Array.from({ length: kpis.length }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 flex-1 animate-pulse px-3 py-3 min-w-[72px]">
                        <div className="mx-auto h-5 w-12 rounded-lg bg-white/20" />
                        <div className="mx-auto mt-1.5 h-2 w-8 rounded bg-white/15" />
                      </div>
                    ))
                  : kpis.map((k, i) => (
                      <motion.div
                        key={k.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18 + i * 0.07, duration: 0.38 }}
                        className={cn(
                          "flex flex-1 flex-col items-center px-3 py-3 flex-shrink-0 min-w-[72px] md:min-w-0",
                          i < kpis.length - 1 && "border-r border-white/15"
                        )}
                      >
                        <p className="text-[19px] font-black leading-none tabular-nums text-white tracking-tight drop-shadow-sm md:text-[22px]">{k.value}</p>
                        <p className="mt-1 text-[7.5px] font-bold uppercase tracking-widest text-white/55 md:text-[8.5px]">{k.label}</p>
                      </motion.div>
                    ))}
              </div>
            )}
          </div>

          {/* RIGHT: Pingo + botões — Pingo maior no desktop */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            <div className="flex gap-1.5">
              {topRight}
              {onRefresh && (
                <Button size="icon" aria-label="Atualizar" variant="ghost" onClick={onRefresh} disabled={refreshing}
                  className="h-8 w-8 rounded-xl border border-white/20 text-white/65 hover:bg-white/15 hover:text-white transition-all">
                  <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                </Button>
              )}
            </div>
            <motion.img
              src={pingoSrc} alt={pingoAlt} draggable={false}
              className="select-none object-contain w-[108px] h-[108px] md:w-[140px] md:h-[140px]"
              style={{ filter: "drop-shadow(0 12px 28px rgba(0,0,0,.28))" }}
              initial={{ opacity: 0, scale: 0.65, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: [0, -12, 0] }}
              transition={{
                opacity: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
              }}
            />
          </div>
        </div>
        <div className="h-3 md:h-5" />
      </div>
    </section>
  );
}
