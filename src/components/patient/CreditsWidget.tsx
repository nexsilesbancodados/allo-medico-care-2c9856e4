import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Trophy, ChevronRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const levels = [
  { name: "Bronze", min: 0, max: 100, color: "text-amber-700", bg: "bg-amber-700/10" },
  { name: "Prata", min: 100, max: 300, color: "text-slate-400", bg: "bg-slate-400/10" },
  { name: "Ouro", min: 300, max: 1000, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { name: "Diamante", min: 1000, max: Infinity, color: "text-cyan-400", bg: "bg-cyan-400/10" },
];

const CreditsWidget = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  interface CreditEntry { amount: number; reason: string; created_at: string; }
  const [history, setHistory] = useState<CreditEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("user_credits")
        .select("amount, reason, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) {
        setCredits(data.reduce((sum, c) => sum + Number(c.amount), 0));
        setHistory(data);
      }
    };
    fetch();
  }, [user]);

  const level = levels.find(l => credits >= l.min && credits < l.max) || levels[0];
  const nextLevel = levels[levels.indexOf(level) + 1];
  const progress = nextLevel
    ? Math.min(100, ((credits - level.min) / (nextLevel.min - level.min)) * 100)
    : 100;

  const reasonLabels: Record<string, string> = {
    onboarding: "Completou onboarding",
    first_consultation: "Primeira consulta",
    survey: "Avaliou consulta",
    referral_signup: "Indicação (cadastro)",
    referral_consultation: "Indicação (consulta)",
    loyalty: "Bônus fidelidade",
  };

  if (credits === 0 && history.length === 0) return null;

  return (
    <Card className="border-border/30 overflow-hidden relative group hover:shadow-md transition-shadow duration-200">
      {/* Ambient glow */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-10 bg-gradient-to-br from-primary to-secondary pointer-events-none" aria-hidden="true" />
      <CardContent className="p-4 relative">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl ${level.bg} flex items-center justify-center ring-1 ring-border/20 shadow-sm`}>
              <Trophy className={`w-5 h-5 ${level.color}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                Meus Créditos
                <Badge variant="outline" className={`text-[9px] px-2 ${level.color} border-current/20 font-bold`}>
                  {level.name}
                </Badge>
              </p>
              <p className="text-[11px] text-muted-foreground">Use como desconto nas consultas</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/30 px-3 py-1.5 rounded-xl">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-xl font-black text-foreground tabular-nums">{credits}</span>
          </div>
        </div>

        {/* Progress bar */}
        {nextLevel && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
              <span className="font-medium">{level.name}</span>
              <span className="font-medium">{nextLevel.name} ({nextLevel.min} pts)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_2s_infinite]" />
              </motion.div>
            </div>
          </div>
        )}

        {/* Toggle history */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground h-8 justify-between hover:bg-muted/30 rounded-xl"
          onClick={() => setShowHistory(!showHistory)}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Histórico de créditos
          </span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${showHistory ? "rotate-90" : ""}`} />
        </Button>

        <AnimatePresence>
          {showHistory && history.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-1.5 mt-2.5">
                {history.slice(0, 5).map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between text-[11px] px-3 py-2 rounded-xl bg-muted/25 border border-border/15"
                  >
                    <span className="text-foreground font-medium">{reasonLabels[h.reason] || h.reason}</span>
                    <span className={`font-bold tabular-nums ${Number(h.amount) > 0 ? "text-success" : "text-destructive"}`}>
                      {Number(h.amount) > 0 ? "+" : ""}{h.amount}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default CreditsWidget;
