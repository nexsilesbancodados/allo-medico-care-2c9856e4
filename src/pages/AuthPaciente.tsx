import { logError } from "@/lib/logger";
import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Envelope,
  Lock,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeSlash,
  UserPlus,
  SpinnerGap,
  Stethoscope,
  Clock,
  Lightning,
  Heartbeat,
  Star,
  CheckCircle,
  Phone,
  IdentificationCard,
  GoogleLogo,
  FacebookLogo,
  Certificate,
  LockKey,
  VideoCamera,
} from "@phosphor-icons/react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import { formatMask, unmask } from "@/hooks/use-mask";
import SEOHead from "@/components/SEOHead";
import PasswordStrength from "@/components/ui/password-strength";
import { translateAuthError } from "@/lib/authErrors";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import logo from "@/assets/logo.png";
import mascotWave from "@/assets/mascot-wave.png";
import mascotThumbsup from "@/assets/mascot-thumbsup.png";

const AuthPaciente = () => {
  const [mode, setMode] = useState<"welcome" | "login" | "signup">("welcome");
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
  const navigate = useNavigate();
  const { redirectAfterLogin } = useAuthRedirect();

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
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
        if (signUpError.message.includes("already registered")) {
          toast.error("Email já cadastrado", { description: "Tente fazer login." });
          setMode("login");
          setLoading(false);
          return;
        }
        toast.error("Erro ao criar conta", { description: translateAuthError(signUpError.message) });
        setLoading(false);
        return;
      }

      if (signUpData.user) {
        const userId = signUpData.user.id;
        const refCode = sessionStorage.getItem("ref_code");

        await supabase.from("profiles").upsert({
          user_id: userId,
          cpf: cleanCpf,
          phone: cleanPhone,
          first_name: firstName,
          last_name: lastName,
          referred_by: refCode || null,
        }, { onConflict: "user_id" });

        await registerConsent(userId);

        if (refCode) {
          await supabase.from("referrals").insert({
            referral_code: refCode,
            referred_user_id: userId,
            referrer_id: userId,
            status: "pending",
            source: "signup",
          }).then(() => sessionStorage.removeItem("ref_code"));
        }

        try {
          await supabase.functions.invoke("send-email", {
            body: { type: "welcome", to: email, data: { name: firstName } },
          });
        } catch {}

        toast.success("Conta criada! ✅", { description: "Redirecionando..." });
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (err) {
      logError("handleSignup error", err);
      toast.error("Erro inesperado", { description: "Tente novamente." });
    }
    setLoading(false);
  };

  /* ═══ FEATURE CARDS DATA ═══ */
  const featureCards = [
    { icon: Stethoscope, title: "Consultas Médicas", desc: "Agende especialistas em poucos cliques.", accent: false },
    { icon: Clock, title: "Histórico Completo", desc: "Seu prontuário sempre à mão.", accent: false },
    { icon: Lightning, title: "Pronto-Atendimento", desc: "Atendimento 24h prioritário.", accent: true },
  ];

  const trustItems = [
    { icon: ShieldCheck, label: "Dados LGPD" },
    { icon: Certificate, label: "CFM Verificado" },
    { icon: VideoCamera, label: "Vídeo HD" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="AloClínica — Paciente" description="Acesse sua conta AloClinica para consultas médicas online." />

      <AnimatePresence mode="wait">
        {/* ═══════════ TELA 1 — ONBOARDING ═══════════ */}
        {mode === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="flex-1 flex flex-col"
          >
            {/* Hero gradient header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-secondary px-5 pt-[max(env(safe-area-inset-top,20px),20px)] pb-8">
              <div className="absolute top-[-30%] right-[-15%] w-[280px] h-[280px] rounded-full bg-white/[0.06] blur-[80px]" />
              <div className="absolute bottom-[-20%] left-[-10%] w-[200px] h-[200px] rounded-full bg-secondary/20 blur-[60px]" />

              {/* Brand */}
              <div className="relative z-10 flex items-center gap-2.5 mb-6">
                <img src={logo} alt="AloClínica" className="w-10 h-10 rounded-2xl shadow-lg ring-2 ring-white/20" />
                <div>
                  <h1 className="text-xl font-black text-white tracking-tight leading-none">AloClínica</h1>
                  <p className="text-[10px] text-white/60 mt-0.5">Telemedicina de excelência</p>
                </div>
              </div>

              {/* Mascot + headline */}
              <div className="relative z-10 flex items-end justify-between">
                <div className="flex-1 pb-2">
                  <h2 className="text-[28px] font-extrabold text-white leading-[1.15] tracking-tight">
                    Sua saúde em{" "}
                    <span className="text-secondary-foreground bg-white/15 px-2 py-0.5 rounded-lg">boas mãos.</span>
                  </h2>
                  <p className="text-sm text-white/70 mt-3 max-w-[240px] leading-relaxed">
                    O santuário digital para cuidar de você e de quem você ama.
                  </p>
                </div>
                <motion.img
                  src={mascotWave}
                  alt="Pingo"
                  className="w-[120px] h-[120px] object-contain select-none shrink-0"
                  style={{ filter: "drop-shadow(0 4px 20px rgba(0,0,50,.25))" }}
                  initial={{ opacity: 0, scale: 0.6, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>

              {/* Trust chips */}
              <div className="relative z-10 flex gap-2 mt-4">
                {[
                  { emoji: "🏥", text: "CFM" },
                  { emoji: "🔒", text: "LGPD" },
                  { emoji: "⭐", text: "4.9/5" },
                ].map((chip) => (
                  <span
                    key={chip.text}
                    className="px-2.5 py-1 rounded-full bg-white/15 text-white/90 text-[10px] font-bold border border-white/10 backdrop-blur-sm"
                  >
                    {chip.emoji} {chip.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-5 pt-6 pb-8 max-w-md mx-auto w-full">
              {/* Feature Cards */}
              <div className="space-y-3">
                {featureCards.map((card, i) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="bg-card rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-border/50"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      card.accent ? "bg-destructive/10" : "bg-primary/10"
                    }`}>
                      <card.icon className={`w-5 h-5 ${card.accent ? "text-destructive" : "text-primary"}`} weight="fill" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-foreground">{card.title}</p>
                      <p className="text-[13px] text-muted-foreground">{card.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Highlight Banner */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-5 rounded-2xl bg-gradient-to-br from-primary to-primary/85 p-5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/[0.06] blur-[30px]" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/60 relative z-10">
                  Destaque do mês
                </p>
                <h3 className="text-lg font-bold text-primary-foreground mt-1 relative z-10">
                  Check-up Preventivo
                </h3>
                <p className="text-[13px] text-primary-foreground/70 mt-0.5 relative z-10">
                  Incluso no seu plano AloClínica.
                </p>
                <div className="flex justify-end mt-3 relative z-10">
                  <button className="px-4 py-2 rounded-full bg-primary-foreground text-primary text-[13px] font-semibold hover:bg-primary-foreground/90 transition-colors active:scale-[0.97]">
                    Saber Mais
                  </button>
                </div>
              </motion.div>

              {/* CTA */}
              <div className="mt-8 space-y-4">
                <Button
                  onClick={() => setMode("signup")}
                  className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
                  size="lg"
                >
                  <UserPlus className="w-5 h-5 mr-2" weight="fill" />
                  Começar Agora
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Já tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-primary font-bold hover:underline"
                  >
                    Entrar
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════ TELA 2 — LOGIN ═══════════ */}
        {mode === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="flex-1 flex flex-col"
          >
            {/* Mini header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary to-secondary px-5 pt-[max(env(safe-area-inset-top,16px),16px)] pb-5">
              <div className="absolute top-[-30%] right-[-20%] w-[200px] h-[200px] rounded-full bg-white/[0.06] blur-[60px]" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src={logo} alt="AloClínica" className="w-9 h-9 rounded-xl shadow-lg ring-2 ring-white/20" />
                  <div>
                    <p className="text-lg font-black text-white tracking-tight leading-none">AloClínica</p>
                    <p className="text-[10px] text-white/60 mt-0.5">Cuidado especializado em cada toque.</p>
                  </div>
                </div>
                <motion.img
                  src={mascotWave}
                  alt="Pingo"
                  className="w-16 h-16 object-contain select-none"
                  style={{ filter: "drop-shadow(0 2px 12px rgba(0,0,50,.2))" }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col px-5 pt-5 pb-8 max-w-md mx-auto w-full">
              {/* Card */}
              <div className="bg-card rounded-[1.75rem] p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.07)] border border-border/40">
                <div className="text-center mb-7">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <LockKey className="w-6 h-6 text-primary" weight="fill" />
                  </div>
                  <h2 className="text-[26px] font-extrabold text-foreground tracking-tight">Entrar</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Acesse sua conta para gerenciar sua saúde.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <Label className="text-sm font-semibold text-foreground">E-mail</Label>
                    <div className="relative mt-1.5">
                      <Envelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" weight="fill" />
                      <Input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="nome@exemplo.com"
                        className="pl-11 h-12 rounded-2xl bg-muted/30 border-border/60 focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-foreground">Senha</Label>
                      <Link to="/forgot-password" className="text-[13px] font-semibold text-primary hover:underline">
                        Esqueceu a senha?
                      </Link>
                    </div>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" weight="fill" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-11 pr-11 h-12 rounded-2xl bg-muted/30 border-border/60 focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <SpinnerGap className="w-5 h-5 animate-spin" /> Entrando...
                      </span>
                    ) : "Entrar na Conta"}
                  </Button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">ou continue com</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Social buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-12 rounded-2xl gap-2 text-sm font-medium bg-muted/20 border-border/60 hover:bg-muted/40 transition-colors" disabled>
                    <GoogleLogo className="w-5 h-5" weight="bold" />
                    Google
                  </Button>
                  <Button variant="outline" className="h-12 rounded-2xl gap-2 text-sm font-medium bg-muted/20 border-border/60 hover:bg-muted/40 transition-colors" disabled>
                    <FacebookLogo className="w-5 h-5" weight="fill" />
                    Facebook
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Ainda não tem uma conta?{" "}
                  <button type="button" onClick={() => setMode("signup")} className="text-primary font-bold hover:underline">
                    Criar conta agora
                  </button>
                </p>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-5 mt-6">
                {trustItems.map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-1">
                    <item.icon className="w-5 h-5 text-muted-foreground/50" weight="fill" />
                    <span className="text-[9px] text-muted-foreground/50 font-medium">{item.label}</span>
                  </div>
                ))}
              </div>

              <p className="text-center text-[10px] text-muted-foreground/50 mt-4 pb-6">
                © {new Date().getFullYear()} AloClínica — Tecnologia em Saúde. Todos os direitos reservados.
              </p>
            </div>
          </motion.div>
        )}

        {/* ═══════════ TELA 3 — SIGNUP ═══════════ */}
        {mode === "signup" && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="flex-1 flex flex-col"
          >
            {/* Mini header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary to-secondary px-5 pt-[max(env(safe-area-inset-top,16px),16px)] pb-4">
              <div className="absolute top-[-30%] right-[-20%] w-[200px] h-[200px] rounded-full bg-white/[0.06] blur-[60px]" />
              <div className="relative z-10 flex items-center gap-2.5">
                <button type="button" onClick={() => setMode("welcome")} className="text-white/70 hover:text-white transition-colors mr-1">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <img src={logo} alt="AloClínica" className="w-8 h-8 rounded-xl ring-2 ring-white/20" />
                <p className="text-base font-bold text-white tracking-tight">Criar conta</p>
              </div>
            </div>

            <div className="flex-1 px-5 pt-5 pb-8 max-w-md mx-auto w-full overflow-y-auto">
              <div className="bg-card rounded-[1.75rem] p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.07)] border border-border/40">
                {/* Header */}
                <div className="text-center mb-6">
                  <motion.img
                    src={mascotThumbsup}
                    alt="Pingo"
                    className="w-16 h-16 object-contain mx-auto mb-3 select-none"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <h2 className="text-[24px] font-extrabold text-foreground tracking-tight">Cadastre-se grátis</h2>
                  <p className="text-sm text-muted-foreground mt-1">Preencha seus dados para começar</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold">Nome</Label>
                      <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" required className="mt-1 h-11 rounded-2xl bg-muted/30 border-border/60" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Sobrenome</Label>
                      <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" required className="mt-1 h-11 rounded-2xl bg-muted/30 border-border/60" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">CPF</Label>
                    <div className="relative mt-1">
                      <IdentificationCard className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" weight="fill" />
                      <Input value={cpf} onChange={e => setCpf(formatMask(e.target.value, 'cpf'))} placeholder="000.000.000-00" className="pl-10 font-mono h-11 rounded-2xl bg-muted/30 border-border/60" maxLength={14} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Telefone</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" weight="fill" />
                      <Input value={phone} onChange={e => setPhone(formatMask(e.target.value, 'phone'))} placeholder="(00) 00000-0000" className="pl-10 font-mono h-11 rounded-2xl bg-muted/30 border-border/60" maxLength={15} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Email</Label>
                    <div className="relative mt-1">
                      <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" weight="fill" />
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10 h-11 rounded-2xl bg-muted/30 border-border/60" required />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Crie uma senha</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" weight="fill" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="pl-10 pr-10 h-11 rounded-2xl bg-muted/30 border-border/60"
                        required
                        minLength={6}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>
                    {password && <PasswordStrength password={password} />}
                  </div>

                  <TermsConsentCheckbox checked={termsAccepted} onCheckedChange={setTermsAccepted} />

                  <Button
                    type="submit"
                    className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
                    size="lg"
                    disabled={loading || !termsAccepted}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <SpinnerGap className="w-5 h-5 animate-spin" /> Criando conta...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" weight="fill" />
                        Criar minha conta
                      </span>
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Já tem conta?{" "}
                    <button type="button" onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">
                      Entrar
                    </button>
                  </p>
                </form>
              </div>

              {/* Trust */}
              <div className="flex items-center justify-center gap-5 mt-5">
                {trustItems.map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-1">
                    <item.icon className="w-5 h-5 text-muted-foreground/50" weight="fill" />
                    <span className="text-[9px] text-muted-foreground/50 font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthPaciente;
