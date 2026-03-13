import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck, Zap, Award, Heart, Diamond, ArrowRight, Sparkles, Stethoscope, Brain, Eye, Bone, Baby, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

const specialties = [
  { name: "Clínico Geral", icon: Stethoscope, price: 89 },
  { name: "Cardiologia", icon: Activity, price: 129 },
  { name: "Dermatologia", icon: Sparkles, price: 119 },
  { name: "Neurologia", icon: Brain, price: 139 },
  { name: "Oftalmologia", icon: Eye, price: 119 },
  { name: "Ortopedia", icon: Bone, price: 129 },
  { name: "Pediatria", icon: Baby, price: 99 },
  { name: "Endocrinologia", icon: Activity, price: 129 },
];

const benefitCards = [
  {
    name: "Mini Família",
    price: 47.9,
    description: "Telemedicina 24h para toda a família.",
    icon: Heart,
    features: [
      "Telemedicina 24h ilimitada",
      "Clube de Vantagens",
      "30% de desconto em serviços avulsos",
      "Receitas digitais ilimitadas",
      "Dependentes inclusos",
    ],
    highlighted: false,
    badge: null,
  },
  {
    name: "Solitário",
    price: 37.9,
    description: "Plano completo para uso individual.",
    icon: Award,
    features: [
      "Telemedicina 24h ilimitada",
      "Clube de Vantagens",
      "Assistência Funeral Nacional",
      "30% de desconto em serviços avulsos",
      "Prontuário digital completo",
    ],
    highlighted: true,
    badge: "Mais popular",
  },
  {
    name: "King Família",
    price: 77.9,
    description: "Cobertura completa para a família.",
    icon: Sparkles,
    features: [
      "Tudo do Solitário",
      "Dependentes inclusos",
      "Prioridade no agendamento",
      "Chat ilimitado com médicos",
      "30% de desconto em serviços",
    ],
    highlighted: false,
    badge: null,
  },
  {
    name: "Prime Família",
    price: 157.9,
    description: "O plano mais completo da plataforma.",
    icon: Diamond,
    features: [
      "Tudo do King Família",
      "Assistência Funeral Nacional",
      "Suporte prioritário 24h",
      "Consultas de retorno ilimitadas",
      "Prontuário familiar unificado",
    ],
    highlighted: false,
    badge: "Premium",
  },
];

const PlansSection = forwardRef<HTMLElement>((_, ref) => {
  const navigate = useNavigate();

  return (
    <>
      {/* ── SEÇÃO 1: CONSULTA AVULSA ── */}
      <section id="consulta-avulsa" className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Zap className="w-4 h-4" /> Consulta Avulsa
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
              Escolha sua especialidade
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              Pague apenas pela consulta que precisa. Cada especialidade tem seu valor. Retorno gratuito em 15 dias.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto mb-8">
            {specialties.map((spec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                onClick={() => navigate("/paciente")}
                className="relative rounded-xl p-4 border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/[0.06] transition-all duration-300 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <spec.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{spec.name}</h3>
                <div>
                  <span className="text-lg font-extrabold text-foreground">R${spec.price}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">por consulta</span>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl px-8 font-bold shadow-lg shadow-primary/20"
              onClick={() => navigate("/paciente")}
            >
              Ver Todas as Especialidades <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> Receita digital inclusa</span>
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> Chat pós-consulta (48h)</span>
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> Retorno gratuito em 15 dias</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SEÇÃO 2: CARTÃO DE BENEFÍCIOS ── */}
      <section id="planos" className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
              <ShieldCheck className="w-4 h-4" /> Cartão de Benefícios
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
              Telemedicina 24h com{" "}
              <span className="text-gradient">30% de desconto</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              Assine o Cartão de Benefícios e tenha acesso ilimitado a teleconsultas, clube de vantagens e descontos exclusivos em todos os serviços.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {benefitCards.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: plan.highlighted ? 1.02 : 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, type: "spring", stiffness: 80 }}
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
                  <span className={`text-[11px] ml-1 ${plan.highlighted ? "opacity-70" : "text-muted-foreground"}`}>/mês</span>
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
                  onClick={() => navigate("/cartao-beneficios")}
                >
                  <span className="flex items-center gap-2">
                    Assinar Cartão
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Button>
              </motion.div>
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
          </motion.div>
        </div>
      </section>
    </>
  );
});
PlansSection.displayName = "PlansSection";
export default PlansSection;
