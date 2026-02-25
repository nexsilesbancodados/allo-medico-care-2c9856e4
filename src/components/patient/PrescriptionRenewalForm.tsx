import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PrescriptionRenewalForm = () => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prescriptionUrl, setPrescriptionUrl] = useState("");
  const [allergies, setAllergies] = useState("");
  const [conditions, setConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [sideEffects, setSideEffects] = useState("");
  const [notes, setNotes] = useState("");
  const [myRenewals, setMyRenewals] = useState<any[]>([]);

  useEffect(() => { if (user) fetchRenewals(); }, [user]);

  const fetchRenewals = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("prescription_renewals")
      .select("*")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });
    setMyRenewals(data ?? []);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx 10MB)");
      return;
    }
    setUploading(true);
    const filePath = `${user.id}/renewal-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("patient-documents").upload(filePath, file);
    if (error) {
      toast.error("Erro no upload: " + error.message);
    } else {
      setPrescriptionUrl(filePath);
      toast.success("Receita enviada!");
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!user || !prescriptionUrl) {
      toast.error("Envie a receita vencida primeiro");
      return;
    }
    setSubmitting(true);
    const questionnaire = {
      allergies: allergies.trim(),
      chronic_conditions: conditions.trim(),
      current_medications: medications.trim(),
      side_effects: sideEffects.trim(),
      additional_notes: notes.trim(),
    };

    const { error } = await supabase.from("prescription_renewals").insert({
      patient_id: user.id,
      original_prescription_url: prescriptionUrl,
      health_questionnaire: questionnaire,
      status: "pending",
    });

    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      toast.success("Solicitação enviada! Um médico analisará em breve.");
      setPrescriptionUrl("");
      setAllergies(""); setConditions(""); setMedications(""); setSideEffects(""); setNotes("");
      fetchRenewals();
    }
    setSubmitting(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "in_review": return <Badge className="bg-amber-500"><AlertCircle className="w-3 h-3 mr-1" />Em análise</Badge>;
      case "approved": return <Badge className="bg-emerald-500"><CheckCircle2 className="w-3 h-3 mr-1" />Aprovada</Badge>;
      case "rejected": return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeitada</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("renewal")}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-1">💊 Renovar Receita</h1>
        <p className="text-muted-foreground text-sm mb-6">Renove sua receita sem precisar de videoconsulta</p>

        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-sm font-medium">1. Envie a receita vencida</Label>
              <div className="mt-2">
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleUpload} />
                <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" /> {uploading ? "Enviando..." : prescriptionUrl ? "✅ Receita enviada" : "Escolher arquivo"}
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">2. Questionário de saúde</Label>
              <div className="space-y-3 mt-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Alergias conhecidas</Label>
                  <Input value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="Ex: Dipirona, Penicilina..." />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Condições crônicas</Label>
                  <Input value={conditions} onChange={e => setConditions(e.target.value)} placeholder="Ex: Hipertensão, Diabetes..." />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Medicamentos atuais</Label>
                  <Textarea value={medications} onChange={e => setMedications(e.target.value)} placeholder="Liste os medicamentos que toma atualmente" rows={2} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Efeitos colaterais percebidos</Label>
                  <Input value={sideEffects} onChange={e => setSideEffects(e.target.value)} placeholder="Algum efeito colateral?" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Observações adicionais</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Informações extras para o médico" rows={2} />
                </div>
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={submitting || !prescriptionUrl} className="w-full">
              {submitting ? "Enviando..." : "Enviar Solicitação — R$ 80,00"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">Análise em até 3 dias úteis</p>
          </CardContent>
        </Card>

        {/* My renewals */}
        {myRenewals.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Minhas Solicitações</h3>
              <div className="space-y-3">
                {myRenewals.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                        {r.rejection_reason && <p className="text-xs text-destructive">{r.rejection_reason}</p>}
                      </div>
                    </div>
                    {statusBadge(r.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PrescriptionRenewalForm;
