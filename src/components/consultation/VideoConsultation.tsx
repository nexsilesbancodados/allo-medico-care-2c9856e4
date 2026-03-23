/**
 * VideoConsultation — Componente de vídeo P2P nativo via WebRTC
 * 
 * Renderiza vídeo local + remoto. Expõe controles via props
 * para que VideoRoom orquestre mute/camera/hangup de forma centralizada.
 */

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { UserRound, VideoOff } from "lucide-react";
import { motion } from "framer-motion";
import { useWebRTC, type CallStatus } from "@/hooks/use-webrtc";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

export interface VideoConsultationHandle {
  hangUp: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
  status: CallStatus;
}

interface VideoConsultationProps {
  appointmentId: string;
  userName?: string;
  onEndCall: () => void;
  onStatusChange?: (status: CallStatus) => void;
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

const VideoConsultation = forwardRef<VideoConsultationHandle, VideoConsultationProps>(
  ({ appointmentId, userName, onEndCall, onStatusChange }, ref) => {
    const { user, roles } = useAuth();
    const isMobile = useIsMobile();
    const isDoctor = roles.includes("doctor") || roles.includes("admin");

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

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

    // Expor controles para o VideoRoom
    useImperativeHandle(ref, () => ({
      hangUp,
      toggleMute,
      toggleVideo,
      isMuted,
      isVideoOff,
      status,
    }), [hangUp, toggleMute, toggleVideo, isMuted, isVideoOff, status]);

    // Notificar mudanças de status
    useEffect(() => {
      onStatusChange?.(status);
    }, [status, onStatusChange]);

    // Iniciar chamada automaticamente
    useEffect(() => {
      startCall();
    }, []);

    // Vincular streams aos elementos de vídeo
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

    // Som de entrada
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
        // ignore
      }
    }, []);

    // Se outro lado desligou
    useEffect(() => {
      if (status === "ended") {
        onEndCall();
      }
    }, [status]);

    const isWaiting = status === "idle" || status === "requesting_media" || status === "waiting_peer";
    const isActive = status === "connected" || status === "connecting" || status === "reconnecting";
    const hasRemoteVideo = remoteStream && remoteStream.getVideoTracks().some(t => t.enabled);

    return (
      <div className="relative w-full h-full overflow-hidden" style={{ background: "hsl(220, 25%, 4%)" }}>
        {/* ===== VÍDEO REMOTO — tela cheia ===== */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover z-[1] transition-opacity duration-500 ${
            hasRemoteVideo && isActive ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* ===== Placeholder quando sem vídeo remoto ===== */}
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
          dragElastic={0.1}
          className={`absolute z-10 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 ${
            isMobile ? "bottom-4 right-3 w-24 h-32" : "bottom-4 right-4 w-44 h-32"
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
          <div className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-black/50 text-[10px] text-white font-medium">
            Você
          </div>
        </motion.div>

        {/* ===== Indicador de reconexão ===== */}
        {status === "reconnecting" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-amber-500/90 text-white text-xs font-medium flex items-center gap-2 shadow-lg backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Reconectando...
          </div>
        )}
      </div>
    );
  }
);

VideoConsultation.displayName = "VideoConsultation";

export default VideoConsultation;
