import { logError } from "@/lib/logger";
import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, Lock, ArrowLeft, Check, Shield, Eye, EyeOff, Users, Loader2, Briefcase, Clock, Zap, ChevronRight } from "lucide-react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import { formatMask, unmask } from "@/hooks/use-mask";
import SEOHead from "@/components/SEOHead";
import PasswordStrength from "@/components/ui/password-strength";
import { translateAuthError } from "@/lib/authErrors";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

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
    { icon: Briefcase, title: "Consultas Médicas", desc: "Agende especialistas em poucos cliques.", span: true },
    { icon: Clock, title: "Histórico", desc: "Seu prontuário sempre à mão.", span: false },
    { icon: Zap, title: "Emergência", desc: "Atendimento 24h prioritário.", span: false, urgent: true },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(210, 20%, 98%)" }}>
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
            className="flex-1 flex flex-col px-5 pt-10 pb-8 max-w-md mx-auto w-full"
          >
            {/* Logo */}
            <h1 className="text-center font-[Manrope] text-[28px] font-extrabold text-primary tracking-tight">
              AloClínica
            </h1>

            {/* Hero Image Placeholder */}
            <div className="relative mx-auto mt-8 mb-6 w-full max-w-[320px]">
              <div className="w-full aspect-[16/11] rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Briefcase className="w-16 h-16 text-primary/30" />
              </div>
              {/* Speech bubble */}
              <div className="absolute top-3 right-3 bg-card rounded-2xl shadow-md px-4 py-2.5 max-w-[200px]">
                <p className="text-[13px] text-foreground leading-snug">
                  Olá! Sou seu guia para uma vida saudável.
                </p>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-center font-[Manrope] text-[32px] font-extrabold leading-tight text-foreground">
              Sua saúde em{" "}
              <span className="text-primary">boas mãos.</span>
            </h2>
            <p className="text-center text-sm text-muted-foreground mt-3 max-w-xs mx-auto leading-relaxed">
              Bem-vindo à AloClínica. O santuário digital para cuidar de você e de quem você ama.
            </p>

            {/* Feature Cards */}
            <div className="mt-8 space-y-3">
              {featureCards.map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className={`bg-card rounded-2xl p-4 flex items-center gap-4 ${
                    card.span ? "" : "w-full"
                  }`}
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    card.urgent ? "bg-destructive/10" : "bg-primary/10"
                  }`}>
                    <card.icon className={`w-5 h-5 ${card.urgent ? "text-destructive" : "text-primary"}`} />
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
              className="mt-6 rounded-2xl bg-primary p-5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/70">
                Destaque do mês
              </p>
              <h3 className="font-[Manrope] text-lg font-bold text-primary-foreground mt-1">
                Check-up Preventivo
              </h3>
              <p className="text-[13px] text-primary-foreground/70 mt-0.5">
                Incluso no seu plano AloClínica.
              </p>
              <div className="flex justify-end mt-3">
                <button className="px-4 py-2 rounded-full bg-primary-foreground text-primary text-[13px] font-semibold">
                  Saber Mais
                </button>
              </div>
            </motion.div>

            {/* CTA */}
            <div className="mt-8 space-y-4">
              <Button
                onClick={() => setMode("signup")}
                className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-[Manrope] font-bold text-base shadow-lg shadow-primary/20"
                size="lg"
              >
                Começar Agora
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-primary font-bold underline"
                >
                  Entrar
                </button>
              </p>
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
            className="flex-1 flex flex-col px-5 pt-10 pb-8 max-w-md mx-auto w-full"
          >
            {/* Header */}
            <div className="text-center mb-2">
              <h1 className="font-[Manrope] text-[28px] font-extrabold text-primary tracking-tight">
                AloClínica
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Cuidado especializado em cada toque.
              </p>
            </div>

            {/* Card */}
            <div className="bg-card rounded-[2rem] p-7 mt-6" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
              <div className="text-center mb-7">
                <h2 className="font-[Manrope] text-[28px] font-extrabold text-foreground">Entrar</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Acesse sua conta para gerenciar sua saúde.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <Label className="text-sm font-semibold">E-mail</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="nome@exemplo.com"
                      className="pl-11 h-12 rounded-2xl bg-muted/40 border-border/60"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Senha</Label>
                    <Link to="/forgot-password" className="text-[13px] font-semibold text-primary hover:underline">
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-11 pr-11 h-12 rounded-2xl bg-muted/40 border-border/60"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-[Manrope] font-bold text-base shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Entrando...
                    </span>
                  ) : "Entrar na Conta"}
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">ou continue com</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 rounded-2xl gap-2 text-sm font-medium bg-muted/40 border-border/60" disabled>
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </Button>
                <Button variant="outline" className="h-12 rounded-2xl gap-2 text-sm font-medium bg-muted/40 border-border/60" disabled>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
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
            <div className="flex items-center justify-center gap-6 mt-6 text-muted-foreground/50">
              <Shield className="w-5 h-5" />
              <Shield className="w-5 h-5" />
              <Shield className="w-5 h-5" />
            </div>

            <p className="text-center text-xs text-muted-foreground/60 mt-4 pb-8">
              © {new Date().getFullYear()} AloClínica — Tecnologia em Saúde. Todos os direitos reservados.
            </p>
          </motion.div>
        )}

        {/* ═══════════ SIGNUP ═══════════ */}
        {mode === "signup" && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="flex-1 flex flex-col px-5 pt-8 pb-8 max-w-md mx-auto w-full"
          >
            <div className="bg-card rounded-[2rem] p-7" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
              <button
                type="button"
                onClick={() => setMode("welcome")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-[Manrope] text-[28px] font-extrabold text-foreground">Criar conta</h2>
                <p className="text-sm text-muted-foreground mt-1">Cadastre-se gratuitamente</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Nome</Label>
                    <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" required className="mt-1 h-11 rounded-2xl" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Sobrenome</Label>
                    <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" required className="mt-1 h-11 rounded-2xl" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">CPF</Label>
                  <Input value={cpf} onChange={e => setCpf(formatMask(e.target.value, 'cpf'))} placeholder="000.000.000-00" className="mt-1 font-mono h-11 rounded-2xl" maxLength={14} />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Telefone</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={phone} onChange={e => setPhone(formatMask(e.target.value, 'phone'))} placeholder="(00) 00000-0000" className="pl-10 font-mono h-11 rounded-2xl" maxLength={15} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10 h-11 rounded-2xl" required />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Crie uma senha</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="pl-10 pr-10 h-11 rounded-2xl"
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

                <Button
                  type="submit"
                  className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-[Manrope] font-bold text-base shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
                  size="lg"
                  disabled={loading || !termsAccepted}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Criando conta...
                    </span>
                  ) : "Criar minha conta"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Já tem conta? <button type="button" onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Entrar</button>
                </p>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthPaciente;
