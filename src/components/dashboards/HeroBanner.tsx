import { motion } from "framer-motion";
import { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface KpiItem {
  label: string;
  value: string | number;
}

interface HeroBannerProps {
  /** Tailwind gradient classes e.g. "from-[#1e3a8a] via-[#2563EB] to-[#3b82f6]" */
  gradient: string;
  /** Eyebrow tag text */
  tag?: string;
  /** Whether to show the live dot */
  liveDot?: boolean;
  liveColor?: "green" | "red";
  /** Main heading */
  name: string;
  /** Subtitle under name */
  subtitle?: string;
  /** Speech bubble content */
  bubble?: { greeting?: string; name?: string; sub?: string };
  /** Real Pingo image src (imported asset) */
  pingoSrc: string;
  pingoAlt?: string;
  /** KPI strip items (max 4) */
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
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-gradient-to-br",
        gradient,
        className
      )}
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,.18)" }}
    >
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/[0.06]" />
      <div className="pointer-events-none absolute -left-6 bottom-0 h-20 w-20 rounded-full bg-white/[0.04]" />
      {/* Top shine */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div className="relative z-10 px-4 pb-0 pt-4">
        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Left: bubble + name */}
          <div className="min-w-0 flex-1">
            {/* Speech bubble */}
            {bubble && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="relative mb-2.5 inline-block max-w-[210px] rounded-[16px] rounded-bl-[4px] border border-white/20 bg-white px-3.5 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,.14)]"
              >
                {bubble.greeting && (
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-primary">{bubble.greeting}</p>
                )}
                {bubble.name && (
                  <p className="mt-0.5 text-[13px] font-black tracking-tight text-foreground leading-tight">{bubble.name}</p>
                )}
                {bubble.sub && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-muted-foreground">
                    {liveDot && (
                      <span className={cn(
                        "inline-block h-[5px] w-[5px] rounded-full",
                        liveColor === "red" ? "bg-red-500 animate-pulse" : "bg-emerald-500 animate-pulse"
                      )} />
                    )}
                    {bubble.sub}
                  </p>
                )}
                {/* Tail */}
                <div className="absolute -bottom-[7px] left-3.5 h-0 w-0 border-l-[7px] border-r-0 border-t-[8px] border-l-transparent border-t-white" />
              </motion.div>
            )}

            {!bubble && (
              <div className="mb-2">
                {tag && (
                  <p className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/55">
                    {liveDot && (
                      <span className={cn(
                        "inline-block h-[5px] w-[5px] rounded-full",
                        liveColor === "red" ? "bg-red-400 animate-pulse" : "bg-emerald-400 animate-pulse"
                      )} />
                    )}
                    {tag}
                  </p>
                )}
                <h1 className="text-[22px] font-black leading-tight tracking-tight text-white">{name}</h1>
                {subtitle && <p className="mt-0.5 text-[10.5px] text-white/50">{subtitle}</p>}
              </div>
            )}
          </div>

          {/* Right: Pingo image + actions */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            {(onRefresh || topRight) && (
              <div className="flex gap-1.5">
                {topRight}
                {onRefresh && (
                  <Button
                    size="icon" variant="ghost" aria-label="Atualizar"
                    onClick={onRefresh} disabled={refreshing}
                    className="h-8 w-8 rounded-xl border border-white/20 text-white/60 hover:bg-white/15 hover:text-white"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                  </Button>
                )}
              </div>
            )}
            {/* PINGO — real 3D image, floating animation */}
            <motion.img
              src={pingoSrc}
              alt={pingoAlt}
              className="w-[108px] h-[108px] object-contain select-none"
              style={{ filter: "drop-shadow(0 10px 22px rgba(0,0,0,.22))" }}
              initial={{ opacity: 0, scale: 0.7, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: [0, -9, 0] }}
              transition={{
                opacity: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                scale:   { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
              }}
            />
          </div>
        </div>

        {/* KPI Strip */}
        {kpis.length > 0 && (
          <div className="mt-3 flex overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm">
            {loading
              ? Array.from({ length: kpis.length }).map((_, i) => (
                  <div key={i} className="flex-1 animate-pulse px-3 py-2.5">
                    <div className="mx-auto h-5 w-10 rounded bg-white/20" />
                    <div className="mx-auto mt-1 h-2 w-8 rounded bg-white/15" />
                  </div>
                ))
              : kpis.map((k, i) => (
                  <motion.div
                    key={k.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.07, duration: 0.35, ease: "easeOut" }}
                    className={cn(
                      "flex flex-1 flex-col items-center px-2 py-2.5",
                      i < kpis.length - 1 && "border-r border-white/15"
                    )}
                  >
                    <p className="text-[18px] font-black leading-none tabular-nums text-white tracking-tight">{k.value}</p>
                    <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider text-white/50">{k.label}</p>
                  </motion.div>
                ))}
          </div>
        )}
        <div className="h-3" />
      </div>
    </section>
  );
}
