import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Sparkline from "@/components/ui/sparkline";
import { motion } from "framer-motion";

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  numColor?: string;
  sparkData?: number[];
  sparkColor?: string;
  isNew?: boolean;
  compareLabel?: string;
  onClick?: () => void;
  className?: string;
}

const KPICard = ({
  label, value, sub, icon, iconBg, iconColor, numColor = "text-foreground",
  sparkData, sparkColor = "hsl(var(--primary))", isNew, compareLabel, onClick, className = "",
}: KPICardProps) => {
  return (
    <Card
      className={`border-border/60 overflow-hidden transition-all duration-200 bg-card ${onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""} ${className}`}
      onClick={onClick}
    >
      <CardContent className={`pt-4 px-4 ${sparkData ? "pb-0" : "pb-4"}`}>
        {/* Top row: label + icon */}
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground leading-none">{label}</p>
          {icon && (
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconBg ?? "bg-primary/10"}`}>
              <span className={iconColor ?? "text-primary"}>{icon}</span>
            </div>
          )}
        </div>

        {/* Big number */}
        <p className={`text-3xl font-extrabold tracking-tight leading-none mb-1 ${numColor}`}>
          {value}
        </p>

        {/* Sub text + trend */}
        <div className="flex items-center gap-2 mb-2">
          {compareLabel && (
            <span className="text-[11px] text-muted-foreground">{compareLabel}</span>
          )}
          {sub && !compareLabel && (
            <span className="text-[11px] text-muted-foreground">{sub}</span>
          )}
          {isNew && (
            <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground leading-none">
              Novo
            </span>
          )}
        </div>
      </CardContent>

      {/* Sparkline flush at bottom */}
      {sparkData && (
        <div className="-mb-px">
          <Sparkline data={sparkData} color={sparkColor} height={48} showTooltip />
        </div>
      )}
    </Card>
  );
};

export default KPICard;
