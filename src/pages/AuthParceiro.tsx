import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, Handshake, Building2, LogIn } from "lucide-react";

type Step = "welcome" | "register" | "login";

const AuthParceiro = () => {
  const [step, setStep] = useState<Step>("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [partnerType, setPartnerType] = useState("pharmacy");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard?role=partner");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await supabase.from("partner_profiles").insert({
        user_id: data.user.id,
        business_name: businessName,
        cnpj,
        partner_type: partnerType,
      });
      await supabase.from("user_roles").insert({ user_id: data.user.id, role: "partner" } as any);
    }
    setLoading(false);
    toast({ title: "Cadastro realizado!", description: "Aguarde a aprovação do administrador." });
    navigate("/dashboard?role=partner");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/80 to-secondary/80 items-center justify-center p-12">
        <div className="text-primary-foreground max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-8 opacity-80 hover:opacity-100 transition">
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
            <Handshake className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4">Portal do Parceiro</h1>
          <p className="text-lg opacity-90">
            Farmácias e laboratórios podem validar receitas digitais e pedidos de exames da plataforma Alô Médico.
          </p>
          <div className="mt-8 space-y-3 opacity-80 text-sm">
            <p>✓ Validação de receitas digitais</p>
            <p>✓ Pedidos de exames integrados</p>
            <p>✓ Histórico de dispensações</p>
            <p>✓ Dashboard com métricas</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Handshake className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {step === "welcome" ? "Portal do Parceiro" : step === "login" ? "Entrar" : "Cadastro de Parceiro"}
              </h2>
              <p className="text-sm text-muted-foreground">Farmácias & Laboratórios</p>
            </div>
          </div>

          {step === "welcome" && (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm mb-2">
                Bem-vindo ao portal de parceiros. Escolha uma opção:
              </p>
              <Button className="w-full bg-gradient-hero text-primary-foreground" size="lg" onClick={() => setStep("login")}>
                <LogIn className="w-4 h-4 mr-2" /> Entrar na minha conta
              </Button>
              <Button variant="outline" className="w-full" size="lg" onClick={() => setStep("register")}>
                <Building2 className="w-4 h-4 mr-2" /> Cadastrar minha empresa
              </Button>
            </div>
          )}

          {step === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" required className="mt-1" /></div>
                <div><Label>Sobrenome</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" required className="mt-1" /></div>
              </div>
              <div>
                <Label>Nome da Empresa</Label>
                <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Farmácia ou Laboratório" required className="mt-1" />
              </div>
              <div>
                <Label>Tipo de Parceiro</Label>
                <Select value={partnerType} onValueChange={setPartnerType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pharmacy">Farmácia</SelectItem>
                    <SelectItem value="laboratory">Laboratório</SelectItem>
                    <SelectItem value="clinic">Clínica</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@empresa.com" className="pl-10" required />
                </div>
              </div>
              <div>
                <Label>Senha</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="pl-10" required minLength={6} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground" size="lg" disabled={loading}>
                {loading ? "Criando conta..." : "Cadastrar Empresa"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <button type="button" onClick={() => setStep("welcome")} className="text-primary font-semibold hover:underline">← Voltar</button>
              </p>
            </form>
          )}

          {step === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@empresa.com" className="pl-10" required />
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
                <button type="button" onClick={() => setStep("welcome")} className="text-primary font-semibold hover:underline">← Voltar</button>
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthParceiro;
