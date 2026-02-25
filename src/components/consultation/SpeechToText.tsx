import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Languages } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SpeechToTextProps {
  onTranscript: (text: string) => void;
  className?: string;
  lang?: string;
}

const LANGUAGES = [
  { code: "pt-BR", label: "Português", flag: "🇧🇷" },
  { code: "en-US", label: "English", flag: "🇺🇸" },
  { code: "es-ES", label: "Español", flag: "🇪🇸" },
];

const SpeechToText = ({ onTranscript, className, lang }: SpeechToTextProps) => {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [selectedLang, setSelectedLang] = useState(lang || "pt-BR");
  const [interimText, setInterimText] = useState("");
  const [totalWords, setTotalWords] = useState(0);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const initRecognition = useCallback((langCode: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    // Stop previous instance
    try { recognitionRef.current?.stop(); } catch {}

    const recognition = new SpeechRecognition();
    recognition.lang = langCode;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // Auto-punctuation: capitalize first letter and add period if missing
          let processed = transcript.trim();
          if (processed.length > 0) {
            processed = processed.charAt(0).toUpperCase() + processed.slice(1);
            if (!/[.!?]$/.test(processed)) processed += ".";
          }
          finalTranscript += processed + " ";
        } else {
          interim = transcript;
        }
      }

      setInterimText(interim);

      if (finalTranscript.trim()) {
        const words = finalTranscript.trim().split(/\s+/).length;
        setTotalWords(prev => prev + words);
        onTranscript(finalTranscript.trim());
        setInterimText("");
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
      if (event.error === "not-allowed") {
        toast({ title: "Microfone bloqueado", description: "Permita o acesso ao microfone nas configurações do navegador.", variant: "destructive" });
      } else if (event.error === "network") {
        toast({ title: "Erro de rede", description: "Verifique sua conexão de internet.", variant: "destructive" });
      }
      setListening(false);
      setInterimText("");
    };

    recognition.onend = () => {
      if (recognitionRef.current?._shouldRestart) {
        try { recognition.start(); } catch {}
      } else {
        setListening(false);
        setInterimText("");
      }
    };

    recognitionRef.current = recognition;
  }, [onTranscript, toast]);

  useEffect(() => {
    initRecognition(selectedLang);
    return () => {
      try { recognitionRef.current?.stop(); } catch {}
    };
  }, [selectedLang, initRecognition]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (listening) {
      recognitionRef.current._shouldRestart = false;
      recognitionRef.current.stop();
      setListening(false);
      setInterimText("");
    } else {
      try {
        setTotalWords(0);
        recognitionRef.current._shouldRestart = true;
        recognitionRef.current.start();
        setListening(true);
        toast({ title: "🎙️ Ditado ativado", description: "Fale e o texto será transcrito automaticamente." });
      } catch (e) {
        console.error(e);
      }
    }
  }, [listening, toast]);

  const handleLangChange = (langCode: string) => {
    const wasListening = listening;
    if (wasListening) {
      recognitionRef.current._shouldRestart = false;
      try { recognitionRef.current?.stop(); } catch {}
      setListening(false);
    }
    setSelectedLang(langCode);
    // Restart if was listening
    if (wasListening) {
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current._shouldRestart = true;
          try { recognitionRef.current.start(); setListening(true); } catch {}
        }
      }, 300);
    }
  };

  if (!supported) return null;

  const currentLang = LANGUAGES.find(l => l.code === selectedLang);

  return (
    <div className={`flex items-center gap-1.5 ${className || ""}`}>
      <Button
        type="button"
        variant={listening ? "destructive" : "outline"}
        size="sm"
        onClick={toggleListening}
        className="rounded-full relative"
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
        {listening && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
          </span>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
            <span className="text-sm">{currentLang?.flag}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[140px]">
          {LANGUAGES.map(l => (
            <DropdownMenuItem
              key={l.code}
              onClick={() => handleLangChange(l.code)}
              className={selectedLang === l.code ? "bg-accent" : ""}
            >
              <span className="mr-2">{l.flag}</span>
              <span className="text-xs">{l.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {listening && totalWords > 0 && (
        <Badge variant="secondary" className="text-[10px] h-5">
          {totalWords} palavras
        </Badge>
      )}

      {listening && interimText && (
        <span className="text-[10px] text-muted-foreground italic max-w-[120px] truncate">
          {interimText}
        </span>
      )}
    </div>
  );
};

export default SpeechToText;
