import { ReactNode } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KPI { label: string; value: string | number; icon?: ReactNode }

interface PremiumHeroProps {
  gradient: string;
  orb1Color: string;
  orb2Color: string;
  tag?: string;
  tagIcon?: ReactNode;
  name: string;
  subtitle?: string;
  badge?: { label: string };
  kpis?: KPI[];
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  topRight?: ReactNode;
  liveDot?: boolean;
  liveCount?: number;
}

const LiveDot = ({ color = "green" }: { color?: "green" | "red" }) => (
  <span className={`inline-block w-2 h-2 rounded-full ${color === "red" ? "bg-red-500" : "bg-emerald-400"} animate-pulse`} />
);

export function PremiumHero({
  gradient, orb1Color, orb2Color, tag, tagIcon, name, subtitle, badge,
  kpis = [], loading = false, onRefresh, refreshing = false, topRight, liveDot, liveCount,
}: PremiumHeroProps) {
  return (
    <section className={`relative overflow-hidden rounded-3xl ${gradient}`} style={{ boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-60" style={{ background: orb1Color, filter: "blur(48px)" }} />
      <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full opacity-40" style={{ background: orb2Color, filter: "blur(36px)" }} />
      {/* Dot grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />
      {/* Top highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative z-10 p-5 sm:p-6">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {tag && (
              <div className="mb-2 flex items-center gap-1.5">
                {liveDot && <LiveDot color="red" />}
                {tagIcon && <span className="text-white/60">{tagIcon}</span>}
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">{tag}</span>
                {liveCount !== undefined && liveCount > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] font-black text-white">{liveCount}</span>
                )}
              </div>
            )}
            <h1 className="text-[22px] font-black leading-tight tracking-tight text-white sm:text-[24px]">{name}</h1>
            {subtitle && <p className="mt-1 text-[11px] text-white/45">{subtitle}</p>}
            {badge && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/12 px-3 py-1.5 backdrop-blur-md">
                <LiveDot />
                <span className="text-[9px] font-bold text-white/85">{badge.label}</span>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {topRight}
            {onRefresh && (
              <Button size="icon" variant="ghost" aria-label="Atualizar"
                className="h-9 w-9 rounded-xl border border-white/20 text-white/60 hover:bg-white/15 hover:text-white"
                onClick={onRefresh} disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
        </div>

        {/* KPI pills */}
        {kpis.length > 0 && (
          <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-0.5 scrollbar-none">
            {loading ? Array.from({ length: kpis.length }).map((_, i) => (
              <div key={i} className="h-[58px] w-20 shrink-0 animate-pulse rounded-2xl bg-white/10" />
            )) : kpis.map((k, i) => (
              <motion.div key={k.label}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 220, damping: 22 }}
                className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/14 px-3.5 py-2.5 backdrop-blur-md"
              >
                {k.icon && <span className="text-white/70">{k.icon}</span>}
                <div>
                  <p className="text-[17px] font-black leading-none tabular-nums text-white tracking-tight">{k.value}</p>
                  <p className="mt-0.5 text-[8.5px] font-semibold uppercase tracking-wider text-white/45">{k.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
