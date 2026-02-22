import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Star, ShieldCheck, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const plans = [
  {
    name: "Consulta Avulsa",
    priceMonthly: 89,
    priceYearly: 89,
    period: "por consulta",
    description: "Ideal para quem precisa de atendimento pontual.",
    features: [
      "1 consulta por videochamada",
      "Receita digital inclusa",
      "Chat pós-consulta (48h)",
      "Escolha de especialidade",
    ],
    highlighted: false,
    route: "/consulta-avulsa",
    buttonText: "Comprar Consulta",
    icon: Zap,
  },
  {
    name: "Plano Completo",
    priceMonthly: 149,
    priceYearly: 119,
    period: "por mês",
    description: "Acesso ilimitado para cuidar da saúde da família.",
    features: [
      "Consultas ilimitadas",
      "Receitas digitais ilimitadas",
      "Chat ilimitado com médicos",
      "Prioridade no agendamento",
      "Prontuário digital completo",
      "Acesso para até 4 dependentes",
    ],
    highlighted: true,
    route: "/paciente?plan=mensal",
    buttonText: "Assinar Plano",
    icon: Star,
  },
];

const PlansSection = () => {
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(false);

  return (
    <section id="planos" className="py-12 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3">
            Planos que cabem no seu{" "}
            <span className="text-gradient">bolso</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-8">
            Escolha entre consulta avulsa ou plano com benefícios exclusivos.
          </p>

          {/* Toggle mensal/anual */}
          <div className="inline-flex items-center gap-3 bg-muted/50 rounded-full p-1.5 border border-border">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                !yearly
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 relative ${
                yearly
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Anual
              <span className="absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan, i) => {
            const price = yearly ? plan.priceYearly : plan.priceMonthly;
            const showSavings = yearly && plan.priceYearly < plan.priceMonthly;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: plan.highlighted ? 1.05 : 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6, type: "spring", stiffness: 80 }}
                whileHover={{
                  y: -10,
                  scale: plan.highlighted ? 1.08 : 1.03,
                  transition: { duration: 0.25 },
                }}
                className={`relative rounded-3xl p-8 border transition-all duration-300 cursor-default ${
                  plan.highlighted
                    ? "bg-gradient-hero text-primary-foreground border-transparent shadow-elevated"
                    : "bg-card border-border shadow-card hover:border-primary/30 hover:shadow-elevated"
                }`}
              >
                {plan.highlighted && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-card text-primary text-xs font-bold flex items-center gap-1 shadow-card"
                  >
                    <Star className="w-3 h-3" /> Mais popular
                  </motion.div>
                )}

                {/* Plan icon */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                  plan.highlighted ? "bg-white/15" : "bg-primary/10"
                }`}>
                  <plan.icon className={`w-6 h-6 ${plan.highlighted ? "text-primary-foreground" : "text-primary"}`} />
                </div>

                <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? "" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-6 ${plan.highlighted ? "opacity-80" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>

                <div className="mb-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${yearly}-${i}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
                      <span className="text-4xl font-extrabold">R${price}</span>
                      <span className={`text-sm ml-1 ${plan.highlighted ? "opacity-70" : "text-muted-foreground"}`}>
                        {plan.period}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {showSavings && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-xs mb-4 font-medium ${plan.highlighted ? "text-primary-foreground/70" : "text-medical-green"}`}
                  >
                    <span className="line-through opacity-60">R${plan.priceMonthly}</span> → Economia de R${(plan.priceMonthly - plan.priceYearly) * 12}/ano
                  </motion.p>
                )}
                {!showSavings && <div className="mb-4" />}

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat, j) => (
                    <motion.li
                      key={j}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 + j * 0.06 + 0.3 }}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlighted ? "" : "text-medical-green"}`} />
                      {feat}
                    </motion.li>
                  ))}
                </ul>

                <Button
                  className={`w-full transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-card text-primary hover:bg-card/90 hover:shadow-lg"
                      : "bg-gradient-hero text-primary-foreground hover:opacity-90 hover:shadow-lg"
                  }`}
                  size="lg"
                  onClick={() => navigate(plan.route)}
                >
                  {plan.buttonText}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Guarantee strip */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 mt-10 text-sm text-muted-foreground"
        >
          <ShieldCheck className="w-4 h-4 text-medical-green" />
          <span>Cancele quando quiser · Sem fidelidade · Garantia de 7 dias</span>
        </motion.div>
      </div>
    </section>
  );
};

export default PlansSection;
