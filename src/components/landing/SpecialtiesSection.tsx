import { motion } from "framer-motion";
import specCardiology from "@/assets/spec-cardiology.png";
import specNeurology from "@/assets/spec-neurology.png";
import specOphthalmology from "@/assets/spec-ophthalmology.png";
import specOrthopedics from "@/assets/spec-orthopedics.png";
import specPediatrics from "@/assets/spec-pediatrics.png";
import specGeneral from "@/assets/spec-general.png";
import specDermatology from "@/assets/spec-dermatology.png";
import specEndocrinology from "@/assets/spec-endocrinology.png";

const specialties = [
  { image: specCardiology, name: "Cardiologia", doctors: 24 },
  { image: specNeurology, name: "Neurologia", doctors: 18 },
  { image: specOphthalmology, name: "Oftalmologia", doctors: 15 },
  { image: specOrthopedics, name: "Ortopedia", doctors: 21 },
  { image: specPediatrics, name: "Pediatria", doctors: 30 },
  { image: specGeneral, name: "Clínico Geral", doctors: 45 },
  { image: specDermatology, name: "Dermatologia", doctors: 19 },
  { image: specEndocrinology, name: "Endocrinologia", doctors: 12 },
];

const SpecialtiesSection = () => {
  return (
    <section id="especialidades" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            Nossas <span className="text-gradient">especialidades</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Mais de 200 médicos em diversas áreas prontos para atender você.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {specialties.map((spec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-card transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden mb-4">
                <img src={spec.image} alt={spec.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-foreground mb-1">{spec.name}</h3>
              <p className="text-sm text-muted-foreground">{spec.doctors} médicos</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpecialtiesSection;
