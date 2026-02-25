import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Heart, Shield, Star, Users, Zap, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const plans = [
  { id: "individual", name: "Individual", price: 24.9, people: "1 pessoa", icon: <CreditCard className="w-6 h-6 text-white" />, highlighted: false, gradient: "from-primary to-primary/70" },
  { id: "couple", name: "Casal", price: 39.9, people: "2 pessoas", icon: <Heart className="w-6 h-6 text-white" />, highlighted: true, gradient: "from-primary via-primary to-secondary" },
  { id: "family", name: "Família", price: 54.9, people: "Até 4 pessoas", icon: <Users className="w-6 h-6 text-white" />, highlighted: false, gradient: "from-secondary to-secondary/70" },
];

const benefits = [
  "30% de desconto em teleconsultas eletivas",
  "30% de desconto no Plantão 24h",
  "30% de desconto na renovação de receita",
  "Prioridade no agendamento",
  "Acesso ao Cofre de Documentos",
  "Sem carência — benefício imediato",
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } } };

const DiscountCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const handleSubscribe = async (planId: string, price: number) => {
    if (!user) {
      toast.info("Faça login para assinar o cartão de desconto");
      navigate("/paciente");
      return;
    }

    setSubscribing(planId);
    try {
      // Check if user already has an active card
      const { data: existing } = await supabase
        .from("discount_cards")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (existing) {
        toast.info("Você já possui um cartão de desconto ativo!");
        setSubscribing(null);
        return;
      }

      // Create payment via Asaas
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke("create-asaas-payment", {
        body: {
          customer_email: user.email,
          customer_name: user.user_metadata?.first_name || "Paciente",
          amount: price,
          description: `Cartão de Desconto - ${planId === "individual" ? "Individual" : planId === "couple" ? "Casal" : "Família"}`,
          billing_type: "PIX",
        },
      });

      if (paymentError) throw paymentError;

      // Create discount card record
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + 1);

      const { error: cardError } = await supabase.from("discount_cards").insert({
        user_id: user.id,
        plan_type: planId,
        price_monthly: price,
        discount_percent: 30,
        status: "active",
        valid_until: validUntil.toISOString(),
        payment_id: paymentData?.payment?.id || null,
      });

      if (cardError) throw cardError;

      toast.success("Cartão de desconto ativado com sucesso! 🎉", {
        description: "Você já pode aproveitar 30% de desconto em todos os serviços.",
      });

      // If Asaas returned a PIX payment link, open it
      if (paymentData?.payment?.invoiceUrl) {
        window.open(paymentData.payment.invoiceUrl, "_blank");
      }

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Subscription error:", err);
      toast.error("Erro ao processar assinatura", { description: err.message || "Tente novamente." });
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <>
      <SEOHead title="Cartão de Desconto | AloClinica" description="Economize 30% em teleconsultas, plantão 24h e renovação de receitas." />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/40 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={logo} alt="AloClinica" className="w-9 h-9 rounded-xl" />
              <span className="font-bold text-foreground text-lg tracking-tight">AloClínica</span>
            </Link>
            <Button variant="outline" className="rounded-xl font-semibold" asChild><Link to="/paciente">Entrar</Link></Button>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary" />
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full bg-white/5 blur-3xl" />
          <div className="container mx-auto px-4 text-center relative">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="mb-5 text-sm px-5 py-1.5 bg-white/15 text-white border-white/20 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Cartão de Desconto
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-5 tracking-tight leading-tight">
                Economize <span className="text-white/90">30%</span><br />em toda a plataforma
              </h1>
              <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
                Teleconsultas, Plantão 24h e renovação de receita com desconto permanente. Planos a partir de R$ 24,90/mês.
              </p>
              <div className="flex items-center justify-center gap-6 mt-4">
                {[
                  { icon: <Shield className="w-4 h-4" />, label: "Sem carência" },
                  { icon: <Star className="w-4 h-4" />, label: "Cancele quando quiser" },
                  { icon: <Zap className="w-4 h-4" />, label: "Benefício imediato" },
                ].map((item, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-white/60 text-sm font-medium">{item.icon} {item.label}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Plans */}
        <section className="py-20 -mt-8 relative z-10">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {plans.map((plan, i) => (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                    plan.highlighted 
                      ? "border-primary shadow-xl shadow-primary/15 ring-2 ring-primary/20" 
                      : "border-border/50 hover:shadow-xl hover:border-border"
                  }`}>
                    {plan.highlighted && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-secondary text-white text-center text-xs py-1.5 font-bold">
                        ⭐ Mais Popular
                      </div>
                    )}
                    <CardContent className={`p-7 text-center ${plan.highlighted ? "pt-12" : ""}`}>
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                        {plan.icon}
                      </div>
                      <h3 className="text-xl font-black text-foreground">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mb-5">{plan.people}</p>
                      <div className="mb-7">
                        <span className="text-5xl font-black text-foreground">R$ {plan.price.toFixed(2).replace(".", ",")}</span>
                        <span className="text-muted-foreground">/mês</span>
                      </div>
                      <Button 
                        className={`w-full h-12 rounded-xl font-bold text-base shadow-lg transition-shadow ${
                          plan.highlighted 
                            ? "bg-gradient-to-r from-primary via-primary to-secondary text-white shadow-primary/20 hover:shadow-xl hover:shadow-primary/30" 
                            : ""
                        }`} 
                        variant={plan.highlighted ? "default" : "outline"} 
                        onClick={() => handleSubscribe(plan.id, plan.price)}
                        disabled={subscribing === plan.id}
                      >
                        {subscribing === plan.id ? (
                          <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Processando...</>
                        ) : (
                          <>Assinar agora <ArrowRight className="w-4 h-4 ml-1.5" /></>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-3">Cancele quando quiser</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-black text-foreground mb-3 tracking-tight">O que está incluso</h2>
            <p className="text-muted-foreground mb-10">Todos os planos incluem os mesmos benefícios</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {benefits.map((b, i) => (
                <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 text-left hover:shadow-lg hover:border-primary/20 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success to-success/70 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-foreground font-medium">{b}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <footer className="py-8 border-t border-border/40 text-center text-xs text-muted-foreground">
          <p>© 2026 AloClinica · <Link to="/terms" className="hover:text-foreground transition-colors">Termos</Link> · <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidade</Link></p>
        </footer>
      </div>
    </>
  );
};

export default DiscountCard;
