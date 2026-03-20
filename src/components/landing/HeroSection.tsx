import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, memo, forwardRef, useEffect, useRef } from "react";
import { usePrefetchRoute } from "@/hooks/use-prefetch-route";
import heroDoctor from "@/assets/hero-doctor.png";
import gsap from "gsap";

const poseContent = [
  {
    title: "Sua saúde a um",
    highlight: "clique de distância",
    description:
      "Conecte-se com médicos especialistas de qualquer lugar. Consultas por vídeo, receitas digitais e acompanhamento completo.",
  },
  {
    title: "Médicos aprovados com",
    highlight: "nota máxima",
    description:
      "Todos os profissionais são verificados e avaliados pelos pacientes. Qualidade garantida em cada consulta.",
  },
  {
    title: "Receitas e laudos",
    highlight: "100% digitais",
    description:
      "Receba prescrições, atestados e laudos médicos direto no seu celular. Tudo organizado e acessível.",
  },
];

const trustItems = [
  "Regulamentado pelo CFM",
  "Criptografia end-to-end",
  "Nota 4.9 no Google",
];

const HeroSection = memo(
  forwardRef<HTMLElement>((_, ref) => {
    const navigate = useNavigate();
    const prefetchPaciente = usePrefetchRoute(() => import("@/pages/AuthPaciente"));
    const prefetchConsulta = usePrefetchRoute(() => import("@/pages/GuestCheckout"));
    const [poseIndex, setPoseIndex] = useState(0);
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const interval = setInterval(() => {
        setPoseIndex((prev) => (prev + 1) % poseContent.length);
      }, 5000);
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const ctx = gsap.context(() => {
        const items = heroRef.current?.querySelectorAll(".gsap-hero-item");
        if (items?.length) {
          gsap.fromTo(
            items,
            { opacity: 0, y: 20, filter: "blur(4px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              stagger: 0.09,
              duration: 0.7,
              ease: "power3.out",
              delay: 0.05,
              clearProps: "transform,opacity,filter",
            }
          );
        }
      }, heroRef);
      return () => ctx.revert();
    }, []);

    return (
      <section
        ref={ref}
        aria-label="Início"
        className="relative flex items-center pt-20 sm:pt-24 lg:pt-28 pb-12 sm:pb-16 lg:pb-20 overflow-hidden"
      >
        {/* Ambient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
          <div className="absolute top-[-10%] right-[5%] w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[160px]" />
          <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-secondary/[0.03] blur-[140px]" />
        </div>

        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28" ref={heroRef}>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-24 items-center">
            {/* ── Text column ── */}
            <div className="max-w-2xl">
              {/* Live badge */}
              <div className="gsap-hero-item inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-primary/20 bg-primary/[0.06] text-primary text-sm font-semibold mb-8 select-none">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                Médicos disponíveis agora
              </div>

              {/* Headline carousel */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={poseIndex}
                  initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="gsap-hero-item"
                >
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight text-foreground mb-5">
                    {poseContent[poseIndex].title}{" "}
                    <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                      {poseContent[poseIndex].highlight}
                    </span>
                  </h1>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md mb-8">
                    {poseContent[poseIndex].description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* CTAs */}
              <div className="gsap-hero-item flex flex-col sm:flex-row gap-3 mb-8">
                <Button
                  size="lg"
                  className="rounded-full px-7 h-12 text-[15px] font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 hover:brightness-110 active:scale-[0.97] transition-all duration-200"
                  onClick={() => navigate("/paciente")}
                  onMouseEnter={prefetchPaciente}
                >
                  Agendar consulta
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-7 h-12 text-[15px] font-semibold border-border/80 text-foreground hover:bg-muted/60 active:scale-[0.97] transition-all duration-200"
                  onClick={() => navigate("/consulta-avulsa")}
                  onMouseEnter={prefetchConsulta}
                >
                  Consulta avulsa — R$89
                </Button>
              </div>

              {/* Trust bar */}
              <div className="gsap-hero-item flex flex-wrap gap-x-5 gap-y-2.5">
                {trustItems.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Image column ── */}
            <motion.div
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden md:flex justify-center"
            >
              <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl">
                {/* Soft glow */}
                <div className="absolute inset-0 bg-primary/[0.06] blur-[100px] rounded-full scale-75 -z-10" />

                <img
                  src={heroDoctor}
                  alt="Pingo - Mascote do AloClinica"
                  className="w-full h-auto drop-shadow-xl"
                  loading="eager"
                  fetchPriority="high"
                />

                {/* Floating card — Security */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-6 -right-2 xl:right-0 backdrop-blur-lg bg-card/90 rounded-2xl shadow-lg shadow-foreground/[0.04] px-4 py-3 border border-border/50 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center">
                    <svg className="w-[18px] h-[18px] text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-none mb-0.5">100% Seguro</p>
                    <p className="text-[11px] text-muted-foreground leading-none">Criptografia end-to-end</p>
                  </div>
                </motion.div>

                {/* Floating card — Rating */}
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                  className="absolute bottom-10 -left-4 xl:left-0 backdrop-blur-lg bg-card/90 rounded-2xl shadow-lg shadow-foreground/[0.04] px-4 py-3 border border-border/50 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center">
                    <span className="text-base">⭐</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-none mb-0.5">4.9/5</p>
                    <p className="text-[11px] text-muted-foreground leading-none">12k+ avaliações</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  })
);

HeroSection.displayName = "HeroSection";
export default HeroSection;
