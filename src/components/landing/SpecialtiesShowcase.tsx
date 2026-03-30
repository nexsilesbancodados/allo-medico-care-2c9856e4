import { memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, Brain, Baby, Bone, Eye, FirstAidKit, Syringe, Tooth, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

import specCardiology from "@/assets/spec-cardiology.png";
import specDermatology from "@/assets/spec-dermatology.png";
import specNeurology from "@/assets/spec-neurology.png";
import specPediatrics from "@/assets/spec-pediatrics.png";
import specOrthopedics from "@/assets/spec-orthopedics.png";
import specOphthalmology from "@/assets/spec-ophthalmology.png";
import specGeneral from "@/assets/spec-general.png";
import specEndocrinology from "@/assets/spec-endocrinology.png";

const specialties = [
  { name: "Cardiologia", icon: Heart, image: specCardiology, color: "from-rose-500/20 to-rose-500/5" },
  { name: "Neurologia", icon: Brain, image: specNeurology, color: "from-violet-500/20 to-violet-500/5" },
  { name: "Pediatria", icon: Baby, image: specPediatrics, color: "from-sky-500/20 to-sky-500/5" },
  { name: "Ortopedia", icon: Bone, image: specOrthopedics, color: "from-amber-500/20 to-amber-500/5" },
  { name: "Oftalmologia", icon: Eye, image: specOphthalmology, color: "from-emerald-500/20 to-emerald-500/5" },
  { name: "Dermatologia", icon: FirstAidKit, image: specDermatology, color: "from-pink-500/20 to-pink-500/5" },
  { name: "Clínica Geral", icon: Syringe, image: specGeneral, color: "from-primary/20 to-primary/5" },
  { name: "Endocrinologia", icon: Tooth, image: specEndocrinology, color: "from-teal-500/20 to-teal-500/5" },
];

function SpecialtiesShowcase() {
  const navigate = useNavigate();

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
            Mais de <span className="text-primary">30 especialidades</span> médicas
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Encontre o especialista ideal para o seu caso em poucos cliques.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-5">
          {specialties.map((spec, i) => (
            <motion.div
              key={spec.name}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
                  <span className="text-sm font-bold text-foreground">{spec.name}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-10"
        >
          <Button
            variant="outline"
            size="lg"
            className="rounded-2xl px-8 gap-2 font-bold border-2 hover:border-primary/30 hover:bg-primary/[0.04] group"
            onClick={() => navigate("/paciente")}
          >
            Ver todas as especialidades
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" weight="bold" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export default memo(SpecialtiesShowcase);
