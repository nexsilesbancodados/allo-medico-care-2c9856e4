import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getPatientNav } from "@/components/patient/patientNav";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar, FileText, Heart, Video, Clock, Zap, Upload,
  CheckCircle2, AlertCircle, Star, Activity, RefreshCw,
  Gift, ClipboardList, Stethoscope, ChevronRight,
  Pill, User, CreditCard, ArrowRight, Sparkles, CalendarPlus, Shield, Flame,
  FolderLock, FileCheck, MessageCircle, TrendingUp, Sun, Moon, CloudSun
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
import { DashboardHero } from "./DashboardHero";
import { DashboardQuickActions } from "./DashboardQuickActions";
import { DashboardShortcuts } from "./DashboardShortcuts";

const statusLabel: Record<string, string> = {
  scheduled: "Agendada",
  waiting: "Na fila",
  in_progress: "Em andamento",
};

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

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 6) return { text: "Boa madrugada", icon: <Moon className="w-4 h-4" /> };
    if (h < 12) return { text: "Bom dia", icon: <Sun className="w-4 h-4" /> };
    if (h < 18) return { text: "Boa tarde", icon: <CloudSun className="w-4 h-4" /> };
    return { text: "Boa noite", icon: <Moon className="w-4 h-4" /> };
  };
  const greetData = greeting();

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

  const quickActions = [
    { label: "Agendar", icon: <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />, path: "/dashboard/schedule?role=patient", gradient: "from-[hsl(210,90%,50%)] to-[hsl(210,90%,40%)]" },
    { label: "Urgência", icon: <Zap className="w-6 h-6 sm:w-7 sm:h-7" />, path: "/dashboard/urgent-care?role=patient", gradient: "from-[hsl(0,80%,55%)] to-[hsl(350,75%,48%)]" },
    { label: "Exames", icon: <FileCheck className="w-6 h-6 sm:w-7 sm:h-7" />, path: "/dashboard/patient/exam-results?role=patient", gradient: "from-[hsl(160,55%,45%)] to-[hsl(170,60%,38%)]" },
    { label: "Documentos", icon: <FolderLock className="w-6 h-6 sm:w-7 sm:h-7" />, path: "/dashboard/patient/documents?role=patient", gradient: "from-[hsl(270,60%,55%)] to-[hsl(280,55%,45%)]" },
  ];

  const shortcuts = [
    { label: "Prontuário", description: "Histórico médico completo", icon: <ClipboardList className="w-[18px] h-[18px]" />, path: "/dashboard/medical-records?role=patient", iconBg: "bg-primary/10", iconColor: "text-primary" },
    { label: "Minha Saúde", description: "Métricas e bem-estar", icon: <Heart className="w-[18px] h-[18px]" />, path: "/dashboard/patient/health?role=patient", iconBg: "bg-destructive/10", iconColor: "text-destructive" },
    { label: "Receitas", description: "Renovar prescrições", icon: <Pill className="w-[18px] h-[18px]" />, path: "/dashboard/prescription-renewal?role=patient", iconBg: "bg-secondary/10", iconColor: "text-secondary" },
    { label: "Pagamentos", description: "Histórico financeiro", icon: <CreditCard className="w-[18px] h-[18px]" />, path: "/dashboard/payment-history?role=patient", iconBg: "bg-warning/10", iconColor: "text-warning" },
    { label: "Chat de Suporte", description: "Fale com a equipe", icon: <MessageCircle className="w-[18px] h-[18px]" />, path: "/dashboard/chat?role=patient", iconBg: "bg-primary/10", iconColor: "text-primary" },
    { label: "Perfil", description: "Dados pessoais", icon: <User className="w-[18px] h-[18px]" />, path: "/dashboard/profile?role=patient", iconBg: "bg-muted", iconColor: "text-muted-foreground" },
  ];

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("home")} role="patient">
      {showOnboarding && <PatientOnboarding onComplete={() => setShowOnboarding(false)} />}

      <div className="mx-auto w-full max-w-5xl space-y-5 pb-24">

        {/* ── Hero ── */}
        <DashboardHero
          gradient="from-[hsl(210,90%,45%)] via-[hsl(210,85%,50%)] to-[hsl(195,80%,48%)]"
          greeting={greetData.text}
          greetIcon={greetData.icon}
          name={profile?.first_name || "Paciente"}
          subtitle={format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          kpis={[
            { label: "Consultas", value: stats?.total ?? 0, icon: <Calendar className="w-4 h-4" /> },
            { label: "Receitas", value: stats?.prescriptions ?? 0, icon: <FileText className="w-4 h-4" /> },
            { label: "Documentos", value: stats?.documents ?? 0, icon: <Upload className="w-4 h-4" /> },
          ]}
          loading={loading}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          extra={<MedicalHistoryExport />}
          badge={activeSub ? { label: "Plano Ativo ✓", color: "bg-white/20 text-white backdrop-blur-md" } : undefined}
        />

        {/* ── Live consultation ── */}
        {waitingAppt && (
          <SectionErrorBoundary fallbackTitle="Erro na sala de espera">
            <PatientWaitingCard appointment={waitingAppt} />
          </SectionErrorBoundary>
        )}

        <SectionErrorBoundary fallbackTitle="Erro no banner">
          <CheckoutRecoveryBanner />
        </SectionErrorBoundary>
        <SectionErrorBoundary fallbackTitle="Erro no banner">
          <UpsellBanner />
        </SectionErrorBoundary>

        {/* ── Quick Actions ── */}
        <DashboardQuickActions actions={quickActions} />

        {/* ── Next Appointment ── */}
        {!loading && nextAppt && (
          <section>
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Calendar className="w-4 h-4 text-primary" /> Próximas Consultas
              </h2>
              <Button variant="link" size="sm" className="h-auto gap-1 p-0 text-[11px] font-semibold text-primary" onClick={() => navigate("/dashboard/appointments?role=patient")}>
                Ver tudo <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <Card
                  className={`cursor-pointer overflow-hidden rounded-2xl border-border/30 transition-all duration-200 hover:shadow-lg active:scale-[0.98] ${daysUntilNext === 0 ? "border-primary/30 ring-1 ring-primary/10 shadow-md shadow-primary/8" : ""}`}
                  onClick={() => navigate("/dashboard/appointments?role=patient")}
                >
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <div className={`flex w-16 shrink-0 flex-col items-center justify-center py-4 ${daysUntilNext === 0 ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"}`}>
                        <span className="text-[9px] font-bold uppercase leading-none opacity-70">{format(new Date(nextAppt.scheduled_at), "MMM", { locale: ptBR })}</span>
                        <span className="mt-0.5 text-2xl font-black leading-none">{format(new Date(nextAppt.scheduled_at), "dd")}</span>
                        <span className="mt-1 text-[10px] font-semibold opacity-70">{format(new Date(nextAppt.scheduled_at), "EEE", { locale: ptBR })}</span>
                      </div>
                      <div className="flex flex-1 items-center gap-3 p-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-bold text-foreground">{(nextAppt as Record<string, unknown>).doctor_name as string}</h3>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 shrink-0" />
                            {format(new Date(nextAppt.scheduled_at), "HH:mm")} · {nextAppt.duration_minutes || 30}min
                          </p>
                          {daysUntilNext === 0 && (
                            <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-primary">
                              <Flame className="w-3 h-3" /> Hoje em {hoursUntilNext}h
                            </p>
                          )}
                          {daysUntilNext !== null && daysUntilNext > 0 && (
                            <p className="mt-1.5 text-[11px] text-muted-foreground/60">Em {daysUntilNext} dia{daysUntilNext > 1 ? "s" : ""}</p>
                          )}
                        </div>
                        {daysUntilNext === 0 ? (
                          <Button
                            size="sm"
                            className="h-10 shrink-0 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20"
                            onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/consultation/${nextAppt.id}`); }}
                          >
                            <Video className="mr-1.5 w-4 h-4" /> Entrar
                          </Button>
                        ) : (
                          <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground/25" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {upcoming.slice(1, 3).map((a: { id: string; scheduled_at: string; status: string; doctor_name: string; duration_minutes?: number | null }) => (
                <Card key={a.id} className="cursor-pointer overflow-hidden rounded-xl border-border/30 transition-all duration-150 hover:shadow-sm active:scale-[0.98]" onClick={() => navigate("/dashboard/appointments?role=patient")}>
                  <CardContent className="p-3 sm:p-3.5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-muted/30 text-muted-foreground">
                        <span className="text-[8px] font-bold uppercase leading-none">{format(new Date(a.scheduled_at), "MMM", { locale: ptBR })}</span>
                        <span className="text-sm font-bold leading-none">{format(new Date(a.scheduled_at), "dd")}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-[13px] font-semibold text-foreground">{a.doctor_name}</h4>
                        <p className="text-xs text-muted-foreground">{format(new Date(a.scheduled_at), "HH:mm")} · {a.duration_minutes || 30}min</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/50">
                        {statusLabel[a.status] ?? a.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* No appointments CTA */}
        {!loading && upcoming.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden rounded-2xl border border-border/30 shadow-sm">
              <CardContent className="p-0">
                <div className="relative bg-card p-8 text-center">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
                  <div className="relative z-10">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 ring-4 ring-primary/[0.04]">
                      <CalendarPlus className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="mb-1.5 text-lg font-extrabold tracking-tight text-foreground">Nenhuma consulta agendada</h3>
                    <p className="mx-auto mb-6 max-w-[240px] text-sm leading-relaxed text-muted-foreground">Encontre o médico ideal e agende sua consulta</p>
                    <Button className="h-12 w-full rounded-xl bg-primary px-8 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 sm:w-auto" onClick={() => navigate("/dashboard/schedule?role=patient")}>
                      <Calendar className="mr-2 w-4 h-4" /> Agendar consulta
                    </Button>
                    <div className="mt-5 flex items-center justify-center gap-5">
                      {[
                        { icon: <Shield className="w-3.5 h-3.5 text-secondary" />, label: "Seguro" },
                        { icon: <Video className="w-3.5 h-3.5 text-primary" />, label: "HD" },
                        { icon: <Star className="w-3.5 h-3.5 text-warning" />, label: "4.9★" },
                      ].map((item, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60">
                          {item.icon} {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Health Metrics ── */}
        {healthMetrics.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Activity className="w-4 h-4 text-primary" /> Métricas de Saúde
              </h2>
              <Button variant="link" size="sm" className="h-auto gap-1 p-0 text-[11px] font-semibold text-primary" onClick={() => navigate("/dashboard/patient/health?role=patient")}>
                Ver tudo <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-4">
              {healthMetrics.map((m: { type: string; value: number; unit: string; measured_at: string }) => {
                const typeConfig: Record<string, { icon: string; color: string; bg: string; label: string }> = {
                  "pressao_arterial": { icon: "🫀", color: "text-destructive", bg: "bg-destructive/8", label: "Pressão" },
                  "peso": { icon: "⚖️", color: "text-primary", bg: "bg-primary/8", label: "Peso" },
                  "glicemia": { icon: "🩸", color: "text-warning", bg: "bg-warning/8", label: "Glicemia" },
                  "frequencia_cardiaca": { icon: "💓", color: "text-destructive", bg: "bg-destructive/8", label: "Freq. Card." },
                  "temperatura": { icon: "🌡️", color: "text-warning", bg: "bg-warning/8", label: "Temp." },
                  "saturacao": { icon: "🫁", color: "text-secondary", bg: "bg-secondary/8", label: "SpO₂" },
                };
                const cfg = typeConfig[m.type] ?? { icon: "📊", color: "text-muted-foreground", bg: "bg-muted/40", label: m.type };
                return (
                  <motion.div
                    key={m.type}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className={`cursor-pointer rounded-2xl border border-border/30 p-3.5 transition-all duration-150 hover:border-primary/20 hover:shadow-md ${cfg.bg}`}
                    onClick={() => navigate("/dashboard/patient/health?role=patient")}
                  >
                    <span className="text-lg">{cfg.icon}</span>
                    <p className={`mt-2 text-xl font-extrabold ${cfg.color}`}>
                      {m.value}
                      <span className="ml-0.5 text-[10px] font-normal text-muted-foreground/60">{m.unit}</span>
                    </p>
                    <p className="text-[10px] font-medium text-muted-foreground/60">{cfg.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Subscription ── */}
        {activeSub && (() => {
          const daysLeft = (activeSub as Record<string, unknown>).expires_at ? differenceInDays(new Date((activeSub as Record<string, unknown>).expires_at as string), new Date()) : null;
          const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
          return (
            <motion.div
              whileTap={{ scale: 0.98 }}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all duration-150 hover:shadow-sm ${isExpiringSoon ? "border-warning/25 bg-warning/[0.04]" : "border-secondary/25 bg-secondary/[0.04]"}`}
              onClick={() => navigate(isExpiringSoon ? `/dashboard/plans?action=renew&plan_id=${(activeSub as Record<string, unknown>).plan_id}` : "/dashboard/payment-history?role=patient")}
            >
              {isExpiringSoon ? <AlertCircle className="h-5 w-5 shrink-0 text-warning" /> : <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" />}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${isExpiringSoon ? "text-warning" : "text-secondary"}`}>
                  {isExpiringSoon ? `Plano expira em ${daysLeft}d — Renovar` : "Plano ativo"}
                </p>
                <p className="truncate text-xs text-muted-foreground/60">{((activeSub as Record<string, unknown>).plans as Record<string, unknown>)?.name as string ?? "Assinatura"}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30" />
            </motion.div>
          );
        })()}

        {/* ── Return appointments ── */}
        {returnAppts.length > 0 && (
          <Card className="overflow-hidden rounded-2xl border-warning/20 bg-warning/[0.03]">
            <CardContent className="space-y-2.5 p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15">
                  <Gift className="h-4 w-4 text-warning" />
                </div>
                <p className="text-sm font-bold text-warning">Retorno Grátis Disponível</p>
              </div>
              {returnAppts.map((ra: { id: string; return_deadline: string; doctor_name: string; doctor_id: string }) => {
                const daysRemaining = differenceInDays(new Date(ra.return_deadline), new Date());
                return (
                  <div key={ra.id} className="flex items-center justify-between rounded-xl border border-border/30 bg-card p-3">
                    <div className="min-w-0 text-xs">
                      <p className="truncate font-medium text-foreground">{ra.doctor_name}</p>
                      <p className="text-muted-foreground">
                        {daysRemaining <= 3
                          ? <span className="font-semibold text-destructive">⚠️ {daysRemaining}d restantes</span>
                          : `Até ${format(new Date(ra.return_deadline), "dd/MM")} (${daysRemaining}d)`}
                      </p>
                    </div>
                    <Button size="sm" className="h-8 shrink-0 rounded-xl bg-warning text-warning-foreground text-xs" onClick={() => navigate(`/dashboard/schedule/${ra.doctor_id}?return=true&original=${ra.id}`)}>
                      Agendar
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* ── Shortcuts ── */}
        <DashboardShortcuts shortcuts={shortcuts} />

        {/* ── Smart alerts ── */}
        {!loading && (() => {
          const alerts: { icon: string; text: string; color: string; bg: string; action?: string }[] = [];
          if ((stats?.total ?? 0) > 0 && upcoming.length === 0) alerts.push({ icon: "📅", text: "Sem consultas agendadas — cuide da sua saúde!", color: "text-warning", bg: "bg-warning/[0.04] border-warning/20", action: "/dashboard/schedule?role=patient" });
          if ((stats?.prescriptions ?? 0) > 0 && (stats?.documents ?? 0) === 0) alerts.push({ icon: "📄", text: "Envie seus exames para o cofre de documentos", color: "text-primary", bg: "bg-primary/[0.04] border-primary/20", action: "/dashboard/patient/documents?role=patient" });
          if (!activeSub) alerts.push({ icon: "💳", text: "Assine um plano e economize até 30%", color: "text-secondary", bg: "bg-secondary/[0.04] border-secondary/20", action: "/dashboard/plans?role=patient" });
          if (alerts.length === 0) return null;
          return (
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <motion.div
                  key={i}
                  whileTap={{ scale: 0.98 }}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all duration-150 hover:shadow-sm ${alert.bg}`}
                  onClick={() => alert.action && navigate(alert.action)}
                >
                  <span className="shrink-0 text-base">{alert.icon}</span>
                  <p className={`flex-1 text-xs font-medium ${alert.color}`}>{alert.text}</p>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/25" />
                </motion.div>
              ))}
            </div>
          );
        })()}

        {/* ── Favorite Doctors ── */}
        {favDoctors.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Stethoscope className="w-4 h-4 text-primary" /> Meus Médicos
              </h2>
              <Button variant="link" size="sm" className="h-auto gap-1 p-0 text-[11px] font-semibold text-primary" onClick={() => navigate("/dashboard/doctors?role=patient")}>
                Ver todos <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-1 scrollbar-none">
              {favDoctors.slice(0, 6).map((doc: { id: string; name: string; specs: string[]; rating: number | null }) => (
                <motion.div
                  key={doc.id}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Card className="w-[120px] shrink-0 cursor-pointer snap-start overflow-hidden rounded-xl border-border/30 transition-all duration-150 hover:shadow-md" onClick={() => navigate(`/dashboard/schedule/${doc.id}?role=patient`)}>
                    <CardContent className="p-0">
                      <div className="flex h-14 items-center justify-center bg-gradient-to-br from-primary/[0.04] to-secondary/[0.04]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/8 text-sm font-bold text-primary">
                          {doc.name.charAt(6) || "M"}
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="truncate text-[11px] font-semibold text-foreground">{doc.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground/60">{doc.specs[0] || "Clínico"}</p>
                        {doc.rating !== null && doc.rating > 0 && (
                          <div className="mt-1 flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5 fill-warning text-warning" />
                            <span className="text-[10px] text-muted-foreground/60">{Number(doc.rating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ── Daily Tip ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-3.5 rounded-2xl border border-primary/8 bg-primary/[0.04] p-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
            <TrendingUp className="w-[18px] h-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-primary">Dica do Dia</h4>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{todayTip}</p>
          </div>
        </motion.div>

        {/* Credits */}
        <CreditsWidget />
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
