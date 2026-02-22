import { motion } from "framer-motion";
import { UserPlus, Search, Video, FileText } from "lucide-react";
import howItWorksSignup from "@/assets/how-it-works-signup.png";
import howItWorksBooking from "@/assets/how-it-works-booking.png";
import howItWorksConsultation from "@/assets/how-it-works-consultation.png";
import howItWorksPrescription from "@/assets/how-it-works-prescription.png";

const steps = [
  { icon: UserPlus, title: "Cadastre-se", description: "Crie sua conta em menos de 2 minutos com dados básicos.", image: howItWorksSignup },
  { icon: Search, title: "Encontre seu médico", description: "Busque por especialidade, avaliação ou disponibilidade.", image: howItWorksBooking },
  { icon: Video, title: "Consulta por vídeo", description: "Conecte-se com seu médico em videochamada segura e em HD.", image: howItWorksConsultation },
  { icon: FileText, title: "Receba sua receita", description: "Receita digital válida enviada diretamente para você.", image: howItWorksPrescription },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-12 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3">
            Como <span className="text-gradient">funciona</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Em 4 passos simples, você tem acesso a médicos especialistas sem sair de casa.
          </p>
        </motion.div>

        {/* Desktop: horizontal */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5, type: "spring", stiffness: 80 }}
              whileHover={{ y: -8, transition: { duration: 0.25 } }}
              className="relative text-center group cursor-default"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <motion.div
                  className="absolute top-10 left-[60%] w-[80%] h-px border-t-2 border-dashed border-primary/20"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 + 0.3, duration: 0.6 }}
                  style={{ originX: 0 }}
                />
              )}

              <div className="w-20 h-20 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-5 shadow-card overflow-hidden transition-all duration-300 group-hover:shadow-elevated group-hover:scale-105">
                {step.image ? (
                  <img src={step.image} alt={step.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <step.icon className="w-9 h-9 text-primary-foreground" />
                )}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 + 0.3 }}
              >
                <div className="text-xs font-bold text-primary mb-2">PASSO {i + 1}</div>
                <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Mobile/Tablet: vertical timeline */}
        <div className="lg:hidden relative">
          {/* Timeline line */}
          <motion.div
            className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ originY: 0 }}
          />

          <div className="space-y-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="relative flex gap-4 pl-2"
              >
                {/* Timeline dot */}
                <motion.div
                  className="relative z-10 w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shrink-0 shadow-card overflow-hidden"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 + 0.1, type: "spring", stiffness: 300 }}
                >
                  {step.image ? (
                    <img src={step.image} alt={step.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <step.icon className="w-5 h-5 text-primary-foreground" />
                  )}
                </motion.div>

                <div className="flex-1 bg-card rounded-2xl border border-border p-4 shadow-card">
                  <div className="text-[10px] font-bold text-primary mb-1 uppercase tracking-wider">Passo {i + 1}</div>
                  <h3 className="text-base font-bold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
