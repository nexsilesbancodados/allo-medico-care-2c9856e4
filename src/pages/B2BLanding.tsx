import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle2, ArrowRight, Shield, Users, Heart, Stethoscope, Clock, Star, Building2, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import { z } from "zod";
import b2bHero2 from "@/assets/b2b-hero-2.png";
import { lazy, Suspense } from "react";

const Footer = lazy(() => import("@/components/landing/Footer"));

const leadSchema = z.object({
  company_name: z.string().trim().min(2, "Nome da empresa obrigatório").max(200),
  contact_name: z.string().trim().min(2, "Nome do contato obrigatório").max(200),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().optional(),
  cnpj: z.string().optional(),
  company_type: z.string().min(1),
  message: z.string().max(2000).optional(),
});

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

const HeroImage = () => (
  <img src={b2bHero2} alt="Benefícios corporativos" className="absolute inset-0 w-full h-full object-cover" />
);

const B2BLanding = () => {
  const [form, setForm] = useState({ company_name: "", contact_name: "", email: "", phone: "", cnpj: "", company_type: "company", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = leadSchema.safeParse(form);
    if (!result.success) { toast.error(result.error.errors[0].message); return; }
    setSubmitting(true);
    const { error } = await supabase.from("b2b_leads").insert({ ...form, services_interested: ["cartao_corporativo"] });
    if (error) { toast.error("Erro ao enviar: " + error.message); setSubmitting(false); return; }
    await supabase.functions.invoke("b2b-lead-notification", { body: { ...form, services_interested: ["cartao_corporativo"] } }).catch(() => {});
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <>
      <SEOHead title="Cartão de Benefícios Corporativo | AloClinica" description="Ofereça saúde e bem-estar aos seus funcionários com o Cartão de Benefícios AloClinica. Telemedicina 24h, clube de vantagens e até 30% de desconto." />
      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero with Carousel */}
        <section className="relative overflow-hidden mt-[70px]" style={{ minHeight: "55vh" }}>
          <HeroImage />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
          <div className="container mx-auto px-4 relative z-20 flex items-end pb-12" style={{ minHeight: "55vh" }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-xl">
              <Badge className="mb-3 text-xs px-4 py-1 bg-white/15 text-white border-white/20 backdrop-blur-sm">
                <CreditCard className="w-3 h-3 mr-1" /> Para Empresas
              </Badge>
              <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight leading-tight text-left">
                Cartão de Benefícios<br /><span className="text-white/80">para seus Funcionários</span>
              </h1>
              <p className="text-sm text-white/70 max-w-lg mb-6 leading-relaxed text-left">
                Cuide da saúde da sua equipe com telemedicina 24h, clube de vantagens e descontos exclusivos.
              </p>
              <Button size="default" className="bg-white text-primary hover:bg-white/90 rounded-2xl px-8 font-bold shadow-2xl shadow-black/20" onClick={() => document.getElementById("form")?.scrollIntoView({ behavior: "smooth" })}>
                Solicitar Proposta <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <div className="flex flex-wrap items-start gap-4 mt-6">
                {[
                  { icon: <Heart className="w-3.5 h-3.5" />, label: "Telemedicina 24h" },
                  { icon: <Users className="w-3.5 h-3.5" />, label: "Planos Família" },
                  { icon: <Shield className="w-3.5 h-3.5" />, label: "30% Desconto" },
                  { icon: <Star className="w-3.5 h-3.5" />, label: "Clube de Vantagens" },
                ].map((item, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-white/50 text-xs font-medium">{item.icon} {item.label}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Por que oferecer o Cartão AloClinica?</h2>
                <p className="text-muted-foreground mt-2 max-w-lg mx-auto">Benefícios reais para seus colaboradores e sua empresa</p>
              </motion.div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
                {[
                  { icon: <Stethoscope className="w-7 h-7 text-white" />, title: "Telemedicina 24h", desc: "Consultas médicas por vídeo a qualquer hora, 30+ especialidades", gradient: "from-primary to-primary/70" },
                  { icon: <CreditCard className="w-7 h-7 text-white" />, title: "30% de Desconto", desc: "Economia em todas as consultas e serviços para o titular e dependentes", gradient: "from-secondary to-secondary/70" },
                  { icon: <Star className="w-7 h-7 text-white" />, title: "Clube de Vantagens", desc: "Descontos em farmácias, academias e serviços parceiros", gradient: "from-warning to-warning/70" },
                  { icon: <Heart className="w-7 h-7 text-white" />, title: "Assistência Funeral", desc: "Cobertura nacional incluída nos planos Pro e Diamante", gradient: "from-destructive to-destructive/70" },
                ].map((s, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="h-full border-border/50 hover:shadow-xl hover:border-border hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                      <CardContent className="p-6">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>{s.icon}</div>
                        <h3 className="font-bold text-foreground text-lg mb-2">{s.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Plans */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Planos Corporativos</h2>
                <p className="text-muted-foreground mt-2 max-w-lg mx-auto">Valores especiais para empresas — quanto mais cartões, maior o desconto</p>
              </motion.div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
                {[
                  { name: "Prata Familiar", price: "49,90", features: ["Telemedicina 24h ilimitada", "Clube de Vantagens", "Até 4 dependentes"], highlight: false },
                  { name: "Individual Pro", price: "39,90", features: ["Telemedicina 24h ilimitada", "Clube de Vantagens", "Assistência Funeral Nacional"], highlight: false },
                  { name: "Ouro Familiar", price: "79,90", features: ["Telemedicina 24h ilimitada", "Clube de Vantagens", "Até 6 dependentes", "Prioridade no atendimento"], highlight: true },
                  { name: "Diamante Familiar", price: "159,90", features: ["Telemedicina 24h ilimitada", "Clube de Vantagens", "Assistência Funeral Nacional", "Dependentes ilimitados", "Gestor dedicado"], highlight: false },
                ].map((plan, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className={`h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${plan.highlight ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border/50"}`}>
                      <CardContent className="p-6">
                        {plan.highlight && <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 text-xs">Mais Popular</Badge>}
                        <h3 className="font-bold text-foreground text-lg mb-1">{plan.name}</h3>
                        <div className="mb-4">
                          <span className="text-3xl font-black text-foreground">R$ {plan.price}</span>
                          <span className="text-sm text-muted-foreground">/mês</span>
                        </div>
                        <ul className="space-y-2.5">
                          {plan.features.map((f, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              <motion.p variants={fadeUp} className="text-center text-sm text-muted-foreground mt-8">
                * Valores por colaborador. Condições especiais para contratações acima de 50 cartões.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Advantages for company */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Vantagens para sua Empresa</h2>
              </motion.div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {[
                  { icon: <Users className="w-6 h-6" />, title: "Retenção de Talentos", desc: "Benefício diferenciado que valoriza seus colaboradores e reduz turnover" },
                  { icon: <Clock className="w-6 h-6" />, title: "Menos Absenteísmo", desc: "Consultas online reduzem faltas por idas ao médico durante expediente" },
                  { icon: <Building2 className="w-6 h-6" />, title: "Sem Burocracia", desc: "Implantação rápida, sem carência e sem coparticipação" },
                  { icon: <Phone className="w-6 h-6" />, title: "Suporte Dedicado", desc: "Gestor de conta exclusivo para RH e acompanhamento de utilização" },
                  { icon: <Shield className="w-6 h-6" />, title: "Custo Acessível", desc: "Muito mais barato que plano de saúde tradicional, sem reajuste por sinistralidade" },
                  { icon: <Heart className="w-6 h-6" />, title: "Bem-estar Integral", desc: "Saúde física e mental com acesso a diversas especialidades" },
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex items-start gap-4 p-5 rounded-2xl border border-border/50 hover:border-border hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">{item.icon}</div>
                    <div>
                      <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Form */}
        <section id="form" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="text-3xl font-black text-foreground text-center mb-3 tracking-tight">Solicite uma Proposta</h2>
            <p className="text-muted-foreground text-center mb-10">Preencha o formulário e nossa equipe comercial entrará em contato em até 24h</p>

            {submitted ? (
              <Card className="border-success/30 shadow-xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-success to-success/70 flex items-center justify-center mx-auto mb-5 shadow-lg">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Proposta solicitada!</h3>
                  <p className="text-muted-foreground">Nossa equipe comercial entrará em contato em breve.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-xl border-border/50">
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Empresa *</Label><Input required value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} className="mt-1.5 h-11 rounded-xl" /></div>
                      <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CNPJ</Label><Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" className="mt-1.5 h-11 rounded-xl" /></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome do Contato *</Label><Input required value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} className="mt-1.5 h-11 rounded-xl" /></div>
                      <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email *</Label><Input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1.5 h-11 rounded-xl" /></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1.5 h-11 rounded-xl" /></div>
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nº de Funcionários *</Label>
                        <Select value={form.company_type} onValueChange={v => setForm(f => ({ ...f, company_type: v }))}>
                          <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-50">1 a 50</SelectItem>
                            <SelectItem value="51-200">51 a 200</SelectItem>
                            <SelectItem value="201-500">201 a 500</SelectItem>
                            <SelectItem value="500+">Mais de 500</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mensagem</Label><Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Conte sobre as necessidades da sua empresa..." rows={3} className="mt-1.5 rounded-xl" /></div>
                    <Button type="submit" className="w-full h-13 rounded-xl bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground font-bold text-base shadow-xl shadow-primary/20 hover:shadow-2xl transition-shadow" disabled={submitting}>
                      {submitting ? "Enviando..." : "Solicitar Proposta Comercial"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>
    </>
  );
};

export default B2BLanding;
