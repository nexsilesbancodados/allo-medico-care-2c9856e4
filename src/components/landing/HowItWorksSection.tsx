import { motion } from "framer-motion";
import { UserPlus, Search, Video, FileText, Clock } from "lucide-react";
import howItWorksSignup from "@/assets/how-it-works-signup.png";
import howItWorksBooking from "@/assets/how-it-works-booking.png";
import howItWorksConsultation from "@/assets/how-it-works-consultation.png";
import howItWorksPrescription from "@/assets/how-it-works-prescription.png";

const steps = [
  { icon: UserPlus, title: "Cadastre-se", description: "Crie sua conta em menos de 2 minutos.", image: howItWorksSignup, time: "2 min" },
  { icon: Search, title: "Encontre seu médico", description: "Busque por especialidade ou disponibilidade.", image: howItWorksBooking, time: "1 min" },
  { icon: Video, title: "Consulta por vídeo", description: "Videochamada segura e em HD.", image: howItWorksConsultation, time: "15-30 min" },
  { icon: FileText, title: "Receba sua receita", description: "Receita digital válida na hora.", image: howItWorksPrescription, time: "Instantâneo" },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/[0.06] border border-primary/10 text-primary text-sm font-semibold mb-4">
            <Clock className="w-3.5 h-3.5" />
            Menos de 5 minutos
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Como funciona
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Em 4 passos simples, acesse médicos especialistas sem sair de casa.
          </p>
        </motion.div>

        {/* Desktop: horizontal cards with connector line */}
        <div className="hidden lg:block relative">
          {/* Connector line */}
          <div className="absolute top-[4.5rem] left-[12%] right-[12%] h-px bg-border/60 z-0" />
          
          <div className="grid lg:grid-cols-4 gap-6 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="group"
              >
                <div className="bg-card rounded-2xl border border-border/50 p-6 hover:shadow-elevated hover:border-primary/15 transition-all duration-300 h-full">
                  {/* Step number + time */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/[0.08] flex items-center justify-center">
                      <span className="text-sm font-extrabold text-primary">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                      <Clock className="w-2.5 h-2.5" />
                      {step.time}
                    </span>
                  </div>

                  {/* Image */}
                  <div className="w-full h-32 rounded-xl overflow-hidden bg-muted/30 mb-5">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Icon + text */}
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <step.icon className="w-4 h-4 text-primary" />
                  </div>

                  <h3 className="text-base font-bold text-foreground mb-1.5">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="lg:hidden relative">
          <motion.div
            className="absolute left-6 top-0 bottom-0 w-px bg-border/60"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ originY: 0 }}
          />

          <div className="space-y-5">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="relative flex gap-4 pl-2"
              >
                <motion.div
                  className="relative z-10 w-12 h-12 rounded-xl bg-primary/[0.08] border border-primary/10 flex items-center justify-center shrink-0"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.1, type: "spring", stiffness: 300 }}
                >
                  <span className="text-sm font-extrabold text-primary">{String(i + 1).padStart(2, '0')}</span>
                </motion.div>

                <div className="flex-1 bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <step.icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                      <Clock className="w-2.5 h-2.5" />
                      {step.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-12 text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" />
            <strong className="text-foreground">~18 min</strong> do cadastro à receita
          </span>
          <span className="hidden sm:inline text-border">•</span>
          <span>100% online</span>
          <span className="hidden sm:inline text-border">•</span>
          <span>Sem necessidade de download</span>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
