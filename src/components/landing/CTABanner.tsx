import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, Star, Check, X, Heart, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import mascotThumbsup from "@/assets/mascot-thumbsup.png";

const comparisonRows = [
  { feature: "Tempo de espera", us: "~15 min", them: "2-5 horas" },
  { feature: "Receita digital válida", us: true, them: false },
  { feature: "Disponível 24h", us: true, them: false },
  { feature: "Preço médio", us: "R$89", them: "R$200-400" },
  { feature: "Atestado digital", us: true, them: false },
];

const benefits = [
  { icon: Zap, text: "Consulta em minutos" },
  { icon: Shield, text: "Dados criptografados" },
  { icon: Clock, text: "Disponível 24/7" },
  { icon: Star, text: "4.9★ de avaliação" },
  { icon: Heart, text: "Mais de 50 especialidades" },
];

const CTABanner = forwardRef<HTMLElement>((_, ref) => {
  const navigate = useNavigate();

  return (
    <section className="py-12 md:py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, type: "spring", stiffness: 120, damping: 20 }}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary/90 to-secondary shadow-elevated"
        >
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/3" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02]" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-0">
            {/* Left column — CTA content */}
            <div className="lg:col-span-3 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-primary-foreground text-xs font-semibold w-fit mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-medical-green animate-pulse" />
                Médicos disponíveis agora
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
                className="text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold text-primary-foreground leading-[1.15] mb-4 tracking-tight"
              >
                Comece a cuidar da
                <br />
                sua saúde{" "}
                <span className="relative">
                  <span className="relative z-10">hoje mesmo</span>
                  <span className="absolute bottom-1 left-0 right-0 h-3 bg-white/15 rounded-full -z-0" />
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-primary-foreground/75 text-base md:text-lg max-w-md mb-8 leading-relaxed"
              >
                Cadastre-se gratuitamente e agende sua primeira consulta com um especialista em minutos.
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 }}
                className="flex flex-wrap gap-3 mb-8"
              >
                <Button
                  size="lg"
                  className="bg-card text-primary hover:bg-card/90 rounded-full px-8 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.03] active:scale-[0.98]"
                  onClick={() => navigate("/paciente")}
                >
                  Criar minha conta
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/25 text-primary-foreground hover:bg-white/10 rounded-full px-8 transition-all hover:scale-[1.03] active:scale-[0.98]"
                  onClick={() => navigate("/consulta-avulsa")}
                >
                  Consulta avulsa
                </Button>
              </motion.div>

              {/* Benefits row */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 }}
                className="flex flex-wrap gap-x-5 gap-y-2"
              >
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-primary-foreground/65 text-[11px] font-medium">
                    <b.icon className="w-3.5 h-3.5" />
                    {b.text}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right column — comparison + mascot */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center p-6 md:p-8 lg:p-10">
              {/* Mascot */}
              <motion.img
                src={mascotThumbsup}
                alt="Pingo mascote"
                className="w-24 h-24 md:w-28 md:h-28 object-contain drop-shadow-2xl mb-4 hidden lg:block"
                initial={{ opacity: 0, y: -15, rotate: -5 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
              />

              {/* Comparison card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 }}
                className="w-full max-w-xs rounded-2xl bg-white/[0.12] backdrop-blur-md border border-white/10 overflow-hidden"
              >
                <div className="grid grid-cols-3 text-[10px] uppercase tracking-wider font-bold text-primary-foreground/70 px-4 py-3 border-b border-white/10">
                  <span></span>
                  <span className="text-center text-primary-foreground">AloClinica</span>
                  <span className="text-center text-primary-foreground/40">Tradicional</span>
                </div>
                {comparisonRows.map((row, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-3 items-center text-[11px] text-primary-foreground/70 px-4 py-2.5 ${
                      i < comparisonRows.length - 1 ? "border-b border-white/[0.06]" : ""
                    }`}
                  >
                    <span className="font-medium text-primary-foreground/80">{row.feature}</span>
                    <span className="text-center font-bold text-primary-foreground">
                      {typeof row.us === "boolean" ? (
                        row.us ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-medical-green/20">
                            <Check className="w-3 h-3 text-medical-green" />
                          </span>
                        ) : (
                          <X className="w-3.5 h-3.5 opacity-40 mx-auto" />
                        )
                      ) : (
                        row.us
                      )}
                    </span>
                    <span className="text-center text-primary-foreground/35">
                      {typeof row.them === "boolean" ? (
                        row.them ? (
                          <Check className="w-3.5 h-3.5 mx-auto" />
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/10 mx-auto">
                            <X className="w-3 h-3 opacity-60" />
                          </span>
                        )
                      ) : (
                        row.them
                      )}
                    </span>
                  </div>
                ))}
              </motion.div>

              {/* Trust note */}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="text-[10px] text-primary-foreground/40 mt-3 text-center"
              >
                Mais de 10.000 pacientes atendidos com satisfação
              </motion.p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});
CTABanner.displayName = "CTABanner";
export default CTABanner;
