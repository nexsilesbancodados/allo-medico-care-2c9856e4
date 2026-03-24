import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X, ArrowRight } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "aloclinica-checkout-draft";

interface CheckoutDraft {
  step: string;
  plan_id?: string;
  specialty_id?: string;
  specialty_name?: string;
  doctor_id?: string;
  doctor_name?: string;
  scheduled_at?: string;
  saved_at: string;
}

export const saveCheckoutDraft = (draft: Omit<CheckoutDraft, "saved_at">) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, saved_at: new Date().toISOString() }));
  } catch {}
};

export const clearCheckoutDraft = () => {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
};

const CheckoutRecoveryBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: CheckoutDraft = JSON.parse(raw);
      const hours = differenceInHours(new Date(), new Date(parsed.saved_at));
      // Only show if saved within last 24h and has progressed past plan selection
      if (hours <= 24 && parsed.step !== "select") {
        setDraft(parsed);
      } else if (hours > 24) {
        clearCheckoutDraft();
      }
    } catch {
      clearCheckoutDraft();
    }
  }, [user]);

  if (!draft || dismissed) return null;

  const handleResume = () => {
    navigate("/dashboard/plans");
  };

  const handleDismiss = () => {
    setDismissed(true);
    clearCheckoutDraft();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-warning/40 bg-warning/5 overflow-hidden">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-warning/15 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-4 h-4 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Continuar agendamento?
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {draft.doctor_name
                  ? `Consulta com ${draft.doctor_name}`
                  : draft.specialty_name
                  ? `Especialidade: ${draft.specialty_name}`
                  : "Você tinha um agendamento em andamento"
                }
                {draft.scheduled_at && ` · ${format(new Date(draft.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR })}`}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button size="sm" className="h-7 text-xs px-3" onClick={handleResume}>
                Retomar <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleDismiss} aria-label="Fechar">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default memo(CheckoutRecoveryBanner);
