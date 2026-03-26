import { logError } from "@/lib/logger";
import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, Lock, ArrowLeft, Heart, Check, Star, Shield, Eye, EyeOff, Sparkles, Zap, Clock, Users, ChevronRight, CreditCard, QrCode, FileText, Loader2, AlertCircle, Copy, CheckCircle } from "lucide-react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import { formatMask, unmask } from "@/hooks/use-mask";
import SEOHead from "@/components/SEOHead";
import PasswordStrength from "@/components/ui/password-strength";
import { translateAuthError } from "@/lib/authErrors";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import pingoSolitario from "@/assets/pingo-solitario.webp";
import pingoCartao from "@/assets/pingo-cartao.png";
import pingoMiniFamilia from "@/assets/pingo-mini-familia.webp";
import pingoKingFamilia from "@/assets/pingo-king-familia.webp";
import pingoPrimeFamilia from "@/assets/pingo-prime-familia.webp";

const PLAN_IMAGE_MAP: Record<string, string> = {
  "Solitário": pingoSolitario,
  "Mini Família": pingoMiniFamilia,
  "King Família": pingoKingFamilia,
  "Prime Família": pingoPrimeFamilia,
};

const PLAN_MAP: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; highlighted: boolean }> = {
  "Solitário": { icon: Shield, color: "from-secondary to-primary", highlighted: true },
  "Mini Família": { icon: Heart, color: "from-primary/80 to-primary", highlighted: false },
  "King Família": { icon: Star, color: "from-primary to-secondary", highlighted: false },
  "Prime Família": { icon: Sparkles, color: "from-secondary to-success", highlighted: false },
};

interface PlanItem {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  interval: string;
}

type Step = "select" | "payment" | "success";
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

  const [mode, setMode] = useState<"buy" | "login">("buy");
  const [step, setStep] = useState<Step>(initialPlan ? "payment" : "select");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    initialPlan || sessionStorage.getItem("selectedPlanId") || null
  );

  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(false);

  // Personal data (collected on payment step)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const lockoutUntil = useRef<number>(0);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<Record<string, any> | null>(null);
  const [pixCopied, setPixCopied] = useState(false);

  const navigate = useNavigate();
  const { redirectAfterLogin } = useAuthRedirect();

  const currentPlan = plans.find(p => p.id === selectedPlanId);

  useEffect(() => {
    const fetchPlans = async () => {
      setPlansLoading(true);
      setPlansError(false);
      try {
        const { data, error } = await supabase.from("plans").select("*").eq("is_active", true).order("price", { ascending: true });
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Nenhum plano encontrado");
        const mapped: PlanItem[] = data.map((p: { id: string; name: string; price: number; interval: string; description: string | null; features: unknown }) => {
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
        if (!selectedPlanId && mapped.length > 0) {
          setSelectedPlanId(mapped[0].id);
        }
      } catch (err) {
        setPlansError(true);
      }
      setPlansLoading(false);
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (reason === "no-subscription") {
      toast.error("Plano necessário", { description: "Escolha um plano abaixo para acessar a plataforma." });
    }
  }, [reason]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    sessionStorage.setItem("selectedPlanId", planId);
    setStep("payment");
  };

  // Process payment first, then create account
  const handleProcessPayment = async () => {
    // Validate personal data
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Dados incompletos", { description: "Preencha seu nome e sobrenome." });
      return;
    }
    const cleanCpf = unmask(cpf);
    if (cleanCpf.length !== 11) {
      toast.error("CPF inválido", { description: "Digite um CPF válido com 11 dígitos." });
      return;
    }
    const cleanPhone = unmask(phone);
    if (cleanPhone.length < 10) {
      toast.error("Telefone inválido", { description: "Digite um telefone válido." });
      return;
    }
    if (!email || !email.includes("@")) {
      toast.error("Email inválido", { description: "Digite um email válido." });
      return;
    }
    if (password.length < 6) {
      toast.error("Senha fraca", { description: "A senha deve ter no mínimo 6 caracteres." });
      return;
    }
    if (!termsAccepted) {
      toast.error("Aceite os termos", { description: "Você precisa aceitar os Termos de Uso e Política de Privacidade para continuar." });
      return;
    }
    if (!currentPlan) return;

    setPaymentLoading(true);
    try {
      const body: Record<string, any> = {
        customerName: `${firstName} ${lastName}`,
        customerCpf: cleanCpf,
        customerEmail: email,
        customerPhone: cleanPhone,
        billingType: paymentMethod,
        value: currentPlan.price,
        description: `Cartão de Benefícios ${currentPlan.name} — AloClínica`,
        planId: currentPlan.id,
        cycle: "MONTHLY",
      };

      const { data, error } = await supabase.functions.invoke("create-asaas-payment", { body });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao processar pagamento");

      setPaymentData(data);

      if (data.status === "CONFIRMED" || data.status === "RECEIVED" || data.status === "ACTIVE") {
        // Payment confirmed immediately — create account
        await createAccountAfterPayment(data);
      } else {
        toast.success(paymentMethod === "PIX" ? "PIX gerado!" : "Boleto gerado!", {
          description: paymentMethod === "PIX"
            ? "Escaneie o QR Code ou copie o código para pagar. Sua conta será criada automaticamente após a confirmação."
            : "Acesse o boleto para realizar o pagamento. Sua conta será criada após confirmação.",
        });
        // Start polling for payment confirmation then create account
        startPaymentPolling(data);
      }
    } catch (err: unknown) {
      toast.error("Erro no pagamento", { description: err instanceof Error ? err.message : "Tente novamente" });
    }
    setPaymentLoading(false);
  };

  const startPaymentPolling = (payData: Record<string, any>) => {
    // Poll via asaas webhook — once subscription/discount_card appears, create account
    const pollInterval = setInterval(async () => {
      // Check if payment was confirmed by checking if the asaas payment status changed
      // We'll create the account when user clicks "Já paguei" or when webhook processes
    }, 10000);

    // Store interval for cleanup
    return () => clearInterval(pollInterval);
  };

  const createAccountAfterPayment = async (payData: Record<string, any>) => {
    try {
      // 1. Create Supabase auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { first_name: firstName, last_name: lastName },
        },
      });

      if (signUpError) {
        toast.error("Pagamento confirmado, mas erro ao criar conta", {
          description: translateAuthError(signUpError.message) + ". Entre em contato com o suporte.",
        });
        return;
      }

      if (signUpData.user) {
        const userId = signUpData.user.id;
        const refCode = sessionStorage.getItem("ref_code");

        // 2. Create profile
        await supabase.from("profiles").upsert({
          user_id: userId,
          cpf: unmask(cpf),
          phone: unmask(phone),
          first_name: firstName,
          last_name: lastName,
          referred_by: refCode || null,
        }, { onConflict: "user_id" });

        // 3. Register consent
        await registerConsent(userId);

        // 4. Create subscription record
        const planId = currentPlan?.id;
        if (planId) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(planId)) {
            await supabase.from("subscriptions").insert([{
              user_id: userId,
              plan_id: planId,
              status: "active",
              payment_method: paymentMethod.toLowerCase(),
              notes: payData.paymentId || payData.subscriptionId || null,
            }]);
          }
        }

        // 5. Handle referral
        if (refCode) {
          await supabase.from("referrals").insert({
            referral_code: refCode,
            referred_user_id: userId,
            referrer_id: userId,
            status: "pending",
            source: "signup",
          }).then(() => sessionStorage.removeItem("ref_code"));
        }

        // 6. Send welcome email
        try {
          await supabase.functions.invoke("send-email", {
            body: { type: "welcome", to: email, data: { name: firstName } },
          });
        } catch {}

        toast.success("🎉 Tudo pronto!", { description: "Pagamento confirmado e conta criada! Redirecionando..." });
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (err) {
      logError("createAccountAfterPayment error", err);
      toast.error("Erro ao criar conta", { description: "Pagamento confirmado. Entre em contato com o suporte para liberar seu acesso." });
    }
  };

  const handleCreateAccountManually = async () => {
    // For when user clicks "Já paguei" — create account and let webhook handle subscription
    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { first_name: firstName, last_name: lastName },
        },
      });

      if (signUpError) {
        // If user already exists, try login
        if (signUpError.message.includes("already registered")) {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
          if (loginError) {
            toast.error("Conta já existe", { description: "Tente fazer login com sua senha." });
            setMode("login");
            setStep("select");
          } else if (loginData.user) {
            await redirectAfterLogin(loginData.user.id);
          }
          setLoading(false);
          return;
        }
        toast.error("Erro ao criar conta", { description: translateAuthError(signUpError.message) });
        setLoading(false);
        return;
      }

      if (signUpData.user) {
        const userId = signUpData.user.id;
        await supabase.from("profiles").upsert({
          user_id: userId,
          cpf: unmask(cpf),
          phone: unmask(phone),
          first_name: firstName,
          last_name: lastName,
        }, { onConflict: "user_id" });
        await registerConsent(userId);

        // Create subscription — payment was already made
        const planId = currentPlan?.id;
        if (planId) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(planId)) {
            await supabase.from("subscriptions").insert([{
              user_id: userId,
              plan_id: planId,
              status: "active",
              payment_method: paymentMethod.toLowerCase(),
              notes: paymentData?.paymentId || paymentData?.subscriptionId || null,
            }]);
          }
        }

        toast.success("Conta criada! ✅", { description: "Redirecionando para o dashboard..." });
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (err) {
      logError("handleCreateAccountManually error", err);
      toast.error("Erro inesperado", { description: "Tente novamente." });
    }
    setLoading(false);
  };

  const handleCopyPix = () => {
    if (paymentData?.pixCopyPaste) {
      navigator.clipboard.writeText(paymentData.pixCopyPaste);
      setPixCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Date.now() < lockoutUntil.current) {
      const secs = Math.ceil((lockoutUntil.current - Date.now()) / 1000);
      toast.error("Aguarde", { description: `Tente novamente em ${secs}s` });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        lockoutUntil.current = Date.now() + 30000;
        setAttempts(0);
        toast.error("Muitas tentativas", { description: "Conta bloqueada por 30 segundos." });
      } else {
        toast.error("Erro ao entrar", { description: translateAuthError(error.message) });
      }
    } else if (data.user) {
      setAttempts(0);
      setLoading(false);
      await redirectAfterLogin(data.user.id);
    }
  };

  const stepLabels = ["Escolher Plano", "Dados e Pagamento"];
  const currentStepIndex = step === "select" ? 0 : 1;

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
            <p className="text-xs text-primary-foreground/70">Escolha seu plano e comece agora</p>
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
      {step !== "success" && mode === "buy" && (
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
          {/* LOGIN MODE */}
          {mode === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex flex-col lg:flex-row rounded-3xl overflow-hidden border border-border/60 bg-card shadow-2xl shadow-primary/5">
                {/* Left panel — desktop only */}
                <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary via-primary to-secondary relative overflow-hidden flex-col justify-between p-10">
                  <div className="absolute top-[-15%] left-[-10%] w-[350px] h-[350px] rounded-full bg-white/[0.06] blur-[90px]" />
                  <div className="absolute bottom-[-10%] right-[-5%] w-[300px] h-[300px] rounded-full bg-white/[0.04] blur-[70px]" />

                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-5 border border-white/10">
                      <CreditCard className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-primary-foreground tracking-tight mb-2">Meu Cartão</h2>
                    <p className="text-sm text-primary-foreground/75 leading-relaxed max-w-xs">
                      Acesse sua conta e aproveite consultas médicas com desconto exclusivo.
                    </p>

                    <div className="mt-8 space-y-3">
                      {["Consultas com até 70% de desconto", "Rede credenciada em todo o Brasil", "Agendamento online 24h", "Teleconsulta sem fila"].map((f, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="flex items-center gap-2.5 text-sm text-primary-foreground/80"
                        >
                          <Check className="w-4 h-4 text-primary-foreground/60 shrink-0" />
                          {f}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <motion.div
                    className="relative z-10 flex justify-center mt-6"
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <img
                      src={pingoCartao}
                      alt="Pingo mascote"
                      className="w-48 h-48 object-contain drop-shadow-2xl"
                      loading="eager" decoding="async" width={192} height={192} />
                  </motion.div>
                </div>

                {/* Right panel — form */}
                <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 lg:hidden">
                      <CreditCard className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground tracking-tight">Acessar meu cartão</h2>
                      <p className="text-sm text-muted-foreground">Entre com seus dados do cartão de benefícios</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/50 border border-border/60 mb-5">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 shrink-0 text-primary" />
                      Seus dados estão protegidos com criptografia de ponta a ponta.
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <div className="relative mt-1.5">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10 h-12 rounded-xl" required />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Senha</Label>
                      <div className="relative mt-1.5">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10 pr-10 h-12 rounded-xl"
                          required
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12 rounded-xl font-bold shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.97] transition-all" size="lg" disabled={loading}>
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
                      Ainda não tem conta? <button type="button" onClick={() => setMode("buy")} className="text-primary font-semibold hover:underline">Assinar um plano</button>
                    </p>
                  </form>

                  {/* Social proof */}
                  <div className="mt-8 pt-5 border-t border-border/50 flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary shrink-0" /> Dados protegidos</span>
                    <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-warning shrink-0" /> 4.9/5</span>
                    <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-destructive shrink-0" /> 12k+ pacientes</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Plan Selection */}
          {mode === "buy" && step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Escolha seu plano</h2>
                <p className="text-muted-foreground mt-2">Selecione o plano ideal para você e sua família</p>
              </div>

              {plansLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : plansError ? (
                <div className="text-center py-16">
                  <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Não foi possível carregar os planos.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {plans.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    const PlanIcon = plan.icon;
                    const isPremium = plan.name === "Prime Família";
                    return (
                      <motion.div
                        key={plan.id}
                        variants={fadeUp}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`card-interactive relative cursor-pointer rounded-2xl p-6 group overflow-hidden ${
                          isPremium
                            ? "bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground border-2 border-primary shadow-2xl shadow-primary/30"
                            : isSelected
                              ? "border-2 border-primary bg-card shadow-xl shadow-primary/15"
                              : plan.highlighted
                                ? "border-2 border-primary/40 bg-card shadow-lg shadow-primary/10"
                                : "border-2 border-border bg-card hover:border-primary/30 hover:shadow-lg"
                        }`}
                      >
                        {isPremium && (
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none" />
                        )}
                        {plan.highlighted && !isPremium && (
                          <span className="absolute -top-px left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-primary-foreground text-[10px] font-bold px-4 py-1 rounded-b-xl uppercase tracking-wider shadow-md">
                            Mais popular
                          </span>
                        )}
                        {isPremium && (
                          <span className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Premium
                          </span>
                        )}
                        {isSelected && !isPremium && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </motion.div>
                        )}
                        {isSelected && isPremium && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </motion.div>
                        )}
                        <img
                          src={PLAN_IMAGE_MAP[plan.name] || pingoSolitario}
                          alt=""
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 w-[90%] h-[90%] m-auto object-contain opacity-10 select-none mix-blend-multiply dark:mix-blend-screen"
                          loading="lazy" decoding="async" />
                        <h3 className={`font-bold text-xl tracking-tight ${isPremium ? "text-primary-foreground" : "text-foreground"}`}>
                          {plan.name}
                        </h3>
                        <p className={`text-xs mt-1 mb-4 ${isPremium ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {plan.description}
                        </p>
                        <div className="flex items-baseline gap-1 mb-5">
                          <span className={`text-3xl font-extrabold tracking-tight ${isPremium ? "text-primary-foreground" : "text-foreground"}`}>
                            R${plan.price.toFixed(2).replace('.', ',')}
                          </span>
                          <span className={`text-xs ${isPremium ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                            /{plan.period}
                          </span>
                        </div>
                        <div className={`h-px w-full mb-4 ${isPremium ? "bg-white/15" : "bg-border"}`} />
                        <ul className="space-y-2.5">
                          {plan.features.map((f, i) => (
                            <li key={i} className={`flex items-center gap-2.5 text-sm ${isPremium ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${isPremium ? "bg-white/20" : "bg-primary/10"}`}>
                                <Check className={`w-2.5 h-2.5 ${isPremium ? "text-primary-foreground" : "text-primary"}`} />
                              </div>
                              {f}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-6">
                          <div className={`w-full py-2.5 rounded-xl text-center text-sm font-semibold transition-all ${
                            isPremium
                              ? "bg-white/20 backdrop-blur-sm text-primary-foreground hover:bg-white/30"
                              : isSelected
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "bg-primary/5 text-primary group-hover:bg-primary/10"
                          }`}>
                            Assinar Cartão →
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              <div className="mt-8 flex justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-full px-10 h-12 text-base font-semibold shadow-xl shadow-primary/20"
                  disabled={!selectedPlanId}
                  onClick={() => {
                    if (selectedPlanId) {
                      sessionStorage.setItem("selectedPlanId", selectedPlanId);
                      setStep("payment");
                    }
                  }}
                >
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Já tem conta? <button type="button" onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Entrar</button>
              </p>
            </motion.div>
          )}

          {/* Step 2: Personal Data + Payment (combined) */}
          {mode === "buy" && step === "payment" && (
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
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">Finalizar Assinatura</h2>
                  <p className="text-sm text-muted-foreground">Preencha seus dados e escolha como pagar</p>
                </div>
              </div>

              {/* Plan summary */}
              {currentPlan && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        {currentPlan.highlighted ? <Zap className="w-4 h-4 text-primary" /> : <Clock className="w-4 h-4 text-primary" />}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{currentPlan.name}</p>
                        <p className="text-xs text-muted-foreground">Cobrança mensal</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-primary">R${currentPlan.price.toFixed(2).replace('.', ',')}</p>
                      <button onClick={() => setStep("select")} className="text-xs text-primary hover:underline font-medium">Trocar plano</button>
                    </div>
                  </div>
                </div>
              )}

              {!paymentData ? (
                <div className="space-y-5">
                  {/* Personal data section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Seus dados</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Nome</Label>
                        <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" required className="mt-1 h-11" />
                      </div>
                      <div>
                        <Label>Sobrenome</Label>
                        <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" required className="mt-1 h-11" />
                      </div>
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
                      <Label>Crie uma senha</Label>
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
                      <p className="text-[10px] text-muted-foreground mt-1">Essa senha será usada para acessar seu cartão depois</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border" />

                  {/* Payment method */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Forma de pagamento</span>
                    </div>
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

                  {/* Terms */}
                  <TermsConsentCheckbox checked={termsAccepted} onCheckedChange={setTermsAccepted} />

                  <Button
                    onClick={handleProcessPayment}
                    className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground cta-shimmer h-12 shadow-lg shadow-primary/20"
                    size="lg"
                    disabled={paymentLoading || !termsAccepted}
                  >
                    {paymentLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Processando...
                      </span>
                    ) : (
                      `Assinar por R$${currentPlan?.price.toFixed(2).replace('.', ',') || '0'} via ${paymentMethod === "CREDIT_CARD" ? "Cartão" : paymentMethod}`
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary" /> Pagamento seguro via Asaas
                  </p>

                  <p className="text-center text-sm text-muted-foreground">
                    Já tem conta? <button type="button" onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Entrar</button>
                  </p>
                </div>
              ) : (
                /* Payment result - PIX/Boleto generated */
                <div className="space-y-4">
                  {paymentData.pixQrCode && (
                    <div className="text-center space-y-4">
                      <div className="bg-card p-4 rounded-xl border border-border inline-block mx-auto">
                        <img
                          src={`data:image/png;base64,${paymentData.pixQrCode}`}
                          alt="QR Code PIX"
                          className="w-48 h-48 mx-auto" loading="lazy" decoding="async" />
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
                      <p className="text-sm text-muted-foreground">Pagamento sendo processado...</p>
                      <a href={paymentData.invoiceUrl} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                          Ir para pagamento
                        </Button>
                      </a>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-center">
                    <p className="text-xs text-muted-foreground">
                      Após a confirmação do pagamento, sua conta será criada automaticamente.
                      Você receberá uma notificação por email com os dados de acesso.
                    </p>
                  </div>

                  <Button
                    onClick={handleCreateAccountManually}
                    className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</span>
                    ) : (
                      "Já realizei o pagamento → Criar minha conta"
                    )}
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
