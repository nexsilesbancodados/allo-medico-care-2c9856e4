import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, Megaphone, LogIn, UserPlus, AlertCircle, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { translateAuthError } from "@/lib/authErrors";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Step = "welcome" | "register" | "login";

const AuthAfiliado = () => {
  const [step, setStep] = useState<Step>("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Erro ao entrar", { description: translateAuthError(error.message) });
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: affiliateProfile } = await supabase
          .from("profiles" as any)
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (!affiliateProfile) {
          toast.error("Conta não encontrada", { description: "Você não possui um perfil de afiliado." });
          await supabase.auth.signOut();
          return;
        }
        
        if (!affiliateProfile.is_approved) {
          toast.error("Aguardando aprovação", { description: "Seu cadastro ainda está em análise." });
          await supabase.auth.signOut();
          return;
        }
      }
      navigate("/dashboard?role=affiliate");
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
      toast.error("Erro no cadastro", { description: translateAuthError(error.message) });
      return;
    }
    if (data.user) {
      await supabase.functions.invoke("assign-role", {
        body: { user_id: data.user.id, role: "affiliate", profile_data: { pix_key: pixKey } },
      });
    }
    setLoading(false);
    await supabase.auth.signOut();
    toast.success("Cadastro realizado!", { description: "Seu pedido de afiliação foi enviado. O administrador irá analisar." });
    setStep("welcome");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <SEOHead title="Portal do Afiliado" description="Indique a AloClinica e ganhe comissões por cada paciente cadastrado." />
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary/80 to-accent/80 items-center justify-center p-12">
        <div className="text-primary-foreground max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-8 opacity-80 hover:opacity-100 transition">
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
            <Megaphone className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4">Programa de Afiliados</h1>
          <p className="text-lg opacity-90">
            Indique pacientes para a AloClinica e ganhe comissões por cada conversão.
          </p>
          <div className="mt-8 space-y-3 opacity-80 text-sm">
            <p>✓ Comissão de 2% sobre todos os ganhos dos indicados</p>
            <p>✓ Comissão recorrente em assinaturas mensais</p>
            <p>✓ Dashboard com ganhos em tempo real</p>
            <p>✓ Solicitação de saque via PIX</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile gradient header */}
        <div className="lg:hidden bg-gradient-to-br from-secondary/80 to-accent/80 px-6 pt-[max(env(safe-area-inset-top,12px),12px)] pb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">Programa de Afiliados</h1>
              <p className="text-xs text-primary-foreground/70">Indique e ganhe 2%</p>
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {step === "welcome" ? "Programa de Afiliados" : step === "login" ? "Entrar" : "Cadastro de Afiliado"}
                </h2>
                <p className="text-sm text-muted-foreground">Indique e ganhe 2% de comissão</p>
              </div>
            </div>

            <h2 className="lg:hidden text-lg font-bold text-foreground mb-4">
              {step === "welcome" ? "Bem-vindo" : step === "login" ? "Entrar" : "Cadastro"}
            </h2>

            {step === "welcome" && (
              <div className="space-y-3">
                <Alert className="border-primary/30 bg-primary/5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Após o cadastro, um administrador irá analisar seu pedido.
                  </AlertDescription>
                </Alert>
                <Button className="w-full bg-gradient-hero text-primary-foreground h-12" size="lg" onClick={() => setStep("login")}>
                  <LogIn className="w-4 h-4 mr-2" /> Entrar na minha conta
                </Button>
                <Button variant="outline" className="w-full h-12" size="lg" onClick={() => setStep("register")}>
                  <UserPlus className="w-4 h-4 mr-2" /> Quero ser afiliado
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
                  <Label>Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10" required />
                  </div>
                </div>
                <div>
                  <Label>Chave PIX (para receber comissões)</Label>
                  <Input value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="CPF, email, telefone ou chave aleatória" className="mt-1" />
                </div>
                <div>
                  <Label>Senha</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="pl-10" required minLength={6} />
                  </div>
                </div>
                <Alert className="border-warning/30 bg-warning/5">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-xs text-muted-foreground">
                    Após o cadastro, sua conta ficará pendente até a aprovação do administrador.
                  </AlertDescription>
                </Alert>
                <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground h-12" size="lg" disabled={loading}>
                  {loading ? (
                    <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin" /> Enviando...
                    </motion.span>
                  ) : "Solicitar Afiliação"}
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
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10" required />
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
          <span className="flex items-center gap-1.5"><Megaphone className="w-3.5 h-3.5 text-secondary shrink-0" /> Afiliados</span>
          <span className="flex items-center gap-1.5">💰 Comissão 2%</span>
        </div>
      </div>
    </div>
  );
};

export default AuthAfiliado;
