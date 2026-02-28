import { useState, useRef, useMemo, lazy, Suspense } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, KeyRound, Check, MessageCircle, LogIn, Eye, EyeOff,
  Shield, Star, Sparkles, ClipboardList, FileSignature, Brain, Fingerprint,
  ChevronRight, Stethoscope, ArrowRight, Zap, HelpCircle, CheckCircle2, Video
} from "lucide-react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import SEOHead from "@/components/SEOHead";
import PasswordStrength from "@/components/ui/password-strength";
import Header from "@/components/landing/Header";
import telelaudoImg from "@/assets/telelaudo-section.png";
import mascotThumbsup from "@/assets/mascot-thumbsup.png";

const Footer = lazy(() => import("@/components/landing/Footer"));

type Step = "welcome" | "code" | "register" | "login" | "quiz" | "apply" | "applied";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUpForm = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const benefits = [
  { icon: ClipboardList, title: "Fila Inteligente", desc: "Exames priorizados por urgência e SLA com distribuição automática." },
  { icon: FileSignature, title: "Assinatura Digital", desc: "Laudos com hash SHA-256 e verificação por QR Code." },
  { icon: Brain, title: "IA de Triagem", desc: "Classificação e sugestão automática de achados por inteligência artificial." },
  { icon: Fingerprint, title: "Verificação QR", desc: "Autenticidade garantida para cada laudo emitido." },
  { icon: Video, title: "Visualizador DICOM", desc: "Abra e analise exames de imagem direto no navegador." },
  { icon: Zap, title: "SLA < 2 horas", desc: "Laudos entregues rapidamente com alertas de prazo." },
];

const howItWorks = [
  { step: "01", title: "Solicite seu cadastro", desc: "Preencha o formulário com seus dados e CRM.", icon: <ClipboardList className="w-6 h-6 text-white" />, gradient: "from-[hsl(200,80%,35%)] to-[hsl(210,85%,45%)]" },
  { step: "02", title: "Aprovação por email", desc: "Receba seu código de acesso após análise.", icon: <Mail className="w-6 h-6 text-white" />, gradient: "from-warning to-warning/70" },
  { step: "03", title: "Comece a laudar", desc: "Acesse a fila e emita laudos com assinatura digital.", icon: <FileSignature className="w-6 h-6 text-white" />, gradient: "from-secondary to-secondary/70" },
];

const faqs = [
  { question: "Como funciona o cadastro?", answer: "Preencha o formulário de solicitação. Nossa equipe verifica seus dados e CRM. Se aprovado, você recebe um código de acesso por email." },
  { question: "Preciso de CRM para laudar?", answer: "Sim, é necessário CRM ativo e verificado para emitir laudos na plataforma." },
  { question: "Quanto tempo leva a aprovação?", answer: "Normalmente em até 48 horas úteis." },
  { question: "Posso laudar de qualquer lugar?", answer: "Sim! A plataforma é 100% online, basta ter internet." },
];

const AuthLaudista = () => {
  const [searchParams] = useSearchParams();
  const hasLoginAccess = useMemo(() => searchParams.get("acesso") === "entrar", [searchParams]);
  const [step, setStep] = useState<Step>(hasLoginAccess ? "welcome" : "quiz");
  const [inviteCode, setInviteCode] = useState("");
  const [validatedCodeId, setValidatedCodeId] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [crm, setCrm] = useState("");
  const [crmState, setCrmState] = useState("SP");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [experienceYears, setExperienceYears] = useState("");
  const [examTypes, setExamTypes] = useState("");
  const [howFound, setHowFound] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingApplication(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const enrichedBio = [
        bio && `Sobre: ${bio}`,
        experienceYears && `Experiência: ${experienceYears} anos`,
        examTypes && `Tipos de exame: ${examTypes}`,
        howFound && `Como conheceu: ${howFound}`,
      ].filter(Boolean).join("\n");
      const { error } = await supabase.from("doctor_applications" as any).insert({
        full_name: fullName,
        email,
        phone: phone || null,
        crm,
        crm_state: crmState,
        specialty: specialty || "Laudista",
        bio: enrichedBio || null,
      } as any);
      if (error) throw error;
      setStep("applied");
      toast({ title: "Solicitação enviada!", description: "Analisaremos seus dados e retornaremos por email." });
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err?.message || "Tente novamente.", variant: "destructive" });
    }
    setSubmittingApplication(false);
  };

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
      navigate("/dashboard/laudista?role=doctor");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast({ title: "Aceite os termos", description: "Você precisa aceitar os Termos de Uso.", variant: "destructive" });
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
        body: { user_id: data.user.id, role: "doctor", profile_data: { crm, crm_state: crmState, invite_code_id: validatedCodeId } },
      });
      await registerConsent(data.user.id, "terms_and_privacy_doctor");
    }
    setLoading(false);
    toast({ title: "Cadastro realizado!", description: "Aguarde a aprovação do seu CRM." });
    navigate("/dashboard/laudista?role=doctor");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Portal do Médico Laudista — AloClinica" description="Emita laudos médicos à distância com assinatura digital, fila inteligente e suporte de IA." />
      <Header />

      {/* ==================== HERO ==================== */}
      <section className="relative pt-24 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(200,80%,95%)] via-background to-[hsl(210,85%,92%)] dark:from-[hsl(200,30%,12%)] dark:via-background dark:to-[hsl(210,30%,15%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(210,85%,45%)]/10 text-[hsl(210,85%,45%)] text-xs font-semibold mb-4">
                  <ClipboardList className="w-3.5 h-3.5" /> Portal Laudista
                </span>
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-[1.1] mb-3">
                Laude de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(200,80%,35%)] to-[hsl(220,90%,50%)]">qualquer lugar</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-lg">
                Laudos à distância com assinatura digital SHA-256, fila inteligente e suporte de IA.
              </motion.p>
              <motion.div variants={fadeUp}>
                <Button size="default" className="bg-gradient-to-r from-[hsl(200,80%,35%)] to-[hsl(220,90%,50%)] text-white rounded-full px-8 shadow-lg hover:shadow-xl hover:scale-105 transition-all" onClick={scrollToForm}>
                  Solicitar Cadastro <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className="hidden lg:block">
              <img src={telelaudoImg} alt="Telelaudo" className="w-full max-w-md mx-auto rounded-2xl shadow-2xl" loading="lazy" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== BENEFITS ==================== */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Por que laudar na AloClinica?</motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground mt-3 max-w-lg mx-auto">Tecnologia de ponta para laudos rápidos, seguros e verificáveis.</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} variants={fadeUp} whileHover={{ y: -4 }} className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-[hsl(210,85%,45%)]/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[hsl(210,85%,45%)]" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Como funciona?</motion.h2>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {howItWorks.map(({ step: s, title, desc, icon, gradient }) => (
              <motion.div key={s} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}>{icon}</div>
                <span className="text-xs font-bold text-muted-foreground">PASSO {s}</span>
                <h3 className="text-lg font-bold text-foreground mt-1">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-10">
            <motion.h2 variants={fadeUp} className="text-3xl font-black text-foreground tracking-tight flex items-center justify-center gap-2"><HelpCircle className="w-7 h-7 text-[hsl(210,85%,45%)]" /> Perguntas Frequentes</motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-4">
            {faqs.map(({ question, answer }) => (
              <motion.details key={question} variants={fadeUp} className="group p-5 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
                <summary className="font-semibold text-foreground cursor-pointer flex items-center justify-between">
                  {question}
                  <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{answer}</p>
              </motion.details>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== AUTH FORM SECTION ==================== */}
      <section ref={formRef} id="cadastro" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(200,80%,35%)] to-[hsl(220,90%,50%)] flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ClipboardList className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Portal Laudista</h2>
            <p className="text-muted-foreground mt-1">{hasLoginAccess ? "Acesse sua conta ou cadastre-se" : step === "quiz" ? "Conte-nos sobre sua atuação" : "Solicite seu cadastro na plataforma"}</p>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="bg-card border border-border rounded-2xl p-6 shadow-lg">

              {/* Welcome - only with ?acesso=entrar */}
              {step === "welcome" && hasLoginAccess && (
                <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
                  {[
                    { icon: LogIn, label: "Entrar na minha conta", desc: "Acesse seu painel de laudos", action: () => setStep("login"), variant: "primary" as const },
                    { icon: KeyRound, label: "Já tenho código de acesso", desc: "Recebi o código por email", action: () => setStep("code"), variant: "outline" as const },
                    { icon: Stethoscope, label: "Quero me cadastrar", desc: "Solicite acesso preenchendo seus dados", action: () => setStep("quiz"), variant: "outline" as const },
                    { icon: MessageCircle, label: "Dúvidas? Fale pelo WhatsApp", desc: "Fale com nossa equipe", action: () => window.open("https://wa.me/5511999999999?text=Olá! Sou médico laudista e gostaria de me cadastrar na plataforma AloClinica.", "_blank"), variant: "ghost" as const },
                  ].map(({ icon: Icon, label, desc, action, variant }) => (
                    <motion.div key={label} variants={fadeUpForm}>
                      <Button className={`w-full h-auto py-4 px-5 justify-start text-left ${variant === "primary" ? "bg-gradient-to-r from-[hsl(200,80%,35%)] to-[hsl(220,90%,50%)] text-white shadow-lg" : ""}`} variant={variant === "primary" ? "default" : variant} size="lg" onClick={action}>
                        <div className="flex items-center gap-3 w-full">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${variant === "primary" ? "bg-white/20" : "bg-muted"}`}><Icon className="w-5 h-5" /></div>
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

              {/* Code */}
              {step === "code" && (
                <form onSubmit={handleValidateCode} className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><KeyRound className="w-4 h-4 text-[hsl(210,85%,45%)]" /><span className="font-medium">Já recebi meu código</span></div>
                    <p className="text-xs text-muted-foreground">Digite o código de acesso que você recebeu por email após aprovação.</p>
                  </div>
                  <div><Label>Código de Acesso</Label><Input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="Ex: MED-XXXX-XXXX" required className="mt-1 font-mono text-center text-lg tracking-widest h-12" maxLength={20} /></div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-[hsl(200,80%,35%)] to-[hsl(220,90%,50%)] text-white h-12 shadow-lg" size="lg" disabled={validating}>
                    {validating ? <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex items-center gap-2"><Sparkles className="w-4 h-4 animate-spin" /> Validando...</motion.span> : "Validar Código"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground"><button type="button" onClick={() => hasLoginAccess ? setStep("welcome") : navigate("/")} className="text-[hsl(210,85%,45%)] font-semibold hover:underline">← Voltar</button></p>
                </form>
              )}

              {/* Quiz - profiling step */}
              {step === "quiz" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[hsl(210,85%,45%)]/5 border border-[hsl(210,85%,45%)]/20">
                    <div className="flex items-center gap-2 text-sm text-foreground mb-1"><ClipboardList className="w-4 h-4 text-[hsl(210,85%,45%)]" /><span className="font-medium">Sobre sua atuação</span></div>
                    <p className="text-xs text-muted-foreground">Responda essas perguntas rápidas para prosseguir ao cadastro.</p>
                  </div>
                  <div><Label>Qual sua especialidade? *</Label><Input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="Ex: Radiologia, Cardiologia..." required className="mt-1 h-11" /></div>
                  <div><Label>Anos de experiência</Label><Input type="number" min="0" max="60" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} placeholder="Ex: 5" className="mt-1 h-11" /></div>
                  <div>
                    <Label>Tipos de exame que lauda *</Label>
                    <select value={examTypes} onChange={e => setExamTypes(e.target.value)} className="mt-1 w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" required>
                      <option value="">Selecione</option>
                      <option value="Raio-X">Raio-X</option>
                      <option value="Tomografia">Tomografia</option>
                      <option value="Ressonância">Ressonância</option>
                      <option value="Ultrassom">Ultrassom</option>
                      <option value="ECG">ECG</option>
                      <option value="Múltiplos">Múltiplos</option>
                    </select>
                  </div>
                  <div>
                    <Label>Como conheceu a AloClinica?</Label>
                    <select value={howFound} onChange={e => setHowFound(e.target.value)} className="mt-1 w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="">Selecione</option>
                      <option value="Google">Google</option>
                      <option value="Indicação de colega">Indicação de colega</option>
                      <option value="Redes sociais">Redes sociais</option>
                      <option value="Congresso/Evento">Congresso/Evento</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-[hsl(200,80%,35%)] to-[hsl(220,90%,50%)] text-white h-12 shadow-lg" size="lg" disabled={!specialty || !examTypes} onClick={() => setStep("apply")}>
                    Continuar para Cadastro <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <p className="text-center text-sm text-muted-foreground"><button type="button" onClick={() => hasLoginAccess ? setStep("welcome") : navigate("/")} className="text-[hsl(210,85%,45%)] font-semibold hover:underline">← Voltar</button></p>
                </div>
              )}

              {/* Apply - Pre-registration form */}
              {step === "apply" && (
                <form onSubmit={handleSubmitApplication} className="space-y-4">
                  <div className="p-4 rounded-xl bg-[hsl(210,85%,45%)]/5 border border-[hsl(210,85%,45%)]/20">
                    <div className="flex items-center gap-2 text-sm text-foreground mb-1"><ClipboardList className="w-4 h-4 text-[hsl(210,85%,45%)]" /><span className="font-medium">Solicitar cadastro</span></div>
                    <p className="text-xs text-muted-foreground">Preencha seus dados. Nossa equipe analisará e enviará o código de acesso por email.</p>
                  </div>
                  {specialty && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[hsl(210,85%,45%)]/10 text-[hsl(210,85%,45%)] text-sm border border-[hsl(210,85%,45%)]/20">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium">Especialidade: {specialty}</span>
                      {examTypes && <span className="ml-auto text-xs bg-[hsl(210,85%,45%)]/20 px-2 py-0.5 rounded-full">{examTypes}</span>}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Nome</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" required className="mt-1 h-11" /></div>
                    <div><Label>Sobrenome</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" required className="mt-1 h-11" /></div>
                  </div>
                  <div><Label>Email</Label><div className="relative mt-1"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10 h-11" required /></div></div>
                  <div><Label>Telefone / WhatsApp</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="mt-1 h-11" /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2"><Label>CRM</Label><Input value={crm} onChange={e => setCrm(e.target.value)} placeholder="123456" required className="mt-1 h-11" /></div>
                    <div><Label>UF</Label><Input value={crmState} onChange={e => setCrmState(e.target.value.toUpperCase())} placeholder="SP" required className="mt-1 h-11" maxLength={2} /></div>
                  </div>
                  <div><Label>Sobre você (opcional)</Label><textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Breve descrição da sua experiência..." className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" maxLength={500} /></div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-[hsl(200,80%,35%)] to-[hsl(220,90%,50%)] text-white h-12 shadow-lg" size="lg" disabled={submittingApplication}>
                    {submittingApplication ? <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex items-center gap-2"><Sparkles className="w-4 h-4 animate-spin" /> Enviando...</motion.span> : "Enviar Solicitação"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground"><button type="button" onClick={() => setStep("quiz")} className="text-[hsl(210,85%,45%)] font-semibold hover:underline">← Voltar</button></p>
                </form>
              )}

              {/* Applied - Success */}
              {step === "applied" && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-success to-success/70 flex items-center justify-center mx-auto shadow-lg">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Solicitação Enviada!</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    Recebemos seus dados. Nossa equipe analisará sua solicitação e enviará o <strong>código de acesso por email</strong> em até 48 horas úteis.
                  </p>
                  <div className="pt-2 space-y-2">
                    <p className="text-xs text-muted-foreground">Quando aprovado, você receberá por email o link exclusivo e o código de acesso para criar sua conta.</p>
                  </div>
                </motion.div>
              )}

              {/* Register */}
              {step === "register" && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 p-3 rounded-xl bg-[hsl(210,85%,45%)]/10 text-[hsl(210,85%,45%)] text-sm border border-[hsl(210,85%,45%)]/20">
                    <div className="w-6 h-6 rounded-full bg-[hsl(210,85%,45%)]/20 flex items-center justify-center"><Check className="w-3.5 h-3.5" /></div>
                    <span className="font-medium">Código validado com sucesso</span>
                  </motion.div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Nome</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" required className="mt-1 h-11" /></div>
                    <div><Label>Sobrenome</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" required className="mt-1 h-11" /></div>
                  </div>
                  <div><Label>Email</Label><div className="relative mt-1"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10 h-11" required /></div></div>
                  <div><Label>Senha</Label><div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="pl-10 pr-10 h-11" required minLength={6} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>{password && <PasswordStrength password={password} />}</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2"><Label>CRM</Label><Input value={crm} onChange={e => setCrm(e.target.value)} placeholder="123456" required className="mt-1 h-11" /></div>
                    <div><Label>UF</Label><Input value={crmState} onChange={e => setCrmState(e.target.value.toUpperCase())} placeholder="SP" required className="mt-1 h-11" maxLength={2} /></div>
                  </div>
                  <TermsConsentCheckbox checked={termsAccepted} onCheckedChange={setTermsAccepted} />
                  <Button type="submit" className="w-full bg-gradient-to-r from-[hsl(200,80%,35%)] to-[hsl(220,90%,50%)] text-white h-12 shadow-lg" size="lg" disabled={loading || !termsAccepted}>
                    {loading ? <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex items-center gap-2"><Sparkles className="w-4 h-4 animate-spin" /> Criando conta...</motion.span> : "Cadastrar como Laudista"}
                  </Button>
                </form>
              )}

              {/* Login */}
              {step === "login" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div><Label>Email</Label><div className="relative mt-1"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10 h-11" required /></div></div>
                  <div><Label>Senha</Label><div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10 h-11" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-[hsl(200,80%,35%)] to-[hsl(220,90%,50%)] text-white h-12 shadow-lg" size="lg" disabled={loading}>
                    {loading ? <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex items-center gap-2"><Sparkles className="w-4 h-4 animate-spin" /> Entrando...</motion.span> : "Entrar"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground"><Link to="/forgot-password" className="text-[hsl(210,85%,45%)] hover:underline">Esqueci minha senha</Link></p>
                  <p className="text-center text-sm text-muted-foreground"><button type="button" onClick={() => setStep("welcome")} className="text-[hsl(210,85%,45%)] font-semibold hover:underline">← Voltar</button></p>
                </form>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Mascot */}
      <section className="py-10 text-center">
        <img src={mascotThumbsup} alt="Pingo mascote" className="w-24 mx-auto opacity-80" loading="lazy" />
      </section>

      <Suspense fallback={null}><Footer /></Suspense>
    </div>
  );
};

export default AuthLaudista;
