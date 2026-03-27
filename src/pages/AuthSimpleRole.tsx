import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, Sparkles, LucideIcon, CheckCircle2, Shield } from "lucide-react";
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
  mascotSrc?: string;
}

const AuthSimpleRole = ({
  title, subtitle, description, seoDescription, icon: Icon,
  gradientFrom, gradientTo, features, placeholder,
  bottomLabel, bottomIcon: BottomIcon, bottomIconColor, mascotSrc,
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

  return (
    <div className="min-h-screen relative flex">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(215,25%,97%)] via-[hsl(215,20%,95%)] to-[hsl(215,18%,93%)] dark:from-[hsl(220,22%,7%)] dark:via-[hsl(220,20%,8%)] dark:to-[hsl(220,18%,10%)]" />
      <SEOHead title={title} description={seoDescription} />

      {/* Left panel — desktop */}
      <div className="hidden lg:flex lg:w-1/2 bg-[hsl(215_45%_12%)] relative overflow-hidden">
        {/* Subtle ambient light */}
        <div className="absolute top-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-primary/[0.12] blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[250px] h-[250px] rounded-full bg-secondary/[0.08] blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white/70 transition text-sm mb-12">
              <ArrowLeft className="w-4 h-4" /> Voltar ao início
            </Link>

            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 border border-white/[0.06]">
              <Icon className="w-6 h-6 text-white/80" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">{title}</h1>
            <p className="text-sm text-white/55 max-w-sm leading-relaxed">{description}</p>

            <div className="mt-8 space-y-2.5">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-2.5 text-sm text-white/50"
                >
                  <CheckCircle2 className="w-4 h-4 text-white/30 shrink-0" />
                  {f}
                </motion.div>
              ))}
            </div>
          </div>

          {mascotSrc && (
            <motion.div
              className="flex justify-center mt-8"
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <img
                src={mascotSrc}
                alt={`Pingo - ${title}`}
                className="w-48 h-48 object-contain drop-shadow-2xl"
                loading="eager" decoding="async" width={192} height={192} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden bg-[hsl(215_45%_12%)] px-6 pt-[max(env(safe-area-inset-top,12px),12px)] pb-8 relative overflow-hidden">
          <div className="absolute top-[-30%] right-[-20%] w-[200px] h-[200px] rounded-full bg-primary/[0.08] blur-[60px]" />
          <Link to="/" className="relative z-10 inline-flex items-center gap-2 text-white/50 hover:text-white/70 transition text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="relative z-10 flex items-center gap-3">
            {mascotSrc ? (
              <img src={mascotSrc} alt="Pingo" className="w-12 h-12 object-contain drop-shadow-lg" loading="lazy" decoding="async" width={48} height={48} />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white/80" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-white">{title}</h1>
              <p className="text-xs text-white/45">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 py-6 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            <Link to="/" className="hidden lg:inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition text-sm">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
            <div className="hidden lg:flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{title}</h2>
                <p className="text-xs text-muted-foreground">Acesso restrito</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/50 mb-5">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 shrink-0 text-primary/50" />
                Conta criada pelo administrador. Entre com suas credenciais.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={placeholder} className="pl-10 h-11 rounded-lg" required />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Senha</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 h-11 rounded-lg" required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground h-11 rounded-lg font-semibold shadow-md shadow-primary/15 hover:bg-primary/90 active:scale-[0.97] transition-all" size="lg" disabled={loading}>
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

        <div className="px-6 py-3.5 pb-[max(env(safe-area-inset-bottom,8px),8px)] border-t border-border/40 bg-muted/20 flex items-center justify-center gap-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><BottomIcon className={`w-3.5 h-3.5 ${bottomIconColor} shrink-0`} /> {bottomLabel}</span>
          <span className="flex items-center gap-1.5">🔒 Acesso restrito</span>
        </div>
      </div>
    </div>
  );
};

export default AuthSimpleRole;
