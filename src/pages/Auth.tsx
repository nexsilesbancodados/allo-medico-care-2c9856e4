import { useState } from "react";
import SEOHead from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowLeft, Stethoscope, Building2, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { notifyWelcomePatient, notifyWelcomeDoctor } from "@/lib/notifications";

type UserType = "patient" | "doctor" | "clinic";
type AuthMode = "login" | "register" | "select-type";

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
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
  const { toast } = useToast();

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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setPasswordError("Email ou senha incorretos");
      } else {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      }
    } else {
      navigate("/dashboard");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast({ title: "Aceite os termos", description: "Você precisa aceitar os Termos de Uso e Política de Privacidade.", variant: "destructive" });
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
      toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
      return;
    }

    if (data.user) {
      // Register consent
      await registerConsent(data.user.id, `terms_and_privacy_${userType}`);

      if (userType === "doctor") {
        await supabase.from("doctor_profiles").insert({ user_id: data.user.id, crm, crm_state: crmState });
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: "doctor" });
        notifyWelcomeDoctor(`${firstName} ${lastName}`, email, crm).catch(console.error);
      } else if (userType === "clinic") {
        await supabase.from("clinic_profiles").insert({ user_id: data.user.id, name: clinicName, cnpj });
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: "clinic" });
      } else {
        // Patient welcome
        notifyWelcomePatient(`${firstName} ${lastName}`, email).catch(console.error);
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

  return (
    <div className="min-h-screen bg-background flex">
      <SEOHead title="Login e Cadastro" description="Acesse sua conta ou cadastre-se na AloClinica para consultas médicas online por vídeo." />
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-hero items-center justify-center p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }}
        />
        <div className="text-primary-foreground max-w-md relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-10 opacity-70 hover:opacity-100 transition text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>
          <img src={logo} alt="AloClinica" className="w-14 h-14 rounded-2xl mb-6 opacity-90" />
          <h1 className="text-4xl font-extrabold mb-4 leading-tight">
            Saúde na<br />palma da mão
          </h1>
          <p className="text-base opacity-80 leading-relaxed">
            Consultas por vídeo com médicos qualificados, receitas digitais e atendimento 24h — tudo em um só lugar.
          </p>
          <div className="mt-10 flex flex-col gap-3">
            {["✓ Médicos certificados pelo CFM", "✓ Receitas e atestados digitais válidos", "✓ Dados protegidos por criptografia"].map(item => (
              <p key={item} className="text-sm opacity-80 font-medium">{item}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition text-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Conta criada! 🎉</h2>
                <p className="text-muted-foreground">Redirecionando para o painel...</p>
              </motion.div>
            ) : mode === "login" ? (
              <motion.div key="login" {...pageVariants} transition={{ duration: 0.3 }}>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-1">Bem-vindo de volta</h2>
                  <p className="text-muted-foreground text-sm">Entre na sua conta para continuar</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4" noValidate>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setEmailError(""); }}
                        onBlur={() => setEmailError(validateEmail(email))}
                        className={`pl-10 ${emailError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      {emailError && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-destructive" />
                          <p className="text-xs text-destructive">{emailError}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                      <Link to="/forgot-password" className="text-xs text-primary hover:underline">Esqueci minha senha</Link>
                    </div>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setPasswordError(""); }}
                        className={`pl-10 pr-10 ${passwordError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {passwordError && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-destructive" />
                          <p className="text-xs text-destructive">{passwordError}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground" size="lg" disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando...</> : "Entrar"}
                  </Button>

                  {/* Social login divider */}
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60" /></div>
                    <div className="relative flex justify-center text-[11px]"><span className="bg-background px-3 text-muted-foreground">ou continue com</span></div>
                  </div>
                  <Button type="button" variant="outline" className="w-full gap-2 text-sm h-11 rounded-xl" onClick={async () => {
                    const isCustomDomain = !window.location.hostname.includes("lovable.app") && !window.location.hostname.includes("lovableproject.com");
                    if (isCustomDomain) {
                      const { data, error } = await supabase.auth.signInWithOAuth({
                        provider: "google",
                        options: { redirectTo: window.location.origin + "/dashboard", skipBrowserRedirect: true },
                      });
                      if (!error && data?.url) {
                        const oauthUrl = new URL(data.url);
                        if (["accounts.google.com", "oaixgmuocuwhsabidpei.supabase.co"].some(h => oauthUrl.hostname === h)) {
                          window.location.href = data.url;
                        }
                      }
                    } else {
                      await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/dashboard" } });
                    }
                  }}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continuar com Google
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Não tem conta?{" "}
                  <button onClick={() => setMode("select-type")} className="text-primary font-semibold hover:underline">
                    Cadastre-se grátis
                  </button>
                </p>
              </motion.div>
            ) : mode === "select-type" ? (
              <motion.div key="select" {...pageVariants} transition={{ duration: 0.3 }}>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-1">Criar conta</h2>
                  <p className="text-muted-foreground text-sm">Selecione o tipo de cadastro</p>
                </div>

                <div className="space-y-3">
                  {userTypes.map((ut, i) => (
                    <motion.button
                      key={ut.type}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      onClick={() => { setUserType(ut.type); setMode("register"); }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-muted/40 transition-all text-left group"
                    >
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${ut.color}`}>
                        <ut.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{ut.label}</p>
                        <p className="text-sm text-muted-foreground">{ut.desc}</p>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-muted-foreground/40 rotate-180 ml-auto group-hover:text-primary transition-colors" />
                    </motion.button>
                  ))}
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Já tem conta?{" "}
                  <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Entrar</button>
                </p>
              </motion.div>
            ) : (
              <motion.div key="register" {...pageVariants} transition={{ duration: 0.3 }}>
                <button onClick={() => setMode("select-type")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Voltar
                </button>

                <div className="mb-6">
                  <div className={`w-10 h-10 rounded-xl border mb-3 flex items-center justify-center ${userTypes.find(u => u.type === userType)?.color}`}>
                    {(() => { const ut = userTypes.find(u => u.type === userType); return ut ? <ut.icon className="w-5 h-5" /> : null; })()}
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    Cadastro de {userTypes.find(u => u.type === userType)?.label}
                  </h2>
                  <p className="text-muted-foreground text-sm">Preencha seus dados para criar a conta</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4" noValidate>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium">Nome</Label>
                      <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" required className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Sobrenome</Label>
                      <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" required className="mt-1.5" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setEmailError(""); }}
                        onBlur={() => setEmailError(validateEmail(email))}
                        placeholder="seu@email.com"
                        className={`pl-10 ${emailError ? "border-destructive" : ""}`}
                      />
                      {emailError && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-destructive" />
                          <p className="text-xs text-destructive">{emailError}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Senha</Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setPasswordError(""); }}
                        placeholder="Mínimo 6 caracteres"
                        className={`pl-10 pr-10 ${passwordError ? "border-destructive" : ""}`}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Password strength bar */}
                    {password.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor[strength] : "bg-muted"}`} />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Força da senha: <span className="font-medium text-foreground">{strengthLabel[strength]}</span></p>
                      </div>
                    )}
                    {passwordError && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 text-destructive" />
                        <p className="text-xs text-destructive">{passwordError}</p>
                      </div>
                    )}
                  </div>

                  {userType === "doctor" && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <Label className="text-sm font-medium">CRM</Label>
                        <Input value={crm} onChange={e => setCrm(e.target.value)} placeholder="123456" required className="mt-1.5" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">UF</Label>
                        <Input value={crmState} onChange={e => setCrmState(e.target.value.toUpperCase())} placeholder="SP" required className="mt-1.5" maxLength={2} />
                      </div>
                    </div>
                  )}

                  {userType === "clinic" && (
                    <>
                      <div>
                        <Label className="text-sm font-medium">Nome da Clínica</Label>
                        <Input value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="Clínica Saúde" required className="mt-1.5" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">CNPJ <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                        <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="mt-1.5" />
                      </div>
                    </>
                  )}

                  <TermsConsentCheckbox checked={termsAccepted} onCheckedChange={setTermsAccepted} className="mt-2" />

                  <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground" size="lg" disabled={loading || !termsAccepted}>
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando conta...</> : "Criar conta grátis"}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Já tem conta?{" "}
                  <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Entrar</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Auth;
