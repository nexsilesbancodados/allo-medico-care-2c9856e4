import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import avatarMaria from "@/assets/avatar-maria.png";
import avatarCarlos from "@/assets/avatar-carlos.png";
import avatarAna from "@/assets/avatar-ana.png";

const testimonials = [
  { name: "Maria Silva", role: "Paciente", text: "Consegui uma consulta com cardiologista em menos de 1 hora. A receita chegou digital na hora. Incrível!", rating: 5, avatar: avatarMaria },
  { name: "Dr. Carlos Mendes", role: "Clínico Geral", text: "A plataforma facilitou muito meu dia a dia. Atendo de casa com a mesma qualidade do consultório.", rating: 5, avatar: avatarCarlos },
  { name: "Ana Costa", role: "Paciente", text: "Com o plano mensal, cuido da saúde de toda minha família sem sair de casa. Vale cada centavo.", rating: 5, avatar: avatarAna },
];

const TestimonialsSection = () => {
  return (
    <section id="depoimentos" className="py-12 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3">
            O que dizem sobre a{" "}
            <span className="text-gradient">AloClinica</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Milhares de pacientes e médicos já confiam na nossa plataforma.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, rotateX: 5 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6, type: "spring", stiffness: 80 }}
              whileHover={{
                y: -8,
                boxShadow: "0 20px 40px -12px hsl(210 90% 45% / 0.15)",
                transition: { duration: 0.25 },
              }}
              className="bg-card rounded-2xl p-6 border border-border shadow-card transition-colors duration-300 hover:border-primary/30 cursor-default"
            >
              <Quote className="w-8 h-8 text-primary/30 mb-4" />

              <p className="text-foreground mb-6 leading-relaxed">"{t.text}"</p>

              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <motion.div
                    key={j}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 + j * 0.08 + 0.3 }}
                  >
                    <Star className="w-4 h-4 fill-medical-green text-medical-green" />
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/10"
                />
                <div>
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
