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
  { icon: Users, value: 12500, suffix: "+", label: "Pacientes atendidos" },
  { icon: Stethoscope, value: 200, suffix: "+", label: "Médicos especialistas" },
  { icon: Star, value: 4.9, suffix: "", label: "Nota média", decimals: 1 },
  { icon: Clock, value: 15, suffix: "min", label: "Tempo médio de espera" },
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

        // Only update if we have meaningful data, otherwise keep fallbacks
        if (patients > 10 || appointments > 5) {
          setStats([
            { icon: Users, value: patients, suffix: "+", label: "Pacientes atendidos" },
            { icon: Stethoscope, value: specialties, suffix: "+", label: "Especialidades" },
            { icon: Star, value: avgNps > 0 ? Math.round(avgNps * 10) / 10 : 4.9, suffix: "", label: "Nota média", decimals: 1 },
            { icon: Clock, value: appointments, suffix: "+", label: "Consultas realizadas" },
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
      <div className="absolute inset-0 bg-gradient-hero opacity-[0.03]" />
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5, type: "spring", stiffness: 100 }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="text-center group cursor-default"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary/10 group-hover:scale-110">
                <stat.icon className="w-7 h-7 text-primary transition-transform duration-300 group-hover:scale-110" />
              </div>
              <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground mb-1">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} decimals={(stat as any).decimals} />
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
