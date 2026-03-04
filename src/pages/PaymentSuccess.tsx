import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Calendar, ArrowRight, Home, Loader2, PartyPopper, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [verifying, setVerifying] = useState(!!sessionId);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setVerified(true);
      return;
    }

    // Verify subscription exists after Asaas webhook processes
    const verifySubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setVerifying(false);
        setVerified(true);
        return;
      }

      // Poll for subscription creation (webhook may take a few seconds)
      let attempts = 0;
      const maxAttempts = 10;
      const poll = setInterval(async () => {
        attempts++;
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .limit(1);
        
        if ((subs && subs.length > 0) || attempts >= maxAttempts) {
          clearInterval(poll);
          setVerifying(false);
          setVerified(true);
        }
      }, 2000);

      return () => clearInterval(poll);
    };
    
    verifySubscription();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEOHead title="Pagamento Confirmado" description="Seu pagamento foi processado com sucesso na AloClinica." />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
        className="max-w-md w-full"
      >
        <Card className="border-border/50 shadow-xl shadow-primary/10 overflow-hidden">
          {/* Gradient header */}
          <div className="h-2 bg-gradient-to-r from-primary via-secondary to-primary" />
          
          <CardContent className="p-8 text-center">
            {verifying ? (
              <div className="py-8">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <p className="text-lg font-semibold text-foreground mb-1">Verificando pagamento...</p>
                <p className="text-sm text-muted-foreground">Aguarde enquanto confirmamos seu pagamento.</p>
              </div>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                  className="relative inline-block mb-5"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-12 h-12 text-success" />
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="absolute -top-1 -right-1"
                  >
                    <PartyPopper className="w-6 h-6 text-warning" />
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h1 className="text-2xl font-extrabold text-foreground mb-2 tracking-tight">
                    Pagamento Confirmado! 🎉
                  </h1>
                  <p className="text-muted-foreground mb-8">
                    Seu acesso foi liberado. Aproveite todos os recursos da plataforma!
                  </p>
                </motion.div>

                {/* Trust badges */}
                <div className="flex justify-center gap-4 mb-8">
                  {[
                    { icon: Shield, text: "Dados protegidos" },
                    { icon: Sparkles, text: "Acesso ilimitado" },
                  ].map((b, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <b.icon className="w-3.5 h-3.5 text-primary" />
                      {b.text}
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Link to="/dashboard">
                    <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/20 h-12" size="lg">
                      <Calendar className="w-4 h-4 mr-2" />
                      Ir para o Dashboard
                    </Button>
                  </Link>
                  <Link to="/dashboard/schedule">
                    <Button variant="outline" className="w-full h-11 border-primary/20 hover:bg-primary/5" size="lg">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Agendar Consulta
                    </Button>
                  </Link>
                  <Link to="/">
                    <Button variant="ghost" className="w-full" size="sm">
                      <Home className="w-4 h-4 mr-2" />
                      Voltar ao Início
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
