import { motion } from "framer-motion";
import { UserPlus, Search, Video, FileText, Clock, ArrowRight } from "lucide-react";
import howItWorksSignup from "@/assets/how-it-works-signup.png";
import howItWorksBooking from "@/assets/how-it-works-booking.png";
import howItWorksConsultation from "@/assets/how-it-works-consultation.png";
import howItWorksPrescription from "@/assets/how-it-works-prescription.png";

const steps = [
  { icon: UserPlus, title: "Cadastre-se", description: "Crie sua conta em menos de 2 minutos.", image: howItWorksSignup, time: "2 min", gradient: "from-primary to-primary/70" },
  { icon: Search, title: "Encontre seu médico", description: "Busque por especialidade ou disponibilidade.", image: howItWorksBooking, time: "1 min", gradient: "from-secondary to-secondary/70" },
  { icon: Video, title: "Consulta por vídeo", description: "Videochamada segura e em HD.", image: howItWorksConsultation, time: "15-30 min", gradient: "from-success to-emerald-400" },
  { icon: FileText, title: "Receba sua receita", description: "Receita digital válida na hora.", image: howItWorksPrescription, time: "Instantâneo", gradient: "from-warning to-orange-400" },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 text-primary text-sm font-semibold mb-4"
          >
            <Clock className="w-3.5 h-3.5" />
            Menos de 5 minutos
          </motion.span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Como <span className="text-gradient">funciona</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Em 4 passos simples, acesse médicos especialistas sem sair de casa.
          </p>
        </motion.div>

        {/* Desktop: horizontal compact cards */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5, type: "spring", stiffness: 80 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative group"
            >
              {/* Connector */}
              {i < steps.length - 1 && (
                <motion.div
                  className="absolute top-1/2 -right-2 z-20 hidden lg:flex"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 + 0.5 }}
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-primary" />
                  </div>
                </motion.div>
              )}

              <div className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:shadow-primary/[0.06] hover:border-primary/20 transition-all duration-300 h-full">
                {/* Step number */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white text-xs font-extrabold shadow-md`}>
                      {i + 1}
                    </span>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Passo {i + 1}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                    <Clock className="w-2.5 h-2.5" />
                    {step.time}
                  </span>
                </div>

                {/* Image */}
                <div className="w-full h-28 rounded-xl overflow-hidden bg-muted mb-4 group-hover:shadow-md transition-shadow">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>

                {/* Icon + text */}
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-2.5 shadow-sm`}>
                  <step.icon className="w-4 h-4 text-white" />
                </div>

                <h3 className="text-sm font-bold text-foreground mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: vertical timeline */}
        <div className="lg:hidden relative">
          <motion.div
            className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-secondary/20 to-transparent"
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
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative flex gap-4 pl-2"
              >
                <motion.div
                  className={`relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shrink-0 shadow-lg`}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 + 0.1, type: "spring", stiffness: 300 }}
                >
                  <span className="text-white font-extrabold text-sm">{i + 1}</span>
                </motion.div>

                <div className="flex-1 bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${step.gradient} flex items-center justify-center`}>
                        <step.icon className="w-3.5 h-3.5 text-white" />
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
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-10 text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" />
            <strong className="text-foreground">~18 min</strong> do cadastro à receita
          </span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span>100% online</span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span>Sem necessidade de download</span>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
