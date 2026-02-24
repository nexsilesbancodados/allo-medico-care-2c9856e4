import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, Handshake, Building2, LogIn, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";

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
      await supabase.functions.invoke("assign-role", {
        body: {
          user_id: data.user.id,
          role: "partner",
          profile_data: { business_name: businessName, cnpj, partner_type: partnerType },
        },
      });
    }
    setLoading(false);
    toast({ title: "Cadastro realizado!", description: "Aguarde a aprovação do administrador." });
    navigate("/dashboard?role=partner");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <SEOHead title="Portal do Parceiro" description="Torne-se parceiro da AloClinica e ofereça telemedicina aos seus clientes." />
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
            Farmácias e laboratórios podem validar receitas digitais e pedidos de exames da plataforma AloClinica.
          </p>
          <div className="mt-8 space-y-3 opacity-80 text-sm">
            <p>✓ Validação de receitas digitais</p>
            <p>✓ Pedidos de exames integrados</p>
            <p>✓ Histórico de dispensações</p>
            <p>✓ Dashboard com métricas</p>
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
              <Handshake className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">Portal do Parceiro</h1>
              <p className="text-xs text-primary-foreground/70">Farmácias & Laboratórios</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex flex-col justify-center px-6 py-6 lg:items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <Link to="/" className="hidden lg:inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>

            <div className="hidden lg:flex items-center gap-3 mb-6">
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

            <h2 className="lg:hidden text-lg font-bold text-foreground mb-4">
              {step === "welcome" ? "Bem-vindo" : step === "login" ? "Entrar" : "Cadastro"}
            </h2>

            {step === "welcome" && (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm mb-2">
                  Bem-vindo ao portal de parceiros. Escolha uma opção:
                </p>
                <Button className="w-full bg-gradient-hero text-primary-foreground h-12" size="lg" onClick={() => setStep("login")}>
                  <LogIn className="w-4 h-4 mr-2" /> Entrar na minha conta
                </Button>
                <Button variant="outline" className="w-full h-12" size="lg" onClick={() => setStep("register")}>
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
                <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground h-12" size="lg" disabled={loading}>
                  {loading ? (
                    <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin" /> Criando conta...
                    </motion.span>
                  ) : "Cadastrar Empresa"}
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
                  <button type="button" onClick={() => setStep("welcome")} className="text-primary font-semibold hover:underline">← Voltar</button>
                </p>
              </form>
            )}
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="px-6 py-4 pb-[max(env(safe-area-inset-bottom,8px),8px)] border-t border-border bg-muted/30 flex items-center justify-center gap-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Handshake className="w-3.5 h-3.5 text-primary shrink-0" /> Parceiros</span>
          <span className="flex items-center gap-1.5">🔒 Dados protegidos</span>
        </div>
      </div>
    </div>
  );
};

export default AuthParceiro;
