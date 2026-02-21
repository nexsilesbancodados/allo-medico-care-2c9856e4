import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardList, Loader2, Search, FileText, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

const SUPABASE_URL = "https://oaixgmuocuwhsabidpei.supabase.co";

interface Props {
  primaryRole: string;
}

const AISummaryTab = ({ primaryRole }: Props) => {
  const { user } = useAuth();
  const [patientSearch, setPatientSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [result, setResult] = useState("");
  const [patientData, setPatientData] = useState<any>(null);

  const fetchPatientData = useCallback(async () => {
    if (!patientSearch.trim() || !user) return;
    setIsFetching(true);
    setPatientData(null);
    setResult("");

    try {
      // Search for patient by name
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, date_of_birth, blood_type, allergies, chronic_conditions")
        .or(`first_name.ilike.%${patientSearch}%,last_name.ilike.%${patientSearch}%`)
        .limit(1);

      if (!profiles || profiles.length === 0) {
        setPatientData({ error: "Paciente não encontrado" });
        setIsFetching(false);
        return;
      }

      const patient = profiles[0];

      // Fetch medical records
      const { data: records } = await supabase
        .from("medical_records")
        .select("title, record_type, description, cid_code, severity, start_date, is_active")
        .eq("patient_id", patient.user_id)
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch recent appointments
      const { data: appointments } = await supabase
        .from("appointments")
        .select("scheduled_at, status, notes, duration_minutes")
        .eq("patient_id", patient.user_id)
        .order("scheduled_at", { ascending: false })
        .limit(10);

      // Fetch prescriptions
      const { data: prescriptions } = await supabase
        .from("prescriptions")
        .select("diagnosis, medications, observations, created_at")
        .eq("patient_id", patient.user_id)
        .order("created_at", { ascending: false })
        .limit(5);

      setPatientData({
        patient,
        records: records || [],
        appointments: appointments || [],
        prescriptions: prescriptions || [],
      });
    } catch (e) {
      console.error(e);
      setPatientData({ error: "Erro ao buscar dados" });
    }
    setIsFetching(false);
  }, [patientSearch, user]);

  const generateSummary = useCallback(async () => {
    if (!patientData || patientData.error) return;
    setIsLoading(true);
    setResult("");

    const { patient, records, appointments, prescriptions } = patientData;

    const prompt = `Gere um resumo clínico estruturado do seguinte paciente:

**Paciente:** ${patient.first_name} ${patient.last_name}
**Data de Nascimento:** ${patient.date_of_birth || "Não informada"}
**Tipo Sanguíneo:** ${patient.blood_type || "Não informado"}
**Alergias:** ${patient.allergies?.join(", ") || "Nenhuma registrada"}
**Condições Crônicas:** ${patient.chronic_conditions?.join(", ") || "Nenhuma registrada"}

**Registros Médicos (${records.length}):**
${records.map((r: any) => `- ${r.record_type}: ${r.title} ${r.cid_code ? `(CID: ${r.cid_code})` : ""} - ${r.severity || ""} - ${r.is_active ? "Ativo" : "Inativo"}`).join("\n") || "Nenhum registro"}

**Últimas Consultas (${appointments.length}):**
${appointments.map((a: any) => `- ${a.scheduled_at}: ${a.status} ${a.notes ? `- ${a.notes}` : ""}`).join("\n") || "Nenhuma consulta"}

**Prescrições Recentes (${prescriptions.length}):**
${prescriptions.map((p: any) => `- ${p.created_at}: ${p.diagnosis || "Sem diagnóstico"} - Medicamentos: ${JSON.stringify(p.medications)}`).join("\n") || "Nenhuma prescrição"}

Estruture o resumo com:
1. 📊 **Dados Demográficos**
2. 🏥 **Histórico Médico Ativo**
3. 💊 **Medicamentos em Uso**
4. 📅 **Consultas Recentes**
5. ⚠️ **Alertas e Pontos de Atenção**
6. 📋 **Recomendações para Próxima Consulta**`;

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
          context: "Resumo de prontuário médico",
        }),
      });

      if (!resp.ok) throw new Error("Erro no resumo");
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
      setResult("😕 Erro ao gerar resumo. Tente novamente.");
    }
    setIsLoading(false);
  }, [patientData, primaryRole]);

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            Resumo Inteligente de Prontuário
          </CardTitle>
          <CardDescription className="text-xs">
            Busque um paciente para gerar um resumo estruturado do histórico médico com IA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchPatientData()}
              placeholder="Buscar paciente pelo nome..."
              className="text-sm flex-1"
              disabled={isFetching || isLoading}
            />
            <Button onClick={fetchPatientData} disabled={!patientSearch.trim() || isFetching} className="gap-1.5">
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </Button>
          </div>

          {patientData?.error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4" />
              {patientData.error}
            </div>
          )}

          {patientData && !patientData.error && (
            <div className="space-y-3">
              <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                <p className="text-sm font-semibold text-foreground">
                  {patientData.patient.first_name} {patientData.patient.last_name}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {patientData.records.length} registros
                  </span>
                  <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                    {patientData.appointments.length} consultas
                  </span>
                  <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                    {patientData.prescriptions.length} prescrições
                  </span>
                </div>
              </div>

              <Button onClick={generateSummary} disabled={isLoading} className="gap-1.5">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Gerar Resumo com IA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">📋 Resumo do Prontuário</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AISummaryTab;
