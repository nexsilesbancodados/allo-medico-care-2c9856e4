import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence, useScroll } from "framer-motion";
import { Video, Shield, Clock, ArrowRight, Stethoscope, CalendarCheck } from "lucide-react";
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
    highlight: "AloClinica",
    description: "Cuidamos de você e da sua família com carinho e tecnologia. Atendimento humanizado na palma da sua mão.",
  },
  {
    title: "Receitas e laudos",
    highlight: "100% digitais",
    description: "Receba prescrições, atestados e laudos médicos direto no seu celular. Tudo organizado e acessível.",
  },
];

const recentBookings = [
  { name: "Maria S.", specialty: "Cardiologia", time: "agora" },
  { name: "João P.", specialty: "Dermatologia", time: "2 min atrás" },
  { name: "Ana L.", specialty: "Pediatria", time: "5 min atrás" },
  { name: "Carlos R.", specialty: "Ortopedia", time: "8 min atrás" },
];

// Animated counter hook
const useAnimatedCounter = (end: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return count;
};

const HeroSection = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [poseIndex, setPoseIndex] = useState(0);
  const [doctorsOnline, setDoctorsOnline] = useState(23);
  const [bookingIndex, setBookingIndex] = useState(0);
  const [showBookingNotif, setShowBookingNotif] = useState(false);

  const consultationsCount = useAnimatedCounter(12500, 2500);
  const satisfactionCount = useAnimatedCounter(98, 2000);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Parallax on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const parallaxScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.92]);
  const bgParallax = useTransform(scrollYProgress, [0, 1], [0, 60]);

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

  // Fluctuating doctors online
  useEffect(() => {
    const timer = setInterval(() => {
      setDoctorsOnline(prev => Math.max(15, Math.min(40, prev + Math.floor(Math.random() * 5) - 2)));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Recent booking notification cycle
  useEffect(() => {
    const showNext = () => {
      setShowBookingNotif(true);
      setTimeout(() => {
        setShowBookingNotif(false);
        setTimeout(() => {
          setBookingIndex(prev => (prev + 1) % recentBookings.length);
        }, 500);
      }, 4000);
    };

    const initialDelay = setTimeout(showNext, 3000);
    const interval = setInterval(showNext, 8000);
    return () => { clearTimeout(initialDelay); clearInterval(interval); };
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

  const currentBooking = recentBookings[bookingIndex];

  return (
    <section ref={sectionRef} aria-label="Início" className="relative min-h-[85vh] sm:min-h-[90vh] lg:min-h-screen flex items-center pt-20 sm:pt-24 overflow-hidden">
      {/* Floating particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary/15 pointer-events-none"
          style={{
            width: `${6 + (i % 3) * 4}px`,
            height: `${6 + (i % 3) * 4}px`,
            left: `${10 + i * 11}%`,
            top: `${15 + (i % 4) * 20}%`,
            y: bgParallax,
          }}
          animate={{
            y: [0, -25 - i * 3, 0],
            x: [0, (i % 2 === 0 ? 12 : -12), 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ duration: 5 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
        />
      ))}

      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          style={{ y: bgParallax }}
          className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-medical-blue-light opacity-60 blur-3xl"
          animate={{ scale: [1, 1.08, 1], x: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{ y: bgParallax }}
          className="absolute bottom-20 left-0 w-[400px] h-[400px] rounded-full bg-medical-green-light opacity-60 blur-3xl"
          animate={{ scale: [1, 1.12, 1], x: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[100px]"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)" }}
          animate={{ scale: [0.8, 1.1, 0.8], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Recent booking notification toast */}
      <AnimatePresence>
        {showBookingNotif && (
          <motion.div
            initial={{ opacity: 0, x: -60, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="fixed bottom-24 left-4 z-30 bg-card/95 backdrop-blur-xl rounded-2xl shadow-elevated border border-border/60 p-3.5 flex items-center gap-3 max-w-xs md:bottom-8 md:left-8"
          >
            <div className="w-9 h-9 rounded-xl bg-medical-green/10 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-4.5 h-4.5 text-medical-green" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{currentBooking.name} agendou</p>
              <p className="text-[10px] text-muted-foreground">{currentBooking.specialty} · {currentBooking.time}</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-medical-green animate-pulse shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text with parallax */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ y: parallaxY, scale: parallaxScale }}
          >
            {/* Live doctors badge */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-medical-blue-light text-primary text-sm font-medium">
                <Video className="w-4 h-4" />
                Consultas por videochamada
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-medical-green/10 text-medical-green text-xs font-semibold"
              >
                <span className="w-2 h-2 rounded-full bg-medical-green animate-pulse" />
                <Stethoscope className="w-3 h-3" />
                <motion.span
                  key={doctorsOnline}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {doctorsOnline} médicos online
                </motion.span>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={poseIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
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

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <Button
                size="lg"
                className="bg-gradient-hero hover:opacity-90 text-primary-foreground rounded-full px-6 relative overflow-hidden group h-12 sm:h-11 text-base sm:text-sm cta-shimmer"
                onClick={() => navigate("/paciente")}
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
              >
                Consulta Avulsa
              </Button>
            </div>

            {/* Stats counters */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex items-center gap-6 mb-4"
            >
              <div className="text-left">
                <p className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  {consultationsCount.toLocaleString("pt-BR")}+
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">Consultas realizadas</p>
              </div>
              <div className="w-px h-8 bg-border/60" />
              <div className="text-left">
                <p className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  {satisfactionCount}%
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">Satisfação dos pacientes</p>
              </div>
            </motion.div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6">
              {[
                { icon: Shield, text: "Dados protegidos" },
                { icon: Clock, text: "Atendimento 24h" },
                { icon: Video, text: "Vídeo em HD" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <item.icon className="w-4 h-4 text-medical-green" />
                  {item.text}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Interactive Mascot with pose cycling */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative cursor-pointer"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{ perspective: 800 }}
          >
            <div className="relative w-full max-w-[180px] sm:max-w-[240px] md:max-w-sm lg:max-w-lg mx-auto">
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
                    alt="Pingo - Mascote do AloClinica"
                    className="w-full h-auto drop-shadow-2xl"
                    loading="eager"
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

              {/* Floating card 1 — glassmorphism */}
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 1, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 right-0 backdrop-blur-xl bg-card/80 rounded-2xl shadow-elevated p-4 border border-border/50 hidden md:flex"
                whileHover={{ scale: 1.12, boxShadow: "0 20px 50px -12px hsl(var(--primary) / 0.25)" }}
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

              {/* Floating card 2 — doctors online */}
              <motion.div
                animate={{ y: [0, 8, 0], rotate: [0, -1, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-8 left-0 backdrop-blur-xl bg-card/80 rounded-2xl shadow-elevated p-3 border border-border/50 hidden md:flex items-center gap-2.5"
                whileHover={{ scale: 1.08 }}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-medical-green animate-pulse" />
                    {doctorsOnline} online agora
                  </p>
                  <p className="text-[10px] text-muted-foreground">Prontos para atender</p>
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
