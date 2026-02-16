import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Video, Shield, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
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

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground mb-6">
              Sua saúde a um{" "}
              <span className="text-gradient">clique de distância</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
              Conecte-se com médicos especialistas de qualquer lugar. Consultas por
              vídeo, receitas digitais e acompanhamento completo — tudo na palma da
              sua mão.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Button size="lg" className="bg-gradient-hero hover:opacity-90 transition-opacity text-base px-8" onClick={() => navigate("/paciente")}>
                Agendar Consulta
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="secondary" className="text-base px-8" onClick={() => navigate("/consulta-avulsa")}>
                Consulta Avulsa
              </Button>
              <Button size="lg" variant="outline" className="text-base" onClick={() => navigate("/medico")}>
                Sou Médico
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

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Main card */}
              <div className="absolute inset-8 rounded-3xl bg-gradient-hero shadow-elevated flex items-center justify-center">
                <div className="text-center text-primary-foreground">
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <Video className="w-10 h-10" />
                  </div>
                  <p className="text-xl font-bold">Consulta ao Vivo</p>
                  <p className="text-sm opacity-80 mt-1">Dr. Ana Santos — Cardiologista</p>
                </div>
              </div>

              {/* Floating card 1 */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 right-0 bg-card rounded-2xl shadow-card p-4 border border-border"
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

              {/* Floating card 2 */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-4 left-0 bg-card rounded-2xl shadow-card p-4 border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-medical-blue-light flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Próxima consulta</p>
                    <p className="text-xs text-muted-foreground">Hoje, 14:30</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
