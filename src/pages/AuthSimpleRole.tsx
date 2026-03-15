import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, Sparkles, LucideIcon } from "lucide-react";
import SEOHead from "@/components/SEOHead";

interface AuthSimpleRoleProps {
  role: string;
  title: string;
  subtitle: string;
  description: string;
  seoDescription: string;
  icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  features: string[];
  placeholder: string;
  bottomLabel: string;
  bottomIcon: LucideIcon;
  bottomIconColor: string;
}

const AuthSimpleRole = ({
  title, subtitle, description, seoDescription, icon: Icon,
  gradientFrom, gradientTo, features, placeholder,
  bottomLabel, bottomIcon: BottomIcon, bottomIconColor,
}: AuthSimpleRoleProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Erro ao entrar", { description: error.message });
    } else {
      navigate("/dashboard");
    }
  };

  const gradient = `from-${gradientFrom} to-${gradientTo}`;

  return (
    <div className="min-h-screen bg-background flex">
      <SEOHead title={title} description={seoDescription} />
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${gradient} items-center justify-center p-12`}>
        <div className="text-primary-foreground max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-8 opacity-80 hover:opacity-100 transition">
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
            <Icon className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4">{title}</h1>
          <p className="text-lg opacity-90">{description}</p>
          <div className="mt-8 space-y-3 opacity-80 text-sm">
            {features.map((f, i) => <p key={i}>✓ {f}</p>)}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen">
        <div className={`lg:hidden bg-gradient-to-br ${gradient} px-6 pt-[max(env(safe-area-inset-top,12px),12px)] pb-8`}>
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">{title}</h1>
              <p className="text-xs text-primary-foreground/70">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 py-6 lg:items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <Link to="/" className="hidden lg:inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
            <div className="hidden lg:flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground tabular-nums">{title}</h2>
                <p className="text-sm text-muted-foreground">Acesso restrito</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border mb-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Icon className="w-3 h-3" />
                Conta criada pelo administrador. Entre com suas credenciais.
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={placeholder} className="pl-10" required />
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
            </form>
          </motion.div>
        </div>

        <div className="px-6 py-4 pb-[max(env(safe-area-inset-bottom,8px),8px)] border-t border-border bg-muted/30 flex items-center justify-center gap-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><BottomIcon className={`w-3.5 h-3.5 ${bottomIconColor} shrink-0`} /> {bottomLabel}</span>
          <span className="flex items-center gap-1.5">🔒 Acesso restrito</span>
        </div>
      </div>
    </div>
  );
};

export default AuthSimpleRole;
