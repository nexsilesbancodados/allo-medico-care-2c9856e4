import { logError } from "@/lib/logger";
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, AlertTriangle, ArrowRight, RotateCcw, Loader2, ThermometerSun, Clock, MapPin, Copy, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { AI_URL } from "@/lib/ai";
import { SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase-config";

const SEVERITY_OPTIONS = [
  { value: "leve", label: "🟢 Leve", description: "Desconforto tolerável", color: "border-green-500/30 bg-green-500/5" },
  { value: "moderado", label: "🟡 Moderado", description: "Interfere nas atividades", color: "border-yellow-500/30 bg-yellow-500/5" },
  { value: "intenso", label: "🟠 Intenso", description: "Dor forte", color: "border-orange-500/30 bg-orange-500/5" },
  { value: "muito_intenso", label: "🔴 Muito Intenso", description: "Incapacitante", color: "border-red-500/30 bg-red-500/5" },
];

const DURATION_OPTIONS = [
  { value: "horas", label: "Algumas horas" },
  { value: "1-3dias", label: "1 a 3 dias" },
  { value: "dias", label: "4 a 7 dias" },
  { value: "semanas", label: "1 a 4 semanas" },
  { value: "meses", label: "Mais de 1 mês" },
];

const COMMON_SYMPTOMS = [
  "Dor de cabeça", "Febre", "Tosse", "Dor de garganta", "Enjoo",
  "Dor abdominal", "Dor nas costas", "Falta de ar", "Tontura",
  "Cansaço excessivo", "Dor no peito", "Insônia", "Diarreia",
  "Dor muscular", "Coceira na pele", "Visão embaçada",
];

interface TriageResult {
  content: string;
}

const AITriageTab = () => {
  const [symptoms, setSymptoms] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState("");
  const [duration, setDuration] = useState("");
  const [age, setAge] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const allSymptoms = [
    ...selectedSymptoms,
    ...(symptoms.trim() ? [symptoms.trim()] : []),
  ].join(", ");

  const runTriage = useCallback(async () => {
    if (!allSymptoms) return;
    setIsLoading(true);
    setResult(null);

    const prompt = `Faça uma triagem dos seguintes sintomas e sugira a especialidade médica mais adequada:

**Sintomas:** ${allSymptoms}
**Intensidade:** ${severity || "Não informada"}
**Duração:** ${duration || "Não informada"}
${age ? `**Idade:** ${age} anos` : ""}

Responda com:
1. 🚨 **Nível de urgência** (Verde/Amarelo/Laranja/Vermelho) — com explicação
2. 🩺 **Especialidade recomendada** (até 3 opções ranqueadas)
3. 📋 **Possíveis causas** (sem diagnosticar, liste 3-5 possibilidades)
4. ⚠️ **Sinais de alerta** para ir ao pronto-socorro imediatamente
5. 💡 **Cuidados imediatos** enquanto aguarda a consulta
6. 🔍 **Exames que o médico pode solicitar**

IMPORTANTE: Não dê diagnóstico. Sempre recomende consultar um médico.`;

    try {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
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
      logError("AI tab error", e);
      setResult({ content: "😕 Erro ao processar triagem. Tente novamente." });
    }
    setIsLoading(false);
  }, [allSymptoms, severity, duration, age]);

  const reset = () => {
    setSymptoms("");
    setSelectedSymptoms([]);
    setSeverity("");
    setDuration("");
    setAge("");
    setResult(null);
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Resultado copiado!");
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
            Selecione ou descreva sintomas para receber orientação sobre especialidade.
            <span className="text-destructive font-medium"> Não substitui consulta médica.</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick symptom chips */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Sintomas comuns (clique para selecionar)</label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SYMPTOMS.map((symptom) => {
                const isSelected = selectedSymptoms.includes(symptom);
                return (
                  <motion.button
                    key={symptom}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSymptom(symptom)}
                    className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}
                    disabled={isLoading}
                  >
                    {isSelected && <X className="w-3 h-3 inline mr-1" />}
                    {symptom}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Selected symptoms */}
          {selectedSymptoms.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedSymptoms.map((s) => (
                <Badge key={s} variant="default" className="gap-1 text-xs">
                  {s}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => toggleSymptom(s)} />
                </Badge>
              ))}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Descreva detalhes adicionais
            </label>
            <Textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Ex: A dor piora à noite e melhora com repouso..."
              className="min-h-[60px] text-sm"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      <span>{opt.label} — <span className="text-muted-foreground text-xs">{opt.description}</span></span>
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

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Idade (anos)</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Ex: 35"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={isLoading}
                min={0}
                max={120}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={runTriage}
              disabled={(!allSymptoms) || isLoading}
              className="gap-1.5"
              size="lg"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Analisar Sintomas
            </Button>
            {(result || selectedSymptoms.length > 0) && (
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
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Resultado da Triagem
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={copyResult} className="gap-1 text-xs">
                  {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
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
