import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Building2, Mail, Lock, Phone, MapPin, FileText, Sparkles, Eye, EyeOff,
  Users, Calendar, DollarSign, BarChart3, Shield, ArrowRight, CheckCircle2,
  ChevronRight, Smartphone, HelpCircle, Zap, Video, ClipboardList, UserPlus,
  Globe, Clock
} from "lucide-react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import { lazy, Suspense } from "react";
import clinicReceptionist from "@/assets/clinic-receptionist.png";
import mascotThumbsUp from "@/assets/mascot-thumbsup.png";

const Footer = lazy(() => import("@/components/landing/Footer"));

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const landingBenefits = [
  { icon: Users, title: "Gestão de Médicos", desc: "Convide, gerencie e acompanhe o desempenho de cada profissional.", gradient: "from-primary to-primary/70" },
  { icon: Calendar, title: "Agendamento Central", desc: "Agenda unificada com confirmação automática e lembretes.", gradient: "from-secondary to-secondary/70" },
  { icon: DollarSign, title: "Faturamento Integrado", desc: "Relatórios financeiros, repasses automáticos e comissões.", gradient: "from-warning to-warning/70" },
  { icon: BarChart3, title: "Dashboard Completo", desc: "KPIs de ocupação, receita e satisfação dos pacientes.", gradient: "from-destructive to-destructive/70" },
  { icon: Video, title: "Teleconsulta Inclusa", desc: "Atendimento presencial e por vídeo na mesma plataforma.", gradient: "from-success to-success/70" },
  { icon: Shield, title: "Conformidade LGPD", desc: "Dados criptografados e consentimento automatizado.", gradient: "from-primary to-secondary" },
];

const howItWorks = [
  { step: "01", title: "Cadastre sua Clínica", desc: "Preencha os dados, CNPJ e responsável técnico.", icon: <Building2 className="w-6 h-6 text-white" />, gradient: "from-primary to-primary/70" },
  { step: "02", title: "Convide seus Médicos", desc: "Envie convites e configure comissões individuais.", icon: <UserPlus className="w-6 h-6 text-white" />, gradient: "from-warning to-warning/70" },
  { step: "03", title: "Gerencie tudo no Painel", desc: "Acompanhe agendamentos e faturamento em tempo real.", icon: <ClipboardList className="w-6 h-6 text-white" />, gradient: "from-secondary to-secondary/70" },
];

const features = [
  "Painel administrativo completo e intuitivo",
  "Convite de médicos por e-mail e WhatsApp",
  "Configuração de comissão por médico",
  "Recepção digital com check-in de pacientes",
  "Relatórios de ocupação e faturamento",
  "Suporte técnico dedicado",
  "Multi-unidades em uma só conta",
  "Sem custo de instalação — pague por uso",
];

const faqItems = [
  { question: "Quanto custa para a clínica?", answer: "Cadastro gratuito. Taxa por consulta realizada, sem mensalidade fixa." },
  { question: "Quantos médicos posso cadastrar?", answer: "Sem limite. Configure comissões individuais para cada profissional." },
  { question: "Posso usar para atendimento presencial e online?", answer: "Sim! A plataforma suporta ambos com a mesma agenda." },
  { question: "Como funciona o repasse financeiro?", answer: "Defina percentuais de comissão. O sistema calcula automaticamente." },
];

const AuthClinica = () => {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  const formatCnpj = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 14);
    return cleaned.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
  };
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 11);
    if (cleaned.length <= 10) return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    return cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) { toast({ title: "Aceite os termos", variant: "destructive" }); return; }
    if (!clinicName || !cnpj) { toast({ title: "Preencha nome e CNPJ da clínica", variant: "destructive" }); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { first_name: firstName, last_name: lastName } } });
    if (error) { toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" }); setLoading(false); return; }
    if (data.user) {
      await supabase.from("clinic_profiles").insert({ user_id: data.user.id, name: clinicName, cnpj: cnpj.replace(/\D/g, ""), phone: phone.replace(/\D/g, ""), address }).then(r => r.error && console.error(r.error));
      await supabase.functions.invoke("assign-role", { body: { user_id: data.user.id, role: "clinic" } }).catch(console.error);
      await registerConsent(data.user.id, "terms_and_privacy_clinic");
      supabase.functions.invoke("send-email", { body: { type: "welcome_clinic", to: email, data: { name: `${firstName} ${lastName}`, clinic_name: clinicName } } }).catch(console.error);
    }
    setLoading(false);
    toast({ title: "Cadastro realizado! 🏥", description: "Sua clínica será analisada para aprovação." });
    navigate("/dashboard");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    else navigate("/dashboard");
  };

  return (
    <>
      <SEOHead title="Sou Clínica — Gestão Online | AloClinica" description="Cadastre sua clínica na AloClinica. Gerencie médicos, agendamentos e faturamento em um só painel." />
      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-32 mt-[70px]">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/90 to-primary" />
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
          <div className="container mx-auto px-4 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <Badge className="mb-5 text-sm px-5 py-1.5 bg-white/15 text-white border-white/20 backdrop-blur-sm">
                  <Building2 className="w-3.5 h-3.5 mr-1.5" /> Para Clínicas
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 tracking-tight leading-tight">
                  Sua clínica<br /><span className="text-white/85">100% digital</span>
                </h1>
                <p className="text-lg text-white/70 max-w-xl mb-8 leading-relaxed">
                  Gerencie médicos, agendamentos e faturamento em um só painel. Presencial e teleconsulta integrados.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-2xl h-14 px-10 text-base font-bold shadow-2xl" onClick={scrollToForm}>
                    Cadastrar Clínica <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button size="lg" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 rounded-2xl h-14 px-8 text-base font-semibold" asChild>
                    <a href="#como-funciona">Ver recursos</a>
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-6 mt-10">
                  {[
                    { icon: <Shield className="w-4 h-4" />, label: "LGPD Compliant" },
                    { icon: <Globe className="w-4 h-4" />, label: "Multi-unidades" },
                    { icon: <Clock className="w-4 h-4" />, label: "Setup em minutos" },
                    { icon: <Zap className="w-4 h-4" />, label: "Sem mensalidade" },
                  ].map((item, i) => (
                    <span key={i} className="flex items-center gap-2 text-white/55 text-sm font-medium">{item.icon} {item.label}</span>
                  ))}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="hidden lg:flex justify-center">
                <img src={clinicReceptionist} alt="Painel da clínica" className="w-full max-w-md rounded-3xl shadow-2xl shadow-black/30 object-cover" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-14">
                <Badge variant="outline" className="mb-3 text-sm px-4 py-1 rounded-full"><Zap className="w-3.5 h-3.5 mr-1.5" /> Recursos</Badge>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Gestão completa da sua clínica</h2>
              </motion.div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {landingBenefits.map((b, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="h-full border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${b.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}><b.icon className="w-6 h-6 text-white" /></div>
                        <h3 className="font-bold text-foreground text-lg mb-1.5">{b.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section id="como-funciona" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-14 relative">
                <Badge variant="outline" className="mb-3 text-sm px-4 py-1 rounded-full"><HelpCircle className="w-3.5 h-3.5 mr-1.5" /> Passo a passo</Badge>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Como funciona?</h2>
                <motion.img src={mascotThumbsUp} alt="Pingo" className="absolute -right-2 sm:right-4 -bottom-6 w-14 sm:w-18 object-contain drop-shadow-lg" initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, type: "spring", stiffness: 200 }} />
              </motion.div>
              <div className="grid md:grid-cols-3 gap-5">
                {howItWorks.map((item, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="h-full border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>{item.icon}</div>
                          <span className="text-3xl font-black text-muted-foreground/20">{item.step}</span>
                        </div>
                        <h3 className="font-bold text-foreground text-lg mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================== AUTH FORM SECTION ==================== */}
        <section ref={formRef} id="cadastro" className="py-20">
          <div className="container mx-auto px-4 max-w-md">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Portal da Clínica</h2>
              <p className="text-muted-foreground mt-1">{mode === "register" ? "Cadastre sua clínica" : "Acesse seu painel"}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card border border-border rounded-2xl p-6 shadow-lg">
              {mode === "register" ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" /> Após o cadastro, sua clínica passará por aprovação.</p>
                  </div>
                  <div><Label>Nome da Clínica *</Label><div className="relative mt-1"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="Nome da clínica" className="pl-10" required /></div></div>
                  <div><Label>CNPJ *</Label><div className="relative mt-1"><FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={cnpj} onChange={e => setCnpj(formatCnpj(e.target.value))} placeholder="00.000.000/0000-00" className="pl-10 font-mono" required /></div></div>
                  <div><Label>Telefone</Label><div className="relative mt-1"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={phone} onChange={e => setPhone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" className="pl-10" /></div></div>
                  <div><Label>Endereço</Label><div className="relative mt-1"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Endereço completo" className="pl-10" /></div></div>
                  <div className="border-t border-border pt-4">
                    <p className="text-sm font-medium text-foreground mb-3">Dados do Responsável</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Nome</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" required className="mt-1" /></div>
                      <div><Label>Sobrenome</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" required className="mt-1" /></div>
                    </div>
                  </div>
                  <div><Label>Email</Label><div className="relative mt-1"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="clinica@email.com" className="pl-10" required /></div></div>
                  <div><Label>Senha</Label><div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="pl-10 pr-10" required minLength={6} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                  <TermsConsentCheckbox checked={termsAccepted} onCheckedChange={setTermsAccepted} />
                  <Button type="submit" className="w-full bg-gradient-to-r from-secondary to-primary text-primary-foreground h-12 shadow-lg" size="lg" disabled={loading || !termsAccepted}>
                    {loading ? <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex items-center gap-2"><Sparkles className="w-4 h-4 animate-spin" /> Cadastrando...</motion.span> : "Cadastrar Clínica"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">Já tem conta? <button type="button" onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Entrar</button></p>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div><Label>Email</Label><div className="relative mt-1"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="clinica@email.com" className="pl-10" required /></div></div>
                  <div><Label>Senha</Label><div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-secondary to-primary text-primary-foreground h-12 shadow-lg" size="lg" disabled={loading}>
                    {loading ? <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex items-center gap-2"><Sparkles className="w-4 h-4 animate-spin" /> Entrando...</motion.span> : "Entrar"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground"><Link to="/forgot-password" className="text-primary hover:underline">Esqueci minha senha</Link></p>
                  <p className="text-center text-sm text-muted-foreground">Não tem conta? <button type="button" onClick={() => setMode("register")} className="text-primary font-semibold hover:underline">Cadastre-se</button></p>
                </form>
              )}
            </motion.div>

            <div className="mt-4 flex items-center justify-center gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-primary" /> Clínicas</span>
              <span>🔒 Dados protegidos</span>
            </div>
          </div>
        </section>

        {/* Features checklist */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.h2 variants={fadeUp} className="text-3xl font-black text-foreground text-center mb-3 tracking-tight">Tudo incluso no Painel</motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground text-center mb-10">Ferramentas completas para sua clínica</motion.p>
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((f, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success to-success/70 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform"><CheckCircle2 className="w-4 h-4 text-white" /></div>
                    <span className="text-sm text-foreground font-medium">{f}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.h2 variants={fadeUp} className="text-3xl font-black text-foreground text-center mb-12 tracking-tight">Perguntas Frequentes</motion.h2>
              <div className="space-y-4">
                {faqItems.map((faq, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="border-border/50 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center shrink-0 text-primary"><HelpCircle className="w-5 h-5" /></div>
                          <div><h3 className="font-bold text-foreground mb-2">{faq.question}</h3><p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p></div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-primary mx-auto mb-5 shadow-xl"><Smartphone className="w-8 h-8 text-white" /></div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3 tracking-tight">Leve sua clínica para o futuro</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">Cadastro gratuito, sem mensalidade e com suporte dedicado.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" className="bg-gradient-to-r from-secondary to-primary text-primary-foreground rounded-2xl h-14 px-10 text-base font-bold shadow-xl" onClick={scrollToForm}>Cadastrar Clínica <ArrowRight className="w-5 h-5 ml-2" /></Button>
                <Button size="lg" variant="outline" className="rounded-2xl h-14 px-8 text-base font-semibold" asChild>
                  <a href="https://wa.me/5511999999999?text=Olá! Gostaria de cadastrar minha clínica." target="_blank" rel="noopener noreferrer">Falar pelo WhatsApp</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <Suspense fallback={null}><Footer /></Suspense>
      </div>
    </>
  );
};

export default AuthClinica;
