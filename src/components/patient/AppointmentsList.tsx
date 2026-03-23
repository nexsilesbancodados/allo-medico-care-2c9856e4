import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, FileText, Video, Search, Download, Filter, ArrowLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getPatientNav } from "./patientNav";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import CancelRescheduleDialog from "./CancelRescheduleDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  payment_status: string;
  duration_minutes: number | null;
  doctor_id: string;
  doctor_name: string;
  doctor_crm: string;
  specialties: string[];
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  scheduled: { label: "Agendada", color: "bg-primary/10 text-primary", dot: "bg-primary" },
  payment_pending: { label: "Aguardando pagamento", color: "bg-warning/10 text-warning", dot: "bg-warning animate-pulse" },
  waiting: { label: "Sala de espera", color: "bg-amber-500/10 text-amber-600", dot: "bg-amber-500" },
  in_progress: { label: "Em andamento", color: "bg-secondary/10 text-secondary", dot: "bg-secondary animate-pulse" },
  completed: { label: "Concluída", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  cancelled: { label: "Cancelada", color: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  no_show: { label: "Não compareceu", color: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
};

const PERIOD_OPTIONS = [
  { value: "all", label: "Todo período" },
  { value: "today", label: "Hoje" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mês" },
  { value: "last3", label: "Últimos 3 meses" },
  { value: "custom", label: "Personalizado" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3 } }),
};

const AppointmentsList = () => {
  const { user } = useAuth();
  
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
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => { if (user) fetchAppointments(); }, [user]);

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
      .select("id, scheduled_at, status, payment_status, duration_minutes, doctor_id")
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
      // Show payment_pending as visual status if payment not confirmed (issue #12)
      const displayStatus = (a.status === "scheduled" && a.payment_status === "pending") ? "payment_pending" : a.status;
      return {
        id: a.id,
        scheduled_at: a.scheduled_at,
        status: displayStatus,
        payment_status: a.payment_status ?? "pending",
        duration_minutes: a.duration_minutes,
        doctor_id: a.doctor_id,
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
      doc.text(`Data: ${format(new Date(a.scheduled_at), "dd/MM/yyyy 'às' HH:mm")} | Status: ${statusConfig[a.status]?.label ?? a.status} | Duração: ${a.duration_minutes || 30}min`, 14, y + 6);
      y += 16;
    });
    doc.save(`consultas-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF exportado com sucesso!");
  };

  const exportCSV = () => {
    const rows = [
      ["Médico", "CRM", "Data", "Hora", "Duração", "Status"],
      ...filtered.map(a => [
        a.doctor_name, a.doctor_crm,
        format(new Date(a.scheduled_at), "dd/MM/yyyy"),
        format(new Date(a.scheduled_at), "HH:mm"),
        `${a.duration_minutes || 30}min`,
        statusConfig[a.status]?.label ?? a.status,
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

  const activeFilterCount = (filterStatus !== "all" ? 1 : 0) + (period !== "all" ? 1 : 0) + (search ? 1 : 0);

  const renderAppointment = (appt: Appointment, i: number) => {
    const config = statusConfig[appt.status] ?? { label: appt.status, color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" };
    const isActive = ["waiting", "in_progress", "scheduled"].includes(appt.status);
    const scheduledDate = new Date(appt.scheduled_at);

    return (
      <motion.div
        key={appt.id}
        custom={i}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className={cn(
          "p-4 rounded-2xl border transition-all active:scale-[0.98]",
          appt.status === "in_progress" ? "border-secondary/40 bg-secondary/5" :
          appt.status === "waiting" ? "border-amber-500/30 bg-amber-500/5" :
          "border-border bg-card"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Date pill */}
          <div className="w-14 shrink-0 text-center">
            <div className="bg-primary/10 rounded-xl py-2">
              <p className="text-[11px] text-primary font-medium uppercase">
                {format(scheduledDate, "MMM", { locale: ptBR })}
              </p>
              <p className="text-xl font-bold text-primary leading-none mt-0.5">
                {format(scheduledDate, "dd")}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{format(scheduledDate, "HH:mm")}h</p>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-[15px] leading-tight truncate">{appt.doctor_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">CRM {appt.doctor_crm} · {appt.duration_minutes || 30}min</p>

            {appt.specialties.length > 0 && (
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {appt.specialties.slice(0, 2).map(s => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/8 text-primary font-medium">{s}</span>
                ))}
              </div>
            )}

            {/* Status + actions */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className={cn("flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full", config.color)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
                {config.label}
              </span>

              {isActive && (
                <Button
                  size="sm"
                  className="h-8 px-3 rounded-xl bg-gradient-hero text-primary-foreground text-xs font-medium gap-1"
                  onClick={() => navigate(`/dashboard/consultation/${appt.id}`)}
                >
                  <Video className="w-3.5 h-3.5" /> Entrar
                </Button>
              )}

              {(appt.status === "scheduled" || appt.status === "payment_pending") && (
                <CancelRescheduleDialog
                  appointmentId={appt.id}
                  doctorId={appt.doctor_id}
                  scheduledAt={appt.scheduled_at}
                  currentDate={format(scheduledDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  doctorName={appt.doctor_name}
                  onSuccess={fetchAppointments}
                />
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("appointments")}>
      <div className="max-w-2xl mx-auto pb-6">
        {/* Back */}
        <button
          onClick={() => navigate("/dashboard?role=patient")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao painel
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">Minhas Consultas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length} consulta{filtered.length !== 1 ? "s" : ""} · {upcoming.length} próxima{upcoming.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Export menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="rounded-xl h-10 w-10 shrink-0" aria-label="Mais opções">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader><SheetTitle>Exportar consultas</SheetTitle></SheetHeader>
              <div className="space-y-3 py-4">
                <Button variant="outline" className="w-full h-12 rounded-xl justify-start gap-3" onClick={exportCSV} disabled={filtered.length === 0}>
                  <Download className="w-5 h-5" /> Exportar CSV
                </Button>
                <Button variant="outline" className="w-full h-12 rounded-xl justify-start gap-3" onClick={exportPDF} disabled={filtered.length === 0}>
                  <FileText className="w-5 h-5" /> Exportar PDF
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Search + Filters */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar médico..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-2xl text-sm bg-muted/50 border-transparent focus:border-primary/30"
            />
          </div>
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl shrink-0 relative" aria-label="Filtrar">
                <Filter className="w-4.5 h-4.5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto">
              <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
              <div className="space-y-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Status</p>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="scheduled">Agendada</SelectItem>
                      <SelectItem value="waiting">Na espera</SelectItem>
                      <SelectItem value="in_progress">Em andamento</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Período</p>
                  <Select value={period} onValueChange={v => { setPeriod(v); if (v === "custom") setCalendarOpen(true); }}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Período" /></SelectTrigger>
                    <SelectContent>
                      {PERIOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {period === "custom" && (
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-11 rounded-xl mt-2 w-full text-sm">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {customFrom && customTo
                            ? `${format(customFrom, "dd/MM")} → ${format(customTo, "dd/MM")}`
                            : calendarStep === "from" ? "Selecione início" : "Selecione fim"}
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
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => { setFilterStatus("all"); setPeriod("all"); setSearch(""); }}>
                    Limpar
                  </Button>
                  <Button className="flex-1 h-11 rounded-xl bg-gradient-hero text-primary-foreground" onClick={() => setFiltersOpen(false)}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Upcoming */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Próximas ({upcoming.length})
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-2xl border border-border">
                  <Skeleton className="w-14 h-16 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-7 w-24 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-8 rounded-2xl border border-dashed border-border/40 bg-muted/10">
              <img src="/src/assets/mascot-welcome.png" alt="Pingo" className="w-20 h-20 object-contain mx-auto drop-shadow-md mb-3 select-none" />
              <p className="text-[13px] font-semibold text-foreground mb-1">Nenhuma consulta próxima</p>
              <p className="text-[11px] text-muted-foreground mb-3">Agende agora e cuide da sua saúde</p>
              <Button size="sm" className="rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-[0_3px_12px_rgba(37,99,235,.3)]" onClick={() => navigate("/dashboard/schedule")}>
                Agendar consulta
              </Button>
            </div>
          ) : (
            <div className="space-y-3">{upcoming.map((a, i) => renderAppointment(a, i))}</div>
          )}
        </div>

        {/* History */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" /> Histórico ({past.length})
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-2xl border border-border">
                  <Skeleton className="w-14 h-16 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : past.length === 0 ? (
            <div className="text-center py-8 rounded-2xl border border-dashed border-border/40 bg-muted/10">
              <img src="/src/assets/mascot-reading.png" alt="Pingo" className="w-20 h-20 object-contain mx-auto drop-shadow-md mb-3 select-none" />
              <p className="text-[13px] font-semibold text-foreground mb-1">Nenhuma consulta no histórico</p>
              <p className="text-[11px] text-muted-foreground">Suas consultas realizadas aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-3">{past.map((a, i) => renderAppointment(a, i))}</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AppointmentsList;
