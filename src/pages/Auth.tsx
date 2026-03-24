import { logError } from "@/lib/logger";
import { useState } from "react";
import SEOHead from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowLeft, Stethoscope, Building2, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Shield, Video, Clock } from "lucide-react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import mascotWave from "@/assets/mascot-wave.png";
import mascotWelcome from "@/assets/mascot-welcome.png";
import mascotThumbsup from "@/assets/mascot-thumbsup.png";
import { notifyWelcomePatient, notifyWelcomeDoctor } from "@/lib/notifications";
import { translateAuthError } from "@/lib/authErrors";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

type UserType = "patient" | "doctor" | "clinic";
type AuthMode = "login" | "register" | "select-type";

const pageVariants = {
  initial: { opacity: 0, y: 12, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(2px)" },
};

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [userType, setUserType] = useState<UserType>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [crm, setCrm] = useState("");
  const [crmState, setCrmState] = useState("SP");
  const [clinicName, setClinicName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [success, setSuccess] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();
  const { redirectAfterLogin } = useAuthRedirect();

  const validateEmail = (val: string) => {
    if (!val) return "Email é obrigatório";
    if (!/\S+@\S+\.\S+/.test(val)) return "Email inválido";
    return "";
  };

  const validatePassword = (val: string) => {
    if (!val) return "Senha é obrigatória";
    if (val.length < 6) return "Mínimo 6 caracteres";
    return "";
  };

  const passwordStrength = (val: string) => {
    if (val.length === 0) return 0;
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return score;
  };

  const strengthLabel = ["", "Muito fraca", "Fraca", "Média", "Forte", "Muito forte"];
  const strengthColor = ["", "bg-destructive", "bg-warning", "bg-warning", "bg-success", "bg-success"];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      const translated = translateAuthError(error.message);
      if (error.message.includes("Invalid login credentials")) {
        setPasswordError(translated);
      } else {
        toast.error("Erro ao entrar", { description: translated });
      }
    } else if (data.user) {
      await redirectAfterLogin(data.user.id);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error("Aceite os termos", { description: "Você precisa aceitar os Termos de Uso e Política de Privacidade." });
      return;
    }
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { first_name: firstName, last_name: lastName },
      },
    });

    if (error) {
      setLoading(false);
      toast.error("Erro no cadastro", { description: translateAuthError(error.message) });
      return;
    }

    if (data.user) {
      await registerConsent(data.user.id, `terms_and_privacy_${userType}`);

      if (userType === "doctor") {
        await supabase.from("doctor_profiles").insert({ user_id: data.user.id, crm, crm_state: crmState });
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: "doctor" });
        notifyWelcomeDoctor(`${firstName} ${lastName}`, email, crm).catch(err => logError("notifyWelcomeDoctor failed", err));
      } else if (userType === "clinic") {
        await supabase.from("clinic_profiles").insert({ user_id: data.user.id, name: clinicName, cnpj });
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: "clinic" });
      } else {
        notifyWelcomePatient(`${firstName} ${lastName}`, email).catch(err => logError("notifyWelcomePatient failed", err));
      }
    }

    setLoading(false);
    setSuccess(true);
    setTimeout(() => navigate("/dashboard"), 1800);
  };

  const userTypes = [
    { type: "patient" as UserType, icon: User, label: "Paciente", desc: "Agende consultas e cuide da sua saúde", color: "bg-primary/10 text-primary border-primary/30" },
    { type: "doctor" as UserType, icon: Stethoscope, label: "Médico", desc: "Atenda pacientes por videochamada", color: "bg-secondary/10 text-secondary border-secondary/30" },
    { type: "clinic" as UserType, icon: Building2, label: "Clínica", desc: "Gerencie seus médicos e atendimentos", color: "bg-accent text-accent-foreground border-border" },
  ];

  const strength = passwordStrength(password);

  const trustBadges = [
    { icon: Shield, label: "Dados criptografados" },
    { icon: Video, label: "Vídeo HD seguro" },
    { icon: Clock, label: "Atendimento 24h" },
  ];

  return (
    <div className="min-h-screen relative flex">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(195,55%,97%)] via-[hsl(205,45%,93%)] to-[hsl(215,40%,88%)] dark:from-[hsl(195,25%,7%)] dark:via-[hsl(205,20%,9%)] dark:to-[hsl(215,18%,11%)]" />
      <SEOHead title="Login e Cadastro" description="Acesse sua conta ou cadastre-se na AloClinica para consultas médicas online por vídeo." />

      {/* ── Left panel — desktop only ── */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden">
        {/* Rich gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary" />
        
        {/* Ambient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-8%] w-[400px] h-[400px] rounded-full bg-secondary/20 blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[200px] h-[200px] rounded-full bg-white/[0.04] blur-[60px]" />

        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)", backgroundSize: "28px 28px" }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors text-sm font-medium group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Voltar ao início
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Logo + brand */}
              <div className="flex items-center gap-3 mb-8">
                <img src={logo} alt="AloClinica" className="w-14 h-14 rounded-2xl shadow-lg ring-2 ring-white/20" />
                <div>
                  <p className="text-2xl font-black text-white tracking-tight leading-none">AloClínica</p>
                  <p className="text-sm text-white/60 mt-0.5">Telemedicina de excelência</p>
                </div>
              </div>

              {/* Pingo mascot — wave pose */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="flex justify-center mb-6"
              >
                <motion.img
                  src={mascotWave}
                  alt="Pingo, mascote AloClínica"
                  className="w-52 h-52 object-contain drop-shadow-2xl select-none"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
              
              <h1 className="text-4xl font-extrabold text-white mb-4 leading-[1.1] tracking-tight">
                Saúde na<br />palma da mão
              </h1>
              <p className="text-base text-white/70 leading-relaxed max-w-md">
                Consultas por vídeo com médicos qualificados, receitas digitais e atendimento 24h.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  { icon: "🏥", label: "Médicos certificados pelo CFM" },
                  { icon: "📋", label: "Receitas e atestados digitais válidos" },
                  { icon: "🔒", label: "Dados protegidos pela LGPD" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0 text-base border border-white/10">
                      {item.icon}
                    </div>
                    <span className="text-sm text-white/80 font-medium">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Social proof footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex items-center gap-6 pt-6 border-t border-white/10"
          >
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-primary/50 backdrop-blur-sm" />
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-foreground/90">+5.000 pacientes</p>
              <p className="text-xs text-primary-foreground/50">confiam na AloClinica</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header with Pingo + logo */}
        {/* Mobile header — Pingo + brand */}
        <div className="lg:hidden bg-gradient-to-br from-primary to-secondary px-5 pt-[max(env(safe-area-inset-top,16px),16px)] pb-0 relative overflow-hidden">
          {/* Orbs */}
          <div className="absolute top-[-30%] right-[-20%] w-[200px] h-[200px] rounded-full bg-white/[0.06] blur-[60px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[150px] h-[150px] rounded-full bg-white/[0.04] blur-[40px]" />
          {/* Back link */}
          <Link to="/" className="relative z-10 inline-flex items-center gap-1.5 text-white/70 hover:text-white transition text-sm mb-3">
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>
          {/* Brand + Pingo */}
          <div className="relative z-10 flex items-end justify-between">
            <div className="pb-4">
              <div className="flex items-center gap-2.5 mb-2">
                <img src={logo} alt="AloClínica" className="w-10 h-10 rounded-2xl shadow-lg ring-2 ring-white/20" />
                <div>
                  <h1 className="text-[20px] font-black text-white tracking-tight leading-none">AloClínica</h1>
                  <p className="text-[10.5px] text-white/60 mt-0.5">Telemedicina de excelência</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <span className="px-2 py-1 rounded-full bg-white/15 text-white/85 text-[9px] font-bold border border-white/20">🏥 CFM</span>
                <span className="px-2 py-1 rounded-full bg-white/15 text-white/85 text-[9px] font-bold border border-white/20">🔒 LGPD</span>
                <span className="px-2 py-1 rounded-full bg-white/15 text-white/85 text-[9px] font-bold border border-white/20">⭐ 4.9/5</span>
              </div>
            </div>
            {/* Pingo — large, coming out of the header */}
            <motion.img
              src={mascotWave}
              alt="Pingo AloClínica"
              className="w-[110px] h-[110px] object-contain select-none relative z-10"
              style={{ filter: "drop-shadow(0 -4px 20px rgba(0,0,50,.25))" }}
              initial={{ opacity: 0, scale: 0.6, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-5 overflow-y-auto sm:p-6">
          <div className="w-full max-w-[420px] py-8">
            <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition text-sm">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>

            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-10"
                >
                  <motion.img
                    src={mascotThumbsup}
                    alt="Pingo comemorando"
                    className="w-32 h-32 object-contain mx-auto drop-shadow-xl select-none"
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: [0, -12, 0] }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <h2 className="text-2xl font-bold text-foreground mt-4 mb-2">Conta criada! 🎉</h2>
                  <p className="text-muted-foreground text-sm">Redirecionando para o painel...</p>
                </motion.div>
              ) : mode === "login" ? (
                <motion.div key="login" {...pageVariants} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                  <div className="mb-8">
                    <h2 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">Bem-vindo de volta</h2>
                    <p className="text-muted-foreground">Entre na sua conta para continuar</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5" noValidate>
                    <div>
                      <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={e => { setEmail(e.target.value); setEmailError(""); }}
                          onBlur={() => setEmailError(validateEmail(email))}
                          className={`pl-11 h-12 rounded-xl text-base transition-shadow focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)] ${emailError ? "border-destructive focus-visible:ring-destructive" : "border-input"}`}
                        />
                        {emailError && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                            <p className="text-xs text-destructive">{emailError}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="password" className="text-sm font-semibold text-foreground">Senha</Label>
                        <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">Esqueci minha senha</Link>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={e => { setPassword(e.target.value); setPasswordError(""); }}
                          className={`pl-11 pr-11 h-12 rounded-xl text-base transition-shadow focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)] ${passwordError ? "border-destructive focus-visible:ring-destructive" : "border-input"}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordError && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                          <p className="text-xs text-destructive">{passwordError}</p>
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl bg-gradient-hero text-primary-foreground font-bold text-base shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.98] transition-all"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Entrando...
                        </span>
                      ) : "Entrar"}
                    </Button>
                  </form>

                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-4 mt-6 pt-5 border-t border-border">
                    {trustBadges.map(badge => (
                      <div key={badge.label} className="flex items-center gap-1.5 text-muted-foreground">
                        <badge.icon className="w-3.5 h-3.5 text-primary/60" />
                        <span className="text-[11px] font-medium">{badge.label}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Não tem conta?{" "}
                    <button onClick={() => setMode("select-type")} className="text-primary font-bold hover:underline">
                      Cadastre-se grátis
                    </button>
                  </p>
                </motion.div>
              ) : mode === "select-type" ? (
                <motion.div key="select" {...pageVariants} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                  <div className="mb-8">
                    <h2 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">Criar conta</h2>
                    <p className="text-muted-foreground">Selecione o tipo de cadastro</p>
                  </div>

                  <div className="space-y-3">
                    {userTypes.map((ut, i) => (
                      <motion.button
                        key={ut.type}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        onClick={() => {
                          if (ut.type === "patient") {
                            navigate("/paciente");
                            return;
                          }
                          setUserType(ut.type);
                          setMode("register");
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-primary/40 hover:bg-primary/[0.03] text-left group transition-all duration-200"
                      >
                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${ut.color} transition-transform group-hover:scale-105`}>
                          <ut.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors">{ut.label}</p>
                          <p className="text-sm text-muted-foreground">{ut.desc}</p>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-muted-foreground/30 rotate-180 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </motion.button>
                    ))}
                  </div>

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Já tem conta?{" "}
                    <button onClick={() => setMode("login")} className="text-primary font-bold hover:underline">Entrar</button>
                  </p>
                </motion.div>
              ) : (
                <motion.div key="register" {...pageVariants} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                  <button onClick={() => setMode("select-type")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group">
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Voltar
                  </button>

                  <div className="mb-6">
                    <div className={`w-11 h-11 rounded-xl border mb-3 flex items-center justify-center ${userTypes.find(u => u.type === userType)?.color}`}>
                      {(() => { const ut = userTypes.find(u => u.type === userType); return ut ? <ut.icon className="w-5 h-5" /> : null; })()}
                    </div>
                    <h2 className="text-2xl font-extrabold text-foreground mb-1 tracking-tight">
                      Cadastro de {userTypes.find(u => u.type === userType)?.label}
                    </h2>
                    <p className="text-muted-foreground text-sm">Preencha seus dados para criar a conta</p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4" noValidate>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-semibold">Nome</Label>
                        <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" required className="mt-1.5 h-11 rounded-xl" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Sobrenome</Label>
                        <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" required className="mt-1.5 h-11 rounded-xl" />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Email</Label>
                      <div className="relative mt-1.5">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="email"
                          value={email}
                          onChange={e => { setEmail(e.target.value); setEmailError(""); }}
                          onBlur={() => setEmailError(validateEmail(email))}
                          placeholder="seu@email.com"
                          className={`pl-11 h-11 rounded-xl ${emailError ? "border-destructive" : ""}`}
                        />
                        {emailError && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                            <p className="text-xs text-destructive">{emailError}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Senha</Label>
                      <div className="relative mt-1.5">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={e => { setPassword(e.target.value); setPasswordError(""); }}
                          placeholder="Mínimo 6 caracteres"
                          className={`pl-11 pr-11 h-11 rounded-xl ${passwordError ? "border-destructive" : ""}`}
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {password.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor[strength] : "bg-muted"}`} />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">Força: <span className="font-semibold text-foreground">{strengthLabel[strength]}</span></p>
                        </div>
                      )}
                      {passwordError && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                          <p className="text-xs text-destructive">{passwordError}</p>
                        </div>
                      )}
                    </div>

                    {userType === "doctor" && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <Label className="text-sm font-semibold">CRM</Label>
                          <Input value={crm} onChange={e => setCrm(e.target.value)} placeholder="123456" required className="mt-1.5 h-11 rounded-xl" />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">UF</Label>
                          <Input value={crmState} onChange={e => setCrmState(e.target.value.toUpperCase())} placeholder="SP" required className="mt-1.5 h-11 rounded-xl" maxLength={2} />
                        </div>
                      </div>
                    )}

                    {userType === "clinic" && (
                      <>
                        <div>
                          <Label className="text-sm font-semibold">Nome da Clínica</Label>
                          <Input value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="Clínica Saúde" required className="mt-1.5 h-11 rounded-xl" />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">CNPJ <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                          <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="mt-1.5 h-11 rounded-xl" />
                        </div>
                      </>
                    )}

                    <TermsConsentCheckbox checked={termsAccepted} onCheckedChange={setTermsAccepted} className="mt-2" />

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl bg-gradient-hero text-primary-foreground font-bold text-base shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.98] transition-all"
                      size="lg"
                      disabled={loading || !termsAccepted}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Criando conta...
                        </span>
                      ) : "Criar conta grátis"}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-muted-foreground mt-5">
                    Já tem conta?{" "}
                    <button onClick={() => setMode("login")} className="text-primary font-bold hover:underline">Entrar</button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
