import { useState, useEffect } from "react";
import mascotWave from "@/assets/mascot-wave.png";
import mascotThumbsup from "@/assets/mascot-thumbsup.png";
import mascotReading from "@/assets/mascot-reading.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download, FileText, Heart, Clock, Search, Activity, Plus, Thermometer,
  Droplets, Weight, HeartPulse, TrendingUp, TrendingDown, Minus, Calendar,
  Stethoscope, Pill, FileCheck, BarChart3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";

const METRIC_TYPES = [
  { value: "blood_pressure_sys", label: "Pressão Sistólica", unit: "mmHg", icon: HeartPulse, gradient: "from-rose-500 to-pink-600", bg: "bg-rose-500/10", text: "text-rose-500", normalRange: [90, 120] },
  { value: "blood_pressure_dia", label: "Pressão Diastólica", unit: "mmHg", icon: HeartPulse, gradient: "from-blue-500 to-indigo-600", bg: "bg-blue-500/10", text: "text-blue-500", normalRange: [60, 80] },
  { value: "weight", label: "Peso", unit: "kg", icon: Weight, gradient: "from-amber-500 to-orange-600", bg: "bg-amber-500/10", text: "text-amber-500", normalRange: [50, 100] },
  { value: "glucose", label: "Glicose", unit: "mg/dL", icon: Droplets, gradient: "from-purple-500 to-violet-600", bg: "bg-purple-500/10", text: "text-purple-500", normalRange: [70, 100] },
  { value: "temperature", label: "Temperatura", unit: "°C", icon: Thermometer, gradient: "from-cyan-500 to-teal-600", bg: "bg-cyan-500/10", text: "text-cyan-500", normalRange: [36.0, 37.5] },
  { value: "heart_rate", label: "Freq. Cardíaca", unit: "bpm", icon: Activity, gradient: "from-red-500 to-rose-600", bg: "bg-red-500/10", text: "text-red-500", normalRange: [60, 100] },
];

const getStatusColor = (value: number, range: number[]) => {
  if (value < range[0]) return "text-blue-500";
  if (value > range[1]) return "text-rose-500";
  return "text-emerald-500";
};

const getTrend = (data: any[], type: string) => {
  const filtered = data.filter(m => m.type === type);
  if (filtered.length < 2) return null;
  const last = filtered[filtered.length - 1].value;
  const prev = filtered[filtered.length - 2].value;
  const diff = last - prev;
  return { diff, direction: diff > 0 ? "up" : diff < 0 ? "down" : "stable" };
};

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
    const trend = getTrend(metrics, mt.value);
    return { ...mt, latest, trend };
  });

  const statCards = [
    { label: "Consultas", value: consultations.length, icon: Stethoscope, gradient: "from-blue-500/15 to-cyan-500/5", iconColor: "text-blue-500" },
    { label: "Receitas", value: prescriptions.length, icon: Pill, gradient: "from-emerald-500/15 to-green-500/5", iconColor: "text-emerald-500" },
    { label: "Exames", value: documents.length, icon: FileCheck, gradient: "from-violet-500/15 to-purple-500/5", iconColor: "text-violet-500" },
    { label: "Métricas", value: metrics.length, icon: BarChart3, gradient: "from-amber-500/15 to-orange-500/5", iconColor: "text-amber-500" },
  ];

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("health")} role="patient">
      <div className="w-full mx-auto max-w-4xl pb-24 md:pb-6">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border border-primary/10 p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Minha Saúde</h1>
                  <p className="text-xs text-muted-foreground">Seu painel de monitoramento completo</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
          {loading ? (
            [0,1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : (
            statCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`border-0 shadow-sm bg-gradient-to-br ${stat.gradient} overflow-hidden`}>
                    <CardContent className="p-3 text-center">
                      <Icon className={`w-5 h-5 ${stat.iconColor} mx-auto mb-1.5`} />
                      <p className="text-2xl font-bold text-foreground leading-none">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Vital Signs Dashboard */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Sinais Vitais</h2>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 rounded-full">
                  <Plus className="w-3.5 h-3.5" /> Registrar
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

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {lastMetricByType.map((mt, i) => {
              const IconComp = mt.icon;
              const isSelected = selectedMetricType === mt.value;
              const isNormal = mt.latest ? (mt.latest.value >= mt.normalRange[0] && mt.latest.value <= mt.normalRange[1]) : true;
              return (
                <motion.button
                  key={mt.value}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedMetricType(mt.value)}
                  className={`relative p-3 rounded-xl border text-left transition-all overflow-hidden ${
                    isSelected
                      ? "border-primary/40 bg-primary/5 shadow-sm shadow-primary/10 ring-1 ring-primary/20"
                      : "border-border/60 bg-card hover:border-primary/20 hover:shadow-sm"
                  }`}
                >
                  {/* Gradient accent */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${mt.gradient} ${isSelected ? "opacity-100" : "opacity-0"} transition-opacity`} />

                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg ${mt.bg} flex items-center justify-center`}>
                      <IconComp className={`w-4 h-4 ${mt.text}`} />
                    </div>
                    {mt.trend && (
                      <div className={`flex items-center gap-0.5 text-[10px] font-medium ${
                        mt.trend.direction === "up" ? "text-rose-500" : mt.trend.direction === "down" ? "text-blue-500" : "text-muted-foreground"
                      }`}>
                        {mt.trend.direction === "up" ? <TrendingUp className="w-3 h-3" /> :
                         mt.trend.direction === "down" ? <TrendingDown className="w-3 h-3" /> :
                         <Minus className="w-3 h-3" />}
                        {Math.abs(mt.trend.diff).toFixed(1)}
                      </div>
                    )}
                  </div>

                  <p className="text-lg font-bold text-foreground leading-none">
                    {mt.latest ? mt.latest.value : "—"}
                    <span className="text-[10px] font-normal text-muted-foreground ml-1">{mt.unit}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{mt.label}</p>

                  {mt.latest && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${isNormal ? "bg-emerald-500" : "bg-rose-500"}`} />
                      <span className={`text-[9px] font-medium ${isNormal ? "text-emerald-600" : "text-rose-500"}`}>
                        {isNormal ? "Normal" : "Atenção"}
                      </span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Chart */}
          {chartData.length > 1 ? (
            <Card className="border-border/60 shadow-sm mb-6 overflow-hidden">
              <CardHeader className="pb-1 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentMetricConfig?.gradient}`} />
                    {currentMetricConfig?.label}
                  </CardTitle>
                  <Badge variant="secondary" className="text-[9px] h-5">
                    {filteredMetrics.length} registros
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="h-[200px] px-2 pb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      formatter={(v: number) => [`${v} ${currentMetricConfig?.unit}`, currentMetricConfig?.label]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      fill="url(#metricGradient)"
                      dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-border/60 mb-6">
              <CardContent className="py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground">Gráfico de evolução</p>
                <p className="text-xs text-muted-foreground mt-1">Registre pelo menos 2 medições para visualizar</p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por médico..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9 rounded-xl bg-muted/30 border-border/50" />
        </div>

        {/* Tabs for history */}
        <Tabs defaultValue="consultations">
          <TabsList className="grid w-full grid-cols-4 h-9 rounded-xl bg-muted/50">
            <TabsTrigger value="consultations" className="text-[11px] rounded-lg data-[state=active]:shadow-sm">
              Consultas
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="text-[11px] rounded-lg data-[state=active]:shadow-sm">
              Receitas
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-[11px] rounded-lg data-[state=active]:shadow-sm">
              Exames
            </TabsTrigger>
            <TabsTrigger value="history" className="text-[11px] rounded-lg data-[state=active]:shadow-sm">
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Consultations */}
          <TabsContent value="consultations" className="mt-3 space-y-2">
            {loading ? (
              [0,1,2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
            ) : filteredConsultations.length === 0 ? (
              <EmptyState img={mascotWave} text="Nenhuma consulta realizada" />
            ) : filteredConsultations.map(a => (
              <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <div className="w-1 bg-gradient-to-b from-primary to-primary/30 shrink-0" />
                      <div className="flex-1 p-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Stethoscope className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground leading-tight">{a.doctor_name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <p className="text-[11px] text-muted-foreground">
                                  {format(new Date(a.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} · {a.duration_minutes || 30}min
                                </p>
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] h-5">
                            Concluída
                          </Badge>
                        </div>
                        {a.consultation_notes && (
                          <div className="p-2.5 bg-muted/40 rounded-lg mt-2.5 border border-border/30">
                            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Anotações do médico</p>
                            <p className="text-xs text-foreground leading-relaxed">{a.consultation_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          {/* Prescriptions */}
          <TabsContent value="prescriptions" className="mt-3 space-y-2">
            {prescriptions.length === 0 ? (
              <EmptyState img={mascotThumbsup} text="Nenhuma receita emitida" />
            ) : prescriptions.map(p => (
              <Card key={p.id} className="border-border/50 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className="w-1 bg-gradient-to-b from-emerald-500 to-emerald-500/30 shrink-0" />
                    <div className="flex-1 p-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Pill className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground leading-tight">{p.diagnosis || "Receita médica"}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {p.doctor_name} · {format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            {Array.isArray(p.medications) && p.medications.length > 0 && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">{p.medications.length} medicamento(s)</p>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={() => downloadPrescription(p)}>
                          <Download className="w-3.5 h-3.5" /> PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="mt-3 space-y-2">
            {documents.length === 0 ? (
              <EmptyState img={mascotReading} text="Nenhum exame enviado" />
            ) : documents.map(d => (
              <Card key={d.id} className="border-border/50 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className="w-1 bg-gradient-to-b from-violet-500 to-violet-500/30 shrink-0" />
                    <div className="flex-1 p-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-violet-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{d.description || d.file_name}</p>
                            <p className="text-[11px] text-muted-foreground">{format(new Date(d.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => viewDocument(d)}>Ver</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Metrics History */}
          <TabsContent value="history" className="mt-3 space-y-2">
            {filteredMetrics.length === 0 ? (
              <Card className="border-dashed border-border/50">
                <CardContent className="py-8 text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Sem registros de {currentMetricConfig?.label}</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold">Histórico — {currentMetricConfig?.label}</CardTitle>
                    <Badge variant="secondary" className="text-[9px] h-5">{filteredMetrics.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                    {[...filteredMetrics].reverse().map(m => {
                      const isNormal = m.value >= (currentMetricConfig?.normalRange[0] ?? 0) && m.value <= (currentMetricConfig?.normalRange[1] ?? 999);
                      return (
                        <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/20">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2 h-2 rounded-full ${isNormal ? "bg-emerald-500" : "bg-rose-500"}`} />
                            <div>
                              <span className="text-sm font-semibold text-foreground">{m.value} <span className="text-[10px] font-normal text-muted-foreground">{m.unit}</span></span>
                              {m.notes && <p className="text-[10px] text-muted-foreground leading-tight">{m.notes}</p>}
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(m.measured_at), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      );
                    })}
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

const EmptyState = ({ img, text }: { img: string; text: string }) => (
  <div className="text-center py-10 rounded-2xl border border-dashed border-border/40 bg-muted/5">
    <img src={img} alt="Pingo" className="w-16 h-16 object-contain mx-auto drop-shadow-md mb-3 select-none" loading="lazy" decoding="async" width={64} height={64} />
    <p className="text-xs font-semibold text-foreground">{text}</p>
    <p className="text-[10px] text-muted-foreground mt-1">Seus dados aparecerão aqui</p>
  </div>
);

export default PatientHealth;
