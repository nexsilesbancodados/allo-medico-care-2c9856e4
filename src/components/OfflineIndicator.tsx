import { useState, useEffect, useCallback, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { useTranslation } from "@/i18n";

const PING_URL = "/favicon.ico";
const RETRY_INTERVAL_MS = 5000;
const CONNECTIVITY_TIMEOUT_MS = 4000;

const getInitialOnlineState = () => {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
};

const createTimeoutSignal = (timeoutMs: number) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => window.clearTimeout(timeoutId),
  };
};

/** Pings the server to confirm real connectivity (not just navigator.onLine) */
const checkRealConnectivity = async (): Promise<boolean> => {
  const { signal, cleanup } = createTimeoutSignal(CONNECTIVITY_TIMEOUT_MS);

  try {
    const res = await fetch(`${PING_URL}?_=${Date.now()}`, {
      method: "HEAD",
      cache: "no-store",
      signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    cleanup();
  }
};

const OfflineIndicator = forwardRef<HTMLDivElement>(function OfflineIndicator(_props, _ref) {
  const [isOffline, setIsOffline] = useState(!getInitialOnlineState());
  const [showReconnected, setShowReconnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { t } = useTranslation();

  const handleOnline = useCallback(async () => {
    const real = await checkRealConnectivity();
    if (real) {
      setIsOffline(false);
      setShowReconnected(true);
      setRetryCount(0);
      window.setTimeout(() => setShowReconnected(false), 3500);
    }
  }, []);

  const handleOffline = useCallback(() => {
    setIsOffline(true);
    setRetryCount(0);
    setShowReconnected(false);
  }, []);

  useEffect(() => {
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [handleOffline, handleOnline]);

  useEffect(() => {
    if (!isOffline) return;

    const interval = window.setInterval(async () => {
      setRetryCount((count) => count + 1);
      const real = await checkRealConnectivity();
      if (real) {
        setIsOffline(false);
        setShowReconnected(true);
        window.setTimeout(() => setShowReconnected(false), 3500);
      }
    }, RETRY_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [isOffline]);

  const springConfig = { type: "spring", stiffness: 320, damping: 28 } as const;

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          key="offline"
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -64, opacity: 0 }}
          transition={springConfig}
          className="fixed top-0 left-0 right-0 z-[9999] bg-destructive text-destructive-foreground py-3 px-4 flex items-center justify-center gap-2.5 text-sm font-semibold shadow-lg"
          role="alert"
          aria-live="assertive"
          aria-label="Sem conexão com a internet"
        >
          <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{t("offline.message")}</span>
          {retryCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs opacity-80 ml-1">
              <RefreshCw className="w-3 h-3 animate-spin" aria-hidden="true" />
              {t("offline.retrying")}
              {retryCount > 1 && <span className="tabular-nums">({retryCount})</span>}
            </span>
          )}
        </motion.div>
      )}

      {showReconnected && !isOffline && (
        <motion.div
          key="reconnected"
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -64, opacity: 0 }}
          transition={springConfig}
          className="fixed top-0 left-0 right-0 z-[9999] bg-success text-success-foreground py-3 px-4 flex items-center justify-center gap-2.5 text-sm font-semibold shadow-lg"
          role="status"
          aria-live="polite"
        >
          <Wifi className="w-4 h-4 shrink-0" aria-hidden="true" />
          {t("offline.reconnected")}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default OfflineIndicator;
