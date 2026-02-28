import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Lock, Check } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import PasswordStrength from "@/components/ui/password-strength";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Senhas não conferem");
      return;
    }
    if (password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("Erro", { description: error.message });
    } else {
      setSuccess(true);
      toast.success("Senha atualizada!");
      // Check if user has active session before redirecting
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        setTimeout(() => navigate("/paciente"), 2000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <SEOHead title="Redefinir Senha" description="Redefina sua senha de acesso à AloClinica." />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-secondary/10 mx-auto flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Senha Atualizada!</h3>
            <p className="text-muted-foreground">Redirecionando...</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-foreground mb-2">Redefinir Senha</h2>
            <p className="text-muted-foreground mb-6">Escolha uma nova senha para sua conta.</p>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <Label>Nova Senha</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="pl-10" required minLength={6} />
                </div>
                <PasswordStrength password={password} />
              </div>
              <div>
                <Label>Confirmar Senha</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" className="pl-10" required minLength={6} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground" size="lg" disabled={loading}>
                {loading ? "Atualizando..." : "Redefinir Senha"}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
