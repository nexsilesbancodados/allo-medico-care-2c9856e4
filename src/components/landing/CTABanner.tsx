import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CTABanner = () => {
  const navigate = useNavigate();

  return (
    <section className="py-10 md:py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, type: "spring", stiffness: 80 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 md:p-16 text-center shadow-elevated"
        >
          {/* Decorative animated elements */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.08, 0.05] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2"
          />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-primary-foreground text-sm font-medium mb-6 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4" />
              Primeira consulta com desconto
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-4 leading-tight max-w-2xl mx-auto"
            >
              Comece a cuidar da sua saúde hoje mesmo
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-primary-foreground/80 text-lg max-w-lg mx-auto mb-8"
            >
              Cadastre-se gratuitamente e agende sua primeira consulta com um especialista em minutos.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-3"
            >
              <Button
                size="lg"
                className="bg-card text-primary hover:bg-card/90 rounded-full px-8 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                onClick={() => navigate("/paciente")}
              >
                Criar minha conta <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-primary-foreground hover:bg-white/10 rounded-full px-8 transition-all duration-300 hover:scale-105"
                onClick={() => navigate("/consulta-avulsa")}
              >
                Consulta sem cadastro
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTABanner;
