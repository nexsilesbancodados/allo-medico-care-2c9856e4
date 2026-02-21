import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, FileText, Video, X, Search, Download, Filter } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getPatientNav } from "./patientNav";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import CancelRescheduleDialog from "./CancelRescheduleDialog";

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  duration_minutes: number;
  doctor_name: string;
  doctor_crm: string;
  specialties: string[];
}

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
  waiting: "Sala de espera",
  in_progress: "Em andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
  no_show: "Não compareceu",
};

const PERIOD_OPTIONS = [
  { value: "all", label: "Todo período" },
  { value: "today", label: "Hoje" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mês" },
  { value: "last3", label: "Últimos 3 meses" },
  { value: "custom", label: "Período personalizado" },
];

const AppointmentsList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
      .channel("patient-appts-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `patient_id=eq.${user.id}` }, () => fetchAppointments())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("id, scheduled_at, status, duration_minutes, doctor_id")
      .eq("patient_id", user!.id)
      .order("scheduled_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    const doctorIds = [...new Set(data.map(a => a.doctor_id))];
    const { data: doctors } = await supabase
      .from("doctor_profiles")
      .select("id, user_id, crm, crm_state")
      .in("id", doctorIds);

    const userIds = doctors?.map(d => d.user_id) ?? [];
    const [profilesRes, specsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds),
      supabase.from("doctor_specialties").select("doctor_id, specialties(name)").in("doctor_id", doctorIds),
    ]);

    const doctorMap = new Map(doctors?.map(d => [d.id, d]) ?? []);
    const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) ?? []);
    const specMap = new Map<string, string[]>();
    specsRes.data?.forEach((s: any) => {
      const arr = specMap.get(s.doctor_id) ?? [];
      arr.push(s.specialties?.name ?? "");
      specMap.set(s.doctor_id, arr);
    });

    setAppointments(data.map(a => {
      const doc = doctorMap.get(a.doctor_id);
      const profile = doc ? profileMap.get(doc.user_id) : null;
      return {
        id: a.id,
        scheduled_at: a.scheduled_at,
        status: a.status,
        duration_minutes: a.duration_minutes,
        doctor_name: profile ? `Dr(a). ${profile.first_name} ${profile.last_name}` : "Médico",
        doctor_crm: doc ? `${doc.crm}/${doc.crm_state}` : "",
        specialties: specMap.get(a.doctor_id) ?? [],
      };
    }));
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
      const matchSearch = !search || a.doctor_name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || a.status === filterStatus;
      const matchDate = !range || isWithinInterval(new Date(a.scheduled_at), range);
      return matchSearch && matchStatus && matchDate;
    });
  }, [appointments, search, filterStatus, period, customFrom, customTo]);

  // handleCancel removed - now using CancelRescheduleDialog

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Minhas Consultas", 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 28);

    let y = 40;
    filtered.forEach((a, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.text(`${i + 1}. ${a.doctor_name}`, 14, y);
      doc.setFontSize(9);
      doc.text(`Data: ${format(new Date(a.scheduled_at), "dd/MM/yyyy 'às' HH:mm")} | Status: ${statusLabel[a.status] ?? a.status} | Duração: ${a.duration_minutes || 30}min`, 14, y + 6);
      y += 16;
    });

    doc.save(`consultas-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast({ title: "PDF exportado com sucesso!" });
  };

  const exportCSV = () => {
    const rows = [
      ["Médico", "CRM", "Data", "Hora", "Duração", "Status"],
      ...filtered.map(a => [
        a.doctor_name,
        a.doctor_crm,
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
    toast({ title: "CSV exportado!" });
  };

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

  const upcoming = filtered.filter(a => ["scheduled", "waiting", "in_progress"].includes(a.status));
  const past = filtered.filter(a => ["completed", "cancelled", "no_show"].includes(a.status));

  const renderAppointment = (appt: Appointment) => (
    <div key={appt.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border gap-3 transition-colors ${
      appt.status === "in_progress" ? "border-success/30 bg-success/5"
      : appt.status === "waiting" ? "border-warning/30 bg-warning/5"
      : "border-border hover:bg-muted/30"
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Video className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{appt.doctor_name}</p>
          <p className="text-xs text-muted-foreground">CRM {appt.doctor_crm}</p>
          {appt.specialties.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {appt.specialties.slice(0, 2).map(s => (
                <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground">{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:flex-col sm:items-end shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-foreground">{format(new Date(appt.scheduled_at), "dd/MM/yyyy", { locale: ptBR })}</p>
          <p className="text-xs text-muted-foreground">{format(new Date(appt.scheduled_at), "HH:mm")}h · {appt.duration_minutes || 30}min</p>
        </div>
        <div className="sm:hidden text-xs text-muted-foreground">
          {format(new Date(appt.scheduled_at), "dd/MM · HH:mm")}
        </div>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusColor[appt.status] ?? "bg-muted text-muted-foreground border-border"}`}>
          {statusLabel[appt.status] ?? appt.status}
        </span>
        <div className="flex gap-1.5">
          {appt.status === "scheduled" && (
            <CancelRescheduleDialog
              appointmentId={appt.id}
              currentDate={format(new Date(appt.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              doctorName={appt.doctor_name}
              onSuccess={fetchAppointments}
            />
          )}
          {(appt.status === "waiting" || appt.status === "in_progress" || appt.status === "scheduled") && (
            <Button size="sm" className="bg-gradient-hero text-primary-foreground text-xs h-7" onClick={() => navigate(`/dashboard/consultation/${appt.id}`)}>
              <Video className="w-3 h-3 mr-1" /> Entrar
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("appointments")}>
      <div className="max-w-3xl space-y-5">
        {/* Back button */}
        <button
          onClick={() => navigate("/dashboard?role=patient")}
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
              {filtered.length} consulta(s) · {upcoming.length} próxima(s)
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={exportCSV} disabled={filtered.length === 0} title="Exportar CSV">
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Button size="sm" variant="outline" onClick={exportPDF} disabled={filtered.length === 0} title="Exportar PDF">
              <FileText className="w-4 h-4 mr-1" /> PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar médico..."
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
                  <SelectItem value="waiting">Na espera</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
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
                    <Button variant="outline" className="h-9 text-xs shrink-0">
                      <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                      {customFrom && customTo
                        ? `${format(customFrom, "dd/MM")} → ${format(customTo, "dd/MM")}`
                        : calendarStep === "from" ? "Selecione início" : "Selecione fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <p className="text-xs text-muted-foreground px-3 pt-3 pb-1">
                      {calendarStep === "from" ? "Selecione a data inicial" : "Selecione a data final"}
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
          </CardContent>
        </Card>

        {/* Upcoming */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Próximas ({upcoming.length})
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-8 rounded-xl border border-dashed border-border">
              <CalendarIcon className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma consulta próxima</p>
            </div>
          ) : (
            <div className="space-y-2">{upcoming.map(renderAppointment)}</div>
          )}
        </div>

        {/* Past */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" /> Histórico ({past.length})
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : past.length === 0 ? (
            <div className="text-center py-8 rounded-xl border border-dashed border-border">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma consulta no histórico</p>
            </div>
          ) : (
            <div className="space-y-2">{past.map(renderAppointment)}</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AppointmentsList;
