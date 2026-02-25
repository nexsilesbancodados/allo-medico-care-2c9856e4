import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Users, Stethoscope, Star, Clock, TrendingUp, Activity } from "lucide-react";
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
  { icon: Users, value: 12500, suffix: "+", label: "Pacientes atendidos", growth: "+23%", color: "from-primary to-primary/70" },
  { icon: Stethoscope, value: 200, suffix: "+", label: "Médicos especialistas", growth: "+15%", color: "from-secondary to-secondary/70" },
  { icon: Star, value: 4.9, suffix: "", label: "Nota média", decimals: 1, growth: "Estável", color: "from-accent to-accent/70" },
  { icon: Clock, value: 15, suffix: "min", label: "Tempo médio de espera", growth: "-30%", color: "from-medical-green to-medical-green/70" },
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
            { icon: Users, value: patients, suffix: "+", label: "Pacientes atendidos", growth: "+23%", color: "from-primary to-primary/70" },
            { icon: Stethoscope, value: specialties, suffix: "+", label: "Especialidades", growth: "+15%", color: "from-secondary to-secondary/70" },
            { icon: Star, value: avgNps > 0 ? Math.round(avgNps * 10) / 10 : 4.9, suffix: "", label: "Nota média", decimals: 1, growth: "Estável", color: "from-accent to-accent/70" },
            { icon: Clock, value: appointments, suffix: "+", label: "Consultas realizadas", growth: "+40%", color: "from-medical-green to-medical-green/70" },
          ]);
        }
      } catch {
        // Keep fallback stats
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="py-10 md:py-20 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 15 }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="relative group rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-5 sm:p-6 overflow-hidden transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/[0.06]"
            >
              {/* Subtle diagonal gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-secondary/[0.03] pointer-events-none rounded-2xl" />

              <div className="relative z-10 flex flex-col items-start gap-4">
                {/* Icon pill */}
                <div className="w-12 h-12 rounded-xl bg-muted/70 flex items-center justify-center transition-colors duration-300 group-hover:bg-primary/10">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>

                {/* Value */}
                <div>
                  <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-none">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} decimals={(stat as any).decimals} />
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>

                {/* Growth + Sparkline row */}
                <div className="flex items-center justify-between w-full">
                  <motion.span
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.4 }}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                      stat.growth.startsWith("-") ? "text-primary" : "text-medical-green"
                    }`}
                  >
                    <TrendingUp className="w-3 h-3" />
                    {stat.growth}
                  </motion.span>

                  {/* Mini bar chart */}
                  <div className="flex items-end gap-[2px] h-5">
                    {[3, 5, 4, 7, 5, 8, 6, 9, 8, 10].map((h, j) => (
                      <motion.div
                        key={j}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h * 10}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 + j * 0.025 + 0.5, duration: 0.25 }}
                        className={`w-[3px] rounded-full ${j >= 8 ? "bg-primary" : "bg-primary/25"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
