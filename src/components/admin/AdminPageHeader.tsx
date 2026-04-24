import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AdminPageHeaderProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Page title */
  title: string;
  /** Optional short description below title */
  description?: string;
  /** Optional eyebrow label (e.g. "Operação") */
  eyebrow?: string;
  /** Tailwind gradient classes for the icon tile (e.g. "from-emerald-500 to-teal-600") */
  accent?: string;
  /** Optional badge (count, status, etc.) */
  badge?: { label: string; tone?: "default" | "success" | "warning" | "danger" | "info" };
  /** Action buttons / filters area on the right */
  actions?: ReactNode;
  /** Children rendered below header (KPIs, filter row, etc.) */
  children?: ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<AdminPageHeaderProps["badge"]>["tone"] & string, string> = {
  default: "bg-muted text-muted-foreground border-border",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  danger: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
};

/**
 * Standardized header for admin sub-pages.
 * Provides icon tile, title, optional eyebrow/description/badge and right-aligned actions.
 */
export const AdminPageHeader = ({
  icon: Icon,
  title,
  description,
  eyebrow,
  accent = "from-primary to-blue-700",
  badge,
  actions,
  children,
  className,
}: AdminPageHeaderProps) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm",
        className
      )}
    >
      {/* Top accent line */}
      <div className={cn("h-[3px] bg-gradient-to-r", accent)} />

      {/* Subtle radial glow */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full opacity-[0.07] blur-3xl bg-gradient-to-br",
          accent
        )}
      />

      <div className="relative flex flex-col gap-4 p-4 md:p-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: identity */}
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md",
              accent
            )}
          >
            <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1">
                {eyebrow}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight leading-tight">
                {title}
              </h1>
              {badge && (
                <Badge
                  variant="outline"
                  className={cn("font-semibold text-[10.5px] h-5 px-1.5", TONE_CLASSES[badge.tone ?? "default"])}
                >
                  {badge.label}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-xs md:text-[13px] text-muted-foreground mt-0.5 leading-snug">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right: actions */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
            {actions}
          </div>
        )}
      </div>

      {children && (
        <div className="relative border-t border-border/40 p-4 md:p-5">
          {children}
        </div>
      )}
    </motion.header>
  );
};

export default AdminPageHeader;
