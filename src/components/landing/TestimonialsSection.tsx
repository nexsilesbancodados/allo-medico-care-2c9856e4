import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import avatarMaria from "@/assets/avatar-maria.png";
import avatarCarlos from "@/assets/avatar-carlos.png";
import avatarAna from "@/assets/avatar-ana.png";

const fallbackTestimonials = [
  { name: "Maria Silva", role: "Paciente", text: "Consegui uma consulta com cardiologista em menos de 1 hora. A receita chegou digital na hora. Incrível!", rating: 5, avatar: avatarMaria },
  { name: "Dr. Carlos Mendes", role: "Clínico Geral", text: "A plataforma facilitou muito meu dia a dia. Atendo de casa com a mesma qualidade do consultório.", rating: 5, avatar: avatarCarlos },
  { name: "Ana Costa", role: "Paciente", text: "Com o plano mensal, cuido da saúde de toda minha família sem sair de casa. Vale cada centavo.", rating: 5, avatar: avatarAna },
];

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const goTo = useCallback((idx: number) => {
    setDirection(idx > activeIndex ? 1 : -1);
    setActiveIndex(idx);
  }, [activeIndex]);

  const next = useCallback(() => {
    setDirection(1);
    setActiveIndex(prev => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setActiveIndex(prev => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  useEffect(() => {
    const fetchRealTestimonials = async () => {
      try {
        const { data } = await supabase
          .from("satisfaction_surveys")
          .select("nps_score, comment, patient_id, doctor_id, created_at")
          .not("comment", "is", null)
          .gte("nps_score", 8)
          .order("created_at", { ascending: false })
          .limit(3);

        if (!data || data.length < 2) return;

        const patientIds = [...new Set(data.map(d => d.patient_id))];
        const doctorIds = [...new Set(data.map(d => d.doctor_id))];

        const [pRes, dRes] = await Promise.all([
          supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", patientIds),
          supabase.from("doctor_profiles").select("id, user_id").in("id", doctorIds),
        ]);

        const patientMap = new Map(pRes.data?.map(p => [p.user_id, `${p.first_name} ${p.last_name?.charAt(0) || ""}.`]) ?? []);

        let doctorNameMap = new Map<string, string>();
        if (dRes.data && dRes.data.length > 0) {
          const docUserIds = dRes.data.map(d => d.user_id);
          const { data: docProfiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", docUserIds);
          dRes.data.forEach(d => {
            const p = docProfiles?.find(pr => pr.user_id === d.user_id);
            if (p) doctorNameMap.set(d.id, `Dr(a). ${p.first_name}`);
          });
        }

        const avatars = [avatarMaria, avatarCarlos, avatarAna];
        const realTestimonials = data.map((item, i) => ({
          name: patientMap.get(item.patient_id) || "Paciente",
          role: `Paciente · ${doctorNameMap.get(item.doctor_id) || "Consulta"}`,
          text: item.comment!,
          rating: Math.min(5, Math.round(item.nps_score / 2)),
          avatar: avatars[i % avatars.length],
        }));

        setTestimonials(realTestimonials);
      } catch {
        // Keep fallbacks
      }
    };
    fetchRealTestimonials();
  }, []);

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <section id="depoimentos" className="py-12 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3">
            O que dizem sobre a{" "}
            <span className="text-gradient">AloClinica</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Milhares de pacientes e médicos já confiam na nossa plataforma.
          </p>
        </motion.div>

        {/* Desktop: grid / Mobile: carousel */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, rotateX: 5 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6, type: "spring", stiffness: 80 }}
              whileHover={{
                y: -8,
                boxShadow: "0 20px 40px -12px hsl(210 90% 45% / 0.15)",
                transition: { duration: 0.25 },
              }}
              className="bg-card rounded-2xl p-6 border border-border shadow-card transition-colors duration-300 hover:border-primary/30 cursor-default"
            >
              <Quote className="w-8 h-8 text-primary/30 mb-4" />
              <p className="text-foreground mb-6 leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-medical-green text-medical-green" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/10" loading="lazy" />
                <div>
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile carousel */}
        <div className="md:hidden relative max-w-md mx-auto">
          <div className="overflow-hidden rounded-2xl">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="bg-card rounded-2xl p-6 border border-border shadow-card"
              >
                <Quote className="w-7 h-7 text-primary/30 mb-3" />
                <p className="text-foreground mb-5 leading-relaxed text-sm">"{testimonials[activeIndex].text}"</p>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: testimonials[activeIndex].rating }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-medical-green text-medical-green" />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <img src={testimonials[activeIndex].avatar} alt={testimonials[activeIndex].name} className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/10" loading="lazy" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{testimonials[activeIndex].name}</p>
                    <p className="text-xs text-muted-foreground">{testimonials[activeIndex].role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-5">
            <button onClick={prev} className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors active:scale-95">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <div className="flex gap-1.5">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/20"}`}
                />
              ))}
            </div>
            <button onClick={next} className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors active:scale-95">
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
