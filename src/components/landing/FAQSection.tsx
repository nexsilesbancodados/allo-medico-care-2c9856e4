import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageCircle, HelpCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "A consulta por vídeo tem a mesma validade de uma presencial?", a: "Sim! A telemedicina é regulamentada pelo CFM e as consultas realizadas pela AloClinica têm a mesma validade legal de uma consulta presencial, incluindo receitas e atestados.", category: "consulta" },
  { q: "Como funciona a receita digital?", a: "Após a consulta, o médico emite uma receita digital assinada eletronicamente. Você recebe o PDF pelo aplicativo e pode apresentá-la em qualquer farmácia.", category: "receita" },
  { q: "Posso cancelar meu plano a qualquer momento?", a: "Sim, você pode cancelar seu plano mensal a qualquer momento sem multa. O acesso continua até o fim do período pago.", category: "plano" },
  { q: "Quais especialidades estão disponíveis?", a: "Contamos com mais de 20 especialidades, incluindo Cardiologia, Neurologia, Pediatria, Dermatologia, Ortopedia, Clínico Geral e muitas outras.", category: "consulta" },
  { q: "Os dados da minha consulta são sigilosos?", a: "Absolutamente. Todas as consultas são protegidas com criptografia end-to-end e seguimos rigorosamente a LGPD e as normas do CFM para sigilo médico.", category: "segurança" },
  { q: "Sou médico, como faço para atender pela plataforma?", a: "Basta se cadastrar como médico, enviar seu CRM para verificação e configurar sua disponibilidade. Após aprovação, você já pode receber pacientes.", category: "médico" },
  { q: "Quanto tempo leva para receber a receita?", a: "A receita digital é emitida instantaneamente ao final da consulta e fica disponível no seu perfil e por e-mail.", category: "receita" },
  { q: "Posso agendar consulta para dependentes?", a: "Sim! Você pode cadastrar até 5 dependentes e agendar consultas para eles diretamente pelo seu perfil.", category: "consulta" },
];

const categories = [
  { key: "all", label: "Todas" },
  { key: "consulta", label: "Consultas" },
  { key: "receita", label: "Receitas" },
  { key: "plano", label: "Planos" },
  { key: "segurança", label: "Segurança" },
  { key: "médico", label: "Médicos" },
];

const FAQSection = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = faqs.filter((faq) => {
    const matchSearch = search === "" || faq.q.toLowerCase().includes(search.toLowerCase()) || faq.a.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "all" || faq.category === activeCategory;
    return matchSearch && matchCategory;
  });

  // Inject FAQ JSON-LD for SEO
  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(f => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    script.id = "faq-jsonld";
    document.head.appendChild(script);
    return () => { document.getElementById("faq-jsonld")?.remove(); };
  }, []);

  return (
    <section id="faq" className="py-12 md:py-24" aria-labelledby="faq-heading">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 text-primary text-sm font-semibold mb-4"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Central de ajuda
          </motion.span>
          <h2 id="faq-heading" className="text-2xl md:text-4xl font-extrabold text-foreground mb-3">
            Perguntas <span className="text-gradient">frequentes</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Tire suas dúvidas sobre a plataforma.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative mb-6"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar pergunta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </motion.div>

          {/* Category filters */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-2 mb-6"
          >
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  activeCategory === cat.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </motion.div>

          {/* FAQ Items */}
          <Accordion type="single" collapsible className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((faq, i) => (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  layout
                >
                  <AccordionItem
                    value={faq.q}
                    className="bg-card rounded-xl border border-border px-6 shadow-card transition-all duration-300 hover:border-primary/20 hover:shadow-elevated data-[state=open]:border-primary/30 data-[state=open]:shadow-elevated"
                  >
                    <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5 text-sm md:text-base">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-5 text-sm">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </AnimatePresence>

            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 text-muted-foreground"
              >
                <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma pergunta encontrada para "{search}"</p>
              </motion.div>
            )}
          </Accordion>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-10 text-center bg-card rounded-2xl border border-border p-8 shadow-card"
          >
            <MessageCircle className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-2">Ainda tem dúvidas?</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Nossa equipe de suporte está disponível para ajudar você por chat ou WhatsApp.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                className="bg-gradient-hero hover:opacity-90 text-primary-foreground rounded-full px-6 font-bold"
                onClick={() => navigate("/suporte")}
              >
                Falar com suporte <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-6"
                onClick={() => window.open("https://wa.me/5511999999999", "_blank")}
              >
                WhatsApp
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
