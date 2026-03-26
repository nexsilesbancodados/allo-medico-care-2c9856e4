import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GoalProgressCardProps {
  done: number;
  total: number;
  inProgress?: number;
  waiting?: number;
  accentColor?: string;
  accentBg?: string;
}

export function GoalProgressCard({ done, total, inProgress = 0, waiting = 0, accentColor = "bg-emerald-500", accentBg = "bg-emerald-50 dark:bg-emerald-900/20" }: GoalProgressCardProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="rounded-2xl border border-border/25 bg-card p-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl text-[17px]", accentBg)}>🎯</div>
          <div>
            <p className="text-[12.5px] font-bold text-foreground">Meta do Dia</p>
            <p className="text-[10px] text-muted-foreground/60">Progresso das consultas</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-black text-foreground tracking-tight leading-none">{done}<span className="text-[13px] font-normal text-muted-foreground">/{total}</span></p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className={cn("h-full rounded-full", pct >= 100 ? "bg-emerald-500" : accentColor)}
        />
      </div>
      <div className="mt-2.5 flex gap-4 text-[10px] text-muted-foreground">
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{done} concluídas</span>
        {inProgress > 0 && <span>{inProgress} andamento</span>}
        {waiting > 0 && <span>{waiting} fila</span>}
        {pct >= 100 && <span className="text-emerald-600 dark:text-emerald-400 font-bold">🎉 Meta!</span>}
      </div>
    </div>
  );
}
