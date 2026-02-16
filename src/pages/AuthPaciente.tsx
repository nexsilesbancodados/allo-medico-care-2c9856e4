import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Phone, Mail, Lock, User, ArrowLeft, Heart, Check, Star, CreditCard, Shield } from "lucide-react";
import patientPortalBg from "@/assets/patient-portal-bg.png";

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

type Step = "select" | "checkout" | "register" | "success";

const AuthPaciente = () => {
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get("plan");

  const [step, setStep] = useState<Step>(initialPlan ? "checkout" : "select");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(initialPlan);

  // Checkout state
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  // Register state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const currentPlan = plans.find(p => p.id === selectedPlanId);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(\d{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return cleaned;
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setStep("checkout");
  };

  const handleCheckout = () => {
    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
      toast({ title: "Preencha todos os campos do cartão", variant: "destructive" });
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep("register");
      toast({ title: "Pagamento confirmado!", description: "Agora crie sua conta para acessar a plataforma." });
    }, 2000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin, data: { first_name: firstName, last_name: lastName } },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cadastro realizado!", description: "Sua conta foi criada com sucesso." });
    navigate("/dashboard");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  const [mode, setMode] = useState<"register" | "login">("register");

  return (
    <div className="min-h-screen relative">
      <img src={patientPortalBg} alt="" className="absolute inset-0 w-full h-full object-cover -z-10" />
      <div className="absolute inset-0 bg-background/70 -z-10" />
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition text-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Alô Médico</span>
          </div>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 text-sm mb-8">
          {["Escolher Plano", "Pagamento", "Criar Conta"].map((label, i) => {
            const stepIndex = i;
            const currentIndex = step === "select" ? 0 : step === "checkout" ? 1 : 2;
            const isActive = stepIndex === currentIndex;
            const isDone = stepIndex < currentIndex;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className={`w-8 h-px ${isDone ? "bg-primary" : "bg-border"}`} />}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  isActive ? "bg-primary text-primary-foreground" : isDone ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {isDone ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Step 1: Select Plan */}
        {step === "select" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-1 text-center">Escolha seu Plano</h1>
            <p className="text-muted-foreground mb-8 text-center">Selecione o plano ideal para você e sua família</p>

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
                  onClick={() => handleSelectPlan(plan.id)}
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
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className={`w-full ${plan.highlighted ? "bg-card text-primary hover:bg-card/90" : "bg-gradient-hero text-primary-foreground"}`} size="lg">
                    Selecionar
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Login link for existing patients */}
            <p className="text-center text-sm text-muted-foreground mt-8">
              Já tem conta?{" "}
              <button onClick={() => { setStep("register"); setMode("login"); }} className="text-primary font-semibold hover:underline">
                Entrar
              </button>
            </p>
          </motion.div>
        )}

        {/* Step 2: Checkout */}
        {step === "checkout" && currentPlan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <button onClick={() => setStep("select")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" /> Trocar plano
            </button>
            <h1 className="text-2xl font-bold text-foreground mb-6">Pagamento</h1>

            <div className="grid md:grid-cols-2 gap-6">
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
                      <Input value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} placeholder="0000 0000 0000 0000" className="mt-1 font-mono" maxLength={19} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Validade</Label>
                        <Input value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} placeholder="MM/AA" className="mt-1 font-mono" maxLength={5} />
                      </div>
                      <div>
                        <Label className="text-xs">CVV</Label>
                        <Input value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="000" className="mt-1 font-mono" maxLength={4} type="password" />
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-hero text-primary-foreground mt-2" size="lg" onClick={handleCheckout} disabled={processing}>
                      {processing ? "Processando..." : `Pagar R$${currentPlan.price}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Step 3: Register (only after payment) */}
        {step === "register" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{mode === "register" ? "Criar sua conta" : "Entrar"}</h2>
                <p className="text-sm text-muted-foreground">
                  {mode === "register" ? "Finalize seu cadastro para acessar a plataforma" : "Acesse sua conta de paciente"}
                </p>
              </div>
            </div>

            {mode === "register" ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nome</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" required className="mt-1" /></div>
                  <div><Label>Sobrenome</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" required className="mt-1" /></div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10" required />
                  </div>
                </div>
                <div>
                  <Label>Senha</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="pl-10" required minLength={6} />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground" size="lg" disabled={loading}>
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Já tem conta? <button type="button" onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Entrar</button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10" required />
                  </div>
                </div>
                <div>
                  <Label>Senha</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-10" required />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground" size="lg" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <Link to="/forgot-password" className="text-primary hover:underline">Esqueci minha senha</Link>
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  Não tem conta? <button type="button" onClick={() => setMode("register")} className="text-primary font-semibold hover:underline">Cadastre-se</button>
                </p>
              </form>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AuthPaciente;
