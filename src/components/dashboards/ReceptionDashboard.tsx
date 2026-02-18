import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "./DashboardLayout";
import { getReceptionNav } from "@/components/reception/receptionNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComp } from "@/components/ui/calendar";
import { Calendar, Clock, CheckCircle, Video, Search, Download, RefreshCw, Filter, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, startOfDay, endOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";

const statusLabel: Record<string, string> = {
  scheduled: "Agendada", waiting: "Na sala", in_progress: "Em consulta",
  completed: "Concluída", cancelled: "Cancelada", no_show: "Faltou",
};

const statusColor: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  waiting: "bg-warning/10 text-warning border-warning/20",
  in_progress: "bg-success/10 text-success border-success/20",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  no_show: "bg-destructive/10 text-destructive border-destructive/20",
};

const ReceptionDashboard = () => {
  const [todayAppts, setTodayAppts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, waiting: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchToday(); }, [selectedDate]);

  useEffect(() => {
    const channel = supabase
      .channel("reception-live")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments" }, () => fetchToday())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchToday = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);

    const { data } = await supabase
      .from("appointments")
      .select("id, scheduled_at, status, patient_id, doctor_id, duration_minutes, appointment_type, notes")
      .gte("scheduled_at", dayStart.toISOString())
      .lte("scheduled_at", dayEnd.toISOString())
      .order("scheduled_at", { ascending: true });

    if (!data) { setLoading(false); setRefreshing(false); return; }

    const patientIds = [...new Set(data.map(a => a.patient_id).filter(Boolean))];
    const doctorIds = [...new Set(data.map(a => a.doctor_id))];

    const [pRes, dRes] = await Promise.all([
      patientIds.length > 0 ? supabase.from("profiles").select("user_id, first_name, last_name, phone").in("user_id", patientIds) : { data: [] },
      supabase.from("doctor_profiles").select("id, user_id").in("id", doctorIds),
    ]);

    const pMap = new Map((pRes.data ?? []).map(p => [p.user_id, p]));
    const docUserIds = (dRes.data ?? []).map(d => d.user_id);
    const { data: docProfiles } = docUserIds.length > 0
      ? await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", docUserIds)
      : { data: [] };
    const docMap = new Map<string, string>();
    (dRes.data ?? []).forEach(d => {
      const p = docProfiles?.find(pr => pr.user_id === d.user_id);
      if (p) docMap.set(d.id, `Dr(a). ${p.first_name} ${p.last_name}`);
    });

    const enriched = data.map(a => {
      const patient = pMap.get(a.patient_id!);
      return {
        ...a,
        patient_name: patient ? `${patient.first_name} ${patient.last_name}` : "—",
        patient_phone: patient?.phone ?? "",
        doctor_name: docMap.get(a.doctor_id) ?? "—",
      };
    });

    setTodayAppts(enriched);
    setStats({
      total: data.length,
      waiting: data.filter(a => a.status === "waiting").length,
      inProgress: data.filter(a => a.status === "in_progress").length,
      completed: data.filter(a => a.status === "completed").length,
    });
    setLoading(false);
    setRefreshing(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    toast.success(`Status atualizado: ${statusLabel[status] ?? status}`);
  };

  const exportCSV = () => {
    const rows = [
      ["Horário", "Paciente", "Telefone", "Médico", "Duração", "Status"],
      ...filteredAppts.map(a => [
        format(new Date(a.scheduled_at), "HH:mm"),
        a.patient_name, a.patient_phone, a.doctor_name,
        `${a.duration_minutes || 30}min`,
        statusLabel[a.status] ?? a.status,
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agenda-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Agenda exportada em CSV!");
  };

  const filteredAppts = todayAppts.filter(a => {
    const matchSearch = !search || a.patient_name.toLowerCase().includes(search.toLowerCase()) || a.doctor_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const kpis = [
    { label: "Consultas", value: stats.total, icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
    { label: "Na Espera", value: stats.waiting, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Em Andamento", value: stats.inProgress, icon: Video, color: "text-success", bg: "bg-success/10" },
    { label: "Concluídas", value: stats.completed, icon: CheckCircle, color: "text-muted-foreground", bg: "bg-muted" },
  ];

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <DashboardLayout title="Recepção" nav={getReceptionNav("overview")}>
      <div className="max-w-5xl space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Painel da Recepção</h1>
            {/* Date navigator */}
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => setSelectedDate(d => subDays(d, 1))} className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {isToday ? "Hoje" : format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComp
                    mode="single"
                    selected={selectedDate}
                    onSelect={d => { if (d) { setSelectedDate(d); setCalendarOpen(false); } }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <button onClick={() => setSelectedDate(d => addDays(d, 1))} className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              {!isToday && (
                <button onClick={() => setSelectedDate(new Date())} className="text-xs text-primary hover:underline">Hoje</button>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => fetchToday(true)} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            <Button size="sm" variant="outline" onClick={exportCSV} disabled={loading || todayAppts.length === 0}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
          </div>
        </div>

        {/* BLOB KPI Cards — Recepção */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
          {loading ? (
            [1,2,3,4].map(i => <div key={i} className="aspect-square animate-pulse bg-muted/50 rounded-full" />)
          ) : (
            kpis.map((s, i) => (
              <BlobKPICard
                key={s.label}
                variant={i as 0|1|2|3}
                label={s.label}
                value={s.value}
                icon={<s.icon className="w-5 h-5" />}
                color={["primary","warning","success","secondary"][i] as any}
                delay={i * 0.08}
              />
            ))
          )}
        </div>

        {/* Agenda */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold">
                Agenda — {filteredAppts.length} consulta(s)
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <div className="relative w-full sm:w-44">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 w-full sm:w-36 text-xs">
                    <Filter className="w-3 h-3 mr-1 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="scheduled">Agendada</SelectItem>
                    <SelectItem value="waiting">Na espera</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="no_show">Faltou</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border">
                    <Skeleton className="h-10 w-14 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-7 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : filteredAppts.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Calendar className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {search ? "Nenhum resultado encontrado" : "Nenhuma consulta para hoje"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {search ? "Tente um nome diferente" : "A agenda está limpa por hoje"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAppts.map(a => (
                  <div
                    key={a.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border gap-3 transition-colors ${
                      a.status === "in_progress" ? "border-success/30 bg-success/5"
                      : a.status === "waiting" ? "border-warning/30 bg-warning/5"
                      : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="min-w-[52px] text-center p-1.5 rounded-lg bg-muted/60">
                        <p className="text-sm font-bold text-foreground">{format(new Date(a.scheduled_at), "HH:mm")}</p>
                        <p className="text-[10px] text-muted-foreground">{a.duration_minutes || 30}min</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{a.patient_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.doctor_name}</p>
                        {a.patient_phone && (
                          <p className="text-xs text-muted-foreground">📞 {a.patient_phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${statusColor[a.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                        {a.status === "in_progress" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-success mr-1 align-middle animate-pulse" />}
                        {statusLabel[a.status] ?? a.status}
                      </span>
                      {a.status === "scheduled" && (
                        <>
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(a.id, "waiting")}>
                            Check-in
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive hover:bg-destructive/10" onClick={() => updateStatus(a.id, "no_show")}>
                            Faltou
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReceptionDashboard;
