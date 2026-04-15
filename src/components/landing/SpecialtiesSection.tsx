import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CaretDown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

import pingoClinicoGeral from "@/assets/pingo-clinico-geral.png";
import pingoDermatologista from "@/assets/pingo-dermatologista.png";
import pingoGinecologista from "@/assets/pingo-ginecologista.png";
import pingoOrtopedista from "@/assets/pingo-ortopedista.png";
import pingoCardiologista from "@/assets/pingo-cardiologista.png";
import pingoPediatra from "@/assets/pingo-pediatra.png";
import pingoPsiquiatra from "@/assets/pingo-psiquiatra.png";
import pingoNeurologista from "@/assets/pingo-neurologista.png";
import pingoOftalmologista from "@/assets/pingo-oftalmologista.png";
import pingoEndocrinologista from "@/assets/pingo-endocrinologista.png";
import pingoUrologista from "@/assets/pingo-urologista.png";
import pingoGastroenterologista from "@/assets/pingo-gastroenterologista.png";

import pingoAcupunturista from "@/assets/pingo-acupunturista.png";
import pingoAnestesiologista from "@/assets/pingo-anestesiologista.png";
import pingoCirurgiaoGI from "@/assets/pingo-cirurgiao-gi.png";
import pingoCirurgiaoGeral from "@/assets/pingo-cirurgiao-geral.png";
import pingoCirurgiaoOnco from "@/assets/pingo-cirurgiao-onco.png";
import pingoCirurgiaoPlastico from "@/assets/pingo-cirurgiao-plastico.png";
import pingoCirurgiaoVascular from "@/assets/pingo-cirurgiao-vascular.png";
import pingoCirurgiaoDentista from "@/assets/pingo-cirurgiao-dentista.png";
import pingoClinicaMedica from "@/assets/pingo-clinica-medica.png";
import pingoFisiatra from "@/assets/pingo-fisiatra.png";
import pingoFisioterapeuta from "@/assets/pingo-fisioterapeuta.png";
import pingoFonoaudiologo from "@/assets/pingo-fonoaudiologo.png";
import pingoGeriatra from "@/assets/pingo-geriatra.png";
import pingoHomeopata from "@/assets/pingo-homeopata.png";
import pingoInfectologista from "@/assets/pingo-infectologista.png";
import pingoMedicoFamilia from "@/assets/pingo-medico-familia.png";

// Reuse some icons for remaining specialties that don't have unique ones yet
const topSpecialties = [
  { name: "Clínico geral", img: pingoClinicoGeral },
  { name: "Dermatologista", img: pingoDermatologista },
  { name: "Ginecologista-obstetra", img: pingoGinecologista },
  { name: "Ortopedista", img: pingoOrtopedista },
  { name: "Cardiologista", img: pingoCardiologista },
  { name: "Pediatra", img: pingoPediatra },
  { name: "Psiquiatra", img: pingoPsiquiatra },
  { name: "Neurologista", img: pingoNeurologista },
  { name: "Oftalmologista", img: pingoOftalmologista },
  { name: "Endocrinologista", img: pingoEndocrinologista },
  { name: "Urologista", img: pingoUrologista },
  { name: "Gastroenterologista", img: pingoGastroenterologista },
];

const moreSpecialties = [
  { name: "Acupunturista", img: pingoAcupunturista },
  { name: "Anestesiologista", img: pingoAnestesiologista },
  { name: "Cirurgião gastrointestinal", img: pingoCirurgiaoGI },
  { name: "Cirurgião geral", img: pingoCirurgiaoGeral },
  { name: "Cirurgião oncológico", img: pingoCirurgiaoOnco },
  { name: "Cirurgião plástico", img: pingoCirurgiaoPlastico },
  { name: "Cirurgião vascular", img: pingoCirurgiaoVascular },
  { name: "Cirurgião-dentista", img: pingoCirurgiaoDentista },
  { name: "Clínica médica", img: pingoClinicaMedica },
  { name: "Fisiatra", img: pingoFisiatra },
  { name: "Fisioterapeuta", img: pingoFisioterapeuta },
  { name: "Fonoaudiólogo", img: pingoFonoaudiologo },
  { name: "Geriatra", img: pingoGeriatra },
  { name: "Homeopata", img: pingoHomeopata },
  { name: "Infectologista", img: pingoInfectologista },
  { name: "Médico de família", img: pingoMedicoFamilia },
  { name: "Médico de tráfego", img: pingoClinicoGeral },
  { name: "Médico do trabalho", img: pingoClinicoGeral },
  { name: "Nefrologista", img: pingoUrologista },
  { name: "Nutricionista", img: pingoEndocrinologista },
  { name: "Nutrólogista", img: pingoEndocrinologista },
  { name: "Otorrinolaringologista", img: pingoFonoaudiologo },
  { name: "Pneumologista", img: pingoAnestesiologista },
  { name: "Psicólogo", img: pingoPsiquiatra },
  { name: "Reumatologista", img: pingoOrtopedista },
];

const SpecialtyCard = ({ name, img, index }: { name: string; img: string; index: number }) => {
  const navigate = useNavigate();
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-card/80 border border-border/40 hover:shadow-lg hover:border-primary/25 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      onClick={() => navigate("/dashboard/doctors")}
    >
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
        <img
          src={img}
          alt={`Pingo ${name}`}
          loading="lazy"
          width={80}
          height={80}
          className="w-full h-full object-contain"
        />
      </div>
      <span className="text-xs md:text-sm font-semibold text-foreground text-center leading-tight group-hover:text-primary transition-colors">
        {name}
      </span>
    </motion.button>
  );
};

function SpecialtiesSection() {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

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

        {/* Top 12 with Pingo icons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
          {topSpecialties.map((s, i) => (
            <SpecialtyCard key={s.name} name={s.name} img={s.img} index={i} />
          ))}
        </div>

        {/* More specialties (expandable) */}
        <AnimatePresence>
          {showAll && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
                {moreSpecialties.map((s, i) => (
                  <SpecialtyCard key={s.name} name={s.name} img={s.img} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center">
          <Button
            size="lg"
            variant="ghost"
            className="rounded-2xl h-[46px] px-6 text-sm font-bold text-primary hover:bg-primary/[0.06] transition-all group"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Ver menos especialidades" : "Ver mais especialidades"}
            <CaretDown className={`w-4 h-4 ml-1.5 transition-transform duration-300 ${showAll ? "rotate-180" : "group-hover:translate-y-0.5"}`} weight="bold" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export default memo(SpecialtiesSection);
