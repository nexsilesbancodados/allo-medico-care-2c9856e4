import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, Stethoscope, KeyRound, Check, MessageCircle, LogIn, Eye, EyeOff, Shield, Star, Sparkles } from "lucide-react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import doctorPortalBg from "@/assets/doctor-portal-bg.png";
import DoctorWhySection from "@/components/landing/DoctorWhySection";
import SEOHead from "@/components/SEOHead";
import PasswordStrength from "@/components/ui/password-strength";

type Step = "welcome" | "code" | "register" | "login";

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

      // Register consent
      await registerConsent(data.user.id, "terms_and_privacy_doctor");

      // Send welcome email for doctor
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
        {/* Desktop left panel */}
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden">
          <img src={doctorPortalBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/80 to-primary/80" />
          <div className="relative text-primary-foreground max-w-md">
            <Link to="/" className="inline-flex items-center gap-2 mb-8 opacity-80 hover:opacity-100 transition">
              <ArrowLeft className="w-4 h-4" /> Voltar ao início
            </Link>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
              <Stethoscope className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-extrabold mb-4">Portal do Médico</h1>
            <p className="text-lg opacity-90">
              Atenda seus pacientes por videochamada, emita receitas digitais e gerencie sua agenda online.
            </p>
            <div className="mt-8 space-y-3 opacity-80 text-sm">
              <p>✓ Agenda online flexível</p>
              <p>✓ Videochamadas com qualidade</p>
              <p>✓ Receitas e prontuários digitais</p>
              <p>✓ Gestão completa de pacientes</p>
            </div>
          </div>
        </div>

        {/* Right / mobile panel */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile hero gradient header */}
          <div className="lg:hidden bg-gradient-to-br from-secondary to-primary px-6 pt-[max(env(safe-area-inset-top,12px),12px)] pb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition text-sm mb-4">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary-foreground">Portal do Médico</h1>
                <p className="text-xs text-primary-foreground/70">Acesse sua conta ou cadastre-se</p>
              </div>
            </div>
          </div>

          {/* Form area */}
          <div className="flex-1 flex flex-col justify-center px-6 py-6 lg:items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
              {/* Desktop-only back link */}
              <Link to="/" className="hidden lg:inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Link>

              {/* Desktop header */}
              <div className="hidden lg:flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {step === "welcome" ? "Portal do Médico" : step === "code" ? "Código de Acesso" : step === "login" ? "Entrar" : "Cadastro Médico"}
                  </h2>
                  <p className="text-sm text-muted-foreground">Portal do Médico</p>
                </div>
              </div>

              {/* Mobile step title */}
              <h2 className="lg:hidden text-lg font-bold text-foreground mb-4">
                {step === "welcome" ? "Bem-vindo" : step === "code" ? "Código de Acesso" : step === "login" ? "Entrar" : "Cadastro Médico"}
              </h2>

              {/* Welcome step */}
              {step === "welcome" && (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-sm mb-2">
                    Escolha uma opção abaixo para continuar:
                  </p>
                  <Button
                    className="w-full bg-gradient-to-r from-secondary to-primary text-primary-foreground h-12"
                    size="lg"
                    onClick={() => setStep("login")}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar na minha conta
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12"
                    size="lg"
                    onClick={() => setStep("code")}
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    Tenho um código de convite
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-12"
                    size="lg"
                    onClick={() => window.open("https://wa.me/5511999999999?text=Olá! Sou médico e gostaria de me cadastrar na plataforma AloClinica.", "_blank")}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contactar suporte para cadastro
                  </Button>
                </div>
              )}

              {/* Step 1: Validate invite code */}
              {step === "code" && (
                <form onSubmit={handleValidateCode} className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border mb-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <KeyRound className="w-4 h-4" />
                      <span className="font-medium">Cadastro por convite</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Para se cadastrar como médico, você precisa de um código de autenticação fornecido pelo administrador da plataforma.
                    </p>
                  </div>
                  <div>
                    <Label>Código de Convite</Label>
                    <Input
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="Ex: MED-XXXX-XXXX"
                      required
                      className="mt-1 font-mono text-center text-lg tracking-widest"
                      maxLength={20}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-secondary to-primary text-primary-foreground h-12" size="lg" disabled={validating}>
                    {validating ? "Validando..." : "Validar Código"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    <button type="button" onClick={() => setStep("welcome")} className="text-primary font-semibold hover:underline">← Voltar</button>
                  </p>
                </form>
              )}

              {/* Step 2: Register (only after valid code) */}
              {step === "register" && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/10 text-secondary text-sm mb-2">
                    <Check className="w-4 h-4" />
                    <span>Código validado com sucesso</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Nome</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" required className="mt-1" /></div>
                    <div><Label>Sobrenome</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" required className="mt-1" /></div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10" required />
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
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {password && <PasswordStrength password={password} />}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2"><Label>CRM</Label><Input value={crm} onChange={e => setCrm(e.target.value)} placeholder="123456" required className="mt-1" /></div>
                    <div><Label>UF</Label><Input value={crmState} onChange={e => setCrmState(e.target.value.toUpperCase())} placeholder="SP" required className="mt-1" maxLength={2} /></div>
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
                  <Button type="submit" className="w-full bg-gradient-to-r from-secondary to-primary text-primary-foreground cta-shimmer h-12" size="lg" disabled={loading || !termsAccepted}>
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
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10" required />
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
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-secondary to-primary text-primary-foreground cta-shimmer h-12" size="lg" disabled={loading}>
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
          </div>

          {/* Social proof - fixed at bottom on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="px-6 py-4 pb-[max(env(safe-area-inset-bottom,8px),8px)] border-t border-border bg-muted/30 flex items-center justify-center gap-5 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-secondary shrink-0" /> CFM Verificado</span>
            <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-warning shrink-0" /> 4.9/5</span>
            <span className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-primary shrink-0" /> 500+ médicos</span>
          </motion.div>
        </div>
      </div>

      {/* Why section */}
      <DoctorWhySection />
    </div>
  );
};

export default AuthMedico;
