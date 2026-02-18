import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, FileText, Users, DollarSign, Clock, Video, ChevronRight, TrendingUp, CheckCircle2, Star } from "lucide-react";
import DoctorAnalyticsCharts from "./DoctorAnalyticsCharts";

const statusLabel: Record<string, string> = {
  scheduled: "Agendada", completed: "Concluída", cancelled: "Cancelada",
  in_progress: "Em andamento", waiting: "Na espera",
};

const statusColor: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  waiting: "bg-warning/10 text-warning border-warning/20",
  in_progress: "bg-success/10 text-success border-success/20",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const DoctorDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [todayAppts, setTodayAppts] = useState<any[]>([]);
  const [upcomingAppts, setUpcomingAppts] = useState<any[]>([]);
  const [stats, setStats] = useState({ today: 0, total_patients: 0, prescriptions: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  // Realtime waiting room
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("doctor-live-updates")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchData = async () => {
    const { data: docProfile } = await supabase.from("doctor_profiles").select("id, consultation_price").eq("user_id", user!.id).single();
    if (!docProfile) { setLoading(false); return; }
    const doctorId = docProfile.id;
    const price = Number(docProfile.consultation_price) || 89;

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [todayRes, totalPatientsRes, prescriptionsRes, completedRes, upcomingRes] = await Promise.all([
      supabase.from("appointments")
        .select("id, scheduled_at, status, patient_id, duration_minutes")
        .eq("doctor_id", doctorId)
        .gte("scheduled_at", todayStart.toISOString())
        .lte("scheduled_at", todayEnd.toISOString())
        .order("scheduled_at", { ascending: true }),
      supabase.from("appointments").select("patient_id").eq("doctor_id", doctorId),
      supabase.from("prescriptions").select("id", { count: "exact", head: true }).eq("doctor_id", doctorId),
      supabase.from("appointments").select("id", { count: "exact", head: true })
        .eq("doctor_id", doctorId).eq("status", "completed"),
      supabase.from("appointments")
        .select("id, scheduled_at, status, patient_id, duration_minutes")
        .eq("doctor_id", doctorId).eq("status", "scheduled")
        .gt("scheduled_at", todayEnd.toISOString())
        .order("scheduled_at", { ascending: true }).limit(5),
    ]);

    const uniquePatients = new Set(totalPatientsRes.data?.map(a => a.patient_id) ?? []);
    const completedCount = completedRes.count ?? 0;

    setStats({
      today: todayRes.data?.length ?? 0,
      total_patients: uniquePatients.size,
      prescriptions: prescriptionsRes.count ?? 0,
      totalEarnings: completedCount * price,
    });

    const allAppts = [...(todayRes.data ?? []), ...(upcomingRes.data ?? [])];
    if (allAppts.length > 0) {
      const patientIds = [...new Set(allAppts.map(a => a.patient_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", patientIds);
      const pMap = new Map(profiles?.map(p => [p.user_id, `${p.first_name} ${p.last_name}`]) ?? []);
      setTodayAppts((todayRes.data ?? []).map(a => ({ ...a, patient_name: pMap.get(a.patient_id) ?? "Paciente" })));
      setUpcomingAppts((upcomingRes.data ?? []).map(a => ({ ...a, patient_name: pMap.get(a.patient_id) ?? "Paciente" })));
    }
    setLoading(false);
  };

  const waitingCount = todayAppts.filter(a => a.status === "waiting").length;

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("home")}>
      <div className="max-w-4xl space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Olá, Dr(a). {profile?.first_name} {profile?.last_name} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          {waitingCount > 0 && (
            <Button size="sm" className="bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20 shrink-0" onClick={() => navigate("/dashboard/doctor/waiting-room")}>
              <Clock className="w-4 h-4 mr-1.5" /> {waitingCount} esperando
            </Button>
          )}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border">
                <CardContent className="pt-5 pb-4 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))
          ) : (
            [
              { label: "Hoje", value: stats.today, sub: "consulta(s)", icon: Calendar, color: "text-primary", bg: "bg-primary/10", path: null },
              { label: "Pacientes", value: stats.total_patients, sub: "atendidos", icon: Users, color: "text-secondary", bg: "bg-secondary/10", path: "/dashboard/patients" },
              { label: "Receitas", value: stats.prescriptions, sub: "emitidas", icon: FileText, color: "text-accent-foreground", bg: "bg-accent", path: "/dashboard/prescriptions" },
              { label: "Ganhos", value: `R$ ${stats.totalEarnings.toFixed(0)}`, sub: "total acumulado", icon: DollarSign, color: "text-success", bg: "bg-success/10", path: "/dashboard/earnings" },
            ].map(k => (
              <Card
                key={k.label}
                className={`border-border transition-all duration-200 ${k.path ? "cursor-pointer hover:shadow-card hover:-translate-y-0.5" : ""}`}
                onClick={() => k.path && navigate(k.path)}
              >
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                    <div className={`w-7 h-7 rounded-lg ${k.bg} flex items-center justify-center`}>
                      <k.icon className={`w-4 h-4 ${k.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{k.value}</p>
                  <p className="text-xs text-muted-foreground">{k.sub}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Today's performance bar */}
        {!loading && todayAppts.length > 0 && (() => {
          const done = todayAppts.filter(a => a.status === "completed").length;
          const inProg = todayAppts.filter(a => a.status === "in_progress").length;
          const waiting = todayAppts.filter(a => a.status === "waiting").length;
          const pct = Math.round((done / todayAppts.length) * 100);
          return (
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">Progresso de hoje</p>
                  </div>
                  <span className="text-sm font-bold text-foreground">{pct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-success" /> {done} concluída{done !== 1 ? "s" : ""}
                  </span>
                  {inProg > 0 && (
                    <span className="flex items-center gap-1">
                      <Video className="w-3 h-3 text-primary" /> {inProg} em andamento
                    </span>
                  )}
                  {waiting > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-warning" /> {waiting} aguardando
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Analytics */}
        <DoctorAnalyticsCharts />

        {/* Today's schedule */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Agenda de Hoje
                {!loading && todayAppts.length > 0 && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">({todayAppts.length})</span>
                )}
              </CardTitle>
              <Button size="sm" variant="ghost" className="text-xs text-primary" onClick={() => navigate("/dashboard/availability")}>
                Horários →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-7 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : todayAppts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Calendar className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Nenhuma consulta hoje</p>
                <p className="text-xs text-muted-foreground mb-4">Sua agenda está livre para hoje 🎉</p>
                <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/availability")}>
                  Configurar horários
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {todayAppts.map(a => (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      a.status === "in_progress"
                        ? "border-success/30 bg-success/5"
                        : a.status === "waiting"
                        ? "border-warning/30 bg-warning/5"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-center min-w-[44px]">
                        <p className="text-sm font-bold text-foreground">{format(new Date(a.scheduled_at), "HH:mm")}</p>
                        <p className="text-[10px] text-muted-foreground">{a.duration_minutes || 30}min</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{a.patient_name}</p>
                        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full border inline-block mt-0.5 ${statusColor[a.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                          {statusLabel[a.status] ?? a.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
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
          </CardContent>
        </Card>

        {/* Upcoming */}
        {upcomingAppts.length > 0 && (
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" /> Próximas Consultas
                </CardTitle>
                <Button size="sm" variant="ghost" className="text-xs text-primary" onClick={() => navigate("/dashboard/doctor/consultations")}>
                  Ver todas →
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {upcomingAppts.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{a.patient_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(a.scheduled_at), "dd/MM · HH:mm", { locale: ptBR })} · {a.duration_minutes || 30}min
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick access */}
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: "Consultas", sub: "Histórico completo", icon: Clock, color: "bg-primary/10", iconColor: "text-primary", path: "/dashboard/doctor/consultations" },
            { label: "Receitas", sub: "Prescrições emitidas", icon: FileText, color: "bg-secondary/10", iconColor: "text-secondary", path: "/dashboard/prescriptions" },
            { label: "Financeiro", sub: "Ganhos e pagamentos", icon: DollarSign, color: "bg-success/10", iconColor: "text-success", path: "/dashboard/earnings" },
          ].map(item => (
            <Card key={item.label} className="border-border hover:shadow-card transition-all duration-200 cursor-pointer hover:-translate-y-0.5" onClick={() => navigate(item.path)}>
              <CardContent className="pt-5 pb-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
