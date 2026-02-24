import { motion } from "framer-motion";
import { useState } from "react";
import { Heart, Brain, Bone, Eye, Baby, Stethoscope, Droplets, Sun, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import cardSpecialties from "@/assets/card-specialties.png";
import cardMultidisciplinary from "@/assets/card-multidisciplinary.png";
import cardAi from "@/assets/card-ai.png";
import cardTrained from "@/assets/card-trained.png";

const highlights = [
  { badge: "Cuidado completo", title: "Mais de 8 especialidades médicas disponíveis", image: cardSpecialties },
  { badge: "Cuidado multidisciplinar", title: "Nutricionistas, psicólogos, enfermeiros e mais.", image: cardMultidisciplinary },
  { badge: "Inteligência artificial", title: "O Pingo facilita sua utilização e garante a melhor experiência", image: cardAi },
  { badge: "Equipe capacitada", title: "Especialistas selecionados e treinados para atendimento online", image: cardTrained },
];

const specialtyGrid = [
  { icon: Heart, name: "Cardiologia", color: "bg-red-500/10 text-red-500" },
  { icon: Brain, name: "Neurologia", color: "bg-purple-500/10 text-purple-500" },
  { icon: Baby, name: "Pediatria", color: "bg-pink-500/10 text-pink-500" },
  { icon: Sun, name: "Dermatologia", color: "bg-amber-500/10 text-amber-500" },
  { icon: Bone, name: "Ortopedia", color: "bg-blue-500/10 text-blue-500" },
  { icon: Eye, name: "Oftalmologia", color: "bg-cyan-500/10 text-cyan-500" },
  { icon: Droplets, name: "Endocrinologia", color: "bg-emerald-500/10 text-emerald-500" },
  { icon: Stethoscope, name: "Clínico Geral", color: "bg-primary/10 text-primary" },
];

const SpecialtiesSection = () => {
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  return (
    <section id="especialidades" className="py-12 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 text-primary text-sm font-semibold mb-4"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            +20 especialidades
          </motion.span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3">
            Nossas <span className="text-gradient">especialidades</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Mais de 200 médicos em diversas áreas prontos para atender você.
          </p>
        </motion.div>

        {/* Specialty icon grid */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 max-w-4xl mx-auto mb-12">
          {specialtyGrid.map((spec, i) => (
            <motion.div
              key={spec.name}
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5, type: "spring", stiffness: 200 }}
              whileHover={{ y: -8, scale: 1.12 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/paciente")}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/50 shadow-card hover:shadow-elevated hover:border-primary/30 transition-all duration-300 cursor-pointer group"
            >
              <div className={`w-10 h-10 rounded-xl ${spec.color} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                <spec.icon className="w-5 h-5 transition-transform duration-300 group-hover:rotate-6" />
              </div>
              <span className="text-[10px] md:text-xs font-semibold text-foreground text-center leading-tight">{spec.name}</span>
            </motion.div>
          ))}
        </div>

        {/* Auto-scrolling highlight cards */}
        <div
          className="overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <motion.div
            className="flex gap-5"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              x: { duration: 35, repeat: Infinity, ease: "linear" },
            }}
            style={{ animationPlayState: isPaused ? "paused" : "running" }}
          >
            {[...highlights, ...highlights].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03, y: -5 }}
                transition={{ duration: 0.3 }}
                className="relative flex-shrink-0 w-72 md:w-80 h-[420px] rounded-3xl overflow-hidden group cursor-pointer"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/80" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-semibold text-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    {item.badge}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 transition-transform duration-300 group-hover:translate-y-[-4px]">
                  <h3 className="text-xl md:text-2xl font-extrabold text-white leading-tight">
                    {item.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-10"
        >
          <Button
            size="lg"
            className="bg-gradient-hero hover:opacity-90 text-primary-foreground rounded-full px-8 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 cta-shimmer group"
            onClick={() => navigate("/paciente")}
          >
            Ver todas especialidades <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default SpecialtiesSection;
