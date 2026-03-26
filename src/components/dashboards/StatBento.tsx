import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface BentoItem {
  label: string;
  value: string | number;
  icon: string;
  iconBg: string;
  valueClass: string;
  accentClass?: string;
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
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[108px] animate-pulse rounded-2xl bg-muted/40" />
      ))}
    </div>
  );

  return (
    <motion.div
      variants={container} initial="hidden" animate="show"
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
    >
      {stats.map((s) => (
        <motion.div
          key={s.label}
          variants={item}
          className={cn(
            "group relative overflow-hidden rounded-2xl border border-border/30 bg-card",
            "transition-all duration-250 hover:-translate-y-1.5 hover:shadow-[0_8px_24px_rgba(0,0,0,.08)] hover:border-border/50 cursor-default",
            s.wide && "col-span-2"
          )}
        >
          {/* Accent background blob — decorativo */}
          <div className={cn("absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-[0.07] blur-xl transition-all duration-300 group-hover:opacity-[0.12]", s.accentClass)} />
          <div className="relative p-4">
            <div className="flex items-start justify-between">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-[12px] text-[18px] md:h-11 md:w-11 md:text-[20px]", s.iconBg)}>
                {s.icon}
              </div>
              {s.trend !== undefined && (
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[9px] font-bold",
                  s.trend >= 0
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {s.trend >= 0 ? "↑" : "↓"} {Math.abs(s.trend)}%
                </span>
              )}
            </div>
            <p className={cn("mt-2.5 text-[22px] font-black leading-none tracking-tight tabular-nums md:text-[24px]", s.valueClass)}>
              {s.value}
            </p>
            <p className="mt-1 text-[10.5px] font-semibold text-muted-foreground md:text-[11px]">{s.label}</p>
            {s.sub && <p className="mt-0.5 text-[9.5px] text-muted-foreground/50">{s.sub}</p>}
            {s.children}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
