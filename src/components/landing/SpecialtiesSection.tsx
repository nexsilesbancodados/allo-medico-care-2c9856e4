import { motion } from "framer-motion";
import { Heart, Brain, Eye, Bone, Baby, Stethoscope, Pill, Activity } from "lucide-react";

const specialties = [
  { icon: Heart, name: "Cardiologia", doctors: 24 },
  { icon: Brain, name: "Neurologia", doctors: 18 },
  { icon: Eye, name: "Oftalmologia", doctors: 15 },
  { icon: Bone, name: "Ortopedia", doctors: 21 },
  { icon: Baby, name: "Pediatria", doctors: 30 },
  { icon: Stethoscope, name: "Clínico Geral", doctors: 45 },
  { icon: Pill, name: "Dermatologia", doctors: 19 },
  { icon: Activity, name: "Endocrinologia", doctors: 12 },
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
              <div className="w-12 h-12 rounded-xl bg-medical-blue-light group-hover:bg-gradient-hero flex items-center justify-center mb-4 transition-all">
                <spec.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
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
