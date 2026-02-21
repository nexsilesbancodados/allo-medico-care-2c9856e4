import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConnectionStatusProps {
  onReconnect: () => void;
}

const ConnectionStatus = ({ onReconnect }: ConnectionStatusProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnecting, setShowReconnecting] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnecting(true);
      // Auto-reconnect after coming back online
      setTimeout(() => {
        onReconnect();
        setShowReconnecting(false);
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setReconnectCount((prev) => prev + 1);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onReconnect]);

  return (
    <AnimatePresence>
      {(!isOnline || showReconnecting) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-0 left-0 right-0 z-[60] px-4 py-3 flex items-center justify-center gap-3 text-sm font-medium ${
            !isOnline
              ? "bg-destructive text-destructive-foreground"
              : "bg-warning text-warning-foreground"
          }`}
        >
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Sem conexão com a internet. Verificando...</span>
              <Button
                size="sm"
                variant="secondary"
                className="ml-2 h-7 px-3 text-xs"
                onClick={onReconnect}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Tentar reconectar
              </Button>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 animate-pulse" />
              <span>Reconectando à consulta...</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectionStatus;
