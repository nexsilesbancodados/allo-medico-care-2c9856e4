import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type NavIconColor = "blue" | "green" | "amber" | "rose" | "purple" | "cyan" | "emerald" | "orange" | "slate";

const colorMap: Record<NavIconColor, { bg: string; text: string; glow: string }> = {
  blue:    { bg: "bg-primary/12",      text: "text-primary",       glow: "shadow-primary/10" },
  green:   { bg: "bg-success/12",      text: "text-success",       glow: "shadow-success/10" },
  amber:   { bg: "bg-warning/12",      text: "text-warning",       glow: "shadow-warning/10" },
  rose:    { bg: "bg-destructive/12",   text: "text-destructive",   glow: "shadow-destructive/10" },
  purple:  { bg: "bg-[hsl(270_60%_55%/0.12)]", text: "text-[hsl(270_60%_55%)]", glow: "shadow-[hsl(270_60%_55%/0.1)]" },
  cyan:    { bg: "bg-[hsl(195_80%_50%/0.12)]", text: "text-[hsl(195_80%_50%)]", glow: "shadow-[hsl(195_80%_50%/0.1)]" },
  emerald: { bg: "bg-secondary/12",    text: "text-secondary",     glow: "shadow-secondary/10" },
  orange:  { bg: "bg-[hsl(25_95%_55%/0.12)]",  text: "text-[hsl(25_95%_55%)]",  glow: "shadow-[hsl(25_95%_55%/0.1)]" },
  slate:   { bg: "bg-muted",           text: "text-muted-foreground", glow: "" },
};

interface NavIconProps {
  icon: ReactNode;
  color?: NavIconColor;
  active?: boolean;
  className?: string;
}

export const NavIcon = ({ icon, color = "blue", active, className }: NavIconProps) => {
  const c = colorMap[color];
  return (
    <span
      className={cn(
        "nav-icon-wrapper inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-all duration-200",
        active
          ? "bg-background/20 text-background shadow-sm"
          : `${c.bg} ${c.text} shadow-sm ${c.glow}`,
        className
      )}
    >
      {icon}
    </span>
  );
};

export type { NavIconColor };
export default NavIcon;
