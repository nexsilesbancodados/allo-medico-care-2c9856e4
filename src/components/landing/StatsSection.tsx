import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Users, Stethoscope, Star, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AnimatedCounter = ({ value, suffix, decimals = 0 }: { value: number; suffix: string; decimals?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
};

const fallbackStats = [
  { icon: Users, value: 12500, suffix: "+", label: "Pacientes atendidos", growth: "+23%", gradient: "from-primary to-secondary" },
  { icon: Stethoscope, value: 200, suffix: "+", label: "Médicos especialistas", growth: "+15%", gradient: "from-secondary to-primary" },
  { icon: Star, value: 4.9, suffix: "", label: "Nota média", decimals: 1, growth: "Estável", gradient: "from-warning to-orange-400" },
  { icon: Clock, value: 15, suffix: "min", label: "Tempo médio de espera", growth: "-30%", gradient: "from-success to-emerald-400" },
];

const StatsSection = () => {
  const [stats, setStats] = useState(fallbackStats);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patientsRes, specialtiesRes, appointmentsRes, npsRes] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("specialties").select("id", { count: "exact", head: true }),
          supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "completed"),
          supabase.from("satisfaction_surveys").select("nps_score"),
        ]);

        const patients = patientsRes.count ?? 0;
        const specialties = specialtiesRes.count ?? 0;
        const appointments = appointmentsRes.count ?? 0;
        const npsScores = npsRes.data ?? [];
        const avgNps = npsScores.length > 0
          ? npsScores.reduce((sum, s) => sum + s.nps_score, 0) / npsScores.length
          : 0;

        if (patients > 10 || appointments > 5) {
          setStats([
            { icon: Users, value: patients, suffix: "+", label: "Pacientes atendidos", growth: "+23%", gradient: "from-primary to-secondary" },
            { icon: Stethoscope, value: specialties, suffix: "+", label: "Especialidades", growth: "+15%", gradient: "from-secondary to-primary" },
            { icon: Star, value: avgNps > 0 ? Math.round(avgNps * 10) / 10 : 4.9, suffix: "", label: "Nota média", decimals: 1, growth: "Estável", gradient: "from-warning to-orange-400" },
            { icon: Clock, value: appointments, suffix: "+", label: "Consultas realizadas", growth: "+40%", gradient: "from-success to-emerald-400" },
          ]);
        }
      } catch {
        // Keep fallback stats
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="py-8 md:py-16 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 15 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative group rounded-2xl bg-card border border-border/50 p-4 sm:p-5 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/[0.08] hover:border-primary/20"
            >
              {/* Gradient accent line at top */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

              <div className="relative z-10 flex flex-col gap-3">
                {/* Icon with gradient bg */}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>

                {/* Value */}
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-none">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} decimals={(stat as any).decimals} />
                  </p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-medium">{stat.label}</p>
                </div>

                {/* Growth badge */}
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.4 }}
                  className={`inline-flex items-center gap-1 text-[10px] font-bold w-fit px-2 py-0.5 rounded-full ${
                    stat.growth.startsWith("-")
                      ? "text-primary bg-primary/10"
                      : stat.growth === "Estável"
                      ? "text-warning bg-warning/10"
                      : "text-success bg-success/10"
                  }`}
                >
                  <TrendingUp className="w-2.5 h-2.5" />
                  {stat.growth}
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
