import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check, CreditCard, Heart, Shield, Star, Users, Zap, ArrowRight, Sparkles, Loader2,
  Stethoscope, Video, Pill, Clock, ShoppingBag, Percent, Gift,
  ChevronRight, HelpCircle, Umbrella, HeartHandshake, Building2, Flower2, Crown, Diamond, Phone, TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { lazy, Suspense } from "react";
import heroCartao from "@/assets/hero-cartao.png";
import cardFamily from "@/assets/card-family-telemedicine.jpg";
import cardClube from "@/assets/card-clube-vantagens.jpg";
import cardPremium from "@/assets/card-premium-render.png";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "@/components/patient/patientNav";

const Footer = lazy(() => import("@/components/landing/Footer"));

const plans = [
  {
    id: "prata_familiar",
    name: "Mini Família",
    price: 47.9,
    people: "Titular + até 4 dependentes",
    icon: <Shield className="w-6 h-6 text-white" />,
    highlighted: false,
    gradient: "from-[hsl(210,15%,60%)] to-[hsl(210,15%,45%)]",
    benefits: ["Telemedicina 24h/7", "Clube de Vantagens (até 80% off)"],
    tag: null,
  },
  {
    id: "ouro_individual",
    name: "Solitário",
    price: 37.9,
    people: "Apenas o titular",
    icon: <Star className="w-6 h-6 text-white" />,
    highlighted: false,
    gradient: "from-[hsl(45,80%,50%)] to-[hsl(35,80%,42%)]",
    benefits: ["Telemedicina 24h/7", "Clube de Vantagens", "Assistência Funeral"],
    tag: null,
  },
  {
    id: "ouro_familiar",
    name: "King Família",
    price: 77.9,
    people: "Titular + até 4 dependentes",
    icon: <Crown className="w-6 h-6 text-white" />,
    highlighted: true,
    gradient: "from-primary via-primary to-secondary",
    benefits: ["Telemedicina 24h/7 (todos)", "Clube de Vantagens (todos)"],
    tag: "⭐ MAIS POPULAR",
  },
  {
    id: "diamante_familiar",
    name: "Prime Família",
    price: 157.9,
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
  { q: "A assistência funerária está em todos os planos?", a: "Não. A assistência funerária está incluída no Solitário (titular), e no Prime Família (todos os membros). Os planos Mini Família e King Família não incluem assistência funerária." },
  { q: "Como funciona a teleconsulta?", a: "Você agenda ou acessa o plantão 24h. Um médico atende por vídeo e pode emitir receitas e atestados digitais com validade legal." },
  { q: "Quais empresas participam do Clube de Vantagens?", a: "Mais de 10.000 empresas parceiras com descontos de até 80%. Farmácias, óticas, academias, laboratórios e muito mais." },
  { q: "Qual a diferença entre King e Prime Família?", a: "O King Família inclui telemedicina e clube de vantagens para todos. O Prime Família adiciona assistência funerária completa para todos os 5 membros." },
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

      const { data: profile } = await supabase.from("profiles").select("first_name, last_name, cpf, phone").eq("user_id", user.id).single();
      if (!profile?.cpf) {
        toast.error("CPF obrigatório", { description: "Complete seu perfil com o CPF antes de assinar." });
        setSubscribing(null);
        return;
      }

      const customerName = `${profile.first_name} ${profile.last_name}`.trim();
      const planName = plans.find(p => p.id === planId)?.name || planId;

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke("create-asaas-payment", {
        body: {
          customerName,
          customerCpf: profile.cpf,
          customerEmail: user.email || "",
          customerMobilePhone: profile.phone || "",
          billingType: "PIX",
          value: price,
          description: `Cartão de Benefícios - ${planName}`,
          cycle: "MONTHLY",
          planId: `card_${planId}_${user.id}`,
        },
      });
      if (paymentError) throw paymentError;
      if (!paymentData?.success) throw new Error(paymentData?.error || "Erro no gateway de pagamento");

      if (paymentData?.pixQrCode) {
        sessionStorage.setItem("pending_card_plan", planId);
        toast.success("Assinatura criada! 🎉", { description: "Pague o PIX para ativar seu cartão. Acompanhe no dashboard." });
        navigate("/dashboard/plans?role=patient");
      } else if (paymentData?.invoiceUrl) {
        window.open(paymentData.invoiceUrl, "_blank");
        toast.success("Assinatura criada!", { description: "Pague a fatura para ativar seu Cartão de Benefícios." });
        navigate("/dashboard/plans?role=patient");
      } else {
        toast.success("Assinatura criada!", { description: "Seu cartão será ativado após a confirmação do pagamento." });
        navigate("/dashboard/plans?role=patient");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Tente novamente.";
      toast.error("Erro ao processar", { description: message });
    } finally { setSubscribing(null); }
  };

  const [searchParams] = useSearchParams();
  const isDashboard = !!searchParams.get("role");

  const content = (
    <>
      <SEOHead title="Cartão de Benefícios | AloClinica — Telemedicina, Descontos e Assistência" description="Telemedicina 24h, clube de vantagens com até 80% de desconto e assistência funerária. Planos a partir de R$ 39,90/mês." />
      <div className={`${isDashboard ? "" : "min-h-screen"} relative`}>
        {!isDashboard && <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(45,60%,96%)] via-[hsl(40,50%,91%)] to-[hsl(35,45%,85%)] dark:from-[hsl(45,25%,8%)] dark:via-[hsl(40,20%,10%)] dark:to-[hsl(35,18%,12%)]" />}
        {!isDashboard && <Header />}

        {/* ==================== HERO ==================== */}
        <section className={`relative overflow-hidden ${isDashboard ? "" : "mt-[70px]"}`} style={{ minHeight: isDashboard ? "40vh" : "60vh" }}>
          <img src={heroCartao} alt="Cartão de Benefícios" className="absolute inset-0 w-full h-full object-cover" loading="eager" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative flex items-end pb-16" style={{ minHeight: "60vh" }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-xl">
              <Badge className="mb-3 text-xs px-4 py-1 bg-white/15 text-white border-white/20 backdrop-blur-sm">
                <Sparkles className="w-3 h-3 mr-1" /> Cartão de Benefícios
              </Badge>
              <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight leading-tight">
                Saúde + Economia<br /><span className="text-white/85">para toda a família</span>
              </h1>
              <p className="text-sm text-white/70 max-w-lg mb-6 leading-relaxed">
                Telemedicina 24h, clube de vantagens com até 80% de desconto e assistência funerária. Tudo em um único cartão.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="rainbow" size="default" className="rounded-2xl px-8 font-bold" onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}>
                  Ver Planos <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button size="default" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-2xl px-6 font-bold backdrop-blur-sm" onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}>
                  Como funciona?
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-6">
                {[
                  { icon: <Shield className="w-3.5 h-3.5" />, label: "Sem carência" },
                  { icon: <Star className="w-3.5 h-3.5" />, label: "Cancele quando quiser" },
                  { icon: <Zap className="w-3.5 h-3.5" />, label: "Ativação imediata" },
                  { icon: <Flower2 className="w-3.5 h-3.5" />, label: "Assist. Funerária" },
                ].map((item, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-white/50 text-xs font-medium">{item.icon} {item.label}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================== NUMBERS STRIP ==================== */}
        <section className="bg-primary py-6">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: "10.000+", label: "Empresas parceiras", icon: Building2 },
                { value: "24h/7", label: "Médico disponível", icon: Clock },
                { value: "80%", label: "Desconto máximo", icon: TrendingUp },
                { value: "0", label: "Carência (dias)", icon: Zap },
              ].map(({ value, label, icon: Icon }, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex flex-col items-center gap-1">
                  <Icon className="w-5 h-5 text-primary-foreground/60 mb-1" />
                  <span className="text-2xl md:text-3xl font-black text-primary-foreground">{value}</span>
                  <span className="text-xs text-primary-foreground/70 font-medium">{label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== 3 PILARES ==================== */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-5xl pb-24 md:pb-8">
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

        {/* ==================== BANNER TELEMEDICINA ==================== */}
        <section className="relative overflow-hidden" style={{ minHeight: "340px" }}>
          <img src={cardFamily} alt="Família usando telemedicina" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
          <div className="container mx-auto px-4 relative flex items-center" style={{ minHeight: "340px" }}>
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="max-w-lg py-12">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">Telemedicina 24h</Badge>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3">
                Médico na palma da mão,<br />quando você precisar
              </h2>
              <p className="text-white/80 text-sm leading-relaxed mb-5 max-w-md">
                Consultas por vídeo com clínicos gerais e especialistas. Receitas digitais com validade legal. Plantão 24h para emergências.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Clínico Geral", "Pediatria", "Dermatologia", "Psicologia"].map((spec) => (
                  <span key={spec} className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium backdrop-blur-sm border border-white/10">
                    {spec}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================== BENEFÍCIOS RÁPIDOS ==================== */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="max-w-4xl mx-auto">
              <motion.div variants={fadeUp} className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Tudo incluso no seu cartão</h2>
              </motion.div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {extras.map(({ icon: Icon, label }, i) => (
                  <motion.div key={i} variants={fadeUp} className="card-interactive flex flex-col items-center gap-3 p-5 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group text-center">
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

        {/* ==================== BANNER CLUBE ==================== */}
        <section className="relative overflow-hidden" style={{ minHeight: "340px" }}>
          <img src={cardClube} alt="Clube de vantagens com descontos" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-l from-secondary/90 via-secondary/70 to-transparent" />
          <div className="container mx-auto px-4 relative flex items-center justify-end" style={{ minHeight: "340px" }}>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="max-w-lg py-12 text-right">
              <div className="flex items-center gap-2 mb-4 justify-end">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">Clube de Vantagens</Badge>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3">
                Economize até 80%<br />em milhares de parceiros
              </h2>
              <p className="text-white/80 text-sm leading-relaxed mb-5 max-w-md ml-auto">
                Farmácias, óticas, academias, laboratórios e muito mais. São mais de 10.000 empresas com descontos exclusivos para você e sua família.
              </p>
              <div className="flex flex-wrap gap-3 justify-end">
                {["Farmácias", "Óticas", "Academias", "Laboratórios"].map((cat) => (
                  <span key={cat} className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium backdrop-blur-sm border border-white/10">
                    {cat}
                  </span>
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

        {/* ==================== BANNER CARTÃO PREMIUM ==================== */}
        <section className="py-16 bg-[hsl(210,50%,8%)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(160,55%,45%,0.08),transparent_70%)]" />
          <div className="container mx-auto px-4 relative">
            <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <Badge className="mb-4 bg-secondary/20 text-secondary border-secondary/30 text-xs">
                  <Diamond className="w-3 h-3 mr-1" /> Cartão Premium
                </Badge>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-4">
                  Seu cartão digital<br />sempre com você
                </h2>
                <p className="text-white/60 text-sm leading-relaxed mb-6">
                  Acesse seus benefícios direto pelo celular. Cartão digital com QR code exclusivo para identificação rápida em farmácias e parceiros.
                </p>
                <ul className="space-y-3 mb-6">
                  {["Cartão digital no celular", "QR Code para validação", "Compartilhe com dependentes", "Ativação instantânea"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-white/70">
                      <Check className="w-4 h-4 text-secondary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-2xl px-8 font-bold shadow-lg" onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}>
                  Quero meu cartão <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="flex items-center justify-center">
                <img src={cardPremium} alt="Cartão Premium AloClinica" className="w-full max-w-sm rounded-2xl shadow-2xl shadow-secondary/10" loading="lazy" decoding="async" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ==================== COMO FUNCIONA ==================== */}
        <section id="como-funciona" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-14">
                <Badge variant="outline" className="mb-3 text-sm px-4 py-1 rounded-full"><HelpCircle className="w-3.5 h-3.5 mr-1.5" /> Passo a passo</Badge>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Como funciona?</h2>
              </motion.div>
              <div className="grid sm:grid-cols-3 gap-6">
                {[
                  { step: "01", title: "Escolha seu plano", desc: "Solitário, Mini Família, King ou Prime. Cada um com benefícios sob medida.", icon: <CreditCard className="w-6 h-6 text-white" />, gradient: "from-primary to-primary/70" },
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
              <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-white/5 blur-2xl" />
              <h2 className="text-2xl sm:text-3xl font-black mb-3 relative">Comece a economizar hoje</h2>
              <p className="text-white/70 mb-6 max-w-md mx-auto relative">Ative seu Cartão de Benefícios e tenha acesso imediato a telemedicina, descontos e assistência funerária.</p>
              <div className="flex flex-wrap gap-3 justify-center relative">
                <Button variant="rainbow" size="lg" className="rounded-2xl h-14 px-10 text-base font-bold" onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}>
                  Ver Planos <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-2xl h-14 px-8 text-base font-bold backdrop-blur-sm">
                  <Phone className="w-5 h-5 mr-2" /> Falar com consultor
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {!isDashboard && (
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        )}
      </div>
    </>
  );

  if (isDashboard) {
    return (
      <DashboardLayout title="Cartão de Benefícios" nav={getPatientNav("discount-card")} role="patient">
        {content}
      </DashboardLayout>
    );
  }

  return content;
};

export default DiscountCard;
