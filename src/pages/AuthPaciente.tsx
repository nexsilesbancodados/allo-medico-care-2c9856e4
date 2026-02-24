import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, Lock, User, ArrowLeft, Heart, Check, Star, CreditCard, Shield, Eye, EyeOff, Sparkles } from "lucide-react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import { formatMask, unmask } from "@/hooks/use-mask";
import patientPortalBg from "@/assets/patient-portal-bg.png";
import SEOHead from "@/components/SEOHead";
import PasswordStrength from "@/components/ui/password-strength";

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

  // Register state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const currentPlan = plans.find(p => p.id === selectedPlanId);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setStep("register");
  };

  const handleCheckoutStripe = async () => {
    if (!currentPlan) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          mode: currentPlan.id === "mensal" ? "subscription" : "payment",
          planId: currentPlan.id,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/paciente`,
        },
      });
      if (error) throw error;
      if (data?.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        // Fallback: proceed without payment for now
        toast({ title: "Pagamento", description: "Integração Stripe pendente. Criando conta..." });
        setStep("register");
      }
    } catch (err: any) {
      toast({ title: "Erro no pagamento", description: err.message || "Tente novamente", variant: "destructive" });
      setStep("register");
    }
    setProcessing(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast({ title: "Aceite os termos", description: "Você precisa aceitar os Termos de Uso e Política de Privacidade para continuar.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { first_name: firstName, last_name: lastName },
      },
    });
    if (error) {
      setLoading(false);
      toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
      return;
    }
    // Update profile with CPF and phone
    if (data.user) {
      await supabase.from("profiles").update({
        cpf: unmask(cpf),
        phone: unmask(phone),
      }).eq("user_id", data.user.id);

      // Register consent
      await registerConsent(data.user.id);

      // Send welcome email
      try {
        await supabase.functions.invoke("send-email", {
          body: { type: "welcome", to: email, data: { name: firstName } },
        });
      } catch {}
    }
    setLoading(false);
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
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--landing-bg)' }}>
      <SEOHead title="Cadastro de Paciente" description="Crie sua conta de paciente na AloClinica e agende consultas online com médicos especialistas." />
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
            <span className="font-bold text-foreground">AloClinica</span>
          </div>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 text-sm mb-8">
          {["Escolher Plano", "Criar Conta"].map((label, i) => {
            const currentIndex = step === "select" ? 0 : 1;
            const isActive = i === currentIndex;
            const isDone = i < currentIndex;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && (
                  <div className="w-8 h-px bg-border overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: isDone ? "100%" : "0%" }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
                <motion.div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    isActive ? "bg-primary text-primary-foreground" : isDone ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                  animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {isDone ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                  {label}
                </motion.div>
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

            <p className="text-center text-sm text-muted-foreground mt-8">
              Já tem conta?{" "}
              <button onClick={() => { setStep("register"); setMode("login"); }} className="text-primary font-semibold hover:underline">
                Entrar
              </button>
            </p>
          </motion.div>
        )}

        {/* Step 2: Register */}
        {(step === "register" || step === "checkout") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{mode === "register" ? "Criar sua conta" : "Entrar"}</h2>
                <p className="text-sm text-muted-foreground">
                  {mode === "register" ? "Preencha seus dados para acessar a plataforma" : "Acesse sua conta de paciente"}
                </p>
              </div>
            </div>

            {currentPlan && mode === "register" && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{currentPlan.name}</p>
                  <p className="text-xs text-muted-foreground">R${currentPlan.price}/{currentPlan.period}</p>
                </div>
                <button onClick={() => setStep("select")} className="text-xs text-primary hover:underline">Trocar</button>
              </div>
            )}

            {mode === "register" ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nome</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" required className="mt-1" /></div>
                  <div><Label>Sobrenome</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" required className="mt-1" /></div>
                </div>
                <div>
                  <Label>CPF</Label>
                  <Input
                    value={cpf}
                    onChange={e => setCpf(formatMask(e.target.value, 'cpf'))}
                    placeholder="000.000.000-00"
                    className="mt-1 font-mono"
                    maxLength={14}
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={phone}
                      onChange={e => setPhone(formatMask(e.target.value, 'phone'))}
                      placeholder="(00) 00000-0000"
                      className="pl-10 font-mono"
                      maxLength={15}
                    />
                  </div>
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
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && <PasswordStrength password={password} />}
                </div>
                <TermsConsentCheckbox checked={termsAccepted} onCheckedChange={setTermsAccepted} />
                <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground cta-shimmer" size="lg" disabled={loading || !termsAccepted}>
                  {loading ? (
                    <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin" /> Criando conta...
                    </motion.span>
                  ) : "Criar conta"}
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
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground cta-shimmer" size="lg" disabled={loading}>
                  {loading ? (
                    <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin" /> Entrando...
                    </motion.span>
                  ) : "Entrar"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <Link to="/forgot-password" className="text-primary hover:underline">Esqueci minha senha</Link>
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  Não tem conta? <button type="button" onClick={() => setMode("register")} className="text-primary font-semibold hover:underline">Cadastre-se</button>
                </p>
              </form>
            )}
            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex items-center justify-center gap-4 text-xs text-muted-foreground"
            >
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-primary" /> Dados protegidos</span>
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-warning" /> 4.9/5 avaliação</span>
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-destructive" /> 12k+ pacientes</span>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AuthPaciente;
