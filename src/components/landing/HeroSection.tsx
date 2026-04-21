import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { memo, forwardRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePrefetchRoute } from "@/hooks/use-prefetch-route";
import OptimizedImage from "@/components/ui/optimized-image";
import { ArrowRight, ShieldCheck, Lock, Star, CheckCircle } from "@phosphor-icons/react";

// The "correct" hero image provided by the user
const DEFAULT_HERO_IMAGE = "https://cvbgrjauqjawrsyknhyj.supabase.co/storage/v1/object/public/files/uploads/0XILPRqqUbSOh99ow53X5OBDOCC3/1776794584229-hum3c-hero-doctor__4_-removebg-preview.png";

const specialtyVariations = [
  {
    name: "Geral",
    title: "Cuidado médico de excelência",
    subtitle: "Conecte-se a médicos especialistas verificados pelo CFM. Consultas por vídeo em HD, receitas digitais válidas e prontuário eletrônico completo.",
    image: DEFAULT_HERO_IMAGE,
    color: "primary",
    badge: "Médicos disponíveis agora"
  },
  {
    name: "Cardiologia",
    title: "Cuide do seu coração com especialistas",
    subtitle: "Acompanhamento cardiológico completo via telemedicina. Monitore sua saúde cardiovascular com os melhores profissionais do país.",
    image: DEFAULT_HERO_IMAGE,
    color: "rose-500",
    badge: "Cardiologistas de plantão"
  },
  {
    name: "Pediatria",
    title: "Saúde infantil na palma da sua mão",
    subtitle: "Atendimento pediátrico humanizado e ágil para o seu filho. Receitas e orientações sem precisar sair de casa.",
    image: DEFAULT_HERO_IMAGE,
    color: "sky-500",
    badge: "Pediatras disponíveis 24h"
  },
  {
    name: "Dermatologia",
    title: "Sua pele merece cuidado especializado",
    subtitle: "Consulte dermatologistas para acne, alergias e cuidados estéticos. Diagnóstico preciso por vídeo de alta definição.",
    image: DEFAULT_HERO_IMAGE,
    color: "pink-500",
    badge: "Dermatologia especializada"
  },
  {
    name: "Psiquiatria",
    title: "Sua saúde mental é prioridade",
    subtitle: "Acolhimento e tratamento especializado com psiquiatras e psicólogos. Ambiente seguro e sigiloso para sua consulta.",
    image: DEFAULT_HERO_IMAGE,
    color: "violet-500",
    badge: "Apoio emocional 24h"
  }
];

const trustItems = [
  { label: "Regulamentado CFM", icon: ShieldCheck },
  { label: "Criptografia E2E", icon: Lock },
  { label: "4.9★ — 12k avaliações", icon: Star },
];

const highlights = [
  "Receita digital válida em todo o Brasil",
  "Atendimento 24h — inclusive feriados",
  "30+ especialidades médicas",
];

export interface HeroSectionProps {
  activeSpecialtyIndex?: number;
  autoRotate?: boolean;
}

const HeroSection = memo(
  forwardRef<HTMLElement, HeroSectionProps>((props, ref) => {
    const { activeSpecialtyIndex: manualIndex, autoRotate = true } = props;
    const navigate = useNavigate();
    const prefetchPaciente = usePrefetchRoute(() => import("@/pages/AuthPaciente"));
    const [currentIndex, setCurrentIndex] = useState(manualIndex ?? 0);

    useEffect(() => {
      if (manualIndex !== undefined) {
        setCurrentIndex(manualIndex);
      }
    }, [manualIndex]);

    useEffect(() => {
      let timer: ReturnType<typeof setInterval> | null = null;
      if (autoRotate && manualIndex === undefined) {
        timer = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % specialtyVariations.length);
        }, 6000);
      }
      return () => {
        if (timer) clearInterval(timer);
      };
    }, [autoRotate, manualIndex]);

    const variation = specialtyVariations[currentIndex];

    return (
      <section
        ref={ref}
        aria-label="Início"
        className="relative flex items-center pt-24 sm:pt-28 lg:pt-36 pb-20 sm:pb-24 lg:pb-32 overflow-hidden bg-background"
      >
        {/* Dynamic Background */}
        <div className="absolute inset-0 -z-10 transition-colors duration-1000">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
          <AnimatePresence mode="wait">
            <motion.div
              key={variation.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <div 
                className="absolute top-[-15%] right-[10%] w-[500px] h-[500px] rounded-full blur-[180px] animate-breathe"
                style={{ backgroundColor: variation.color === 'primary' ? 'var(--primary)' : variation.color, opacity: 0.08 }} 
              />
              <div 
                className="absolute bottom-[-25%] left-[-8%] w-[400px] h-[400px] rounded-full blur-[160px] animate-breathe [animation-delay:1.5s]"
                style={{ backgroundColor: 'var(--secondary)', opacity: 0.04 }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 xl:gap-24 items-center">
            {/* Left content */}
            <div className="max-w-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={variation.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Status badge */}
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-primary/20 bg-primary/[0.06] text-primary text-xs font-semibold mb-6 shadow-sm shadow-primary/10">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary shadow-sm shadow-primary/40" />
                    </span>
                    {variation.badge}
                  </div>

                  {/* Headline */}
                  <div className="mb-6">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.2rem] font-extrabold leading-[1.1] tracking-tight text-foreground">
                      <span className="text-gradient">{variation.title}</span>
                    </h1>
                  </div>

                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mb-6">
                    {variation.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Highlights */}
              <div className="flex flex-col gap-2.5 mb-8">
                {highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <CheckCircle className="w-[18px] h-[18px] text-primary shrink-0" weight="fill" />
                    {h}
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
                <Button
                  size="lg"
                  className="rounded-2xl h-[52px] w-full sm:w-auto justify-center text-[14px] font-bold shadow-lg shadow-primary/20 group bg-primary hover:bg-primary/90 text-primary-foreground border-0 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] px-8"
                  onClick={() => navigate("/agendar")}
                  onMouseEnter={prefetchPaciente}
                >
                  Agendar agora
                  <ArrowRight className="w-4 h-4 ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5" weight="bold" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-2xl h-[52px] w-full sm:w-auto justify-center text-[14px] font-bold border-2 hover:border-primary/30 hover:bg-primary/[0.04] transition-all duration-200 px-8"
                  onClick={() => navigate("/especialidades")}
                >
                  Ver especialidades
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-row flex-wrap items-center gap-4">
                {trustItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 text-xs text-muted-foreground font-medium"
                  >
                    <item.icon className="w-3.5 h-3.5 text-primary/60 shrink-0" weight="fill" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right - hero image */}
            <motion.div
              className="relative hidden md:flex justify-center items-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl">
                {/* Soft gradient behind image */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-secondary/[0.04] blur-[80px] rounded-full scale-90 -z-10" />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={variation.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <OptimizedImage
                      src={variation.image}
                      alt="Médico especialista realizando teleconsulta"
                      className="w-full h-auto drop-shadow-2xl"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Floating card — Seguro */}
                <motion.div
                  className="absolute -top-1 -right-2 xl:right-0 bg-card/95 backdrop-blur-md rounded-2xl shadow-md shadow-foreground/[0.04] px-4 py-3 border border-border/50 flex items-center gap-3"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  aria-hidden="true"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-primary" weight="fill" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-foreground leading-none mb-1">100% Seguro</p>
                    <p className="text-[11px] text-muted-foreground leading-none">Criptografia E2E</p>
                  </div>
                </motion.div>

                {/* Floating card — Rating */}
                <motion.div
                  className="absolute bottom-12 -left-4 xl:-left-2 bg-card/95 backdrop-blur-md rounded-2xl shadow-md shadow-foreground/[0.04] px-4 py-3 border border-border/50 flex items-center gap-3"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Star className="w-6 h-6 text-amber-500" weight="fill" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-foreground leading-none mb-1">4.9/5</p>
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