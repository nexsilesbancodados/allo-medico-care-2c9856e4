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
import { Calendar, Clock, CheckCircle, Video, Search, Download, RefreshCw, Filter, ChevronLeft, ChevronRight, Bell } from "lucide-react";
import { format, addDays, subDays, startOfDay, endOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";
import { useGsapEntrance } from "@/hooks/use-gsap-entrance";
import { PremiumHero } from "./PremiumHero";
import { BentoStatCards } from "./BentoStatCards";
import { PingoBanner } from "@/components/mascot/PingoMascot";
import { TimelineSchedule, ScheduleItem } from "./TimelineSchedule";

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

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } };

interface ReceptionAppointment {
  id: string;
  scheduled_at: string;
  status: string;
  patient_id: string | null;
  doctor_id: string;
  duration_minutes: number | null;
  appointment_type: string | null;
  notes: string | null;
  patient_name: string;
  doctor_name: string;
  patient_phone: string | null;
}

const ReceptionDashboard = () => {
  const [todayAppts, setTodayAppts] = useState<ReceptionAppointment[]>([]);
  const kpiRef = useGsapEntrance({ stagger: 0.07, y: 14, delay: 0.2 });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
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
      patientIds.length > 0 ? supabase.from("profiles").select("user_id, first_name, last_name, phone").in("user_id", patientIds.filter((id): id is string => !!id)) : { data: [] },
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
        a.patient_name, a.patient_phone ?? "", a.doctor_name,
        `${a.duration_minutes || 30}min`,
        statusLabel[a.status] ?? a.status,
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = `agenda-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast.success("Agenda exportada em CSV!");
  };

  const filteredAppts = todayAppts.filter(a => {
    const matchSearch = !debouncedSearch || a.patient_name.toLowerCase().includes(debouncedSearch.toLowerCase()) || a.doctor_name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <DashboardLayout title="Recepção" nav={getReceptionNav("overview")}>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl space-y-5">

        {/* ── Premium Hero ── */}
        <PremiumHero
          gradient="bg-gradient-to-br from-[#4A1F00] via-[#B05000] to-[#D97706]"
          orb1Color="radial-gradient(#FCD34D, transparent)"
          orb2Color="radial-gradient(#F59E0B, transparent)"
          tag={isToday ? `Agenda de Hoje · ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}` : format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          tagIcon={<Calendar className="w-4 h-4" />}
          name="Painel da Recepção"
          kpis={[
            { label: "Total", value: stats.total, icon: <Calendar className="w-4 h-4" /> },
            { label: "Na Fila", value: stats.waiting, icon: <Clock className="w-4 h-4" /> },
            { label: "Em Consulta", value: stats.inProgress, icon: <Video className="w-4 h-4" /> },
            { label: "Concluídas", value: stats.completed, icon: <CheckCircle className="w-4 h-4" /> },
          ]}
          loading={loading}
          onRefresh={() => fetchToday(true)}
          refreshing={refreshing}
          topRight={
            <div className="flex items-center gap-1">
              <button onClick={() => setSelectedDate(d => subDays(d, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 text-white/70 hover:bg-white/15 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button className="rounded-lg border border-white/20 px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/15 transition-colors">
                    {isToday ? "Hoje" : format(selectedDate, "dd/MM")}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComp mode="single" selected={selectedDate} onSelect={d => { if (d) { setSelectedDate(d); setCalendarOpen(false); } }} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <button onClick={() => setSelectedDate(d => addDays(d, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 text-white/70 hover:bg-white/15 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          }
        />

        {/* ── Bento Stats ── */}
        <BentoStatCards loading={loading} stats={[
          { label: "Total hoje", value: stats.total, icon: "📅", iconBg: "bg-amber-50 dark:bg-amber-950/30", valueColor: "text-amber-700 dark:text-amber-400" },
          { label: "Na fila", value: stats.waiting, icon: "⏳", iconBg: "bg-red-50 dark:bg-red-950/30", valueColor: "text-red-600 dark:text-red-400" },
          { label: "Em consulta", value: stats.inProgress, icon: "🎥", iconBg: "bg-emerald-50 dark:bg-emerald-950/30", valueColor: "text-emerald-600 dark:text-emerald-400" },
          { label: "Concluídas", value: stats.completed, icon: "✅", iconBg: "bg-blue-50 dark:bg-blue-950/30", valueColor: "text-[#1255C8] dark:text-blue-400" },
        ]} />

        {/* Pingo Banner */}
        <PingoBanner
          variant="reception"
          mascotSize={88}
          bgClass="bg-amber-50 dark:bg-amber-950/20"
          accentColor="text-amber-600 dark:text-amber-400"
          label="Recepção"
          title="Organize a agenda do dia"
          subtitle="Gerencie agendamentos e filas com facilidade"
        />

        {/* ── Timeline ── */}
        {filteredAppts.length > 0 && (
          <TimelineSchedule
            items={filteredAppts.slice(0, 8).map(a => ({
              id: a.id,
              time: format(new Date(a.scheduled_at), "HH:mm"),
              patientName: a.patient_name,
              doctorName: a.doctor_name,
              status: a.status as ScheduleItem["status"],
            }))}
          />
        )}

        {/* Search + filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Buscar paciente ou médico..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-sm rounded-xl" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-36 text-xs rounded-xl">
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
          <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1.5" onClick={() => fetchToday(true)} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1.5" onClick={exportCSV} disabled={loading || todayAppts.length === 0}>
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
        </div>

        {filteredAppts.length === 0 && !loading && (
          <div className="rounded-2xl border border-border/25 bg-card p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/40 text-[22px]">📅</div>
            <p className="text-[13px] font-semibold text-foreground">Nenhuma consulta encontrada</p>
            <p className="mt-1 text-[11.5px] text-muted-foreground">{isToday ? "Agenda vazia para hoje" : `Sem consultas em ${format(selectedDate, "dd/MM")}`}</p>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default ReceptionDashboard;
