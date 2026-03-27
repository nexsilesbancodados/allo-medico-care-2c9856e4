import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { memo, forwardRef } from "react";
import { motion } from "framer-motion";
import { usePrefetchRoute } from "@/hooks/use-prefetch-route";
import OptimizedImage from "@/components/ui/optimized-image";

import heroDoctor from "@/assets/hero-doctor.png";

const heroContent = {
  title: "Sua saúde a um",
  highlight: "clique de distância",
  description:
    "Conecte-se com médicos especialistas de qualquer lugar. Consultas por vídeo, receitas digitais e acompanhamento completo.",
};

const trustItems = [
  "Regulamentado pelo CFM",
  "Criptografia end-to-end",
  "Nota 4.9 no Google",
];

const floatY = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const },
  },
};

const floatYSlow = {
  animate: {
    y: [0, -6, 0],
    transition: { duration: 4.2, repeat: Infinity, ease: "easeInOut" as const, delay: 0.8 },
  },
};

const HeroSection = memo(
  forwardRef<HTMLElement>((_, ref) => {
    const navigate = useNavigate();
    const prefetchPaciente = usePrefetchRoute(() => import("@/pages/AuthPaciente"));
    const prefetchConsulta = usePrefetchRoute(() => import("@/pages/GuestCheckout"));

    return (
      <section
        ref={ref}
        aria-label="Início"
        className="relative flex items-center pt-24 sm:pt-28 lg:pt-32 pb-44 sm:pb-48 lg:pb-52 overflow-hidden"
      >
        {/* Ambient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
          <div className="absolute top-[-10%] right-[5%] w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[160px]" />
          <div className="absolute bottom-[-20%] left-[-5%] w-[500px] h-[500px] rounded-full bg-secondary/[0.04] blur-[140px]" />
        </div>

        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 xl:gap-20 items-center">
            {/* Left content */}
            <motion.div
              className="max-w-2xl"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <motion.div
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-primary/20 bg-primary/[0.06] text-primary text-sm font-semibold mb-8 select-none backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <span className="inline-flex h-2 w-2 rounded-full bg-success shadow-sm shadow-success/40 animate-pulse" />
                Médicos disponíveis agora
              </motion.div>

              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.08] tracking-tight text-foreground mb-5">
                  {heroContent.title}{" "}
                  <span className="text-gradient">{heroContent.highlight}</span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md mb-8">
                  {heroContent.description}
                </p>
              </div>

              <motion.div
                className="flex flex-wrap items-center gap-3 mb-8"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <Button
                  size="lg"
                  className="rounded-full px-8 h-[52px] text-[15px] font-bold shadow-lg shadow-primary/25 group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground border-0 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
                  onClick={() => navigate("/paciente")}
                  onMouseEnter={prefetchPaciente}
                >
                  Agendar consulta
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
                <span className="hidden sm:block text-muted-foreground/40 text-sm font-medium select-none">ou</span>
                <Button
                  size="lg"
                  className="rounded-full px-8 h-[52px] text-[15px] font-bold shadow-lg shadow-success/25 group bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-success-foreground border-0 gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
                  onClick={() => navigate("/consulta-avulsa")}
                  onMouseEnter={prefetchConsulta}
                >
                  Consulta avulsa
                  <span className="inline-flex items-center rounded-full bg-white/20 text-white px-2.5 py-0.5 text-xs font-bold">R$89</span>
                </Button>
              </motion.div>

              <motion.div
                className="flex flex-wrap gap-x-5 gap-y-2.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {trustItems.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Right - hero image */}
            <motion.div
              className="relative hidden md:flex justify-center items-center"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            >
              <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] to-secondary/[0.06] blur-[100px] rounded-full scale-75 -z-10" />

                <OptimizedImage
                  src={heroDoctor}
                  alt="Ilustração do atendimento online da AloClinica"
                  className="w-full h-auto drop-shadow-2xl"
                  priority
                />

                {/* Floating card — 100% Seguro */}
                <motion.div
                  className="absolute -top-2 -right-4 xl:-right-2 bg-card/95 backdrop-blur-md rounded-2xl shadow-lg shadow-foreground/[0.06] px-4 py-3 border border-border/50 flex items-center gap-3"
                  variants={floatY}
                  animate="animate"
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
                  className="absolute bottom-8 -left-6 xl:-left-4 bg-card/95 backdrop-blur-md rounded-2xl shadow-lg shadow-foreground/[0.06] px-4 py-3 border border-border/50 flex items-center gap-3"
                  variants={floatYSlow}
                  animate="animate"
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
