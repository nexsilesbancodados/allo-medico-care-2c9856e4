import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "cookie_consent";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = (level: "all" | "essential") => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ level, accepted_at: new Date().toISOString() }));
    } catch { /* storage blocked */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none">
      <div className="pointer-events-auto max-w-xl mx-auto rounded-2xl border border-border bg-card shadow-lg p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Cookie className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Privacidade e Cookies</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Usamos cookies para melhorar sua experiência. Ao continuar navegando, você concorda com nossa{" "}
              <Link to="/lgpd" className="underline text-primary hover:text-primary/80">Política LGPD</Link> e{" "}
              <Link to="/cookies" className="underline text-primary hover:text-primary/80">Política de Cookies</Link>.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => accept("essential")}>
            Apenas essenciais
          </Button>
          <Button size="sm" className="rounded-xl text-xs" onClick={() => accept("all")}>
            Aceitar todos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
