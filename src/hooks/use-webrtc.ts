/**
 * useWebRTC — Hook nativo de videochamada P2P
 * 
 * Sinalização via Supabase Realtime (broadcast).
 * Sem dependência de Jitsi, Metered, Daily ou qualquer SDK externo.
 * 
 * Compatível com PC e Mobile (iOS Safari, Android Chrome).
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

// TURN gratuito via OpenRelay (Metered.ca) — garante conectividade em NATs restritivos
const TURN_SERVERS: RTCIceServer[] = [
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
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
  type: "offer" | "answer" | "ice-candidate" | "hang-up" | "join";
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
  switchCamera: () => Promise<void>;
  hangUp: () => void;
  startCall: () => Promise<void>;
}

/** Detect mobile from userAgent */
const isMobileDevice = () =>
  typeof navigator !== "undefined" &&
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
  const offerRetryRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const facingModeRef = useRef<"user" | "environment">("user");

  // ─── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (cleanedUp.current) return;
    cleanedUp.current = true;

    if (offerRetryRef.current) {
      clearInterval(offerRetryRef.current);
      offerRetryRef.current = null;
    }

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);

    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

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

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: "ice-candidate",
          sender: userId,
          data: event.candidate.toJSON(),
        });
      }
    };

    const remote = new MediaStream();
    setRemoteStream(remote);

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remote.addTrack(track);
      });
      setRemoteStream(new MediaStream(remote.getTracks()));
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      switch (state) {
        case "checking":
          setStatus("connecting");
          break;
        case "connected":
        case "completed":
          setStatus("connected");
          // Stop re-broadcasting offer once connected
          if (offerRetryRef.current) {
            clearInterval(offerRetryRef.current);
            offerRetryRef.current = null;
          }
          break;
        case "disconnected":
          setStatus("reconnecting");
          break;
        case "failed":
          setStatus("failed");
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
      if (payload.sender === userId) return;

      const pc = pcRef.current;

      switch (payload.type) {
        // When the other peer joins, the initiator re-sends the offer
        case "join": {
          if (isInitiator && lastOfferRef.current && pc) {
            sendSignal({
              type: "offer",
              sender: userId,
              data: lastOfferRef.current,
            });
          }
          break;
        }

        case "offer": {
          if (isInitiator || !pc) return;
          try {
            // Reset if we get a new offer while already having a remote desc
            if (hasRemoteDesc.current && pc.signalingState !== "stable") {
              await pc.setLocalDescription({ type: "rollback" });
            }
            
            const offer = payload.data as RTCSessionDescriptionInit;
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            hasRemoteDesc.current = true;
            await flushIceCandidates();

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

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
          if (!isInitiator || !pc) return;
          try {
            const answer = payload.data as RTCSessionDescriptionInit;
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            hasRemoteDesc.current = true;
            await flushIceCandidates();
            setStatus("connecting");
          } catch (err) {
            logError("handleAnswer failed", err);
          }
          break;
        }

        case "ice-candidate": {
          if (!pc) return;
          const candidate = payload.data as RTCIceCandidateInit;
          if (hasRemoteDesc.current) {
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

  // ─── Get media constraints (adaptive for mobile) ───────────────────────────
  const getMediaConstraints = useCallback((): MediaStreamConstraints => {
    const mobile = isMobileDevice();
    return {
      video: {
        width: { ideal: mobile ? 640 : 1280 },
        height: { ideal: mobile ? 480 : 720 },
        facingMode: facingModeRef.current,
        // Lower frame rate on mobile to save battery
        ...(mobile ? { frameRate: { ideal: 24, max: 30 } } : {}),
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    };
  }, []);

  // ─── Iniciar chamada ────────────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    cleanedUp.current = false;
    hasRemoteDesc.current = false;
    iceCandidateQueue.current = [];
    lastOfferRef.current = null;

    setStatus("requesting_media");

    // 1. Obter mídia local
    try {
      const stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints());
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

    // 4. Se é iniciador (médico), criar offer e re-enviar a cada 3s até conectar
    if (isInitiator) {
      setStatus("waiting_peer");
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        lastOfferRef.current = offer;

        sendSignal({ type: "offer", sender: userId, data: offer });

        // Re-broadcast offer every 3s for late joiners
        offerRetryRef.current = setInterval(() => {
          if (pcRef.current?.iceConnectionState === "connected" || 
              pcRef.current?.iceConnectionState === "completed" ||
              cleanedUp.current) {
            if (offerRetryRef.current) clearInterval(offerRetryRef.current);
            return;
          }
          if (lastOfferRef.current) {
            sendSignal({ type: "offer", sender: userId, data: lastOfferRef.current });
          }
        }, 3000);
      } catch (err) {
        logError("createOffer failed", err);
        setStatus("failed");
      }
    } else {
      setStatus("waiting_peer");
      // Notify the initiator that we're here
      sendSignal({ type: "join", sender: userId, data: null });
    }
  }, [roomId, userId, isInitiator, createPeerConnection, handleSignal, sendSignal, getMediaConstraints]);

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

  // ─── Trocar câmera (front/back) — mobile ───────────────────────────────────
  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current || !pcRef.current) return;

    facingModeRef.current = facingModeRef.current === "user" ? "environment" : "user";

    try {
      // Stop old video tracks
      localStreamRef.current.getVideoTracks().forEach((t) => t.stop());

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingModeRef.current,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      // Replace track in peer connection
      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }

      // Replace track in local stream
      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) {
        localStreamRef.current.removeTrack(oldVideoTrack);
      }
      localStreamRef.current.addTrack(newVideoTrack);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    } catch (err) {
      logError("switchCamera failed", err);
    }
  }, []);

  // ─── Desligar chamada ───────────────────────────────────────────────────────
  const hangUp = useCallback(() => {
    sendSignal({ type: "hang-up", sender: userId, data: null });
    cleanup();
  }, [sendSignal, userId, cleanup]);

  // ─── Cleanup ao desmontar / fechar aba ──────────────────────────────────────
  useEffect(() => {
    const handleLeave = () => {
      sendSignal({ type: "hang-up", sender: userId, data: null });
      cleanup();
    };

    // beforeunload works on desktop
    window.addEventListener("beforeunload", handleLeave);
    // pagehide fires reliably on mobile Safari/Chrome
    window.addEventListener("pagehide", handleLeave);

    // visibilitychange: cleanup when tab is hidden on mobile (e.g. switching apps)
    const handleVisibility = () => {
      // Only cleanup if user leaves the page entirely (not just switching tabs briefly)
      // Mobile browsers may fire this when lock screen activates, so we don't cleanup immediately
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("beforeunload", handleLeave);
      window.removeEventListener("pagehide", handleLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
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
    switchCamera,
    hangUp,
    startCall,
  };
}
