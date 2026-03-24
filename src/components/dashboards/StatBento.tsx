import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface BentoItem {
  label: string;
  value: string | number;
  icon: string;
  iconBg: string;
  valueClass: string;
  accentClass: string;
  trend?: number;
  sub?: string;
  wide?: boolean;
  children?: ReactNode;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function StatBento({ stats, loading = false }: { stats: BentoItem[]; loading?: boolean }) {
  if (loading) return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[100px] animate-pulse rounded-2xl bg-muted/50" />
      ))}
    </div>
  );

  return (
    <motion.div
      variants={container} initial="hidden" animate="show"
      className="grid grid-cols-2 gap-2.5 md:grid-cols-4"
    >
      {stats.map((s) => (
        <motion.div
          key={s.label}
          variants={item}
          className={cn(
            "group relative overflow-hidden rounded-2xl border border-border/20 bg-card",
            "transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-default",
            s.wide && "col-span-2"
          )}
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,.05)" }}
        >
          {/* Colored top bar */}
          <div className={cn("h-[3px] w-full", s.accentClass)} />
          <div className="p-3 md:p-3.5">
            <div className="flex items-start justify-between">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-[10px] text-[15px] md:h-9 md:w-9 md:text-[17px]", s.iconBg)}>
                {s.icon}
              </div>
              {s.trend !== undefined && (
                <span className={cn(
                  "rounded-[7px] px-1.5 py-0.5 text-[8.5px] font-bold",
                  s.trend >= 0
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {s.trend >= 0 ? "↑" : "↓"} {Math.abs(s.trend)}%
                </span>
              )}
            </div>
            <p className={cn("mt-2 text-[20px] font-black leading-none tracking-tight tabular-nums md:text-[22px]", s.valueClass)}>
              {s.value}
            </p>
            <p className="mt-1 text-[10px] font-medium text-muted-foreground md:text-[10.5px]">{s.label}</p>
            {s.sub && <p className="mt-0.5 text-[9px] text-muted-foreground/55">{s.sub}</p>}
            {s.children}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
