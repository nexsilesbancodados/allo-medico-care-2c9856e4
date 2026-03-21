import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { log } from "@/lib/logger";

interface SpeechToTextProps {
  onTranscript: (text: string) => void;
  className?: string;
  /** Auto-stop after this many ms of silence (default 4000) */
  silenceTimeout?: number;
}

const SpeechToText = ({ onTranscript, className, silenceTimeout = 4000 }: SpeechToTextProps) => {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<ReturnType<typeof Object> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalStopRef = useRef(false);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    intentionalStopRef.current = true;
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  }, [clearSilenceTimer]);

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      log("SpeechToText: silence timeout, stopping");
      stopListening();
      toast.info("🎙️ Ditado encerrado", { description: "Microfone desligado por inatividade." });
    }, silenceTimeout);
  }, [clearSilenceTimer, silenceTimeout, stopListening]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

    const recognition: SpeechRecognition = new SR();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim());
      }
      resetSilenceTimer();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      log("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microfone bloqueado", { description: "Permita o acesso ao microfone nas configurações do navegador." });
      }
      clearSilenceTimer();
      setListening(false);
    };

    recognition.onend = () => {
      if (!intentionalStopRef.current) {
        try { recognition.start(); } catch { setListening(false); }
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      clearSilenceTimer();
      try { recognition.stop(); } catch {};
    };
  }, [onTranscript, resetSilenceTimer, clearSilenceTimer]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (listening) {
      stopListening();
    } else {
      try {
        intentionalStopRef.current = false;
        recognitionRef.current.start();
        setListening(true);
        resetSilenceTimer();
        toast.success("🎙️ Ditado ativado", { description: "Fale e o texto será transcrito. Para automaticamente após silêncio." });
      } catch (e) {
        log("SpeechToText start error:", e);
        toast.error("Não foi possível ativar o ditado");
      }
    }
  }, [listening, stopListening, resetSilenceTimer]);

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant={listening ? "destructive" : "outline"}
      size="sm"
      onClick={toggleListening}
      className={`rounded-full ${className || ""}`}
      aria-label={listening ? "Parar ditado por voz" : "Ativar ditado por voz para preencher prontuário"}
      aria-pressed={listening}
      title={listening ? "Parar ditado" : "Ditar prontuário (voz)"}
    >
      {listening ? (
        <>
          <MicOff className="w-4 h-4 mr-1" aria-hidden="true" />
          <span className="animate-pulse">Ditando...</span>
        </>
      ) : (
        <>
          <Mic className="w-4 h-4 mr-1" aria-hidden="true" />
          Ditar
        </>
      )}
    </Button>
  );
};

export default SpeechToText;
