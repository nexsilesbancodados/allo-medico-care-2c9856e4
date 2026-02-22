import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Mail, Lock, Phone, MapPin, FileText } from "lucide-react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import doctorPortalBg from "@/assets/doctor-portal-bg.png";
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
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { first_name: firstName, last_name: lastName },
      },
    });

    if (error) {
      toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create clinic profile
      const { error: clinicError } = await supabase.from("clinic_profiles").insert({
        user_id: data.user.id,
        name: clinicName,
        cnpj: cnpj.replace(/\D/g, ""),
        phone: phone.replace(/\D/g, ""),
        address,
      });

      if (clinicError) {
        console.error("Clinic profile error:", clinicError);
      }

      // Add clinic role via edge function
      await supabase.functions.invoke("assign-role", {
        body: { user_id: data.user.id, role: "clinic" },
      }).catch(console.error);

      // Register consent
      await registerConsent(data.user.id, "terms_and_privacy_clinic");

      // Send welcome email for clinic
      supabase.functions.invoke("send-email", {
        body: { type: "welcome_clinic", to: email, data: { name: `${firstName} ${lastName}`, clinic_name: clinicName } },
      }).catch(console.error);
    }

    setLoading(false);
    toast({
      title: "Cadastro realizado! 🏥",
      description: "Sua clínica será analisada pelo administrador para aprovação.",
    });
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
    <div className="min-h-screen relative">
      <SEOHead title="Portal da Clínica" description="Cadastre sua clínica na AloClinica e gerencie médicos e atendimentos online." />
      <img src={doctorPortalBg} alt="" className="absolute inset-0 w-full h-full object-cover -z-10" />
      <div className="absolute inset-0 bg-background/70 -z-10" />

      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition text-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Portal Clínica</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
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

          <Card className="border-border">
            <CardContent className="p-6">
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
                      <div>
                        <Label>Nome</Label>
                        <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" required className="mt-1" />
                      </div>
                      <div>
                        <Label>Sobrenome</Label>
                        <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" required className="mt-1" />
                      </div>
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
                      <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="pl-10" required minLength={6} />
                    </div>
                  </div>

                  <TermsConsentCheckbox checked={termsAccepted} onCheckedChange={setTermsAccepted} />
                  <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground" size="lg" disabled={loading || !termsAccepted}>
                    {loading ? "Cadastrando..." : "Cadastrar Clínica"}
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
                      <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-10" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground" size="lg" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    <Link to="/forgot-password" className="text-primary hover:underline">Esqueci minha senha</Link>
                  </p>
                  <p className="text-center text-sm text-muted-foreground">
                    Não tem conta? <button type="button" onClick={() => setMode("register")} className="text-primary font-semibold hover:underline">Cadastre-se</button>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthClinica;
