import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const FloatingMobileCTA = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 400px, hide if near top
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,8px)+8px)] pt-3 bg-gradient-to-t from-background via-background/95 to-transparent"
        >
          <div className="flex gap-2">
            <Button
              size="lg"
              className="flex-1 bg-gradient-hero hover:opacity-90 text-primary-foreground rounded-2xl h-12 text-sm font-bold shadow-elevated gap-1.5"
              onClick={() => navigate("/paciente")}
            >
              Agendar Consulta <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-2xl h-12 text-sm shrink-0 px-4"
              onClick={() => navigate("/consulta-avulsa")}
            >
              Avulsa
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingMobileCTA;
