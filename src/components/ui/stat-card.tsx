import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  action?: { label: string; onClick: () => void };
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { container: "w-10 h-10", iconSize: "w-5 h-5", value: "text-xl", padding: "p-4" },
  md: { container: "w-12 h-12", iconSize: "w-6 h-6", value: "text-2xl sm:text-[28px]", padding: "p-5" },
  lg: { container: "w-14 h-14", iconSize: "w-7 h-7", value: "text-3xl", padding: "p-6" },
};

const StatCard = ({
  title, value, subtitle, icon, iconColor = "text-primary",
  iconBg = "bg-primary/10 dark:bg-primary/15", trend, action,
  loading = false, size = "md", className,
}: StatCardProps) => {
  const s = sizeMap[size];

  if (loading) {
    return (
      <div className={cn("rounded-2xl border border-border/30 bg-card", s.padding, className)}>
        <div className="flex items-start justify-between gap-3">
          <Skeleton className={cn("rounded-xl shrink-0", s.container)} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl border border-border/30 bg-card transition-all duration-200",
      "hover:shadow-md hover:-translate-y-0.5",
      s.padding, className
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className={cn("rounded-xl flex items-center justify-center shrink-0", iconBg, s.container)}>
          <span className={cn(iconColor, s.iconSize, "flex items-center justify-center [&>svg]:w-full [&>svg]:h-full")}>{icon}</span>
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md",
            trend.value >= 0
              ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30"
              : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30"
          )}>
            {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value > 0 ? "+" : ""}{trend.value}%
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        <p className={cn("font-bold text-foreground tabular-nums leading-tight mt-1", s.value)}>{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {trend?.label && <p className="text-[11px] text-muted-foreground mt-0.5">{trend.label}</p>}
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {action.label} →
        </button>
      )}
    </div>
  );
};

export { StatCard };
export type { StatCardProps };
