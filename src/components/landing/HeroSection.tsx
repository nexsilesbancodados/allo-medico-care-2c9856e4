import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Shield, Clock, ArrowRight, Stethoscope } from "lucide-react";
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
    // Simulated live activity — randomized realistic number
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
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 text-xs font-medium text-success"
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
      {/* Simple gradient bg */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-medical-blue-light opacity-50 blur-3xl" />
        <div className="absolute bottom-20 left-0 w-[300px] h-[300px] rounded-full bg-medical-green-light opacity-50 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-medical-blue-light text-primary text-sm font-medium">
                <Video className="w-4 h-4" />
                Consultas por videochamada
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-medical-green/10 text-medical-green text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-medical-green animate-pulse" />
                <Stethoscope className="w-3 h-3" />
                Médicos online agora
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={poseIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.15] text-foreground mb-3 sm:mb-6">
                  {poseContent[poseIndex].title}{" "}
                  <span className="text-gradient">{poseContent[poseIndex].highlight}</span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-lg mb-6 sm:mb-8 leading-relaxed">
                  {poseContent[poseIndex].description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button
                size="lg"
                className="bg-gradient-hero hover:opacity-90 text-primary-foreground rounded-full px-6 relative overflow-hidden group h-12 sm:h-11 text-base sm:text-sm cta-shimmer"
                onClick={() => navigate("/paciente")}
                onMouseEnter={prefetchPaciente}
              >
                <span className="relative z-10 flex items-center gap-1">
                  Começar Agora <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-6 h-12 sm:h-11 text-base sm:text-sm hover:bg-primary/5 transition-colors"
                onClick={() => navigate("/consulta-avulsa")}
                onMouseEnter={prefetchConsulta}
              >
                Consulta Avulsa
              </Button>
            </div>

            {/* Live activity + Trust */}
            <LiveActivityIndicator />
            <div className="flex flex-wrap gap-6 mt-3">
              {[
                { icon: Shield, text: "Dados protegidos" },
                { icon: Clock, text: "Atendimento 24h" },
                { icon: Video, text: "Vídeo em HD" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-medical-green" />
                  {item.text}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero image — single, no cycling */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative w-full max-w-[200px] sm:max-w-[280px] md:max-w-sm lg:max-w-lg mx-auto">
              <img
                src={heroDoctor}
                alt="Pingo - Mascote do AloClinica"
                className="w-full h-auto drop-shadow-2xl"
                loading="eager"
                fetchPriority="high"
              />

              {/* Single floating card */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 right-0 backdrop-blur-xl bg-card/80 rounded-2xl shadow-elevated p-3 border border-border/50 hidden md:flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-medical-green-light flex items-center justify-center">
                  <Shield className="w-4 h-4 text-medical-green" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">100% Seguro</p>
                  <p className="text-xs text-muted-foreground">Criptografia end-to-end</p>
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
