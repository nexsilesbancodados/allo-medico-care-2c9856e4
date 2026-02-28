import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck, Zap, Award, Heart, Diamond, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const cards = [
  {
    name: "Consulta Avulsa",
    price: 89,
    period: "por consulta",
    description: "Atendimento pontual com retorno gratuito em 15 dias.",
    icon: Zap,
    features: [
      "1 consulta por videochamada",
      "Receita digital inclusa",
      "Chat pós-consulta (48h)",
      "Escolha de especialidade",
      "Retorno gratuito em 15 dias",
    ],
    route: "/paciente",
    buttonText: "Comprar Consulta",
    highlighted: false,
    badge: null,
  },
  {
    name: "Prata Familiar",
    price: 49.9,
    period: "/mês",
    description: "Telemedicina 24h para toda a família.",
    icon: Heart,
    features: [
      "Telemedicina 24h ilimitada",
      "Clube de Vantagens",
      "30% de desconto em serviços avulsos",
      "Receitas digitais ilimitadas",
      "Dependentes inclusos",
    ],
    route: "/cartao-beneficios",
    buttonText: "Assinar Cartão",
    highlighted: false,
    badge: null,
  },
  {
    name: "Individual Pro",
    price: 39.9,
    period: "/mês",
    description: "Plano completo para uso individual.",
    icon: Award,
    features: [
      "Telemedicina 24h ilimitada",
      "Clube de Vantagens",
      "Assistência Funeral Nacional",
      "30% de desconto em serviços avulsos",
      "Prontuário digital completo",
    ],
    route: "/cartao-beneficios",
    buttonText: "Assinar Cartão",
    highlighted: true,
    badge: "Mais popular",
  },
  {
    name: "Ouro Familiar",
    price: 79.9,
    period: "/mês",
    description: "Cobertura completa para a família.",
    icon: Sparkles,
    features: [
      "Tudo do Individual Pro",
      "Dependentes inclusos",
      "Prioridade no agendamento",
      "Chat ilimitado com médicos",
      "30% de desconto em serviços",
    ],
    route: "/cartao-beneficios",
    buttonText: "Assinar Cartão",
    highlighted: false,
    badge: null,
  },
  {
    name: "Diamante Familiar",
    price: 159.9,
    period: "/mês",
    description: "O plano mais completo da plataforma.",
    icon: Diamond,
    features: [
      "Tudo do Ouro Familiar",
      "Assistência Funeral Nacional",
      "Suporte prioritário 24h",
      "Consultas de retorno ilimitadas",
      "Prontuário familiar unificado",
    ],
    route: "/cartao-beneficios",
    buttonText: "Assinar Cartão",
    highlighted: false,
    badge: "Premium",
  },
];

const PlansSection = () => {
  const navigate = useNavigate();

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
            Consulta Avulsa ou{" "}
            <span className="text-gradient">Cartão de Benefícios</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Pague por consulta ou assine o Cartão de Benefícios e tenha telemedicina 24h ilimitada com 30% de desconto em todos os serviços.
          </p>
        </motion.div>

        {/* First row: Consulta Avulsa standalone */}
        <div className="max-w-sm mx-auto mb-6">
          <PlanCard plan={cards[0]} index={0} navigate={navigate} />
        </div>

        {/* Second row: Cartão de Benefícios options */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider"
        >
          Cartão de Benefícios
        </motion.p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {cards.slice(1).map((plan, i) => (
            <PlanCard key={i} plan={plan} index={i + 1} navigate={navigate} />
          ))}
        </div>

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

const PlanCard = ({ plan, index, navigate }: { plan: typeof cards[0]; index: number; navigate: ReturnType<typeof useNavigate> }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: plan.highlighted ? 1.02 : 1 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.08, duration: 0.5, type: "spring", stiffness: 80 }}
    whileHover={{ y: -6, transition: { duration: 0.2 } }}
    className={`relative rounded-2xl p-5 border transition-all duration-300 ${
      plan.highlighted
        ? "bg-gradient-to-br from-secondary via-primary to-primary text-primary-foreground border-transparent shadow-xl shadow-primary/25"
        : "bg-card border-border/50 shadow-sm hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.06]"
    }`}
  >
    {plan.badge && (
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold shadow-md ${
        plan.highlighted ? "bg-card text-primary" : "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
      }`}>
        {plan.badge}
      </div>
    )}

    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
      plan.highlighted ? "bg-white/15" : "bg-primary/10"
    }`}>
      <plan.icon className={`w-4 h-4 ${plan.highlighted ? "text-primary-foreground" : "text-primary"}`} />
    </div>

    <h3 className={`text-base font-bold mb-0.5 ${plan.highlighted ? "" : "text-foreground"}`}>{plan.name}</h3>
    <p className={`text-[11px] mb-3 ${plan.highlighted ? "opacity-80" : "text-muted-foreground"}`}>{plan.description}</p>

    <div className="mb-4">
      <span className="text-2xl font-extrabold tracking-tight">R${plan.price.toFixed(2).replace(".", ",")}</span>
      <span className={`text-[11px] ml-1 ${plan.highlighted ? "opacity-70" : "text-muted-foreground"}`}>{plan.period}</span>
    </div>

    <ul className="space-y-1.5 mb-4">
      {plan.features.map((feat, j) => (
        <li key={j} className="flex items-start gap-1.5 text-[11px]">
          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${
            plan.highlighted ? "bg-white/20" : "bg-success/10"
          }`}>
            <Check className={`w-2 h-2 ${plan.highlighted ? "" : "text-success"}`} />
          </div>
          {feat}
        </li>
      ))}
    </ul>

    <Button
      className={`w-full h-10 text-sm font-semibold transition-all duration-300 ${
        plan.highlighted
          ? "bg-white text-primary hover:bg-white/90 shadow-md"
          : "bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/15"
      }`}
      onClick={() => navigate(plan.route)}
    >
      <span className="flex items-center gap-2">
        {plan.buttonText}
        <ArrowRight className="w-3.5 h-3.5" />
      </span>
    </Button>
  </motion.div>
);

export default PlansSection;
