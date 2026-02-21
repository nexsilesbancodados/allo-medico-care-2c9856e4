import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, AlertTriangle, ArrowRight, RotateCcw, Loader2, ThermometerSun, Clock, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

const SUPABASE_URL = "https://oaixgmuocuwhsabidpei.supabase.co";

const SEVERITY_OPTIONS = [
  { value: "leve", label: "Leve", description: "Desconforto tolerável", color: "bg-success/15 text-success" },
  { value: "moderado", label: "Moderado", description: "Interfere nas atividades", color: "bg-warning/15 text-warning" },
  { value: "intenso", label: "Intenso", description: "Dor forte ou incapacitante", color: "bg-destructive/15 text-destructive" },
];

const DURATION_OPTIONS = [
  { value: "horas", label: "Algumas horas" },
  { value: "dias", label: "Alguns dias" },
  { value: "semanas", label: "Semanas" },
  { value: "meses", label: "Meses ou mais" },
];

interface TriageResult {
  content: string;
}

const AITriageTab = () => {
  const [symptoms, setSymptoms] = useState("");
  const [severity, setSeverity] = useState("");
  const [duration, setDuration] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);

  const runTriage = useCallback(async () => {
    if (!symptoms.trim()) return;
    setIsLoading(true);
    setResult(null);

    const prompt = `Faça uma triagem dos seguintes sintomas e sugira a especialidade médica mais adequada:

**Sintomas:** ${symptoms}
**Intensidade:** ${severity || "Não informada"}
**Duração:** ${duration || "Não informada"}

Responda com:
1. 🚨 **Nível de urgência** (Verde/Amarelo/Laranja/Vermelho)
2. 🩺 **Especialidade recomendada**
3. 📋 **Possíveis causas** (sem diagnosticar)
4. ⚠️ **Sinais de alerta** para ir ao pronto-socorro
5. 💡 **Orientações** enquanto aguarda a consulta

IMPORTANTE: Não dê diagnóstico. Sempre recomende consultar um médico.`;

    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          role: "patient",
          context: "Triagem de sintomas - orientação pré-consulta",
        }),
      });

      if (!resp.ok) throw new Error("Erro na triagem");

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setResult({ content: fullContent });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setResult({ content: "😕 Erro ao processar triagem. Tente novamente." });
    }
    setIsLoading(false);
  }, [symptoms, severity, duration]);

  const reset = () => {
    setSymptoms("");
    setSeverity("");
    setDuration("");
    setResult(null);
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" />
            Triagem Inteligente de Sintomas
          </CardTitle>
          <CardDescription className="text-xs">
            Descreva seus sintomas para receber uma orientação sobre qual especialidade procurar. 
            <span className="text-destructive font-medium"> Não substitui consulta médica.</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Descreva seus sintomas</label>
            <Textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Ex: Dor de cabeça na região da testa, acompanhada de enjoo há 3 dias..."
              className="min-h-[80px] text-sm"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <ThermometerSun className="w-3.5 h-3.5 text-muted-foreground" /> Intensidade
              </label>
              <Select value={severity} onValueChange={setSeverity} disabled={isLoading}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <span>{opt.label}</span>
                        <span className="text-xs text-muted-foreground">— {opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Duração
              </label>
              <Select value={duration} onValueChange={setDuration} disabled={isLoading}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={runTriage}
              disabled={!symptoms.trim() || isLoading}
              className="gap-1.5"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Analisar Sintomas
            </Button>
            {result && (
              <Button variant="outline" onClick={reset} className="gap-1.5">
                <RotateCcw className="w-4 h-4" /> Nova Triagem
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Resultado da Triagem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown>{result.content}</ReactMarkdown>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-xs text-destructive font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Em caso de emergência, ligue 192 (SAMU) ou vá ao pronto-socorro mais próximo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AITriageTab;
