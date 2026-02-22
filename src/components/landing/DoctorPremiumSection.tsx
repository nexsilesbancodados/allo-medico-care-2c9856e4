import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Check, TrendingUp, Calendar, Shield, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import doctorImg1 from "@/assets/doctor-premium-1.png";
import doctorImg2 from "@/assets/doctor-premium-2.png";

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

const DoctorPremiumSection = () => {
  const navigate = useNavigate();

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
                className="text-muted-foreground text-lg max-w-md mb-8 leading-relaxed"
              >
                Um <strong className="text-foreground">formato exclusivo para médicos</strong> conectarem suas carreiras a novas possibilidades com a AloClinica.
              </motion.p>

              {/* Benefits checklist */}
              <motion.ul
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8"
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
                <img
                  src={doctorImg1}
                  alt="Médica profissional"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20, rotate: 3 }}
                whileInView={{ opacity: 1, x: 0, rotate: 3 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute bottom-0 right-2 sm:right-8 w-36 sm:w-48 lg:w-56 h-52 sm:h-64 lg:h-72 rounded-2xl overflow-hidden shadow-elevated z-20"
              >
                <img
                  src={doctorImg2}
                  alt="Médico atendendo online"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
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
