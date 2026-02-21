import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Bot, MessageCircle, ChevronRight, Sparkles } from "lucide-react";
import patientImg from "@/assets/patient-virtual-assistant.png";
import mascotWave from "@/assets/mascot-wave.png";

const VirtualAssistantSection = () => {
  return (
    <section aria-label="Assistente virtual Pingo" className="py-10 md:py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-muted/60 dark:bg-muted/30 p-10 md:p-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-elevated max-w-sm mx-auto">
                <img
                  src={patientImg}
                  alt="Paciente usando o assistente virtual"
                  className="w-full h-80 object-cover"
                  loading="lazy"
                />
                {/* Decorative chevrons */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div
                    animate={{ x: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-white/40"
                  >
                    <ChevronRight className="w-20 h-20" strokeWidth={3} />
                  </motion.div>
                </div>
              </div>

              {/* Floating mascot */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -right-4 w-24 h-24 z-20"
              >
                <img src={mascotWave} alt="Pingo" className="w-full h-full object-contain drop-shadow-lg" loading="lazy" />
              </motion.div>
            </motion.div>

            {/* Text */}
            <div className="relative z-10">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 text-primary text-sm font-semibold mb-6"
              >
                <Sparkles className="w-4 h-4" />
                Novidade
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-4"
              >
                Pingo <span className="text-primary">24h</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-base md:text-lg max-w-md mb-8 leading-relaxed"
              >
                Seu atendente virtual está sempre disponível. Tire dúvidas, agende consultas e receba orientações — tudo direto pelo chat, sem complicação.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-6 gap-2 font-semibold"
                  onClick={() => {
                    const chatBtn = document.querySelector('[data-pingo-chat]') as HTMLButtonElement;
                    if (chatBtn) chatBtn.click();
                  }}
                >
                  <MessageCircle className="w-5 h-5" />
                  Falar com o Pingo
                </Button>
              </motion.div>

              <motion.a
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                href="#como-funciona"
                className="inline-flex items-center gap-1 mt-4 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Veja como funciona <ChevronRight className="w-4 h-4" /><ChevronRight className="w-4 h-4 -ml-3" />
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VirtualAssistantSection;
