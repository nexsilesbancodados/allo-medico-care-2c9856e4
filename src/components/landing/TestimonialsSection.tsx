import { motion, AnimatePresence } from "framer-motion";
import { Star, ShieldCheck, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import avatarMaria from "@/assets/avatar-maria.png";
import avatarCarlos from "@/assets/avatar-carlos.png";
import avatarAna from "@/assets/avatar-ana.png";

const allTestimonials = [
  { name: "Maria Silva", handle: "@maria.silva", text: "Consegui uma consulta com cardiologista em menos de 1 hora. A receita chegou digital na hora. Incrível! 💙", rating: 5, avatar: avatarMaria, verified: true, likes: 342, time: "2h" },
  { name: "Dr. Carlos Mendes", handle: "@dr.carlos", text: "A plataforma facilitou muito meu dia a dia. Atendo de casa com a mesma qualidade do consultório. Recomendo!", rating: 5, avatar: avatarCarlos, verified: true, likes: 518, time: "5h" },
  { name: "Ana Costa", handle: "@ana.costa", text: "Com o plano mensal, cuido da saúde de toda minha família sem sair de casa. Vale cada centavo! ❤️", rating: 5, avatar: avatarAna, verified: true, likes: 276, time: "8h" },
  { name: "Pedro Oliveira", handle: "@pedro.oliv", text: "Agendei uma consulta às 23h e fui atendido no dia seguinte às 7h. Praticidade absurda!", rating: 5, avatar: avatarCarlos, verified: true, likes: 189, time: "1d" },
  { name: "Juliana Santos", handle: "@ju.santos", text: "Minha mãe de 72 anos conseguiu usar sozinha. Interface super intuitiva e médicos muito atenciosos.", rating: 5, avatar: avatarMaria, verified: true, likes: 423, time: "1d" },
  { name: "Dr. Renata Lopes", handle: "@dra.renata", text: "Finalmente uma telemedicina que funciona de verdade. Prontuário completo, receita digital, tudo integrado.", rating: 5, avatar: avatarAna, verified: true, likes: 367, time: "2d" },
  { name: "Lucas Ferreira", handle: "@lucas.f", text: "Estava com dor forte e fui atendido em 15 minutos. O médico foi super atencioso. Nota 10! 🌟", rating: 5, avatar: avatarCarlos, verified: true, likes: 298, time: "2d" },
  { name: "Camila Rocha", handle: "@cami.rocha", text: "Uso com meus 3 filhos. O plano família é imbatível. Já economizei muito com deslocamento e tempo.", rating: 5, avatar: avatarMaria, verified: true, likes: 445, time: "3d" },
  { name: "Dr. Marcos Alves", handle: "@dr.marcos", text: "Como médico, a AloClinica me permitiu alcançar pacientes de todo o Brasil. A tecnologia é de ponta.", rating: 5, avatar: avatarCarlos, verified: true, likes: 512, time: "3d" },
  { name: "Fernanda Lima", handle: "@fer.lima", text: "Melhor investimento em saúde que já fiz. Atendimento humanizado mesmo sendo online. Parabéns! 👏", rating: 5, avatar: avatarAna, verified: true, likes: 331, time: "4d" },
];

const TestimonialsSection = () => {
  const [testimonials] = useState(allTestimonials);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval>>();

  const goTo = useCallback((idx: number) => {
    setActiveIndex(idx);
  }, []);

  const next = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    setActiveIndex(prev => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  // Auto-play
  useEffect(() => {
    autoPlayRef.current = setInterval(next, 4000);
    return () => clearInterval(autoPlayRef.current);
  }, [next]);

  const pauseAutoPlay = () => {
    clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(next, 4000);
  };

  // Scroll horizontal sync for desktop
  useEffect(() => {
    if (!scrollRef.current) return;
    const cardWidth = 300;
    const gap = 16;
    const scrollTo = activeIndex * (cardWidth + gap);
    scrollRef.current.scrollTo({ left: scrollTo - 100, behavior: "smooth" });
  }, [activeIndex]);

  return (
    <section id="depoimentos" className="py-12 md:py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3">
            O que dizem sobre a{" "}
            <span className="text-gradient">AloClinica</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Histórias reais de quem já transformou sua saúde com a gente.
          </p>
        </motion.div>

        {/* Stories-style carousel */}
        <div className="relative max-w-6xl mx-auto">
          {/* Progress bars (story indicators) */}
          <div className="flex gap-1 mb-6 max-w-xl mx-auto px-4">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => { goTo(i); pauseAutoPlay(); }}
                className="flex-1 h-1 rounded-full overflow-hidden bg-muted-foreground/10"
              >
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: "0%" }}
                  animate={{
                    width: i < activeIndex ? "100%" : i === activeIndex ? "100%" : "0%",
                  }}
                  transition={
                    i === activeIndex
                      ? { duration: 4, ease: "linear" }
                      : { duration: 0.2 }
                  }
                  key={`bar-${activeIndex}-${i}`}
                />
              </button>
            ))}
          </div>

          {/* Mobile: single card with swipe */}
          <div className="md:hidden relative">
            <AnimatePresence mode="wait" custom={activeIndex}>
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto max-w-sm"
              >
                <StoryCard testimonial={testimonials[activeIndex]} />
              </motion.div>
            </AnimatePresence>

            {/* Nav buttons */}
            <div className="flex items-center justify-center gap-4 mt-5">
              <button onClick={() => { prev(); pauseAutoPlay(); }} className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors active:scale-95">
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
              <span className="text-xs text-muted-foreground font-medium tabular-nums">
                {activeIndex + 1} / {testimonials.length}
              </span>
              <button onClick={() => { next(); pauseAutoPlay(); }} className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors active:scale-95">
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>

          {/* Desktop: horizontal scroll of story cards */}
          <div
            ref={scrollRef}
            className="hidden md:flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory scrollbar-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 200, damping: 15 }}
                className="snap-start shrink-0"
                style={{ width: 300 }}
              >
                <div
                  onClick={() => { goTo(i); pauseAutoPlay(); }}
                  className={`cursor-pointer transition-all duration-300 ${i === activeIndex ? "scale-[1.02]" : "opacity-70 hover:opacity-100"}`}
                >
                  <StoryCard testimonial={t} compact={i !== activeIndex} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

interface StoryCardProps {
  testimonial: typeof allTestimonials[0];
  compact?: boolean;
}

const StoryCard = ({ testimonial: t, compact }: StoryCardProps) => (
  <div className={`rounded-2xl border border-border/50 bg-card overflow-hidden transition-shadow duration-300 ${compact ? "" : "shadow-lg shadow-primary/[0.06]"}`}>
    {/* Header: avatar + name + handle */}
    <div className="flex items-center gap-3 p-4 pb-0">
      <div className="relative">
        <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-br from-primary to-secondary">
          <img
            src={t.avatar}
            alt={t.name}
            className="w-full h-full rounded-full object-cover border-2 border-card"
            loading="lazy"
          />
        </div>
        {t.verified && (
          <ShieldCheck className="w-4 h-4 text-primary absolute -bottom-0.5 -right-0.5 bg-card rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{t.name}</p>
        <p className="text-xs text-muted-foreground">{t.handle}</p>
      </div>
      <span className="text-[11px] text-muted-foreground/60">{t.time}</span>
    </div>

    {/* Body */}
    <div className="px-4 py-4">
      <p className="text-sm text-foreground leading-relaxed">{t.text}</p>
    </div>

    {/* Footer: stars + likes */}
    <div className="flex items-center justify-between px-4 pb-4">
      <div className="flex gap-0.5">
        {Array.from({ length: t.rating }).map((_, j) => (
          <Star key={j} className="w-3.5 h-3.5 fill-medical-green text-medical-green" />
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Heart className="w-3.5 h-3.5" />
        <span className="text-xs">{t.likes}</span>
      </div>
    </div>
  </div>
);

export default TestimonialsSection;
