import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Crown, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const DISMISS_KEY_PREFIX = "upsell-dismissed";
const getDismissKey = (userId: string) => `${DISMISS_KEY_PREFIX}-${userId}`;
const isDismissed = (userId: string) => {
  try {
    const raw = localStorage.getItem(getDismissKey(userId));
    if (!raw) return false;
    const until = Number(raw);
    return !isNaN(until) && Date.now() < until;
  } catch { return false; }
};
const snooze = (userId: string, days = 7) => {
  try {
    localStorage.setItem(getDismissKey(userId), String(Date.now() + days * 86400000));
  } catch {}
};

const UpsellBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [consultCount, setConsultCount] = useState(0);

  useEffect(() => {
    if (!user || isDismissed(user.id)) return;

    const check = async () => {
      // Check if has active subscription
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .single();

      if (sub) return; // Already has plan

      // Count completed consultations
      const { count } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("patient_id", user.id)
        .eq("status", "completed");

      const total = count ?? 0;
      if (total >= 2) {
        // Estimate spend: avg 89 per consultation
        const estimated = total * 89;
        setTotalSpent(estimated);
        setConsultCount(total);
        setShow(true);
      }
    };
    check();
  }, [user]);

  const dismiss = () => {
    localStoragesnooze(user?.id ?? "");
    setShow(false);
  };

  const monthlyPrice = 149;
  const savings = totalSpent - monthlyPrice;

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="border-primary/30 bg-gradient-to-r from-primary/8 via-secondary/5 to-primary/8 overflow-hidden relative">
        <button
          onClick={dismiss}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <CardContent className="p-3.5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-lg">
              <Crown className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-xs font-bold text-foreground mb-0.5">
                Economize com o Plano Mensal
              </p>
              <p className="text-[11px] text-muted-foreground mb-2">
                Você já gastou ~R${totalSpent} em {consultCount} consultas avulsas.
                Com o plano de R${monthlyPrice}/mês, economizaria{" "}
                <span className="font-semibold text-success">R${Math.max(0, savings)}</span>.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary to-secondary text-primary-foreground text-[11px] h-7 px-3 rounded-lg"
                  onClick={() => navigate("/dashboard/plans")}
                >
                  <TrendingUp className="w-3 h-3 mr-1" /> Ver planos
                </Button>
                <Badge variant="outline" className="text-[9px] text-success border-success/30">
                  Consultas ilimitadas
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UpsellBanner;
