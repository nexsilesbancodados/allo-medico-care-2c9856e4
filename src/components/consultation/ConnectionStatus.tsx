import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, RefreshCw, SignalHigh, SignalMedium, SignalLow } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConnectionStatusProps {
  onReconnect: () => void;
}

type NetworkQuality = "good" | "fair" | "poor" | "offline";

const ConnectionStatus = ({ onReconnect }: ConnectionStatusProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnecting, setShowReconnecting] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>("good");
  const [showQualityBadge, setShowQualityBadge] = useState(false);
  const rttHistory = useRef<number[]>([]);

  // Monitor network quality
  useEffect(() => {
    if (!navigator.onLine) {
      setNetworkQuality("offline");
      return;
    }

    const checkQuality = async () => {
      try {
        const start = performance.now();
        await fetch("https://meet.jit.si/oxxhm7NFAT2n/oxxhm7NFAT2n", {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-store",
        });
        const rtt = performance.now() - start;
        
        rttHistory.current.push(rtt);
        if (rttHistory.current.length > 5) rttHistory.current.shift();
        
        const avgRtt = rttHistory.current.reduce((a, b) => a + b, 0) / rttHistory.current.length;

        if (avgRtt < 200) setNetworkQuality("good");
        else if (avgRtt < 500) setNetworkQuality("fair");
        else setNetworkQuality("poor");
      } catch {
        setNetworkQuality("poor");
      }
    };

    checkQuality();
    const interval = setInterval(checkQuality, 15000);
    return () => clearInterval(interval);
  }, [isOnline]);

  // Show quality badge for poor/fair
  useEffect(() => {
    if (networkQuality === "fair" || networkQuality === "poor") {
      setShowQualityBadge(true);
      const timer = setTimeout(() => setShowQualityBadge(false), 8000);
      return () => clearTimeout(timer);
    }
    setShowQualityBadge(false);
  }, [networkQuality]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnecting(true);
      setTimeout(() => {
        onReconnect();
        setShowReconnecting(false);
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkQuality("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onReconnect]);

  const qualityConfig = {
    good: { icon: SignalHigh, color: "hsl(150,60%,45%)", label: "Conexão boa" },
    fair: { icon: SignalMedium, color: "hsl(45,90%,55%)", label: "Conexão instável" },
    poor: { icon: SignalLow, color: "hsl(0,70%,55%)", label: "Conexão fraca" },
    offline: { icon: WifiOff, color: "hsl(0,70%,55%)", label: "Sem internet" },
  };

  const QualityIcon = qualityConfig[networkQuality].icon;

  return (
    <>
      {/* Network quality badge - top right corner */}
      <AnimatePresence>
        {showQualityBadge && isOnline && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-16 right-4 z-[55] flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(220,20%,10%,0.9)] backdrop-blur-md border border-[hsl(220,15%,20%)] shadow-xl"
          >
            <QualityIcon className="w-4 h-4" style={{ color: qualityConfig[networkQuality].color }} />
            <span className="text-xs font-medium" style={{ color: qualityConfig[networkQuality].color }}>
              {qualityConfig[networkQuality].label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline / Reconnecting banner */}
      <AnimatePresence>
        {(!isOnline || showReconnecting) && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-0 left-0 right-0 z-[60] px-4 py-3 flex items-center justify-center gap-3 text-sm font-medium backdrop-blur-md ${
              !isOnline
                ? "bg-destructive/90 text-destructive-foreground"
                : "bg-[hsl(45,90%,55%,0.9)] text-[hsl(45,90%,15%)]"
            }`}
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Sem conexão com a internet</span>
                <Button
                  size="sm"
                  variant="secondary"
                  className="ml-2 h-7 px-3 text-xs rounded-full"
                  onClick={onReconnect}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reconectar
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
    </>
  );
};

export default ConnectionStatus;
