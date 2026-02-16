import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
      toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada." });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Phone className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Recuperar Senha</h2>
            <p className="text-sm text-muted-foreground">AloClinica</p>
          </div>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-secondary/10 mx-auto flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Email Enviado!</h3>
            <p className="text-muted-foreground mb-6">
              Enviamos um link de recuperação para <strong>{email}</strong>. Verifique sua caixa de entrada.
            </p>
            <Button variant="outline" onClick={() => navigate(-1)}>Voltar ao login</Button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Informe seu email cadastrado e enviaremos um link para redefinir sua senha.
            </p>
            <div>
              <Label>Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10" required />
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground" size="lg" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Link de Recuperação"}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
