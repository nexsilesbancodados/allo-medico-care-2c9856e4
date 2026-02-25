import { motion, AnimatePresence } from "framer-motion";
import { Star, ShieldCheck, Heart, Quote } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
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
  const [activeIndex, setActiveIndex] = useState(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval>>();
  const scrollRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((idx: number) => setActiveIndex(idx), []);

  const next = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % allTestimonials.length);
  }, []);

  useEffect(() => {
    autoPlayRef.current = setInterval(next, 4000);
    return () => clearInterval(autoPlayRef.current);
  }, [next]);

  const pauseAndGo = (idx: number) => {
    clearInterval(autoPlayRef.current);
    goTo(idx);
    autoPlayRef.current = setInterval(next, 4000);
  };

  // Scroll active story bubble into view
  useEffect(() => {
    if (!scrollRef.current) return;
    const btn = scrollRef.current.children[activeIndex] as HTMLElement;
    if (btn) btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeIndex]);

  const t = allTestimonials[activeIndex];

  return (
    <section id="depoimentos" className="py-12 md:py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3">
            O que dizem sobre a{" "}
            <span className="text-gradient">AloClinica</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Histórias reais de quem já transformou sua saúde com a gente.
          </p>
        </motion.div>

        {/* Instagram Stories row — round avatars with gradient ring */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 justify-start md:justify-center scrollbar-none px-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {allTestimonials.map((item, i) => (
            <button
              key={i}
              onClick={() => pauseAndGo(i)}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              {/* Avatar ring */}
              <div
                className={`w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full p-[2.5px] transition-all duration-300 ${
                  i === activeIndex
                    ? "bg-gradient-to-br from-primary via-secondary to-primary shadow-lg shadow-primary/20 scale-110"
                    : i < activeIndex
                    ? "bg-muted-foreground/20"
                    : "bg-gradient-to-br from-primary/40 to-secondary/40 group-hover:from-primary group-hover:to-secondary"
                }`}
              >
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-full h-full rounded-full object-cover border-[2.5px] border-card"
                  loading="lazy"
                />
              </div>
              <span className={`text-[10px] sm:text-[11px] font-medium max-w-[64px] sm:max-w-[72px] truncate transition-colors ${
                i === activeIndex ? "text-foreground" : "text-muted-foreground"
              }`}>
                {item.name.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Story progress bars */}
        <div className="flex gap-0.5 mt-4 mb-6 max-w-lg mx-auto px-4">
          {allTestimonials.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden bg-muted-foreground/10">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: i < activeIndex ? "100%" : i === activeIndex ? "100%" : "0%" }}
                transition={i === activeIndex ? { duration: 4, ease: "linear" } : { duration: 0.15 }}
                key={`bar-${activeIndex}-${i}`}
              />
            </div>
          ))}
        </div>

        {/* Active story card */}
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-lg shadow-primary/[0.04]">
                {/* Header */}
                <div className="flex items-center gap-3 p-4">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-br from-primary to-secondary">
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="w-full h-full rounded-full object-cover border-2 border-card"
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
                  <span className="text-[11px] text-muted-foreground/50">{t.time}</span>
                </div>

                {/* Body */}
                <div className="px-5 pb-4">
                  <Quote className="w-6 h-6 text-primary/15 mb-2" />
                  <p className="text-[15px] text-foreground leading-relaxed">{t.text}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 pb-4">
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
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
