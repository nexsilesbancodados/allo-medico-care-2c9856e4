import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { HelpCircle, Headphones, MessageCircle } from "lucide-react";
import supportImage from "@/assets/mascot-thumbsup.png";

const SupportSection = () => {
  return (
    <section aria-label="Suporte" className="py-10 md:py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-muted/60 rounded-3xl p-8 md:p-12 lg:p-16 border border-border/50 transition-all duration-500 hover:shadow-elevated"
        >
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 leading-tight"
              >
                Ficou com alguma dúvida?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-lg mb-8 max-w-md"
              >
                Acesse nossa central de dúvidas ou conte com o suporte exclusivo para profissionais.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-3"
              >
                <Button
                  size="lg"
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-6 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Central de dúvidas
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-6 transition-all duration-300 hover:scale-105"
                  onClick={() => window.open("https://wa.me/5511999999999?text=Olá! Preciso de suporte.", "_blank")}
                >
                  <Headphones className="w-4 h-4 mr-2" />
                  Suporte geral
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-6 transition-all duration-300 hover:scale-105"
                  onClick={() => window.open("https://wa.me/5511999999999?text=Olá! Sou médico e preciso de suporte.", "_blank")}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Suporte para médicos
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex justify-center"
            >
              <motion.img
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ duration: 0.3 }}
                src={supportImage}
                alt="Pingo - Suporte"
                className="w-full max-w-sm rounded-2xl object-cover shadow-card"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SupportSection;
