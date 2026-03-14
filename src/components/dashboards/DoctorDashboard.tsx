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
import {
  Calendar, FileText, Users, DollarSign, Clock, Video, ChevronRight,
  TrendingUp, CheckCircle2, RefreshCw, BarChart2, Activity, Pill,
  ExternalLink, ArrowRight, Sparkles, Star, ShieldCheck, Target,
  AlertTriangle, Bell
} from "lucide-react";
import DoctorAnalyticsCharts from "./DoctorAnalyticsCharts";
import DoctorOnboarding from "@/components/doctor/DoctorOnboarding";
import SectionErrorBoundary from "@/components/ui/section-error-boundary";
import { useDoctorStats } from "@/hooks/useDoctorDashboard";
import { useQueryClient } from "@tanstack/react-query";
import { useGsapEntrance, useGsapFadeIn } from "@/hooks/use-gsap-entrance";

const statusLabel: Record<string, string> = {
  scheduled: "Confirmado", completed: "Concluída", cancelled: "Cancelada",
  in_progress: "Em andamento", waiting: "Sala de Espera",
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
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const now = new Date();

  const kpiRef = useGsapEntrance({ stagger: 0.07, y: 14, delay: 0.2 });
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

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 6) return "Boa madrugada";
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

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

        {/* ═══ Header bar — clean white with greeting ═══ */}
        <motion.div variants={fadeUp}>
          <div ref={heroRef} className="bg-card rounded-2xl border border-border/50 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20 shrink-0">
                  {(profile?.first_name?.[0] ?? "D")}{(profile?.last_name?.[0] ?? "")}
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    {greeting()}, Dr. {profile?.first_name || "Médico"}!
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {!loading && (
                      <>
                        Você tem <span className="font-semibold text-foreground">{stats.today} consultas</span> agendadas para hoje
                        {data?.pendingReports !== undefined && data.pendingReports > 0 && (
                          <> e <span className="font-semibold text-foreground">{data.pendingReports} laudos</span> pendentes na fila</>
                        )}
                        .
                      </>
                    )}
                  </p>
                  {!loading && data?.crm && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground">CRM {data.crm}/{data.crmState}</span>
                      {data?.crmVerified && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-success/10 text-success">
                          <ShieldCheck className="w-3 h-3" />
                          <span className="text-[10px] font-bold">Verificado</span>
                        </div>
                      )}
                      {!loading && (data?.rating ?? 0) > 0 && (
                        <div className="flex items-center gap-1 ml-1">
                          <Star className="w-3 h-3 text-warning fill-warning" />
                          <span className="text-xs font-semibold text-foreground">{(data?.rating ?? 0).toFixed(1)}</span>
                          <span className="text-[10px] text-muted-foreground">({data?.totalReviews ?? 0})</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {waitingCount > 0 && (
                  <Button size="sm" variant="outline" className="h-9 gap-1.5 rounded-xl text-xs font-semibold border-warning/30 text-warning hover:bg-warning/5" onClick={() => navigate("/dashboard/doctor/waiting-room")}>
                    <Clock className="w-3.5 h-3.5" /> {waitingCount} esperando
                  </Button>
                )}
                <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl relative" onClick={() => navigate("/dashboard/doctor/waiting-room")}>
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  {waitingCount > 0 && <span className="absolute -top-1 -right-1 size-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-bold">{waitingCount}</span>}
                </Button>
                <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl" onClick={() => queryClient.refetchQueries({ queryKey: ["doctor-dashboard-stats"] })} disabled={refreshing}>
                  <RefreshCw className={`w-4 h-4 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ KPI Cards — clean white cards with colored icons ═══ */}
        <motion.div variants={fadeUp}>
          <div ref={kpiRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3" role="list" aria-label="Estatísticas do médico">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
            ) : (
              [
                { label: "Pacientes de Hoje", value: stats.today, icon: Users, sub: `+${done} concluído${done !== 1 ? 's' : ''}`, color: "text-primary", bg: "bg-primary/10" },
                { label: "Laudos Pendentes", value: data?.pendingReports ?? 0, icon: FileText, sub: "Necessário atenção", color: "text-warning", bg: "bg-warning/10" },
                { label: "Ganhos Mensais", value: `R$ ${(stats.totalEarnings / 1000).toFixed(1)}k`, icon: DollarSign, sub: "Este mês", color: "text-success", bg: "bg-success/10" },
                { label: "Tempo Médio", value: "30m", icon: Clock, sub: "Por consulta", color: "text-secondary", bg: "bg-secondary/10" },
              ].map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07, type: "spring", stiffness: 200, damping: 15 }}
                  role="listitem"
                  aria-label={`${kpi.label}: ${kpi.value}`}
                  className="bg-card rounded-xl border border-border/50 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    const paths = [null, "/dashboard/doctor/report-queue", "/dashboard/earnings", null];
                    if (paths[i]) navigate(paths[i]!);
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`size-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                      <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground leading-none tabular-nums">{kpi.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">{kpi.sub}</p>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Next patient banner */}
        {!loading && nextPatient && (
          <motion.div variants={fadeUp}>
            <div
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-primary/20 cursor-pointer active:scale-[0.99] transition-all hover:shadow-lg hover:border-primary/30"
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
              <Button size="sm" className="bg-primary text-primary-foreground text-xs h-10 px-5 rounded-xl gap-1.5 shrink-0 shadow-md shadow-primary/20 font-semibold">
                <Video className="w-3.5 h-3.5" /> {nextPatient.status === "waiting" ? "Atender" : "Iniciar"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Daily Progress Card */}
        {!loading && todayAppts.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Target className="w-4.5 h-4.5 text-primary" />
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
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${pct >= 100 ? "bg-success" : "bg-primary"}`}
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
            <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/5 border border-warning/20">
              <div className="size-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">⚠️ {waitingCount} pacientes aguardando</p>
                <p className="text-xs text-muted-foreground">Acesse a sala de espera para iniciar os atendimentos</p>
              </div>
              <Button size="sm" className="bg-warning text-warning-foreground rounded-xl shrink-0 shadow-md shadow-warning/20" onClick={() => navigate("/dashboard/doctor/waiting-room")}>
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
              {/* ═══ Today's patients — Table style like mockup ═══ */}
              <Card className="border-border/50">
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                      </div>
                      Próximos Pacientes
                      {!loading && todayAppts.length > 0 && (
                        <Badge className="ml-1 text-[10px] h-5 px-2 bg-primary/10 text-primary border-0">{todayAppts.length}</Badge>
                      )}
                    </CardTitle>
                    <Button size="sm" variant="ghost" className="text-xs text-primary h-8 gap-1 font-semibold" onClick={() => navigate("/dashboard/doctor/consultations")}>
                      Ver todos <ArrowRight className="w-3 h-3" />
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
                        className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
                      >
                        <Sparkles className="w-8 h-8 text-primary" />
                      </motion.div>
                      <p className="text-sm font-semibold text-foreground mb-1">Agenda livre hoje</p>
                      <p className="text-xs text-muted-foreground mb-5">Nenhuma consulta agendada 🎉</p>
                      <Button size="sm" className="rounded-xl bg-primary text-primary-foreground" onClick={() => navigate("/dashboard/availability")}>Configurar horários</Button>
                    </div>
                  ) : (
                    /* Table-style list */
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-border/40">
                            <th className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-3 pl-1">Paciente</th>
                            <th className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-3">Horário</th>
                            <th className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-3 hidden sm:table-cell">Tipo</th>
                            <th className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-3">Status</th>
                            <th className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-3 text-right pr-1">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {todayAppts.map(a => (
                            <tr key={a.id} className="group hover:bg-muted/30 transition-colors">
                              <td className="py-3 pl-1">
                                <div className="flex items-center gap-3">
                                  <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                    {a.patient_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                  </div>
                                  <p className="text-sm font-semibold text-foreground truncate max-w-[160px]">{a.patient_name}</p>
                                </div>
                              </td>
                              <td className="py-3">
                                <p className="text-sm text-foreground font-medium">{format(new Date(a.scheduled_at), "HH:mm")}</p>
                              </td>
                              <td className="py-3 hidden sm:table-cell">
                                <span className="text-xs text-muted-foreground">{a.duration_minutes || 30}min</span>
                              </td>
                              <td className="py-3">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusColor[a.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                                  {statusLabel[a.status] ?? a.status}
                                </span>
                              </td>
                              <td className="py-3 text-right pr-1">
                                {(a.status === "scheduled" || a.status === "waiting") && (
                                  <Button size="sm" className="bg-primary text-primary-foreground text-xs h-8 px-3 rounded-lg gap-1 font-semibold" onClick={() => navigate(`/dashboard/consultation/${a.id}`)}>
                                    <Video className="w-3 h-3" /> Iniciar
                                  </Button>
                                )}
                                {a.status === "completed" && (
                                  <Button size="sm" variant="outline" className="text-xs h-8 px-3 rounded-lg gap-1 font-semibold" onClick={() => navigate(`/dashboard/prescribe/${a.id}`)}>
                                    <FileText className="w-3 h-3" /> Receita
                                  </Button>
                                )}
                                {a.status === "in_progress" && (
                                  <Button size="sm" className="bg-success text-success-foreground text-xs h-8 px-3 rounded-lg gap-1 font-semibold" onClick={() => navigate(`/dashboard/consultation/${a.id}`)}>
                                    <Video className="w-3 h-3" /> Entrar
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                        <div className="size-7 rounded-lg bg-muted flex items-center justify-center">
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
                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
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

              {/* Quick access — clean white cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Consultas", sub: "Histórico", icon: Clock, color: "text-primary", bg: "bg-primary/10", path: "/dashboard/doctor/consultations" },
                  { label: "Receitas", sub: "Prescrições", icon: FileText, color: "text-warning", bg: "bg-warning/10", path: "/dashboard/prescriptions" },
                  { label: "Sala de Espera", sub: "Fila ao vivo", icon: Video, color: "text-success", bg: "bg-success/10", path: "/dashboard/doctor/waiting-room" },
                  { label: "Calendário", sub: "Agenda semanal", icon: Calendar, color: "text-secondary", bg: "bg-secondary/10", path: "/dashboard/doctor/calendar" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Card className="border-border/50 hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden" onClick={() => navigate(item.path)}>
                      <CardContent className="p-4 flex flex-col items-start gap-3">
                        <div className={`size-10 rounded-xl ${item.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                          <item.icon className={`w-5 h-5 ${item.color}`} />
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

              {/* Memed integration */}
              <Card className="border-border/50 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Pill className="w-6 h-6 text-primary" />
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
                      <Button size="sm" className="bg-primary text-primary-foreground gap-1.5 text-xs rounded-xl shadow-md shadow-primary/15 font-semibold" onClick={() => navigate("/dashboard/prescriptions")}>
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
                  { label: "Realizadas hoje", value: done, color: "text-success", bg: "bg-success/10" },
                  { label: "Em andamento", value: inProg, color: "text-primary", bg: "bg-primary/10" },
                  { label: "Aguardando", value: waitingCount, color: "text-warning", bg: "bg-warning/10" },
                  { label: "Taxa conclusão", value: `${pct}%`, color: "text-secondary", bg: "bg-secondary/10" },
                ].map(s => (
                  <div key={s.label} className="p-4 rounded-xl bg-card border border-border/40 text-center hover:shadow-md transition-all duration-200">
                    <div className={`size-8 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                      <span className={`text-xs font-bold ${s.color}`}>{typeof s.value === 'number' && s.value > 0 ? '✓' : '–'}</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <div className="size-7 rounded-lg bg-muted flex items-center justify-center">
                      <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    Consultas Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayAppts.length === 0 && upcomingAppts.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                        <Sparkles className="w-7 h-7 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">Nenhuma atividade recente</p>
                      <Button className="rounded-xl bg-primary text-primary-foreground" onClick={() => navigate("/dashboard/doctor/consultations")}>
                        Ver Histórico Completo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {[...todayAppts, ...upcomingAppts].slice(0, 8).map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-foreground">
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
                      <Button className="w-full rounded-xl mt-2 bg-primary text-primary-foreground" onClick={() => navigate("/dashboard/doctor/consultations")}>
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
