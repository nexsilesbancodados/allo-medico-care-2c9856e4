import { ReactNode } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KPI {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
}

interface DashboardHeroProps {
  gradient: string;
  greeting?: string;
  greetIcon?: ReactNode;
  name: string;
  subtitle?: string;
  kpis?: KPI[];
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  extra?: ReactNode;
  badge?: { label: string; color: string };
}

export function DashboardHero({
  gradient,
  greeting,
  greetIcon,
  name,
  subtitle,
  kpis = [],
  loading = false,
  onRefresh,
  refreshing = false,
  extra,
  badge,
}: DashboardHeroProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} shadow-xl shadow-black/10`}
    >
      {/* Decorative bubbles */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/[0.06] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/[0.04] blur-xl" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative z-10 p-5 sm:p-6">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {greeting && (
              <div className="mb-1 flex items-center gap-1.5">
                {greetIcon && <span className="text-white/60">{greetIcon}</span>}
                <span className="text-xs font-medium text-white/60">{greeting}</span>
              </div>
            )}
            <h1 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-[26px]">
              {name}
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-[11px] text-white/50">{subtitle}</p>
            )}
            {badge && (
              <span className={`mt-2 inline-block rounded-xl px-2.5 py-0.5 text-[10px] font-bold ${badge.color}`}>
                {badge.label}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {extra}
            {onRefresh && (
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-xl text-white/60 hover:bg-white/15 hover:text-white"
                onClick={onRefresh}
                disabled={refreshing}
                aria-label="Atualizar"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
        </div>

        {/* KPI pills */}
        {kpis.length > 0 && (
          <div className="-mx-1 mt-4 flex gap-2.5 overflow-x-auto px-1 scrollbar-none">
            {loading
              ? [1, 2, 3].map((i) => (
                  <div key={i} className="h-14 w-28 shrink-0 animate-pulse rounded-2xl bg-white/10" />
                ))
              : kpis.map((kpi, i) => (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, type: "spring", stiffness: 200, damping: 20 }}
                    className="flex shrink-0 items-center gap-2 rounded-2xl bg-white/15 px-3.5 py-2.5 backdrop-blur-md"
                  >
                    <span className="text-white/80">{kpi.icon}</span>
                    <div>
                      <p className="text-lg font-black leading-none tabular-nums text-white">{kpi.value}</p>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">{kpi.label}</p>
                    </div>
                  </motion.div>
                ))}
          </div>
        )}
      </div>
    </section>
  );
}
