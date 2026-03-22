import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, Sparkles, LucideIcon, CheckCircle2 } from "lucide-react";
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

  const gradient = `from-${gradientFrom} to-${gradientTo}`;

  return (
    <div className="min-h-screen relative flex">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(200,50%,97%)] via-[hsl(210,40%,94%)] to-[hsl(220,35%,90%)] dark:from-[hsl(200,25%,7%)] dark:via-[hsl(210,20%,9%)] dark:to-[hsl(220,18%,11%)]" />
      <SEOHead title={title} description={seoDescription} />

      {/* ── Left panel — desktop only ── */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        {/* Ambient orbs */}
        <div className="absolute top-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-white/[0.06] blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] rounded-full bg-white/[0.04] blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition text-sm mb-10">
              <ArrowLeft className="w-4 h-4" /> Voltar ao início
            </Link>

            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/10">
              <Icon className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-extrabold text-primary-foreground mb-3 tracking-tight">{title}</h1>
            <p className="text-base text-primary-foreground/80 max-w-sm leading-relaxed">{description}</p>

            <div className="mt-8 space-y-3">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-2.5 text-sm text-primary-foreground/80"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary-foreground/60 shrink-0" />
                  {f}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mascot illustration */}
          {mascotSrc && (
            <motion.div
              className="flex justify-center mt-8"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <img
                src={mascotSrc}
                alt={`Pingo - ${title}`}
                className="w-56 h-56 object-contain drop-shadow-2xl"
                loading="eager"
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile gradient header */}
        <div className={`lg:hidden bg-gradient-to-br ${gradient} px-6 pt-[max(env(safe-area-inset-top,12px),12px)] pb-8 relative overflow-hidden`}>
          <div className="absolute top-[-30%] right-[-20%] w-[200px] h-[200px] rounded-full bg-white/[0.06] blur-[60px]" />
          <Link to="/" className="relative z-10 inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="relative z-10 flex items-center gap-3">
            {mascotSrc ? (
              <img src={mascotSrc} alt="Pingo" className="w-14 h-14 object-contain drop-shadow-lg" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">{title}</h1>
              <p className="text-xs text-primary-foreground/70">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 py-6 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            <Link to="/" className="hidden lg:inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
            <div className="hidden lg:flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                <Icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground tabular-nums">{title}</h2>
                <p className="text-sm text-muted-foreground">Acesso restrito</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/50 border border-border/60 mb-5">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 shrink-0" />
                Conta criada pelo administrador. Entre com suas credenciais.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={placeholder} className="pl-10 h-11" required />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Senha</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 h-11" required />
                </div>
              </div>
              <Button type="submit" className={`w-full bg-gradient-to-r ${gradient} text-primary-foreground h-12 rounded-xl font-bold shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.97] transition-all`} size="lg" disabled={loading}>
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
