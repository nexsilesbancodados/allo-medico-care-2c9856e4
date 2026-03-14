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
import { Calendar, FileText, Users, DollarSign, Clock, Video, ChevronRight, TrendingUp, CheckCircle2, RefreshCw, BarChart2, Activity, Pill, ExternalLink, ArrowRight, Sparkles, Star, ShieldCheck, Target, AlertTriangle } from "lucide-react";
import DoctorAnalyticsCharts from "./DoctorAnalyticsCharts";
import DoctorOnboarding from "@/components/doctor/DoctorOnboarding";
import SectionErrorBoundary from "@/components/ui/section-error-boundary";
import { useDoctorStats } from "@/hooks/useDoctorDashboard";
import { useQueryClient } from "@tanstack/react-query";
import { useGsapEntrance, useGsapFadeIn } from "@/hooks/use-gsap-entrance";

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

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } } };

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const now = new Date();

  const kpiRef  = useGsapEntrance({ stagger: 0.07, y: 14, delay: 0.2 });
  const heroRef = useGsapFadeIn({ y: 16, delay: 0.05 });

  const { data, isLoading: loading, isRefetching: refreshing } = useDoctorStats();

  interface DoctorAppointment {
    id: string;
    scheduled_at: string;
    status: string;
    patient_id: string;
    patient_name: string;
    duration_minutes: number | null;
  }

  const stats = data?.stats ?? { today: 0, total_patients: 0, prescriptions: 0, totalEarnings: 0 };
  const todayAppts = (data?.todayAppts ?? []) as DoctorAppointment[];
  const upcomingAppts = (data?.upcomingAppts ?? []) as DoctorAppointment[];

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
  
  const nextPatient = todayAppts.find(a => a.status === "scheduled" || a.status === "waiting");
  const nextPatientTime = nextPatient ? format(new Date(nextPatient.scheduled_at), "HH:mm") : null;
  const minutesUntilNext = nextPatient ? Math.max(0, Math.round((new Date(nextPatient.scheduled_at).getTime() - Date.now()) / 60000)) : null;

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("home")} role="doctor">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl space-y-5">
        <SectionErrorBoundary fallbackTitle="Erro no checklist de ativação">
          <DoctorOnboarding />
        </SectionErrorBoundary>

        {/* CRM verification status banner */}
        {!loading && data && !data.crmVerified && (
          <motion.div variants={fadeUp}>
            <div className="rounded-xl bg-warning/10 border border-warning/30 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-sm">Perfil em análise</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Seu CRM está sendo verificado pela nossa equipe. Você receberá um email quando seu perfil for ativado e puder receber pacientes.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ Hero Header — gradient card ═══ */}
        <motion.div variants={fadeUp}>
          <div ref={heroRef} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary via-secondary/90 to-primary/90 p-5 sm:p-6 text-primary-foreground shadow-2xl shadow-secondary/25">
            <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5 blur-2xl" />

            <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Painel Médico</h1>
                  {data?.crmVerified && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 border border-white/20 backdrop-blur-sm">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">CRM Verificado</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-white/70">
                  {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  {data?.crm && <span className="ml-2 text-white/50">· CRM {data.crm}/{data.crmState}</span>}
                </p>
                {!loading && (data?.rating ?? 0) > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(data?.rating ?? 0) ? "text-yellow-300 fill-yellow-300" : "text-white/20"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-bold">{(data?.rating ?? 0).toFixed(1)}</span>
                    <span className="text-xs text-white/60">({data?.totalReviews ?? 0})</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {waitingCount > 0 && (
                  <Button size="sm" className="bg-white/15 text-white border border-white/20 hover:bg-white/25 h-9 gap-1.5 backdrop-blur-sm rounded-xl" onClick={() => navigate("/dashboard/doctor/waiting-room")}>
                    <Clock className="w-3.5 h-3.5" /> {waitingCount} esperando
                  </Button>
                )}
                <Button size="sm" className="bg-white/15 text-white border border-white/20 hover:bg-white/25 h-9 gap-1.5 backdrop-blur-sm rounded-xl" onClick={() => queryClient.refetchQueries({ queryKey: ["doctor-dashboard-stats"] })} disabled={refreshing}>
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Inline KPIs */}
            <div ref={kpiRef} className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5" role="list" aria-label="Estatísticas do médico">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-xl shimmer-v2 bg-white/10" aria-hidden="true" />)
              ) : (
                [
                  { label: "Hoje", value: stats.today, icon: Calendar },
                  { label: "Pacientes", value: stats.total_patients, icon: Users },
                  { label: "Receitas", value: stats.prescriptions, icon: FileText },
                  { label: "Ganhos", value: `R$ ${stats.totalEarnings.toFixed(0)}`, icon: DollarSign },
                ].map((kpi, i) => (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.07, type: "spring", stiffness: 200, damping: 15 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10 hover:bg-white/15 transition-colors cursor-pointer"
                    role="listitem"
                    aria-label={`${kpi.label}: ${kpi.value}`}
                    onClick={() => {
                      const paths = [null, "/dashboard/patients", "/dashboard/prescriptions", "/dashboard/earnings"];
                      if (paths[i]) navigate(paths[i]!);
                    }}
                  >
                    <kpi.icon className="w-4 h-4 text-white/70 mb-2" aria-hidden="true" />
                    <p className="text-2xl font-bold leading-none tabular-nums" aria-hidden="true">{kpi.value}</p>
                    <p className="text-[10px] text-white/60 mt-1">{kpi.label}</p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Next patient banner */}
        {!loading && nextPatient && (
          <motion.div variants={fadeUp}>
            <div 
              className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-primary/20 cursor-pointer active:scale-[0.99] transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30" 
              onClick={() => navigate(`/dashboard/consultation/${nextPatient.id}`)}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex flex-col items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                <span className="text-sm font-bold text-white leading-none">{nextPatientTime}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">Próximo: {nextPatient.patient_name}</p>
                <p className="text-xs text-muted-foreground">
                  {minutesUntilNext !== null && minutesUntilNext <= 60
                    ? `⏰ Em ${minutesUntilNext}min`
                    : `${nextPatient.duration_minutes || 30}min de consulta`}
                </p>
              </div>
              <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-white text-xs h-10 px-5 rounded-xl gap-1.5 shrink-0 shadow-lg shadow-primary/20 hover:shadow-xl transition-shadow font-semibold">
                <Video className="w-3.5 h-3.5" /> {nextPatient.status === "waiting" ? "Atender" : "Iniciar"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Daily Summary Card — compact */}
        {!loading && todayAppts.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/15">
                      <Target className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Meta do Dia</p>
                      <p className="text-[10px] text-muted-foreground">Progresso das consultas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-foreground">{done}<span className="text-sm text-muted-foreground font-normal">/{todayAppts.length}</span></p>
                    <p className="text-[10px] text-muted-foreground">concluídas</p>
                  </div>
                </div>
                <div className="w-full h-3.5 rounded-full bg-muted overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      pct >= 100 ? "bg-gradient-to-r from-success to-success/70" : "bg-gradient-to-r from-primary to-secondary"
                    }`}
                  />
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-success" /> {done} concluída{done !== 1 ? "s" : ""}</span>
                  {inProg > 0 && <span className="flex items-center gap-1.5"><Video className="w-3 h-3 text-primary" /> {inProg} em andamento</span>}
                  {waitingCount > 0 && <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-warning" /> {waitingCount} aguardando</span>}
                  {pct >= 100 && <span className="flex items-center gap-1.5 text-success font-semibold">🎉 Meta atingida!</span>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pending Patients Alert */}
        {!loading && waitingCount > 1 && (
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-warning/5 border border-warning/20">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning to-warning/70 flex items-center justify-center shrink-0 shadow-md shadow-warning/15">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">⚠️ {waitingCount} pacientes aguardando</p>
                <p className="text-xs text-muted-foreground">Acesse a sala de espera para iniciar os atendimentos</p>
              </div>
              <Button size="sm" className="bg-gradient-to-r from-warning to-warning/80 text-white rounded-xl shrink-0 shadow-md shadow-warning/20 hover:shadow-lg transition-shadow">
                Atender
              </Button>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div variants={fadeUp}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-muted/50 border border-border/40 h-11 rounded-xl p-1">
              <TabsTrigger value="overview" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm font-semibold">
                <BarChart2 className="w-3.5 h-3.5" /> Visão Geral
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm font-semibold">
                <TrendingUp className="w-3.5 h-3.5" /> Análises
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm font-semibold">
                <Activity className="w-3.5 h-3.5" /> Atividade
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-5">
              {/* Today's schedule */}
              <Card className="border-border/50">
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                        <Calendar className="w-3.5 h-3.5 text-white" />
                      </div>
                      Agenda de Hoje
                      {!loading && todayAppts.length > 0 && (
                        <Badge className="ml-1 text-[10px] h-5 px-2 bg-primary/10 text-primary border-0">{todayAppts.length}</Badge>
                      )}
                    </CardTitle>
                    <Button size="sm" variant="ghost" className="text-xs text-primary h-8 gap-1 font-semibold" onClick={() => navigate("/dashboard/availability")}>
                      Configurar <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-border/40">
                          <Skeleton className="h-11 w-11 rounded-xl" />
                          <div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
                          <Skeleton className="h-9 w-20 rounded-xl" />
                        </div>
                      ))}
                    </div>
                  ) : todayAppts.length === 0 ? (
                    <div className="text-center py-12">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center mb-4 shadow-lg shadow-primary/5"
                      >
                        <Sparkles className="w-8 h-8 text-primary" />
                      </motion.div>
                      <p className="text-sm font-semibold text-foreground mb-1">Agenda livre hoje</p>
                      <p className="text-xs text-muted-foreground mb-5">Nenhuma consulta agendada 🎉</p>
                      <Button size="sm" className="rounded-xl bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20" onClick={() => navigate("/dashboard/availability")}>Configurar horários</Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {todayAppts.map(a => (
                        <div
                          key={a.id}
                          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all hover:shadow-md ${
                            a.status === "in_progress" ? "border-success/30 bg-success/5 hover:shadow-success/10" : a.status === "waiting" ? "border-warning/30 bg-warning/5 hover:shadow-warning/10" : "border-border/50 hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                              a.status === "in_progress" ? "bg-gradient-to-br from-success to-success/70 text-white" : a.status === "waiting" ? "bg-gradient-to-br from-warning to-warning/70 text-white" : "bg-muted/60"
                            }`}>
                              <p className={`text-sm font-bold leading-none ${a.status === "in_progress" || a.status === "waiting" ? "" : "text-foreground"}`}>{format(new Date(a.scheduled_at), "HH")}</p>
                              <p className={`text-[9px] ${a.status === "in_progress" || a.status === "waiting" ? "text-white/70" : "text-muted-foreground"}`}>{format(new Date(a.scheduled_at), "mm")}</p>
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
                              <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-white text-xs h-9 px-4 rounded-xl gap-1.5 shadow-md shadow-primary/15 hover:shadow-lg transition-shadow font-semibold" onClick={() => navigate(`/dashboard/consultation/${a.id}`)}>
                                <Video className="w-3.5 h-3.5" /> Iniciar
                              </Button>
                            )}
                            {a.status === "completed" && (
                              <Button size="sm" variant="outline" className="text-xs h-9 rounded-xl gap-1.5 font-semibold" onClick={() => navigate(`/dashboard/prescribe/${a.id}`)}>
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
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        Próximas Consultas
                      </CardTitle>
                      <Button size="sm" variant="ghost" className="text-xs text-primary h-8 gap-1 font-semibold" onClick={() => navigate("/dashboard/doctor/consultations")}>
                        Ver todas <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1.5">
                      {upcomingAppts.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 hover:bg-muted/30 hover:border-border/60 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/5 flex items-center justify-center shrink-0">
                              <Users className="w-4 h-4 text-primary" />
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

              {/* Quick access — gradient icons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Consultas", sub: "Histórico", icon: Clock, gradient: "from-primary to-primary/70", path: "/dashboard/doctor/consultations" },
                  { label: "Receitas", sub: "Prescrições", icon: FileText, gradient: "from-warning to-warning/70", path: "/dashboard/prescriptions" },
                  { label: "Sala de Espera", sub: "Fila ao vivo", icon: Video, gradient: "from-success to-success/70", path: "/dashboard/doctor/waiting-room" },
                  { label: "Calendário", sub: "Agenda semanal", icon: Calendar, gradient: "from-secondary to-secondary/70", path: "/dashboard/doctor/calendar" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Card className="border-border/50 hover:shadow-lg hover:border-border transition-all duration-200 cursor-pointer group overflow-hidden" onClick={() => navigate(item.path)}>
                      <CardContent className="p-4 flex flex-col items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                          <item.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.sub}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Memed — gradient accent */}
              <Card className="border-border/50 hover:shadow-lg transition-all overflow-hidden">
                <CardContent className="p-5 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] to-secondary/[0.03]" />
                  <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl shadow-primary/20 shrink-0">
                        <Pill className="w-6 h-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-2 flex-wrap">
                          Memed — Receita Digital
                          <Badge className="text-[10px] bg-success/10 text-success border-0 font-bold">Integrado</Badge>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">Base de medicamentos completa do Brasil</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl font-semibold" onClick={() => window.open("https://memed.com.br/login", "_blank")}>
                        <ExternalLink className="w-3.5 h-3.5" /> Portal
                      </Button>
                      <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-white gap-1.5 text-xs rounded-xl shadow-md shadow-primary/15 font-semibold" onClick={() => navigate("/dashboard/prescriptions")}>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Realizadas hoje", value: done, gradient: "from-success to-success/70" },
                  { label: "Em andamento", value: inProg, gradient: "from-primary to-primary/70" },
                  { label: "Aguardando", value: waitingCount, gradient: "from-warning to-warning/70" },
                  { label: "Taxa conclusão", value: `${pct}%`, gradient: "from-secondary to-secondary/70" },
                ].map(s => (
                  <div key={s.label} className="p-4 rounded-xl bg-card border border-border/40 text-center hover:shadow-md transition-all">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center mx-auto mb-2 shadow-sm`}>
                      <span className="text-xs font-bold text-white">{typeof s.value === 'number' && s.value > 0 ? '✓' : '–'}</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center">
                      <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    Consultas Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayAppts.length === 0 && upcomingAppts.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-3">
                        <Sparkles className="w-7 h-7 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">Nenhuma atividade recente</p>
                      <Button className="rounded-xl bg-gradient-to-r from-primary to-secondary text-white shadow-md" onClick={() => navigate("/dashboard/doctor/consultations")}>
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
                      <Button className="w-full rounded-xl mt-2 bg-gradient-to-r from-primary to-secondary text-white shadow-md" onClick={() => navigate("/dashboard/doctor/consultations")}>
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
