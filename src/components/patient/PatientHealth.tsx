import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Heart, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";

const PatientHealth = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    const [apptRes, prescRes, docsRes] = await Promise.all([
      supabase.from("appointments")
        .select("id, scheduled_at, status, doctor_id, notes, duration_minutes")
        .eq("patient_id", user!.id)
        .eq("status", "completed")
        .order("scheduled_at", { ascending: false }),
      supabase.from("prescriptions")
        .select("id, appointment_id, diagnosis, medications, observations, created_at, doctor_id")
        .eq("patient_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase.from("patient_documents")
        .select("*")
        .eq("patient_id", user!.id)
        .order("created_at", { ascending: false }),
    ]);

    // Get doctor names for all
    const allDoctorIds = [...new Set([
      ...(apptRes.data ?? []).map(a => a.doctor_id),
      ...(prescRes.data ?? []).map(p => p.doctor_id),
    ])];

    let docNameMap = new Map<string, string>();
    if (allDoctorIds.length > 0) {
      const { data: docs } = await supabase.from("doctor_profiles").select("id, user_id").in("id", allDoctorIds);
      if (docs && docs.length > 0) {
        const userIds = docs.map(d => d.user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);
        docs.forEach(d => {
          const p = profiles?.find(pr => pr.user_id === d.user_id);
          if (p) docNameMap.set(d.id, `Dr(a). ${p.first_name} ${p.last_name}`);
        });
      }
    }

    // Get consultation notes
    const apptIds = (apptRes.data ?? []).map(a => a.id);
    const { data: notes } = apptIds.length > 0
      ? await supabase.from("consultation_notes").select("appointment_id, content").in("appointment_id", apptIds)
      : { data: [] };
    const notesMap = new Map((notes ?? []).map(n => [n.appointment_id, n.content]));

    setConsultations((apptRes.data ?? []).map(a => ({
      ...a,
      doctor_name: docNameMap.get(a.doctor_id) ?? "Médico",
      consultation_notes: notesMap.get(a.id) ?? null,
    })));

    setPrescriptions((prescRes.data ?? []).map(p => ({
      ...p,
      doctor_name: docNameMap.get(p.doctor_id) ?? "Médico",
    })));

    setDocuments(docsRes.data ?? []);
    setLoading(false);
  };

  const downloadPrescription = (prescription: any) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Receita Médica Digital", 20, 20);
    doc.setFontSize(12);
    doc.text(`Médico: ${prescription.doctor_name}`, 20, 35);
    doc.text(`Data: ${format(new Date(prescription.created_at), "dd/MM/yyyy", { locale: ptBR })}`, 20, 42);
    if (prescription.diagnosis) doc.text(`Diagnóstico: ${prescription.diagnosis}`, 20, 55);
    doc.text("Medicamentos:", 20, 68);
    const meds = Array.isArray(prescription.medications) ? prescription.medications : [];
    meds.forEach((med: any, i: number) => {
      const text = typeof med === "string" ? med : `${med.name || med.medication || "—"} - ${med.dosage || ""} - ${med.instructions || ""}`;
      doc.text(`${i + 1}. ${text}`, 25, 78 + i * 8);
    });
    if (prescription.observations) doc.text(`Observações: ${prescription.observations}`, 20, 90 + meds.length * 8);
    doc.save(`receita-${prescription.id.slice(0, 8)}.pdf`);
  };

  const viewDocument = async (doc: any) => {
    const { data } = await supabase.storage.from("patient-documents").createSignedUrl(doc.file_url, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const filteredConsultations = consultations.filter(c =>
    c.doctor_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("health")}>
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-1">
          <Heart className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Minha Saúde</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-6">Seu histórico médico completo em um só lugar</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xl font-bold text-foreground">{consultations.length}</p>
            <p className="text-xs text-muted-foreground">Consultas</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xl font-bold text-foreground">{prescriptions.length}</p>
            <p className="text-xs text-muted-foreground">Receitas</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xl font-bold text-foreground">{documents.length}</p>
            <p className="text-xs text-muted-foreground">Exames</p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por médico..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <Tabs defaultValue="consultations">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consultations">Consultas ({consultations.length})</TabsTrigger>
            <TabsTrigger value="prescriptions">Receitas ({prescriptions.length})</TabsTrigger>
            <TabsTrigger value="documents">Exames ({documents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="consultations" className="mt-4 space-y-3">
            {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> :
            filteredConsultations.length === 0 ? (
              <Card className="border-border"><CardContent className="py-8 text-center text-muted-foreground">Nenhuma consulta realizada.</CardContent></Card>
            ) : filteredConsultations.map(a => (
              <Card key={a.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{a.doctor_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(a.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} · {a.duration_minutes || 30}min
                      </p>
                    </div>
                    <Badge variant="outline">Concluída</Badge>
                  </div>
                  {a.consultation_notes && (
                    <div className="p-3 bg-muted rounded-lg mt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Anotações do médico</p>
                      <p className="text-sm text-foreground">{a.consultation_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="prescriptions" className="mt-4 space-y-3">
            {prescriptions.length === 0 ? (
              <Card className="border-border"><CardContent className="py-8 text-center text-muted-foreground">Nenhuma receita emitida.</CardContent></Card>
            ) : prescriptions.map(p => (
              <Card key={p.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{p.diagnosis || "Receita médica"}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.doctor_name} · {format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      {Array.isArray(p.medications) && p.medications.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {p.medications.length} medicamento(s)
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => downloadPrescription(p)}>
                      <Download className="w-3 h-3 mr-1" /> PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="documents" className="mt-4 space-y-3">
            {documents.length === 0 ? (
              <Card className="border-border"><CardContent className="py-8 text-center text-muted-foreground">Nenhum exame enviado.</CardContent></Card>
            ) : documents.map(d => (
              <Card key={d.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{d.file_type?.includes("image") ? "🖼️" : "📄"}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.description || d.file_name}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(d.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => viewDocument(d)}>Ver</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PatientHealth;
