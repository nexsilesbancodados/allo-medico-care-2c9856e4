import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Mail, Lock, Phone, MapPin, FileText, Sparkles, Eye, EyeOff } from "lucide-react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import SEOHead from "@/components/SEOHead";

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

  const formatCnpj = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 14);
    return cleaned
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 11);
    if (cleaned.length <= 10) return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    return cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast({ title: "Aceite os termos", description: "Você precisa aceitar os Termos de Uso e Política de Privacidade.", variant: "destructive" });
      return;
    }
    if (!clinicName || !cnpj) {
      toast({ title: "Preencha nome e CNPJ da clínica", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin, data: { first_name: firstName, last_name: lastName } },
    });

    if (error) {
      toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("clinic_profiles").insert({
        user_id: data.user.id, name: clinicName,
        cnpj: cnpj.replace(/\D/g, ""), phone: phone.replace(/\D/g, ""), address,
      }).then(r => r.error && console.error("Clinic profile error:", r.error));

      await supabase.functions.invoke("assign-role", {
        body: { user_id: data.user.id, role: "clinic" },
      }).catch(console.error);

      await registerConsent(data.user.id, "terms_and_privacy_clinic");

      supabase.functions.invoke("send-email", {
        body: { type: "welcome_clinic", to: email, data: { name: `${firstName} ${lastName}`, clinic_name: clinicName } },
      }).catch(console.error);
    }

    setLoading(false);
    toast({ title: "Cadastro realizado! 🏥", description: "Sua clínica será analisada pelo administrador para aprovação." });
    navigate("/dashboard");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <SEOHead title="Portal da Clínica" description="Cadastre sua clínica na AloClinica e gerencie médicos e atendimentos online." />

      {/* Desktop left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/80 to-secondary/80 items-center justify-center p-12">
        <div className="text-primary-foreground max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-8 opacity-80 hover:opacity-100 transition">
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4">Portal da Clínica</h1>
          <p className="text-lg opacity-90">
            Registre sua clínica e gerencie médicos, atendimentos e faturamento em um só lugar.
          </p>
          <div className="mt-8 space-y-3 opacity-80 text-sm">
            <p>✓ Gestão de médicos afiliados</p>
            <p>✓ Agendamento centralizado</p>
            <p>✓ Faturamento integrado</p>
            <p>✓ Dashboard completo</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile gradient header */}
        <div className="lg:hidden bg-gradient-to-br from-primary/80 to-secondary/80 px-6 pt-[max(env(safe-area-inset-top,12px),12px)] pb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">Portal da Clínica</h1>
              <p className="text-xs text-primary-foreground/70">{mode === "register" ? "Cadastre sua clínica" : "Acesse seu painel"}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex flex-col justify-center px-6 py-6 lg:items-center overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <Link to="/" className="hidden lg:inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>

            <div className="hidden lg:flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {mode === "register" ? "Cadastro de Clínica" : "Entrar"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {mode === "register" ? "Registre sua clínica na plataforma" : "Acesse o painel da sua clínica"}
                </p>
              </div>
            </div>

            <h2 className="lg:hidden text-lg font-bold text-foreground mb-4">
              {mode === "register" ? "Cadastro" : "Entrar"}
            </h2>

            {mode === "register" ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/50 border border-border mb-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Após o cadastro, sua clínica passará por aprovação do administrador.
                  </p>
                </div>

                <div>
                  <Label>Nome da Clínica *</Label>
                  <div className="relative mt-1">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="Nome da clínica" className="pl-10" required />
                  </div>
                </div>

                <div>
                  <Label>CNPJ *</Label>
                  <div className="relative mt-1">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={cnpj} onChange={e => setCnpj(formatCnpj(e.target.value))} placeholder="00.000.000/0000-00" className="pl-10 font-mono" required />
                  </div>
                </div>

                <div>
                  <Label>Telefone</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={phone} onChange={e => setPhone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" className="pl-10" />
                  </div>
                </div>

                <div>
                  <Label>Endereço</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Endereço completo" className="pl-10" />
                  </div>
                </div>

                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-sm font-medium text-foreground mb-3">Dados do Responsável</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Nome</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" required className="mt-1" /></div>
                    <div><Label>Sobrenome</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" required className="mt-1" /></div>
                  </div>
                </div>

                <div>
                  <Label>Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="clinica@email.com" className="pl-10" required />
                  </div>
                </div>

                <div>
                  <Label>Senha</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="pl-10 pr-10" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <TermsConsentCheckbox checked={termsAccepted} onCheckedChange={setTermsAccepted} />
                <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground h-12" size="lg" disabled={loading || !termsAccepted}>
                  {loading ? (
                    <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin" /> Cadastrando...
                    </motion.span>
                  ) : "Cadastrar Clínica"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Já tem conta? <button type="button" onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Entrar</button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="clinica@email.com" className="pl-10" required />
                  </div>
                </div>
                <div>
                  <Label>Senha</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground h-12" size="lg" disabled={loading}>
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
                  Não tem conta? <button type="button" onClick={() => setMode("register")} className="text-primary font-semibold hover:underline">Cadastre-se</button>
                </p>
              </form>
            )}
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="px-6 py-4 pb-[max(env(safe-area-inset-bottom,8px),8px)] border-t border-border bg-muted/30 flex items-center justify-center gap-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-primary shrink-0" /> Clínicas</span>
          <span className="flex items-center gap-1.5">🔒 Dados protegidos</span>
        </div>
      </div>
    </div>
  );
};

export default AuthClinica;
