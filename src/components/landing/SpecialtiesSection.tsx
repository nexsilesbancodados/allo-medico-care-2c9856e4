import { motion } from "framer-motion";
import { useState } from "react";
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

const SpecialtiesSection = () => {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section id="especialidades" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            Nossas <span className="text-gradient">especialidades</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Mais de 200 médicos em diversas áreas prontos para atender você.
          </p>
        </motion.div>

        {/* Auto-scrolling highlight cards with hover pause */}
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
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/80" />

                {/* Badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-semibold text-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    {item.badge}
                  </span>
                </div>

                {/* Title */}
                <div className="absolute bottom-0 left-0 right-0 p-6 transition-transform duration-300 group-hover:translate-y-[-4px]">
                  <h3 className="text-xl md:text-2xl font-extrabold text-white leading-tight">
                    {item.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SpecialtiesSection;
