import { forwardRef, useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { Users, Stethoscope, Star, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── GSAP counter (much smoother than setInterval) ─────────────────────────
const GsapCounter = ({ target, suffix, decimals = 0 }: { target: number; suffix: string; decimals?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(wrapRef, { once: true });
  const animRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!isInView || !ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ref.current.textContent = decimals > 0 ? target.toFixed(decimals) : target.toLocaleString("pt-BR");
      return;
    }
    const obj = { val: 0 };
    animRef.current = gsap.to(obj, {
      val: target, duration: 1.8, ease: "power2.out",
      onUpdate: () => {
        if (ref.current)
          ref.current.textContent = decimals > 0
            ? obj.val.toFixed(decimals)
            : Math.round(obj.val).toLocaleString("pt-BR");
      },
    });
    return () => { animRef.current?.kill(); };
  }, [isInView, target, decimals]);

  return (
    <span ref={wrapRef}>
      <span ref={ref}>0</span>{suffix}
    </span>
  );
};

// ─── Data ───────────────────────────────────────────────────────────────────
const fallbackStats = [
  { icon: Users,        target: 12500, suffix: "+",   label: "Pacientes atendidos", gradient: "from-blue-500 to-cyan-500",    delay: 0 },
  { icon: Stethoscope,  target: 200,   suffix: "+",   label: "Médicos especialistas", gradient: "from-emerald-500 to-teal-500", delay: 0.08 },
  { icon: Star,         target: 4.9,   suffix: "",    label: "Nota média", decimals: 1, gradient: "from-amber-500 to-orange-500", delay: 0.16 },
  { icon: Clock,        target: 15,    suffix: "min", label: "Espera média", gradient: "from-green-500 to-emerald-500", delay: 0.24 },
];

const StatsSection = forwardRef<HTMLElement>((_, ref) => {
  const [stats, setStats] = useState(fallbackStats);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cards = el.querySelectorAll(".stat-card");
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el, start: "top 82%", once: true,
        onEnter: () =>
          gsap.fromTo(cards,
            { opacity: 0, y: 24, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, stagger: 0.08, duration: 0.55, ease: "power3.out", clearProps: "transform,opacity" }
          ),
      });
    }, el);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    (async () => {
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
        const scores = npsRes.data ?? [];
        const avgNps = scores.length > 0 ? scores.reduce((s, x) => s + x.nps_score, 0) / scores.length : 4.9;

        if (patients > 10 || appointments > 5) {
          setStats([
            { icon: Users,       target: patients,    suffix: "+",   label: "Pacientes atendidos",  gradient: "from-blue-500 to-cyan-500",    delay: 0 },
            { icon: Stethoscope, target: specialties, suffix: "+",   label: "Especialidades",        gradient: "from-emerald-500 to-teal-500", delay: 0.08 },
            { icon: Star,        target: Math.round(avgNps * 10) / 10, suffix: "", label: "Nota média", decimals: 1, gradient: "from-amber-500 to-orange-500", delay: 0.16 },
            { icon: Clock,       target: appointments,suffix: "+",   label: "Consultas realizadas",  gradient: "from-green-500 to-emerald-500",delay: 0.24 },
          ]);
        }
      } catch { /* keep fallback */ }
    })();
  }, []);

  return (
    <section ref={ref} className="py-10 md:py-16 relative">
      <div className="container mx-auto px-4">
        <div ref={sectionRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="card-interactive stat-card relative group rounded-2xl bg-card border border-border/40 p-5 sm:p-6 hover:-translate-y-1 hover:border-primary/20 hover:shadow-primary/5 cursor-default">
              {/* Top-left gradient orb */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${stat.gradient} opacity-[0.06] blur-2xl pointer-events-none group-hover:opacity-[0.10] transition-opacity`} />

              <div className="flex flex-col gap-3 relative">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md shadow-black/10`}>
                  <stat.icon className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-none tabular-nums">
                    <GsapCounter target={stat.target} suffix={stat.suffix} decimals={(stat as {decimals?: number}).decimals} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium">{stat.label}</p>
                </div>
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
