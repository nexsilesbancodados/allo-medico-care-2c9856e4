import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, ClipboardList, LogIn } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const AuthRecepcionista = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <div className="min-h-screen bg-background flex">
      <SEOHead title="Portal da Recepção" description="Acesse o painel de recepção da AloClinica." />
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/70 to-secondary/70 items-center justify-center p-12">
        <div className="text-primary-foreground max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-8 opacity-80 hover:opacity-100 transition">
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4">Portal da Recepção</h1>
          <p className="text-lg opacity-90">
            Gerencie agendamentos, check-ins e faturamento dos pacientes da clínica.
          </p>
          <div className="mt-8 space-y-3 opacity-80 text-sm">
            <p>✓ Check-in de pacientes</p>
            <p>✓ Gestão de agendamentos</p>
            <p>✓ Confirmação de pagamentos</p>
            <p>✓ Controle de fila de espera</p>
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
              <ClipboardList className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Portal da Recepção</h2>
              <p className="text-sm text-muted-foreground">Acesso restrito a recepcionistas</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border mb-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ClipboardList className="w-3 h-3" />
              Conta criada pelo administrador da clínica. Entre com suas credenciais.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label>Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="recepcao@clinica.com" className="pl-10" required />
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
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthRecepcionista;
