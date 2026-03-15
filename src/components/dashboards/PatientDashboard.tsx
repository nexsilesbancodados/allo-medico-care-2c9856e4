import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getPatientNav } from "@/components/patient/patientNav";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Calendar, FileText, Heart, Video, Clock, Zap, Upload,
  Bell, CheckCircle2, AlertCircle, Star, Activity, RefreshCw,
  Gift, ClipboardList, Stethoscope, Smile, ChevronRight,
  Pill, User, CreditCard, ArrowRight, Sparkles, CalendarPlus, Shield, Flame,
  FolderLock, FileCheck, MessageCircle
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

const statusColor: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  waiting: "bg-warning/10 text-warning border-warning/20",
  in_progress: "bg-success/10 text-success border-success/20",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  no_show: "bg-destructive/10 text-destructive border-destructive/20",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } } };

const PatientDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingDone] = useLocalStorage<boolean>(ONBOARDING_KEY, false);
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
    if (!loading && (stats?.total ?? 0) === 0 && !onboardingDone) setShowOnboarding(true);
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
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ["patient-dashboard-stats"] }),
      queryClient.refetchQueries({ queryKey: ["patient-upcoming-enriched"] }),
    ]);
    setRefreshing(false);
  };

  const nextAppt = upcoming[0];
  const daysUntilNext = nextAppt ? differenceInDays(new Date(nextAppt.scheduled_at), new Date()) : null;
  const hoursUntilNext = nextAppt ? Math.max(0, Math.round((new Date(nextAppt.scheduled_at).getTime() - Date.now()) / 3600000)) : null;

  const quickActions = [
    { label: "Agendar", icon: Calendar, path: "/dashboard/schedule?role=patient", color: "text-primary bg-primary/10" },
    { label: "Urgência", icon: Zap, path: "/dashboard/urgent-care?role=patient", color: "text-destructive bg-destructive/10" },
    { label: "Exames", icon: FileCheck, path: "/dashboard/patient/exam-results?role=patient", color: "text-secondary bg-secondary/10" },
    { label: "Documentos", icon: FolderLock, path: "/dashboard/patient/documents?role=patient", color: "text-warning bg-warning/10" },
  ];

  const shortcuts = [
    { label: "Prontuário", icon: ClipboardList, path: "/dashboard/medical-records?role=patient" },
    { label: "Minha Saúde", icon: Heart, path: "/dashboard/patient/health?role=patient" },
    { label: "Receitas", icon: Pill, path: "/dashboard/prescription-renewal?role=patient" },
    { label: "Pagamentos", icon: CreditCard, path: "/dashboard/payment-history?role=patient" },
    { label: "Chat", icon: MessageCircle, path: "/dashboard/chat?role=patient" },
    { label: "Perfil", icon: User, path: "/dashboard/profile?role=patient" },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 6) return "Boa madrugada";
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
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

      <motion.div variants={container} initial="hidden" animate="show" className="max-w-lg mx-auto w-full space-y-5 pb-24">

        {/* ═══ Welcome header ═══ */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-3.5">
            <Avatar className="h-14 w-14 shrink-0 ring-2 ring-primary/15 ring-offset-2 ring-offset-background">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-lg font-bold">
                {(profile?.first_name?.[0] ?? "") + (profile?.last_name?.[0] ?? "")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold leading-tight text-foreground tracking-tight">
                {greeting()}, {profile?.first_name || "Paciente"} 👋
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <MedicalHistoryExport />
              <Button size="icon" variant="ghost"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={handleRefresh} disabled={refreshing} aria-label="Atualizar"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ═══ Digital Card ═══ */}
        <motion.div variants={fadeUp}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/95 to-secondary p-5 shadow-xl shadow-primary/20">
            <div className="absolute -right-10 -top-10 size-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -left-10 -bottom-10 size-28 bg-black/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <p className="text-primary-foreground/60 text-[10px] font-semibold uppercase tracking-[0.2em]">Cartão Digital</p>
                  <h3 className="text-primary-foreground text-lg font-bold mt-0.5">{profile?.first_name} {profile?.last_name}</h3>
                </div>
                <Sparkles className="w-6 h-6 text-primary-foreground/40" />
              </div>

              {/* KPIs */}
              {!loading ? (
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  {[
                    { label: "Consultas", value: stats?.total ?? 0, icon: Calendar },
                    { label: "Receitas", value: stats?.prescriptions ?? 0, icon: FileText },
                    { label: "Documentos", value: stats?.documents ?? 0, icon: Upload },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-white/12 backdrop-blur-md rounded-xl p-2.5 text-center border border-white/10">
                      <kpi.icon className="w-3.5 h-3.5 mx-auto mb-1 text-primary-foreground/60" aria-hidden="true" />
                      <p className="text-xl font-black leading-none text-primary-foreground tabular-nums">{kpi.value}</p>
                      <p className="text-[9px] text-primary-foreground/50 mt-0.5">{kpi.label}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/10 animate-pulse" />)}
                </div>
              )}

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-primary-foreground/50 text-[9px] uppercase tracking-wider">Válido até</p>
                  <p className="text-primary-foreground font-mono font-medium text-xs">
                    {activeSub && (activeSub as Record<string, unknown>).expires_at
                      ? format(new Date((activeSub as Record<string, unknown>).expires_at as string), "MM/yyyy")
                      : "—"}
                  </p>
                </div>
                <Button size="sm"
                  className="bg-white text-primary hover:bg-white/90 rounded-lg text-xs font-bold shadow-sm h-8 px-3"
                  onClick={() => navigate("/dashboard/discount-card?role=patient")}>
                  Ver Cartão
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

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

        {/* ═══ Quick Actions ═══ */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-4 gap-3" role="list" aria-label="Ações rápidas">
            {quickActions.map((item, i) => (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.93 }}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                role="listitem"
                className="flex flex-col items-center gap-2 py-2"
              >
                <div className={`size-14 rounded-2xl ${item.color} flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150`}>
                  <item.icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <span className="text-[11px] font-semibold text-foreground">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Health metrics mini-cards */}
        {healthMetrics.length > 0 && (
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-primary" /> Métricas de Saúde
              </h3>
              <Button variant="link" size="sm" className="text-xs text-primary h-auto p-0" onClick={() => navigate("/dashboard/patient/health?role=patient")}>
                Ver tudo
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {healthMetrics.map((m: { type: string; value: number; unit: string; measured_at: string }) => {
                const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
                  "pressao_arterial": { icon: "🫀", color: "text-destructive", label: "Pressão" },
                  "peso": { icon: "⚖️", color: "text-primary", label: "Peso" },
                  "glicemia": { icon: "🩸", color: "text-warning", label: "Glicemia" },
                  "frequencia_cardiaca": { icon: "💓", color: "text-destructive", label: "Freq. Card." },
                  "temperatura": { icon: "🌡️", color: "text-warning", label: "Temp." },
                  "saturacao": { icon: "🫁", color: "text-secondary", label: "SpO₂" },
                };
                const cfg = typeConfig[m.type] ?? { icon: "📊", color: "text-muted-foreground", label: m.type };
                return (
                  <div
                    key={m.type}
                    className="p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all duration-150 cursor-pointer"
                    onClick={() => navigate("/dashboard/patient/health?role=patient")}
                  >
                    <span className="text-sm">{cfg.icon}</span>
                    <p className={`text-base font-bold ${cfg.color} mt-1`}>{m.value}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">{m.unit}</span></p>
                    <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══ Next appointments ═══ */}
        {!loading && nextAppt && (
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <h3 className="text-sm font-bold text-foreground">Próximas Consultas</h3>
              <Button variant="link" size="sm" className="text-xs text-primary h-auto p-0" onClick={() => navigate("/dashboard/appointments?role=patient")}>
                Ver tudo
              </Button>
            </div>
            <div className="space-y-2.5">
              {/* Main next appointment */}
              <Card
                className={`overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-150 border-border/50 hover:shadow-md ${
                  daysUntilNext === 0 ? "border-primary/30 shadow-sm shadow-primary/10" : ""
                }`}
                onClick={() => navigate("/dashboard/appointments?role=patient")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`size-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                      daysUntilNext === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <span className="text-[9px] font-bold uppercase leading-none">
                        {format(new Date(nextAppt.scheduled_at), "MMM", { locale: ptBR })}
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {format(new Date(nextAppt.scheduled_at), "dd")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate">{(nextAppt as Record<string, unknown>).doctor_name as string}</h4>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(nextAppt.scheduled_at), "HH:mm", { locale: ptBR })} · {nextAppt.duration_minutes || 30}min
                      </p>
                      {daysUntilNext === 0 && (
                        <p className="text-xs mt-0.5 inline-flex items-center gap-1 text-primary font-semibold">
                          <Flame className="w-3 h-3" /> Hoje em {hoursUntilNext}h
                        </p>
                      )}
                    </div>
                    {daysUntilNext === 0 ? (
                      <Button size="sm"
                        className="bg-primary text-primary-foreground shrink-0 rounded-xl h-9 px-4 text-xs font-bold shadow-md shadow-primary/20"
                        onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/consultation/${nextAppt.id}`); }}>
                        <Video className="w-3.5 h-3.5 mr-1.5" /> Entrar
                      </Button>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground/30 shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {upcoming.slice(1).map((a: { id: string; scheduled_at: string; status: string; doctor_name: string; duration_minutes?: number | null }) => (
                <Card key={a.id} className="border-border/50 overflow-hidden hover:shadow-sm transition-all duration-150 cursor-pointer active:scale-[0.98]" onClick={() => navigate("/dashboard/appointments?role=patient")}>
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-3.5">
                      <div className="size-10 rounded-lg bg-muted/50 flex flex-col items-center justify-center shrink-0 text-muted-foreground">
                        <span className="text-[8px] font-bold uppercase leading-none">{format(new Date(a.scheduled_at), "MMM", { locale: ptBR })}</span>
                        <span className="text-sm font-bold leading-none">{format(new Date(a.scheduled_at), "dd")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground truncate">{a.doctor_name}</h4>
                        <p className="text-xs text-muted-foreground">{format(new Date(a.scheduled_at), "HH:mm")} · {a.duration_minutes || 30}min</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
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
            <Card className="border border-border/50 overflow-hidden rounded-2xl">
              <CardContent className="p-0">
                <div className="relative bg-card p-8 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <CalendarPlus className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1.5 tracking-tight">Nenhuma consulta agendada</h3>
                  <p className="text-sm text-muted-foreground mb-5 max-w-[260px] mx-auto">
                    Encontre o médico ideal e agende sua primeira consulta
                  </p>
                  <Button
                    className="w-full bg-primary text-primary-foreground rounded-xl h-12 text-sm font-bold shadow-lg shadow-primary/20"
                    onClick={() => navigate("/dashboard/schedule?role=patient")}>
                    <Calendar className="w-4 h-4 mr-2" /> Agendar consulta
                  </Button>
                  <div className="flex items-center justify-center gap-5 mt-4">
                    {[
                      { icon: <Shield className="w-3.5 h-3.5 text-success" />, label: "Seguro" },
                      { icon: <Video className="w-3.5 h-3.5 text-primary" />, label: "HD" },
                      { icon: <Star className="w-3.5 h-3.5 text-warning" />, label: "4.9★" },
                    ].map((item, i) => (
                      <span key={i} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        {item.icon} {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Subscription status */}
        {activeSub && (() => {
          const daysLeft = (activeSub as Record<string, unknown>).expires_at ? differenceInDays(new Date((activeSub as Record<string, unknown>).expires_at as string), new Date()) : null;
          const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
          return (
            <motion.div variants={fadeUp}>
              <div
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer active:scale-[0.98] transition-all duration-150 ${
                  isExpiringSoon ? "border-warning/30 bg-warning/5" : "border-success/30 bg-success/5"
                }`}
                onClick={() => navigate(isExpiringSoon ? `/dashboard/plans?action=renew&plan_id=${(activeSub as Record<string, unknown>).plan_id}` : "/dashboard/payment-history?role=patient")}
              >
                {isExpiringSoon
                  ? <AlertCircle className="w-5 h-5 text-warning shrink-0" />
                  : <CheckCircle2 className="w-5 h-5 text-success shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isExpiringSoon ? "text-warning" : "text-success"}`}>
                    {isExpiringSoon ? `Plano expira em ${daysLeft}d — Renovar` : "Plano ativo"}
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
            <Card className="border-warning/30 bg-warning/5 overflow-hidden rounded-xl">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                    <Gift className="w-4 h-4 text-warning" />
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
                            ? <span className="text-destructive font-semibold">⚠️ {daysRemaining}d</span>
                            : `Até ${format(new Date(ra.return_deadline), "dd/MM")} (${daysRemaining}d)`}
                        </p>
                      </div>
                      <Button size="sm"
                        className="bg-warning text-warning-foreground text-xs h-8 rounded-xl shrink-0"
                        onClick={() => navigate(`/dashboard/schedule/${ra.doctor_id}?return=true&original=${ra.id}`)}>
                        Agendar
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══ Shortcuts grid ═══ */}
        <motion.div variants={fadeUp}>
          <p className="text-sm font-bold text-foreground mb-2.5 px-0.5">Acesso Rápido</p>
          <div className="grid grid-cols-3 gap-2.5">
            {shortcuts.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-2 py-3 rounded-xl bg-card border border-border/40 hover:border-primary/20 hover:shadow-sm active:scale-[0.97] transition-all duration-150"
              >
                <div className="size-10 rounded-xl bg-muted/60 flex items-center justify-center text-primary">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Health alerts */}
        {!loading && (
          <motion.div variants={fadeUp}>
            {(() => {
              const alerts: { icon: string; text: string; color: string }[] = [];
              if ((stats?.total ?? 0) > 0 && upcoming.length === 0) alerts.push({ icon: "📅", text: "Sem consultas agendadas — cuide da sua saúde!", color: "text-warning" });
              if ((stats?.prescriptions ?? 0) > 0 && (stats?.documents ?? 0) === 0) alerts.push({ icon: "📄", text: "Envie seus exames para o cofre de documentos", color: "text-primary" });
              if (!activeSub) alerts.push({ icon: "💳", text: "Assine um plano e economize até 30%", color: "text-secondary" });
              if (alerts.length === 0) return null;
              return (
                <div className="space-y-2">
                  {alerts.map((alert, i) => (
                    <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/40">
                      <span className="text-base">{alert.icon}</span>
                      <p className={`text-xs font-medium ${alert.color}`}>{alert.text}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Favorite doctors */}
        {favDoctors.length > 0 && (
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-primary" /> Meus Médicos
              </h3>
              <Button variant="link" size="sm" className="text-xs text-primary h-auto p-0 gap-1" onClick={() => navigate("/dashboard/doctors?role=patient")}>
                Ver todos <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
              {favDoctors.slice(0, 6).map((doc: { id: string; name: string; specs: string[]; rating: number | null }) => (
                <Card key={doc.id} className="border-border/40 shrink-0 w-28 snap-start cursor-pointer active:scale-[0.97] transition-all duration-150 hover:shadow-sm overflow-hidden" onClick={() => navigate(`/dashboard/schedule/${doc.id}?role=patient`)}>
                  <CardContent className="p-0">
                    <div className="h-16 bg-muted/30 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {doc.name.charAt(6) || "M"}
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="text-[11px] font-semibold text-foreground truncate">{doc.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{doc.specs[0] || "Clínico"}</p>
                      {doc.rating && doc.rating > 0 && (
                        <div className="flex items-center gap-0.5 mt-1">
                          <Star className="w-2.5 h-2.5 text-warning fill-warning" />
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

        {/* Health tip */}
        <motion.div variants={fadeUp}>
          <div className="bg-primary/5 rounded-xl p-3.5 border border-primary/10 flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-primary">Dica do Dia</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{todayTip}</p>
            </div>
          </div>
        </motion.div>

        {/* Credits */}
        <motion.div variants={fadeUp}>
          <CreditsWidget />
        </motion.div>

      </motion.div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
