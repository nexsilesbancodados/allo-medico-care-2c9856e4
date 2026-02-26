import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { useTranslation } from "@/i18n";

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const goOffline = () => {
      setIsOffline(true);
      setRetryCount(0);
    };
    const goOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setRetryCount(0);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  // Auto-retry ping when offline
  useEffect(() => {
    if (!isOffline) return;
    const interval = setInterval(() => {
      setRetryCount((c) => c + 1);
      // Check if we're back online
      if (navigator.onLine) {
        setIsOffline(false);
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isOffline]);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-destructive text-destructive-foreground py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
        >
          <WifiOff className="w-4 h-4" />
          <span>{t("offline.message")}</span>
          {retryCount > 0 && (
            <span className="flex items-center gap-1 text-xs opacity-80">
              <RefreshCw className="w-3 h-3 animate-spin" />
              {t("offline.retrying")}
            </span>
          )}
        </motion.div>
      )}
      {showReconnected && !isOffline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-success text-success-foreground py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
        >
          <Wifi className="w-4 h-4" />
          {t("offline.reconnected")}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
