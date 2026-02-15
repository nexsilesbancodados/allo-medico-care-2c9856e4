import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Maria Silva",
    role: "Paciente",
    text: "Consegui uma consulta com cardiologista em menos de 1 hora. A receita chegou digital na hora. Incrível!",
    rating: 5,
  },
  {
    name: "Dr. Carlos Mendes",
    role: "Clínico Geral",
    text: "A plataforma facilitou muito meu dia a dia. Atendo de casa com a mesma qualidade do consultório.",
    rating: 5,
  },
  {
    name: "Ana Costa",
    role: "Paciente",
    text: "Com o plano mensal, cuido da saúde de toda minha família sem sair de casa. Vale cada centavo.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section id="depoimentos" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            O que dizem sobre a{" "}
            <span className="text-gradient">Alô Médico</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Milhares de pacientes e médicos já confiam na nossa plataforma.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border shadow-card"
            >
              <Quote className="w-8 h-8 text-medical-blue-light mb-4" />

              <p className="text-foreground mb-6 leading-relaxed">"{t.text}"</p>

              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-medical-green text-medical-green" />
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
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
