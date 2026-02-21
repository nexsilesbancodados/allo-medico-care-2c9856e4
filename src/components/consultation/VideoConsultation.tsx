import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Maximize2, Minimize2, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface VideoConsultationProps {
  appointmentId: string;
  userName?: string;
  onEndCall: () => void;
}

const JITSI_DOMAIN = "meet.jit.si";

const VideoConsultation = ({ appointmentId, userName, onEndCall }: VideoConsultationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const onEndCallRef = useRef(onEndCall);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    onEndCallRef.current = onEndCall;
  }, [onEndCall]);

  // Auto-hide controls after 4s on mobile
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

  // Fullscreen toggle
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

  useEffect(() => {
    const loadJitsiScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Jitsi script"));
        document.head.appendChild(script);
      });
    };

    const initJitsi = async () => {
      try {
        await loadJitsiScript();
        if (!containerRef.current) return;

        const roomName = `Telemed_Consulta_${appointmentId}`;

        const mobileToolbar = [
          "microphone",
          "camera",
          "chat",
          "raisehand",
          "tileview",
          "fullscreen",
        ];

        const desktopToolbar = [
          "microphone",
          "camera",
          "desktop",
          "fullscreen",
          "chat",
          "raisehand",
          "tileview",
          "settings",
          "filmstrip",
          "select-background",
        ];

        apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: {
            displayName: userName || "Participante",
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
            prejoinPageEnabled: false,
            disableInviteFunctions: true,
            disableThirdPartyRequests: true,
            enableClosePage: false,
            hideConferenceSubject: false,
            // Quality settings
            resolution: isMobile ? 480 : 720,
            constraints: {
              video: {
                height: { ideal: isMobile ? 480 : 720, max: 1080, min: 240 },
                width: { ideal: isMobile ? 640 : 1280 },
              },
            },
            enableLayerSuspension: true,
            // Better audio
            disableAP: false,
            disableAEC: false,
            disableNS: false,
            disableAGC: false,
            disableHPF: false,
            stereo: false,
            // P2P optimization for 1:1
            p2p: {
              enabled: true,
              preferH264: true,
              disableH264: false,
              useStunTurn: true,
            },
            // Bandwidth
            channelLastN: 2,
            lastNLimits: {
              2: 2,
              5: 4,
            },
            toolbarButtons: isMobile ? mobileToolbar : desktopToolbar,
            notifications: [],
            disableRemoteMute: true,
            remoteVideoMenu: {
              disableKick: true,
              disableGrantModerator: true,
            },
            // Hide Jitsi top bar
            hideConferenceTimer: true,
            hideParticipantsStats: true,
            // Reduce bandwidth on mobile
            enableLipSync: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            TOOLBAR_ALWAYS_VISIBLE: !isMobile,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            HIDE_INVITE_MORE_HEADER: true,
            SHARING_FEATURES: [],
            TOOLBAR_BUTTONS: [],
            DEFAULT_BACKGROUND: "#0a0f1a",
            DISABLE_VIDEO_BACKGROUND: isMobile,
            MOBILE_APP_PROMO: false,
            RECENT_LIST_ENABLED: false,
            filmStripOnly: false,
            VERTICAL_FILMSTRIP: !isMobile,
          },
        });

        apiRef.current.addListener("browserSupport", () => {
          setLoading(false);
        });

        apiRef.current.addListener("videoConferenceJoined", () => {
          setLoading(false);
        });

        apiRef.current.addListener("readyToClose", () => {
          onEndCallRef.current();
        });

        apiRef.current.addListener("participantJoined", () => {
          setParticipantCount(prev => prev + 1);
        });

        apiRef.current.addListener("participantLeft", () => {
          setParticipantCount(prev => Math.max(1, prev - 1));
        });

        // Fallback
        setTimeout(() => setLoading(false), 3000);
      } catch (error) {
        console.error("[Jitsi] Error initializing:", error);
        setLoading(false);
      }
    };

    initJitsi();

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [appointmentId, userName, isMobile]);

  return (
    <div
      className="flex flex-col w-full h-full relative"
      onClick={resetControlsTimer}
      onTouchStart={resetControlsTimer}
    >
      {/* Video container */}
      <div className="relative flex-1 w-full min-h-0 bg-[hsl(220,30%,5%)]">
        {/* Loading overlay */}
        <AnimatePresence>
          {loading && (
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

        {/* Jitsi container */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Participant count badge */}
        {!loading && participantCount > 0 && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[hsl(220,20%,8%,0.75)] backdrop-blur-md border border-[hsl(220,15%,20%)]">
            <div className="w-2 h-2 rounded-full bg-[hsl(150,60%,45%)] animate-pulse" />
            <span className="text-[11px] font-medium text-[hsl(220,20%,85%)]">
              {participantCount} {participantCount === 1 ? "participante" : "participantes"}
            </span>
          </div>
        )}

        {/* Fullscreen toggle */}
        {!loading && (
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
        {showControls && !loading && (
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
