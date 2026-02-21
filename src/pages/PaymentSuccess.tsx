import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Calendar, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full"
      >
        <Card className="border-border shadow-elevated">
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Pagamento Confirmado! ✅</h1>
            <p className="text-muted-foreground mb-6">
              Seu pagamento foi processado com sucesso. Você já pode acessar a plataforma.
            </p>

            <div className="space-y-3">
              <Link to="/dashboard">
                <Button className="w-full bg-gradient-hero text-primary-foreground" size="lg">
                  <Calendar className="w-4 h-4 mr-2" />
                  Ir para o Dashboard
                </Button>
              </Link>
              <Link to="/dashboard/appointments">
                <Button variant="outline" className="w-full" size="lg">
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
