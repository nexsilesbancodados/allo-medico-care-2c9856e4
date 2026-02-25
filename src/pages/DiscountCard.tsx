import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Heart, Shield, Star, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import logo from "@/assets/logo.png";

const plans = [
  { id: "individual", name: "Individual", price: 24.9, people: "1 pessoa", icon: <CreditCard className="w-6 h-6" />, highlighted: false },
  { id: "couple", name: "Casal", price: 39.9, people: "2 pessoas", icon: <Heart className="w-6 h-6" />, highlighted: true },
  { id: "family", name: "Família", price: 54.9, people: "Até 4 pessoas", icon: <Users className="w-6 h-6" />, highlighted: false },
];

const benefits = [
  "30% de desconto em teleconsultas eletivas",
  "30% de desconto no Plantão 24h",
  "30% de desconto na renovação de receita",
  "Prioridade no agendamento",
  "Acesso ao Cofre de Documentos",
  "Sem carência — benefício imediato",
];

const DiscountCard = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead title="Cartão de Desconto | AloClinica" description="Economize 30% em teleconsultas, plantão 24h e renovação de receitas. Planos a partir de R$ 24,90/mês." />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="AloClinica" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-foreground">AloClinica</span>
            </Link>
            <Button variant="outline" asChild><Link to="/paciente">Entrar</Link></Button>
          </div>
        </header>

        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="mb-4 text-sm px-4 py-1">💳 Cartão de Desconto</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Economize <span className="text-primary">30%</span> em toda a plataforma
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Teleconsultas, Plantão 24h e renovação de receita com desconto permanente. Planos a partir de R$ 24,90/mês.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Plans */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {plans.map((plan, i) => (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className={`relative overflow-hidden ${plan.highlighted ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border"}`}>
                    {plan.highlighted && (
                      <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center text-xs py-1 font-semibold">
                        ⭐ Mais Popular
                      </div>
                    )}
                    <CardContent className={`p-6 text-center ${plan.highlighted ? "pt-10" : ""}`}>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                        {plan.icon}
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{plan.people}</p>
                      <div className="mb-6">
                        <span className="text-4xl font-bold text-foreground">R$ {plan.price.toFixed(2).replace(".", ",")}</span>
                        <span className="text-muted-foreground">/mês</span>
                      </div>
                      <Button className="w-full mb-4" variant={plan.highlighted ? "default" : "outline"} onClick={() => navigate("/paciente")}>
                        Assinar agora
                      </Button>
                      <p className="text-xs text-muted-foreground">Cancele quando quiser</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-8">O que está incluso</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {benefits.map((b, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border text-left">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{b}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-border text-center text-xs text-muted-foreground">
          <p>© 2026 AloClinica • <Link to="/terms" className="underline">Termos</Link> • <Link to="/privacy" className="underline">Privacidade</Link></p>
        </footer>
      </div>
    </>
  );
};

export default DiscountCard;
