import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle2, ArrowRight, Shield, Users, Heart, Stethoscope, Clock, Star, Building2, Phone, FileText, Brain, Fingerprint, Zap, Upload, ChevronRight } from "lucide-react";
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
  const [step, setStep] = useState(1);
  const [quiz, setQuiz] = useState({ segment: "", employees: "", current_benefit: "", interest: [] as string[], budget: "" });
  const [form, setForm] = useState({ company_name: "", contact_name: "", email: "", phone: "", cnpj: "", company_type: "company", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleInterest = (val: string) => {
    setQuiz(q => ({ ...q, interest: q.interest.includes(val) ? q.interest.filter(v => v !== val) : [...q.interest, val] }));
  };

  const canAdvanceStep1 = quiz.segment && quiz.employees && quiz.current_benefit && quiz.interest.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = leadSchema.safeParse({ ...form, company_type: quiz.employees || form.company_type });
    if (!result.success) { toast.error(result.error.errors[0].message); return; }
    setSubmitting(true);
    const servicesInterested = [...quiz.interest, `segmento:${quiz.segment}`, `funcionarios:${quiz.employees}`, `beneficio_atual:${quiz.current_benefit}`, quiz.budget ? `orcamento:${quiz.budget}` : ""].filter(Boolean);
    const { error } = await supabase.from("b2b_leads").insert({ ...form, company_type: quiz.segment, services_interested: servicesInterested as any });
    if (error) { toast.error("Erro ao enviar: " + error.message); setSubmitting(false); return; }
    await supabase.functions.invoke("b2b-lead-notification", { body: { ...form, services_interested: servicesInterested } }).catch(() => {});
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



        {/* ==================== TELELAUDO PARA CLÍNICAS ==================== */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-4">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-semibold mb-4">
                  <FileText className="w-3.5 h-3.5" /> Telelaudo
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Laudos a Distância para sua Clínica</h2>
                <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Terceirize laudos médicos com segurança, agilidade e assinatura digital verificável.</p>
              </motion.div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto mt-10">
                {[
                  { icon: <Upload className="w-7 h-7 text-white" />, title: "Upload Fácil", desc: "Envie exames pela plataforma ou integre via PACS/DICOM automaticamente.", gradient: "from-primary to-primary/70" },
                  { icon: <Brain className="w-7 h-7 text-white" />, title: "IA de Triagem", desc: "Classificação automática por urgência com sugestão inteligente de achados.", gradient: "from-warning to-warning/70" },
                  { icon: <Fingerprint className="w-7 h-7 text-white" />, title: "Assinatura Digital", desc: "Laudos com hash SHA-256, QR Code de verificação e rastreabilidade total.", gradient: "from-secondary to-secondary/70" },
                  { icon: <Zap className="w-7 h-7 text-white" />, title: "SLA < 2 horas", desc: "Laudos urgentes em até 2h, normais em até 24h com alertas de prazo.", gradient: "from-destructive to-destructive/70" },
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

              <motion.div variants={fadeUp} className="mt-10 max-w-4xl mx-auto">
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    "Eletrocardiograma (ECG)",
                    "Raio-X e Tomografia",
                    "Ressonância Magnética",
                    "Eletroencefalograma (EEG)",
                    "Ultrassonografia",
                    "Espirometria",
                  ].map((exam, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border/50 text-sm font-medium text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      {exam}
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-10 text-center">
                <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-secondary to-primary text-primary-foreground shadow-xl">
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-bold">Integre o Telelaudo à sua operação</h3>
                    <p className="text-sm opacity-70 mt-1">Laudos rápidos, seguros e verificáveis. Sem necessidade de equipe própria de laudistas.</p>
                  </div>
                  <Button size="lg" className="bg-white text-secondary hover:bg-white/90 rounded-full px-8 font-bold shadow-lg shrink-0" asChild>
                    <Link to="/laudista">Sou Laudista <ChevronRight className="w-4 h-4 ml-1" /></Link>
                  </Button>
                </div>
              </motion.div>
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

        {/* Multi-step Form */}
        <section id="form" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="text-3xl font-black text-foreground text-center mb-3 tracking-tight">Solicite uma Proposta</h2>
            <p className="text-muted-foreground text-center mb-4">Responda algumas perguntas para montarmos a proposta ideal</p>

            {/* Progress */}
            {!submitted && (
              <div className="flex items-center justify-center gap-2 mb-10">
                {[1, 2].map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{s}</div>
                    {s < 2 && <div className={`w-16 h-1 rounded-full transition-colors ${step > s ? "bg-primary" : "bg-muted"}`} />}
                  </div>
                ))}
              </div>
            )}

            {submitted ? (
              <Card className="border-success/30 shadow-xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-success to-success/70 flex items-center justify-center mx-auto mb-5 shadow-lg">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Proposta solicitada!</h3>
                  <p className="text-muted-foreground">Nossa equipe comercial entrará em contato em até 24h com uma proposta personalizada.</p>
                </CardContent>
              </Card>
            ) : step === 1 ? (
              <Card className="shadow-xl border-border/50">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div>
                    <Label className="text-sm font-bold text-foreground mb-3 block">1. Qual o segmento da sua empresa?</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {["Comércio", "Indústria", "Serviços", "Saúde", "Educação", "Outro"].map(v => (
                        <button key={v} type="button" onClick={() => setQuiz(q => ({ ...q, segment: v }))}
                          className={`p-3 rounded-xl border text-sm font-medium transition-all ${quiz.segment === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-bold text-foreground mb-3 block">2. Quantos funcionários sua empresa possui?</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {["1–20", "21–50", "51–200", "200+"].map(v => (
                        <button key={v} type="button" onClick={() => setQuiz(q => ({ ...q, employees: v }))}
                          className={`p-3 rounded-xl border text-sm font-medium transition-all ${quiz.employees === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-bold text-foreground mb-3 block">3. Sua empresa já oferece algum benefício de saúde?</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Plano de saúde", "Convênio", "Nenhum benefício", "Outro"].map(v => (
                        <button key={v} type="button" onClick={() => setQuiz(q => ({ ...q, current_benefit: v }))}
                          className={`p-3 rounded-xl border text-sm font-medium transition-all ${quiz.current_benefit === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-bold text-foreground mb-3 block">4. O que mais interessa para sua empresa? (selecione quantos quiser)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Telemedicina 24h", "Clube de Vantagens", "Cartão de Desconto", "Assistência Funeral", "Prioridade no atendimento", "Gestor dedicado"].map(v => (
                        <button key={v} type="button" onClick={() => toggleInterest(v)}
                          className={`p-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${quiz.interest.includes(v) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"}`}>
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${quiz.interest.includes(v) ? "text-primary" : "text-transparent"}`} />
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-bold text-foreground mb-3 block">5. Orçamento mensal estimado por colaborador (opcional)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {["Até R$50", "R$50–100", "R$100–200", "A definir"].map(v => (
                        <button key={v} type="button" onClick={() => setQuiz(q => ({ ...q, budget: v }))}
                          className={`p-3 rounded-xl border text-sm font-medium transition-all ${quiz.budget === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button onClick={() => { setStep(2); document.getElementById("form")?.scrollIntoView({ behavior: "smooth" }); }} disabled={!canAdvanceStep1}
                    className="w-full h-13 rounded-xl bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground font-bold text-base shadow-xl shadow-primary/20">
                    Próximo: Dados da Empresa <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
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
                      <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cargo</Label><Input value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Ex: RH, Diretor, Proprietário" className="mt-1.5 h-11 rounded-xl" /></div>
                    </div>

                    {/* Quiz summary */}
                    <div className="bg-muted/50 rounded-xl p-4 space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Resumo do questionário</p>
                      <p className="text-sm text-foreground"><span className="text-muted-foreground">Segmento:</span> {quiz.segment}</p>
                      <p className="text-sm text-foreground"><span className="text-muted-foreground">Funcionários:</span> {quiz.employees}</p>
                      <p className="text-sm text-foreground"><span className="text-muted-foreground">Benefício atual:</span> {quiz.current_benefit}</p>
                      <p className="text-sm text-foreground"><span className="text-muted-foreground">Interesses:</span> {quiz.interest.join(", ")}</p>
                      {quiz.budget && <p className="text-sm text-foreground"><span className="text-muted-foreground">Orçamento:</span> {quiz.budget}</p>}
                    </div>

                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-xl h-13 flex-1">
                        Voltar
                      </Button>
                      <Button type="submit" className="flex-[2] h-13 rounded-xl bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground font-bold text-base shadow-xl shadow-primary/20 hover:shadow-2xl transition-shadow" disabled={submitting}>
                        {submitting ? "Enviando..." : "Enviar e Receber Proposta"}
                      </Button>
                    </div>
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
