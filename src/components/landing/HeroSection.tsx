import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { Video, Shield, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import heroDoctor from "@/assets/hero-doctor.png";
import mascotWave from "@/assets/mascot-wave.png";
import mascotThumbsup from "@/assets/mascot-thumbsup.png";
import mascotReading from "@/assets/mascot-reading.png";
import mascotWelcome from "@/assets/mascot-welcome.png";

const mascotPoses = [heroDoctor, mascotWave, mascotThumbsup, mascotWelcome, mascotReading];

const poseContent = [
  {
    title: "Sua saúde a um",
    highlight: "clique de distância",
    description: "Conecte-se com médicos especialistas de qualquer lugar. Consultas por vídeo, receitas digitais e acompanhamento completo.",
  },
  {
    title: "Olá! O Pingo está",
    highlight: "aqui para ajudar",
    description: "Tire dúvidas, agende consultas e receba orientações com o nosso assistente virtual sempre disponível.",
  },
  {
    title: "Médicos aprovados com",
    highlight: "nota máxima",
    description: "Todos os profissionais são verificados e avaliados pelos pacientes. Qualidade garantida em cada consulta.",
  },
  {
    title: "Bem-vindo ao",
    highlight: "Alô Médico",
    description: "Cuidamos de você e da sua família com carinho e tecnologia. Atendimento humanizado na palma da sua mão.",
  },
  {
    title: "Receitas e laudos",
    highlight: "100% digitais",
    description: "Receba prescrições, atestados e laudos médicos direto no seu celular. Tudo organizado e acessível.",
  },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [poseIndex, setPoseIndex] = useState(0);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [8, -8]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-8, 8]), { stiffness: 150, damping: 20 });
  const translateX = useSpring(useTransform(mouseX, [-300, 300], [-10, 10]), { stiffness: 150, damping: 20 });
  const translateY = useSpring(useTransform(mouseY, [-300, 300], [-10, 10]), { stiffness: 150, damping: 20 });

  // Auto-cycle poses
  useEffect(() => {
    const interval = setInterval(() => {
      setPoseIndex((prev) => (prev + 1) % mascotPoses.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-medical-blue-light opacity-60 blur-3xl" />
        <div className="absolute bottom-20 left-0 w-[400px] h-[400px] rounded-full bg-medical-green-light opacity-60 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-medical-blue-light text-primary text-sm font-medium mb-6">
              <Video className="w-4 h-4" />
              Consultas por videochamada
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={poseIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground mb-6">
                  {poseContent[poseIndex].title}{" "}
                  <span className="text-gradient">{poseContent[poseIndex].highlight}</span>
                </h1>

                <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
                  {poseContent[poseIndex].description}
                </p>
              </motion.div>
            </AnimatePresence>


            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Button
                size="lg"
                className="bg-gradient-hero hover:opacity-90 text-primary-foreground rounded-full px-6"
                onClick={() => navigate("/paciente")}
              >
                Começar Agora <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-6"
                onClick={() => navigate("/consulta-avulsa")}
              >
                Consulta Avulsa
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6">
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

          {/* Interactive Mascot with pose cycling */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden lg:block cursor-pointer"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{ perspective: 800 }}
          >
            <div className="relative w-full max-w-lg mx-auto">
              {/* Mascot with 3D tilt + pose transitions */}
              <motion.div
                style={{
                  rotateX,
                  rotateY,
                  x: translateX,
                  y: translateY,
                }}
              >
              <AnimatePresence mode="popLayout">
                  <motion.img
                    key={poseIndex}
                    src={mascotPoses[poseIndex]}
                    alt="Pingo - Mascote do Alô Médico"
                    className="w-full h-auto drop-shadow-2xl"
                    initial={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
                    animate={{
                      opacity: 1,
                      scale: isHovered ? 1.05 : 1,
                      filter: "blur(0px)",
                    }}
                    exit={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    whileTap={{ scale: 0.95 }}
                  />
                </AnimatePresence>
              </motion.div>

              {/* Floating card 1 */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 right-0 bg-card rounded-2xl shadow-card p-4 border border-border"
                whileHover={{ scale: 1.1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-medical-green-light flex items-center justify-center">
                    <Shield className="w-5 h-5 text-medical-green" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">100% Seguro</p>
                    <p className="text-xs text-muted-foreground">Criptografia end-to-end</p>
                  </div>
                </div>
              </motion.div>


              {/* Speech bubble on hover */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={isHovered ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shadow-lg"
              >
                Olá! Como posso ajudar? 👋
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
