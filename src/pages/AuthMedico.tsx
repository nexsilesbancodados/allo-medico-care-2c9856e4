import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowLeft, Stethoscope, KeyRound, Check, MessageCircle, LogIn, Eye, EyeOff, Shield, Star, Sparkles, Award, Video, FileText, Users, ChevronRight } from "lucide-react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import SEOHead from "@/components/SEOHead";
import PasswordStrength from "@/components/ui/password-strength";

type Step = "welcome" | "code" | "register" | "login";

const benefits = [
  { icon: Video, label: "Videochamadas HD", desc: "Atenda de qualquer lugar" },
  { icon: FileText, label: "Receitas Digitais", desc: "Assinatura com validade legal" },
  { icon: Users, label: "Gestão de Pacientes", desc: "Prontuários organizados" },
  { icon: Award, label: "Selo CFM Verificado", desc: "Credibilidade garantida" },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

const AuthMedico = () => {
  const [step, setStep] = useState<Step>("welcome");
  const [inviteCode, setInviteCode] = useState("");
  const [validatedCodeId, setValidatedCodeId] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [crm, setCrm] = useState("");
  const [crmState, setCrmState] = useState("SP");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidating(true);
    try {
      const res = await supabase.functions.invoke("validate-invite-code", {
        body: { code: inviteCode.trim().toUpperCase() },
      });
      const data = res.data;
      if (data?.valid) {
        setValidatedCodeId(data.code_id);
        setStep("register");
        toast({ title: "Código válido!", description: "Preencha seus dados para criar sua conta." });
      } else {
        toast({ title: "Código inválido", description: data?.error || "Verifique o código e tente novamente.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro", description: "Não foi possível validar o código.", variant: "destructive" });
    }
    setValidating(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard?role=doctor");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast({ title: "Aceite os termos", description: "Você precisa aceitar os Termos de Uso e Política de Privacidade.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin, data: { first_name: firstName, last_name: lastName } },
    });
    if (error) {
      setLoading(false);
      toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
      return;
    }
    if (data.user) {
      await supabase.functions.invoke("assign-role", {
        body: {
          user_id: data.user.id,
          role: "doctor",
          profile_data: { crm, crm_state: crmState, invite_code_id: validatedCodeId },
        },
      });
      await registerConsent(data.user.id, "terms_and_privacy_doctor");
      supabase.functions.invoke("send-email", {
        body: { type: "welcome_doctor", to: email, data: { name: `${firstName} ${lastName}`, crm: `${crm}/${crmState}` } },
      }).catch(console.error);
    }
    setLoading(false);
    toast({ title: "Cadastro realizado!", description: "Aguarde a aprovação do seu CRM." });
    navigate("/dashboard?role=doctor");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Portal do Médico" description="Cadastre-se como médico na AloClinica. Atenda pacientes por vídeo e emita receitas digitais." />
      <div className="flex min-h-screen">
        {/* Desktop left panel — immersive gradient with floating cards */}
        <div className="hidden lg:flex lg:w-[48%] relative items-center justify-center overflow-hidden">
          {/* Layered gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary via-primary/90 to-primary" />
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
          {/* Floating glow orbs */}
          <motion.div
            className="absolute w-72 h-72 rounded-full bg-white/10 blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            style={{ top: '10%', right: '5%' }}
          />
          <motion.div
            className="absolute w-56 h-56 rounded-full bg-secondary/20 blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            style={{ bottom: '15%', left: '10%' }}
          />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="relative z-10 text-primary-foreground max-w-md px-12"
          >
            <motion.div variants={fadeUp}>
              <Link to="/" className="inline-flex items-center gap-2 mb-10 text-sm opacity-70 hover:opacity-100 transition-opacity">
                <ArrowLeft className="w-4 h-4" /> Voltar ao início
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-6 ring-1 ring-white/20">
              <Stethoscope className="w-7 h-7" />
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl font-extrabold tracking-tight mb-3 leading-tight">
              Portal do<br />Médico
            </motion.h1>
            <motion.p variants={fadeUp} className="text-base opacity-80 leading-relaxed mb-10">
              Atenda seus pacientes por videochamada, emita receitas digitais e gerencie sua agenda online.
            </motion.p>

            {/* Benefit cards */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
              {benefits.map(({ icon: Icon, label, desc }) => (
                <motion.div
                  key={label}
                  variants={fadeUp}
                  whileHover={{ scale: 1.04, y: -2 }}
                  className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors cursor-default"
                >
                  <Icon className="w-5 h-5 mb-2 opacity-90" />
                  <p className="text-sm font-semibold leading-tight">{label}</p>
                  <p className="text-xs opacity-60 mt-0.5">{desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Counter */}
            <motion.div variants={fadeUp} className="mt-10 flex items-center gap-4 text-xs opacity-70">
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> CFM Verificado</span>
              <span className="w-px h-3 bg-white/30" />
              <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> 4.9/5</span>
              <span className="w-px h-3 bg-white/30" />
              <span>500+ médicos</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Right / mobile panel */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile hero gradient header */}
          <div className="lg:hidden bg-gradient-to-br from-secondary to-primary px-6 pt-[max(env(safe-area-inset-top,12px),12px)] pb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition text-sm mb-4">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                <Stethoscope className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary-foreground">Portal do Médico</h1>
                <p className="text-xs text-primary-foreground/70">Acesse sua conta ou cadastre-se</p>
              </div>
            </div>
          </div>

          {/* Form area */}
          <div className="flex-1 flex flex-col justify-center px-6 py-8 lg:items-center lg:px-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md"
              >
                {/* Desktop-only back link */}
                <Link to="/" className="hidden lg:inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition text-sm">
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </Link>

                {/* Desktop header */}
                <div className="hidden lg:flex items-center gap-3 mb-8">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Stethoscope className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">
                      {step === "welcome" ? "Portal do Médico" : step === "code" ? "Código de Acesso" : step === "login" ? "Bem-vindo de volta" : "Cadastro Médico"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {step === "welcome" ? "Escolha uma opção para continuar" : step === "code" ? "Valide seu convite" : step === "login" ? "Acesse sua conta" : "Crie sua conta profissional"}
                    </p>
                  </div>
                </div>

                {/* Mobile step title */}
                <h2 className="lg:hidden text-lg font-bold text-foreground mb-1">
                  {step === "welcome" ? "Bem-vindo" : step === "code" ? "Código de Acesso" : step === "login" ? "Entrar" : "Cadastro Médico"}
                </h2>
                <p className="lg:hidden text-sm text-muted-foreground mb-5">
                  {step === "welcome" ? "Escolha uma opção abaixo:" : step === "code" ? "Valide seu convite" : step === "login" ? "Acesse sua conta" : "Crie sua conta profissional"}
                </p>

                {/* Welcome step */}
                {step === "welcome" && (
                  <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
                    {[
                      { icon: LogIn, label: "Entrar na minha conta", desc: "Acesse seu painel de atendimento", action: () => setStep("login"), variant: "primary" as const },
                      { icon: KeyRound, label: "Tenho um código de convite", desc: "Primeiro acesso com código do admin", action: () => setStep("code"), variant: "outline" as const },
                      { icon: MessageCircle, label: "Solicitar cadastro via WhatsApp", desc: "Fale com nossa equipe", action: () => window.open("https://wa.me/5511999999999?text=Olá! Sou médico e gostaria de me cadastrar na plataforma AloClinica.", "_blank"), variant: "ghost" as const },
                    ].map(({ icon: Icon, label, desc, action, variant }) => (
                      <motion.div key={label} variants={fadeUp}>
                        <Button
                          className={`w-full h-auto py-4 px-5 justify-start text-left ${
                            variant === "primary" ? "bg-gradient-to-r from-secondary to-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30" : ""
                          }`}
                          variant={variant === "primary" ? "default" : variant}
                          size="lg"
                          onClick={action}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              variant === "primary" ? "bg-white/20" : "bg-muted"
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{label}</p>
                              <p className={`text-xs mt-0.5 ${variant === "primary" ? "opacity-70" : "text-muted-foreground"}`}>{desc}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
                          </div>
                        </Button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Step 1: Validate invite code */}
                {step === "code" && (
                  <form onSubmit={handleValidateCode} className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <KeyRound className="w-4 h-4 text-primary" />
                        <span className="font-medium">Cadastro por convite</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Para se cadastrar como médico, você precisa de um código fornecido pelo administrador.
                      </p>
                    </div>
                    <div>
                      <Label>Código de Convite</Label>
                      <Input
                        value={inviteCode}
                        onChange={e => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="Ex: MED-XXXX-XXXX"
                        required
                        className="mt-1 font-mono text-center text-lg tracking-widest h-12"
                        maxLength={20}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-secondary to-primary text-primary-foreground h-12 shadow-lg shadow-primary/20" size="lg" disabled={validating}>
                      {validating ? (
                        <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 animate-spin" /> Validando...
                        </motion.span>
                      ) : "Validar Código"}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      <button type="button" onClick={() => setStep("welcome")} className="text-primary font-semibold hover:underline">← Voltar</button>
                    </p>
                  </form>
                )}

                {/* Step 2: Register */}
                {step === "register" && (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-secondary/10 text-secondary text-sm border border-secondary/20"
                    >
                      <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">Código validado com sucesso</span>
                    </motion.div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Nome</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" required className="mt-1 h-11" /></div>
                      <div><Label>Sobrenome</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" required className="mt-1 h-11" /></div>
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
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2"><Label>CRM</Label><Input value={crm} onChange={e => setCrm(e.target.value)} placeholder="123456" required className="mt-1 h-11" /></div>
                      <div><Label>UF</Label><Input value={crmState} onChange={e => setCrmState(e.target.value.toUpperCase())} placeholder="SP" required className="mt-1 h-11" maxLength={2} /></div>
                    </div>
                    {crm && crmState.length === 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-primary border-primary/30 hover:bg-primary/10"
                        onClick={() => window.open(`https://portal.cfm.org.br/busca-medicos/?crm=${encodeURIComponent(crm)}&uf=${encodeURIComponent(crmState)}`, "_blank")}
                      >
                        🔍 Validar CRM no Portal CFM
                      </Button>
                    )}
                    <TermsConsentCheckbox checked={termsAccepted} onCheckedChange={setTermsAccepted} />
                    <Button type="submit" className="w-full bg-gradient-to-r from-secondary to-primary text-primary-foreground cta-shimmer h-12 shadow-lg shadow-primary/20" size="lg" disabled={loading || !termsAccepted}>
                      {loading ? (
                        <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 animate-spin" /> Criando conta...
                        </motion.span>
                      ) : "Cadastrar como Médico"}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      Já tem conta? <button type="button" onClick={() => setStep("login")} className="text-primary font-semibold hover:underline">Entrar</button>
                    </p>
                  </form>
                )}

                {/* Login */}
                {step === "login" && (
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
                    <Button type="submit" className="w-full bg-gradient-to-r from-secondary to-primary text-primary-foreground cta-shimmer h-12 shadow-lg shadow-primary/20" size="lg" disabled={loading}>
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
                      <button type="button" onClick={() => setStep("welcome")} className="text-primary font-semibold hover:underline">← Voltar</button>
                    </p>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Social proof bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="px-6 py-4 pb-[max(env(safe-area-inset-bottom,8px),8px)] border-t border-border bg-muted/30 flex items-center justify-center gap-5 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-secondary shrink-0" /> CFM Verificado</span>
            <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-warning shrink-0" /> 4.9/5</span>
            <span className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-primary shrink-0" /> 500+ médicos</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthMedico;
