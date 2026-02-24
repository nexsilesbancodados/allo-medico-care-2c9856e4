import { useState, useEffect, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const FloatingMobileCTA = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openQuiz = () => {
    // Dispatch event to open SpecialtyQuiz from Index
    window.dispatchEvent(new CustomEvent("open-specialty-quiz"));
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom,8px)+6px)] pt-2 bg-gradient-to-t from-background via-background/95 to-transparent"
        >
          <div className="flex gap-2">
            <Button
              size="lg"
              className="flex-1 bg-gradient-hero hover:opacity-90 text-primary-foreground rounded-2xl h-12 text-sm font-bold shadow-elevated gap-1.5 relative overflow-hidden"
              onClick={() => navigate("/paciente")}
            >
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-2xl animate-ping bg-primary/20 pointer-events-none" style={{ animationDuration: "3s" }} />
              <span className="relative z-10 flex items-center gap-1.5">
                Agendar Consulta <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="rounded-2xl h-12 w-12 shrink-0 border-primary/30"
              onClick={openQuiz}
              aria-label="Triagem de especialidade"
            >
              <Stethoscope className="w-5 h-5 text-primary" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

FloatingMobileCTA.displayName = "FloatingMobileCTA";

export default FloatingMobileCTA;
