import { useEffect, useState, useRef, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageCircle, HelpCircle, ArrowRight, Sparkles, ThumbsUp, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "A consulta por vídeo tem a mesma validade de uma presencial?", a: "Sim! A telemedicina é regulamentada pelo CFM e as consultas realizadas pela AloClinica têm a mesma validade legal de uma consulta presencial, incluindo receitas e atestados.", category: "consulta", views: 1240, helpful: 98 },
  { q: "Como funciona a receita digital?", a: "Após a consulta, o médico emite uma receita digital assinada eletronicamente. Você recebe o PDF pelo aplicativo e pode apresentá-la em qualquer farmácia.", category: "receita", views: 980, helpful: 95 },
  { q: "Posso cancelar meu plano a qualquer momento?", a: "Sim, você pode cancelar seu plano mensal a qualquer momento sem multa. O acesso continua até o fim do período pago.", category: "plano", views: 870, helpful: 97 },
  { q: "Quais especialidades estão disponíveis?", a: "Contamos com mais de 20 especialidades, incluindo Cardiologia, Neurologia, Pediatria, Dermatologia, Ortopedia, Clínico Geral e muitas outras.", category: "consulta", views: 1100, helpful: 94 },
  { q: "Os dados da minha consulta são sigilosos?", a: "Absolutamente. Todas as consultas são protegidas com criptografia end-to-end e seguimos rigorosamente a LGPD e as normas do CFM para sigilo médico.", category: "segurança", views: 760, helpful: 99 },
  { q: "Sou médico, como faço para atender pela plataforma?", a: "Basta se cadastrar como médico, enviar seu CRM para verificação e configurar sua disponibilidade. Após aprovação, você já pode receber pacientes.", category: "médico", views: 650, helpful: 92 },
  { q: "Quanto tempo leva para receber a receita?", a: "A receita digital é emitida instantaneamente ao final da consulta e fica disponível no seu perfil e por e-mail.", category: "receita", views: 890, helpful: 96 },
  { q: "Posso agendar consulta para dependentes?", a: "Sim! Você pode cadastrar até 5 dependentes e agendar consultas para eles diretamente pelo seu perfil.", category: "consulta", views: 720, helpful: 93 },
];

const categories = [
  { key: "all", label: "Todas", count: faqs.length },
  { key: "consulta", label: "Consultas", count: faqs.filter(f => f.category === "consulta").length },
  { key: "receita", label: "Receitas", count: faqs.filter(f => f.category === "receita").length },
  { key: "plano", label: "Planos", count: faqs.filter(f => f.category === "plano").length },
  { key: "segurança", label: "Segurança", count: faqs.filter(f => f.category === "segurança").length },
  { key: "médico", label: "Médicos", count: faqs.filter(f => f.category === "médico").length },
];

// Top 2 most viewed
const featuredFaqs = [...faqs].sort((a, b) => b.views - a.views).slice(0, 2);

const FAQSection = forwardRef<HTMLElement>((_, ref) => {
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
            Tire suas dúvidas sobre a plataforma. <span className="font-semibold text-foreground">{faqs.length} perguntas</span> respondidas.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {/* Featured questions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 gap-3 mb-8"
          >
            {featuredFaqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-primary/5 border border-primary/10 rounded-xl p-4 cursor-default hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-bold text-primary">Mais buscada</span>
                </div>
                <p className="text-sm font-semibold text-foreground mb-2 leading-snug">{faq.q}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-2.5 h-2.5" />
                    {faq.views.toLocaleString("pt-BR")} views
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-2.5 h-2.5" />
                    {faq.helpful}% útil
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>

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
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                Limpar
              </button>
            )}
          </motion.div>

          {/* Category filters with counts */}
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
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  activeCategory === cat.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeCategory === cat.key
                    ? "bg-primary-foreground/20"
                    : "bg-muted-foreground/10"
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </motion.div>

          {/* Results count */}
          {search && (
            <p className="text-xs text-muted-foreground mb-4">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para "{search}"
            </p>
          )}

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
                    className="bg-card rounded-xl border border-border px-6 shadow-card transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:-translate-y-1 data-[state=open]:border-primary/30 data-[state=open]:shadow-elevated"
                  >
                    <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5 text-sm md:text-base">
                      <div className="flex-1">
                        {faq.q}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-muted-foreground font-normal flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" />
                            {faq.views.toLocaleString("pt-BR")}
                          </span>
                          <span className="text-[10px] text-medical-green font-normal flex items-center gap-1">
                            <ThumbsUp className="w-2.5 h-2.5" />
                            {faq.helpful}% útil
                          </span>
                        </div>
                      </div>
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
                <button
                  onClick={() => { setSearch(""); setActiveCategory("all"); }}
                  className="text-primary text-xs mt-2 underline underline-offset-2"
                >
                  Limpar filtros
                </button>
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
});
FAQSection.displayName = "FAQSection";
export default FAQSection;
