import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "./doctorNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Video, FileText, Download, Filter, Calendar as CalendarIcon, Clock, Users } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";

const statusColor: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  waiting: "bg-warning/10 text-warning border-warning/20",
  in_progress: "bg-success/10 text-success border-success/20",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  no_show: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabel: Record<string, string> = {
  scheduled: "Agendada",
  completed: "Concluída",
  cancelled: "Cancelada",
  in_progress: "Em andamento",
  waiting: "Esperando",
  no_show: "Ausente",
};

const PERIOD_OPTIONS = [
  { value: "all", label: "Todo período" },
  { value: "today", label: "Hoje" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mês" },
  { value: "last3", label: "Últimos 3 meses" },
  { value: "custom", label: "Período personalizado" },
];

const DoctorConsultations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [period, setPeriod] = useState("all");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarStep, setCalendarStep] = useState<"from" | "to">("from");

  useEffect(() => { if (user) fetchAppointments(); }, [user]);

  // Realtime sync
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("doctor-consultations-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => fetchAppointments())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchAppointments = async () => {
    const { data: docProfile } = await supabase.from("doctor_profiles").select("id").eq("user_id", user!.id).single();
    if (!docProfile) { setLoading(false); return; }

    const { data } = await supabase.from("appointments")
      .select("id, scheduled_at, status, patient_id, duration_minutes, notes, guest_patient_id")
      .eq("doctor_id", docProfile.id)
      .order("scheduled_at", { ascending: false })
      .limit(300);

    if (!data || data.length === 0) { setAppointments([]); setLoading(false); return; }

    const patientIds = [...new Set(data.filter(a => a.patient_id).map(a => a.patient_id))];
    const guestIds = [...new Set(data.filter(a => a.guest_patient_id).map(a => a.guest_patient_id))];

    const [profilesRes, guestsRes] = await Promise.all([
      patientIds.length > 0
        ? supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", patientIds)
        : { data: [] },
      guestIds.length > 0
        ? supabase.from("guest_patients").select("id, full_name").in("id", guestIds)
        : { data: [] },
    ]);

    const pMap = new Map((profilesRes.data ?? []).map((p: { user_id: string; first_name: string; last_name: string }) => [p.user_id, `${p.first_name} ${p.last_name}`]));
    const gMap = new Map((guestsRes.data ?? []).map((g: { id: string; full_name: string }) => [g.id, g.full_name]));

    setAppointments(data.map(a => ({
      ...a,
      patient_name: a.patient_id ? (pMap.get(a.patient_id) ?? "Paciente") : (gMap.get(a.guest_patient_id) ?? "Paciente Avulso"),
    })));
    setLoading(false);
  };

  const getDateRange = () => {
    const now = new Date();
    if (period === "today") return { start: startOfDay(now), end: endOfDay(now) };
    if (period === "week") return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
    if (period === "month") return { start: startOfMonth(now), end: endOfMonth(now) };
    if (period === "last3") return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
    if (period === "custom" && customFrom && customTo) return { start: startOfDay(customFrom), end: endOfDay(customTo) };
    return null;
  };

  const filtered = useMemo(() => {
    const range = getDateRange();
    return appointments.filter(a => {
      const matchSearch = !search || a.patient_name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || a.status === filterStatus;
      const matchDate = !range || isWithinInterval(new Date(a.scheduled_at), range);
      return matchSearch && matchStatus && matchDate;
    });
  }, [appointments, search, filterStatus, period, customFrom, customTo]);

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    if (calendarStep === "from") {
      setCustomFrom(date);
      setCalendarStep("to");
    } else {
      setCustomTo(date);
      setCalendarOpen(false);
      setCalendarStep("from");
    }
  };

  const exportCSV = () => {
    const rows = [
      ["Paciente", "Data", "Hora", "Duração", "Status"],
      ...filtered.map(a => [
        a.patient_name,
        format(new Date(a.scheduled_at), "dd/MM/yyyy"),
        format(new Date(a.scheduled_at), "HH:mm"),
        `${a.duration_minutes || 30}min`,
        statusLabel[a.status] ?? a.status,
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = `consultas-${format(new Date(), "yyyy-MM-dd")}.csv`;
    el.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Relatório de Consultas", 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 28);
    doc.text(`Total: ${filtered.length} consulta(s)`, 14, 35);

    let y = 48;
    filtered.forEach((a, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.text(`${i + 1}. ${a.patient_name}`, 14, y);
      doc.setFontSize(9);
      doc.text(
        `${format(new Date(a.scheduled_at), "dd/MM/yyyy 'às' HH:mm")} | ${statusLabel[a.status] ?? a.status} | ${a.duration_minutes || 30}min`,
        14, y + 6
      );
      y += 16;
    });

    doc.save(`consultas-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF exportado com sucesso!");
  };

  const completedCount = appointments.filter(a => a.status === "completed").length;
  const scheduledCount = appointments.filter(a => a.status === "scheduled").length;

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("consultations")}>
      <div className="max-w-5xl space-y-5">
        {/* Back button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
          Voltar ao painel
        </button>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Minhas Consultas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {scheduledCount} agendada(s) · {completedCount} concluída(s) · {appointments.length} total
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={exportCSV} disabled={filtered.length === 0}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Button size="sm" variant="outline" onClick={exportPDF} disabled={filtered.length === 0}>
              <FileText className="w-4 h-4 mr-1" /> PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40 h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="waiting">Esperando</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="no_show">Ausente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={period} onValueChange={v => { setPeriod(v); if (v === "custom") setCalendarOpen(true); }}>
                <SelectTrigger className="w-full sm:w-44 h-9">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {period === "custom" && (
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 text-xs">
                      <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                      {customFrom && customTo
                        ? `${format(customFrom, "dd/MM")} → ${format(customTo, "dd/MM")}`
                        : calendarStep === "from" ? "Início" : "Fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <p className="text-xs text-muted-foreground px-3 pt-3 pb-1">
                      {calendarStep === "from" ? "Data inicial" : "Data final"}
                    </p>
                    <Calendar
                      mode="single"
                      selected={calendarStep === "from" ? customFrom : customTo}
                      onSelect={handleCalendarSelect}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
            {filtered.length !== appointments.length && (
              <p className="text-xs text-muted-foreground mt-2">
                Mostrando {filtered.length} de {appointments.length} consultas
              </p>
            )}
          </CardContent>
        </Card>

        {/* List — mobile-friendly cards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-border">
            <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Nenhuma consulta encontrada</p>
            <p className="text-xs text-muted-foreground">Tente ajustar os filtros</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(a => (
              <div
                key={a.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border gap-3 transition-colors ${
                  a.status === "in_progress" ? "border-success/30 bg-success/5"
                  : a.status === "waiting" ? "border-warning/30 bg-warning/5"
                  : "border-border hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{a.patient_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(a.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} · {a.duration_minutes || 30}min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusColor[a.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                    {statusLabel[a.status] ?? a.status}
                  </span>
                  {(a.status === "scheduled" || a.status === "waiting") && (
                    <Button size="sm" className="bg-gradient-hero text-primary-foreground text-xs h-7" onClick={() => navigate(`/dashboard/consultation/${a.id}`)}>
                      <Video className="w-3 h-3 mr-1" /> Iniciar
                    </Button>
                  )}
                  {a.status === "completed" && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => navigate(`/dashboard/prescribe/${a.id}`)}>
                      <FileText className="w-3 h-3 mr-1" /> Receita
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorConsultations;
