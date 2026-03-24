import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface PillAction {
  label: string;
  icon: string;
  iconBg: string;
  path: string;
  badge?: number;
}

interface ActionPillsProps {
  actions: PillAction[];
  title?: string;
}

export function ActionPills({ actions, title }: ActionPillsProps) {
  const navigate = useNavigate();
  return (
    <div>
      {title && <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">{title}</p>}
      {/* Mobile: horizontal scroll / Desktop: wrap grid */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none md:flex-wrap md:overflow-visible md:pb-0">
        {actions.map((a, i) => (
          <motion.button
            key={a.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 240, damping: 22 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate(a.path)}
            className="relative flex shrink-0 items-center gap-2 rounded-[22px] border border-border/25 bg-card px-3 py-2 shadow-[0_1px_6px_rgba(0,0,0,.07)] transition-all duration-200 hover:shadow-md hover:border-border/50 active:scale-95"
          >
            <div className={cn("flex h-6 w-6 items-center justify-center rounded-[8px] text-sm flex-shrink-0", a.iconBg)}>
              {a.icon}
            </div>
            <span className="text-[11.5px] font-semibold text-foreground whitespace-nowrap">{a.label}</span>
            {(a.badge ?? 0) > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-black text-white ring-2 ring-background">
                {a.badge! > 9 ? "9+" : a.badge}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
