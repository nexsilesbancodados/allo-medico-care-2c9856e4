import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface BentoItem {
  label: string;
  value: string | number;
  icon: string;
  iconBg: string;
  valueClass: string;
  accentClass: string; // top bar color class e.g. "bg-blue-500"
  trend?: number;
  sub?: string;
  wide?: boolean;
  children?: ReactNode;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as unknown as number[] } } };

interface StatBentoProps {
  stats: BentoItem[];
  loading?: boolean;
  cols?: 2 | 3 | 4;
}

export function StatBento({ stats, loading = false, cols = 2 }: StatBentoProps) {
  const gridCols = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-2 sm:grid-cols-4" }[cols];

  if (loading) return (
    <div className={cn("grid gap-2.5", gridCols)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[100px] animate-pulse rounded-2xl bg-muted/50" />
      ))}
    </div>
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className={cn("grid gap-2.5", gridCols)}>
      {stats.map((s) => (
        <motion.div
          key={s.label}
          variants={item}
          className={cn(
            "group relative overflow-hidden rounded-2xl border border-border/25 bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
            s.wide && "col-span-2"
          )}
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,.05)" }}
        >
          {/* Colored top bar */}
          <div className={cn("h-[3px] w-full", s.accentClass)} />
          <div className="p-3.5">
            <div className="flex items-start justify-between">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-[10px] text-[16px]", s.iconBg)}>
                {s.icon}
              </div>
              {s.trend !== undefined && (
                <span className={cn(
                  "rounded-[7px] px-1.5 py-0.5 text-[9px] font-bold",
                  s.trend >= 0
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {s.trend >= 0 ? "↑" : "↓"} {Math.abs(s.trend)}%
                </span>
              )}
            </div>
            <p className={cn("mt-2.5 text-[22px] font-black leading-none tracking-tight tabular-nums", s.valueClass)}>{s.value}</p>
            <p className="mt-1 text-[10.5px] font-medium text-muted-foreground">{s.label}</p>
            {s.sub && <p className="mt-0.5 text-[9.5px] text-muted-foreground/55">{s.sub}</p>}
            {s.children}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
