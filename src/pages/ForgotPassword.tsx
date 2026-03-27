import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Shield, CheckCircle2, Lock } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Erro", { description: error.message });
    } else {
      setSent(true);
      toast.success("Email enviado!", { description: "Verifique sua caixa de entrada." });
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-6">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[hsl(210,30%,97%)]" />
      <div className="pointer-events-none fixed top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[120px]" />
      <div className="pointer-events-none fixed bottom-[-15%] left-[-8%] w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[100px]" />

      <SEOHead title="Recuperar Senha" description="Recupere sua senha da plataforma AloClinica." />

      {/* Header */}
      <div className="w-full max-w-md mb-8">
        <Link to="/auth/paciente" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Login
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-7 h-7 text-primary" />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-foreground text-center mb-2 font-[Manrope]">Esqueceu sua senha?</h1>
        <p className="text-center text-muted-foreground text-sm mb-8">
          Não se preocupe. Digite seu e-mail abaixo e enviaremos as instruções para recuperação.
        </p>

        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl bg-card border border-border/60 p-8 text-center shadow-lg">
            <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Email Enviado!</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Enviamos um link de recuperação para <strong className="text-foreground">{email}</strong>. Verifique sua caixa de entrada.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-6">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Ambiente Seguro e Criptografado
            </div>
            <p className="text-xs text-muted-foreground">
              Se você não receber o e-mail em até 5 minutos, verifique sua pasta de spam ou{" "}
              <button onClick={() => setSent(false)} className="text-primary font-semibold hover:underline">tente novamente</button>.
            </p>
            <Button variant="outline" onClick={() => navigate("/auth/paciente")} className="mt-6 rounded-full">
              Voltar ao login
            </Button>
          </motion.div>
        ) : (
          <div className="rounded-3xl bg-card border border-border/60 p-8 shadow-lg">
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Endereço de E-mail</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com.br"
                    className="pl-11 h-12 rounded-xl bg-muted/30 border-transparent focus:border-primary/30 text-base"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-full bg-gradient-to-r from-primary to-[hsl(215,75%,40%)] text-primary-foreground font-bold shadow-lg text-base"
                size="lg"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar Link de Recuperação →"}
              </Button>
            </form>

            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Ambiente Seguro e Criptografado
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Se você não receber o e-mail em até 5 minutos, verifique sua pasta de spam ou{" "}
              <button onClick={() => setEmail("")} className="text-primary font-semibold hover:underline">tente novamente</button>.
            </p>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-8">
          Ainda precisa de ajuda? <Link to="/dashboard/patient/support?role=patient" className="text-primary font-semibold hover:underline">Contate o Suporte</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
