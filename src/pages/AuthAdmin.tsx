import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, Shield } from "lucide-react";

const AuthAdmin = () => {
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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-foreground to-muted-foreground items-center justify-center p-12">
        <div className="text-background max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-8 opacity-80 hover:opacity-100 transition">
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4">Painel Administrativo</h1>
          <p className="text-lg opacity-90">
            Acesso restrito. Gerencie toda a plataforma: faturamento, cadastros, inadimplência e relatórios.
          </p>
          <div className="mt-8 space-y-3 opacity-80 text-sm">
            <p>✓ Dashboard financeiro completo</p>
            <p>✓ Gestão de planos e assinaturas</p>
            <p>✓ Controle de inadimplência</p>
            <p>✓ Aprovação de médicos e clínicas</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
              <Shield className="w-5 h-5 text-background" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Acesso Administrativo</h2>
              <p className="text-sm text-muted-foreground">Área restrita</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label>Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@alomedico.com" className="pl-10" required />
              </div>
            </div>
            <div>
              <Label>Senha</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-10" required />
              </div>
            </div>
            <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90" size="lg" disabled={loading}>
              {loading ? "Entrando..." : "Entrar como Admin"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthAdmin;
