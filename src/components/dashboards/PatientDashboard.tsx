import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getPatientNav } from "@/components/patient/patientNav";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Calendar, FileText, Heart, Video, Clock, Zap, Upload, TrendingUp,
  Bell, CheckCircle2, AlertCircle, Star, Activity, RefreshCw,
  Gift, ClipboardList, Stethoscope, Smile, ChevronRight,
  Pill, User, CreditCard, ArrowRight, Sparkles, CalendarPlus, Shield, Flame
} from "lucide-react";
import PatientOnboarding, { ONBOARDING_KEY } from "@/components/patient/PatientOnboarding";
import MedicalHistoryExport from "@/components/patient/MedicalHistoryExport";
import CreditsWidget from "@/components/patient/CreditsWidget";
import UpsellBanner from "@/components/patient/UpsellBanner";
import PatientWaitingCard from "@/components/patient/PatientWaitingCard";
import SectionErrorBoundary from "@/components/ui/section-error-boundary";
import CheckoutRecoveryBanner from "@/components/patient/CheckoutRecoveryBanner";
import { usePatientStats, usePatientUpcoming, useReturnAppointments, useFavoriteDoctors, useRecentHealthMetrics } from "@/hooks/usePatientDashboard";
import { useActiveSubscription, useUserCredits } from "@/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useGsapEntrance } from "@/hooks/use-gsap-entrance";

const statusLabel: Record<string, string> = {
  scheduled: "Agendada", completed: "Concluída", cancelled: "Cancelada",
  in_progress: "Em andamento", waiting: "Na espera", no_show: "Ausente",
};

const statusColor: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  waiting: "bg-warning/10 text-warning border-warning/20",
  in_progress: "bg-success/10 text-success border-success/20",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  no_show: "bg-destructive/10 text-destructive border-destructive/20",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } } };

const PatientDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const [onboardingDone] = useLocalStorage<boolean>(ONBOARDING_KEY, false);
  const kpiRef = useGsapEntrance({ stagger: 0.07, y: 12, delay: 0.3 });
  const sectionsRef = useGsapEntrance({ stagger: 0.08, y: 18, scroll: true });
  const now = new Date();

  const { data: stats, isLoading: statsLoading } = usePatientStats();
  const { data: upcoming = [], isLoading: upcomingLoading } = usePatientUpcoming();
  const { data: returnAppts = [] } = useReturnAppointments();
  const { data: favDoctors = [] } = useFavoriteDoctors();
  const { data: healthMetrics = [] } = useRecentHealthMetrics();
  const { data: activeSub } = useActiveSubscription();
  const { data: credits = 0 } = useUserCredits();

  const loading = statsLoading || upcomingLoading;
  const waitingAppt = upcoming.find((a: { status: string }) => a.status === "waiting" || a.status === "in_progress") ?? null;

  useEffect(() => {
    if (!loading && (stats?.total ?? 0) === 0 && !onboardingDone) {
      setShowOnboarding(true);
    }
  }, [loading, stats?.total, onboardingDone]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("patient-updates")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments", filter: `patient_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["patient-upcoming-enriched"] });
        queryClient.invalidateQueries({ queryKey: ["patient-dashboard-stats"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "appointments", filter: `patient_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["patient-upcoming-enriched"] });
        queryClient.invalidateQueries({ queryKey: ["patient-dashboard-stats"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);


  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["patient-"] });
    await queryClient.refetchQueries({ queryKey: ["patient-dashboard-stats"] });
    await queryClient.refetchQueries({ queryKey: ["patient-upcoming-enriched"] });
    setRefreshing(false);
  };

  const nextAppt = upcoming[0];
  const daysUntilNext = nextAppt ? differenceInDays(new Date(nextAppt.scheduled_at), new Date()) : null;
  const hoursUntilNext = nextAppt ? Math.max(0, Math.round((new Date(nextAppt.scheduled_at).getTime() - Date.now()) / 3600000)) : null;

  const quickActions = [
    { label: "Agendar", icon: Calendar, gradient: "from-primary to-primary/70", path: "/dashboard/schedule" },
    { label: "Urgência", icon: Zap, gradient: "from-destructive to-destructive/70", path: "/dashboard/schedule?urgency=true" },
    { label: "Exames", icon: Upload, gradient: "from-secondary to-secondary/70", path: "/dashboard/patient/documents" },
    { label: "Diário", icon: Smile, gradient: "from-warning to-warning/70", path: "/dashboard/patient/diary" },
  ];

  const shortcuts = [
    { label: "Prontuário", icon: ClipboardList, path: "/dashboard/medical-records" },
    { label: "Receitas", icon: Pill, path: "/dashboard/patient/health" },
    { label: "Pagamentos", icon: CreditCard, path: "/dashboard/payment-history" },
    { label: "Perfil", icon: User, path: "/dashboard/profile" },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 6) return "Boa madrugada";
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const greetingEmoji = () => {
    const h = new Date().getHours();
    if (h < 6) return "🌙";
    if (h < 12) return "☀️";
    if (h < 18) return "🌤️";
    return "🌆";
  };

  const healthTips = [
    "💧 Beba pelo menos 2L de água hoje",
    "🏃 30 min de exercício reduz ansiedade em 40%",
    "😴 Dormir 7-8h melhora a imunidade",
    "🍎 Inclua 5 porções de frutas e vegetais",
    "🧘 5 min de respiração profunda reduz o cortisol",
    "☀️ 15 min de sol ajudam na vitamina D",
    "🫀 Monitore sua pressão regularmente",
  ];
  const todayTip = healthTips[new Date().getDay() % healthTips.length];

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("home")} role="patient">
      {showOnboarding && <PatientOnboarding onComplete={() => setShowOnboarding(false)} />}

      <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto space-y-5">

        {/* ═══ Hero greeting card ═══ */}
        <motion.div variants={fadeUp}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary p-5 sm:p-6 text-primary-foreground shadow-xl shadow-primary/20">
            {/* Decorative orbs */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/5 blur-2xl" />
            
            <div className="relative flex items-start gap-4">
              <Avatar className="h-14 w-14 shrink-0 ring-2 ring-white/30 shadow-lg">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                <AvatarFallback className="bg-white/20 text-primary-foreground text-lg font-bold backdrop-blur-sm">
                  {(profile?.first_name?.[0] ?? "") + (profile?.last_name?.[0] ?? "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/70 mb-0.5">
                  {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
                  {greeting()}, {profile?.first_name || "Paciente"} {greetingEmoji()}
                </h1>
                <p className="text-xs text-white/60 mt-1 line-clamp-1">{todayTip}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <MedicalHistoryExport />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10" 
                  onClick={handleRefresh} 
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Inline KPIs */}
            {!loading && (
              <div ref={kpiRef} className="relative grid grid-cols-3 gap-3 mt-5">
                {[
                  { label: "Consultas", value: stats?.total ?? 0, icon: Calendar },
                  { label: "Receitas", value: stats?.prescriptions ?? 0, icon: FileText },
                  { label: "Documentos", value: stats?.documents ?? 0, icon: Upload },
                ].map((kpi) => (
                  <motion.div
                    key={kpi.label}
                    whileTap={{ scale: 0.96 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10 hover:bg-white/15 transition-colors cursor-default"
                  >
                    <kpi.icon className="w-4 h-4 mx-auto mb-1.5 text-white/70" aria-hidden="true" />
                    <p className="text-xl font-bold leading-none tabular-nums">{kpi.value.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-white/60 mt-1">{kpi.label}</p>
                  </motion.div>
                ))}
              </div>
            )}
            {loading && (
              <div className="grid grid-cols-3 gap-3 mt-5">
                {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-white/10 animate-pulse" />)}
              </div>
            )}
          </div>
        </motion.div>

        {/* Health metrics mini-cards */}
        {healthMetrics.length > 0 && (
          <motion.div variants={fadeUp}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {healthMetrics.map((m: { type: string; value: number; unit: string; measured_at: string }, i: number) => {
                const typeIcons: Record<string, { icon: string; color: string }> = {
                  "pressao_arterial": { icon: "🫀", color: "text-destructive" },
                  "peso": { icon: "⚖️", color: "text-primary" },
                  "glicemia": { icon: "🩸", color: "text-warning" },
                  "frequencia_cardiaca": { icon: "💓", color: "text-destructive" },
                  "temperatura": { icon: "🌡️", color: "text-warning" },
                  "saturacao": { icon: "🫁", color: "text-secondary" },
                };
                const meta = typeIcons[m.type] ?? { icon: "📊", color: "text-muted-foreground" };
                const typeLabels: Record<string, string> = {
                  "pressao_arterial": "Pressão",
                  "peso": "Peso",
                  "glicemia": "Glicemia",
                  "frequencia_cardiaca": "Freq. Card.",
                  "temperatura": "Temp.",
                  "saturacao": "SpO₂",
                };
                return (
                  <motion.div
                    key={m.type}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 15 }}
                    className="p-3 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all cursor-pointer group"
                    onClick={() => navigate("/dashboard/patient/health")}
                  >
                    <span className="text-base group-hover:scale-110 inline-block transition-transform">{meta.icon}</span>
                    <p className={`text-lg font-bold ${meta.color} mt-1`}>{m.value}<span className="text-xs font-normal text-muted-foreground ml-0.5">{m.unit}</span></p>
                    <p className="text-[10px] text-muted-foreground">{typeLabels[m.type] ?? m.type}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Live consultation */}
        {waitingAppt && (
          <motion.div variants={fadeUp}>
            <SectionErrorBoundary fallbackTitle="Erro na sala de espera">
              <PatientWaitingCard appointment={waitingAppt} />
            </SectionErrorBoundary>
          </motion.div>
        )}

        <motion.div variants={fadeUp}>
          <SectionErrorBoundary fallbackTitle="Erro no banner">
            <CheckoutRecoveryBanner />
          </SectionErrorBoundary>
        </motion.div>

        <motion.div variants={fadeUp}>
          <SectionErrorBoundary fallbackTitle="Erro no banner">
            <UpsellBanner />
          </SectionErrorBoundary>
        </motion.div>

        {/* ═══ Quick Actions — Gradient icons ═══ */}
        <motion.div variants={fadeUp} className="grid grid-cols-4 gap-2.5" role="list" aria-label="Ações rápidas">
          {quickActions.map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, scale: 0.8, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 200, damping: 15 }}
              whileTap={{ scale: 0.93 }}
              whileHover={{ y: -3 }}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              role="listitem"
              className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl bg-card border border-border/40 shadow-sm hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all duration-200 group"
            >
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                <item.icon className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-[11px] font-semibold text-foreground/80 leading-tight text-center">{item.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* ═══ Next appointment — hero card ═══ */}
        {!loading && nextAppt && (
          <motion.div variants={fadeUp}>
            <Card
              className={`overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-200 hover:shadow-xl ${
                daysUntilNext === 0 ? "border-primary/40 shadow-xl shadow-primary/15" : "border-border/50 hover:shadow-xl hover:border-primary/20"
              }`}
              onClick={() => navigate("/dashboard/appointments")}
            >
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className={`w-20 shrink-0 flex flex-col items-center justify-center gap-1 ${
                    daysUntilNext === 0 
                      ? "bg-gradient-to-b from-primary/20 to-primary/5" 
                      : "bg-gradient-to-b from-muted/60 to-muted/20"
                  }`}>
                    <span className={`text-2xl font-black leading-none ${daysUntilNext === 0 ? "text-primary" : "text-foreground"}`}>
                      {format(new Date(nextAppt.scheduled_at), "dd")}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {format(new Date(nextAppt.scheduled_at), "MMM", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex-1 p-4 flex items-center gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{(nextAppt as Record<string, unknown>).doctor_name as string}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(nextAppt.scheduled_at), "HH:mm", { locale: ptBR })} · {nextAppt.duration_minutes || 30}min
                      </p>
                      <p className="text-xs mt-1.5">
                        {daysUntilNext === 0 ? (
                          <span className="inline-flex items-center gap-1 text-primary font-semibold">
                            <Flame className="w-3 h-3" /> Hoje em {hoursUntilNext}h
                          </span>
                        ) : (
                          <span className="text-muted-foreground/70">📅 Em {daysUntilNext} dia{daysUntilNext !== 1 ? "s" : ""}</span>
                        )}
                      </p>
                    </div>
                    {daysUntilNext === 0 ? (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-primary to-secondary text-primary-foreground shrink-0 rounded-xl h-10 px-5 text-xs font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
                        onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/consultation/${nextAppt.id}`); }}
                      >
                        <Video className="w-3.5 h-3.5 mr-1.5" /> Entrar
                      </Button>
                    ) : (
                      <Badge variant="outline" className={`shrink-0 text-[10px] ${statusColor[nextAppt.status]}`}>
                        {statusLabel[nextAppt.status]}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Subscription banner */}
        {activeSub && (() => {
          const daysLeft = (activeSub as Record<string, unknown>).expires_at ? differenceInDays(new Date((activeSub as Record<string, unknown>).expires_at as string), new Date()) : null;
          const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
          return (
            <motion.div variants={fadeUp}>
              <div
                className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer active:scale-[0.98] transition-all ${
                  isExpiringSoon ? "border-warning/30 bg-warning/5" : "border-success/30 bg-success/5"
                }`}
                onClick={() => navigate(isExpiringSoon ? `/dashboard/plans?action=renew&plan_id=${(activeSub as Record<string, unknown>).plan_id}` : "/dashboard/payment-history")}
              >
                {isExpiringSoon
                  ? <AlertCircle className="w-5 h-5 text-warning shrink-0" />
                  : <CheckCircle2 className="w-5 h-5 text-success shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isExpiringSoon ? "text-warning" : "text-success"}`}>
                    {isExpiringSoon ? `Plano expira em ${daysLeft}d — Renovar agora` : "Plano ativo"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{((activeSub as Record<string, unknown>).plans as Record<string, unknown>)?.name as string ?? "Assinatura"}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              </div>
            </motion.div>
          );
        })()}

        {/* Return appointments */}
        {returnAppts.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card className="border-warning/30 bg-warning/5 overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-warning to-warning/70 flex items-center justify-center">
                    <Gift className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-bold text-warning">Retorno Grátis</p>
                </div>
                {returnAppts.map((ra: { id: string; return_deadline: string; doctor_name: string; doctor_id: string }) => {
                  const daysRemaining = differenceInDays(new Date(ra.return_deadline), new Date());
                  return (
                    <div key={ra.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/40">
                      <div className="text-xs min-w-0">
                        <p className="font-medium text-foreground truncate">{ra.doctor_name}</p>
                        <p className="text-muted-foreground">
                          {daysRemaining <= 3
                            ? <span className="text-destructive font-semibold">⚠️ {daysRemaining}d restante{daysRemaining !== 1 ? "s" : ""}</span>
                            : `Até ${format(new Date(ra.return_deadline), "dd/MM")} (${daysRemaining}d)`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-warning to-warning/80 text-white text-xs h-8 rounded-xl shrink-0 shadow-md shadow-warning/20"
                        onClick={() => navigate(`/dashboard/schedule/${ra.doctor_id}?return=true&original=${ra.id}`)}
                      >
                        Agendar
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══ Health alerts ═══ */}
        {!loading && (
          <motion.div variants={fadeUp}>
            {(() => {
              const alerts: { icon: string; text: string; color: string }[] = [];
              if ((stats?.total ?? 0) > 0 && upcoming.length === 0) alerts.push({ icon: "📅", text: "Sem consultas agendadas — cuide da sua saúde!", color: "text-warning" });
              if ((stats?.prescriptions ?? 0) > 0 && (stats?.documents ?? 0) === 0) alerts.push({ icon: "📄", text: "Envie seus exames para o cofre de documentos", color: "text-primary" });
              if (!activeSub) alerts.push({ icon: "💳", text: "Assine um plano e economize até 30% nas consultas", color: "text-secondary" });
              if (alerts.length === 0) return null;
              return (
                <div className="space-y-2">
                  {alerts.map((alert, i) => (
                    <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/40 hover:border-primary/20 transition-colors">
                      <span className="text-base">{alert.icon}</span>
                      <p className={`text-xs font-medium ${alert.color}`}>{alert.text}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* ═══ Shortcuts — compact grid ═══ */}
        <motion.div variants={fadeUp}>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Acesso rápido</p>
          <div className="grid grid-cols-4 gap-2.5">
            {shortcuts.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-card border border-border/40 hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-md hover:shadow-primary/5 active:scale-[0.95] transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-muted/60 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <item.icon className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Upcoming appointments list */}
        {!loading && upcoming.length > 1 && (
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Próximas consultas</p>
              <Button variant="link" size="sm" className="text-xs text-primary h-auto p-0 gap-1" onClick={() => navigate("/dashboard/appointments")}>
                Ver todas <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-2">
              {upcoming.slice(1).map((a: { id: string; scheduled_at: string; status: string; doctor_name: string; duration_minutes?: number | null }) => (
                <Card key={a.id} className="border-border/40 overflow-hidden hover:border-primary/20 hover:shadow-md transition-all">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 p-3.5">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/5 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary leading-none">{format(new Date(a.scheduled_at), "dd")}</span>
                        <span className="text-[8px] text-primary/60 uppercase">{format(new Date(a.scheduled_at), "MMM", { locale: ptBR })}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{a.doctor_name}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(a.scheduled_at), "HH:mm")} · {a.duration_minutes || 30}min</p>
                      </div>
                      <Badge variant="outline" className={`text-[9px] shrink-0 ${statusColor[a.status]}`}>
                        {statusLabel[a.status]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* No appointments CTA */}
        {!loading && upcoming.length === 0 && (
          <motion.div variants={fadeUp}>
            <Card className="border border-border/40 overflow-hidden rounded-3xl shadow-xl shadow-primary/5">
              <CardContent className="p-0">
                <div className="relative bg-gradient-to-b from-primary/[0.06] via-card to-card p-8 sm:p-10 text-center">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

                  <motion.div
                    initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="relative w-[72px] h-[72px] mx-auto rounded-[20px] bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-5 shadow-xl shadow-primary/25"
                  >
                    <CalendarPlus className="w-8 h-8 text-white" />
                  </motion.div>

                  <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">Nenhuma consulta agendada</h3>
                  <p className="text-sm text-muted-foreground mb-7 max-w-[280px] mx-auto leading-relaxed">
                    Encontre o médico ideal e agende sua primeira consulta por vídeo
                  </p>

                  <Button 
                    className="bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground rounded-2xl h-12 px-8 text-sm font-semibold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all group" 
                    onClick={() => navigate("/dashboard/schedule")}
                  >
                    <Calendar className="w-4 h-4 mr-2" /> 
                    Agendar consulta
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1.5" />
                  </Button>

                  <div className="flex items-center justify-center gap-5 mt-6">
                    {[
                      { icon: <Shield className="w-3.5 h-3.5 text-success" />, label: "Seguro" },
                      { icon: <Video className="w-3.5 h-3.5 text-primary" />, label: "HD" },
                      { icon: <Star className="w-3.5 h-3.5 text-warning" />, label: "4.9★" },
                    ].map((item, i) => (
                      <span key={i} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/80">
                        {item.icon} {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Favorite doctors */}
        {favDoctors.length > 0 && (
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-primary" />
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Meus médicos</p>
              </div>
              <Button variant="link" size="sm" className="text-xs text-primary h-auto p-0 gap-1" onClick={() => navigate("/dashboard/doctors")}>
                Ver todos <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
              {favDoctors.slice(0, 6).map((doc: { id: string; name: string; specs: string[]; rating: number | null }) => (
                <Card key={doc.id} className="border-border/40 shrink-0 w-32 snap-start cursor-pointer active:scale-[0.97] transition-all hover:shadow-lg hover:border-primary/20 overflow-hidden group" onClick={() => navigate(`/dashboard/schedule/${doc.id}`)}>
                  <CardContent className="p-0">
                    <div className="h-20 bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/15 group-hover:to-secondary/15 flex items-center justify-center transition-colors">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-base font-bold text-primary group-hover:scale-110 transition-transform">
                        {doc.name.charAt(6) || "M"}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-foreground truncate">{doc.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{doc.specs[0] || "Clínico"}</p>
                      {doc.rating > 0 && (
                        <div className="flex items-center gap-0.5 mt-1.5">
                          <Star className="w-3 h-3 text-warning fill-warning" />
                          <span className="text-[10px] text-muted-foreground">{Number(doc.rating).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Credits widget */}
        <motion.div variants={fadeUp}>
          <CreditsWidget />
        </motion.div>

      </motion.div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
