import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, Heart, Clock, Search, Activity, Plus, Thermometer, Droplets, Weight, HeartPulse } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const METRIC_TYPES = [
  { value: "blood_pressure_sys", label: "Pressão Sistólica", unit: "mmHg", icon: HeartPulse, color: "hsl(var(--destructive))" },
  { value: "blood_pressure_dia", label: "Pressão Diastólica", unit: "mmHg", icon: HeartPulse, color: "hsl(var(--primary))" },
  { value: "weight", label: "Peso", unit: "kg", icon: Weight, color: "hsl(var(--secondary))" },
  { value: "glucose", label: "Glicose", unit: "mg/dL", icon: Droplets, color: "hsl(var(--warning))" },
  { value: "temperature", label: "Temperatura", unit: "°C", icon: Thermometer, color: "hsl(var(--accent))" },
  { value: "heart_rate", label: "Freq. Cardíaca", unit: "bpm", icon: Activity, color: "hsl(var(--destructive))" },
];

const PatientHealth = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMetricType, setSelectedMetricType] = useState("blood_pressure_sys");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMetric, setNewMetric] = useState({ type: "blood_pressure_sys", value: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    const [apptRes, prescRes, docsRes, metricsRes] = await Promise.all([
      supabase.from("appointments")
        .select("id, scheduled_at, status, doctor_id, notes, duration_minutes")
        .eq("patient_id", user!.id).eq("status", "completed")
        .order("scheduled_at", { ascending: false }),
      supabase.from("prescriptions")
        .select("id, appointment_id, diagnosis, medications, observations, created_at, doctor_id, pdf_url")
        .eq("patient_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("patient_documents")
        .select("*").eq("patient_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("health_metrics")
        .select("*").eq("patient_id", user!.id).order("measured_at", { ascending: true }),
    ]);

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

    const apptIds = (apptRes.data ?? []).map(a => a.id);
    const { data: notes } = apptIds.length > 0
      ? await supabase.from("consultation_notes").select("appointment_id, content").in("appointment_id", apptIds)
      : { data: [] };
    const notesMap = new Map((notes ?? []).map(n => [n.appointment_id, n.content]));

    setConsultations((apptRes.data ?? []).map(a => ({
      ...a, doctor_name: docNameMap.get(a.doctor_id) ?? "Médico",
      consultation_notes: notesMap.get(a.id) ?? null,
    })));
    setPrescriptions((prescRes.data ?? []).map(p => ({ ...p, doctor_name: docNameMap.get(p.doctor_id) ?? "Médico" })));
    setDocuments(docsRes.data ?? []);
    setMetrics(metricsRes.data ?? []);
    setLoading(false);
  };

  const saveMetric = async () => {
    if (!newMetric.value || !user) return;
    setSaving(true);
    const metricInfo = METRIC_TYPES.find(m => m.value === newMetric.type);
    const { error } = await supabase.from("health_metrics").insert({
      patient_id: user.id,
      type: newMetric.type,
      value: parseFloat(newMetric.value),
      unit: metricInfo?.unit ?? "",
      notes: newMetric.notes || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar métrica");
    } else {
      toast.success("Métrica registrada!");
      setAddDialogOpen(false);
      setNewMetric({ type: "blood_pressure_sys", value: "", notes: "" });
      fetchAll();
    }
  };

  const downloadPrescription = (prescription: any) => {
    if (prescription.pdf_url) {
      window.open(prescription.pdf_url, "_blank");
      return;
    }
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

  const currentMetricConfig = METRIC_TYPES.find(m => m.value === selectedMetricType);
  const filteredMetrics = metrics.filter(m => m.type === selectedMetricType);
  const chartData = filteredMetrics.map(m => ({
    date: format(new Date(m.measured_at), "dd/MM", { locale: ptBR }),
    value: m.value,
  }));

  const lastMetricByType = METRIC_TYPES.map(mt => {
    const latest = metrics.filter(m => m.type === mt.value).slice(-1)[0];
    return { ...mt, latest };
  });

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("health")} role="patient">
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-1">
          <Heart className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground tabular-nums">Minha Saúde</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-6">Seu histórico médico completo em um só lugar</p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {loading ? (
            [0,1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)
          ) : (
            <>
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
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-xl font-bold text-foreground">{metrics.length}</p>
                <p className="text-xs text-muted-foreground">Métricas</p>
              </div>
            </>
          )}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por médico..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <Tabs defaultValue="consultations">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="consultations">Consultas</TabsTrigger>
            <TabsTrigger value="prescriptions">Receitas</TabsTrigger>
            <TabsTrigger value="documents">Exames</TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
          </TabsList>

          <TabsContent value="consultations" className="mt-4 space-y-3">
            {loading ? (
              [0,1,2].map(i => <Skeleton key={i} className="h-20 w-full" />)
            ) : filteredConsultations.length === 0 ? (
              <div className="text-center py-8 rounded-2xl border border-dashed border-border/40 bg-muted/10"><img src="/src/assets/mascot-wave.png" alt="Pingo" className="w-16 h-16 object-contain mx-auto drop-shadow-md mb-2 select-none" /><p className="text-[12px] font-semibold text-foreground">Nenhuma consulta realizada</p></div>
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
              <div className="text-center py-8 rounded-2xl border border-dashed border-border/40 bg-muted/10"><img src="/src/assets/mascot-thumbsup.png" alt="Pingo" className="w-16 h-16 object-contain mx-auto drop-shadow-md mb-2 select-none" /><p className="text-[12px] font-semibold text-foreground">Nenhuma receita emitida</p></div>
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
                        <p className="text-xs text-muted-foreground mt-1">{p.medications.length} medicamento(s)</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => downloadPrescription(p)}>
                      <Download className="w-3 h-3 mr-1" /> {p.pdf_url ? "Abrir" : "Gerar"} PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="documents" className="mt-4 space-y-3">
            {documents.length === 0 ? (
              <div className="text-center py-8 rounded-2xl border border-dashed border-border/40 bg-muted/10"><img src="/src/assets/mascot-reading.png" alt="Pingo" className="w-16 h-16 object-contain mx-auto drop-shadow-md mb-2 select-none" /><p className="text-[12px] font-semibold text-foreground">Nenhum exame enviado</p></div>
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

          {/* Health Metrics Tab */}
          <TabsContent value="metrics" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Métricas de Saúde
              </h3>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-hero text-primary-foreground">
                    <Plus className="w-4 h-4 mr-1" /> Registrar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Registrar Métrica</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Tipo</Label>
                      <Select value={newMetric.type} onValueChange={v => setNewMetric(p => ({ ...p, type: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {METRIC_TYPES.map(mt => (
                            <SelectItem key={mt.value} value={mt.value}>{mt.label} ({mt.unit})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Valor</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={newMetric.value}
                        onChange={e => setNewMetric(p => ({ ...p, value: e.target.value }))}
                        placeholder={METRIC_TYPES.find(m => m.value === newMetric.type)?.unit}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Observações (opcional)</Label>
                      <Input
                        value={newMetric.notes}
                        onChange={e => setNewMetric(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Ex: após exercício..."
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={saveMetric} disabled={saving || !newMetric.value} className="w-full">
                      {saving ? "Salvando..." : "Salvar Métrica"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Latest values grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {lastMetricByType.map(mt => {
                const IconComp = mt.icon;
                return (
                  <button
                    key={mt.value}
                    onClick={() => setSelectedMetricType(mt.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedMetricType === mt.value
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <IconComp className="w-4 h-4" style={{ color: mt.color }} />
                      <span className="text-xs font-medium text-muted-foreground">{mt.label}</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {mt.latest ? `${mt.latest.value}` : "—"}
                      <span className="text-xs font-normal text-muted-foreground ml-1">{mt.unit}</span>
                    </p>
                    {mt.latest && (
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(mt.latest.measured_at), "dd/MM HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Chart */}
            {chartData.length > 1 ? (
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    {currentMetricConfig?.label} — Evolução
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => [`${v} ${currentMetricConfig?.unit}`, currentMetricConfig?.label]} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={currentMetricConfig?.color ?? "hsl(var(--primary))"}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Registre pelo menos 2 medições para ver o gráfico de evolução.</p>
                </CardContent>
              </Card>
            )}

            {/* History */}
            {filteredMetrics.length > 0 && (
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Histórico — {currentMetricConfig?.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {[...filteredMetrics].reverse().map(m => (
                      <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                        <div>
                          <span className="font-semibold text-sm text-foreground">{m.value} {m.unit}</span>
                          {m.notes && <p className="text-[10px] text-muted-foreground">{m.notes}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(m.measured_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PatientHealth;
