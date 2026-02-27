import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, Lock, ArrowLeft, Heart, Check, Star, Shield, Eye, EyeOff, Sparkles, Zap, Clock, Users, ChevronRight, CreditCard, QrCode, FileText, Loader2, AlertCircle, Copy, CheckCircle } from "lucide-react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import { formatMask, unmask } from "@/hooks/use-mask";
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
    icon: Clock,
    color: "from-primary/80 to-primary",
  },
  {
    id: "mensal",
    name: "Plano Mensal",
    price: 149,
    period: "por mês",
    description: "Acesso ilimitado para cuidar da saúde da família.",
    features: ["Consultas ilimitadas", "Receitas digitais ilimitadas", "Chat ilimitado com médicos", "Prioridade no agendamento", "Prontuário digital completo", "Acesso para até 4 dependentes"],
    highlighted: true,
    icon: Zap,
    color: "from-secondary to-primary",
  },
];

type Step = "select" | "register" | "payment" | "success";
type PaymentMethod = "PIX" | "BOLETO" | "CREDIT_CARD";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

const AuthPaciente = () => {
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get("plan");
  const reason = searchParams.get("reason");

  const [step, setStep] = useState<Step>(initialPlan ? "register" : "select");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(initialPlan);

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
  const [attempts, setAttempts] = useState(0);
  const lockoutUntil = useRef<number>(0);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  const currentPlan = plans.find(p => p.id === selectedPlanId);

  // Show message if redirected from login without subscription
  useEffect(() => {
    if (reason === "no-subscription") {
      toast({
        title: "Plano necessário",
        description: "Escolha um plano abaixo para acessar a plataforma.",
        variant: "destructive",
      });
    }
  }, [reason]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setStep("register");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Date.now() < lockoutUntil.current) {
      const secs = Math.ceil((lockoutUntil.current - Date.now()) / 1000);
      toast({ title: "Aguarde", description: `Tente novamente em ${secs}s`, variant: "destructive" });
      return;
    }
    if (!termsAccepted) {
      toast({ title: "Aceite os termos", description: "Você precisa aceitar os Termos de Uso e Política de Privacidade para continuar.", variant: "destructive" });
      return;
    }
    if (!selectedPlanId) {
      toast({ title: "Selecione um plano", description: "Volte e escolha um plano para continuar.", variant: "destructive" });
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
    if (data.user) {
      setRegisteredUserId(data.user.id);
      await supabase.from("profiles").update({
        cpf: unmask(cpf),
        phone: unmask(phone),
      }).eq("user_id", data.user.id);
      await registerConsent(data.user.id);
      try {
        await supabase.functions.invoke("send-email", {
          body: { type: "welcome", to: email, data: { name: firstName } },
        });
      } catch {}
    }
    setLoading(false);
    toast({ title: "Conta criada!", description: "Agora finalize o pagamento para acessar." });
    // Go to payment step instead of dashboard
    setStep("payment");
  };

  const handleProcessPayment = async () => {
    if (!currentPlan || !registeredUserId) return;
    setPaymentLoading(true);
    try {
      const isSubscription = currentPlan.id === "mensal";
      const body: Record<string, any> = {
        customerName: `${firstName} ${lastName}`,
        customerCpf: unmask(cpf),
        customerEmail: email,
        customerPhone: unmask(phone),
        billingType: paymentMethod,
        value: currentPlan.price,
        description: isSubscription
          ? `Assinatura Mensal — AloClínica`
          : `Consulta Avulsa — AloClínica`,
        planId: currentPlan.id,
      };
      if (isSubscription) {
        body.cycle = "MONTHLY";
      }

      const { data, error } = await supabase.functions.invoke("create-asaas-payment", { body });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao processar pagamento");

      setPaymentData(data);

      // For credit card or confirmed PIX, the payment may be instant
      if (data.status === "CONFIRMED" || data.status === "RECEIVED" || data.status === "ACTIVE") {
        await createSubscriptionRecord(data);
        toast({ title: "Pagamento confirmado! ✅", description: "Redirecionando para o dashboard..." });
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        // PIX or Boleto — waiting for confirmation
        toast({
          title: paymentMethod === "PIX" ? "PIX gerado!" : "Boleto gerado!",
          description: paymentMethod === "PIX" 
            ? "Escaneie o QR Code ou copie o código para pagar."
            : "Acesse o boleto para realizar o pagamento.",
        });
      }
    } catch (err: any) {
      toast({ title: "Erro no pagamento", description: err.message || "Tente novamente", variant: "destructive" });
    }
    setPaymentLoading(false);
  };

  const createSubscriptionRecord = async (payData: any) => {
    if (!registeredUserId || !currentPlan) return;
    try {
      await supabase.from("subscriptions").insert({
        user_id: registeredUserId,
        plan_id: currentPlan.id,
        status: "active",
        payment_method: paymentMethod.toLowerCase(),
        notes: payData.paymentId || payData.subscriptionId || null,
      });
    } catch (e) {
      console.error("Error creating subscription:", e);
    }
  };

  const handleCopyPix = () => {
    if (paymentData?.pixCopyPaste) {
      navigator.clipboard.writeText(paymentData.pixCopyPaste);
      setPixCopied(true);
      toast({ title: "Código PIX copiado!" });
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Date.now() < lockoutUntil.current) {
      const secs = Math.ceil((lockoutUntil.current - Date.now()) / 1000);
      toast({ title: "Aguarde", description: `Tente novamente em ${secs}s`, variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        lockoutUntil.current = Date.now() + 30000;
        setAttempts(0);
        toast({ title: "Muitas tentativas", description: "Conta bloqueada por 30 segundos.", variant: "destructive" });
      } else {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      }
    } else {
      setAttempts(0);
      // Check if patient has active plan
      const { data: { user: loggedUser } } = await supabase.auth.getUser();
      if (loggedUser) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", loggedUser.id);
        const isPatient = roles?.some(r => r.role === "patient");
        const isOtherRole = roles?.some(r => ["doctor", "admin", "clinic", "receptionist", "support", "partner", "affiliate"].includes(r.role));
        
        if (isPatient && !isOtherRole) {
          const { data: subs } = await supabase.from("subscriptions").select("id").eq("user_id", loggedUser.id).eq("status", "active").limit(1);
          const { data: cards } = await supabase.from("discount_cards").select("id").eq("user_id", loggedUser.id).eq("status", "active").limit(1);
          
          if ((!subs || subs.length === 0) && (!cards || cards.length === 0)) {
            setLoading(false);
            await supabase.auth.signOut();
            navigate("/paciente?reason=no-subscription");
            return;
          }
        }
      }
      setLoading(false);
      navigate("/dashboard");
    }
  };

  const [mode, setMode] = useState<"register" | "login">("register");

  const stepLabels = ["Escolher Plano", "Criar Conta", "Pagamento"];
  const currentStepIndex = step === "select" ? 0 : step === "register" ? 1 : 2;

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col" style={{ background: 'var(--landing-bg)' }}>
      <SEOHead title="Cadastro de Paciente" description="Crie sua conta de paciente na AloClinica e agende consultas online com médicos especialistas." />
      
      {/* Mobile gradient header */}
      <div className="lg:hidden bg-gradient-to-br from-primary to-secondary px-6 pt-[max(env(safe-area-inset-top,12px),12px)] pb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition text-sm mb-3">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-foreground">Portal do Paciente</h1>
            <p className="text-xs text-primary-foreground/70">Cuide da sua saúde online</p>
          </div>
        </div>
      </div>
      
      {/* Desktop header */}
      <div className="hidden lg:block border-b border-border/50 bg-card/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition text-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/20">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground tracking-tight">AloClinica</span>
          </div>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 text-sm mb-8">
          {stepLabels.map((label, i) => {
            const isActive = i === currentStepIndex;
            const isDone = i < currentStepIndex;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && (
                  <div className="w-10 h-0.5 bg-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: isDone ? "100%" : "0%" }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                )}
                <motion.div
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : isDone ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                  animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {isDone ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                  <span className="hidden sm:inline">{label}</span>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 flex-1">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Plan */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl mx-auto"
            >
              {reason === "no-subscription" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Você precisa de um plano ativo</p>
                    <p className="text-xs text-muted-foreground mt-1">Escolha um plano abaixo para acessar sua conta e agendar consultas.</p>
                  </div>
                </motion.div>
              )}

              <div className="text-center mb-10">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-2"
                >
                  Escolha seu Plano
                </motion.h1>
                <p className="text-muted-foreground max-w-md mx-auto">Selecione o plano ideal para você e sua família. Cancele quando quiser.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  return (
                    <motion.div
                      key={plan.id}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative rounded-2xl p-7 border cursor-pointer transition-all ${
                        plan.highlighted
                          ? "bg-gradient-to-br from-secondary to-primary text-primary-foreground border-transparent shadow-xl shadow-primary/20"
                          : "bg-card border-border shadow-card hover:shadow-elevated hover:border-primary/30"
                      }`}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {plan.highlighted && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3, type: "spring" }}
                          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-card text-primary text-xs font-bold flex items-center gap-1 shadow-md"
                        >
                          <Star className="w-3 h-3 fill-current" /> Mais popular
                        </motion.div>
                      )}

                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                        plan.highlighted ? "bg-white/20" : "bg-primary/10"
                      }`}>
                        <Icon className={`w-5 h-5 ${plan.highlighted ? "" : "text-primary"}`} />
                      </div>

                      <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? "" : "text-foreground"}`}>{plan.name}</h3>
                      <p className={`text-sm mb-5 ${plan.highlighted ? "opacity-80" : "text-muted-foreground"}`}>{plan.description}</p>
                      <div className="mb-5">
                        <span className="text-4xl font-extrabold tracking-tight">R${plan.price}</span>
                        <span className={`text-sm ml-1.5 ${plan.highlighted ? "opacity-70" : "text-muted-foreground"}`}>{plan.period}</span>
                      </div>
                      <ul className="space-y-2.5 mb-7">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm">
                            <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${
                              plan.highlighted ? "bg-white/20" : "bg-primary/10"
                            }`}>
                              <Check className={`w-3 h-3 ${plan.highlighted ? "" : "text-primary"}`} />
                            </div>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button className={`w-full h-12 font-semibold ${
                        plan.highlighted
                          ? "bg-card text-primary hover:bg-card/90 shadow-lg"
                          : "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-md shadow-primary/15"
                      }`} size="lg">
                        <span className="flex items-center gap-2">
                          Selecionar <ChevronRight className="w-4 h-4" />
                        </span>
                      </Button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-muted-foreground"
              >
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-primary" /> Dados 100% protegidos</span>
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-warning" /> Avaliação 4.9/5</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-secondary" /> 12.000+ pacientes</span>
              </motion.div>

              <p className="text-center text-sm text-muted-foreground mt-8">
                Já tem conta?{" "}
                <button onClick={() => { setStep("register"); setMode("login"); }} className="text-primary font-semibold hover:underline">
                  Entrar
                </button>
              </p>
            </motion.div>
          )}

          {/* Step 2: Register / Login */}
          {step === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-md mx-auto"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Heart className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">{mode === "register" ? "Criar sua conta" : "Bem-vindo de volta"}</h2>
                  <p className="text-sm text-muted-foreground">
                    {mode === "register" ? "Preencha seus dados para acessar" : "Acesse sua conta de paciente"}
                  </p>
                </div>
              </div>

              {currentPlan && mode === "register" && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 mb-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      {currentPlan.highlighted ? <Zap className="w-4 h-4 text-primary" /> : <Clock className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{currentPlan.name}</p>
                      <p className="text-xs text-muted-foreground">R${currentPlan.price}/{currentPlan.period}</p>
                    </div>
                  </div>
                  <button onClick={() => setStep("select")} className="text-xs text-primary hover:underline font-medium">Trocar</button>
                </motion.div>
              )}

              {mode === "register" ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Nome</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" required className="mt-1 h-11" /></div>
                    <div><Label>Sobrenome</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" required className="mt-1 h-11" /></div>
                  </div>
                  <div>
                    <Label>CPF</Label>
                    <Input
                      value={cpf}
                      onChange={e => setCpf(formatMask(e.target.value, 'cpf'))}
                      placeholder="000.000.000-00"
                      className="mt-1 font-mono h-11"
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
                        className="pl-10 font-mono h-11"
                        maxLength={15}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10 h-11" required />
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
                        className="pl-10 pr-10 h-11"
                        required
                        minLength={6}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {password && <PasswordStrength password={password} />}
                  </div>
                  <TermsConsentCheckbox checked={termsAccepted} onCheckedChange={setTermsAccepted} />
                  <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground cta-shimmer h-12 shadow-lg shadow-primary/20" size="lg" disabled={loading || !termsAccepted}>
                    {loading ? (
                      <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 animate-spin" /> Criando conta...
                      </motion.span>
                    ) : "Criar conta e pagar"}
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
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10 h-11" required />
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
                        className="pl-10 pr-10 h-11"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground cta-shimmer h-12 shadow-lg shadow-primary/20" size="lg" disabled={loading}>
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
                className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground pb-[max(env(safe-area-inset-bottom,8px),8px)]"
              >
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary shrink-0" /> Dados protegidos</span>
                <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-warning shrink-0" /> 4.9/5</span>
                <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-destructive shrink-0" /> 12k+ pacientes</span>
              </motion.div>
            </motion.div>
          )}

          {/* Step 3: Payment */}
          {step === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-md mx-auto"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                  <CreditCard className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">Finalizar Pagamento</h2>
                  <p className="text-sm text-muted-foreground">Escolha a forma de pagamento</p>
                </div>
              </div>

              {/* Plan summary */}
              {currentPlan && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{currentPlan.name}</p>
                      <p className="text-xs text-muted-foreground">{currentPlan.id === "mensal" ? "Cobrança mensal recorrente" : "Pagamento único"}</p>
                    </div>
                    <p className="text-2xl font-extrabold text-primary">R${currentPlan.price}</p>
                  </div>
                </div>
              )}

              {!paymentData ? (
                <>
                  {/* Payment method selection */}
                  <div className="space-y-3 mb-6">
                    <Label className="text-sm font-medium">Forma de pagamento</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { id: "PIX" as PaymentMethod, icon: QrCode, label: "PIX", desc: "Instantâneo" },
                        { id: "BOLETO" as PaymentMethod, icon: FileText, label: "Boleto", desc: "1-3 dias úteis" },
                        { id: "CREDIT_CARD" as PaymentMethod, icon: CreditCard, label: "Cartão", desc: "Instantâneo" },
                      ]).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            paymentMethod === m.id
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <m.icon className={`w-5 h-5 mx-auto mb-1.5 ${paymentMethod === m.id ? "text-primary" : "text-muted-foreground"}`} />
                          <p className={`text-xs font-semibold ${paymentMethod === m.id ? "text-primary" : "text-foreground"}`}>{m.label}</p>
                          <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleProcessPayment}
                    className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12 shadow-lg shadow-primary/20"
                    size="lg"
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Processando...
                      </span>
                    ) : (
                      `Pagar R$${currentPlan?.price || 0} via ${paymentMethod === "CREDIT_CARD" ? "Cartão" : paymentMethod}`
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary" /> Pagamento seguro via Asaas
                  </p>
                </>
              ) : (
                /* Payment result */
                <div className="space-y-4">
                  {paymentData.pixQrCode && (
                    <div className="text-center space-y-4">
                      <div className="bg-card p-4 rounded-xl border border-border inline-block mx-auto">
                        <img
                          src={`data:image/png;base64,${paymentData.pixQrCode}`}
                          alt="QR Code PIX"
                          className="w-48 h-48 mx-auto"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">Escaneie o QR Code com o app do seu banco</p>
                      {paymentData.pixCopyPaste && (
                        <Button
                          variant="outline"
                          onClick={handleCopyPix}
                          className="w-full"
                        >
                          {pixCopied ? (
                            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success" /> Copiado!</span>
                          ) : (
                            <span className="flex items-center gap-2"><Copy className="w-4 h-4" /> Copiar código PIX</span>
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  {paymentData.bankSlipUrl && (
                    <div className="text-center space-y-4">
                      <FileText className="w-12 h-12 text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground">Seu boleto foi gerado com sucesso</p>
                      <a href={paymentData.bankSlipUrl} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                          <FileText className="w-4 h-4 mr-2" /> Abrir Boleto
                        </Button>
                      </a>
                    </div>
                  )}

                  {paymentData.invoiceUrl && !paymentData.pixQrCode && !paymentData.bankSlipUrl && (
                    <div className="text-center space-y-4">
                      <CreditCard className="w-12 h-12 text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground">Redirecionando para pagamento...</p>
                      <a href={paymentData.invoiceUrl} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                          Ir para pagamento
                        </Button>
                      </a>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-center">
                    <p className="text-xs text-muted-foreground">
                      Após a confirmação do pagamento, seu acesso será liberado automaticamente.
                      Você receberá uma notificação por email.
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => navigate("/dashboard")}
                    className="w-full text-sm"
                  >
                    Já realizei o pagamento → Ir para o Dashboard
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthPaciente;
