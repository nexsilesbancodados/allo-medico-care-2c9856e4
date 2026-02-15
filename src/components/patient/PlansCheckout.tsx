import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Star, CreditCard, Calendar, Clock, FileText, Users, Search, ArrowLeft, Shield } from "lucide-react";
import { motion } from "framer-motion";

const patientNav = [
  { label: "Início", href: "/dashboard", icon: <Clock className="w-4 h-4" /> },
  { label: "Agendar Consulta", href: "/dashboard/schedule", icon: <Calendar className="w-4 h-4" /> },
  { label: "Buscar Médicos", href: "/dashboard/doctors", icon: <Search className="w-4 h-4" /> },
  { label: "Minhas Consultas", href: "/dashboard/appointments", icon: <FileText className="w-4 h-4" /> },
  { label: "Meu Plano", href: "/dashboard/plans", icon: <CreditCard className="w-4 h-4" />, active: true },
];

const plans = [
  {
    id: "avulsa",
    name: "Consulta Avulsa",
    price: 89,
    period: "por consulta",
    description: "Ideal para quem precisa de atendimento pontual.",
    features: ["1 consulta por videochamada", "Receita digital inclusa", "Chat pós-consulta (48h)", "Escolha de especialidade"],
    highlighted: false,
  },
  {
    id: "mensal",
    name: "Plano Mensal",
    price: 149,
    period: "por mês",
    description: "Acesso ilimitado para cuidar da saúde da família.",
    features: ["Consultas ilimitadas", "Receitas digitais ilimitadas", "Chat ilimitado com médicos", "Prioridade no agendamento", "Prontuário digital completo", "Acesso para até 4 dependentes"],
    highlighted: true,
  },
];

type CheckoutStep = "select" | "checkout" | "success";

const PlansCheckout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<CheckoutStep>("select");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  const currentPlan = plans.find(p => p.id === selectedPlan);

  const handleCheckout = () => {
    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep("success");
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(\d{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return cleaned;
  };

  return (
    <DashboardLayout title="Paciente" nav={patientNav}>
      <div className="max-w-3xl">
        {step === "select" && (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-1">Escolha seu Plano</h1>
            <p className="text-muted-foreground mb-8">Selecione o plano ideal para você</p>

            <div className="grid md:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  whileHover={{ scale: 1.02 }}
                  className={`relative rounded-2xl p-6 border cursor-pointer transition-all ${
                    plan.highlighted
                      ? "bg-gradient-hero text-primary-foreground border-transparent shadow-elevated"
                      : "bg-card border-border shadow-card hover:shadow-elevated"
                  }`}
                  onClick={() => { setSelectedPlan(plan.id); setStep("checkout"); }}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-card text-primary text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3" /> Mais popular
                    </div>
                  )}
                  <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? "" : "text-foreground"}`}>{plan.name}</h3>
                  <p className={`text-sm mb-4 ${plan.highlighted ? "opacity-80" : "text-muted-foreground"}`}>{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold">R${plan.price}</span>
                    <span className={`text-sm ml-1 ${plan.highlighted ? "opacity-70" : "text-muted-foreground"}`}>{plan.period}</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {step === "checkout" && currentPlan && (
          <>
            <button onClick={() => setStep("select")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <h1 className="text-2xl font-bold text-foreground mb-6">Checkout</h1>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Order summary */}
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4">Resumo do Pedido</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{currentPlan.name}</span>
                      <span className="font-semibold text-foreground">R${currentPlan.price}</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between">
                      <span className="font-bold text-foreground">Total</span>
                      <span className="font-bold text-foreground text-lg">R${currentPlan.price}</span>
                    </div>
                  </div>

                  <div className="mt-6 p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      Pagamento simulado — sem cobrança real
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment form */}
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> Dados de Pagamento
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs">Nome no cartão</Label>
                      <Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Nome completo" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Número do cartão</Label>
                      <Input
                        value={cardNumber}
                        onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="0000 0000 0000 0000"
                        className="mt-1 font-mono"
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Validade</Label>
                        <Input
                          value={cardExpiry}
                          onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/AA"
                          className="mt-1 font-mono"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">CVV</Label>
                        <Input
                          value={cardCvv}
                          onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="000"
                          className="mt-1 font-mono"
                          maxLength={4}
                          type="password"
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full bg-gradient-hero text-primary-foreground mt-2"
                      size="lg"
                      onClick={handleCheckout}
                      disabled={processing}
                    >
                      {processing ? "Processando..." : `Pagar R$${currentPlan.price}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {step === "success" && currentPlan && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-secondary/10 mx-auto flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-secondary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Pagamento Confirmado!</h1>
            <p className="text-muted-foreground mb-2">Seu plano <strong>{currentPlan.name}</strong> foi ativado com sucesso.</p>
            <Badge variant="default" className="mb-8">Plano Ativo</Badge>
            <div>
              <Button onClick={() => navigate("/dashboard")} className="bg-gradient-hero text-primary-foreground">
                Voltar ao Dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PlansCheckout;
