import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "./doctorNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Video, UserCheck, UserPlus, AlertTriangle } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, isSameDay, isSameMonth, eachDayOfInterval, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeLabel: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  first_visit: { label: "1ª Consulta", icon: <UserPlus className="w-3 h-3" />, color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  return: { label: "Retorno", icon: <UserCheck className="w-3 h-3" />, color: "bg-green-500/10 text-green-700 border-green-200" },
  urgency: { label: "Urgência", icon: <AlertTriangle className="w-3 h-3" />, color: "bg-red-500/10 text-red-700 border-red-200" },
};

const statusColor: Record<string, string> = {
  scheduled: "border-l-primary",
  completed: "border-l-green-500",
  cancelled: "border-l-destructive",
  in_progress: "border-l-yellow-500",
  waiting: "border-l-orange-400",
};

const DoctorCalendar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchAppointments(); }, [user, currentDate, view]);

  const dateRange = useMemo(() => {
    if (view === "day") return { start: new Date(currentDate.setHours(0,0,0,0)), end: new Date(new Date(currentDate).setHours(23,59,59,999)) };
    if (view === "week") return { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) };
    return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
  }, [currentDate, view]);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data: doc } = await supabase.from("doctor_profiles").select("id").eq("user_id", user!.id).single();
    if (!doc) { setLoading(false); return; }

    const { data } = await supabase.from("appointments")
      .select("id, scheduled_at, status, patient_id, duration_minutes, appointment_type, guest_patient_id, notes")
      .eq("doctor_id", doc.id)
      .gte("scheduled_at", dateRange.start.toISOString())
      .lte("scheduled_at", dateRange.end.toISOString())
      .order("scheduled_at", { ascending: true });

    if (!data || data.length === 0) { setAppointments([]); setLoading(false); return; }

    const patientIds = [...new Set(data.filter(a => a.patient_id).map(a => a.patient_id))];
    const guestIds = [...new Set(data.filter(a => a.guest_patient_id).map(a => a.guest_patient_id))];

    const [pRes, gRes] = await Promise.all([
      patientIds.length ? supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", patientIds) : { data: [] },
      guestIds.length ? supabase.from("guest_patients").select("id, full_name").in("id", guestIds) : { data: [] },
    ]);

    const pMap = new Map((pRes.data ?? []).map((p: any) => [p.user_id, `${p.first_name} ${p.last_name}`]));
    const gMap = new Map((gRes.data ?? []).map((g: any) => [g.id, g.full_name]));

    setAppointments(data.map(a => ({
      ...a,
      patient_name: a.patient_id ? (pMap.get(a.patient_id) ?? "Paciente") : (gMap.get(a.guest_patient_id) ?? "Avulso"),
    })));
    setLoading(false);
  };

  const navigate_date = (dir: number) => {
    if (view === "day") setCurrentDate(prev => dir > 0 ? addDays(prev, 1) : subDays(prev, 1));
    else if (view === "week") setCurrentDate(prev => dir > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1));
    else setCurrentDate(prev => dir > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const days = useMemo(() => eachDayOfInterval({ start: dateRange.start, end: dateRange.end }), [dateRange]);

  const AppointmentCard = ({ appt }: { appt: any }) => {
    const t = typeLabel[appt.appointment_type] ?? typeLabel.first_visit;
    return (
      <div className={`p-2 rounded-md border border-l-4 ${statusColor[appt.status] ?? "border-l-muted"} bg-card hover:bg-accent/50 cursor-pointer transition-colors`}
        onClick={() => appt.status === "scheduled" ? navigate(`/dashboard/consultation/${appt.id}`) : undefined}>
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-medium text-foreground truncate">{appt.patient_name}</p>
          <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border ${t.color}`}>
            {t.icon} {t.label}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {format(new Date(appt.scheduled_at), "HH:mm")} · {appt.duration_minutes || 30}min
        </p>
      </div>
    );
  };

  const headerLabel = view === "day"
    ? format(currentDate, "EEEE, dd 'de' MMMM yyyy", { locale: ptBR })
    : view === "week"
    ? `${format(dateRange.start, "dd MMM", { locale: ptBR })} — ${format(dateRange.end, "dd MMM yyyy", { locale: ptBR })}`
    : format(currentDate, "MMMM yyyy", { locale: ptBR });

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("calendar")}>
      <div className="max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calendário</h1>
            <p className="text-sm text-muted-foreground">Visualize sua agenda completa</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList>
                <TabsTrigger value="day">Dia</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="month">Mês</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate_date(-1)}><ChevronLeft className="w-5 h-5" /></Button>
          <h2 className="text-lg font-semibold text-foreground capitalize">{headerLabel}</h2>
          <Button variant="ghost" size="icon" onClick={() => navigate_date(1)}><ChevronRight className="w-5 h-5" /></Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-12">Carregando agenda...</p>
        ) : view === "day" ? (
          /* DAY VIEW */
          <Card className="border-border">
            <CardContent className="p-4 space-y-2">
              {appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma consulta neste dia.</p>
              ) : appointments.map(a => <AppointmentCard key={a.id} appt={a} />)}
            </CardContent>
          </Card>
        ) : view === "week" ? (
          /* WEEK VIEW */
          <div className="grid grid-cols-7 gap-2">
            {days.map(day => {
              const dayAppts = appointments.filter(a => isSameDay(new Date(a.scheduled_at), day));
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className={`min-h-[140px] rounded-lg border p-2 ${isToday ? "border-primary bg-primary/5" : "border-border"}`}>
                  <p className={`text-xs font-medium mb-2 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {format(day, "EEE dd", { locale: ptBR })}
                  </p>
                  <div className="space-y-1">
                    {dayAppts.map(a => <AppointmentCard key={a.id} appt={a} />)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* MONTH VIEW */
          <div className="grid grid-cols-7 gap-1">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(d => (
              <div key={d} className="text-xs font-medium text-muted-foreground text-center py-2">{d}</div>
            ))}
            {/* Padding for first day */}
            {Array.from({ length: (getDay(dateRange.start) + 6) % 7 }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[80px]" />
            ))}
            {days.map(day => {
              const dayAppts = appointments.filter(a => isSameDay(new Date(a.scheduled_at), day));
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()}
                  className={`min-h-[80px] rounded border p-1 cursor-pointer hover:bg-accent/30 transition-colors ${isToday ? "border-primary bg-primary/5" : "border-border"}`}
                  onClick={() => { setCurrentDate(day); setView("day"); }}>
                  <p className={`text-xs font-medium ${isToday ? "text-primary" : "text-foreground"}`}>
                    {format(day, "d")}
                  </p>
                  {dayAppts.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {dayAppts.slice(0, 2).map(a => (
                        <div key={a.id} className={`text-[10px] truncate px-1 py-0.5 rounded ${statusColor[a.status]?.replace("border-l-", "bg-") + "/10" || "bg-muted"}`}>
                          {format(new Date(a.scheduled_at), "HH:mm")} {a.patient_name?.split(" ")[0]}
                        </div>
                      ))}
                      {dayAppts.length > 2 && (
                        <p className="text-[10px] text-muted-foreground">+{dayAppts.length - 2} mais</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
          {Object.entries(typeLabel).map(([key, val]) => (
            <span key={key} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${val.color}`}>
              {val.icon} {val.label}
            </span>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorCalendar;
