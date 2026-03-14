import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWA_DISMISSED_KEY = "pwa-install-dismissed";
const PWA_DISMISSED_UNTIL_KEY = "pwa-install-dismissed-until";

/**
 * PWA Install Banner — shows a native-feeling install prompt on mobile.
 * Respects dismissal for 7 days, and hides after install.
 */
const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useLocalStorage<boolean>(PWA_DISMISSED_KEY, false);
  const [dismissedUntil, setDismissedUntil] = useLocalStorage<number>(PWA_DISMISSED_UNTIL_KEY, 0);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Check if dismissed recently (within 7 days)
    if (dismissed && Date.now() < dismissedUntil) return;

    // iOS detection
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show iOS instructions after 3 seconds
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Chrome — capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2500);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed, dismissedUntil]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShow(false);
      setDismissed(true);
      setDismissedUntil(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    // Snooze for 7 days
    setDismissedUntil(Date.now() + 7 * 24 * 60 * 60 * 1000);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="pwa-install-banner md:hidden"
          role="dialog"
          aria-label="Instalar AloClínica como aplicativo"
        >
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
              <Smartphone className="w-6 h-6 text-white" aria-hidden="true" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">
                Instale o AloClínica
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                {isIOS
                  ? 'Toque em ⎙ e depois "Adicionar à Tela Inicial"'
                  : "Acesse mais rápido. Funciona offline."}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {!isIOS && (
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="h-8 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold gap-1.5 shadow-md shadow-primary/20"
                  aria-label="Instalar aplicativo"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  Instalar
                </Button>
              )}
              <button
                onClick={handleDismiss}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                aria-label="Dispensar convite de instalação"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallBanner;
