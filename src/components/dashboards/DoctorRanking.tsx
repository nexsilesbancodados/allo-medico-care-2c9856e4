import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RankDoctor {
  id: string;
  name: string;
  initials: string;
  consultations: number;
  revenue: number;
  pct: number;
  avatarBg: string;
  avatarColor: string;
}

const medals = [
  "linear-gradient(135deg,#F59E0B,#D97706)",
  "linear-gradient(135deg,#94A3B8,#64748B)",
  "linear-gradient(135deg,#CD7F32,#A0522D)",
];

export function DoctorRanking({ doctors, onSeeAll }: { doctors: RankDoctor[]; onSeeAll?: () => void }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">Ranking de médicos</p>
        {onSeeAll && <button onClick={onSeeAll} className="text-[11px] font-semibold text-primary hover:opacity-80">Ver relatório →</button>}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/25 bg-card" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
        {doctors.slice(0, 5).map((doc, i) => (
          <motion.div key={doc.id}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, ease: "easeOut" }}
            className={cn("flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/20", i < doctors.length - 1 && "border-b border-border/15")}
          >
            {/* Medal */}
            {i < 3 ? (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white" style={{ background: medals[i] }}>
                {i + 1}
              </div>
            ) : (
              <span className="w-6 text-center text-[11px] font-semibold text-muted-foreground/50">{i + 1}</span>
            )}
            {/* Avatar */}
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", doc.avatarBg, doc.avatarColor)}>
              {doc.initials}
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-foreground">{doc.name}</p>
              <p className="text-[10px] text-muted-foreground">{doc.consultations} consultas · R${(doc.revenue / 1000).toFixed(1)}k</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${doc.pct}%` }}
                  transition={{ delay: i * 0.08 + 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-primary/70"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
