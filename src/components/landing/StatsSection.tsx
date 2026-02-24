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
    <section className="py-8 md:py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-[0.03]" />
      <div className="container mx-auto px-4">
        {/* Live indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <Activity className="w-4 h-4 text-medical-green" />
          <span className="text-xs font-semibold text-muted-foreground">Dados em tempo real</span>
          <span className="w-2 h-2 rounded-full bg-medical-green animate-pulse" />
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, type: "spring", stiffness: 200, damping: 15 }}
              whileHover={{ y: -8, scale: 1.04, boxShadow: "0 16px 40px -12px hsl(210 90% 45% / 0.12)" }}
              whileTap={{ scale: 0.98 }}
              className="relative text-center group cursor-default rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-card hover:shadow-elevated hover:border-primary/20 transition-all duration-300 overflow-hidden"
            >
              {/* Gradient glow behind */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500 rounded-2xl`} />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary/10">
                  <motion.div whileHover={{ rotate: 8, scale: 1.15 }} transition={{ type: "spring", stiffness: 300 }}>
                    <stat.icon className="w-7 h-7 text-primary" />
                  </motion.div>
                </div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground mb-1">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} decimals={(stat as any).decimals} />
                </p>
                <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>

                {/* Growth badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 + 0.4 }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-medical-green/10 text-medical-green text-[10px] font-semibold"
                >
                  <TrendingUp className="w-2.5 h-2.5" />
                  {stat.growth}
                </motion.div>

                {/* Mini sparkline visual */}
                <div className="flex items-end justify-center gap-0.5 mt-3 h-4">
                  {[3, 5, 4, 7, 6, 8, 7, 9, 8, 10].map((h, j) => (
                    <motion.div
                      key={j}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h * 10}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.12 + j * 0.03 + 0.5, duration: 0.3 }}
                      className={`w-1 rounded-full ${j >= 8 ? "bg-primary" : "bg-primary/20"}`}
                    />
                  ))}
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
