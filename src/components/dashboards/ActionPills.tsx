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
      {title && <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground/55">{title}</p>}
      {/* Mobile: horizontal scroll / Desktop: wrap grid */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none md:flex-wrap md:overflow-visible md:pb-0">
        {actions.map((a, i) => (
          <motion.button
            key={a.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 24 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => navigate(a.path)}
            className="relative flex shrink-0 items-center gap-2.5 rounded-[24px] border border-border/30 bg-card px-3.5 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,.06)] transition-all duration-200 hover:shadow-[0_6px_18px_rgba(0,0,0,.1)] hover:border-border/60 hover:-translate-y-0.5 active:scale-95"
          >
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-[10px] text-[14px] flex-shrink-0", a.iconBg)}>
              {a.icon}
            </div>
            <span className="text-[12px] font-semibold text-foreground whitespace-nowrap">{a.label}</span>
            {(a.badge ?? 0) > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-red-500 px-1 text-[8.5px] font-black text-white ring-2 ring-background shadow-sm">
                {a.badge! > 9 ? "9+" : a.badge}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
