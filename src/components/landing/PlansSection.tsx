import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Star, ShieldCheck, Zap, Crown, X, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const plans = [
  {
    name: "Consulta Avulsa",
    priceMonthly: 89,
    priceYearly: 89,
    period: "por consulta",
    description: "Ideal para atendimento pontual.",
    features: [
      "1 consulta por videochamada",
      "Receita digital inclusa",
      "Chat pós-consulta (48h)",
      "Escolha de especialidade",
    ],
    notIncluded: ["Sem consultas ilimitadas", "Sem dependentes"],
    highlighted: false,
    route: "/consulta-avulsa",
    buttonText: "Comprar Consulta",
    icon: Zap,
    badge: null,
    spots: null,
    gradient: "from-primary/80 to-primary",
  },
  {
    name: "Plano Completo",
    priceMonthly: 149,
    priceYearly: 119,
    period: "por mês",
    description: "Acesso ilimitado para você e sua família.",
    features: [
      "Consultas ilimitadas",
      "Receitas digitais ilimitadas",
      "Chat ilimitado com médicos",
      "Prioridade no agendamento",
      "Prontuário digital completo",
      "Acesso para até 4 dependentes",
    ],
    notIncluded: [],
    highlighted: true,
    route: "/paciente?plan=mensal",
    buttonText: "Assinar Plano",
    icon: Star,
    badge: "Mais popular",
    spots: 12,
    gradient: "from-secondary to-primary",
  },
  {
    name: "Plano Família+",
    priceMonthly: 229,
    priceYearly: 179,
    period: "por mês",
    description: "Para famílias maiores com necessidades frequentes.",
    features: [
      "Tudo do Plano Completo",
      "Até 8 dependentes",
      "Suporte prioritário 24h",
      "Consultas de retorno ilimitadas",
      "Prontuário familiar unificado",
      "Descontos em exames parceiros",
    ],
    notIncluded: [],
    highlighted: false,
    route: "/paciente?plan=familia",
    buttonText: "Assinar Família+",
    icon: Crown,
    badge: "Novo",
    spots: null,
    gradient: "from-warning to-orange-400",
  },
];

const PlansSection = () => {
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(false);

  return (
    <section id="planos" className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Planos que cabem no seu{" "}
            <span className="text-gradient">bolso</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-8">
            Escolha entre consulta avulsa ou planos com benefícios exclusivos.
          </p>

          {/* Toggle mensal/anual */}
          <div className="inline-flex items-center gap-1 bg-muted/60 rounded-full p-1 border border-border/50">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                !yearly
                  ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 relative ${
                yearly
                  ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/20"
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

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            const price = yearly ? plan.priceYearly : plan.priceMonthly;
            const showSavings = yearly && plan.priceYearly < plan.priceMonthly;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: plan.highlighted ? 1.02 : 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, type: "spring", stiffness: 80 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`relative rounded-2xl p-6 border transition-all duration-300 cursor-default ${
                  plan.highlighted
                    ? "bg-gradient-to-br from-secondary via-primary to-primary text-primary-foreground border-transparent shadow-xl shadow-primary/25"
                    : "bg-card border-border/50 shadow-sm hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.06]"
                }`}
              >
                {plan.badge && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, type: "spring" }}
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md ${
                      plan.highlighted
                        ? "bg-card text-primary"
                        : "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                    }`}
                  >
                    {plan.highlighted ? <Star className="w-3 h-3 fill-current" /> : <Crown className="w-3 h-3" />}
                    {plan.badge}
                  </motion.div>
                )}

                {/* Plan icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  plan.highlighted ? "bg-white/15" : `bg-gradient-to-br ${plan.gradient} shadow-md`
                }`}>
                  <plan.icon className={`w-5 h-5 ${plan.highlighted ? "text-primary-foreground" : "text-white"}`} />
                </div>

                <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? "" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <p className={`text-xs mb-4 ${plan.highlighted ? "opacity-80" : "text-muted-foreground"}`}>
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
                      <span className="text-3xl font-extrabold tracking-tight">R${price}</span>
                      <span className={`text-xs ml-1 ${plan.highlighted ? "opacity-70" : "text-muted-foreground"}`}>
                        {plan.period}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {showSavings && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-[11px] mb-4 font-medium ${plan.highlighted ? "text-primary-foreground/70" : "text-success"}`}
                  >
                    <span className="line-through opacity-60">R${plan.priceMonthly}</span> → Economia de R${(plan.priceMonthly - plan.priceYearly) * 12}/ano
                  </motion.p>
                )}
                {!showSavings && <div className="mb-4" />}

                {/* Spots indicator */}
                {plan.spots && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className={`flex items-center gap-1.5 text-[10px] font-semibold mb-3 ${plan.highlighted ? "text-primary-foreground/80" : "text-destructive"}`}
                  >
                    <Users className="w-3 h-3" />
                    Apenas {plan.spots} vagas com desconto
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  </motion.div>
                )}

                <ul className="space-y-2 mb-4">
                  {plan.features.map((feat, j) => (
                    <motion.li
                      key={j}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06 + j * 0.03 + 0.3 }}
                      className="flex items-start gap-2 text-xs"
                    >
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${
                        plan.highlighted ? "bg-white/20" : "bg-success/10"
                      }`}>
                        <Check className={`w-2.5 h-2.5 ${plan.highlighted ? "" : "text-success"}`} />
                      </div>
                      {feat}
                    </motion.li>
                  ))}
                </ul>

                {/* Not included */}
                {plan.notIncluded.length > 0 && (
                  <ul className="space-y-1.5 mb-5">
                    {plan.notIncluded.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
                        <X className="w-3 h-3" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {plan.notIncluded.length === 0 && <div className="mb-5" />}

                <Button
                  className={`w-full h-11 font-semibold transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-white text-primary hover:bg-white/90 hover:shadow-lg shadow-md"
                      : "bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 hover:shadow-lg shadow-md shadow-primary/15"
                  }`}
                  size="lg"
                  onClick={() => navigate(plan.route)}
                >
                  <span className="flex items-center gap-2">
                    {plan.buttonText}
                    <ArrowRight className="w-4 h-4" />
                  </span>
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
          className="flex flex-wrap items-center justify-center gap-4 mt-10 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-success" />
            Garantia de 7 dias
          </div>
          <span className="hidden sm:inline opacity-30">|</span>
          <span>Cancele quando quiser</span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span>Sem fidelidade</span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span>Retorno gratuito em 15 dias</span>
        </motion.div>
      </div>
    </section>
  );
};

export default PlansSection;
