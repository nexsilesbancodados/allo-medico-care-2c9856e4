import { motion } from "framer-motion";
import { Shield, Award, Heart, CheckCircle, Verified } from "lucide-react";

const badges = [
  { icon: Shield, text: "Regulamentado pelo CFM", color: "text-primary" },
  { icon: Award, text: "Nota 4.9 no Google", color: "text-warning" },
  { icon: Heart, text: "+12.500 pacientes", color: "text-destructive" },
  { icon: CheckCircle, text: "LGPD Compliant", color: "text-success" },
  { icon: Verified, text: "CRM Verificado", color: "text-secondary" },
];

const SocialProofBar = () => (
  <section className="py-6 md:py-10 border-y border-border/50 bg-muted/30 overflow-hidden">
    <div className="container mx-auto px-4">
      <div className="flex flex-wrap justify-center gap-4 md:gap-10">
        {badges.map((badge, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 text-muted-foreground group cursor-default"
          >
            <div className={`w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center group-hover:bg-primary/10 transition-colors`}>
              <badge.icon className={`w-4 h-4 ${badge.color} transition-transform group-hover:scale-110`} />
            </div>
            <span className="text-sm font-semibold group-hover:text-foreground transition-colors">{badge.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SocialProofBar;
