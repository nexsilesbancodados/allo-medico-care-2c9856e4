import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";

const plans = [
  {
    name: "Consulta Avulsa",
    price: "89",
    period: "por consulta",
    description: "Ideal para quem precisa de atendimento pontual.",
    features: [
      "1 consulta por videochamada",
      "Receita digital inclusa",
      "Chat pós-consulta (48h)",
      "Escolha de especialidade",
    ],
    highlighted: false,
  },
  {
    name: "Plano Mensal",
    price: "149",
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
  },
];

const PlansSection = () => {
  return (
    <section id="planos" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            Planos que cabem no seu{" "}
            <span className="text-gradient">bolso</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolha entre consulta avulsa ou plano mensal com benefícios exclusivos.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-3xl p-8 border transition-all ${
                plan.highlighted
                  ? "bg-gradient-hero text-primary-foreground border-transparent shadow-elevated scale-105"
                  : "bg-card border-border shadow-card"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-card text-primary text-xs font-bold flex items-center gap-1">
                  <Star className="w-3 h-3" /> Mais popular
                </div>
              )}

              <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? "" : "text-foreground"}`}>
                {plan.name}
              </h3>
              <p className={`text-sm mb-6 ${plan.highlighted ? "opacity-80" : "text-muted-foreground"}`}>
                {plan.description}
              </p>

              <div className="mb-6">
                <span className="text-4xl font-extrabold">R${plan.price}</span>
                <span className={`text-sm ml-1 ${plan.highlighted ? "opacity-70" : "text-muted-foreground"}`}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlighted ? "" : "text-medical-green"}`} />
                    {feat}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.highlighted
                    ? "bg-card text-primary hover:bg-card/90"
                    : "bg-gradient-hero text-primary-foreground hover:opacity-90"
                }`}
                size="lg"
              >
                Começar agora
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
