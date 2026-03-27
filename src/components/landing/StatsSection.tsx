import { forwardRef, useEffect, useState } from "react";
import { Clock, Stethoscope, Star, ShieldCheck } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";

const fallbackStats = [
  { icon: Clock, value: "24h", label: "Disponibilidade" },
  { icon: Stethoscope, value: "+30", label: "Especialidades" },
  { icon: Star, value: "4.9★", label: "Avaliação" },
  { icon: ShieldCheck, value: "100%", label: "Digital e seguro" },
];

const StatsSection = forwardRef<HTMLElement>((_, ref) => {
  const [stats, setStats] = useState(fallbackStats);

  useEffect(() => {
    (async () => {
      try {
        const [specialtiesRes] = await Promise.all([
          supabase.from("specialties").select("id", { count: "exact", head: true }),
        ]);
        const specialties = specialtiesRes.count ?? 0;
        if (specialties > 5) {
          setStats((prev) =>
            prev.map((s, i) =>
              i === 1 ? { ...s, value: `+${specialties}` } : s
            )
          );
        }
      } catch { /* keep fallback */ }
    })();
  }, []);

  return (
    <section ref={ref} className="py-6 md:py-10 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="group flex items-center gap-3.5 rounded-2xl bg-card border border-border/30 px-5 py-4 sm:py-5 hover:shadow-md hover:border-primary/15 transition-all duration-200 cursor-default"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <stat.icon className="w-5 h-5 text-primary" weight="fill" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground leading-none tabular-nums">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground font-medium truncate">
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
