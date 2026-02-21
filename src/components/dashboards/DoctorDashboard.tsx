import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, FileText, Users, DollarSign, Clock, Video, ChevronRight, TrendingUp, CheckCircle2, RefreshCw, BarChart2, Activity, Pill, ExternalLink } from "lucide-react";
import DoctorAnalyticsCharts from "./DoctorAnalyticsCharts";
import BlobKPICard from "@/components/ui/blob-kpi-card";
import DoctorOnboarding from "@/components/doctor/DoctorOnboarding";

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
  const [sparklines] = useState<Record<string, number[]>>({
    today: [0, 1, 0, 2, 1, 3, 0],
    patients: [4, 5, 3, 6, 5, 4, 7],
    prescriptions: [1, 0, 2, 1, 3, 2, 1],
    earnings: [100, 200, 150, 300, 250, 200, 350],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const now = new Date();

  useEffect(() => { if (user) fetchData(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("doctor-live-updates")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    const { data: docProfile } = await supabase.from("doctor_profiles").select("id, consultation_price").eq("user_id", user!.id).single();
    if (!docProfile) { setLoading(false); setRefreshing(false); return; }
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
    setRefreshing(false);
  };

  const waitingCount = todayAppts.filter(a => a.status === "waiting").length;
  const done = todayAppts.filter(a => a.status === "completed").length;
  const inProg = todayAppts.filter(a => a.status === "in_progress").length;
  const pct = todayAppts.length > 0 ? Math.round((done / todayAppts.length) * 100) : 0;

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("home")} role="doctor">
      <div className="max-w-5xl space-y-5">
        {/* ── Doctor Onboarding Checklist ── */}
        <DoctorOnboarding />

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Início
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Visão geral do sistema · {format(now, "HH:mm:ss", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {waitingCount > 0 && (
              <Button size="sm" className="bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20 h-8" onClick={() => navigate("/dashboard/doctor/waiting-room")}>
                <Clock className="w-3.5 h-3.5 mr-1.5" /> {waitingCount} esperando
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-8" onClick={() => fetchData(true)} disabled={refreshing}>
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""} mr-1.5`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 border border-border/40 h-9">
            <TabsTrigger value="overview" className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <BarChart2 className="w-3.5 h-3.5" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <TrendingUp className="w-3.5 h-3.5" /> Análises
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Activity className="w-3.5 h-3.5" /> Atividade
            </TabsTrigger>
          </TabsList>

          {/* ══ Visão Geral ══ */}
          <TabsContent value="overview" className="mt-5 space-y-5">

            {/* BLOB KPI Cards — Médico */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse bg-muted/50 rounded-full" />
                ))
              ) : (
                <>
                  <BlobKPICard variant={0} label="Hoje" value={stats.today} icon={<Calendar className="w-5 h-5" />} color="primary" delay={0} />
                  <BlobKPICard variant={1} label="Pacientes" value={stats.total_patients} icon={<Users className="w-5 h-5" />} color="secondary" delay={0.07} onClick={() => navigate("/dashboard/patients")} />
                  <BlobKPICard variant={2} label="Receitas" value={stats.prescriptions} icon={<FileText className="w-5 h-5" />} color="warning" delay={0.14} onClick={() => navigate("/dashboard/prescriptions")} />
                  <BlobKPICard variant={3} label="Ganhos" value={`R$${stats.totalEarnings.toFixed(0)}`} icon={<DollarSign className="w-5 h-5" />} color="success" delay={0.21} onClick={() => navigate("/dashboard/earnings")} />
                </>
              )}
            </div>

            {/* Progress bar */}
            {!loading && todayAppts.length > 0 && (
              <Card className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">Progresso de hoje</p>
                    </div>
                    <span className="text-sm font-bold text-foreground">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-success" /> {done} concluída{done !== 1 ? "s" : ""}
                    </span>
                    {inProg > 0 && (
                      <span className="flex items-center gap-1">
                        <Video className="w-3 h-3 text-primary" /> {inProg} em andamento
                      </span>
                    )}
                    {waitingCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-warning" /> {waitingCount} aguardando
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's schedule */}
            <Card className="border-border/60">
              <CardHeader className="pb-3 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Agenda de Hoje
                    {!loading && todayAppts.length > 0 && (
                      <Badge variant="outline" className="ml-1 text-[10px] h-4 px-1.5">{todayAppts.length}</Badge>
                    )}
                  </CardTitle>
                  <Button size="sm" variant="ghost" className="text-xs text-primary h-7" onClick={() => navigate("/dashboard/availability")}>
                    Configurar →
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/40">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-7 w-20 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : todayAppts.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <Calendar className="w-7 h-7 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">Agenda livre hoje</p>
                    <p className="text-xs text-muted-foreground mb-4">Nenhuma consulta agendada para hoje 🎉</p>
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
                            : "border-border/50 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                            a.status === "in_progress" ? "bg-success/15" : a.status === "waiting" ? "bg-warning/15" : "bg-muted/60"
                          }`}>
                            <p className="text-sm font-bold text-foreground leading-none">{format(new Date(a.scheduled_at), "HH")}</p>
                            <p className="text-[9px] text-muted-foreground">{format(new Date(a.scheduled_at), "mm")}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{a.patient_name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border inline-block ${statusColor[a.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                                {statusLabel[a.status] ?? a.status}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{a.duration_minutes || 30}min</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {(a.status === "scheduled" || a.status === "waiting") && (
                            <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-white text-xs h-8 px-3" onClick={() => navigate(`/dashboard/consultation/${a.id}`)}>
                              <Video className="w-3 h-3 mr-1" /> Iniciar
                            </Button>
                          )}
                          {a.status === "completed" && (
                            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => navigate(`/dashboard/prescribe/${a.id}`)}>
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

            {/* Upcoming appointments */}
            {upcomingAppts.length > 0 && (
              <Card className="border-border/60">
                <CardHeader className="pb-3 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" /> Próximas Consultas
                    </CardTitle>
                    <Button size="sm" variant="ghost" className="text-xs text-primary h-7" onClick={() => navigate("/dashboard/doctor/consultations")}>
                      Ver todas →
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1.5">
                    {upcomingAppts.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors">
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Consultas", sub: "Histórico", icon: Clock, color: "bg-primary/10", iconColor: "text-primary", path: "/dashboard/doctor/consultations" },
                { label: "Receitas", sub: "Prescrições", icon: FileText, color: "bg-warning/10", iconColor: "text-warning", path: "/dashboard/prescriptions" },
                { label: "Sala de Espera", sub: "Fila ao vivo", icon: Video, color: "bg-success/10", iconColor: "text-success", path: "/dashboard/doctor/waiting-room" },
                { label: "Calendário", sub: "Agenda semanal", icon: Calendar, color: "bg-secondary/10", iconColor: "text-secondary", path: "/dashboard/doctor/calendar" },
              ].map(item => (
                <Card
                  key={item.label}
                  className="border-border/60 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                  onClick={() => navigate(item.path)}
                >
                  <CardContent className="p-4 flex flex-col items-start gap-2">
                    <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center`}>
                      <item.icon className={`w-4.5 h-4.5 ${item.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.sub}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Memed Digital Prescription */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 hover:shadow-md transition-all">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shrink-0">
                      <Pill className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2 flex-wrap">
                        Memed — Receita Digital
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Integrado</Badge>
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                        Base de medicamentos completa do Brasil
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs flex-1 sm:flex-none"
                      onClick={() => window.open("https://memed.com.br/login", "_blank")}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Portal
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gradient-hero text-primary-foreground gap-1.5 text-xs flex-1 sm:flex-none"
                      onClick={() => navigate("/dashboard/prescriptions")}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Receitas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ Análises ══ */}
          <TabsContent value="analytics" className="mt-5">
            <DoctorAnalyticsCharts />
          </TabsContent>

          {/* ══ Atividade ══ */}
          <TabsContent value="activity" className="mt-5">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Histórico de Atividade</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-6">Consulte a aba Consultas para o histórico completo.</p>
                <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard/doctor/consultations")}>
                  Ver Consultas
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
