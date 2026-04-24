import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, Eye, Glasses, ClipboardCheck, ArrowRight, LogIn, Brain,
  Sparkles, ShieldCheck, type LucideIcon,
} from "lucide-react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import PasswordStrength from "@/components/ui/password-strength";
import pingoOftalmo from "@/assets/pingo-oftalmo.png";
import AuthShell from "@/components/auth/AuthShell";
import { AuthField, AuthPasswordField, AuthSubmitButton, AuthHeading } from "@/components/auth/AuthFields";
import { translateAuthError } from "@/lib/authErrors";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Step = "welcome" | "register" | "login";

const benefits: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Eye, title: "Laudos oftalmológicos", desc: "Fundoscopia, campimetria e tonometria digital." },
  { icon: Glasses, title: "Receita de óculos", desc: "Prescrição digital válida com QR Code." },
  { icon: Brain, title: "IA de triagem", desc: "Apoio à análise de retinografias." },
  { icon: ClipboardCheck, title: "Histórico integrado", desc: "Prontuário oftalmológico completo." },
];

const OPH_SPECIALTIES = [
  "Oftalmologia Geral", "Catarata", "Retina", "Glaucoma", "Córnea",
  "Oftalmopediatria", "Plástica Ocular", "Refração", "Estrabismo",
];

const fadeForm = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
};

const AuthOftalmologista = () => {
  const [searchParams] = useSearchParams();
  const initial: Step = useMemo(
    () => (searchParams.get("acesso") === "entrar" ? "login" : "welcome"),
    [searchParams]
  );
  const [step, setStep] = useState<Step>(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [crm, setCrm] = useState("");
  const [crmState, setCrmState] = useState("SP");
  const [specialty, setSpecialty] = useState(OPH_SPECIALTIES[0]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await db.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Erro ao entrar", { description: translateAuthError(error.message) });
    } else {
      navigate("/dashboard?role=ophthalmologist");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error("Aceite os termos", { description: "Você precisa aceitar os Termos de Uso." });
      return;
    }
    setLoading(true);
    const { data, error } = await db.auth.signUp({
      email, password,
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
      await db.functions.invoke("assign-role", {
        body: {
          user_id: data.user.id,
          role: "ophthalmologist",
          profile_data: { crm, crm_state: crmState, specialty },
        },
      });
      await registerConsent(data.user.id, "terms_and_privacy_doctor");
    }
    setLoading(false);
    toast.success("Cadastro realizado!", { description: "Seu CRM passará por verificação." });
    navigate("/dashboard?role=ophthalmologist");
  };

  const headings: Record<Step, { title: string; subtitle: string }> = {
    welcome: { title: "Olá, doutor(a)", subtitle: "Como deseja começar?" },
    register: { title: "Cadastro profissional", subtitle: "Preencha seus dados CRM" },
    login: { title: "Acessar consultório", subtitle: "Entre com suas credenciais" },
  };

  return (
    <AuthShell
      seoTitle="Portal do Oftalmologista — AloClínica"
      seoDescription="Atenda pacientes oftalmológicos online com tecnologia de ponta."
      icon={Eye}
      eyebrow="Oftalmologia"
      headline="Tecnologia a serviço da visão"
      highlightWord="visão"
      description="Realize consultas, laudos e prescreva óculos com toda segurança digital. Ferramentas especializadas para oftalmologistas."
      mascotSrc={pingoOftalmo}
      theme={{
        panelGradient: "from-[hsl(190,85%,32%)] via-[hsl(220,75%,38%)] to-[hsl(275,65%,42%)]",
        benefits,
      }}
      footerItems={[
        { icon: ShieldCheck, label: "CRM verificado" },
        { icon: Eye, label: "Especializado" },
      ]}
    >
      <AuthHeading title={headings[step].title} subtitle={headings[step].subtitle} />

      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div key="welcome" {...fadeForm} className="space-y-3">
            <button
              onClick={() => setStep("register")}
              className="w-full p-5 rounded-2xl border border-border bg-card hover:border-[hsl(190,85%,45%)] hover:shadow-lg text-left transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(190,85%,45%)] to-[hsl(275,65%,55%)] flex items-center justify-center shadow-md">
                  <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">Cadastre-se agora</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Novo oftalmologista na plataforma</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </button>
            <button
              onClick={() => setStep("login")}
              className="w-full p-5 rounded-2xl border border-border bg-card hover:border-[hsl(275,65%,55%)] hover:shadow-lg text-left transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[hsl(275,65%,95%)] dark:bg-[hsl(275,30%,20%)] flex items-center justify-center">
                  <LogIn className="w-6 h-6 text-[hsl(275,65%,40%)] dark:text-[hsl(275,80%,75%)]" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">Já sou cadastrado</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Acessar consultório digital</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </button>
          </motion.div>
        )}

        {step === "register" && (
          <motion.form key="register" onSubmit={handleRegister} {...fadeForm} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fname" className="text-[13.5px] font-semibold text-foreground">Nome</Label>
                <Input
                  id="fname"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-[52px] rounded-2xl mt-1.5 bg-card border-border/60"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <Label htmlFor="lname" className="text-[13.5px] font-semibold text-foreground">Sobrenome</Label>
                <Input
                  id="lname"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-[52px] rounded-2xl mt-1.5 bg-card border-border/60"
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <div>
                <Label htmlFor="crm" className="text-[13.5px] font-semibold text-foreground">CRM</Label>
                <Input
                  id="crm"
                  required
                  value={crm}
                  onChange={(e) => setCrm(e.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                  className="h-[52px] rounded-2xl mt-1.5 bg-card border-border/60"
                />
              </div>
              <div>
                <Label htmlFor="uf" className="text-[13.5px] font-semibold text-foreground">UF</Label>
                <Input
                  id="uf"
                  value={crmState}
                  onChange={(e) => setCrmState(e.target.value.toUpperCase().slice(0, 2))}
                  className="h-[52px] rounded-2xl mt-1.5 text-center font-bold tracking-wider bg-card border-border/60"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="spec" className="text-[13.5px] font-semibold text-foreground">Especialidade</Label>
              <select
                id="spec"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full h-[52px] rounded-2xl mt-1.5 border border-border/60 bg-card px-3.5 text-[15px] focus:outline-none focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.18)] focus-visible:border-primary/45"
              >
                {OPH_SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <AuthField
              label="Email"
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              autoComplete="email"
              required
            />
            <AuthPasswordField
              label="Senha"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              minLength={6}
              required
              strength={password ? <PasswordStrength password={password} /> : null}
            />
            <TermsConsentCheckbox checked={termsAccepted} onCheckedChange={setTermsAccepted} />
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 h-[52px] rounded-2xl"
                onClick={() => setStep("welcome")}
              >
                Voltar
              </Button>
              <AuthSubmitButton
                loading={loading}
                loadingLabel="Criando..."
                disabled={!termsAccepted}
                icon={<ArrowRight className="w-4 h-4" />}
                variantClassName="bg-gradient-to-r from-[hsl(190,85%,40%)] to-[hsl(275,65%,50%)] text-white shadow-lg hover:brightness-110"
                className="flex-1"
              >
                Criar conta
              </AuthSubmitButton>
            </div>
            <p className="text-[12.5px] text-center text-muted-foreground">
              Já possui conta?{" "}
              <button
                type="button"
                onClick={() => setStep("login")}
                className="font-bold text-[hsl(220,75%,45%)] dark:text-[hsl(220,80%,70%)] hover:underline"
              >
                Entrar
              </button>
            </p>
          </motion.form>
        )}

        {step === "login" && (
          <motion.form key="login" onSubmit={handleLogin} {...fadeForm} className="space-y-5" noValidate>
            <AuthField
              label="Email"
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              autoComplete="email"
              required
            />
            <AuthPasswordField
              label="Senha"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              showForgot
              required
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 h-[52px] rounded-2xl"
                onClick={() => setStep("welcome")}
              >
                Voltar
              </Button>
              <AuthSubmitButton
                loading={loading}
                loadingLabel="Entrando..."
                icon={<LogIn className="w-4 h-4" />}
                variantClassName="bg-gradient-to-r from-[hsl(190,85%,40%)] to-[hsl(275,65%,50%)] text-white shadow-lg hover:brightness-110"
                className="flex-1"
              >
                Entrar
              </AuthSubmitButton>
            </div>
            <p className="text-[12.5px] text-center text-muted-foreground">
              Sem cadastro?{" "}
              <button
                type="button"
                onClick={() => setStep("register")}
                className="font-bold text-[hsl(220,75%,45%)] dark:text-[hsl(220,80%,70%)] hover:underline"
              >
                Cadastrar
              </button>
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
};

export default AuthOftalmologista;
