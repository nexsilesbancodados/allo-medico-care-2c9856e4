/**
 * useWebRTC — Hook nativo de videochamada P2P
 * 
 * Sinalização via Supabase Realtime (broadcast).
 * Sem dependência de Jitsi, Metered, Daily ou qualquer SDK externo.
 * 
 * Fluxo:
 *  1. Médico entra → cria offer → envia via Supabase broadcast
 *  2. Paciente entra → recebe offer → cria answer → envia via broadcast
 *  3. Ambos trocam ICE candidates via broadcast
 *  4. Conexão P2P estabelecida
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/logger";

// ─── ICE Servers ──────────────────────────────────────────────────────────────
const STUN_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

// Placeholder para TURN futuro (ex: coturn, OpenRelay)
const TURN_SERVERS: RTCIceServer[] = [
  // { urls: "turn:turn.example.com:3478", username: "user", credential: "pass" },
];

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [...STUN_SERVERS, ...TURN_SERVERS],
  iceCandidatePoolSize: 10,
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type CallStatus =
  | "idle"
  | "requesting_media"
  | "waiting_peer"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "ended"
  | "failed";

interface SignalPayload {
  type: "offer" | "answer" | "ice-candidate" | "hang-up";
  sender: string;
  data: unknown;
}

interface UseWebRTCOptions {
  roomId: string;
  userId: string;
  isInitiator: boolean; // true = médico (cria offer)
  displayName?: string;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  status: CallStatus;
  isMuted: boolean;
  isVideoOff: boolean;
  toggleMute: () => void;
  toggleVideo: () => void;
  hangUp: () => void;
  startCall: () => Promise<void>;
}

export function useWebRTC({
  roomId,
  userId,
  isInitiator,
}: UseWebRTCOptions): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const hasRemoteDesc = useRef(false);
  const cleanedUp = useRef(false);

  // ─── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (cleanedUp.current) return;
    cleanedUp.current = true;

    // Parar todos os tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);

    // Fechar peer connection
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    // Remover canal Supabase
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setRemoteStream(null);
    setStatus("ended");
  }, []);

  // ─── Enviar sinal via Supabase broadcast ────────────────────────────────────
  const sendSignal = useCallback(
    (payload: SignalPayload) => {
      channelRef.current?.send({
        type: "broadcast",
        event: "webrtc-signal",
        payload,
      });
    },
    []
  );

  // ─── Processar ICE candidates enfileirados ──────────────────────────────────
  const flushIceCandidates = useCallback(async () => {
    if (!pcRef.current || !hasRemoteDesc.current) return;
    for (const candidate of iceCandidateQueue.current) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        logError("addIceCandidate failed", err);
      }
    }
    iceCandidateQueue.current = [];
  }, []);

  // ─── Criar PeerConnection ──────────────────────────────────────────────────
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    // Enviar ICE candidates para o outro peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: "ice-candidate",
          sender: userId,
          data: event.candidate.toJSON(),
        });
      }
    };

    // Receber streams remotos
    const remote = new MediaStream();
    setRemoteStream(remote);

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remote.addTrack(track);
      });
      // Force re-render with new ref
      setRemoteStream(new MediaStream(remote.getTracks()));
    };

    // Monitorar estado da conexão
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      switch (state) {
        case "checking":
          setStatus("connecting");
          break;
        case "connected":
        case "completed":
          setStatus("connected");
          break;
        case "disconnected":
          setStatus("reconnecting");
          break;
        case "failed":
          setStatus("failed");
          // Tentar reconectar via ICE restart
          if (isInitiator && pc.signalingState !== "closed") {
            pc.restartIce();
          }
          break;
        case "closed":
          setStatus("ended");
          break;
      }
    };

    pcRef.current = pc;
    return pc;
  }, [userId, isInitiator, sendSignal]);

  // ─── Receber sinais ─────────────────────────────────────────────────────────
  const handleSignal = useCallback(
    async (payload: SignalPayload) => {
      // Ignorar mensagens próprias
      if (payload.sender === userId) return;

      const pc = pcRef.current;
      if (!pc && payload.type !== "hang-up") return;

      switch (payload.type) {
        case "offer": {
          if (isInitiator) return; // Paciente recebe offer
          try {
            const offer = payload.data as RTCSessionDescriptionInit;
            await pc!.setRemoteDescription(new RTCSessionDescription(offer));
            hasRemoteDesc.current = true;
            await flushIceCandidates();

            const answer = await pc!.createAnswer();
            await pc!.setLocalDescription(answer);

            sendSignal({
              type: "answer",
              sender: userId,
              data: answer,
            });
            setStatus("connecting");
          } catch (err) {
            logError("handleOffer failed", err);
            setStatus("failed");
          }
          break;
        }

        case "answer": {
          if (!isInitiator) return; // Médico recebe answer
          try {
            const answer = payload.data as RTCSessionDescriptionInit;
            await pc!.setRemoteDescription(new RTCSessionDescription(answer));
            hasRemoteDesc.current = true;
            await flushIceCandidates();
            setStatus("connecting");
          } catch (err) {
            logError("handleAnswer failed", err);
          }
          break;
        }

        case "ice-candidate": {
          const candidate = payload.data as RTCIceCandidateInit;
          if (hasRemoteDesc.current && pc) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              logError("addIceCandidate failed", err);
            }
          } else {
            iceCandidateQueue.current.push(candidate);
          }
          break;
        }

        case "hang-up": {
          cleanup();
          break;
        }
      }
    },
    [userId, isInitiator, sendSignal, cleanup, flushIceCandidates]
  );

  // ─── Iniciar chamada ────────────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    cleanedUp.current = false;
    hasRemoteDesc.current = false;
    iceCandidateQueue.current = [];

    setStatus("requesting_media");

    // 1. Obter mídia local
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
    } catch (err) {
      logError("getUserMedia failed", err);
      setStatus("failed");
      return;
    }

    // 2. Criar PeerConnection
    const pc = createPeerConnection();

    // Adicionar tracks locais
    localStreamRef.current!.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // 3. Conectar canal de sinalização Supabase
    const channel = supabase.channel(`webrtc-${roomId}`, {
      config: { broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "webrtc-signal" }, ({ payload }) => {
      handleSignal(payload as SignalPayload);
    });

    await channel.subscribe();
    channelRef.current = channel;

    // 4. Se é iniciador (médico), criar offer
    if (isInitiator) {
      setStatus("waiting_peer");
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        sendSignal({
          type: "offer",
          sender: userId,
          data: offer,
        });
      } catch (err) {
        logError("createOffer failed", err);
        setStatus("failed");
      }
    } else {
      setStatus("waiting_peer");
    }
  }, [roomId, userId, isInitiator, createPeerConnection, handleSignal, sendSignal]);

  // ─── Controles de mídia ─────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((prev) => !prev);
  }, []);

  const toggleVideo = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsVideoOff((prev) => !prev);
  }, []);

  // ─── Desligar chamada ───────────────────────────────────────────────────────
  const hangUp = useCallback(() => {
    sendSignal({ type: "hang-up", sender: userId, data: null });
    cleanup();
  }, [sendSignal, userId, cleanup]);

  // ─── Cleanup ao desmontar ───────────────────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = () => {
      sendSignal({ type: "hang-up", sender: userId, data: null });
      cleanup();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      cleanup();
    };
  }, [cleanup, sendSignal, userId]);

  return {
    localStream,
    remoteStream,
    status,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    hangUp,
    startCall,
  };
}
