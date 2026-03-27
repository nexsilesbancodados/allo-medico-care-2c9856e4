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
import { validarCPF } from "@/lib/cpf";
import CpfInput from "@/components/ui/cpf-input";
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
    if (!validarCPF(cleanCpf)) {
      toast.error("CPF inválido", { description: "O CPF informado não é válido. Verifique os dígitos e tente novamente." });
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
            {/* Hero gradient header — taller, more immersive */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-secondary px-6 pt-[max(env(safe-area-inset-top,24px),24px)] pb-10">
              {/* Ambient blurs */}
              <div className="absolute top-[-25%] right-[-10%] w-[320px] h-[320px] rounded-full bg-white/[0.07] blur-[100px]" />
              <div className="absolute bottom-[-15%] left-[-8%] w-[220px] h-[220px] rounded-full bg-secondary/25 blur-[70px]" />
              <div className="absolute top-[40%] left-[30%] w-[120px] h-[120px] rounded-full bg-white/[0.04] blur-[50px]" />

              {/* Brand */}
              <div className="relative z-10 flex items-center gap-2.5 mb-8">
                <img src={logo} alt="AloClínica" className="w-10 h-10 rounded-2xl shadow-lg ring-2 ring-white/20" />
                <div>
                  <h1 className="text-xl font-black text-white tracking-tight leading-none">AloClínica</h1>
                  <p className="text-[10px] text-white/55 mt-0.5 tracking-wide">Telemedicina de excelência</p>
                </div>
              </div>

              {/* Mascot + headline */}
              <div className="relative z-10 flex items-end justify-between">
                <div className="flex-1 pb-3">
                  <h2 className="text-[32px] font-extrabold text-white leading-[1.1] tracking-tight">
                    Sua saúde em{" "}
                    <span className="relative inline-block">
                      <span className="relative z-10 text-white">boas mãos.</span>
                      <span className="absolute inset-0 bg-white/15 rounded-xl -skew-x-2 scale-x-105 scale-y-110" />
                    </span>
                  </h2>
                  <p className="text-[14px] text-white/65 mt-3 max-w-[260px] leading-relaxed">
                    Consultas online com especialistas verificados, do conforto da sua casa.
                  </p>
                </div>
                <motion.img
                  src={mascotWave}
                  alt="Pingo"
                  className="w-[110px] h-[110px] object-contain select-none shrink-0 -mr-1"
                  style={{ filter: "drop-shadow(0 6px 24px rgba(0,0,50,.3))" }}
                  initial={{ opacity: 0, scale: 0.5, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>

              {/* Trust chips */}
              <div className="relative z-10 flex gap-2 mt-5">
                {[
                  { emoji: "🏥", text: "CFM" },
                  { emoji: "🔒", text: "LGPD" },
                  { emoji: "⭐", text: "4.9/5" },
                ].map((chip, i) => (
                  <motion.span
                    key={chip.text}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="px-3 py-1.5 rounded-full bg-white/[0.12] text-white/90 text-[11px] font-bold border border-white/[0.08] backdrop-blur-md"
                  >
                    {chip.emoji} {chip.text}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-5 pt-7 pb-8 max-w-md mx-auto w-full">
              {/* Section label */}
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4 pl-1">
                Por que escolher a AloClínica
              </p>

              {/* Feature Cards — refined with subtle left accent */}
              <div className="space-y-3">
                {featureCards.map((card, i) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-card rounded-2xl p-4 flex items-center gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border/40 relative overflow-hidden group hover:shadow-md transition-shadow"
                  >
                    <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${
                      card.accent ? "bg-destructive/60" : "bg-primary/40"
                    }`} />
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ml-2 ${
                      card.accent ? "bg-destructive/10" : "bg-primary/10"
                    }`}>
                      <card.icon className={`w-[22px] h-[22px] ${card.accent ? "text-destructive" : "text-primary"}`} weight="fill" />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-foreground leading-tight">{card.title}</p>
                      <p className="text-[13px] text-muted-foreground mt-0.5">{card.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 grid grid-cols-3 gap-3"
              >
                {[
                  { value: "50k+", label: "Pacientes" },
                  { value: "200+", label: "Médicos" },
                  { value: "24/7", label: "Disponível" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-card rounded-2xl p-3 text-center border border-border/30 shadow-sm">
                    <p className="text-lg font-extrabold text-primary">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                ))}
              </motion.div>

              {/* CTA */}
              <div className="mt-8 space-y-4">
                <Button
                  onClick={() => setMode("signup")}
                  className="w-full h-[54px] rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-bold text-base shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all"
                  size="lg"
                >
                  <UserPlus className="w-5 h-5 mr-2" weight="fill" />
                  Começar Agora — É Grátis
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
            {/* Header with gradient + mascot */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-secondary px-5 pt-[max(env(safe-area-inset-top,16px),16px)] pb-7">
              <div className="absolute top-[-40%] right-[-15%] w-[260px] h-[260px] rounded-full bg-white/[0.06] blur-[80px]" />
              <div className="absolute bottom-[-25%] left-[-10%] w-[180px] h-[180px] rounded-full bg-secondary/20 blur-[60px]" />

              {/* Back button */}
              <button
                type="button"
                onClick={() => setMode("welcome")}
                className="relative z-10 flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-medium mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao início
              </button>

              {/* Brand row */}
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-black text-white tracking-tight leading-none">AloClínica</h1>
                  <p className="text-[11px] text-white/60 mt-0.5">Telemedicina de excelência</p>
                </div>
                <motion.img
                  src={mascotWave}
                  alt="Pingo"
                  className="w-[72px] h-[72px] object-contain select-none"
                  style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,50,.25))" }}
                  initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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

            <div className="flex-1 flex flex-col px-5 pt-6 pb-8 max-w-md mx-auto w-full">
              {/* Welcome text */}
              <div className="mb-6">
                <h2 className="text-[28px] font-extrabold text-foreground tracking-tight leading-tight">
                  Bem-vindo de volta
                </h2>
                <p className="text-[15px] text-muted-foreground mt-1">
                  Entre na sua conta para continuar
                </p>
              </div>

              {/* Login form — no card wrapper, cleaner */}
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <Label className="text-sm font-semibold text-foreground">Email</Label>
                  <div className="relative mt-1.5">
                    <Envelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/60" weight="fill" />
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-11 h-[52px] rounded-2xl bg-card border-border/60 shadow-sm focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)] focus-visible:border-primary/40 text-[15px]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-foreground">Senha</Label>
                    <Link to="/forgot-password" className="text-[13px] font-semibold text-primary hover:underline">
                      Esqueci minha senha
                    </Link>
                  </div>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/60" weight="fill" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-11 pr-11 h-[52px] rounded-2xl bg-card border-border/60 shadow-sm focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)] focus-visible:border-primary/40 text-[15px]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-bold text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <SpinnerGap className="w-5 h-5 animate-spin" /> Entrando...
                    </span>
                  ) : "Entrar"}
                </Button>
              </form>

              {/* Trust row */}
              <div className="flex items-center justify-center gap-6 mt-8">
                {[
                  { icon: LockKey, label: "Dados\ncriptografados" },
                  { icon: VideoCamera, label: "Vídeo HD\nseguro" },
                  { icon: Clock, label: "Atendimento\n24h" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-1.5 text-center">
                    <item.icon className="w-[18px] h-[18px] text-muted-foreground/40" weight="fill" />
                    <span className="text-[10px] text-muted-foreground/50 font-medium leading-tight whitespace-pre-line">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Register link */}
              <p className="text-center text-sm text-muted-foreground mt-8">
                Não tem conta?{" "}
                <button type="button" onClick={() => setMode("signup")} className="text-primary font-bold hover:underline">
                  Cadastre-se grátis
                </button>
              </p>

              <p className="text-center text-[10px] text-muted-foreground/40 mt-6 pb-4">
                © {new Date().getFullYear()} AloClínica — Tecnologia em Saúde
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
              {/* Header */}
              <div className="text-center mb-5">
                <motion.div
                  className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <UserPlus className="w-7 h-7 text-primary" weight="fill" />
                </motion.div>
                <h2 className="text-[22px] font-extrabold text-foreground tracking-tight">Crie sua conta grátis</h2>
                <p className="text-[13px] text-muted-foreground mt-1">Leva menos de 1 minuto</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                {/* Nome + Sobrenome */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[13px] font-semibold text-foreground">Nome</Label>
                    <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="João" required className="mt-1.5 h-12 rounded-xl bg-muted/40 border-border/50 text-[15px] focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] focus-visible:border-primary/40" />
                  </div>
                  <div>
                    <Label className="text-[13px] font-semibold text-foreground">Sobrenome</Label>
                    <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Silva" required className="mt-1.5 h-12 rounded-xl bg-muted/40 border-border/50 text-[15px] focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] focus-visible:border-primary/40" />
                  </div>
                </div>

                {/* CPF */}
                <div>
                  <Label className="text-[13px] font-semibold text-foreground">CPF</Label>
                  <CpfInput
                    value={cpf}
                    onChange={v => setCpf(v)}
                    className="mt-1.5"
                    inputClassName="pl-11 h-12 rounded-xl bg-muted/40 border-border/50 text-[15px] tracking-wide focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] focus-visible:border-primary/40"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <Label className="text-[13px] font-semibold text-foreground">Telefone</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" weight="fill" />
                    <Input value={phone} onChange={e => setPhone(formatMask(e.target.value, 'phone'))} placeholder="(00) 00000-0000" className="pl-11 font-mono h-12 rounded-xl bg-muted/40 border-border/50 text-[15px] tracking-wide focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] focus-visible:border-primary/40" maxLength={15} />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label className="text-[13px] font-semibold text-foreground">Email</Label>
                  <div className="relative mt-1.5">
                    <Envelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" weight="fill" />
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-11 h-12 rounded-xl bg-muted/40 border-border/50 text-[15px] focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] focus-visible:border-primary/40" required />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <Label className="text-[13px] font-semibold text-foreground">Crie uma senha</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" weight="fill" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="pl-11 pr-11 h-12 rounded-xl bg-muted/40 border-border/50 text-[15px] focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] focus-visible:border-primary/40"
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors">
                      {showPassword ? <EyeSlash className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  </div>
                  {password && <PasswordStrength password={password} />}
                </div>

                <TermsConsentCheckbox checked={termsAccepted} onCheckedChange={setTermsAccepted} />

                <Button
                  type="submit"
                  className="w-full h-[54px] rounded-2xl bg-gradient-to-r from-primary to-primary/85 text-primary-foreground font-bold text-base shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all"
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
                  <button type="button" onClick={() => setMode("login")} className="text-primary font-bold hover:underline">
                    Entrar
                  </button>
                </p>
              </form>

              {/* Trust footer */}
              <div className="flex items-center justify-center gap-6 mt-6 pb-2">
                {trustItems.map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-1.5">
                    <item.icon className="w-[18px] h-[18px] text-primary/40" weight="fill" />
                    <span className="text-[10px] text-muted-foreground/50 font-medium">{item.label}</span>
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
