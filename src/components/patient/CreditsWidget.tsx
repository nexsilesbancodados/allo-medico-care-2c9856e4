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
  const [history, setHistory] = useState<any[]>([]);
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
    <Card className="border-border/40 overflow-hidden">
      <CardContent className="p-3.5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl ${level.bg} flex items-center justify-center`}>
              <Trophy className={`w-4 h-4 ${level.color}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                Meus Créditos
                <Badge variant="outline" className={`text-[9px] ${level.color} border-current/30`}>
                  {level.name}
                </Badge>
              </p>
              <p className="text-[10px] text-muted-foreground">Use como desconto nas consultas</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-lg font-bold text-foreground">{credits}</span>
          </div>
        </div>

        {/* Progress bar */}
        {nextLevel && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>{level.name}</span>
              <span>{nextLevel.name} ({nextLevel.min} pts)</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              />
            </div>
          </div>
        )}

        {/* Toggle history */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground h-7 justify-between"
          onClick={() => setShowHistory(!showHistory)}
        >
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Histórico
          </span>
          <ChevronRight className={`w-3 h-3 transition-transform ${showHistory ? "rotate-90" : ""}`} />
        </Button>

        <AnimatePresence>
          {showHistory && history.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-1 mt-2">
                {history.slice(0, 5).map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded-lg bg-muted/30">
                    <span className="text-foreground">{reasonLabels[h.reason] || h.reason}</span>
                    <span className={`font-semibold ${Number(h.amount) > 0 ? "text-success" : "text-destructive"}`}>
                      {Number(h.amount) > 0 ? "+" : ""}{h.amount}
                    </span>
                  </div>
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
