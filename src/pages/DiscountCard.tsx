import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check, CreditCard, Heart, Shield, Star, Users, Zap, ArrowRight, Sparkles, Loader2,
  Stethoscope, Video, Pill, Clock, ShoppingBag, Percent, Gift,
  ChevronRight, HelpCircle, Umbrella, HeartHandshake, Building2, Flower2, Crown, Diamond
} from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { lazy, Suspense } from "react";
import heroCartao from "@/assets/hero-cartao.png";

const Footer = lazy(() => import("@/components/landing/Footer"));

const plans = [
  {
    id: "prata_familiar",
    name: "Prata Familiar",
    price: 49.9,
    people: "Titular + até 4 dependentes",
    icon: <Shield className="w-6 h-6 text-white" />,
    highlighted: false,
    gradient: "from-[hsl(210,15%,60%)] to-[hsl(210,15%,45%)]",
    benefits: ["Telemedicina 24h/7", "Clube de Vantagens (até 80% off)"],
    tag: null,
  },
  {
    id: "ouro_individual",
    name: "Individual Pro",
    price: 39.9,
    people: "Apenas o titular",
    icon: <Star className="w-6 h-6 text-white" />,
    highlighted: false,
    gradient: "from-[hsl(45,80%,50%)] to-[hsl(35,80%,42%)]",
    benefits: ["Telemedicina 24h/7", "Clube de Vantagens", "Assistência Funeral"],
    tag: null,
  },
  {
    id: "ouro_familiar",
    name: "Ouro Familiar",
    price: 79.9,
    people: "Titular + até 4 dependentes",
    icon: <Crown className="w-6 h-6 text-white" />,
    highlighted: true,
    gradient: "from-primary via-primary to-secondary",
    benefits: ["Telemedicina 24h/7 (todos)", "Clube de Vantagens (todos)"],
    tag: "⭐ MAIS POPULAR",
  },
  {
    id: "diamante_familiar",
    name: "Diamante Familiar",
    price: 159.9,
    people: "Titular + até 4 dependentes",
    icon: <Diamond className="w-6 h-6 text-white" />,
    highlighted: false,
    gradient: "from-[hsl(260,60%,55%)] to-[hsl(280,60%,45%)]",
    benefits: ["Telemedicina 24h/7 (todos)", "Clube de Vantagens (todos)", "Assistência Funeral (todos)"],
    tag: "💎 COMPLETO",
  },
];

const pilares = [
  {
    icon: Stethoscope, title: "Telemedicina 24h", color: "from-primary to-primary/70",
    items: ["Consultas por vídeo ilimitadas*", "Clínico geral e especialistas", "Receitas e atestados digitais", "Plantão 24h — médico na hora"],
  },
  {
    icon: ShoppingBag, title: "Clube de Vantagens", color: "from-secondary to-secondary/70",
    items: ["Até 80% off em + de 10.000 empresas", "Descontos em farmácias parceiras", "Descontos em exames laboratoriais", "Parcerias com óticas e academias"],
  },
  {
    icon: Umbrella, title: "Assistência Funerária", color: "from-warning to-warning/70",
    items: ["Cobertura familiar completa", "Translado nacional incluído", "Sem carência para ativação", "Suporte 24h em todo o Brasil"],
  },
];

const extras = [
  { icon: Pill, label: "Desconto em farmácias" },
  { icon: Video, label: "Teleconsulta ilimitada*" },
  { icon: Clock, label: "Plantão 24h" },
  { icon: Shield, label: "Assistência funeral" },
  { icon: Percent, label: "Até 80% de desconto" },
  { icon: Gift, label: "Sem carência" },
  { icon: HeartHandshake, label: "Cobertura familiar" },
  { icon: Building2, label: "+10.000 empresas parceiras" },
];

const faqs = [
  { q: "O Cartão de Benefícios é um plano de saúde?", a: "Não. O Cartão de Benefícios é um programa de vantagens que oferece acesso a telemedicina, clube de descontos e assistência funerária. Não substitui um plano de saúde." },
  { q: "Tem carência?", a: "Não! Todos os benefícios são ativados imediatamente após a confirmação do pagamento." },
  { q: "Posso cancelar quando quiser?", a: "Sim. Sem multa e sem burocracia. Cancele direto pelo app a qualquer momento." },
  { q: "A assistência funerária está em todos os planos?", a: "Não. A assistência funerária está incluída no Individual Pro (titular), e no Diamante Familiar (todos os membros). Os planos Prata e Ouro Familiar não incluem assistência funerária." },
  { q: "Como funciona a teleconsulta?", a: "Você agenda ou acessa o plantão 24h. Um médico atende por vídeo e pode emitir receitas e atestados digitais com validade legal." },
  { q: "Quais empresas participam do Clube de Vantagens?", a: "Mais de 10.000 empresas parceiras com descontos de até 80%. Farmácias, óticas, academias, laboratórios e muito mais." },
  { q: "Qual a diferença entre Ouro e Diamante Familiar?", a: "O Ouro Familiar inclui telemedicina e clube de vantagens para todos. O Diamante Familiar adiciona assistência funerária completa para todos os 5 membros." },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const DiscountCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const handleSubscribe = async (planId: string, price: number) => {
    if (!user) {
      toast.info("Faça login para assinar o Cartão de Benefícios");
      navigate("/paciente");
      return;
    }
    setSubscribing(planId);
    try {
      const { data: existing } = await supabase.from("discount_cards").select("id, status").eq("user_id", user.id).eq("status", "active").maybeSingle();
      if (existing) { toast.info("Você já possui um cartão ativo!"); setSubscribing(null); return; }
      const planName = plans.find(p => p.id === planId)?.name || planId;
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke("create-asaas-payment", {
        body: { customer_email: user.email, customer_name: user.user_metadata?.first_name || "Paciente", amount: price, description: `Cartão de Benefícios - ${planName}`, billing_type: "PIX" },
      });
      if (paymentError) throw paymentError;
      const validUntil = new Date(); validUntil.setMonth(validUntil.getMonth() + 1);
      const { error: cardError } = await supabase.from("discount_cards").insert({ user_id: user.id, plan_type: planId, price_monthly: price, discount_percent: 30, status: "active", valid_until: validUntil.toISOString(), payment_id: paymentData?.payment?.id || null });
      if (cardError) throw cardError;
      toast.success("Cartão de Benefícios ativado! 🎉", { description: "Aproveite todos os benefícios agora mesmo." });
      if (paymentData?.payment?.invoiceUrl) window.open(paymentData.payment.invoiceUrl, "_blank");
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Subscription error:", err);
      toast.error("Erro ao processar", { description: err.message || "Tente novamente." });
    } finally { setSubscribing(null); }
  };

  return (
    <>
      <SEOHead title="Cartão de Benefícios | AloClinica — Telemedicina, Descontos e Assistência" description="Telemedicina 24h, clube de vantagens com até 80% de desconto e assistência funerária. Planos a partir de R$ 39,90/mês." />
      <div className="min-h-screen bg-background">
        <Header />

        {/* ==================== HERO ==================== */}
        <section className="relative overflow-hidden mt-[70px]" style={{ minHeight: "85vh" }}>
          <img src={heroCartao} alt="Cartão de Benefícios" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative flex items-center" style={{ minHeight: "85vh" }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="mb-5 text-sm px-5 py-1.5 bg-white/15 text-white border-white/20 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Cartão de Benefícios
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 tracking-tight leading-tight">
                Saúde + Economia<br /><span className="text-white/85">para toda a família</span>
              </h1>
              <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
                Telemedicina 24h, clube de vantagens com até 80% de desconto em +10.000 empresas, e assistência funerária completa. Tudo em um único cartão.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-2xl h-14 px-10 text-base font-bold shadow-2xl" onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}>
                  Ver Planos <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 mt-4">
                {[
                  { icon: <Shield className="w-4 h-4" />, label: "Sem carência" },
                  { icon: <Star className="w-4 h-4" />, label: "Cancele quando quiser" },
                  { icon: <Zap className="w-4 h-4" />, label: "Ativação imediata" },
                  { icon: <Flower2 className="w-4 h-4" />, label: "Assist. Funerária" },
                ].map((item, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-white/55 text-sm font-medium">{item.icon} {item.label}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================== 3 PILARES ==================== */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-14">
                <Badge variant="outline" className="mb-3 text-sm px-4 py-1 rounded-full"><Zap className="w-3.5 h-3.5 mr-1.5" /> 3 em 1</Badge>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Um cartão, três pilares</h2>
                <p className="text-muted-foreground mt-2 max-w-lg mx-auto">Benefícios reais que fazem diferença no seu dia a dia e no bolso.</p>
              </motion.div>
              <div className="grid md:grid-cols-3 gap-6">
                {pilares.map((pilar, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="h-full border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                      <CardContent className="p-7">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pilar.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                          <pilar.icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-black text-foreground mb-4">{pilar.title}</h3>
                        <ul className="space-y-3">
                          {pilar.items.map((item, j) => (
                            <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================== BENEFÍCIOS RÁPIDOS ==================== */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="max-w-4xl mx-auto">
              <motion.div variants={fadeUp} className="text-center mb-10 relative">
                <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Tudo incluso no seu cartão</h2>
                
              </motion.div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {extras.map(({ icon: Icon, label }, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================== PLANOS ==================== */}
        <section id="planos" className="py-20">
          <div className="container mx-auto px-4">
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-12">
                <Badge variant="outline" className="mb-3 text-sm px-4 py-1 rounded-full"><CreditCard className="w-3.5 h-3.5 mr-1.5" /> Planos</Badge>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Escolha seu plano</h2>
                <p className="text-muted-foreground mt-2">Planos que cabem no seu bolso com benefícios reais</p>
              </motion.div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {plans.map((plan) => (
                  <motion.div key={plan.id} variants={fadeUp}>
                    <Card className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl h-full ${plan.highlighted ? "border-primary shadow-xl shadow-primary/15 ring-2 ring-primary/20" : "border-border/50 hover:shadow-xl hover:border-border"}`}>
                      {plan.tag && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-secondary text-primary-foreground text-center text-xs py-1.5 font-bold tracking-wide">{plan.tag}</div>
                      )}
                      <CardContent className={`p-6 text-center flex flex-col h-full ${plan.tag ? "pt-10" : ""}`}>
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}>{plan.icon}</div>
                        <h3 className="text-lg font-black text-foreground">{plan.name}</h3>
                        <p className="text-xs text-muted-foreground mb-4">{plan.people}</p>
                        <div className="mb-2">
                          <span className="text-4xl font-black text-foreground">R$ {plan.price.toFixed(2).replace(".", ",")}</span>
                          <span className="text-muted-foreground text-sm">/mês</span>
                        </div>
                        <ul className="text-left space-y-2 my-4 flex-1">
                          {plan.benefits.map((b, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          className={`w-full h-11 rounded-xl font-bold text-sm shadow-lg transition-shadow ${plan.highlighted ? "bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground shadow-primary/20 hover:shadow-xl hover:shadow-primary/30" : ""}`}
                          variant={plan.highlighted ? "default" : "outline"}
                          onClick={() => handleSubscribe(plan.id, plan.price)}
                          disabled={subscribing === plan.id}
                        >
                          {subscribing === plan.id ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Processando...</> : <>Assinar agora <ArrowRight className="w-4 h-4 ml-1.5" /></>}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-3">Cancele quando quiser • Sem carência</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-6">*Consultas ilimitadas no clínico geral. Especialistas conforme disponibilidade.</p>
            </motion.div>
          </div>
        </section>

        {/* ==================== COMO FUNCIONA ==================== */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-14 relative">
                <Badge variant="outline" className="mb-3 text-sm px-4 py-1 rounded-full"><HelpCircle className="w-3.5 h-3.5 mr-1.5" /> Passo a passo</Badge>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Como funciona?</h2>
                
              </motion.div>
              <div className="grid sm:grid-cols-3 gap-6">
                {[
                  { step: "01", title: "Escolha seu plano", desc: "Prata, Individual Pro, Ouro ou Diamante. Cada um com benefícios sob medida.", icon: <CreditCard className="w-6 h-6 text-white" />, gradient: "from-primary to-primary/70" },
                  { step: "02", title: "Ativação imediata", desc: "Pague via PIX e seu cartão é ativado na hora. Sem carência.", icon: <Zap className="w-6 h-6 text-white" />, gradient: "from-secondary to-secondary/70" },
                  { step: "03", title: "Use seus benefícios", desc: "Consulte por vídeo, compre com desconto e tenha cobertura completa.", icon: <HeartHandshake className="w-6 h-6 text-white" />, gradient: "from-warning to-warning/70" },
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="h-full border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>{item.icon}</div>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground/40">PASSO {item.step}</span>
                        <h3 className="font-bold text-foreground text-lg mt-1 mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================== FAQ ==================== */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-10">
                <h2 className="text-3xl font-black text-foreground tracking-tight flex items-center justify-center gap-2"><HelpCircle className="w-7 h-7 text-primary" /> Perguntas Frequentes</h2>
              </motion.div>
              <div className="space-y-4">
                {faqs.map(({ q, a }) => (
                  <motion.details key={q} variants={fadeUp} className="group p-5 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
                    <summary className="font-semibold text-foreground cursor-pointer flex items-center justify-between">
                      {q}
                      <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{a}</p>
                  </motion.details>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================== CTA FINAL ==================== */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-primary via-primary/90 to-secondary rounded-3xl p-10 text-center text-white shadow-2xl relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
              <h2 className="text-2xl sm:text-3xl font-black mb-3">Comece a economizar hoje</h2>
              <p className="text-white/70 mb-6 max-w-md mx-auto">Ative seu Cartão de Benefícios e tenha acesso imediato a telemedicina, descontos e assistência funerária.</p>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-2xl h-14 px-10 text-base font-bold shadow-2xl" onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}>
                Ver Planos <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </section>

        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>
    </>
  );
};

export default DiscountCard;
