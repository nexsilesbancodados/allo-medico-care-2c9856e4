import { motion, useInView } from "framer-motion";
import { Plus, Shield, Clock, TrendingUp, Users, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import doctorImg1 from "@/assets/doctor-signup-1.png";
import doctorImg2 from "@/assets/doctor-signup-2.png";

const cards = [
  {
    badge: "Cadastro Médico",
    title: "Cadastro para médicos especialistas e generalistas",
    image: doctorImg1,
    link: "/medico",
  },
  {
    badge: "Parceiro Clínica",
    title: "Cadastre sua clínica e amplie seus atendimentos",
    image: doctorImg2,
    link: "/clinica",
  },
];

const stats = [
  { icon: Shield, label: "Certificação CFM", value: "100%", color: "bg-medical-green/15 text-medical-green" },
  { icon: Clock, label: "Setup em", value: "5min", color: "bg-primary/15 text-primary" },
  { icon: TrendingUp, label: "Crescimento médio", value: "+40%", color: "bg-secondary/15 text-secondary" },
  { icon: Users, label: "Médicos ativos", value: "500+", color: "bg-accent/15 text-accent-foreground" },
];

const benefits = [
  "Receba pacientes de todo o Brasil",
  "Ferramentas de prontuário e prescrição",
  "Saques via PIX semanais",
  "Perfil público otimizado para SEO",
];

const AnimatedCounter = ({ target, suffix = "" }: { target: string; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!isInView) return;
    const num = parseInt(target.replace(/\D/g, ""));
    if (isNaN(num)) { setDisplay(target); return; }
    const prefix = target.match(/^\D+/)?.[0] ?? "";
    const suf = target.match(/\D+$/)?.[0] ?? suffix;
    let start = 0;
    const duration = 1200;
    const step = Math.ceil(duration / 60);
    const inc = num / (duration / step);
    const timer = setInterval(() => {
      start += inc;
      if (start >= num) { start = num; clearInterval(timer); }
      setDisplay(`${prefix}${Math.floor(start)}${suf}`);
    }, step);
    return () => clearInterval(timer);
  }, [isInView, target, suffix]);

  return <span ref={ref}>{display}</span>;
};

const DoctorWhySection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-10 md:py-20 px-4">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 text-primary text-sm font-semibold mb-6"
            >
              <Users className="w-3.5 h-3.5" />
              Médicos generalistas e especialistas
            </motion.span>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-6">
              <span className="text-gradient">O futuro</span> da saúde está aqui
            </h2>

            <p className="text-muted-foreground text-lg max-w-md mb-6 leading-relaxed">
              Confira as oportunidades disponíveis para todas as especialidades médicas na plataforma AloClinica.
            </p>

            {/* Benefits */}
            <ul className="space-y-2.5 mb-8">
              {benefits.map((b, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  className="flex items-center gap-2 text-sm text-foreground/80"
                >
                  <div className="w-5 h-5 rounded-full bg-medical-green/15 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-medical-green" />
                  </div>
                  {b}
                </motion.li>
              ))}
            </ul>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex gap-3 mb-8"
            >
              <Button
                size="lg"
                className="bg-gradient-hero hover:opacity-90 text-primary-foreground rounded-full px-6 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                onClick={() => navigate("/medico")}
              >
                Cadastre-se <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-6"
                onClick={() => navigate("/clinica")}
              >
                Sou Clínica
              </Button>
            </motion.div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 200, damping: 14 }}
                  whileHover={{ y: -5, scale: 1.04, boxShadow: "0 12px 30px -8px hsl(var(--primary) / 0.15)" }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-card hover:border-primary/20 transition-all duration-300 cursor-default"
                >
                  <motion.div
                    className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center shrink-0`}
                    whileHover={{ rotate: 8 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <s.icon className="w-4 h-4" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-tight">
                      <AnimatedCounter target={s.value} />
                    </p>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Cards */}
          <div className="flex gap-4 flex-col sm:flex-row">
            {cards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => navigate(card.link)}
                className="relative flex-1 rounded-2xl overflow-hidden shadow-elevated cursor-pointer group min-h-[320px]"
              >
                <img
                  src={card.image}
                  alt={card.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold border border-white/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                    {card.badge}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10 flex items-end justify-between">
                  <h3 className="text-white font-bold text-lg leading-snug max-w-[75%]">
                    {card.title}
                  </h3>
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.2 }}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-primary group-hover:border-primary transition-colors flex-shrink-0"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DoctorWhySection;
