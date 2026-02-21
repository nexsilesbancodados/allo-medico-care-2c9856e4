import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, MicOff, Video, VideoOff, Phone, MessageSquare,
  FileText, Clock, Send, X, Monitor, MonitorOff, PhoneCall,
  WifiOff, RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  sender: "patient" | "doctor";
  text: string;
  time: string;
}

type ConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "failed" | "disconnected";

const FALLBACK_ICE: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 2000;

const VideoRoom = () => {
  const { appointmentId } = useParams();
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [appointment, setAppointment] = useState<any>(null);
  const [otherPartyName, setOtherPartyName] = useState("");
  const [loading, setLoading] = useState(true);

  // Media refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // State
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [iceConfig, setIceConfig] = useState<RTCConfiguration>(FALLBACK_ICE);

  // Chat & Notes
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [notes, setNotes] = useState("");

  const isDoctor = roles.includes("doctor") || roles.includes("admin");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iceConfigRef = useRef<RTCConfiguration>(FALLBACK_ICE);

  const connected = connectionStatus === "connected";

  // Keep iceConfigRef in sync
  useEffect(() => {
    iceConfigRef.current = iceConfig;
  }, [iceConfig]);

  // ─── Initialize local media ───
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setMediaReady(true);
      } catch (err: any) {
        console.error("Media error:", err);
        setMediaError(
          err.name === "NotAllowedError"
            ? "Permissão de câmera/microfone negada. Habilite nas configurações do navegador."
            : "Erro ao acessar câmera/microfone. Verifique se estão conectados."
        );
      }
    };
    initMedia();
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ─── Fetch TURN credentials from Metered ───
  useEffect(() => {
    const fetchTurnCredentials = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await supabase.functions.invoke("turn-credentials");
        if (res.data?.iceServers && Array.isArray(res.data.iceServers)) {
          const config = { iceServers: res.data.iceServers };
          setIceConfig(config);
          iceConfigRef.current = config;
          console.log("[TURN] Metered ICE servers loaded:", res.data.iceServers.length, "servers");
        }
      } catch (err) {
        console.warn("[TURN] Failed to fetch, using STUN fallback:", err);
      }
    };
    fetchTurnCredentials();
  }, []);

  useEffect(() => {
    if (appointmentId) fetchAppointment();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [appointmentId]);

  // ─── Timer ───
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ─── Reconnection logic ───
  const attemptReconnect = useCallback(async () => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setConnectionStatus("failed");
      toast({ title: "Conexão perdida", description: "Não foi possível reconectar. Tente recarregar a página.", variant: "destructive" });
      return;
    }

    reconnectAttemptsRef.current++;
    setConnectionStatus("reconnecting");
    console.log(`[WebRTC] Reconnect attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`);

    // Close existing connection
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    pendingCandidatesRef.current = [];

    // Wait before retrying
    reconnectTimeoutRef.current = setTimeout(() => {
      if (isDoctor) {
        startCall();
      } else {
        // Patient announces presence again to trigger doctor's offer
        channelRef.current?.send({
          type: "broadcast", event: "peer-joined",
          payload: { userId: user!.id, role: "patient" },
        });
      }
    }, RECONNECT_DELAY_MS);
  }, [isDoctor, user]);

  const manualReconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    attemptReconnect();
  }, [attemptReconnect]);

  // ─── WebRTC Signaling via Supabase Realtime ───
  useEffect(() => {
    if (!appointmentId || !user || !mediaReady) return;

    const roomChannel = supabase.channel(`video-room-${appointmentId}`, {
      config: { broadcast: { self: false } },
    });

    channelRef.current = roomChannel;

    roomChannel
      .on("broadcast", { event: "offer" }, async ({ payload }) => {
        console.log("[WebRTC] Received offer");
        setConnectionStatus("connecting");
        try {
          const pc = getOrCreatePeerConnection();
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          roomChannel.send({ type: "broadcast", event: "answer", payload: { sdp: answer, from: user.id } });
          // Apply pending candidates
          for (const c of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidatesRef.current = [];
        } catch (err) {
          console.error("[WebRTC] Error handling offer:", err);
          attemptReconnect();
        }
      })
      .on("broadcast", { event: "answer" }, async ({ payload }) => {
        console.log("[WebRTC] Received answer");
        try {
          const pc = peerConnectionRef.current;
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            for (const c of pendingCandidatesRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            }
            pendingCandidatesRef.current = [];
          }
        } catch (err) {
          console.error("[WebRTC] Error handling answer:", err);
          attemptReconnect();
        }
      })
      .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
        try {
          const pc = peerConnectionRef.current;
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } else {
            pendingCandidatesRef.current.push(payload.candidate);
          }
        } catch (err) {
          console.warn("[WebRTC] Error adding ICE candidate:", err);
        }
      })
      .on("broadcast", { event: "peer-joined" }, () => {
        setRemoteConnected(true);
        reconnectAttemptsRef.current = 0;
        if (isDoctor) startCall();
      })
      .on("broadcast", { event: "peer-left" }, () => {
        setRemoteConnected(false);
        setConnectionStatus("disconnected");
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      })
      .on("broadcast", { event: "chat-message" }, ({ payload }) => {
        setMessages((prev) => [...prev, payload as ChatMessage]);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          roomChannel.send({ type: "broadcast", event: "peer-joined", payload: { userId: user.id, role: isDoctor ? "doctor" : "patient" } });
        }
      });

    return () => {
      roomChannel.send({ type: "broadcast", event: "peer-left", payload: { userId: user.id } });
      supabase.removeChannel(roomChannel);
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
    };
  }, [appointmentId, user, mediaReady]);

  const getOrCreatePeerConnection = useCallback(() => {
    if (peerConnectionRef.current && peerConnectionRef.current.connectionState !== "closed") {
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection(iceConfigRef.current);
    peerConnectionRef.current = pc;

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log("[WebRTC] Remote track received");
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnectionStatus("connected");
        reconnectAttemptsRef.current = 0;
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { candidate: event.candidate.toJSON(), from: user!.id },
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        console.warn("[WebRTC] ICE connection failed, attempting reconnect...");
        attemptReconnect();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", pc.connectionState);
      switch (pc.connectionState) {
        case "connected":
          setConnectionStatus("connected");
          reconnectAttemptsRef.current = 0;
          toast({ title: "Conectado! 🟢", description: "Videochamada estabelecida com sucesso." });
          break;
        case "disconnected":
          setConnectionStatus("reconnecting");
          // Give it a moment, sometimes it recovers
          reconnectTimeoutRef.current = setTimeout(() => {
            if (peerConnectionRef.current?.connectionState === "disconnected") {
              attemptReconnect();
            }
          }, 3000);
          break;
        case "failed":
          attemptReconnect();
          break;
        case "closed":
          setConnectionStatus("disconnected");
          break;
      }
    };

    return pc;
  }, [user, attemptReconnect]);

  const startCall = useCallback(async () => {
    try {
      setConnectionStatus("connecting");
      const pc = getOrCreatePeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      channelRef.current?.send({
        type: "broadcast",
        event: "offer",
        payload: { sdp: offer, from: user!.id },
      });
    } catch (err) {
      console.error("[WebRTC] Error starting call:", err);
      attemptReconnect();
    }
  }, [getOrCreatePeerConnection, user, attemptReconnect]);

  const fetchAppointment = async () => {
    const { data } = await supabase
      .from("appointments").select("*").eq("id", appointmentId).single();

    if (!data) { setLoading(false); return; }
    setAppointment(data);

    await supabase.from("appointments").update({ status: "in_progress" }).eq("id", appointmentId);

    const otherUserId = isDoctor ? data.patient_id : null;
    const otherDoctorId = !isDoctor ? data.doctor_id : null;

    if (otherUserId) {
      const { data: profile } = await supabase
        .from("profiles").select("first_name, last_name").eq("user_id", otherUserId).single();
      if (profile) setOtherPartyName(`${profile.first_name} ${profile.last_name}`);
    } else if (otherDoctorId) {
      const { data: doc } = await supabase
        .from("doctor_profiles").select("user_id").eq("id", otherDoctorId).single();
      if (doc) {
        const { data: profile } = await supabase
          .from("profiles").select("first_name, last_name").eq("user_id", doc.user_id).single();
        if (profile) setOtherPartyName(`Dr(a). ${profile.first_name} ${profile.last_name}`);
      }
    }

    if (isDoctor) {
      const { data: noteData } = await supabase
        .from("consultation_notes").select("content").eq("appointment_id", appointmentId).single();
      if (noteData) setNotes(noteData.content);
    }

    setLoading(false);
  };

  // ─── Controls ───
  const toggleMic = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMicOn((p) => !p);
  }, []);

  const toggleCam = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCamOn((p) => !p);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (screenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        const sender = peerConnectionRef.current?.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(camTrack);
      }
      if (localVideoRef.current && localStreamRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      setScreenSharing(false);
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screen;
        const screenTrack = screen.getVideoTracks()[0];
        const sender = peerConnectionRef.current?.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(screenTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = screen;
        screenTrack.onended = () => {
          const camTrack = localStreamRef.current?.getVideoTracks()[0];
          if (camTrack) sender?.replaceTrack(camTrack);
          if (localVideoRef.current && localStreamRef.current) localVideoRef.current.srcObject = localStreamRef.current;
          setScreenSharing(false);
        };
        setScreenSharing(true);
      } catch (err) { console.error("Screen share error:", err); }
    }
  }, [screenSharing]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: isDoctor ? "doctor" : "patient",
      text: chatInput.trim(),
      time: format(new Date(), "HH:mm"),
    };
    setMessages((prev) => [...prev, msg]);
    channelRef.current?.send({ type: "broadcast", event: "chat-message", payload: msg });
    setChatInput("");
  };

  const saveNotes = async () => {
    if (!appointmentId || !appointment) return;
    const { data: doc } = await supabase
      .from("doctor_profiles").select("id").eq("user_id", user!.id).single();
    if (!doc) return;

    const { data: existing } = await supabase
      .from("consultation_notes").select("id").eq("appointment_id", appointmentId).single();

    if (existing) {
      await supabase.from("consultation_notes").update({ content: notes }).eq("id", existing.id);
    } else {
      await supabase.from("consultation_notes").insert({
        appointment_id: appointmentId, doctor_id: doc.id, content: notes,
      });
    }
    toast({ title: "Anotações salvas!" });
  };

  const endCall = async () => {
    peerConnectionRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());

    if (isDoctor && notes) await saveNotes();

    await supabase.from("appointments").update({ status: "completed" }).eq("id", appointmentId);
    toast({ title: "Consulta encerrada" });

    if (isDoctor) navigate(`/dashboard/prescribe/${appointmentId}`);
    else navigate("/dashboard/appointments");
  };

  // ─── Connection status badge ───
  const statusConfig: Record<ConnectionStatus, { label: string; color: string; icon?: React.ReactNode }> = {
    idle: { label: "Aguardando participante", color: "bg-muted-foreground" },
    connecting: { label: "Conectando...", color: "bg-yellow-500" },
    connected: { label: "Conectado", color: "bg-emerald-500" },
    reconnecting: { label: "Reconectando...", color: "bg-yellow-500", icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
    failed: { label: "Falha na conexão", color: "bg-destructive", icon: <WifiOff className="w-3 h-3" /> },
    disconnected: { label: "Desconectado", color: "bg-muted-foreground" },
  };

  const currentStatus = statusConfig[connectionStatus];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(210,50%,4%)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[hsl(210,50%,7%)] border-b border-border/15">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-hero flex items-center justify-center shadow-lg">
            <Video className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[hsl(210,20%,95%)]">{otherPartyName || "Consulta"}</p>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${currentStatus.color} animate-pulse`} />
              {currentStatus.icon}
              <p className="text-xs text-[hsl(210,15%,55%)]">{currentStatus.label}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Reconnect button */}
          {(connectionStatus === "failed" || connectionStatus === "disconnected") && (
            <Button
              size="sm"
              variant="outline"
              onClick={manualReconnect}
              className="text-xs border-primary/30 text-primary hover:bg-primary/10"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Reconectar
            </Button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/15 text-destructive border border-destructive/20">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <Clock className="w-3.5 h-3.5" />
            <span className="text-sm font-mono font-semibold">{formatTime(elapsed)}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 relative flex items-center justify-center p-3 md:p-6">
          {/* Remote video / Waiting screen */}
          <div className="w-full max-w-5xl aspect-video rounded-2xl bg-[hsl(210,50%,7%)] border border-border/10 overflow-hidden shadow-2xl relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${!connected ? "hidden" : ""}`}
            />
            {!connected && (
              <div className="absolute inset-0 flex items-center justify-center">
                {mediaError ? (
                  <div className="text-center p-8">
                    <VideoOff className="w-16 h-16 text-destructive/50 mx-auto mb-4" />
                    <p className="text-[hsl(210,20%,70%)] text-sm max-w-sm">{mediaError}</p>
                  </div>
                ) : connectionStatus === "failed" ? (
                  <div className="text-center">
                    <WifiOff className="w-16 h-16 text-destructive/50 mx-auto mb-4" />
                    <p className="text-[hsl(210,20%,75%)] text-sm font-medium mb-2">Falha na conexão</p>
                    <p className="text-[hsl(210,15%,40%)] text-xs mb-4 max-w-xs mx-auto">
                      Não foi possível estabelecer a videochamada. Verifique sua conexão e tente novamente.
                    </p>
                    <Button size="sm" onClick={manualReconnect} className="bg-primary text-primary-foreground">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tentar novamente
                    </Button>
                  </div>
                ) : connectionStatus === "reconnecting" ? (
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 mx-auto mb-4"
                    >
                      <RefreshCw className="w-16 h-16 text-yellow-500/50" />
                    </motion.div>
                    <p className="text-[hsl(210,20%,75%)] text-sm font-medium">Reconectando...</p>
                    <p className="text-[hsl(210,15%,40%)] text-xs mt-2">
                      Tentativa {reconnectAttemptsRef.current}/{MAX_RECONNECT_ATTEMPTS}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="w-28 h-28 rounded-full bg-gradient-hero mx-auto flex items-center justify-center mb-5 shadow-xl"
                    >
                      <PhoneCall className="w-10 h-10 text-primary-foreground" />
                    </motion.div>
                    <p className="text-[hsl(210,20%,75%)] text-sm font-medium">
                      {connectionStatus === "connecting"
                        ? "Estabelecendo conexão..."
                        : `Aguardando ${otherPartyName || "participante"}...`}
                    </p>
                    <p className="text-[hsl(210,15%,40%)] text-xs mt-2 max-w-xs mx-auto">
                      A videochamada iniciará automaticamente quando ambos estiverem na sala
                    </p>
                    {connectionStatus === "idle" && !remoteConnected && (
                      <div className="mt-6 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Self video (PiP) */}
          <motion.div
            drag
            dragConstraints={{ left: -400, right: 0, top: -300, bottom: 0 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-6 right-6 w-40 md:w-48 h-28 md:h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-primary/30 cursor-grab active:cursor-grabbing z-10"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!camOn ? "hidden" : ""}`}
            />
            {!camOn && (
              <div className="w-full h-full bg-[hsl(210,50%,10%)] flex items-center justify-center">
                <VideoOff className="w-6 h-6 text-[hsl(210,15%,45%)]" />
              </div>
            )}
            <div className={`absolute bottom-2 left-2 w-6 h-6 rounded-full flex items-center justify-center ${micOn ? "bg-primary/80" : "bg-destructive/80"}`}>
              {micOn ? <Mic className="w-3 h-3 text-primary-foreground" /> : <MicOff className="w-3 h-3 text-destructive-foreground" />}
            </div>
            {screenSharing && (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[hsl(var(--secondary))]/80 text-secondary-foreground text-[10px] font-semibold">
                Tela
              </div>
            )}
          </motion.div>
        </div>

        {/* Side panel */}
        <AnimatePresence>
          {(showChat || showNotes) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="border-l border-border/15 bg-[hsl(210,50%,6%)] flex flex-col overflow-hidden"
            >
              <div className="p-3 border-b border-border/15 flex items-center justify-between shrink-0">
                <p className="text-sm font-semibold text-[hsl(210,20%,90%)]">
                  {showChat ? "💬 Chat" : "📝 Anotações"}
                </p>
                <button onClick={() => { setShowChat(false); setShowNotes(false); }}>
                  <X className="w-4 h-4 text-[hsl(210,15%,50%)] hover:text-[hsl(210,20%,80%)]" />
                </button>
              </div>

              {showChat && (
                <>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center mt-12">
                        <MessageSquare className="w-8 h-8 text-[hsl(210,15%,25%)] mx-auto mb-2" />
                        <p className="text-xs text-[hsl(210,15%,35%)]">Nenhuma mensagem</p>
                      </div>
                    )}
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.sender === (isDoctor ? "doctor" : "patient") ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                          msg.sender === (isDoctor ? "doctor" : "patient")
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-[hsl(210,30%,15%)] text-[hsl(210,20%,90%)] rounded-bl-sm"
                        }`}>
                          <p>{msg.text}</p>
                          <p className="text-[10px] opacity-50 mt-1">{msg.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-border/15 flex gap-2 shrink-0">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Digite..."
                      className="flex-1 bg-[hsl(210,30%,10%)] border border-border/20 rounded-xl px-3 py-2 text-sm text-[hsl(210,20%,90%)] placeholder:text-[hsl(210,15%,35%)] outline-none focus:border-primary/50 transition-colors"
                    />
                    <Button size="icon" variant="ghost" onClick={sendMessage} className="text-primary hover:bg-primary/20 rounded-xl">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}

              {showNotes && isDoctor && (
                <div className="flex-1 flex flex-col p-3 gap-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anotações da consulta..."
                    className="flex-1 bg-[hsl(210,30%,10%)] border-border/20 text-[hsl(210,20%,90%)] placeholder:text-[hsl(210,15%,35%)] resize-none rounded-xl"
                  />
                  <Button onClick={saveNotes} size="sm" className="bg-gradient-hero text-primary-foreground rounded-xl">
                    Salvar Anotações
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-2 md:gap-3 py-4 bg-[hsl(210,50%,6%)] border-t border-border/15">
        <Button variant="ghost" size="icon"
          className={`rounded-full w-12 h-12 transition-all ${micOn ? "bg-[hsl(210,30%,14%)] text-[hsl(210,20%,90%)] hover:bg-[hsl(210,30%,20%)]" : "bg-destructive text-destructive-foreground"}`}
          onClick={toggleMic} title={micOn ? "Desligar microfone" : "Ligar microfone"}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        <Button variant="ghost" size="icon"
          className={`rounded-full w-12 h-12 transition-all ${camOn ? "bg-[hsl(210,30%,14%)] text-[hsl(210,20%,90%)] hover:bg-[hsl(210,30%,20%)]" : "bg-destructive text-destructive-foreground"}`}
          onClick={toggleCam} title={camOn ? "Desligar câmera" : "Ligar câmera"}
        >
          {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>

        <Button variant="ghost" size="icon"
          className={`rounded-full w-12 h-12 transition-all ${screenSharing ? "bg-[hsl(var(--secondary))] text-secondary-foreground" : "bg-[hsl(210,30%,14%)] text-[hsl(210,20%,90%)] hover:bg-[hsl(210,30%,20%)]"}`}
          onClick={toggleScreenShare} title={screenSharing ? "Parar compartilhamento" : "Compartilhar tela"}
        >
          {screenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </Button>

        <Button variant="ghost" size="icon"
          className={`rounded-full w-12 h-12 transition-all ${showChat ? "bg-primary text-primary-foreground" : "bg-[hsl(210,30%,14%)] text-[hsl(210,20%,90%)] hover:bg-[hsl(210,30%,20%)]"}`}
          onClick={() => { setShowChat(!showChat); setShowNotes(false); }} title="Chat"
        >
          <MessageSquare className="w-5 h-5" />
        </Button>

        {isDoctor && (
          <Button variant="ghost" size="icon"
            className={`rounded-full w-12 h-12 transition-all ${showNotes ? "bg-primary text-primary-foreground" : "bg-[hsl(210,30%,14%)] text-[hsl(210,20%,90%)] hover:bg-[hsl(210,30%,20%)]"}`}
            onClick={() => { setShowNotes(!showNotes); setShowChat(false); }} title="Anotações"
          >
            <FileText className="w-5 h-5" />
          </Button>
        )}

        <div className="w-px h-8 bg-border/15 mx-1" />

        <Button onClick={endCall}
          className="rounded-full w-14 h-14 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg transition-transform hover:scale-105"
          title="Encerrar consulta"
        >
          <Phone className="w-6 h-6 rotate-[135deg]" />
        </Button>
      </div>
    </div>
  );
};

export default VideoRoom;
