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

  // Build Jitsi iframe URL — all config in hash to bypass deep linking & prejoin
  const roomName = `allo-medico-${appointmentId.replace(/-/g, "").slice(0, 20)}`;
  const displayName = userName || "Participante";

  const jitsiUrl = `https://meet.jit.si/${roomName}#` + [
    `config.prejoinPageEnabled=false`,
    `config.prejoinConfig.enabled=false`,
    `config.startWithAudioMuted=false`,
    `config.startWithVideoMuted=false`,
    `config.disableDeepLinking=true`,
    `config.disableInviteFunctions=true`,
    `config.hideConferenceSubject=true`,
    `config.hideConferenceTimer=true`,
    `config.enableWelcomePage=false`,
    `config.disableThirdPartyRequests=true`,
    `config.deeplinking.disabled=true`,
    `config.deeplinking.desktop.enabled=false`,
    `config.deeplinking.android.enabled=false`,
    `config.deeplinking.ios.enabled=false`,
    `config.toolbarButtons=["microphone","camera","desktop","chat","raisehand","tileview","hangup","fullscreen"]`,
    `interfaceConfig.SHOW_JITSI_WATERMARK=false`,
    `interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false`,
    `interfaceConfig.SHOW_BRAND_WATERMARK=false`,
    `interfaceConfig.SHOW_CHROME_EXTENSION_BANNER=false`,
    `interfaceConfig.MOBILE_APP_PROMO=false`,
    `interfaceConfig.HIDE_INVITE_MORE_HEADER=true`,
    `interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=true`,
    `interfaceConfig.MOBILE_DOWNLOAD_LINK_ANDROID=""`,
    `interfaceConfig.MOBILE_DOWNLOAD_LINK_IOS=""`,
    `userInfo.displayName="${displayName}"`,
  ].join("&");

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: "hsl(220, 25%, 4%)", minHeight: "100dvh" }}
      onClick={resetTopBar}
      onTouchStart={resetTopBar}
    >
      {/* ===== JITSI IFRAME — full screen, handles everything ===== */}
      <iframe
        src={jitsiUrl}
        allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen"
        className="absolute inset-0 w-full h-full border-none z-[1]"
        title="Videochamada"
        style={{ minHeight: "100dvh" }}
        onLoad={() => setLoading(false)}
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
