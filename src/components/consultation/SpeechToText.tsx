import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SpeechToTextProps {
  onTranscript: (text: string) => void;
  className?: string;
}

const SpeechToText = ({ onTranscript, className }: SpeechToTextProps) => {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<ReturnType<typeof Object> | null>(null);
  

  useEffect(() => {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: typeof globalThis.SpeechRecognition; webkitSpeechRecognition?: typeof globalThis.SpeechRecognition }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof globalThis.SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
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
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (import.meta.env.DEV) console.error("Speech error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microfone bloqueado", { description: "Permita o acesso ao microfone nas configurações do navegador." });
      }
      setListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if still listening
      if (recognitionRef.current?._shouldRestart) {
        try { recognition.start(); } catch {}
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch {}
    };
  }, [onTranscript]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (listening) {
      recognitionRef.current._shouldRestart = false;
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current._shouldRestart = true;
        recognitionRef.current.start();
        setListening(true);
        toast.success("🎙️ Ditado ativado", { description: "Fale e o texto será transcrito automaticamente." });
      } catch (e) {
        console.error(e);
      }
    }
  }, [listening]);

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant={listening ? "destructive" : "outline"}
      size="sm"
      onClick={toggleListening}
      className={`rounded-full ${className || ""}`}
      title={listening ? "Parar ditado" : "Ditar prontuário (voz)"}
    >
      {listening ? (
        <>
          <MicOff className="w-4 h-4 mr-1" />
          <span className="animate-pulse">Ditando...</span>
        </>
      ) : (
        <>
          <Mic className="w-4 h-4 mr-1" />
          Ditar
        </>
      )}
    </Button>
  );
};

export default SpeechToText;
