import { logError } from "@/lib/logger";
import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, Lock, ArrowLeft, Heart, Check, Star, Shield, Eye, EyeOff, Sparkles, Users, Loader2 } from "lucide-react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import { formatMask, unmask } from "@/hooks/use-mask";
import SEOHead from "@/components/SEOHead";
import PasswordStrength from "@/components/ui/password-strength";
import { translateAuthError } from "@/lib/authErrors";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import pingoCartao from "@/assets/pingo-cartao.png";

const AuthPaciente = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");

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

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col" style={{ background: 'var(--landing-bg)' }}>
      <SEOHead title="Entrar — Paciente" description="Acesse sua conta AloClinica para consultas médicas online." />

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
            <h1 className="text-lg font-bold text-primary-foreground">AloClinica</h1>
            <p className="text-xs text-primary-foreground/70">
              {mode === "login" ? "Entre na sua conta" : "Crie sua conta gratuita"}
            </p>
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

      <div className="container mx-auto px-4 pb-16 flex-1 flex items-center justify-center py-10">
        <AnimatePresence mode="wait">
          {/* LOGIN */}
          {mode === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-4xl mx-auto w-full"
            >
              <div className="flex flex-col lg:flex-row rounded-3xl overflow-hidden border border-border/60 bg-card shadow-2xl shadow-primary/5">
                {/* Left panel — desktop */}
                <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary via-primary to-secondary relative overflow-hidden flex-col justify-between p-10">
                  <div className="absolute top-[-15%] left-[-10%] w-[350px] h-[350px] rounded-full bg-white/[0.06] blur-[90px]" />
                  <div className="absolute bottom-[-10%] right-[-5%] w-[300px] h-[300px] rounded-full bg-white/[0.04] blur-[70px]" />

                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-5 border border-white/10">
                      <Heart className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-primary-foreground tracking-tight mb-2">Bem-vindo de volta</h2>
                    <p className="text-sm text-primary-foreground/75 leading-relaxed max-w-xs">
                      Acesse sua conta e agende consultas médicas com facilidade.
                    </p>

                    <div className="mt-8 space-y-3">
                      {["Teleconsulta com médicos especializados", "Prontuário digital completo", "Agendamento online 24h", "Histórico de consultas e receitas"].map((f, i) => (
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
                      <Heart className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground tracking-tight">Entrar na sua conta</h2>
                      <p className="text-sm text-muted-foreground">Acesse seu prontuário e consultas</p>
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
                      Ainda não tem conta? <button type="button" onClick={() => setMode("signup")} className="text-primary font-semibold hover:underline">Criar conta</button>
                    </p>
                  </form>

                  <div className="mt-8 pt-5 border-t border-border/50 flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary shrink-0" /> Dados protegidos</span>
                    <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-warning shrink-0" /> 4.9/5</span>
                    <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-destructive shrink-0" /> 12k+ pacientes</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SIGNUP */}
          {mode === "signup" && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-md mx-auto w-full"
            >
              <div className="rounded-3xl overflow-hidden border border-border/60 bg-card shadow-2xl shadow-primary/5 p-6 sm:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Users className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Criar conta</h2>
                    <p className="text-sm text-muted-foreground">Cadastre-se gratuitamente</p>
                  </div>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
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
                  </div>

                  <TermsConsentCheckbox checked={termsAccepted} onCheckedChange={setTermsAccepted} />

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12 rounded-xl font-bold shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.97] transition-all"
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
    </div>
  );
};

export default AuthPaciente;
