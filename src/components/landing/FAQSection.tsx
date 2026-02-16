import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "A consulta por vídeo tem a mesma validade de uma presencial?", a: "Sim! A telemedicina é regulamentada pelo CFM e as consultas realizadas pela Alô Médico têm a mesma validade legal de uma consulta presencial, incluindo receitas e atestados." },
  { q: "Como funciona a receita digital?", a: "Após a consulta, o médico emite uma receita digital assinada eletronicamente. Você recebe o PDF pelo aplicativo e pode apresentá-la em qualquer farmácia." },
  { q: "Posso cancelar meu plano a qualquer momento?", a: "Sim, você pode cancelar seu plano mensal a qualquer momento sem multa. O acesso continua até o fim do período pago." },
  { q: "Quais especialidades estão disponíveis?", a: "Contamos com mais de 20 especialidades, incluindo Cardiologia, Neurologia, Pediatria, Dermatologia, Ortopedia, Clínico Geral e muitas outras." },
  { q: "Os dados da minha consulta são sigilosos?", a: "Absolutamente. Todas as consultas são protegidas com criptografia end-to-end e seguimos rigorosamente a LGPD e as normas do CFM para sigilo médico." },
  { q: "Sou médico, como faço para atender pela plataforma?", a: "Basta se cadastrar como médico, enviar seu CRM para verificação e configurar sua disponibilidade. Após aprovação, você já pode receber pacientes." },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            Perguntas <span className="text-gradient">frequentes</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tire suas dúvidas sobre a plataforma.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <AccordionItem
                  value={`item-${i}`}
                  className="bg-card rounded-xl border border-border px-6 shadow-card transition-all duration-300 hover:border-primary/20 hover:shadow-elevated data-[state=open]:border-primary/30 data-[state=open]:shadow-elevated"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
