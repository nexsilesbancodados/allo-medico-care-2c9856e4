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
        "relative overflow-hidden bg-gradient-to-br rounded-b-3xl md:rounded-3xl",
        gradient, className
      )}
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,.20)" }}
    >
      {/* Orbs */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/[0.06]" />
      <div className="pointer-events-none absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-white/[0.04]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div className="relative z-10 px-4 pt-4 pb-0 md:px-6 md:pt-5">
        {/* Mobile layout: bubble left, Pingo right */}
        {/* Desktop layout: bubble + kpis left, Pingo right (larger) */}
        <div className="flex items-start gap-3 md:gap-6">

          {/* LEFT: bubble/name + kpis */}
          <div className="min-w-0 flex-1">
            {bubble ? (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="relative mb-3 inline-block rounded-[16px] rounded-bl-[4px] border border-white/20 bg-white px-3.5 py-2.5 shadow-[0_4px_18px_rgba(0,0,0,.14)]"
                style={{ maxWidth: "min(210px, 70vw)" }}
              >
                {bubble.greeting && (
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-primary leading-none">{bubble.greeting}</p>
                )}
                {bubble.name && (
                  <p className="mt-0.5 text-[13px] font-black tracking-tight text-foreground leading-tight md:text-[15px]">{bubble.name}</p>
                )}
                {bubble.sub && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-muted-foreground">
                    {liveDot && <LiveDotEl />}
                    {bubble.sub}
                  </p>
                )}
                <div className="absolute -bottom-[7px] left-3.5 h-0 w-0 border-l-[7px] border-r-0 border-t-[8px] border-l-transparent border-t-white" />
              </motion.div>
            ) : (
              <div className="mb-2">
                {tag && (
                  <p className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/55">
                    {liveDot && <LiveDotEl />}{tag}
                  </p>
                )}
                {name && <h1 className="text-[20px] font-black leading-tight tracking-tight text-white md:text-[24px]">{name}</h1>}
                {subtitle && <p className="mt-0.5 text-[10.5px] text-white/50">{subtitle}</p>}
              </div>
            )}

            {/* KPI strip — horizontal on mobile, can wrap on desktop */}
            {kpis.length > 0 && (
              <div className="flex overflow-x-auto rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm scrollbar-none
                             md:grid md:overflow-visible"
                style={{ gridTemplateColumns: kpis.length > 3 ? `repeat(${kpis.length}, 1fr)` : undefined }}
              >
                {loading
                  ? Array.from({ length: kpis.length }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 flex-1 animate-pulse px-3 py-2.5 min-w-[68px]">
                        <div className="mx-auto h-5 w-10 rounded bg-white/20" />
                        <div className="mx-auto mt-1 h-2 w-8 rounded bg-white/15" />
                      </div>
                    ))
                  : kpis.map((k, i) => (
                      <motion.div
                        key={k.label}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.07, duration: 0.35 }}
                        className={cn(
                          "flex flex-1 flex-col items-center px-2.5 py-2.5 flex-shrink-0 min-w-[68px] md:min-w-0",
                          i < kpis.length - 1 && "border-r border-white/15"
                        )}
                      >
                        <p className="text-[17px] font-black leading-none tabular-nums text-white tracking-tight md:text-[20px]">{k.value}</p>
                        <p className="mt-0.5 text-[7.5px] font-semibold uppercase tracking-wider text-white/50 md:text-[8.5px]">{k.label}</p>
                      </motion.div>
                    ))}
              </div>
            )}
          </div>

          {/* RIGHT: Pingo + action buttons */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            <div className="flex gap-1.5">
              {topRight}
              {onRefresh && (
                <Button size="icon" aria-label="Atualizar" variant="ghost" onClick={onRefresh} disabled={refreshing}
                  className="h-8 w-8 rounded-xl border border-white/20 text-white/60 hover:bg-white/15 hover:text-white">
                  <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                </Button>
              )}
            </div>
            {/* PINGO — real 3D PNG, float animation */}
            <motion.img
              src={pingoSrc}
              alt={pingoAlt}
              draggable={false}
              className="select-none object-contain w-[100px] h-[100px] md:w-[130px] md:h-[130px]"
              style={{ filter: "drop-shadow(0 10px 24px rgba(0,0,0,.24))" }}
              initial={{ opacity: 0, scale: 0.7, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
              transition={{
                opacity: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
              }}
            />
          </div>
        </div>
        <div className="h-3 md:h-4" />
      </div>
    </section>
  );
}
