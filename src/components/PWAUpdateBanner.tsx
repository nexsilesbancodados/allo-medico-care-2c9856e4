import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shows a banner when a new PWA service worker version is available.
 * Uses native Service Worker API — no virtual module dependencies.
 */
const PWAUpdateBanner = () => {
  const [show, setShow] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShow(true);
      }
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setShow(true);
          }
        });
      });
    }).catch(() => {});
  }, []);

  const handleUpdate = () => {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
    setShow(false);
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="fixed top-16 left-3 right-3 z-[70] md:left-auto md:right-4 md:w-96"
          role="alert"
          aria-live="polite"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/15 pointer-events-none" />
            <div className="relative bg-card/97 backdrop-blur-2xl m-[1px] rounded-[15px] p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">Nova versão disponível!</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Atualize para ter as últimas melhorias.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" onClick={handleUpdate}
                    className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 bg-gradient-to-r from-primary to-secondary text-white border-0">
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    Atualizar
                  </Button>
                  <button onClick={() => setShow(false)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
                    aria-label="Dispensar">
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAUpdateBanner;
