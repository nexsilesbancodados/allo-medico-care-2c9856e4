import { forwardRef, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
import { motion } from "framer-motion";
import { UserPlus, Search, Video, FileText, Clock } from "lucide-react";
import stepSignup from "@/assets/step-signup.png";
import stepSearch from "@/assets/step-search.png";
import stepVideocall from "@/assets/step-videocall.png";
import stepPrescription from "@/assets/step-prescription.png";

const steps = [
  { icon: UserPlus, title: "Cadastre-se", description: "Crie sua conta em menos de 2 minutos.", image: stepSignup, time: "2 min", accent: "from-primary/20 to-secondary/10" },
  { icon: Search, title: "Encontre seu médico", description: "Busque por especialidade ou disponibilidade.", image: stepSearch, time: "1 min", accent: "from-secondary/20 to-success/10" },
  { icon: Video, title: "Consulta por vídeo", description: "Videochamada segura e em HD.", image: stepVideocall, time: "15-30 min", accent: "from-blue-500/15 to-primary/10" },
  { icon: FileText, title: "Receba sua receita", description: "Receita digital válida na hora.", image: stepPrescription, time: "Instantâneo", accent: "from-success/20 to-emerald-400/10" },
];

const HowItWorksSection = forwardRef<HTMLElement>((_, ref) => {
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stepsRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const cards = el.querySelectorAll(".step-card");
      ScrollTrigger.create({
        trigger: el, start: "top 80%", once: true,
        onEnter: () => gsap.fromTo(cards,
          { opacity: 0, y: 28, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.55, ease: "power3.out", clearProps: "transform,opacity" }
        ),
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section id="como-funciona" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/[0.06] border border-primary/10 text-primary text-sm font-semibold mb-4">
            <Clock className="w-3.5 h-3.5" />
            Menos de 5 minutos
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Como funciona
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Em 4 passos simples, acesse médicos especialistas sem sair de casa.
          </p>
        </motion.div>

        {/* Desktop: horizontal cards */}
        <div className="hidden lg:block relative">
          {/* Connector line */}
          <div className="absolute top-[4.5rem] left-[12%] right-[12%] h-px bg-border/60 z-0" />
          
          <div ref={stepsRef} className="grid lg:grid-cols-4 gap-6 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="step-card group"
              >
                <div className="relative bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/20 transition-all duration-300 h-full">
                  {/* Gradient accent top */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${step.accent}`} />
                  
                  {/* Image with parallax-like hover */}
                  <div className="relative w-full h-40 overflow-hidden bg-gradient-to-br from-muted/40 to-muted/20">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
                      loading="lazy" decoding="async" />
                    {/* Shimmer overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                    {/* Step number badge */}
                    <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-primary/90 flex items-center justify-center shadow-lg">
                      <span className="text-xs font-extrabold text-primary-foreground">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    {/* Time badge */}
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-medium text-foreground bg-card/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
                      <Clock className="w-2.5 h-2.5" />
                      {step.time}
                    </span>
                  </div>

                  <div className="p-5">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/20">
                      <step.icon className="w-4.5 h-4.5 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1.5">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="lg:hidden relative">
          <motion.div
            className="absolute left-6 top-0 bottom-0 w-px bg-border/60"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ originY: 0 }}
          />

          <div className="space-y-5">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="relative flex gap-4 pl-2"
              >
                <motion.div
                  className="relative z-10 w-12 h-12 rounded-xl bg-primary/[0.08] border border-primary/10 flex items-center justify-center shrink-0"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.1, type: "spring", stiffness: 300 }}
                >
                  <span className="text-sm font-extrabold text-primary">{String(i + 1).padStart(2, '0')}</span>
                </motion.div>

                <div className="flex-1 bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
                  {/* Mobile image */}
                  <div className="relative w-full h-28 overflow-hidden">
                    <img src={step.image} alt={step.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    <div className={`absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent`} />
                  </div>
                  <div className="p-4 -mt-4 relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <step.icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                        <Clock className="w-2.5 h-2.5" />
                        {step.time}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-12 text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" />
            <strong className="text-foreground">~18 min</strong> do cadastro à receita
          </span>
          <span className="hidden sm:inline text-border">•</span>
          <span>100% online</span>
          <span className="hidden sm:inline text-border">•</span>
          <span>Sem necessidade de download</span>
        </motion.div>
      </div>
    </section>
  );
});
HowItWorksSection.displayName = "HowItWorksSection";
export default HowItWorksSection;
