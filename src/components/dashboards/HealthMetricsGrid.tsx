import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Metric {
  type: string;
  value: number;
  unit: string;
}

const CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  pressao_arterial: { icon: "🫀", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20", label: "Pressão" },
  peso: { icon: "⚖️", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20", label: "Peso" },
  glicemia: { icon: "🩸", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20", label: "Glicemia" },
  frequencia_cardiaca: { icon: "💓", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20", label: "Freq. Card." },
  temperatura: { icon: "🌡️", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20", label: "Temperatura" },
  saturacao: { icon: "🫁", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/20", label: "SpO₂" },
};

export function HealthMetricsGrid({ metrics }: { metrics: Metric[] }) {
  const navigate = useNavigate();
  if (!metrics.length) return null;

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {metrics.slice(0, 6).map((m, i) => {
        const cfg = CONFIG[m.type] ?? { icon: "📊", color: "text-muted-foreground", bg: "bg-muted/40", label: m.type };
        return (
          <motion.button key={m.type}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 250, damping: 20 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard/patient/health?role=patient")}
            className={`flex flex-col items-center rounded-2xl border border-border/20 p-3 text-center transition-all duration-200 hover:border-border/50 hover:shadow-md ${cfg.bg}`}
          >
            <span className="text-[20px]">{cfg.icon}</span>
            <p className={`mt-1.5 text-[14px] font-black leading-none tracking-tight ${cfg.color}`}>{m.value}<span className="text-[9px] font-normal text-muted-foreground/60 ml-0.5">{m.unit}</span></p>
            <p className="mt-0.5 text-[9px] font-medium text-muted-foreground/70">{cfg.label}</p>
          </motion.button>
        );
      })}
    </div>
  );
}
