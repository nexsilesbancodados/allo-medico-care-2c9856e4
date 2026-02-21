import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

interface VideoConsultationProps {
  appointmentId: string;
  userName?: string;
  onEndCall: () => void;
}

const VideoConsultation = ({ appointmentId, userName, onEndCall }: VideoConsultationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameContainerRef = useRef<HTMLDivElement>(null);
  const onEndCallRef = useRef(onEndCall);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();
  const frameInitialized = useRef(false);

  useEffect(() => {
    onEndCallRef.current = onEndCall;
  }, [onEndCall]);

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
        // 1. Create/get room via edge function
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

        // 2. Load Metered Frame SDK
        await new Promise<void>((resolve, reject) => {
          if ((window as any).MeteredFrame) {
            resolve();
            return;
          }
          const script = document.createElement("script");
          script.src = "https://cdn.metered.ca/sdk/frame/1.4.3/sdk-frame.min.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Metered SDK"));
          document.head.appendChild(script);
        });

        // 3. Initialize frame
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
          },
          frameContainerRef.current
        );

        // Listen for events
        frame.on("participantJoined", () => {
          setLoading(false);
        });

        frame.on("meetingEnded", () => {
          onEndCallRef.current();
        });

        // Fallback: mark loaded after timeout
        setTimeout(() => setLoading(false), 5000);
      } catch (err) {
        console.error("Video init error:", err);
        setError("Erro ao inicializar a videochamada.");
        setLoading(false);
      }
    };

    initRoom();
  }, [appointmentId, userName]);

  return (
    <div
      className="flex flex-col w-full h-full relative"
      onClick={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      ref={containerRef}
    >
      {/* Video container */}
      <div className="relative flex-1 w-full min-h-0 bg-[hsl(220,30%,5%)]">
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
                  <p className="text-sm font-medium text-[hsl(220,20%,85%)]">
                    Conectando à videochamada...
                  </p>
                  <p className="text-xs text-[hsl(220,15%,45%)]">
                    Verifique se câmera e microfone estão permitidos
                  </p>
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
              <Button variant="outline" onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </div>
          </div>
        )}

        {/* Metered Frame container */}
        <div
          ref={frameContainerRef}
          className="w-full h-full"
          style={{ minHeight: "400px" }}
        />

        {/* Fullscreen toggle */}
        {!loading && !error && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-3 right-3 z-20 w-9 h-9 rounded-lg bg-[hsl(220,20%,8%,0.75)] backdrop-blur-md border border-[hsl(220,15%,20%)] flex items-center justify-center text-[hsl(220,20%,70%)] hover:text-white transition-colors"
            title={isFullscreen ? "Sair do fullscreen" : "Tela cheia"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}
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
              onClick={onEndCall}
              className="rounded-full px-8 py-3 h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/25 transition-all hover:scale-105 active:scale-95 gap-2 font-semibold mx-auto flex"
            >
              <Phone className="w-5 h-5 rotate-[135deg]" />
              Finalizar Atendimento
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoConsultation;
