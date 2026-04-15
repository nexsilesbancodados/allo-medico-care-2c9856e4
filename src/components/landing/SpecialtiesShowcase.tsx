import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Heart, Brain, Baby, Bone, Eye, FirstAidKit, Syringe, Tooth, ArrowRight,
  Wind, Drop, Heartbeat, Skull, Leaf, Person, Virus, Ear,
  Scales, HandHeart, Dna, Pill, Lightning, Wheelchair, ChartLine,
  Stethoscope, UserCircle, Sparkle, Flask, Knife
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

import specCardiology from "@/assets/spec-cardiology.png";
import specDermatology from "@/assets/spec-dermatology.png";
import specNeurology from "@/assets/spec-neurology.png";
import specPediatrics from "@/assets/spec-pediatrics.png";
import specOrthopedics from "@/assets/spec-orthopedics.png";
import specOphthalmology from "@/assets/spec-ophthalmology.png";
import specGeneral from "@/assets/spec-general.png";
import specEndocrinology from "@/assets/spec-endocrinology.png";
import specAcupuntura from "@/assets/spec-acupuntura.png";
import specAlergia from "@/assets/spec-alergia.png";
import specAngiologia from "@/assets/spec-angiologia.png";
import specCirurgia from "@/assets/spec-cirurgia.png";
import specColoproctologia from "@/assets/spec-coloproctologia.png";
import specGastro from "@/assets/spec-gastro.png";
import specGeriatria from "@/assets/spec-geriatria.png";
import specGinecologia from "@/assets/spec-ginecologia.png";
import specHematologia from "@/assets/spec-hematologia.png";
import specInfectologia from "@/assets/spec-infectologia.png";
import specMastologia from "@/assets/spec-mastologia.png";
import specFamilia from "@/assets/spec-familia.png";
import specEsporte from "@/assets/spec-esporte.png";
import specNefrologia from "@/assets/spec-nefrologia.png";
import specNutrologia from "@/assets/spec-nutrologia.png";
import specOncologia from "@/assets/spec-oncologia.png";
import specOtorrino from "@/assets/spec-otorrino.png";
import specPneumologia from "@/assets/spec-pneumologia.png";
import specPsiquiatria from "@/assets/spec-psiquiatria.png";
import specRadiologia from "@/assets/spec-radiologia.png";
import specReumatologia from "@/assets/spec-reumatologia.png";
import specUrologia from "@/assets/spec-urologia.png";
import specAnestesiologia from "@/assets/spec-anestesiologia.png";
import specEndoscopia from "@/assets/spec-endoscopia.png";
import specGenetica from "@/assets/spec-genetica.png";
import specHomeopatia from "@/assets/spec-homeopatia.png";
import specPlastica from "@/assets/spec-plastica.png";
import specCirurgiaCardio from "@/assets/spec-cirurgia-cardio.png";
import specIntensiva from "@/assets/spec-intensiva.png";
import specCabecaPescoco from "@/assets/spec-cabeca-pescoco.png";
import specCirurgiaVascular from "@/assets/spec-cirurgia-vascular.png";

const specialties = [
  { name: "Cardiologia", icon: Heart, image: specCardiology, color: "from-rose-500/20 to-rose-500/5" },
  { name: "Neurologia", icon: Brain, image: specNeurology, color: "from-violet-500/20 to-violet-500/5" },
  { name: "Pediatria", icon: Baby, image: specPediatrics, color: "from-sky-500/20 to-sky-500/5" },
  { name: "Ortopedia", icon: Bone, image: specOrthopedics, color: "from-amber-500/20 to-amber-500/5" },
  { name: "Oftalmologia", icon: Eye, image: specOphthalmology, color: "from-emerald-500/20 to-emerald-500/5" },
  { name: "Dermatologia", icon: FirstAidKit, image: specDermatology, color: "from-pink-500/20 to-pink-500/5" },
  { name: "Clínico Geral", icon: Syringe, image: specGeneral, color: "from-primary/20 to-primary/5" },
  { name: "Endocrinologia", icon: Tooth, image: specEndocrinology, color: "from-teal-500/20 to-teal-500/5" },
  { name: "Acupuntura", icon: Sparkle, image: specAcupuntura, color: "from-orange-500/20 to-orange-500/5" },
  { name: "Alergia e Imunologia", icon: Drop, image: specAlergia, color: "from-cyan-500/20 to-cyan-500/5" },
  { name: "Angiologia", icon: Heartbeat, image: specAngiologia, color: "from-red-500/20 to-red-500/5" },
  { name: "Cirurgia Geral", icon: Knife, image: specCirurgia, color: "from-slate-500/20 to-slate-500/5" },
  { name: "Coloproctologia", icon: Stethoscope, image: specColoproctologia, color: "from-yellow-600/20 to-yellow-600/5" },
  { name: "Gastroenterologia", icon: Flask, image: specGastro, color: "from-lime-500/20 to-lime-500/5" },
  { name: "Geriatria", icon: Wheelchair, image: specGeriatria, color: "from-stone-500/20 to-stone-500/5" },
  { name: "Ginecologia e Obstetrícia", icon: HandHeart, image: specGinecologia, color: "from-fuchsia-500/20 to-fuchsia-500/5" },
  { name: "Hematologia", icon: Drop, image: specHematologia, color: "from-red-600/20 to-red-600/5" },
  { name: "Infectologia", icon: Virus, image: specInfectologia, color: "from-green-600/20 to-green-600/5" },
  { name: "Mastologia", icon: Heart, image: specMastologia, color: "from-pink-600/20 to-pink-600/5" },
  { name: "Med. Família", icon: Person, image: specFamilia, color: "from-blue-500/20 to-blue-500/5" },
  { name: "Med. do Esporte", icon: Lightning, image: specEsporte, color: "from-emerald-600/20 to-emerald-600/5" },
  { name: "Nefrologia", icon: Scales, image: specNefrologia, color: "from-indigo-500/20 to-indigo-500/5" },
  { name: "Nutrologia", icon: Leaf, image: specNutrologia, color: "from-green-500/20 to-green-500/5" },
  { name: "Oncologia", icon: Flask, image: specOncologia, color: "from-orange-600/20 to-orange-600/5" },
  { name: "Otorrinolaringologia", icon: Ear, image: specOtorrino, color: "from-purple-500/20 to-purple-500/5" },
  { name: "Pneumologia", icon: Wind, image: specPneumologia, color: "from-sky-600/20 to-sky-600/5" },
  { name: "Psiquiatria", icon: Brain, image: specPsiquiatria, color: "from-violet-600/20 to-violet-600/5" },
  { name: "Radiologia", icon: ChartLine, image: specRadiologia, color: "from-gray-500/20 to-gray-500/5" },
  { name: "Reumatologia", icon: Bone, image: specReumatologia, color: "from-amber-600/20 to-amber-600/5" },
  { name: "Urologia", icon: UserCircle, image: specUrologia, color: "from-teal-600/20 to-teal-600/5" },
  { name: "Anestesiologia", icon: Pill, image: specAnestesiologia, color: "from-cyan-600/20 to-cyan-600/5" },
  { name: "Endoscopia", icon: Eye, image: specEndoscopia, color: "from-indigo-600/20 to-indigo-600/5" },
  { name: "Genética Médica", icon: Dna, image: specGenetica, color: "from-blue-600/20 to-blue-600/5" },
  { name: "Homeopatia", icon: Leaf, image: specHomeopatia, color: "from-lime-600/20 to-lime-600/5" },
  { name: "Cirurgia Plástica", icon: Sparkle, image: specPlastica, color: "from-rose-400/20 to-rose-400/5" },
  { name: "Cir. Cardiovascular", icon: Heartbeat, image: specCirurgiaCardio, color: "from-red-700/20 to-red-700/5" },
  { name: "Med. Intensiva", icon: ChartLine, image: specIntensiva, color: "from-slate-600/20 to-slate-600/5" },
  { name: "Cir. Cabeça e Pescoço", icon: Skull, image: specCabecaPescoco, color: "from-stone-600/20 to-stone-600/5" },
  { name: "Cirurgia Vascular", icon: Heartbeat, image: specCirurgiaVascular, color: "from-red-400/20 to-red-400/5" },
];

const INITIAL_VISIBLE = 8;

function SpecialtiesShowcase() {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const visibleSpecialties = showAll ? specialties : specialties.slice(0, INITIAL_VISIBLE);

  return (
    <section className="py-16 md:py-24 overflow-hidden">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-primary/60 mb-3 block">
            Especialidades
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Mais de <span className="text-primary">{specialties.length} especialidades</span> médicas
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Encontre o especialista ideal para o seu caso em poucos cliques.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-5">
          <AnimatePresence mode="popLayout">
            {visibleSpecialties.map((spec, i) => (
              <motion.div
                key={spec.name}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i < INITIAL_VISIBLE ? i * 0.06 : (i - INITIAL_VISIBLE) * 0.03, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group cursor-pointer"
                onClick={() => navigate("/paciente")}
              >
                <div className="relative bg-card rounded-2xl border border-border/40 overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                  {/* Image */}
                  <div className={`relative h-32 sm:h-36 overflow-hidden bg-gradient-to-br ${spec.color}`}>
                    <img
                      src={spec.image}
                      alt={spec.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                      decoding="async"
                      width={512}
                      height={512}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
                    {/* Shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  </div>

                  {/* Content */}
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                      <spec.icon className="w-4 h-4 text-primary group-hover:text-primary-foreground transition-colors" weight="fill" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-foreground leading-tight">{spec.name}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-10"
        >
          {!showAll ? (
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl px-8 gap-2 font-bold border-2 hover:border-primary/30 hover:bg-primary/[0.04] group"
              onClick={() => setShowAll(true)}
            >
              Ver todas as {specialties.length} especialidades
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" weight="bold" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl px-8 gap-2 font-bold border-2 hover:border-primary/30 hover:bg-primary/[0.04] group"
              onClick={() => navigate("/paciente")}
            >
              Agendar consulta
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" weight="bold" />
            </Button>
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default memo(SpecialtiesShowcase);
