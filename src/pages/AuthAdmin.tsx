import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, Shield, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";

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
      navigate("/dashboard/admin/panel-center");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <SEOHead title="Acesso Administrativo" description="Painel administrativo da AloClinica." />
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

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile gradient header */}
        <div className="lg:hidden bg-gradient-to-br from-foreground to-muted-foreground px-6 pt-[max(env(safe-area-inset-top,12px),12px)] pb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-background/80 hover:text-background transition text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Shield className="w-6 h-6 text-background" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-background">Painel Administrativo</h1>
              <p className="text-xs text-background/70">Área restrita</p>
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
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                <Shield className="w-5 h-5 text-background" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Acesso Administrativo</h2>
                <p className="text-sm text-muted-foreground">Área restrita</p>
              </div>
            </div>

            <h2 className="lg:hidden text-lg font-bold text-foreground mb-4">Entrar</h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@aloclinica.com" className="pl-10" required />
                </div>
              </div>
              <div>
                <Label>Senha</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-10" required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90 h-12" size="lg" disabled={loading}>
                {loading ? (
                  <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" /> Entrando...
                  </motion.span>
                ) : "Entrar como Admin"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/forgot-password" className="text-primary hover:underline">Esqueci minha senha</Link>
              </p>
            </form>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="px-6 py-4 pb-[max(env(safe-area-inset-bottom,8px),8px)] border-t border-border bg-muted/30 flex items-center justify-center gap-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-foreground shrink-0" /> Acesso restrito</span>
          <span className="flex items-center gap-1.5">🔒 Criptografado</span>
        </div>
      </div>
    </div>
  );
};

export default AuthAdmin;
