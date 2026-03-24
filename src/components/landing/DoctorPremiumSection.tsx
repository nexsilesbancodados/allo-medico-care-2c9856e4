import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Check, TrendingUp, Calendar, Shield, Wallet, Star, Quote, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import doctorImg1 from "@/assets/hero-medicos.png";
import doctorImg2 from "@/assets/hero-teleconsulta.png";
import avatarCarlos from "@/assets/avatar-carlos.png";

const benefits = [
  "Agenda inteligente e personalizada",
  "Receitas e atestados digitais com assinatura",
  "Prontuário eletrônico completo",
  "Saques semanais via PIX",
  "Suporte dedicado para médicos",
  "Perfil público com SEO otimizado",
];

const floatingStats = [
  { icon: TrendingUp, label: "Crescimento", value: "+40%", color: "bg-medical-green/15 text-medical-green" },
  { icon: Calendar, label: "Setup", value: "5 min", color: "bg-primary/15 text-primary" },
  { icon: Wallet, label: "Saque", value: "PIX", color: "bg-secondary/15 text-secondary" },
];

const earningsSteps = [
  { consultations: 5, earnings: "R$ 1.125" },
  { consultations: 10, earnings: "R$ 2.250" },
  { consultations: 20, earnings: "R$ 4.500" },
  { consultations: 40, earnings: "R$ 9.000" },
];

const DoctorPremiumSection = () => {
  const navigate = useNavigate();
  const [earningsIndex, setEarningsIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setEarningsIndex(prev => (prev + 1) % earningsSteps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const current = earningsSteps[earningsIndex];

  return (
    <section aria-label="Para médicos" className="py-10 md:py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-muted/60 dark:bg-muted/30 p-10 md:p-16 border border-border/30"
        >
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="relative z-10">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 text-primary text-sm font-semibold mb-6"
              >
                <Shield className="w-3.5 h-3.5" />
                AloClinica Premium
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-6"
              >
                Modelo especial
                <br />
                para profissionais
                <br />
                da <span className="text-gradient">saúde digital</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-lg max-w-md mb-6 leading-relaxed"
              >
                Um <strong className="text-foreground">formato exclusivo para médicos</strong> conectarem suas carreiras a novas possibilidades com a AloClinica.
              </motion.p>

              {/* Earnings estimator */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.32 }}
                className="mb-6 p-4 rounded-2xl bg-card border border-border shadow-card max-w-sm"
              >
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-primary" />
                  Estimativa de ganhos semanais
                </p>
                <div className="flex items-end gap-3">
                  <motion.div
                    key={earningsIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-2xl font-extrabold text-foreground">{current.earnings}</span>
                    <span className="text-xs text-muted-foreground ml-1.5">/semana</span>
                  </motion.div>
                  <div className="flex-1" />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">com</p>
                    <motion.p
                      key={earningsIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-bold text-primary"
                    >
                      {current.consultations} consultas
                    </motion.p>
                  </div>
                </div>
                {/* Progress dots */}
                <div className="flex gap-1.5 mt-3">
                  {earningsSteps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setEarningsIndex(i)}
                      className={`h-1 rounded-full transition-all duration-300 ${i === earningsIndex ? "w-6 bg-primary" : "w-2 bg-muted-foreground/20"}`}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Benefits checklist */}
              <motion.ul
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6"
              >
                {benefits.map((b, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="flex items-center gap-2 text-sm text-foreground/80"
                  >
                    <div className="w-5 h-5 rounded-full bg-medical-green/15 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-medical-green" />
                    </div>
                    {b}
                  </motion.li>
                ))}
              </motion.ul>

              {/* Doctor testimonial inline */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.45 }}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/10 mb-6 max-w-sm"
              >
                <img src={avatarCarlos} alt="Dr. Carlos" className="w-9 h-9 rounded-full object-cover shrink-0" loading="lazy" decoding="async" width={36} height={36} />
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Quote className="w-3 h-3 text-primary/40" />
                    <span className="text-[10px] font-semibold text-primary">Dr. Carlos Mendes</span>
                    <div className="flex gap-0.5 ml-1">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-2.5 h-2.5 fill-medical-green text-medical-green" />)}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">"Minha renda aumentou 40% e atendo de casa. A plataforma é incrível."</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-3"
              >
                <Button
                  size="lg"
                  className="bg-gradient-hero hover:opacity-90 text-primary-foreground rounded-full px-8 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  onClick={() => navigate("/medico")}
                >
                  Cadastre-se <ArrowRight className="w-4 h-4 ml-2" />
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

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-2 mt-4 text-xs text-muted-foreground"
              >
                <Users className="w-3.5 h-3.5" />
                <span><strong className="text-foreground">500+</strong> médicos já cadastrados</span>
                <span className="w-1.5 h-1.5 rounded-full bg-medical-green animate-pulse" />
              </motion.div>
            </div>

            {/* Images + floating badges */}
            <div className="relative flex justify-center items-center min-h-[300px] lg:min-h-[400px]">
              <motion.div
                initial={{ opacity: 0, x: 20, rotate: -3 }}
                whileInView={{ opacity: 1, x: 0, rotate: -3 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="absolute top-0 left-2 sm:left-8 w-40 sm:w-52 lg:w-64 h-56 sm:h-72 lg:h-80 rounded-2xl overflow-hidden shadow-elevated z-10"
              >
                <img src={doctorImg1} alt="Médica profissional" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20, rotate: 3 }}
                whileInView={{ opacity: 1, x: 0, rotate: 3 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute bottom-0 right-2 sm:right-8 w-36 sm:w-48 lg:w-56 h-52 sm:h-64 lg:h-72 rounded-2xl overflow-hidden shadow-elevated z-20"
              >
                <img src={doctorImg2} alt="Médico atendendo online" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              </motion.div>

              {/* Floating stat badges */}
              {floatingStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + i * 0.12, type: "spring", stiffness: 200 }}
                  animate={{ y: [0, -6, 0] }}
                  className={`absolute z-30 backdrop-blur-lg bg-card/90 rounded-xl shadow-card border border-border/50 px-3 py-2 flex items-center gap-2 ${
                    i === 0 ? "top-2 right-0" : i === 1 ? "bottom-16 left-0" : "bottom-0 right-12"
                  }`}
                  style={{ animationDelay: `${i * 0.5}s` }}
                >
                  <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground leading-none">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DoctorPremiumSection;
