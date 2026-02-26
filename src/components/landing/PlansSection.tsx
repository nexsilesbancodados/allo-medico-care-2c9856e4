import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck, Zap, CreditCard, ArrowRight, Percent } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
            Simples e <span className="text-gradient">transparente</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Pague por consulta ou economize 30% com nosso Cartão de Desconto.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Consulta Avulsa */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0, duration: 0.5, type: "spring", stiffness: 80 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="relative rounded-2xl p-6 border bg-card border-border/50 shadow-sm hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.06] transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br from-primary/80 to-primary shadow-md">
              <Zap className="w-5 h-5 text-white" />
            </div>

            <h3 className="text-lg font-bold text-foreground mb-1">Consulta Avulsa</h3>
            <p className="text-xs text-muted-foreground mb-4">Atendimento pontual sem compromisso.</p>

            <div className="mb-5">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">R$89</span>
              <span className="text-xs ml-1 text-muted-foreground">por consulta</span>
            </div>

            <ul className="space-y-2 mb-6">
              {[
                "Consulta por videochamada",
                "Receita digital válida inclusa",
                "Chat pós-consulta (48h)",
                "Escolha de especialidade",
                "Retorno gratuito em 15 dias",
              ].map((feat, j) => (
                <li key={j} className="flex items-start gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center mt-0.5 shrink-0 bg-success/10">
                    <Check className="w-2.5 h-2.5 text-success" />
                  </div>
                  {feat}
                </li>
              ))}
            </ul>

            <Button
              className="w-full h-11 font-semibold bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 hover:shadow-lg shadow-md shadow-primary/15 transition-all duration-300"
              size="lg"
              onClick={() => navigate("/consulta-avulsa")}
            >
              <span className="flex items-center gap-2">
                Comprar Consulta
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </motion.div>

          {/* Cartão de Desconto */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1.02 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 80 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="relative rounded-2xl p-6 border bg-gradient-to-br from-secondary via-primary to-primary text-primary-foreground border-transparent shadow-xl shadow-primary/25 transition-all duration-300"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, type: "spring" }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md bg-card text-primary"
            >
              <Percent className="w-3 h-3" />
              Economize 30%
            </motion.div>

            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-white/15">
              <CreditCard className="w-5 h-5 text-primary-foreground" />
            </div>

            <h3 className="text-lg font-bold mb-1">Cartão de Desconto</h3>
            <p className="text-xs opacity-80 mb-4">30% off em todos os serviços da plataforma.</p>

            <div className="mb-1">
              <span className="text-sm opacity-60">A partir de</span>
            </div>
            <div className="mb-5">
              <span className="text-3xl font-extrabold tracking-tight">R$24,90</span>
              <span className="text-xs ml-1 opacity-70">/mês</span>
            </div>

            <ul className="space-y-2 mb-6">
              {[
                "30% off em teleconsultas eletivas",
                "30% off no Plantão 24h",
                "30% off na renovação de receita",
                "Prioridade no agendamento",
                "Planos Individual, Casal e Família",
                "Sem carência — benefício imediato",
              ].map((feat, j) => (
                <li key={j} className="flex items-start gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center mt-0.5 shrink-0 bg-white/20">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  {feat}
                </li>
              ))}
            </ul>

            <Button
              className="w-full h-11 font-semibold bg-white text-primary hover:bg-white/90 hover:shadow-lg shadow-md transition-all duration-300"
              size="lg"
              onClick={() => navigate("/cartao-desconto")}
            >
              <span className="flex items-center gap-2">
                Ver Cartão de Desconto
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </motion.div>
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
