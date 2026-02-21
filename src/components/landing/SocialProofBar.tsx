import { motion } from "framer-motion";
import { Shield, Award, Heart, CheckCircle } from "lucide-react";

const badges = [
  { icon: Shield, text: "Regulamentado pelo CFM" },
  { icon: Award, text: "Nota 4.9 no Google" },
  { icon: Heart, text: "+12.500 pacientes" },
  { icon: CheckCircle, text: "LGPD Compliant" },
];

const SocialProofBar = () => (
  <section className="py-6 md:py-10 border-y border-border/50 bg-muted/30">
    <div className="container mx-auto px-4">
      <div className="flex flex-wrap justify-center gap-6 md:gap-12">
        {badges.map((badge, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <badge.icon className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold">{badge.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SocialProofBar;
