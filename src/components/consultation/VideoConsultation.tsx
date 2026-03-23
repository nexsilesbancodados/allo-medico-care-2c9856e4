/**
 * VideoConsultation — Componente de videochamada nativo WebRTC P2P
 * 
 * Sem Jitsi, Metered, Daily ou qualquer SDK externo.
 * Usa useWebRTC para sinalização via Supabase Realtime.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Phone, PhoneOff, Clock, Wifi, WifiOff, Shield, Mic, MicOff,
  Video, VideoOff, Maximize2, Minimize2, UserRound
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWebRTC, type CallStatus } from "@/hooks/use-webrtc";
import { useAuth } from "@/contexts/AuthContext";

interface VideoConsultationProps {
  appointmentId: string;
  userName?: string;
  onEndCall: () => void;
}

const STATUS_LABELS: Record<CallStatus, string> = {
  idle: "Preparando...",
  requesting_media: "Acessando câmera e microfone...",
  waiting_peer: "Aguardando outro participante...",
  connecting: "Conectando...",
  connected: "Conectado",
  reconnecting: "Reconectando...",
  ended: "Chamada encerrada",
  failed: "Falha na conexão",
};

const formatElapsed = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const VideoConsultation = ({ appointmentId, userName, onEndCall }: VideoConsultationProps) => {
  const { user, roles } = useAuth();
  const isMobile = useIsMobile();
  const isDoctor = roles.includes("doctor") || roles.includes("admin");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [elapsed, setElapsed] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showTopBar, setShowTopBar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const topBarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    localStream,
    remoteStream,
    status,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    hangUp,
    startCall,
  } = useWebRTC({
    roomId: appointmentId,
    userId: user?.id || "anonymous",
    isInitiator: isDoctor,
    displayName: userName,
  });

  // ─── Iniciar chamada automaticamente ao montar ───
  useEffect(() => {
    startCall();
  }, []);

  // ─── Vincular streams aos elementos de vídeo ───
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // ─── Timer ───
  useEffect(() => {
    if (status === "connected") {
      elapsedTimer.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    }
    return () => {
      if (elapsedTimer.current) clearInterval(elapsedTimer.current);
    };
  }, [status]);

  // ─── Network status ───
  useEffect(() => {
    const onOn = () => setIsOnline(true);
    const onOff = () => setIsOnline(false);
    window.addEventListener("online", onOn);
    window.addEventListener("offline", onOff);
    return () => {
      window.removeEventListener("online", onOn);
      window.removeEventListener("offline", onOff);
    };
  }, []);

  // ─── Auto-hide top bar ───
  const resetTopBar = useCallback(() => {
    setShowTopBar(true);
    if (topBarTimer.current) clearTimeout(topBarTimer.current);
    topBarTimer.current = setTimeout(() => setShowTopBar(false), 6000);
  }, []);

  useEffect(() => {
    resetTopBar();
    return () => {
      if (topBarTimer.current) clearTimeout(topBarTimer.current);
    };
  }, [resetTopBar]);

  // ─── Fullscreen ───
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // ─── Play entry sound ───
  useEffect(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
    } catch {
      // Silently fail if audio context not available
    }
  }, []);

  // ─── Handle end call ───
  const handleEndCall = useCallback(() => {
    hangUp();
    onEndCall();
  }, [hangUp, onEndCall]);

  // Se a chamada terminou pelo outro lado
  useEffect(() => {
    if (status === "ended" && !isVideoOff) {
      onEndCall();
    }
  }, [status]);

  const isWaiting = status === "idle" || status === "requesting_media" || status === "waiting_peer";
  const isActive = status === "connected" || status === "connecting" || status === "reconnecting";
  const hasRemoteVideo = remoteStream && remoteStream.getVideoTracks().length > 0;

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: "hsl(220, 25%, 4%)", minHeight: "100dvh" }}
      onClick={resetTopBar}
      onTouchStart={resetTopBar}
    >
      {/* ===== VÍDEO REMOTO — tela cheia ===== */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`absolute inset-0 w-full h-full object-cover z-[1] ${
          hasRemoteVideo && isActive ? "opacity-100" : "opacity-0"
        } transition-opacity duration-500`}
      />

      {/* ===== Placeholder quando não há vídeo remoto ===== */}
      {(!hasRemoteVideo || !isActive) && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            <div className="w-28 h-28 rounded-full bg-[hsl(220,20%,12%)] border-2 border-[hsl(220,15%,20%)] flex items-center justify-center">
              <UserRound className="w-14 h-14 text-[hsl(220,15%,40%)]" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-base font-medium text-white">
                {STATUS_LABELS[status]}
              </p>
              {isWaiting && (
                <div className="flex gap-1.5 justify-center">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-emerald-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              )}
              {status === "failed" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startCall()}
                  className="mt-2 border-white/20 text-white hover:bg-white/10"
                >
                  Tentar novamente
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== VÍDEO LOCAL — miniatura PIP ===== */}
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        className={`absolute z-10 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 ${
          isMobile ? "bottom-28 right-3 w-28 h-40" : "bottom-28 right-5 w-48 h-36"
        }`}
      >
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${isVideoOff ? "hidden" : ""}`}
          style={{ transform: "scaleX(-1)" }}
        />
        {isVideoOff && (
          <div className="w-full h-full bg-[hsl(220,20%,12%)] flex items-center justify-center">
            <VideoOff className="w-6 h-6 text-[hsl(220,15%,40%)]" />
          </div>
        )}
        {/* Nome no PIP */}
        <div className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-black/50 text-[10px] text-white font-medium">
          Você
        </div>
      </motion.div>

      {/* ===== TOP STATUS BAR ===== */}
      <AnimatePresence>
        {showTopBar && (
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
              {isActive && (
                <Badge
                  variant="outline"
                  className="bg-black/40 border-white/10 text-white gap-1.5 font-mono text-xs backdrop-blur-md"
                >
                  <Clock className="w-3 h-3" />
                  {formatElapsed(elapsed)}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={`gap-1 text-[10px] backdrop-blur-md ${
                  isOnline
                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                    : "border-red-500/30 text-red-400 bg-red-500/10"
                }`}
              >
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isOnline ? "Online" : "Offline"}
              </Badge>
              {status === "connected" && (
                <Badge
                  variant="outline"
                  className="border-emerald-500/20 text-emerald-400/80 text-[10px] gap-1 bg-emerald-500/5 backdrop-blur-md"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  P2P
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-500/20 text-emerald-400/80 text-[10px] gap-1 bg-emerald-500/5 backdrop-blur-md"
              >
                <Shield className="w-3 h-3" />
                Sem limite
              </Badge>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== BARRA DE CONTROLES INFERIOR ===== */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-3 py-4 px-4"
        style={{
          background: "linear-gradient(to top, hsla(220,25%,4%,0.85), transparent)",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)",
        }}
      >
        {/* Mutar áudio */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full backdrop-blur-md transition-colors ${
            isMuted
              ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
              : "bg-white/10 text-white border border-white/10 hover:bg-white/20"
          }`}
          aria-label={isMuted ? "Ativar microfone" : "Desativar microfone"}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        {/* Desligar vídeo */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full backdrop-blur-md transition-colors ${
            isVideoOff
              ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
              : "bg-white/10 text-white border border-white/10 hover:bg-white/20"
          }`}
          aria-label={isVideoOff ? "Ativar câmera" : "Desativar câmera"}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </Button>

        {/* Encerrar chamada */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEndCall}
          className="w-14 h-14 rounded-full bg-red-600 text-white hover:bg-red-700 border border-red-500/50 shadow-lg shadow-red-900/30"
          aria-label="Encerrar chamada"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>

        {/* Fullscreen */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="w-12 h-12 rounded-full bg-white/10 text-white border border-white/10 hover:bg-white/20 backdrop-blur-md"
            aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
        )}
      </div>

      {/* ===== NETWORK WARNING ===== */}
      <AnimatePresence>
        {!isOnline && isActive && (
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
