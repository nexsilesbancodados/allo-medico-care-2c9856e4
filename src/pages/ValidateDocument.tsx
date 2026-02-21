import { useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Search, Shield, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ValidateDocument = () => {
  const { id: paramId } = useParams<{ id?: string }>();
  const [searchId, setSearchId] = useState(paramId || "");
  const [result, setResult] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (id?: string) => {
    const docId = (id || searchId).trim();
    if (!docId) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);
    setSearched(true);

    const { data, error } = await supabase
      .from("prescriptions")
      .select("id, created_at, diagnosis, medications, doctor_id, patient_id")
      .eq("id", docId)
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Get doctor info
    const { data: doc } = await supabase
      .from("doctor_profiles")
      .select("crm, crm_state, user_id")
      .eq("id", data.doctor_id)
      .maybeSingle();

    let doctorName = "Médico";
    if (doc) {
      const { data: p } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", doc.user_id)
        .maybeSingle();
      if (p) doctorName = `Dr(a). ${p.first_name} ${p.last_name}`;
    }

    setResult({
      ...data,
      doctor_name: doctorName,
      crm: doc?.crm,
      crm_state: doc?.crm_state,
    });
    setLoading(false);
  };

  // Auto-search if paramId
  useState(() => {
    if (paramId) handleSearch(paramId);
  });

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Validador de Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Verifique a autenticidade de receitas e documentos emitidos pela Aloclinica
          </p>
        </div>

        {/* Search */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-3">
            <label className="text-xs font-medium text-foreground">Código do documento</label>
            <div className="flex gap-2">
              <Input
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Cole o código aqui..."
                className="font-mono text-sm"
              />
              <Button onClick={() => handleSearch()} disabled={loading || !searchId.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        {searched && notFound && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-6 text-center space-y-2">
              <XCircle className="w-12 h-12 text-destructive mx-auto" />
              <p className="font-semibold text-destructive">Documento não encontrado</p>
              <p className="text-xs text-muted-foreground">
                Este código não corresponde a nenhum documento registrado na plataforma.
                Verifique o código e tente novamente.
              </p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-10 h-10 text-success shrink-0" />
                <div>
                  <p className="font-bold text-success text-sm">✅ Documento Autêntico</p>
                  <p className="text-xs text-muted-foreground">Emitido pela plataforma Aloclinica</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 rounded-lg bg-background/60">
                  <span className="text-muted-foreground">Médico</span>
                  <span className="font-medium text-foreground">{result.doctor_name}</span>
                </div>
                {result.crm && (
                  <div className="flex justify-between p-2 rounded-lg bg-background/60">
                    <span className="text-muted-foreground">CRM</span>
                    <span className="font-medium text-foreground">{result.crm}/{result.crm_state}</span>
                  </div>
                )}
                <div className="flex justify-between p-2 rounded-lg bg-background/60">
                  <span className="text-muted-foreground">Data de emissão</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(result.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {result.diagnosis && (
                  <div className="flex justify-between p-2 rounded-lg bg-background/60">
                    <span className="text-muted-foreground">Diagnóstico</span>
                    <span className="font-medium text-foreground">{result.diagnosis}</span>
                  </div>
                )}
                <div className="flex justify-between p-2 rounded-lg bg-background/60">
                  <span className="text-muted-foreground">Medicamentos</span>
                  <Badge variant="secondary" className="text-xs">
                    {Array.isArray(result.medications) ? result.medications.length : 0} item(s)
                  </Badge>
                </div>
              </div>

              <div className="text-center pt-2">
                <p className="text-[10px] text-muted-foreground">
                  ID: {result.id}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <a href="/" className="text-xs text-primary hover:underline">← Voltar ao início</a>
        </div>
      </div>
    </div>
  );
};

export default ValidateDocument;
