import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Star, ShieldCheck, Zap, Crown, X, ChevronDown, ChevronUp, Users } from "lucide-react";
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
  },
];

const miniFAQ = [
  { q: "Posso cancelar a qualquer momento?", a: "Sim! Sem multa ou fidelidade. Cancele direto pelo painel." },
  { q: "Como funciona a garantia de 7 dias?", a: "Se não gostar, devolvemos 100% do valor. Sem perguntas." },
  { q: "Posso trocar de plano depois?", a: "Sim, upgrade ou downgrade a qualquer momento pelo painel." },
];

const PlansSection = () => {
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

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
            Escolha entre consulta avulsa ou planos com benefícios exclusivos.
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

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            const price = yearly ? plan.priceYearly : plan.priceMonthly;
            const showSavings = yearly && plan.priceYearly < plan.priceMonthly;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: plan.highlighted ? 1.03 : 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6, type: "spring", stiffness: 80 }}
                whileHover={{
                  y: -8,
                  scale: plan.highlighted ? 1.05 : 1.02,
                  transition: { duration: 0.25 },
                }}
                className={`relative rounded-3xl p-7 border transition-all duration-300 cursor-default ${
                  plan.highlighted
                    ? "bg-gradient-hero text-primary-foreground border-transparent shadow-elevated"
                    : "bg-card border-border shadow-card hover:border-primary/30 hover:shadow-elevated"
                }`}
              >
                {plan.badge && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-card ${
                      plan.highlighted
                        ? "bg-card text-primary"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {plan.highlighted ? <Star className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                    {plan.badge}
                  </motion.div>
                )}

                {/* Plan icon */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${
                  plan.highlighted ? "bg-white/15" : "bg-primary/10"
                }`}>
                  <plan.icon className={`w-5 h-5 ${plan.highlighted ? "text-primary-foreground" : "text-primary"}`} />
                </div>

                <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? "" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <p className={`text-xs mb-5 ${plan.highlighted ? "opacity-80" : "text-muted-foreground"}`}>
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
                      <span className="text-3xl font-extrabold">R${price}</span>
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
                    className={`text-[11px] mb-4 font-medium ${plan.highlighted ? "text-primary-foreground/70" : "text-medical-green"}`}
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

                <ul className="space-y-2.5 mb-4">
                  {plan.features.map((feat, j) => (
                    <motion.li
                      key={j}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 + j * 0.04 + 0.3 }}
                      className="flex items-start gap-2 text-xs"
                    >
                      <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${plan.highlighted ? "" : "text-medical-green"}`} />
                      {feat}
                    </motion.li>
                  ))}
                </ul>

                {/* Not included */}
                {plan.notIncluded.length > 0 && (
                  <ul className="space-y-1.5 mb-6">
                    {plan.notIncluded.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
                        <X className="w-3 h-3" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {plan.notIncluded.length === 0 && <div className="mb-6" />}

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
          className="flex flex-wrap items-center justify-center gap-4 mt-10 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-medical-green" />
            Garantia de 7 dias
          </div>
          <span className="hidden sm:inline opacity-30">|</span>
          <span>Cancele quando quiser</span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span>Sem fidelidade</span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span>Retorno gratuito em 15 dias</span>
        </motion.div>

        {/* Mini FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="max-w-lg mx-auto mt-12 space-y-2"
        >
          <p className="text-center text-xs font-semibold text-muted-foreground mb-3">Dúvidas sobre planos</p>
          {miniFAQ.map((item, i) => (
            <button
              key={i}
              onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
              className="w-full text-left p-3.5 rounded-xl bg-card border border-border hover:border-primary/20 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{item.q}</span>
                {openFAQ === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
              </div>
              <AnimatePresence>
                {openFAQ === i && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs text-muted-foreground mt-2 leading-relaxed overflow-hidden"
                  >
                    {item.a}
                  </motion.p>
                )}
              </AnimatePresence>
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PlansSection;
