import { useEffect, useState } from "react";
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
import { motion } from "framer-motion";
import { Calendar, FileText, Users, DollarSign, Clock, Video, ChevronRight, TrendingUp, CheckCircle2, RefreshCw, BarChart2, Activity, Pill, ExternalLink, ArrowRight, Sparkles } from "lucide-react";
import DoctorAnalyticsCharts from "./DoctorAnalyticsCharts";
import DoctorOnboarding from "@/components/doctor/DoctorOnboarding";
import SectionErrorBoundary from "@/components/ui/section-error-boundary";
import { useDoctorStats } from "@/hooks/useDoctorDashboard";
import { useQueryClient } from "@tanstack/react-query";

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

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } };

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const now = new Date();

  const { data, isLoading: loading, isRefetching: refreshing } = useDoctorStats();

  const stats = data?.stats ?? { today: 0, total_patients: 0, prescriptions: 0, totalEarnings: 0 };
  const todayAppts = (data?.todayAppts ?? []) as any[];
  const upcomingAppts = (data?.upcomingAppts ?? []) as any[];

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("doctor-live-updates")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["doctor-dashboard-stats"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const waitingCount = todayAppts.filter(a => a.status === "waiting").length;
  const done = todayAppts.filter(a => a.status === "completed").length;
  const inProg = todayAppts.filter(a => a.status === "in_progress").length;
  const pct = todayAppts.length > 0 ? Math.round((done / todayAppts.length) * 100) : 0;
  
  // Next patient info
  const nextPatient = todayAppts.find(a => a.status === "scheduled" || a.status === "waiting");
  const nextPatientTime = nextPatient ? format(new Date(nextPatient.scheduled_at), "HH:mm") : null;
  const minutesUntilNext = nextPatient ? Math.max(0, Math.round((new Date(nextPatient.scheduled_at).getTime() - Date.now()) / 60000)) : null;

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("home")} role="doctor">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl space-y-6">
        <SectionErrorBoundary fallbackTitle="Erro no checklist de ativação">
          <DoctorOnboarding />
        </SectionErrorBoundary>

        {/* Header */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Painel Médico</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visão geral · {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {waitingCount > 0 && (
              <Button size="sm" className="bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20 h-9 gap-1.5" onClick={() => navigate("/dashboard/doctor/waiting-room")}>
                <Clock className="w-3.5 h-3.5" /> {waitingCount} esperando
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={() => queryClient.refetchQueries({ queryKey: ["doctor-dashboard-stats"] })} disabled={refreshing}>
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </motion.div>

        {/* Next patient banner */}
        {!loading && nextPatient && (
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 cursor-pointer active:scale-[0.99] transition-all" onClick={() => navigate(`/dashboard/consultation/${nextPatient.id}`)}>
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary leading-none">{nextPatientTime}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">Próximo: {nextPatient.patient_name}</p>
                <p className="text-xs text-muted-foreground">
                  {minutesUntilNext !== null && minutesUntilNext <= 60
                    ? `⏰ Em ${minutesUntilNext}min`
                    : `${nextPatient.duration_minutes || 30}min de consulta`}
                </p>
              </div>
              <Button size="sm" className="bg-primary text-primary-foreground text-xs h-9 px-4 rounded-xl gap-1.5 shrink-0">
                <Video className="w-3.5 h-3.5" /> {nextPatient.status === "waiting" ? "Atender" : "Iniciar"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* KPI Cards — clean card style */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse bg-muted/50 rounded-2xl" />)
          ) : (
            [
              { label: "Hoje", value: stats.today, icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
              { label: "Pacientes", value: stats.total_patients, icon: Users, color: "text-secondary", bg: "bg-secondary/10", path: "/dashboard/patients" },
              { label: "Receitas", value: stats.prescriptions, icon: FileText, color: "text-warning", bg: "bg-warning/10", path: "/dashboard/prescriptions" },
              { label: "Ganhos", value: `R$ ${stats.totalEarnings.toFixed(0)}`, icon: DollarSign, color: "text-success", bg: "bg-success/10", path: "/dashboard/earnings" },
            ].map((kpi) => (
              <button
                key={kpi.label}
                onClick={() => kpi.path && navigate(kpi.path)}
                className="p-4 rounded-2xl bg-card border border-border/50 hover:border-border hover:shadow-md transition-all text-left"
              >
                <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
                  <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">{kpi.label}</p>
              </button>
            ))
          )}
        </motion.div>

        {/* Tabs */}
        <motion.div variants={fadeUp}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-muted/50 border border-border/40 h-10 rounded-xl p-1">
              <TabsTrigger value="overview" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <BarChart2 className="w-3.5 h-3.5" /> Visão Geral
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <TrendingUp className="w-3.5 h-3.5" /> Análises
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Activity className="w-3.5 h-3.5" /> Atividade
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-5">
              {/* Progress bar */}
              {!loading && todayAppts.length > 0 && (
                <Card className="border-border/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <p className="text-sm font-semibold text-foreground">Progresso de hoje</p>
                      </div>
                      <span className="text-lg font-bold text-foreground">{pct}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden mb-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                      />
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-success" /> {done} concluída{done !== 1 ? "s" : ""}</span>
                      {inProg > 0 && <span className="flex items-center gap-1.5"><Video className="w-3 h-3 text-primary" /> {inProg} em andamento</span>}
                      {waitingCount > 0 && <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-warning" /> {waitingCount} aguardando</span>}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Today's schedule */}
              <Card className="border-border/50">
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Agenda de Hoje
                      {!loading && todayAppts.length > 0 && (
                        <Badge variant="outline" className="ml-1 text-[10px] h-5 px-2">{todayAppts.length}</Badge>
                      )}
                    </CardTitle>
                    <Button size="sm" variant="ghost" className="text-xs text-primary h-8 gap-1" onClick={() => navigate("/dashboard/availability")}>
                      Configurar <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-border/40">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
                          <Skeleton className="h-8 w-20 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  ) : todayAppts.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">Agenda livre hoje</p>
                      <p className="text-xs text-muted-foreground mb-5">Nenhuma consulta agendada 🎉</p>
                      <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/availability")}>Configurar horários</Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {todayAppts.map(a => (
                        <div
                          key={a.id}
                          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                            a.status === "in_progress" ? "border-success/30 bg-success/5" : a.status === "waiting" ? "border-warning/30 bg-warning/5" : "border-border/50 hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                              a.status === "in_progress" ? "bg-success/15" : a.status === "waiting" ? "bg-warning/15" : "bg-muted/60"
                            }`}>
                              <p className="text-sm font-bold text-foreground leading-none">{format(new Date(a.scheduled_at), "HH")}</p>
                              <p className="text-[9px] text-muted-foreground">{format(new Date(a.scheduled_at), "mm")}</p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{a.patient_name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border inline-block ${statusColor[a.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                                  {statusLabel[a.status] ?? a.status}
                                </span>
                                <span className="text-[10px] text-muted-foreground">{a.duration_minutes || 30}min</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {(a.status === "scheduled" || a.status === "waiting") && (
                              <Button size="sm" className="bg-primary text-primary-foreground text-xs h-9 px-4 rounded-xl gap-1.5" onClick={() => navigate(`/dashboard/consultation/${a.id}`)}>
                                <Video className="w-3.5 h-3.5" /> Iniciar
                              </Button>
                            )}
                            {a.status === "completed" && (
                              <Button size="sm" variant="outline" className="text-xs h-9 rounded-xl gap-1.5" onClick={() => navigate(`/dashboard/prescribe/${a.id}`)}>
                                <FileText className="w-3.5 h-3.5" /> Receita
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
                <Card className="border-border/50">
                  <CardHeader className="pb-3 pt-5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" /> Próximas Consultas
                      </CardTitle>
                      <Button size="sm" variant="ghost" className="text-xs text-primary h-8 gap-1" onClick={() => navigate("/dashboard/doctor/consultations")}>
                        Ver todas <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1.5">
                      {upcomingAppts.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
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
                  <Card key={item.label} className="border-border/50 hover:shadow-md hover:border-border transition-all duration-200 cursor-pointer hover:-translate-y-0.5" onClick={() => navigate(item.path)}>
                    <CardContent className="p-4 flex flex-col items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center`}>
                        <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.sub}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Memed */}
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shrink-0">
                        <Pill className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-2 flex-wrap">
                          Memed — Receita Digital
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Integrado</Badge>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">Base de medicamentos completa do Brasil</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => window.open("https://memed.com.br/login", "_blank")}>
                        <ExternalLink className="w-3.5 h-3.5" /> Portal
                      </Button>
                      <Button size="sm" className="bg-primary text-primary-foreground gap-1.5 text-xs" onClick={() => navigate("/dashboard/prescriptions")}>
                        <FileText className="w-3.5 h-3.5" /> Receitas
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <DoctorAnalyticsCharts />
            </TabsContent>

            <TabsContent value="activity" className="mt-6 space-y-4">
              {/* Quick stats summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Realizadas hoje", value: done, color: "text-success" },
                  { label: "Em andamento", value: inProg, color: "text-primary" },
                  { label: "Aguardando", value: waitingCount, color: "text-warning" },
                  { label: "Taxa conclusão", value: `${pct}%`, color: "text-foreground" },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl bg-muted/30 border border-border/40 text-center">
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <Card className="border-border/50">
                <CardHeader><CardTitle className="text-sm font-semibold">Consultas Recentes</CardTitle></CardHeader>
                <CardContent>
                  {todayAppts.length === 0 && upcomingAppts.length === 0 ? (
                    <div className="text-center py-8">
                      <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">Nenhuma atividade recente</p>
                      <Button variant="outline" className="rounded-xl" onClick={() => navigate("/dashboard/doctor/consultations")}>
                        Ver Histórico Completo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {[...todayAppts, ...upcomingAppts].slice(0, 8).map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 text-xs font-bold text-foreground">
                              {format(new Date(a.scheduled_at), "HH:mm")}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{a.patient_name}</p>
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border inline-block mt-0.5 ${statusColor[a.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                                {statusLabel[a.status] ?? a.status}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {format(new Date(a.scheduled_at), "dd/MM", { locale: ptBR })}
                          </span>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full rounded-xl mt-2" onClick={() => navigate("/dashboard/doctor/consultations")}>
                        Ver Histórico Completo
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
