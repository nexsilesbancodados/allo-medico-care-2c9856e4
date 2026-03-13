import { forwardRef } from "react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Users, Stethoscope, Star, Clock } from "lucide-react";
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
  { icon: Users, value: 12500, suffix: "+", label: "Pacientes atendidos", gradient: "from-primary to-primary/70" },
  { icon: Stethoscope, value: 200, suffix: "+", label: "Médicos especialistas", gradient: "from-secondary to-secondary/70" },
  { icon: Star, value: 4.9, suffix: "", label: "Nota média", decimals: 1, gradient: "from-warning to-warning/70" },
  { icon: Clock, value: 15, suffix: "min", label: "Tempo médio de espera", gradient: "from-success to-success/70" },
];

const StatsSection = forwardRef<HTMLElement>((_, ref) => {
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
            { icon: Users, value: patients, suffix: "+", label: "Pacientes atendidos", gradient: "from-primary to-primary/70" },
            { icon: Stethoscope, value: specialties, suffix: "+", label: "Especialidades", gradient: "from-secondary to-secondary/70" },
            { icon: Star, value: avgNps > 0 ? Math.round(avgNps * 10) / 10 : 4.9, suffix: "", label: "Nota média", decimals: 1, gradient: "from-warning to-warning/70" },
            { icon: Clock, value: appointments, suffix: "+", label: "Consultas realizadas", gradient: "from-success to-success/70" },
          ]);
        }
      } catch {
        // Keep fallback stats
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="py-10 md:py-16 relative">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative group rounded-2xl bg-card border border-border/50 p-5 sm:p-6 transition-all duration-300 hover:shadow-card hover:border-primary/15"
            >
              <div className="flex flex-col gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                  <stat.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-none">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} decimals={(stat as any).decimals} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium">{stat.label}</p>
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
