import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Maximize2, Minimize2, Clock, Wifi, WifiOff, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

interface VideoConsultationProps {
  appointmentId: string;
  userName?: string;
  onEndCall: () => void;
}

const formatElapsed = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const VideoConsultation = ({ appointmentId, userName, onEndCall }: VideoConsultationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameContainerRef = useRef<HTMLDivElement>(null);
  const onEndCallRef = useRef(onEndCall);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMobile = useIsMobile();
  const frameInitialized = useRef(false);

  useEffect(() => { onEndCallRef.current = onEndCall; }, [onEndCall]);

  // Elapsed timer
  useEffect(() => {
    if (!loading && !error) {
      elapsedTimer.current = setInterval(() => setElapsed(p => p + 1), 1000);
    }
    return () => { if (elapsedTimer.current) clearInterval(elapsedTimer.current); };
  }, [loading, error]);

  // Network status
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    if (isMobile) {
      controlsTimer.current = setTimeout(() => setShowControls(false), 4000);
    }
  }, [isMobile]);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimer.current) clearTimeout(controlsTimer.current); };
  }, [resetControlsTimer]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.parentElement?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Initialize Metered video room
  useEffect(() => {
    if (frameInitialized.current) return;
    frameInitialized.current = true;

    const initRoom = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("metered-room", {
          body: { appointmentId },
        });

        if (fnError || !data?.roomURL) {
          console.error("Failed to create room:", fnError, data);
          setError("Não foi possível criar a sala de vídeo. Tente novamente.");
          setLoading(false);
          return;
        }

        const roomURL = data.roomURL;

        await new Promise<void>((resolve, reject) => {
          if ((window as any).MeteredFrame) { resolve(); return; }
          const script = document.createElement("script");
          script.src = "https://cdn.metered.ca/sdk/frame/1.4.3/sdk-frame.min.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Metered SDK"));
          document.head.appendChild(script);
        });

        if (!frameContainerRef.current) return;

        const frame = new (window as any).MeteredFrame();
        frame.init(
          {
            roomURL,
            autoJoin: true,
            name: userName || "Participante",
            joinVideoOn: true,
            joinAudioOn: true,
            showInviteBox: false,
            showJoinForm: false,
            showLeaveBtn: false,
          },
          frameContainerRef.current
        );

        frame.on("participantJoined", () => {
          setLoading(false);
          // Play notification sound when other participant joins
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.4);
          } catch {}
        });
        frame.on("meetingEnded", () => onEndCallRef.current());
        setTimeout(() => setLoading(false), 5000);
      } catch (err) {
        console.error("Video init error:", err);
        setError("Erro ao inicializar a videochamada.");
        setLoading(false);
      }
    };

    initRoom();
  }, [appointmentId, userName]);

  const handleEndCall = () => {
    if (!confirmEnd) {
      setConfirmEnd(true);
      setTimeout(() => setConfirmEnd(false), 4000);
      return;
    }
    onEndCall();
  };

  return (
    <div
      className="flex flex-col w-full h-full relative"
      onClick={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      ref={containerRef}
    >
      {/* Video container */}
      <div className="relative flex-1 w-full min-h-0 bg-[hsl(220,30%,5%)]">
        {/* Top bar: timer + status */}
        <AnimatePresence>
          {!loading && !error && showControls && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-[hsl(220,30%,5%,0.85)] to-transparent"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-[hsl(220,20%,10%,0.8)] border-[hsl(220,15%,25%)] text-[hsl(220,20%,85%)] gap-1.5 font-mono text-xs">
                  <Clock className="w-3 h-3" />
                  {formatElapsed(elapsed)}
                </Badge>
                <Badge variant="outline" className={`gap-1 text-[10px] ${isOnline ? "border-emerald-500/30 text-emerald-400" : "border-destructive/30 text-destructive"}`}>
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isOnline ? "Conectado" : "Offline"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/20 text-emerald-400/80 text-[10px] gap-1">
                  <Shield className="w-3 h-3" />
                  Criptografado
                </Badge>
                <button
                  onClick={toggleFullscreen}
                  className="w-8 h-8 rounded-lg bg-[hsl(220,20%,8%,0.75)] backdrop-blur-md border border-[hsl(220,15%,20%)] flex items-center justify-center text-[hsl(220,20%,70%)] hover:text-white transition-colors"
                  title={isFullscreen ? "Sair do fullscreen" : "Tela cheia"}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay */}
        <AnimatePresence>
          {loading && !error && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-[hsl(220,30%,5%)]"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-[hsl(220,20%,85%)]">Conectando à videochamada...</p>
                  <p className="text-xs text-[hsl(220,15%,45%)]">Verifique se câmera e microfone estão permitidos</p>
                </div>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[hsl(220,30%,5%)]">
            <div className="flex flex-col items-center gap-4 text-center px-6">
              <Phone className="w-12 h-12 text-destructive" />
              <p className="text-sm text-[hsl(220,20%,85%)]">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>Tentar novamente</Button>
            </div>
          </div>
        )}

        {/* Network warning */}
        <AnimatePresence>
          {!isOnline && !loading && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-destructive/90 text-destructive-foreground text-xs font-medium flex items-center gap-2 shadow-lg"
            >
              <WifiOff className="w-4 h-4" />
              Conexão perdida. Reconectando...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metered Frame container */}
        <div ref={frameContainerRef} className="w-full h-full metered-container" style={{ minHeight: "400px" }} />
        {/* Hide Metered invite box via CSS override */}
        <style>{`
          .metered-container iframe {
            width: 100% !important;
            height: 100% !important;
          }
          /* Hide invite instructions overlay from Metered SDK */
          [class*="invite"], [class*="Invite"],
          [data-testid*="invite"], [data-testid*="Invite"] {
            display: none !important;
          }
        `}</style>
      </div>

      {/* Bottom control bar */}
      <AnimatePresence>
        {showControls && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`${
              isMobile
                ? "absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[hsl(220,30%,5%)] via-[hsl(220,30%,5%,0.9)] to-transparent pt-12 pb-6 px-4"
                : "flex items-center justify-center py-3 bg-[hsl(220,30%,5%)] border-t border-[hsl(220,15%,15%)]"
            }`}
          >
            <Button
              onClick={handleEndCall}
              className={`rounded-full px-8 py-3 h-12 shadow-lg transition-all hover:scale-105 active:scale-95 gap-2 font-semibold mx-auto flex ${
                confirmEnd
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/25"
                  : "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-destructive/25"
              }`}
            >
              <Phone className="w-5 h-5 rotate-[135deg]" />
              {confirmEnd ? "Confirmar encerramento?" : "Finalizar Atendimento"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoConsultation;
