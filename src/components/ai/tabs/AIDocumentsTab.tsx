import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Copy, Check, Loader2, Download, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

const SUPABASE_URL = "https://oaixgmuocuwhsabidpei.supabase.co";

const DOC_TYPES = [
  { value: "atestado", label: "Atestado Médico", prompt: "Gere um rascunho de atestado médico" },
  { value: "laudo", label: "Laudo Médico", prompt: "Gere um rascunho de laudo médico" },
  { value: "encaminhamento", label: "Encaminhamento", prompt: "Gere um rascunho de encaminhamento médico" },
  { value: "declaracao", label: "Declaração de Comparecimento", prompt: "Gere um rascunho de declaração de comparecimento" },
  { value: "relatorio", label: "Relatório Clínico", prompt: "Gere um rascunho de relatório clínico" },
  { value: "orientacao", label: "Orientações ao Paciente", prompt: "Gere orientações detalhadas para o paciente" },
];

interface Props {
  primaryRole: string;
}

const AIDocumentsTab = ({ primaryRole }: Props) => {
  const { toast } = useToast();
  const [docType, setDocType] = useState("");
  const [patientName, setPatientName] = useState("");
  const [details, setDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    const selectedDoc = DOC_TYPES.find(d => d.value === docType);
    if (!selectedDoc || !details.trim()) return;
    setIsLoading(true);
    setResult("");

    const prompt = `${selectedDoc.prompt} com as seguintes informações:

**Paciente:** ${patientName || "Não informado"}
**Detalhes:** ${details}

Gere o documento em formato profissional, com:
- Cabeçalho adequado
- Data atual
- Corpo do texto
- Local para assinatura do médico (CRM)

IMPORTANTE: Este é apenas um RASCUNHO para revisão do médico. O documento final deve ser validado e assinado pelo profissional.`;

    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          role: primaryRole,
          context: `Geração de documento: ${selectedDoc.label}`,
        }),
      });

      if (!resp.ok) throw new Error("Erro na geração");
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
              setResult(fullContent);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setResult("😕 Erro ao gerar documento. Tente novamente.");
    }
    setIsLoading(false);
  }, [docType, patientName, details, primaryRole]);

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copiado!" });
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Geração de Documentos com IA
          </CardTitle>
          <CardDescription className="text-xs">
            Gere rascunhos de documentos médicos para revisão e assinatura do profissional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Tipo de Documento</label>
            <Select value={docType} onValueChange={setDocType} disabled={isLoading}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nome do Paciente</label>
            <Input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Nome completo do paciente"
              className="text-sm"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Detalhes / Informações Clínicas</label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Ex: Paciente necessita de repouso por 5 dias devido a virose com febre alta..."
              className="min-h-[80px] text-sm"
              disabled={isLoading}
            />
          </div>

          <Button onClick={generate} disabled={!docType || !details.trim() || isLoading} className="gap-1.5">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Gerar Rascunho
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-primary/20">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-base">📄 Rascunho Gerado</CardTitle>
                <Button variant="ghost" size="sm" onClick={copyResult} className="gap-1.5 text-xs">
                  {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/50">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
                <p className="text-[10px] text-muted-foreground mt-3">
                  ⚠️ Este é um rascunho gerado por IA. O documento final deve ser revisado, validado e assinado pelo médico responsável.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIDocumentsTab;
