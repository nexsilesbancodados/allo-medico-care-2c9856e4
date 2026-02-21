import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

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

  // Keep ref in sync without triggering effect
  useEffect(() => {
    onEndCallRef.current = onEndCall;
  }, [onEndCall]);

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
            toolbarButtons: [
              "microphone",
              "camera",
              "desktop",
              "fullscreen",
              "chat",
              "raisehand",
              "tileview",
              "settings",
              "filmstrip",
            ],
            notifications: [],
            disableRemoteMute: true,
            remoteVideoMenu: {
              disableKick: true,
              disableGrantModerator: true,
            },
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            TOOLBAR_ALWAYS_VISIBLE: true,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            HIDE_INVITE_MORE_HEADER: true,
            SHARING_FEATURES: [],
            TOOLBAR_BUTTONS: [],
          },
        });

        apiRef.current.addListener("videoConferenceJoined", () => {
          setLoading(false);
        });

        apiRef.current.addListener("readyToClose", () => {
          onEndCallRef.current();
        });
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
  }, [appointmentId, userName]);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="relative flex-1 w-full min-h-0">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">Carregando videochamada...</p>
            </div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>

      <div className="flex items-center justify-center py-3 bg-background border-t border-border">
        <Button
          onClick={onEndCall}
          className="rounded-full px-8 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg transition-transform hover:scale-105 gap-2"
        >
          <Phone className="w-5 h-5 rotate-[135deg]" />
          Finalizar Atendimento
        </Button>
      </div>
    </div>
  );
};

export default VideoConsultation;
