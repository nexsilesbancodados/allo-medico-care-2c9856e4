import { useEffect, useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock, Wifi, WifiOff, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [loading, setLoading] = useState(true);
  const [jitsiFailed, setJitsiFailed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showTopBar, setShowTopBar] = useState(true);
  const topBarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const isMobile = useIsMobile();

  // Deterministic room name from appointmentId — same for doctor & patient
  const roomName = `AlloMedicoConsulta${appointmentId.replace(/-/g, "")}`;
  const displayName = userName || "Participante";

  // Elapsed timer
  useEffect(() => {
    if (!loading) {
      elapsedTimer.current = setInterval(() => setElapsed(p => p + 1), 1000);
    }
    return () => { if (elapsedTimer.current) clearInterval(elapsedTimer.current); };
  }, [loading]);

  // Network status
  useEffect(() => {
    const onOn = () => setIsOnline(true);
    const onOff = () => setIsOnline(false);
    window.addEventListener("online", onOn);
    window.addEventListener("offline", onOff);
    return () => { window.removeEventListener("online", onOn); window.removeEventListener("offline", onOff); };
  }, []);

  // Auto-hide top bar
  const resetTopBar = useCallback(() => {
    setShowTopBar(true);
    if (topBarTimer.current) clearTimeout(topBarTimer.current);
    topBarTimer.current = setTimeout(() => setShowTopBar(false), 6000);
  }, []);

  useEffect(() => {
    resetTopBar();
    return () => { if (topBarTimer.current) clearTimeout(topBarTimer.current); };
  }, [resetTopBar]);

  // Play entry sound
  useEffect(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {}
  }, []);

  // Initialize Jitsi Meet External API
  useEffect(() => {
    if (jitsiApiRef.current) return;

    const loadAndInit = () => {
      const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;
      if (!JitsiMeetExternalAPI || !jitsiContainerRef.current) return;

      // Mobile-optimized toolbar — fewer buttons, bigger targets
      const mobileToolbar = [
        "microphone", "camera", "hangup", "chat",
      ];
      const desktopToolbar = [
        "microphone", "camera", "desktop", "chat",
        "raisehand", "tileview", "hangup", "fullscreen",
      ];

      const api = new JitsiMeetExternalAPI("meet.jit.si", {
        roomName,
        parentNode: jitsiContainerRef.current,
        width: "100%",
        height: "100%",
        userInfo: {
          displayName,
          email: "",
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          prejoinConfig: { enabled: false },
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          disableInviteFunctions: true,
          hideConferenceSubject: true,
          hideConferenceTimer: true,
          enableWelcomePage: false,
          disableThirdPartyRequests: true,
          enableLobbyChat: false,
          hideLobbyButton: true,
          requireDisplayName: false,
          enableInsecureRoomNameWarning: false,
          lobby: { autoKnock: true, enableChat: false },
          notifications: [],
          enableClosePage: false,
          // Mobile-specific optimizations
          disableSimulcast: isMobile, // Reduce bandwidth on mobile
          resolution: isMobile ? 360 : 720, // Lower resolution on mobile
          constraints: {
            video: {
              height: { ideal: isMobile ? 360 : 720, max: isMobile ? 480 : 720 },
              width: { ideal: isMobile ? 640 : 1280, max: isMobile ? 854 : 1280 },
            },
          },
          toolbarButtons: isMobile ? mobileToolbar : desktopToolbar,
          // Disable filmstrip on mobile for fullscreen experience
          filmstrip: { disableStageFilmstrip: isMobile },
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
          MOBILE_APP_PROMO: false,
          HIDE_INVITE_MORE_HEADER: true,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          MOBILE_DOWNLOAD_LINK_ANDROID: "",
          MOBILE_DOWNLOAD_LINK_IOS: "",
          DISABLE_PRESENCE_STATUS: false,
          GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
          APP_NAME: "Allo Médico",
          PROVIDER_NAME: "Allo Médico",
          LANG_DETECTION: false,
          DEFAULT_LANGUAGE: "ptBR",
          // Mobile-optimized toolbar
          TOOLBAR_ALWAYS_VISIBLE: isMobile,
          TOOLBAR_TIMEOUT: isMobile ? 8000 : 4000,
          FILM_STRIP_MAX_HEIGHT: isMobile ? 80 : 120,
          VERTICAL_FILMSTRIP: !isMobile,
          TILE_VIEW_MAX_COLUMNS: isMobile ? 1 : 5,
        },
      });

      api.addEventListener("videoConferenceJoined", () => {
        setLoading(false);
      });

      api.addEventListener("readyToClose", () => {
        onEndCall();
      });

      jitsiApiRef.current = api;
    };

    // Check if script already loaded
    if ((window as any).JitsiMeetExternalAPI) {
      loadAndInit();
      return;
    }

    // Load the Jitsi External API script with 15s timeout (issue #20)
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    const loadTimeout = setTimeout(() => {
      console.error("Jitsi load timeout (15s)");
      setLoading(false);
      setJitsiFailed(true);
    }, 15000);
    script.onload = () => { clearTimeout(loadTimeout); loadAndInit(); };
    script.onerror = () => {
      clearTimeout(loadTimeout);
      console.error("Failed to load Jitsi API");
      setLoading(false);
      setJitsiFailed(true);
    };
    document.head.appendChild(script);

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [roomName, displayName, isMobile]);

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none touch-none"
      style={{ background: "hsl(220, 25%, 4%)", minHeight: "100dvh" }}
      onClick={resetTopBar}
      onTouchStart={resetTopBar}
    >
      {/* ===== JITSI CONTAINER — External API renders here ===== */}
      <div
        ref={jitsiContainerRef}
        className="absolute inset-0 w-full h-full z-[1]"
        style={{ minHeight: "100dvh" }}
      />

      {/* Jitsi fallback (issue #20) */}
      {jitsiFailed && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/95 gap-4 p-6 text-center">
          <Phone className="w-12 h-12 text-destructive" />
          <h3 className="text-lg font-bold text-foreground">Não foi possível iniciar a videochamada</h3>
          <p className="text-sm text-muted-foreground max-w-sm">O servidor de vídeo pode estar indisponível. Tente o link direto abaixo.</p>
          <a
            href={`https://meet.jit.si/${roomName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium"
          >
            Abrir no Jitsi.org
          </a>
          <button onClick={onEndCall} className="text-sm text-muted-foreground underline">Voltar</button>
        </div>
      )}

      {/* ===== TOP STATUS BAR (overlay) ===== */}
      <AnimatePresence>
        {showTopBar && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 md:px-4 py-2 pointer-events-none"
            style={{
              background: "linear-gradient(to bottom, hsla(220,25%,4%,0.7), transparent)",
              paddingTop: "max(env(safe-area-inset-top, 0px), 8px)",
            }}
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-black/40 border-white/10 text-white gap-1.5 font-mono text-xs backdrop-blur-md">
                <Clock className="w-3 h-3" />
                {formatElapsed(elapsed)}
              </Badge>
              <Badge variant="outline" className={`gap-1 text-[10px] backdrop-blur-md ${isOnline ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-red-500/30 text-red-400 bg-red-500/10"}`}>
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isOnline ? "Online" : "Offline"}
              </Badge>
            </div>
            <Badge variant="outline" className="border-emerald-500/20 text-emerald-400/80 text-[10px] gap-1 bg-emerald-500/5 backdrop-blur-md">
              <Shield className="w-3 h-3" />
              E2E
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== LOADING OVERLAY ===== */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center"
            style={{ background: "hsl(220, 25%, 4%)" }}
          >
            <div className="flex flex-col items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-[3px] border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Phone className="w-7 h-7 text-emerald-500" />
                </div>
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-base font-medium text-white">Entrando na sala...</p>
                <p className="text-xs text-white/40">Preparando videochamada</p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-emerald-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== NETWORK WARNING ===== */}
      <AnimatePresence>
        {!isOnline && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-red-500/90 text-white text-xs font-medium flex items-center gap-2 shadow-lg backdrop-blur-sm"
          >
            <WifiOff className="w-4 h-4" />
            Conexão perdida...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoConsultation;
