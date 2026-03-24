import { forwardRef, useEffect, useState } from "react";
import { Users, Stethoscope, Star, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import mascotThumbsup from "@/assets/mascot-thumbsup.png";
import mascotWave from "@/assets/mascot-wave.png";
import mascotWelcome from "@/assets/mascot-welcome.png";
import mascotReading from "@/assets/mascot-reading.png";

const formatStatValue = (target: number, suffix: string, decimals = 0) => {
  const value = decimals > 0 ? target.toFixed(decimals) : target.toLocaleString("pt-BR");
  return `${value}${suffix}`;
};

const iconStyles = [
  { bg: "bg-primary/90", glow: "shadow-primary/30" },
  { bg: "bg-secondary/90", glow: "shadow-secondary/30" },
  { bg: "bg-warning", glow: "shadow-warning/30" },
  { bg: "bg-success", glow: "shadow-success/30" },
];

const fallbackStats = [
  { icon: Users, target: 12500, suffix: "+", label: "Pacientes atendidos", decimals: 0, mascot: mascotWave },
  { icon: Stethoscope, target: 200, suffix: "+", label: "Médicos especialistas", decimals: 0, mascot: mascotReading },
  { icon: Star, target: 4.9, suffix: "", label: "Nota média", decimals: 1, mascot: mascotThumbsup },
  { icon: Clock, target: 15, suffix: "min", label: "Espera média", decimals: 0, mascot: mascotWelcome },
];

const StatsSection = forwardRef<HTMLElement>((_, ref) => {
  const [stats, setStats] = useState(fallbackStats);

  useEffect(() => {
    (async () => {
      try {
        const [patientsRes, specialtiesRes, appointmentsRes] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("specialties").select("id", { count: "exact", head: true }),
          supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "completed"),
        ]);
        const patients = patientsRes.count ?? 0;
        const specialties = specialtiesRes.count ?? 0;
        const appointments = appointmentsRes.count ?? 0;

        if (patients > 10 || appointments > 5) {
          setStats([
            { icon: Users, target: patients, suffix: "+", label: "Pacientes atendidos", decimals: 0, mascot: mascotWave },
            { icon: Stethoscope, target: specialties, suffix: "+", label: "Especialidades", decimals: 0, mascot: mascotReading },
            { icon: Star, target: 4.9, suffix: "", label: "Nota média", decimals: 1, mascot: mascotThumbsup },
            { icon: Clock, target: appointments, suffix: "+", label: "Consultas realizadas", decimals: 0, mascot: mascotWelcome },
          ]);
        }
      } catch { /* keep fallback */ }
    })();
  }, []);

  return (
    <section ref={ref} className="py-12 md:py-20 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="stat-card group relative rounded-2xl bg-card border border-border/40 p-5 sm:p-6 overflow-hidden hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.04] transition-colors duration-200 cursor-default"
            >
              {/* Mascot watermark */}
              <img
                src={stat.mascot}
                alt=""
                aria-hidden="true"
                className="absolute -bottom-2 -right-2 w-20 h-20 sm:w-24 sm:h-24 object-contain opacity-[0.07] group-hover:opacity-[0.12] group-hover:rotate-6 transition-all duration-500 pointer-events-none select-none"
              />

              <div className="relative flex flex-col gap-3">
                {/* Icon with glow */}
                <div className={`w-10 h-10 rounded-xl ${iconStyles[i].bg} flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:${iconStyles[i].glow} group-hover:scale-110 transition-all duration-300`}>
                  <stat.icon className="w-[18px] h-[18px] text-white" aria-hidden="true" />
                </div>

                {/* Number */}
                <p className="text-2xl sm:text-3xl lg:text-[2rem] font-extrabold tracking-tight text-foreground leading-none tabular-nums">
                  {formatStatValue(stat.target, stat.suffix, stat.decimals)}
                </p>

                {/* Label */}
                <p className="text-xs sm:text-[13px] text-muted-foreground font-medium leading-snug">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

StatsSection.displayName = "StatsSection";
export default StatsSection;
