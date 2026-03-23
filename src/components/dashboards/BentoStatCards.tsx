import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface BentoStat {
  label: string;
  value: string | number;
  icon: string;
  iconBg: string;
  valueColor: string;
  trend?: { value: number; positive?: boolean };
  sub?: string;
  wide?: boolean;
  children?: ReactNode;
}

interface BentoStatCardsProps {
  stats: BentoStat[];
  loading?: boolean;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } } as const;

export function BentoStatCards({ stats, loading = false }: BentoStatCardsProps) {
  if (loading) return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/50" />)}
    </div>
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show"
      className="grid grid-cols-2 gap-3"
    >
      {stats.map((s) => (
        <motion.div key={s.label} variants={item}
          className={cn(
            "group relative overflow-hidden rounded-2xl border border-border/30 bg-card p-4 transition-all duration-200",
            "hover:-translate-y-1 hover:border-border/60 hover:shadow-lg",
            s.wide && "col-span-2"
          )}
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}
        >
          <div className="flex items-start justify-between">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-[17px] ${s.iconBg}`}>
              {s.icon}
            </div>
            {s.trend && (
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[9.5px] font-bold",
                s.trend.positive !== false && s.trend.value >= 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              )}>
                {s.trend.value >= 0 ? "↑" : "↓"} {Math.abs(s.trend.value)}%
              </span>
            )}
          </div>
          <p className={`mt-3 text-[23px] font-black tabular-nums leading-none tracking-tight ${s.valueColor}`}>{s.value}</p>
          <p className="mt-1 text-[11px] font-medium text-muted-foreground">{s.label}</p>
          {s.sub && <p className="mt-0.5 text-[10px] text-muted-foreground/60">{s.sub}</p>}
          {s.children}
        </motion.div>
      ))}
    </motion.div>
  );
}
