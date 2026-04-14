import { memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Stethoscope, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const specialties = [
  "Acupunturista", "Anestesiologista", "Cardiologista", "Cirurgião gastrointestinal",
  "Cirurgião geral", "Cirurgião oncológico", "Cirurgião plástico", "Cirurgião vascular",
  "Cirurgião-dentista", "Clínica médica", "Clínico geral", "Dermatologista",
  "Endocrinopediatra", "Fisiatra", "Fisioterapeuta", "Fonoaudiólogo",
  "Gastroenterologista", "Geriatra", "Ginecologista-obstetra", "Homeopata",
  "Infectologista", "Médico de família", "Médico de tráfego", "Médico do trabalho",
  "Nefrologista", "Neurologista", "Nutricionista", "Nutrólogista",
  "Oftalmologista", "Ortopedista", "Otorrinolaringologista", "Pediatra",
  "Pneumologista", "Psicólogo", "Psiquiatra", "Reumatologista", "Urologista",
];

function SpecialtiesSection() {
  const navigate = useNavigate();

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-muted/30 to-background" />
      <div className="absolute top-[20%] left-[-8%] w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[160px] -z-10" />
      <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] bg-secondary/[0.04] rounded-full blur-[120px] -z-10" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-primary/60 mb-3 block">
            Especialidades
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Especialidades <span className="text-gradient">mais buscadas</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Selecione a especialidade para ver os profissionais disponíveis para agendamento.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-12">
          {specialties.map((name, i) => (
            <motion.button
              key={name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.02, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="group flex items-center justify-center gap-2 px-3 py-4 rounded-2xl bg-card/80 border border-border/40 hover:shadow-lg hover:border-primary/25 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              onClick={() => navigate("/dashboard/doctors")}
            >
              <Stethoscope className="w-4 h-4 text-primary/50 group-hover:text-primary shrink-0 transition-colors" weight="fill" />
              <span className="text-xs md:text-sm font-semibold text-foreground text-center leading-tight group-hover:text-primary transition-colors">
                {name}
              </span>
            </motion.button>
          ))}
        </div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Button
            size="lg"
            variant="outline"
            className="rounded-2xl h-[50px] px-8 text-sm font-bold border-2 hover:border-primary/30 hover:bg-primary/[0.04] transition-all group"
            onClick={() => navigate("/dashboard/doctors")}
          >
            Ver todos os especialistas
            <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" weight="bold" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export default memo(SpecialtiesSection);
