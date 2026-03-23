import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface ScheduleItem {
  id: string;
  time: string;
  patientName: string;
  doctorName: string;
  specialty?: string;
  status: "live" | "waiting" | "scheduled" | "completed" | "no_show" | "cancelled";
}

const statusMap = {
  live:      { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", timeBg: "bg-emerald-100 dark:bg-emerald-900/40", timeText: "text-emerald-700 dark:text-emerald-300", tag: "Na Sala", tagBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" },
  waiting:   { bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-400", timeBg: "bg-amber-100 dark:bg-amber-900/40", timeText: "text-amber-700 dark:text-amber-300", tag: "Na Fila", tagBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400" },
  scheduled: { bg: "bg-blue-50/50 dark:bg-blue-950/10", text: "text-blue-600 dark:text-blue-400", timeBg: "bg-blue-100 dark:bg-blue-900/40", timeText: "text-blue-700 dark:text-blue-300", tag: "Agendado", tagBg: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400" },
  completed: { bg: "bg-muted/20", text: "text-muted-foreground", timeBg: "bg-muted/50", timeText: "text-muted-foreground", tag: "Concluído", tagBg: "bg-muted text-muted-foreground" },
  no_show:   { bg: "bg-red-50/50 dark:bg-red-950/10", text: "text-red-500", timeBg: "bg-red-100 dark:bg-red-900/40", timeText: "text-red-600 dark:text-red-400", tag: "Faltou", tagBg: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400" },
  cancelled: { bg: "bg-muted/20", text: "text-muted-foreground/60", timeBg: "bg-muted/40", timeText: "text-muted-foreground/60", tag: "Cancelado", tagBg: "bg-muted/50 text-muted-foreground/70" },
};

export function TimelineSchedule({ items, onSeeAll }: { items: ScheduleItem[]; onSeeAll?: () => void }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">Agenda por horário</p>
        {onSeeAll && <button onClick={onSeeAll} className="text-[11px] font-semibold text-primary hover:opacity-80">Ver completa →</button>}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/25 bg-card" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
        {items.map((item, i) => {
          const s = statusMap[item.status] ?? statusMap.scheduled;
          return (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, ease: "easeOut" }}
              className={cn("flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/10", i < items.length - 1 && "border-b border-border/15", s.bg)}
            >
              {/* Time block */}
              <div className={cn("flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl", s.timeBg)}>
                <span className={cn("text-[15px] font-black leading-none", s.timeText)}>{item.time.split(":")[0]}</span>
                <span className={cn("text-[8px] font-bold", s.timeText)}>:{item.time.split(":")[1]}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-foreground">{item.patientName}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{item.doctorName}{item.specialty ? ` · ${item.specialty}` : ""}</p>
              </div>
              <span className={cn("shrink-0 rounded-lg px-2 py-0.5 text-[9px] font-bold", s.tagBg)}>{s.tag}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
