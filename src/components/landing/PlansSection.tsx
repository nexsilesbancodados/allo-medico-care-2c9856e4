import { forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck, Zap, Award, Heart, Diamond, ArrowRight, Sparkles, Stethoscope, Brain, Eye, Bone, Baby, Activity, Crown, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import specGeneral from "@/assets/spec-general.png";
import specCardiology from "@/assets/spec-cardiology.png";
import specDermatology from "@/assets/spec-dermatology.png";
import specNeurology from "@/assets/spec-neurology.png";
import specOphthalmology from "@/assets/spec-ophthalmology.png";
import specOrthopedics from "@/assets/spec-orthopedics.png";
import specPediatrics from "@/assets/spec-pediatrics.png";
import specEndocrinology from "@/assets/spec-endocrinology.png";

const specialties = [
  { name: "Clínico Geral", icon: Stethoscope, price: 89, mascot: specGeneral },
  { name: "Cardiologia", icon: Activity, price: 129, mascot: specCardiology },
  { name: "Dermatologia", icon: Sparkles, price: 119, mascot: specDermatology },
  { name: "Neurologia", icon: Brain, price: 139, mascot: specNeurology },
  { name: "Oftalmologia", icon: Eye, price: 119, mascot: specOphthalmology },
  { name: "Ortopedia", icon: Bone, price: 129, mascot: specOrthopedics },
  { name: "Pediatria", icon: Baby, price: 99, mascot: specPediatrics },
  { name: "Endocrinologia", icon: Activity, price: 129, mascot: specEndocrinology },
  // Especialidades extras (exibidas ao expandir)
  { name: "Ginecologia", icon: Heart, price: 129, mascot: specGeneral },
  { name: "Urologia", icon: Activity, price: 139, mascot: specGeneral },
  { name: "Psiquiatria", icon: Brain, price: 149, mascot: specNeurology },
  { name: "Nutrição", icon: Sparkles, price: 99, mascot: specGeneral },
  { name: "Pneumologia", icon: Activity, price: 129, mascot: specEndocrinology },
  { name: "Gastroenterologia", icon: Activity, price: 139, mascot: specGeneral },
  { name: "Reumatologia", icon: Bone, price: 139, mascot: specOrthopedics },
  { name: "Otorrinolaringologia", icon: Activity, price: 129, mascot: specGeneral },
  { name: "Geriatria", icon: Heart, price: 119, mascot: specGeneral },
  { name: "Psicologia", icon: Brain, price: 99, mascot: specNeurology },
  { name: "Fonoaudiologia", icon: Activity, price: 99, mascot: specGeneral },
  { name: "Fisioterapia", icon: Bone, price: 89, mascot: specOrthopedics },
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
    accentColor: "from-emerald-400 to-teal-500",
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
    accentColor: "from-primary to-secondary",
  },
  {
    name: "King Família",
    price: 77.9,
    description: "Cobertura completa para a família.",
    icon: Crown,
    features: [
      "Tudo do Solitário",
      "Dependentes inclusos",
      "Prioridade no agendamento",
      "Chat ilimitado com médicos",
      "30% de desconto em serviços",
    ],
    highlighted: false,
    badge: null,
    accentColor: "from-blue-400 to-indigo-500",
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
    accentColor: "from-amber-400 to-orange-500",
  },
];

const PlansSection = forwardRef<HTMLElement>((_, ref) => {
  const navigate = useNavigate();

  return (
    <>
      {/* ── SEÇÃO 1: CONSULTA AVULSA ── */}
      <section id="consulta-avulsa" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Zap className="w-4 h-4" /> Consulta Avulsa
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight text-balance">
              Escolha sua especialidade
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto text-pretty">
              Pague apenas pela consulta que precisa. Retorno gratuito em 15 dias.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10">
            {specialties.map((spec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/consulta-avulsa?specialty=${encodeURIComponent(spec.name)}`)}
                className="relative rounded-2xl p-5 border border-border/50 bg-card hover:border-primary/30 hover:shadow-xl hover:shadow-primary/[0.08] transition-all duration-300 cursor-pointer group overflow-hidden"
              >
                {/* Mascot watermark */}
                <img
                  src={spec.mascot}
                  alt=""
                  aria-hidden="true"
                  className="absolute -bottom-3 -right-3 w-24 h-24 object-contain opacity-[0.06] group-hover:opacity-[0.14] group-hover:scale-110 transition-all duration-500 pointer-events-none select-none"
                />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/[0.07] flex items-center justify-center mb-3 group-hover:bg-primary/[0.12] group-hover:scale-105 transition-all duration-200">
                    <spec.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">{spec.name}</h3>
                  <div>
                    <span className="text-xl font-extrabold text-foreground tabular-nums">R${spec.price}</span>
                    <span className="text-[10px] text-muted-foreground ml-1 opacity-70">por consulta</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center"
          >
            <Button
              size="lg"
              className="bg-gradient-hero hover:opacity-90 text-primary-foreground rounded-full px-8 font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-105 transition-all cta-shimmer group"
              onClick={() => navigate("/paciente")}
            >
              Ver Todas as Especialidades <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <div className="flex flex-wrap items-center justify-center gap-5 mt-7 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-success" /> Receita digital inclusa</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-success" /> Chat pós-consulta (48h)</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-success" /> Retorno gratuito em 15 dias</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SEÇÃO 2: CARTÃO DE BENEFÍCIOS ── */}
      <section id="planos" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-12 md:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
              <ShieldCheck className="w-4 h-4" /> Cartão de Benefícios
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight text-balance">
              Telemedicina 24h com{" "}
              <span className="text-gradient">30% de desconto</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto text-pretty">
              Assine o Cartão de Benefícios e tenha acesso ilimitado a teleconsultas, clube de vantagens e descontos exclusivos em todos os serviços.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto items-start">
            {benefitCards.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                  plan.highlighted
                    ? "shadow-2xl shadow-primary/25 scale-[1.02] z-10"
                    : "shadow-sm hover:shadow-xl hover:shadow-primary/[0.06]"
                }`}
              >
                {plan.badge && (
                  <div className={`absolute -top-0 left-1/2 -translate-x-1/2 z-20 px-4 py-1 rounded-b-lg text-[11px] font-bold shadow-md ${
                    plan.highlighted ? "bg-card text-primary" : "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                  }`}>
                    {plan.badge}
                  </div>
                )}

                {/* Top accent bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${plan.accentColor}`} />

                <div className={`p-6 ${
                  plan.highlighted
                    ? "bg-gradient-to-br from-secondary via-primary to-primary text-primary-foreground"
                    : "bg-card border border-t-0 border-border/50"
                }`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                    plan.highlighted ? "bg-white/15 backdrop-blur-sm" : "bg-primary/[0.07]"
                  }`}>
                    <plan.icon className={`w-5 h-5 ${plan.highlighted ? "text-primary-foreground" : "text-primary"}`} />
                  </div>

                  <h3 className={`text-lg font-bold mb-0.5 ${plan.highlighted ? "" : "text-foreground"}`}>{plan.name}</h3>
                  <p className={`text-xs mb-4 ${plan.highlighted ? "opacity-75" : "text-muted-foreground"}`}>{plan.description}</p>

                  <div className="mb-5">
                    <span className="text-3xl font-extrabold tracking-tight tabular-nums">R${plan.price.toFixed(2).replace(".", ",")}</span>
                    <span className={`text-xs ml-1 ${plan.highlighted ? "opacity-60" : "text-muted-foreground"}`}>/mês</span>
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((feat, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs leading-relaxed">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${
                          plan.highlighted ? "bg-white/20" : "bg-success/10"
                        }`}>
                          <Check className={`w-2.5 h-2.5 ${plan.highlighted ? "" : "text-success"}`} />
                        </div>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full h-11 text-sm font-bold rounded-xl transition-all duration-300 active:scale-[0.97] ${
                      plan.highlighted
                        ? "bg-white text-primary hover:bg-white/90 shadow-lg"
                        : "bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/15"
                    }`}
                    onClick={() => navigate("/cartao-beneficios")}
                  >
                    <span className="flex items-center gap-2">
                      Assinar Cartão
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-5 mt-12 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-success" />
              Garantia de 7 dias
            </div>
            <span className="hidden sm:inline opacity-20">|</span>
            <span>Cancele quando quiser</span>
            <span className="hidden sm:inline opacity-20">|</span>
            <span>Sem fidelidade</span>
          </motion.div>
        </div>
      </section>
    </>
  );
});
PlansSection.displayName = "PlansSection";
export default PlansSection;
