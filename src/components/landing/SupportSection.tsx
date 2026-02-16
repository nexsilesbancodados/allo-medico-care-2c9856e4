import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { HelpCircle, Headphones, MessageCircle } from "lucide-react";
import supportImage from "@/assets/support-section.png";

const SupportSection = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-muted/60 rounded-3xl p-8 md:p-12 lg:p-16"
        >
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 leading-tight">
                Ficou com alguma dúvida?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-md">
                Acesse nossa central de dúvidas ou conte com o suporte exclusivo para profissionais.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-6"
                  onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Central de dúvidas
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-6"
                  onClick={() => window.open("https://wa.me/5511999999999?text=Olá! Preciso de suporte.", "_blank")}
                >
                  <Headphones className="w-4 h-4 mr-2" />
                  Suporte geral
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-6"
                  onClick={() => window.open("https://wa.me/5511999999999?text=Olá! Sou médico e preciso de suporte.", "_blank")}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Suporte para médicos
                </Button>
              </div>
            </div>

            <div className="hidden lg:flex justify-center">
              <img
                src={supportImage}
                alt="Pingo - Suporte"
                className="w-full max-w-sm rounded-2xl object-cover shadow-card"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SupportSection;
