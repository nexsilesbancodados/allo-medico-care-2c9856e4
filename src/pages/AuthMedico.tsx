import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, Stethoscope } from "lucide-react";

const AuthMedico = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [crm, setCrm] = useState("");
  const [crmState, setCrmState] = useState("SP");
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
      navigate("/dashboard");
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
      await supabase.from("doctor_profiles").insert({ user_id: data.user.id, crm, crm_state: crmState });
      await supabase.from("user_roles").insert({ user_id: data.user.id, role: "doctor" });
    }
    setLoading(false);
    toast({ title: "Cadastro realizado!", description: "Aguarde a aprovação do seu CRM." });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary to-primary items-center justify-center p-12">
        <div className="text-primary-foreground max-w-md">
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

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{mode === "login" ? "Entrar" : "Cadastro Médico"}</h2>
              <p className="text-sm text-muted-foreground">Portal do Médico</p>
            </div>
          </div>

          {mode === "login" ? (
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
              <Button type="submit" className="w-full bg-gradient-to-r from-secondary to-primary text-primary-foreground" size="lg" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Não tem conta? <button type="button" onClick={() => setMode("register")} className="text-primary font-semibold hover:underline">Cadastre-se</button>
              </p>
            </form>
          ) : (
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
                <Label>Senha</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="pl-10" required minLength={6} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2"><Label>CRM</Label><Input value={crm} onChange={e => setCrm(e.target.value)} placeholder="123456" required className="mt-1" /></div>
                <div><Label>UF</Label><Input value={crmState} onChange={e => setCrmState(e.target.value)} placeholder="SP" required className="mt-1" maxLength={2} /></div>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-secondary to-primary text-primary-foreground" size="lg" disabled={loading}>
                {loading ? "Criando conta..." : "Cadastrar como Médico"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Já tem conta? <button type="button" onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Entrar</button>
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthMedico;
