import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Shield, Clock, ArrowRight, Stethoscope, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, memo, forwardRef } from "react";
import { usePrefetchRoute } from "@/hooks/use-prefetch-route";
import heroDoctor from "@/assets/hero-doctor.png";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const poseContent = [
  { title: "Sua saúde a um", highlight: "clique de distância", description: "Conecte-se com médicos especialistas de qualquer lugar. Consultas por vídeo, receitas digitais e acompanhamento completo." },
  { title: "Médicos aprovados com", highlight: "nota máxima", description: "Todos os profissionais são verificados e avaliados pelos pacientes. Qualidade garantida em cada consulta." },
  { title: "Receitas e laudos", highlight: "100% digitais", description: "Receba prescrições, atestados e laudos médicos direto no seu celular. Tudo organizado e acessível." },
];

const trustItems = [
  "Regulamentado pelo CFM",
  "Criptografia end-to-end",
  "Nota 4.9 no Google",
];

const HeroSection = memo(forwardRef<HTMLElement>((_, ref) => {
  const navigate = useNavigate();
  const prefetchPaciente = usePrefetchRoute(() => import("@/pages/AuthPaciente"));
  const prefetchConsulta = usePrefetchRoute(() => import("@/pages/GuestCheckout"));
  const [poseIndex, setPoseIndex] = useState(0);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPoseIndex((prev) => (prev + 1) % poseContent.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // GSAP entrance — staggered hero elements
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      // Text content enters left → right
      if (heroTextRef.current) {
        const items = heroTextRef.current.querySelectorAll(".gsap-hero-item");
        gsap.fromTo(items,
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, stagger: 0.1, duration: 0.65, ease: "power3.out", delay: 0.1, clearProps: "transform,opacity" }
        );
      }
      // Image floats in from right
      if (heroImageRef.current) {
        gsap.fromTo(heroImageRef.current,
          { opacity: 0, x: 32, scale: 0.97 },
          { opacity: 1, x: 0, scale: 1, duration: 0.8, ease: "power3.out", delay: 0.35, clearProps: "transform,opacity" }
        );
      }
      // Trust bar
      if (trustRef.current) {
        const items = trustRef.current.querySelectorAll(".trust-item");
        gsap.fromTo(items,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 0.45, ease: "power2.out", delay: 0.55, clearProps: "transform,opacity" }
        );
      }
    });
    return () => ctx.revert();
  }, []);

  return (
    <section aria-label="Início" className="relative min-h-[85vh] sm:min-h-[90vh] lg:min-h-screen flex items-center pt-20 sm:pt-24 overflow-hidden">
      {/* Refined corporate background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-secondary/[0.04]" />
        <div className="absolute top-10 right-[10%] w-[500px] h-[500px] rounded-full bg-primary/[0.06] blur-[140px]" />
        <div className="absolute bottom-10 left-[5%] w-[400px] h-[400px] rounded-full bg-secondary/[0.05] blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="container mx-auto px-4 py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div ref={heroTextRef}>
            {/* Corporate badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/[0.07] border border-primary/10 text-primary text-sm font-semibold mb-6"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
              </span>
              Médicos disponíveis agora
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={poseIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl font-extrabold leading-[1.08] text-foreground mb-5 sm:mb-6 tracking-tight">
                  {poseContent[poseIndex].title}{" "}
                  <span className="text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {poseContent[poseIndex].highlight}
                  </span>
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-lg mb-7 sm:mb-8 leading-relaxed">
                  {poseContent[poseIndex].description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Primary CTA — strong hierarchy */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Button
                size="lg"
                className="bg-gradient-hero text-primary-foreground rounded-full px-8 h-13 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:opacity-95 transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => navigate("/paciente")}
                onMouseEnter={prefetchPaciente}
              >
                Agendar consulta
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-7 h-13 text-base font-semibold border-border hover:bg-muted/50 transition-all"
                onClick={() => navigate("/consulta-avulsa")}
                onMouseEnter={prefetchConsulta}
              >
                Consulta avulsa — R$89
              </Button>
            </div>

            {/* Trust indicators — corporate style */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-x-6 gap-y-2"
            >
              {trustItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-success shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative w-full max-w-[200px] sm:max-w-[280px] md:max-w-sm lg:max-w-lg mx-auto">
              {/* Subtle glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-secondary/15 blur-[80px] rounded-full scale-75" />
              
              <img
                src={heroDoctor}
                alt="Pingo - Mascote do AloClinica"
                className="relative w-full h-auto drop-shadow-2xl"
                loading="eager"
                fetchPriority="high"
              />

              {/* Floating card — Security */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 right-0 backdrop-blur-xl bg-card/95 rounded-2xl shadow-xl shadow-foreground/[0.06] p-3.5 border border-border/60 hidden md:flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">100% Seguro</p>
                  <p className="text-[11px] text-muted-foreground">Criptografia end-to-end</p>
                </div>
              </motion.div>

              {/* Floating card — Rating */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-8 left-0 backdrop-blur-xl bg-card/95 rounded-2xl shadow-xl shadow-foreground/[0.06] p-3.5 border border-border/60 hidden md:flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <span className="text-lg">⭐</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">4.9/5</p>
                  <p className="text-[11px] text-muted-foreground">12k+ avaliações</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}));

HeroSection.displayName = "HeroSection";
export default HeroSection;
