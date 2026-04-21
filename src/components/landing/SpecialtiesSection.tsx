import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CaretDown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import OptimizedImage from "@/components/ui/optimized-image";

import specClinicoGeral from "@/assets/spec-clinico-geral.png";
import specDermatologista from "@/assets/spec-dermatologista.png";
import specGinecologista from "@/assets/spec-ginecologista.png";
import specOrtopedista from "@/assets/spec-ortopedista.png";
import specCardiologista from "@/assets/spec-cardiologista.png";
import specPediatra from "@/assets/spec-pediatra.png";
import specPsiquiatra from "@/assets/spec-psiquiatra.png";
import specNeurologista from "@/assets/spec-neurologista.png";
import specOftalmologista from "@/assets/spec-oftalmologista.png";
import specEndocrinologista from "@/assets/spec-endocrinologista.png";
import specUrologista from "@/assets/spec-urologista.png";
import specGastroenterologista from "@/assets/spec-gastroenterologista.png";

import specAcupunturista from "@/assets/spec-acupunturista.png";
import specAnestesiologista from "@/assets/spec-anestesiologista.png";
import specCirurgiaoGeral from "@/assets/spec-cirurgiao-geral.png";
import specCirurgiaoOnco from "@/assets/spec-cirurgiao-onco.png";
import specCirurgiaoPlastico from "@/assets/spec-cirurgiao-plastico.png";
import specCirurgiaoVascular from "@/assets/spec-cirurgiao-vascular.png";
import specClinicaMedica from "@/assets/spec-clinico-geral.png";
import specGeriatra from "@/assets/spec-geriatra.png";
import specHomeopata from "@/assets/spec-homeopata.png";
import specInfectologista from "@/assets/spec-infectologista.png";
import specMedicoFamilia from "@/assets/spec-medico-familia.png";
import specNefrologia from "@/assets/spec-nefrologia.png";
import specNutricionista from "@/assets/spec-nutricionista.png";
import specOtorrino from "@/assets/spec-otorrino.png";
import specPneumologista from "@/assets/spec-pneumologista.png";
import specReumatologista from "@/assets/spec-reumatologista.png";

// Reuse some icons for remaining specialties that don't have unique ones yet
const topSpecialties = [
  { name: "Clínico geral", img: specClinicoGeral },
  { name: "Dermatologista", img: specDermatologista },
  { name: "Ginecologista-obstetra", img: specGinecologista },
  { name: "Ortopedista", img: specOrtopedista },
  { name: "Cardiologista", img: specCardiologista },
  { name: "Pediatra", img: specPediatra },
  { name: "Psiquiatra", img: specPsiquiatra },
  { name: "Neurologista", img: specNeurologista },
  { name: "Oftalmologista", img: specOftalmologista },
  { name: "Endocrinologista", img: specEndocrinologista },
  { name: "Urologista", img: specUrologista },
  { name: "Gastroenterologista", img: specGastroenterologista },
];

const moreSpecialties = [
  { name: "Acupunturista", img: specAcupunturista },
  { name: "Anestesiologista", img: specAnestesiologista },
  { name: "Cirurgião geral", img: specCirurgiaoGeral },
  { name: "Cirurgião oncológico", img: specCirurgiaoOnco },
  { name: "Cirurgião plástico", img: specCirurgiaoPlastico },
  { name: "Cirurgião vascular", img: specCirurgiaoVascular },
  { name: "Clínica médica", img: specClinicaMedica },
  { name: "Geriatra", img: specGeriatra },
  { name: "Homeopata", img: specHomeopata },
  { name: "Infectologista", img: specInfectologista },
  { name: "Médico de família", img: specMedicoFamilia },
  { name: "Médico de tráfego", img: specClinicoGeral },
  { name: "Médico do trabalho", img: specClinicoGeral },
  { name: "Nefrologista", img: specNefrologia },
  { name: "Nutricionista", img: specNutricionista },
  { name: "Nutrólogo", img: specNutricionista },
  { name: "Otorrinolaringologista", img: specOtorrino },
  { name: "Pneumologista", img: specPneumologista },
  { name: "Psicólogo", img: specPsiquiatra },
  { name: "Reumatologista", img: specReumatologista },
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
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
        <OptimizedImage
          src={img}
          alt={`Pingo ${name}`}
          width={80}
          height={80}
          className="w-full h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-300"
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

        {/* Top 12 with Dr. Lila icons */}
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
