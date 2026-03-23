import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export interface PremiumAction {
  label: string;
  icon: string;
  path: string;
  gradient: string;
  shadow: string;
  badge?: number;
}

export function PremiumActionGrid({ actions, title }: { actions: PremiumAction[]; title?: string }) {
  const navigate = useNavigate();
  return (
    <div>
      {title && <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">{title}</p>}
      <div className="flex justify-around gap-2">
        {actions.map((a, i) => (
          <motion.button key={a.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 220, damping: 22 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(a.path)}
            className="group flex flex-col items-center gap-2"
          >
            <div className="relative">
              <div
                className={`flex h-[52px] w-[52px] items-center justify-center rounded-[16px] text-[22px] transition-transform duration-200 group-hover:scale-110 ${a.gradient}`}
                style={{ boxShadow: a.shadow }}
              >
                {a.icon}
              </div>
              {(a.badge ?? 0) > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-background">
                  {a.badge! > 9 ? "9+" : a.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground/80">{a.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
