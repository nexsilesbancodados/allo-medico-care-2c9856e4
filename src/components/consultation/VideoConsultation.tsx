import { useEffect, useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock, Wifi, WifiOff, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [elapsed, setElapsed] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showTopBar, setShowTopBar] = useState(true);
  const topBarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

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
          // These are the critical settings to disable lobby/moderator requirement
          lobby: { autoKnock: true, enableChat: false },
          // Disable all notifications about lobby
          notifications: [],
          // Security settings
          enableClosePage: false,
          // Toolbar
          toolbarButtons: [
            "microphone", "camera", "desktop", "chat",
            "raisehand", "tileview", "hangup", "fullscreen",
          ],
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

    // Load the Jitsi External API script
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => loadAndInit();
    script.onerror = () => {
      console.error("Failed to load Jitsi API");
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [roomName, displayName]);

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
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

      {/* ===== TOP STATUS BAR (overlay) ===== */}
      <AnimatePresence>
        {showTopBar && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, hsla(220,25%,4%,0.7), transparent)" }}
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
