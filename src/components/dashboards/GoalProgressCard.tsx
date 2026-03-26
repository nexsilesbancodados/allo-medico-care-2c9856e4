import { motion } from "framer-motion";
import { CheckCircle2, Video, Clock } from "lucide-react";
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
    <div className="rounded-2xl border border-border/30 bg-card p-4" style={{ boxShadow: "0 2px 14px rgba(0,0,0,.04)" }}>
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
          <p className="text-[9px] text-muted-foreground/60 mt-0.5">concluídas</p>
        </div>
      </div>
      {/* Barra mais alta com label de pct */}
      <div className="mt-3.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground">Progresso</span>
          <span className={cn("text-[11px] font-black", pct >= 100 ? "text-emerald-600" : "text-foreground")}>{pct}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn("h-full rounded-full", pct >= 100 ? "bg-emerald-500" : accentColor)}
          />
        </div>
      </div>
      {/* Stats row com pill de fundo */}
      <div className="mt-3 flex gap-3 flex-wrap">
        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />{done} ok
        </span>
        {inProgress > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            <Video className="h-3 w-3" />{inProgress} andamento
          </span>
        )}
        {waiting > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            <Clock className="h-3 w-3" />{waiting} fila
          </span>
        )}
        {pct >= 100 && <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">🎉 Meta!</span>}
      </div>
    </div>
  );
}
