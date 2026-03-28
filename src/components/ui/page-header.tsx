import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  badge?: { text: string; variant?: "default" | "secondary" | "destructive" | "outline" };
  className?: string;
}

const PageHeader = ({ title, subtitle, icon, actions, breadcrumb, badge, className }: PageHeaderProps) => (
  <div className={cn("pb-5 mb-6 border-b border-border/40", className)}>
    {breadcrumb && breadcrumb.length > 0 && (
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
        {breadcrumb.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
            {item.href ? (
              <Link to={item.href} className="hover:text-foreground transition-colors">{item.label}</Link>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    )}

    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3.5 min-w-0">
        {icon && (
          <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">{title}</h1>
            {badge && (
              <Badge variant={badge.variant ?? "default"} className="text-[10px] px-2 py-0.5 rounded-md font-semibold">
                {badge.text}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  </div>
);

export { PageHeader };
export type { PageHeaderProps };
