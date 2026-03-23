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
  AlertTriangle, Bell, Plus, MoreVertical, Download, Filter, Search, Stethoscope
} from "lucide-react";
import DoctorAnalyticsCharts from "./DoctorAnalyticsCharts";
import DoctorOnboarding from "@/components/doctor/DoctorOnboarding";
import SectionErrorBoundary from "@/components/ui/section-error-boundary";
import { useDoctorStats } from "@/hooks/useDoctorDashboard";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardHero } from "./DashboardHero";
import { DashboardStatCards } from "./DashboardStatCards";
import { DashboardQuickActions } from "./DashboardQuickActions";
import { DashboardShortcuts } from "./DashboardShortcuts";

const statusLabel: Record<string, string> = {
  scheduled: "Agendado", completed: "Concluída", cancelled: "Cancelada",
  in_progress: "Em andamento", waiting: "Em Espera",
};

const statusColor: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary",
  waiting: "bg-warning/10 text-warning",
  in_progress: "bg-success/10 text-success",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const DoctorDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

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

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 6) return "Boa madrugada";
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const todayStr = format(new Date(), "dd 'de' MMMM", { locale: ptBR });

  const kpis = [
    {
      label: "PACIENTES DE HOJE",
      value: stats.today,
      badge: `+${done > 0 ? Math.round((done / Math.max(stats.today, 1)) * 100) : 0}%`,
      badgeColor: "bg-success/10 text-success",
      icon: Users,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      borderColor: "border-l-primary",
    },
    {
      label: "CONSULTAS PENDENTES",
      value: String(waitingCount + todayAppts.filter(a => a.status === "scheduled").length).padStart(2, "0"),
      badge: `${waitingCount} Pend.`,
      badgeColor: "bg-warning/10 text-warning",
      icon: Clock,
      iconColor: "text-warning",
      iconBg: "bg-warning/10",
      borderColor: "border-l-warning",
    },
    {
      label: "RECEITAS EMITIDAS",
      value: stats.prescriptions,
      badge: "Estável",
      badgeColor: "bg-success/10 text-success",
      icon: FileText,
      iconColor: "text-success",
      iconBg: "bg-success/10",
      borderColor: "border-l-success",
    },
    {
      label: "FATURAMENTO MENSAL",
      value: `R$ ${(stats.totalEarnings / 1000).toFixed(1).replace(".", ",")}k`,
      badge: `+${stats.totalEarnings > 0 ? "5,2" : "0"}%`,
      badgeColor: "bg-success/10 text-success",
      icon: DollarSign,
      iconColor: "text-foreground",
      iconBg: "bg-muted",
      borderColor: "border-l-foreground",
      isLarge: true,
    },
  ];

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("home")} role="doctor">
      <div className="max-w-6xl space-y-5">
        <SectionErrorBoundary fallbackTitle="Erro no checklist de ativação">
          <DoctorOnboarding />
        </SectionErrorBoundary>

        {/* CRM verification banner */}
        {!loading && data && !data.crmVerified && (
          <div className="rounded-2xl bg-warning/10 border border-warning/30 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-sm">Perfil em análise</p>
              <p className="text-xs text-muted-foreground mt-1">
                Seu CRM está sendo verificado pela nossa equipe. Você receberá um email quando seu perfil for ativado.
              </p>
            </div>
          </div>
        )}

        {/* ═══ Doctor Hero ═══ */}
        <DashboardHero
          gradient="from-[hsl(160,55%,38%)] via-[hsl(165,60%,42%)] to-[hsl(142,65%,40%)]"
          greeting={greeting()}
          greetIcon={<Stethoscope className="w-4 h-4" />}
          name={`Dr(a). ${profile?.first_name || "Médico"}`}
          subtitle={data?.crm ? `CRM ${data.crm}/${data.crmState}` : undefined}
          kpis={[
            { label: "Hoje", value: stats.today, icon: <Calendar className="w-4 h-4" /> },
            { label: "Pendentes", value: waitingCount + todayAppts.filter(a => a.status === "scheduled").length, icon: <Clock className="w-4 h-4" /> },
            { label: "Receitas", value: stats.prescriptions, icon: <FileText className="w-4 h-4" /> },
            { label: "Faturamento", value: `R$${(stats.totalEarnings / 1000).toFixed(1)}k`, icon: <DollarSign className="w-4 h-4" /> },
          ]}
          loading={loading}
          badge={data?.crmVerified ? { label: "✓ CRM Verificado", color: "bg-white/20 text-white backdrop-blur-md" } : undefined}
          extra={
            waitingCount > 0 ? (
              <Button size="sm" variant="ghost" className="h-9 gap-1.5 rounded-xl border border-white/20 text-white/80 hover:bg-white/15 hover:text-white" onClick={() => navigate("/dashboard/doctor/waiting-room")}>
                <Bell className="w-4 h-4" />
                <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-black text-white">{waitingCount}</span>
              </Button>
            ) : undefined
          }
        />

        {/* ═══ Stat Cards ═══ */}
        <DashboardStatCards
          cols={4}
          loading={loading}
          cards={[
            { label: "Consultas Hoje", value: stats.today, icon: <Calendar className="w-4 h-4" />, bg: "bg-primary/10", text: "text-primary" },
            { label: "Em Espera", value: waitingCount, icon: <Clock className="w-4 h-4" />, bg: "bg-warning/10", text: "text-warning" },
            { label: "Pacientes", value: stats.total_patients, icon: <Users className="w-4 h-4" />, bg: "bg-secondary/10", text: "text-secondary" },
            { label: "Receitas", value: stats.prescriptions, icon: <FileText className="w-4 h-4" />, bg: "bg-success/10", text: "text-success" },
          ]}
        />

        {/* ═══ Quick Actions ═══ */}
        <DashboardQuickActions
          title="Ações do Médico"
          actions={[
            { label: "Sala de Espera", icon: <Video className="w-6 h-6" />, path: "/dashboard/doctor/waiting-room", gradient: "from-[hsl(160,55%,40%)] to-[hsl(142,65%,38%)]", badge: waitingCount },
            { label: "Receitas", icon: <FileText className="w-6 h-6" />, path: "/dashboard/prescriptions", gradient: "from-[hsl(210,90%,50%)] to-[hsl(220,85%,45%)]" },
            { label: "Calendário", icon: <Calendar className="w-6 h-6" />, path: "/dashboard/doctor/calendar", gradient: "from-[hsl(270,60%,55%)] to-[hsl(280,55%,48%)]" },
            { label: "Ganhos", icon: <DollarSign className="w-6 h-6" />, path: "/dashboard/earnings", gradient: "from-[hsl(38,90%,50%)] to-[hsl(30,85%,45%)]" },
          ]}
        />

        {/* ═══ Shortcuts ═══ */}
        <DashboardShortcuts
          title="Ferramentas do Médico"
          shortcuts={[
            { label: "Sala de Espera", description: "Fila de pacientes ao vivo", icon: <Video className="w-[18px] h-[18px]" />, path: "/dashboard/doctor/waiting-room", iconBg: "bg-secondary/10", iconColor: "text-secondary", badge: waitingCount > 0 ? waitingCount : undefined, badgeColor: "bg-destructive/10 text-destructive" },
            { label: "Meus Pacientes", description: "Histórico e prontuários", icon: <Users className="w-[18px] h-[18px]" />, path: "/dashboard/patients", iconBg: "bg-primary/10", iconColor: "text-primary" },
            { label: "Receitas", description: "Emitir prescrições Memed", icon: <FileText className="w-[18px] h-[18px]" />, path: "/dashboard/prescriptions", iconBg: "bg-warning/10", iconColor: "text-warning" },
            { label: "Agenda", description: "Horários e disponibilidade", icon: <Calendar className="w-[18px] h-[18px]" />, path: "/dashboard/doctor/calendar", iconBg: "bg-purple-500/10", iconColor: "text-purple-500" },
            { label: "Meus Ganhos", description: "Faturamento e extrato", icon: <DollarSign className="w-[18px] h-[18px]" />, path: "/dashboard/earnings", iconBg: "bg-success/10", iconColor: "text-success" },
            { label: "Perfil Público", description: "Como pacientes me veem", icon: <Stethoscope className="w-[18px] h-[18px]" />, path: "/dashboard/doctor/public-profile", iconBg: "bg-muted", iconColor: "text-muted-foreground" },
          ]}
        />



        {/* ═══ Patients Table ═══ */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4 pt-5 px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold text-foreground">Próximos Pacientes</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Fila de espera em tempo real</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-9 rounded-xl text-xs gap-1.5 font-medium">
                  <Filter className="w-3.5 h-3.5" /> Filtros
                </Button>
                <Button size="sm" variant="default" className="h-9 rounded-xl text-xs gap-1.5 font-semibold bg-foreground text-background hover:bg-foreground/90">
                  <Download className="w-3.5 h-3.5" /> Exportar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pt-0 pb-5">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 py-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : todayAppts.length === 0 ? (
              <div className="text-center py-14">
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
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-3 pl-1">Paciente</th>
                      <th className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-3">Horário</th>
                      <th className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-3 hidden md:table-cell">Tipo</th>
                      <th className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-3">Status</th>
                      <th className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-3 text-right pr-1">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {todayAppts.map((a, idx) => (
                      <tr key={a.id} className="group hover:bg-muted/30 transition-colors">
                        <td className="py-4 pl-1">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 ring-2 ring-card">
                              {a.patient_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{a.patient_name}</p>
                              <p className="text-[11px] text-muted-foreground">ID: {a.patient_id?.slice(0, 5) || String(10000 + idx)} · {a.duration_minutes || 30}min</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span className="text-sm font-semibold text-foreground">{format(new Date(a.scheduled_at), "HH:mm")}</span>
                          </div>
                        </td>
                        <td className="py-4 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {a.status === "waiting" ? "Primeira Consulta" : "Retorno Semestral"}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`text-[11px] font-bold px-3 py-1 rounded-full inline-block ${statusColor[a.status] ?? "bg-muted text-muted-foreground"}`}>
                            {statusLabel[a.status] ?? a.status}
                          </span>
                        </td>
                        <td className="py-4 text-right pr-1">
                          <div className="flex items-center justify-end gap-1.5">
                            {(a.status === "scheduled" || a.status === "waiting") && (
                              <Button size="sm" className="bg-primary text-primary-foreground text-xs h-8 px-3 rounded-lg gap-1 font-semibold" onClick={() => navigate(`/dashboard/consultation/${a.id}`)}>
                                <Video className="w-3 h-3" /> {a.status === "waiting" ? "Atender" : "Iniciar"}
                              </Button>
                            )}
                            {a.status === "in_progress" && (
                              <Button size="sm" className="bg-success text-success-foreground text-xs h-8 px-3 rounded-lg gap-1 font-semibold" onClick={() => navigate(`/dashboard/consultation/${a.id}`)}>
                                <Video className="w-3 h-3" /> Entrar
                              </Button>
                            )}
                            {a.status === "completed" && (
                              <Button size="sm" variant="outline" className="text-xs h-8 px-3 rounded-lg gap-1 font-semibold" onClick={() => navigate(`/dashboard/prescribe/${a.id}`)}>
                                <FileText className="w-3 h-3" /> Receita
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground" aria-label="Mais opções">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for more content */}
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
            {/* Daily Progress */}
            {!loading && todayAppts.length > 0 && (
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
            )}

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

            {/* Quick access */}
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
                  <Card className="card-interactive border-border/50 cursor-pointer group overflow-hidden" onClick={() => navigate(item.path)}>
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
                <div key={s.label} className="kpi-card p-4 rounded-xl bg-card border border-border/40 text-center">
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
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${statusColor[a.status] ?? "bg-muted text-muted-foreground"}`}>
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
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
