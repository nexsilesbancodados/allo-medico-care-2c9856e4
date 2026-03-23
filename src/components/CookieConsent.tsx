import { useState, useEffect, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

const COOKIE_KEY = "aloclinica_cookie_consent";

const CookieConsent = forwardRef<HTMLDivElement>((_props, _ref) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[9998] rounded-2xl bg-card border border-border shadow-elevated p-5"
        >
          <button
            onClick={decline}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground mb-1">Cookies & Privacidade</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Usamos cookies para melhorar sua experiência. Ao aceitar, você concorda com nossa{" "}
                <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>{" "}
                e{" "}
                <Link to="/lgpd" className="text-primary hover:underline">LGPD</Link>.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={accept}
              className="flex-1 rounded-full text-xs font-semibold"
            >
              Aceitar todos
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={decline}
              className="flex-1 rounded-full text-xs font-semibold"
            >
              Apenas essenciais
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

CookieConsent.displayName = "CookieConsent";
export default CookieConsent;
