import { forwardRef, useEffect, useState, useRef } from "react";
import { Clock, Stethoscope, Star, ShieldCheck } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";

const fallbackStats = [
  { icon: Clock, value: "24h", label: "Disponibilidade" },
  { icon: Stethoscope, value: "+30", label: "Especialidades" },
  { icon: Star, value: "4.9★", label: "Avaliação" },
  { icon: ShieldCheck, value: "100%", label: "Digital e seguro" },
];

const AnimatedCounter = ({ value, suffix = "" }: { value: string; suffix?: string }) => {
  const numMatch = value.match(/[\d.]+/);
  const prefix = value.replace(/[\d.]+.*/, "");
  const num = numMatch ? parseFloat(numMatch[0]) : 0;
  const rest = numMatch ? value.slice((prefix + numMatch[0]).length) : "";
  const [display, setDisplay] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!numMatch || hasAnimated || !ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHasAnimated(true);
        observer.disconnect();
        const duration = 1200;
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(eased * num * 10) / 10);
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasAnimated, num]);

  return (
    <p ref={ref} className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground leading-none tabular-nums">
      {prefix}{Number.isInteger(num) ? Math.round(display) : display.toFixed(1)}{rest}{suffix}
    </p>
  );
};

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
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="group flex items-center gap-3.5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/30 px-5 py-4 sm:py-5 hover:shadow-md hover:border-primary/15 hover:-translate-y-0.5 transition-all duration-200 cursor-default"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors duration-200">
                <stat.icon className="w-5 h-5 text-primary" weight="fill" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <AnimatedCounter value={stat.value} />
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
