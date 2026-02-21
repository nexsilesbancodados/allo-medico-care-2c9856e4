import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

interface HealthTip {
  id: string;
  title: string;
  content: string;
  icon: string;
  category: string;
}

const HealthTipsCarousel = () => {
  const [tips, setTips] = useState<HealthTip[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchTips = async () => {
      const { data } = await supabase
        .from("health_tips")
        .select("id, title, content, icon, category")
        .eq("is_active", true);
      if (data && data.length > 0) {
        // Shuffle
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setTips(shuffled);
      }
    };
    fetchTips();
  }, []);

  useEffect(() => {
    if (tips.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % tips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [tips.length]);

  if (tips.length === 0) return null;

  const tip = tips[currentIndex];

  return (
    <Card className="border-border/50 bg-muted/30">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-base">{tip.icon}</span>
          <p className="text-xs font-semibold text-foreground">Dica de Saúde</p>
          <div className="flex-1" />
          <div className="flex gap-0.5">
            {tips.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIndex ? "bg-primary" : "bg-muted-foreground/20"}`} />
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm font-medium text-foreground mb-0.5">{tip.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{tip.content}</p>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default HealthTipsCarousel;
