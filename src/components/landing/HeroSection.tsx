import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, Star, Phone, Mail, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import heroDoctor from "@/assets/hero-doctor.png";

const HeroSection = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/paciente");
  };

  return (
    <section aria-label="Início" className="relative min-h-[90vh] lg:min-h-screen flex items-center pt-24 sm:pt-20 overflow-hidden">
      {/* Decorative golden circles */}
      <div className="absolute top-20 right-[-100px] w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-[-50px] w-[300px] h-[300px] rounded-full bg-primary/8 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — Text + Doctor Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-tight text-foreground mb-6">
              Emagreça com{" "}
              <span className="text-primary">acompanhamento médico especializado</span>{" "}
              e resultados duradouros.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
              Conectamos você aos melhores profissionais de saúde por videochamada. 
              Consultas rápidas, seguras e com receita digital válida em todo o Brasil.
            </p>

            {/* Doctor image on mobile/tablet */}
            <div className="relative w-full max-w-md mx-auto lg:mx-0 mb-8">
              <div className="relative overflow-hidden rounded-3xl">
                <img
                  src={heroDoctor}
                  alt="Médico especialista"
                  className="w-full h-auto object-cover"
                  loading="eager"
                />
                {/* Floating trust badges */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-4 left-4 right-4 flex gap-3"
                >
                  {[
                    { icon: Shield, text: "100% Seguro" },
                    { icon: Clock, text: "Consulta rápida" },
                    { icon: Star, text: "4.9 estrelas" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card/90 backdrop-blur-sm border border-border/50 shadow-card"
                    >
                      <item.icon className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-xs font-semibold text-foreground">{item.text}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Right — Lead Capture Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="bg-card rounded-3xl border border-border shadow-elevated p-8 lg:p-10 max-w-md mx-auto lg:mx-0 lg:ml-auto">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-2">Preencha o formulário abaixo e inicie a</p>
                <h2 className="text-2xl font-bold text-foreground">
                  sua <span className="text-primary">transformação</span> em sua vida
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Seu melhor e-mail"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    placeholder="Seu telefone com DDD"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-hero hover:opacity-90 text-primary-foreground rounded-xl py-4 text-base font-bold shadow-lg group"
                >
                  Enviar
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </form>

              <p className="text-[11px] text-muted-foreground text-center mt-4 leading-relaxed">
                Ao enviar, você concorda com nossos termos de uso e política de privacidade.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
