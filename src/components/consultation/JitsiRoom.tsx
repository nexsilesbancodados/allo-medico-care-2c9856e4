import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PhoneOff, Loader2, Clock } from "lucide-react";
import { JITSI_BASE_URL, gerarRoomId, getJitsiUrl } from "@/lib/jitsi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface JitsiRoomProps {
  roomId: string;
  displayName: string;
  onEnd: () => void;
}

interface JitsiApi {
  addEventListener: (event: string, callback: () => void) => void;
  addListener: (event: string, callback: () => void) => void;
  dispose: () => void;
}

const JitsiRoom = ({ roomId, displayName, onEnd }: JitsiRoomProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `${JITSI_BASE_URL}/external_api.js`;
    script.async = true;
    script.onload = () => initJitsi();
    script.onerror = () => setLoading(false);
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

    const api = new window.JitsiMeetExternalAPI(domain, {
      roomName: roomId,
      parentNode: containerRef.current,
      userInfo: { displayName },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        enableWelcomePage: false,
        enableClosePage: false,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_BRAND_WATERMARK: false,
        TOOLBAR_BUTTONS: ["microphone", "camera", "hangup", "chat", "tileview", "fullscreen"],
      },
    });

    apiRef.current = api as JitsiApi;
    api.addEventListener("readyToClose", onEnd);
    api.addEventListener("videoConferenceJoined", () => setLoading(false));

    setTimeout(() => setLoading(false), 5000);
  };

  const hasFallbackIframe = !window.JitsiMeetExternalAPI && !loading;

  const timerColor =
    elapsed > 3600
      ? "text-destructive"
      : elapsed > 1800
      ? "text-amber-400"
      : "text-[hsl(150,60%,55%)]";

  return (
    <div className="relative w-full h-full flex flex-col" style={{ background: "hsl(220, 25%, 4%)" }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[hsl(220,25%,6%)] border-b border-[hsl(220,15%,10%)] shrink-0" style={{ height: 60 }}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-[hsl(150,60%,45%)] animate-pulse" />
          <span className="text-xs text-[hsl(220,15%,55%)] truncate">Sala: {roomId}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[hsl(220,20%,8%)] border border-[hsl(220,15%,12%)]">
          <Clock className="w-3 h-3 text-[hsl(220,15%,45%)]" />
          <span className={`text-xs font-mono font-bold tracking-wider ${timerColor}`}>
            {formatTime(elapsed)}
          </span>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl min-h-[44px] min-w-[44px] shadow-lg gap-1.5"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Encerrar consulta</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Encerrar consulta?</AlertDialogTitle>
              <AlertDialogDescription>
                A videochamada será encerrada para todos os participantes. Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onEnd} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Sim, encerrar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Content area */}
      <div className="flex-1 relative" style={{ height: "calc(100% - 60px)" }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Conectando à sala de vídeo...</p>
            </div>
          </div>
        )}

        {/* Jitsi External API container */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Fallback iframe if External API failed to load */}
        {hasFallbackIframe && (
          <iframe
            src={getJitsiUrl(roomId, displayName)}
            allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
            className="absolute inset-0 w-full h-full border-0"
            title="Teleconsulta"
          />
        )}
      </div>
    </div>
  );
};

export default JitsiRoom;
