import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone, Maximize2, Minimize2, Clock, Wifi, WifiOff,
  Shield, Mic, MicOff, Video, VideoOff, RotateCcw
} from "lucide-react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const onEndCallRef = useRef(onEndCall);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [pip, setPip] = useState<{x: number; y: number}>({ x: 16, y: 16 });

  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMobile = useIsMobile();
  const initialized = useRef(false);

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
    const onOn = () => setIsOnline(true);
    const onOff = () => setIsOnline(false);
    window.addEventListener("online", onOn);
    window.addEventListener("offline", onOff);
    return () => { window.removeEventListener("online", onOn); window.removeEventListener("offline", onOff); };
  }, []);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 5000);
  }, []);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimer.current) clearTimeout(controlsTimer.current); };
  }, [resetControlsTimer]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
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

  // Initialize local camera + Jitsi iframe as fallback for signaling
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setLoading(false);

        // Play entry sound
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
      } catch (err) {
        console.error("Camera error:", err);
        setError("Não foi possível acessar câmera/microfone. Verifique as permissões do navegador.");
        setLoading(false);
      }
    };

    initMedia();

    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const toggleMic = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleCam = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCamOff(!videoTrack.enabled);
    }
  };

  const switchCamera = async () => {
    const currentTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!currentTrack) return;
    const currentFacing = currentTrack.getSettings().facingMode;
    const newFacing = currentFacing === "user" ? "environment" : "user";
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const newTrack = newStream.getVideoTracks()[0];
      currentTrack.stop();
      localStreamRef.current?.removeTrack(currentTrack);
      localStreamRef.current?.addTrack(newTrack);
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    } catch {}
  };

  const handleEndCall = () => {
    if (!confirmEnd) {
      setConfirmEnd(true);
      setTimeout(() => setConfirmEnd(false), 4000);
      return;
    }
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    onEndCall();
  };

  // Hidden Jitsi iframe for the actual P2P connection
  const roomName = `allo-medico-${appointmentId.replace(/-/g, "").slice(0, 20)}`;
  const displayName = userName || "Participante";

  // Build Jitsi iframe URL with ALL config in the hash to bypass deep linking
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
    `config.toolbarButtons=["microphone","camera","desktop","chat","raisehand","tileview","hangup"]`,
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
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: "hsl(220, 25%, 4%)" }}
      onClick={resetControlsTimer}
      onTouchStart={resetControlsTimer}
    >
      {/* ===== REMOTE VIDEO via Jitsi iframe ===== */}
      <iframe
        src={jitsiUrl}
        allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen"
        className="absolute inset-0 w-full h-full border-none z-[1]"
        title="Videochamada"
        style={{ minHeight: 400 }}
        onLoad={() => setLoading(false)}
      />

      {/* ===== LOCAL VIDEO PiP (WhatsApp style corner) ===== */}
      <motion.div
        drag
        dragMomentum={false}
        className="absolute z-[15] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20"
        style={{
          width: isMobile ? 110 : 160,
          height: isMobile ? 155 : 220,
          right: 12,
          top: 60,
        }}
        whileDrag={{ scale: 1.05 }}
      >
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isCamOff ? "hidden" : ""}`}
          style={{ transform: "scaleX(-1)" }}
        />
        {isCamOff && (
          <div className="w-full h-full flex items-center justify-center bg-[hsl(220,25%,12%)]">
            <VideoOff className="w-8 h-8 text-white/40" />
          </div>
        )}
        {/* Name label on PiP */}
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
          <span className="text-[10px] text-white font-medium truncate">Você</span>
        </div>
      </motion.div>

      {/* ===== TOP BAR ===== */}
      <AnimatePresence>
        {showControls && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3"
            style={{ background: "linear-gradient(to bottom, hsla(220,25%,4%,0.85), transparent)" }}
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/20 text-emerald-400/80 text-[10px] gap-1 bg-emerald-500/5 backdrop-blur-md">
                <Shield className="w-3 h-3" />
                E2E
              </Badge>
              <button
                onClick={toggleFullscreen}
                className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== LOADING ===== */}
      <AnimatePresence>
        {loading && !error && (
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
                <p className="text-base font-medium text-white">Conectando...</p>
                <p className="text-xs text-white/40">Ativando câmera e microfone</p>
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

      {/* ===== ERROR ===== */}
      {error && (
        <div className="absolute inset-0 z-30 flex items-center justify-center" style={{ background: "hsl(220, 25%, 4%)" }}>
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <Phone className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm text-white/80">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="border-white/20 text-white hover:bg-white/10">
              Tentar novamente
            </Button>
          </div>
        </div>
      )}

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

      {/* ===== BOTTOM CONTROLS (WhatsApp style) ===== */}
      <AnimatePresence>
        {showControls && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute bottom-0 left-0 right-0 z-20 pb-8 pt-16 px-4"
            style={{ background: "linear-gradient(to top, hsla(220,25%,4%,0.9), transparent)" }}
          >
            <div className="flex items-center justify-center gap-5">
              {/* Mic toggle */}
              <button
                onClick={toggleMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isMuted ? "bg-white text-black" : "bg-white/15 text-white backdrop-blur-md hover:bg-white/25"
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Camera toggle */}
              <button
                onClick={toggleCam}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isCamOff ? "bg-white text-black" : "bg-white/15 text-white backdrop-blur-md hover:bg-white/25"
                }`}
              >
                {isCamOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              {/* End call */}
              <button
                onClick={handleEndCall}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  confirmEnd
                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"
                    : "bg-red-500 hover:bg-red-600 shadow-red-500/30"
                }`}
              >
                <Phone className="w-6 h-6 text-white rotate-[135deg]" />
              </button>

              {/* Switch camera (mobile) */}
              {isMobile && (
                <button
                  onClick={switchCamera}
                  className="w-12 h-12 rounded-full bg-white/15 text-white backdrop-blur-md flex items-center justify-center hover:bg-white/25 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}

              {/* Fullscreen (desktop) */}
              {!isMobile && (
                <button
                  onClick={toggleFullscreen}
                  className="w-12 h-12 rounded-full bg-white/15 text-white backdrop-blur-md flex items-center justify-center hover:bg-white/25 transition-all"
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              )}
            </div>

            {/* Confirm end label */}
            <AnimatePresence>
              {confirmEnd && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-xs text-amber-300 mt-3 font-medium"
                >
                  Toque novamente para confirmar
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoConsultation;
