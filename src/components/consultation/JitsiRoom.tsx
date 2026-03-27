import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PhoneOff, Loader2 } from "lucide-react";
import { JITSI_BASE_URL } from "@/lib/jitsi";

interface JitsiRoomProps {
  roomId: string;
  displayName: string;
  onEnd: () => void;
}

// JitsiMeetExternalAPI is declared in src/types/globals.d.ts

type JitsiApi = NonNullable<ReturnType<NonNullable<Window["JitsiMeetExternalAPI"]>>>;

const JitsiRoom = ({ roomId, displayName, onEnd }: JitsiRoomProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiApi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load external API script
    const script = document.createElement("script");
    script.src = `${JITSI_BASE_URL}/external_api.js`;
    script.async = true;
    script.onload = () => initJitsi();
    script.onerror = () => {
      // Fallback: use iframe directly
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      apiRef.current?.dispose();
      script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initJitsi = () => {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

    const domain = JITSI_BASE_URL.replace("https://", "").replace("http://", "");

    apiRef.current = new window.JitsiMeetExternalAPI(domain, {
      roomName: roomId,
      parentNode: containerRef.current,
      userInfo: { displayName },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        TOOLBAR_BUTTONS: ["microphone", "camera", "hangup", "chat", "tileview"],
      },
    });

    apiRef.current.addListener("readyToClose", onEnd);
    apiRef.current.addListener("videoConferenceJoined", () => setLoading(false));

    // Fallback timeout
    setTimeout(() => setLoading(false), 5000);
  };

  const hasFallbackIframe = !window.JitsiMeetExternalAPI && !loading;

  return (
    <div className="relative w-full h-full flex flex-col" style={{ background: "hsl(220, 25%, 4%)" }}>
      {/* End call button */}
      <div className="absolute top-3 right-3 z-20">
        <Button
          variant="destructive"
          size="sm"
          onClick={onEnd}
          className="rounded-xl min-h-[44px] min-w-[44px] shadow-lg"
        >
          <PhoneOff className="w-4 h-4 mr-2" />
          Encerrar consulta
        </Button>
      </div>

      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Conectando à sala de vídeo...</p>
          </div>
        </div>
      )}

      {/* Jitsi External API container */}
      <div ref={containerRef} className="flex-1 w-full h-full" />

      {/* Fallback iframe if External API failed to load */}
      {hasFallbackIframe && (
        <iframe
          src={`${JITSI_BASE_URL}/${roomId}?userInfo.displayName=${encodeURIComponent(displayName)}#config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.prejoinPageEnabled=false&config.disableDeepLinking=true&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","hangup","chat","tileview"]`}
          allow="camera; microphone; display-capture; autoplay; clipboard-write"
          className="absolute inset-0 w-full h-full border-0"
          title="Teleconsulta"
        />
      )}
    </div>
  );
};

export default JitsiRoom;
