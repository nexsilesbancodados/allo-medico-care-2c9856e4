import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCard {
  label: string;
  value: string | number;
  icon: ReactNode;
  bg: string;
  text: string;
  sub?: string;
  trend?: { value: number; label: string };
}

interface DashboardStatCardsProps {
  cards: StatCard[];
  cols?: 2 | 3 | 4;
  loading?: boolean;
  className?: string;
}

export function DashboardStatCards({ cards, cols = 4, loading = false, className }: DashboardStatCardsProps) {
  const colClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  }[cols];

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };
  const item = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={cn(`grid gap-3 ${colClass}`, className)}
    >
      {loading
        ? Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
          ))
        : cards.map((card) => (
            <motion.div
              key={card.label}
              variants={item}
              className="group relative overflow-hidden rounded-2xl border border-border/30 bg-card p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
                  <span className={card.text}>{card.icon}</span>
                </div>
                {card.trend && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      card.trend.value >= 0
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {card.trend.value >= 0 ? "+" : ""}{card.trend.value}%
                  </span>
                )}
              </div>
              <p className={`mt-3 text-2xl font-black tabular-nums ${card.text}`}>{card.value}</p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">{card.label}</p>
              {card.sub && <p className="mt-0.5 text-[10px] text-muted-foreground/50">{card.sub}</p>}
            </motion.div>
          ))}
    </motion.div>
  );
}
