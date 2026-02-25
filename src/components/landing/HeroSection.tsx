import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Shield, Clock, ArrowRight, Stethoscope, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, memo } from "react";
import { usePrefetchRoute } from "@/hooks/use-prefetch-route";
import heroDoctor from "@/assets/hero-doctor.png";

const poseContent = [
  { title: "Sua saúde a um", highlight: "clique de distância", description: "Conecte-se com médicos especialistas de qualquer lugar. Consultas por vídeo, receitas digitais e acompanhamento completo." },
  { title: "Médicos aprovados com", highlight: "nota máxima", description: "Todos os profissionais são verificados e avaliados pelos pacientes. Qualidade garantida em cada consulta." },
  { title: "Receitas e laudos", highlight: "100% digitais", description: "Receba prescrições, atestados e laudos médicos direto no seu celular. Tudo organizado e acessível." },
];

const LiveActivityIndicator = memo(() => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const base = 14 + Math.floor(Math.random() * 8);
    setCount(base);
    const interval = setInterval(() => {
      setCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8 }}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-success/10 border border-success/20 text-xs font-medium text-success backdrop-blur-sm"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
      </span>
      {count} pessoas agendando agora
    </motion.div>
  );
});
LiveActivityIndicator.displayName = "LiveActivityIndicator";

const HeroSection = memo(() => {
  const navigate = useNavigate();
  const prefetchPaciente = usePrefetchRoute(() => import("@/pages/AuthPaciente"));
  const prefetchConsulta = usePrefetchRoute(() => import("@/pages/GuestCheckout"));
  const [poseIndex, setPoseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPoseIndex((prev) => (prev + 1) % poseContent.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section aria-label="Início" className="relative min-h-[85vh] sm:min-h-[90vh] lg:min-h-screen flex items-center pt-20 sm:pt-24 overflow-hidden">
      {/* Rich layered background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-secondary/[0.04]" />
        <div className="absolute top-10 right-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/15 to-secondary/10 blur-[100px]" />
        <div className="absolute bottom-10 left-[5%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-secondary/12 to-primary/8 blur-[80px]" />
        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="container mx-auto px-4 py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/15 text-primary text-sm font-medium backdrop-blur-sm"
              >
                <Video className="w-4 h-4" />
                Consultas por videochamada
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-success/10 border border-success/15 text-success text-xs font-semibold"
              >
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <Stethoscope className="w-3 h-3" />
                Médicos online agora
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={poseIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] text-foreground mb-4 sm:mb-6 tracking-tight">
                  {poseContent[poseIndex].title}{" "}
                  <span className="text-gradient bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">{poseContent[poseIndex].highlight}</span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-lg mb-7 sm:mb-8 leading-relaxed">
                  {poseContent[poseIndex].description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary via-primary to-secondary hover:opacity-90 text-primary-foreground rounded-full px-7 relative overflow-hidden group h-12 sm:h-12 text-base font-semibold shadow-xl shadow-primary/25 cta-shimmer"
                onClick={() => navigate("/paciente")}
                onMouseEnter={prefetchPaciente}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Começar Agora
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-7 h-12 text-base font-semibold border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all"
                onClick={() => navigate("/consulta-avulsa")}
                onMouseEnter={prefetchConsulta}
              >
                Consulta Avulsa — R$89
              </Button>
            </div>

            {/* Live activity + Trust */}
            <LiveActivityIndicator />
            <div className="flex flex-wrap gap-5 mt-4">
              {[
                { icon: Shield, text: "Dados protegidos", color: "text-primary" },
                { icon: Clock, text: "Atendimento 24h", color: "text-secondary" },
                { icon: Video, text: "Vídeo em HD", color: "text-success" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <div className={`w-6 h-6 rounded-lg bg-muted/60 flex items-center justify-center`}>
                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                  </div>
                  {item.text}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="relative w-full max-w-[200px] sm:max-w-[280px] md:max-w-sm lg:max-w-lg mx-auto">
              {/* Glow behind mascot */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 blur-[60px] rounded-full scale-75" />
              
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
                className="absolute top-4 right-0 backdrop-blur-xl bg-card/90 rounded-2xl shadow-xl p-3.5 border border-border/50 hidden md:flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center">
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
                className="absolute bottom-8 left-0 backdrop-blur-xl bg-card/90 rounded-2xl shadow-xl p-3.5 border border-border/50 hidden md:flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center">
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
});

HeroSection.displayName = "HeroSection";
export default HeroSection;
