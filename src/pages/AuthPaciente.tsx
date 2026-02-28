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

const PLAN_MAP: Record<string, { icon: any; color: string; highlighted: boolean }> = {
  "Consulta Avulsa": { icon: Clock, color: "from-primary/80 to-primary", highlighted: false },
  "Plano Mensal": { icon: Zap, color: "from-secondary to-primary", highlighted: true },
  "Plano Família+": { icon: Users, color: "from-secondary to-success", highlighted: false },
};

interface PlanItem {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  icon: any;
  color: string;
  interval: string;
}

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

  const [step, setStep] = useState<Step>("register");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(initialPlan || "avulsa");

  const [plans, setPlans] = useState<PlanItem[]>([]);

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
  const [cpfVerified, setCpfVerified] = useState(false);
  const [verifyCpf, setVerifyCpf] = useState("");
  const [verifyingCpf, setVerifyingCpf] = useState(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  const currentPlan = plans.find(p => p.id === selectedPlanId);

  // Fetch plans from database
  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase.from("plans").select("*").eq("is_active", true).order("price", { ascending: true });
      if (data && data.length > 0) {
        const mapped: PlanItem[] = data.map((p: any) => {
          const meta = PLAN_MAP[p.name] ?? { icon: Clock, color: "from-primary/80 to-primary", highlighted: false };
          const featureList = Array.isArray(p.features) ? p.features as string[] : [];
          return {
            id: p.id,
            name: p.name,
            price: p.price,
            period: p.interval === "monthly" ? "por mês" : "por consulta",
            description: p.description || "",
            features: featureList.length > 0 ? featureList : [p.name],
            highlighted: meta.highlighted,
            icon: meta.icon,
            color: meta.color,
            interval: p.interval,
          };
        });
        setPlans(mapped);
      } else {
        // Fallback hardcoded plans
        setPlans([
          { id: "fallback-avulsa", name: "Consulta Avulsa", price: 89, period: "por consulta", description: "Ideal para atendimento pontual.", features: ["1 consulta por videochamada", "Receita digital inclusa", "Chat pós-consulta (48h)"], highlighted: false, icon: Clock, color: "from-primary/80 to-primary", interval: "one_time" },
          { id: "fallback-mensal", name: "Plano Mensal", price: 149, period: "por mês", description: "Acesso ilimitado para sua família.", features: ["Consultas ilimitadas", "Receitas digitais ilimitadas", "Chat ilimitado", "Prioridade no agendamento", "Até 4 dependentes"], highlighted: true, icon: Zap, color: "from-secondary to-primary", interval: "monthly" },
        ]);
      }
    };
    fetchPlans();
  }, []);

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

  const handleVerifyCpf = async () => {
    const cleanCpf = unmask(verifyCpf);
    if (cleanCpf.length !== 11) {
      toast({ title: "CPF inválido", description: "Digite um CPF válido com 11 dígitos.", variant: "destructive" });
      return;
    }
    setVerifyingCpf(true);
    try {
      // Check guest_patients (purchased without account)
      const { data: guestData } = await supabase.from("guest_patients").select("id, full_name, email, phone").eq("cpf", cleanCpf).limit(1);
      
      if (guestData && guestData.length > 0) {
        // Found a purchase — pre-fill data and allow registration
        const guest = guestData[0];
        const nameParts = guest.full_name.split(" ");
        setFirstName(nameParts[0] || "");
        setLastName(nameParts.slice(1).join(" ") || "");
        setEmail(guest.email || "");
        setPhone(formatMask(guest.phone || "", "phone"));
        setCpf(verifyCpf);
        setCpfVerified(true);
        toast({ title: "CPF verificado! ✅", description: "Seus dados da compra foram encontrados. Complete seu cadastro." });
      } else {
        // Also check if there's an existing profile with active card
        const { data: profileData } = await supabase.from("profiles").select("user_id, cpf").eq("cpf", cleanCpf).limit(1);
        if (profileData && profileData.length > 0) {
          toast({ title: "Conta já existe", description: "Já existe uma conta com esse CPF. Use a opção 'Entrar'.", variant: "destructive" });
          setMode("login");
        } else {
          toast({ title: "CPF não encontrado", description: "Não encontramos uma compra com esse CPF. Adquira seu cartão primeiro.", variant: "destructive" });
        }
      }
    } catch (err) {
      toast({ title: "Erro na verificação", description: "Tente novamente.", variant: "destructive" });
    }
    setVerifyingCpf(false);
  };

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
      // Use the real UUID plan_id from the database
      const planId = currentPlan.id;
      // Validate it's a real UUID, not a fallback
      if (planId.startsWith("fallback-")) {
        // Lookup actual plan from DB by name
        const { data: dbPlan } = await supabase.from("plans").select("id").eq("name", currentPlan.name).single();
        if (!dbPlan) {
          console.error("Plan not found in database:", currentPlan.name);
          return;
        }
        await supabase.from("subscriptions").insert({
          user_id: registeredUserId,
          plan_id: dbPlan.id,
          status: "active",
          payment_method: paymentMethod.toLowerCase(),
          notes: payData.paymentId || payData.subscriptionId || null,
        });
      } else {
        await supabase.from("subscriptions").insert({
          user_id: registeredUserId,
          plan_id: planId,
          status: "active",
          payment_method: paymentMethod.toLowerCase(),
          notes: payData.paymentId || payData.subscriptionId || null,
        });
      }
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

  const [mode, setMode] = useState<"register" | "login">("login");

  const stepLabels = ["Escolher Plano", "Criar Conta", "Pagamento"];
  const currentStepIndex = step === "select" ? 0 : step === "register" ? 1 : 2;

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col" style={{ background: 'var(--landing-bg)' }}>
      <SEOHead title="Meu Cartão de Benefícios" description="Acesse sua conta do Cartão de Benefícios AloClinica e aproveite consultas com desconto." />
      
      {/* Mobile gradient header */}
      <div className="lg:hidden bg-gradient-to-br from-primary to-secondary px-6 pt-[max(env(safe-area-inset-top,12px),12px)] pb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition text-sm mb-3">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
            <CreditCard className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-foreground">Meu Cartão</h1>
            <p className="text-xs text-primary-foreground/70">Acesse sua conta do cartão de benefícios</p>
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

      {/* Steps indicator - only show when registering */}
      {mode === "register" && (
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
      )}

      <div className="container mx-auto px-4 pb-16 flex-1">
        <AnimatePresence mode="wait">
          {/* Plan selection removed — pacientes vão direto para registro/login */}

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
                  <CreditCard className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">
                    {mode === "register" ? (cpfVerified ? "Criar sua conta" : "Primeiro acesso") : "Acessar meu cartão"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {mode === "register" 
                      ? (cpfVerified ? "Complete seus dados para acessar" : "Informe o CPF usado na compra do cartão")
                      : "Entre com seus dados do cartão de benefícios"}
                  </p>
                </div>
              </div>

              {currentPlan && mode === "register" && cpfVerified && (
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

              {mode === "register" && !cpfVerified ? (
                /* CPF Verification Step */
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-accent/30 border border-accent/50">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Verificação de compra</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Informe o CPF que você usou ao adquirir o Cartão de Benefícios. Vamos verificar sua compra antes de criar sua conta.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>CPF da compra</Label>
                    <Input
                      value={verifyCpf}
                      onChange={e => setVerifyCpf(formatMask(e.target.value, 'cpf'))}
                      placeholder="000.000.000-00"
                      className="mt-1 font-mono h-12 text-base"
                      maxLength={14}
                    />
                  </div>
                  <Button
                    onClick={handleVerifyCpf}
                    className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12 shadow-lg shadow-primary/20"
                    size="lg"
                    disabled={verifyingCpf || unmask(verifyCpf).length !== 11}
                  >
                    {verifyingCpf ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Verificar CPF</span>
                    )}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Já tem conta? <button type="button" onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Entrar</button>
                  </p>
                  <p className="text-center text-sm text-muted-foreground">
                    Ainda não tem o cartão? <Link to="/cartao-beneficios" className="text-primary font-semibold hover:underline">Adquira aqui</Link>
                  </p>
                </div>
              ) : mode === "register" ? (
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
                     Comprou o cartão? <button type="button" onClick={() => { setMode("register"); setCpfVerified(false); setVerifyCpf(""); }} className="text-primary font-semibold hover:underline">Primeiro acesso</button>
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
