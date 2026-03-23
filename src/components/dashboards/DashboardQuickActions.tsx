import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface QuickAction {
  label: string;
  icon: ReactNode;
  path: string;
  gradient: string;
  badge?: number;
}

interface DashboardQuickActionsProps {
  actions: QuickAction[];
  title?: string;
}

export function DashboardQuickActions({ actions, title = "Ações Rápidas" }: DashboardQuickActionsProps) {
  const navigate = useNavigate();
  return (
    <section>
      <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
        {title}
      </h2>
      <div className="flex justify-around gap-2 px-1 sm:gap-4">
        {actions.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 20 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate(item.path)}
            className="group relative flex flex-col items-center gap-2"
          >
            <div
              className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg shadow-black/10 transition-transform duration-200 group-hover:scale-110 sm:h-16 sm:w-16`}
            >
              <span className="text-white">{item.icon}</span>
              {(item.badge ?? 0) > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[9px] font-black text-white ring-2 ring-background">
                  {item.badge! > 9 ? "9+" : item.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] font-semibold text-foreground/70">{item.label}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
