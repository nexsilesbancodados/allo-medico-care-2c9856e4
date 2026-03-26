import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface Shortcut {
  label: string;
  icon: ReactNode;
  path: string;
  iconBg: string;
  iconColor: string;
  badge?: string | number;
  badgeColor?: string;
  description?: string;
}

interface DashboardShortcutsProps {
  shortcuts: Shortcut[];
  title?: string;
}

export function DashboardShortcuts({ shortcuts, title = "Acesso Rápido" }: DashboardShortcutsProps) {
  const navigate = useNavigate();
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.04 } },
  };
  const item = {
    hidden: { opacity: 0, x: -8 },
    show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  } as const;

  return (
    <section className="overflow-hidden rounded-2xl border border-border/30 bg-card" style={{ boxShadow: "0 2px 14px rgba(0,0,0,.04)" }}>
      <div className="border-b border-border/10 px-4 py-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{title}</h2>
      </div>
      <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border/10">
        {shortcuts.map((s) => (
          <motion.button
            key={s.label}
            variants={item}
            onClick={() => navigate(s.path)}
            className="group flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-muted/30 active:bg-muted/50"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.iconBg} transition-transform duration-200 group-hover:scale-110`}>
              <span className={s.iconColor}>{s.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-foreground">{s.label}</span>
              {s.description && (
                <span className="block text-[11px] text-muted-foreground/60">{s.description}</span>
              )}
            </div>
            {s.badge !== undefined && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.badgeColor ?? "bg-primary/10 text-primary"}`}>
                {s.badge}
              </span>
            )}
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/25 transition-transform duration-200 group-hover:translate-x-0.5" />
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}
