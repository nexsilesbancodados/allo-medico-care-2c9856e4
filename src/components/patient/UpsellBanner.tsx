import { useState, useEffect, memo } from "react";
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
    snooze(user?.id ?? "");
    setShow(false);
  };

  const monthlyPrice = 149;
  const savings = totalSpent - monthlyPrice;

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-secondary/[0.06] overflow-hidden relative shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Ambient glow */}
        <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full blur-2xl opacity-15 bg-primary pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full blur-xl opacity-10 bg-secondary pointer-events-none" aria-hidden="true" />
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1.5 rounded-xl hover:bg-muted/50 transition-colors z-10"
          aria-label="Dispensar"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <CardContent className="p-4 relative">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 ring-1 ring-white/10">
              <Crown className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <p className="text-sm font-extrabold text-foreground mb-1 tracking-tight">
                Economize com o Plano Mensal
              </p>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Você já gastou ~<span className="font-semibold text-foreground">R${totalSpent}</span> em {consultCount} consultas avulsas.
                Com o plano de R${monthlyPrice}/mês, economizaria{" "}
                <span className="font-bold text-success">R${Math.max(0, savings)}</span>.
              </p>
              <div className="flex items-center gap-2.5">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs h-8 px-4 rounded-xl font-bold shadow-md shadow-primary/15 active:scale-[0.96] transition-all"
                  onClick={() => navigate("/dashboard/plans")}
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Ver planos
                </Button>
                <Badge variant="outline" className="text-[10px] text-success border-success/25 font-semibold px-2.5">
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

export default memo(UpsellBanner);
