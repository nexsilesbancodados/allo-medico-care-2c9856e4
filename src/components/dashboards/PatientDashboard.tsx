import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import mascotImg from "@/assets/mascot-wave.png";

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

  const quickActions = [
    { label: "Agendar", icon: Calendar, path: "/dashboard/schedule?role=patient", gradient: "from-[hsl(210,90%,50%)] to-[hsl(210,90%,40%)]" },
    { label: "Urgência", icon: Zap, path: "/dashboard/urgent-care?role=patient", gradient: "from-[hsl(0,80%,55%)] to-[hsl(350,75%,48%)]" },
    { label: "Exames", icon: FileCheck, path: "/dashboard/patient/exam-results?role=patient", gradient: "from-[hsl(160,55%,45%)] to-[hsl(170,60%,38%)]" },
    { label: "Documentos", icon: FolderLock, path: "/dashboard/patient/documents?role=patient", gradient: "from-[hsl(270,60%,55%)] to-[hsl(280,55%,45%)]" },
  ];

  const shortcuts = [
    { label: "Prontuário", icon: ClipboardList, path: "/dashboard/medical-records?role=patient", color: "text-primary" },
    { label: "Minha Saúde", icon: Heart, path: "/dashboard/patient/health?role=patient", color: "text-destructive" },
    { label: "Receitas", icon: Pill, path: "/dashboard/prescription-renewal?role=patient", color: "text-secondary" },
    { label: "Pagamentos", icon: CreditCard, path: "/dashboard/payment-history?role=patient", color: "text-warning" },
    { label: "Chat", icon: MessageCircle, path: "/dashboard/chat?role=patient", color: "text-primary" },
    { label: "Perfil", icon: User, path: "/dashboard/profile?role=patient", color: "text-muted-foreground" },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 6) return { text: "Boa madrugada", icon: Moon };
    if (h < 12) return { text: "Bom dia", icon: Sun };
    if (h < 18) return { text: "Boa tarde", icon: CloudSun };
    return { text: "Boa noite", icon: Moon };
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

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("home")} role="patient">
      {showOnboarding && <PatientOnboarding onComplete={() => setShowOnboarding(false)} />}

      <div className="max-w-5xl mx-auto w-full space-y-5 pb-24">

        {/* ═══ HERO — Greeting card (app-like, no heavy borders) ═══ */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(210,85%,50%)] to-[hsl(195,80%,48%)] shadow-lg shadow-primary/15">
          {/* Decorative circles */}
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/[0.07] rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-white/[0.05] rounded-full blur-lg pointer-events-none" />

          <div className="relative z-10 p-5 sm:p-6">
            {/* Top row: greeting + avatar */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <greetData.icon className="w-4 h-4 text-white/70" />
                  <span className="text-xs font-medium text-white/70">{greetData.text}</span>
                </div>
                <h1 className="text-2xl sm:text-[26px] font-extrabold leading-tight text-white tracking-tight">
                  {profile?.first_name || "Paciente"}
                </h1>
                <p className="text-[11px] text-white/50 mt-1 capitalize">
                  {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <MedicalHistoryExport />
                <Button size="icon" variant="ghost"
                  className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/15"
                  onClick={handleRefresh} disabled={refreshing} aria-label="Atualizar"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* KPI pills row */}
            {!loading && (
              <div className="flex gap-2.5 mt-4 overflow-x-auto scrollbar-none -mx-1 px-1">
                {[
                  { label: "Consultas", value: stats?.total ?? 0, icon: Calendar },
                  { label: "Receitas", value: stats?.prescriptions ?? 0, icon: FileText },
                  { label: "Documentos", value: stats?.documents ?? 0, icon: Upload },
                ].map((kpi, i) => (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, type: "spring", stiffness: 200, damping: 20 }}
                    className="flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shrink-0"
                  >
                    <kpi.icon className="w-4 h-4 text-white/80" />
                    <div>
                      <p className="text-lg font-black text-white leading-none tabular-nums">{kpi.value}</p>
                      <p className="text-[9px] text-white/50 font-semibold uppercase tracking-wider">{kpi.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {loading && (
              <div className="flex gap-2.5 mt-4">
                {[1,2,3].map(i => <div key={i} className="h-14 w-28 rounded-2xl bg-white/10 animate-pulse" />)}
              </div>
            )}
          </div>
        </section>

        {/* ═══ Digital Card — premium glassmorphism banner ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 180, damping: 18 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary p-[1px] shadow-xl shadow-primary/15"
        >
          <div className="relative rounded-[calc(1rem-1px)] bg-gradient-to-br from-primary via-primary/95 to-secondary overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -right-8 -top-8 size-32 bg-white/[0.07] rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-6 -bottom-6 size-24 bg-white/[0.05] rounded-full blur-xl pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <div className="relative z-10 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 ring-1 ring-white/10 shadow-lg">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-primary-foreground/45 text-[9px] font-bold uppercase tracking-[0.25em]">Cartão de Benefícios</p>
                    <p className="text-primary-foreground text-base font-extrabold truncate tracking-tight">{profile?.first_name} {profile?.last_name}</p>
                  </div>
                </div>
                <Button size="sm"
                  className="bg-white/20 backdrop-blur-md text-primary-foreground hover:bg-white/30 rounded-xl h-9 px-4 text-xs font-bold border border-white/15 shrink-0 shadow-lg shadow-black/10 active:scale-[0.96] transition-all"
                  onClick={() => navigate("/dashboard/discount-card?role=patient")}>
                  Ver Cartão <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              {activeSub && (
                <div className="relative z-10 mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-primary-foreground/50 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Plano ativo
                  </span>
                  <span className="text-primary-foreground/80 font-mono text-[11px] font-semibold bg-white/10 px-2.5 py-0.5 rounded-lg">
                    {(activeSub as Record<string, unknown>).expires_at
                      ? `Até ${format(new Date((activeSub as Record<string, unknown>).expires_at as string), "MM/yyyy")}`
                      : "Ativo"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Live consultation */}
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

        {/* ═══ Quick Actions — circular icons like health apps ═══ */}
        <section>
          <h2 className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mb-3 px-1">Ações Rápidas</h2>
          <div className="flex gap-4 justify-around px-2">
            {quickActions.map((item, i) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 20 }}
                onClick={() => navigate(item.path)}
                className="group flex flex-col items-center gap-2 active:scale-[0.92] transition-transform"
              >
                <div className={`size-14 sm:size-16 rounded-full ${item.bg} ring-1 ${item.ring} flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
                  <item.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${item.color}`} />
                </div>
                <span className="text-[11px] font-semibold text-foreground/70">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ═══ Next Appointment — hero card ═══ */}
        {!loading && nextAppt && (
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Próximas Consultas
              </h2>
              <Button variant="link" size="sm" className="text-[11px] text-primary h-auto p-0 gap-1 font-semibold" onClick={() => navigate("/dashboard/appointments?role=patient")}>
                Ver tudo <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
              {/* Primary next appointment */}
              <Card
                className={`overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-150 border-border/30 hover:shadow-md rounded-2xl ${
                  daysUntilNext === 0 ? "border-primary/30 shadow-sm shadow-primary/8 ring-1 ring-primary/8" : ""
                }`}
                onClick={() => navigate("/dashboard/appointments?role=patient")}
              >
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Date column */}
                    <div className={`w-16 flex flex-col items-center justify-center shrink-0 py-4 ${
                      daysUntilNext === 0
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/40 text-muted-foreground"
                    }`}>
                      <span className="text-[9px] font-bold uppercase leading-none opacity-70">
                        {format(new Date(nextAppt.scheduled_at), "MMM", { locale: ptBR })}
                      </span>
                      <span className="text-2xl font-black leading-none mt-0.5">
                        {format(new Date(nextAppt.scheduled_at), "dd")}
                      </span>
                      <span className="text-[10px] font-semibold mt-1 opacity-70">
                        {format(new Date(nextAppt.scheduled_at), "EEE", { locale: ptBR })}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground truncate">
                          {(nextAppt as Record<string, unknown>).doctor_name as string}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          {format(new Date(nextAppt.scheduled_at), "HH:mm")} · {nextAppt.duration_minutes || 30}min
                        </p>
                        {daysUntilNext === 0 && (
                          <p className="text-xs mt-1.5 inline-flex items-center gap-1 text-primary font-bold">
                            <Flame className="w-3 h-3" /> Hoje em {hoursUntilNext}h
                          </p>
                        )}
                        {daysUntilNext !== null && daysUntilNext > 0 && (
                          <p className="text-[11px] mt-1.5 text-muted-foreground/60">Em {daysUntilNext} dia{daysUntilNext > 1 ? "s" : ""}</p>
                        )}
                      </div>

                      {daysUntilNext === 0 ? (
                        <Button size="sm"
                          className="bg-primary text-primary-foreground shrink-0 rounded-xl h-10 px-4 text-xs font-bold shadow-lg shadow-primary/20"
                          onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/consultation/${nextAppt.id}`); }}>
                          <Video className="w-4 h-4 mr-1.5" /> Entrar
                        </Button>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground/25 shrink-0" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Secondary appointments */}
              {upcoming.slice(1, 3).map((a: { id: string; scheduled_at: string; status: string; doctor_name: string; duration_minutes?: number | null }) => (
                <Card key={a.id} className="border-border/30 overflow-hidden hover:shadow-sm transition-colors duration-150 cursor-pointer active:scale-[0.98] rounded-xl" onClick={() => navigate("/dashboard/appointments?role=patient")}>
                  <CardContent className="p-3 sm:p-3.5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="size-9 sm:size-10 rounded-lg bg-muted/30 flex flex-col items-center justify-center shrink-0 text-muted-foreground">
                        <span className="text-[8px] font-bold uppercase leading-none">{format(new Date(a.scheduled_at), "MMM", { locale: ptBR })}</span>
                        <span className="text-xs sm:text-sm font-bold leading-none">{format(new Date(a.scheduled_at), "dd")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-[13px] font-semibold text-foreground truncate">{a.doctor_name}</h4>
                        <p className="text-[11px] sm:text-xs text-muted-foreground">{format(new Date(a.scheduled_at), "HH:mm")} · {a.duration_minutes || 30}min</p>
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground/50 bg-muted/30 px-1.5 sm:px-2 py-0.5 rounded-md font-medium shrink-0">
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
          <Card className="border border-border/30 overflow-hidden rounded-2xl shadow-sm">
            <CardContent className="p-0">
              <div className="relative bg-card p-8 text-center">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/8 flex items-center justify-center mb-5 ring-4 ring-primary/[0.04]">
                    <CalendarPlus className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-extrabold text-foreground mb-1.5 tracking-tight">Nenhuma consulta agendada</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-[240px] mx-auto leading-relaxed">
                    Encontre o médico ideal e agende sua consulta
                  </p>
                    <Button
                    className="w-full sm:w-auto bg-primary text-primary-foreground rounded-xl h-12 text-sm font-bold shadow-lg shadow-primary/15 px-8"
                    onClick={() => navigate("/dashboard/schedule?role=patient")}>
                    <Calendar className="w-4 h-4 mr-2" /> Agendar consulta
                  </Button>
                  <div className="flex items-center justify-center gap-5 mt-5">
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
        )}

        {/* ═══ Health Metrics ═══ */}
        {healthMetrics.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Métricas de Saúde
              </h2>
              <Button variant="link" size="sm" className="text-[11px] text-primary h-auto p-0 gap-1 font-semibold" onClick={() => navigate("/dashboard/patient/health?role=patient")}>
                Ver tudo <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5">
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
                    className="p-3 rounded-xl bg-card border border-border/30 hover:border-primary/15 hover:shadow-sm transition-colors duration-150 cursor-pointer"
                    onClick={() => navigate("/dashboard/patient/health?role=patient")}
                  >
                    <span className="text-sm">{cfg.icon}</span>
                    <p className={`text-base font-extrabold ${cfg.color} mt-1.5`}>
                      {m.value}
                      <span className="text-[10px] font-normal text-muted-foreground/60 ml-0.5">{m.unit}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 font-medium">{cfg.label}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══ Subscription status ═══ */}
        {activeSub && (() => {
          const daysLeft = (activeSub as Record<string, unknown>).expires_at ? differenceInDays(new Date((activeSub as Record<string, unknown>).expires_at as string), new Date()) : null;
          const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
          return (
            <div
              className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer active:scale-[0.98] transition-colors duration-150 ${
                isExpiringSoon ? "border-warning/25 bg-warning/[0.04]" : "border-secondary/25 bg-secondary/[0.04]"
              }`}
              onClick={() => navigate(isExpiringSoon ? `/dashboard/plans?action=renew&plan_id=${(activeSub as Record<string, unknown>).plan_id}` : "/dashboard/payment-history?role=patient")}
            >
              {isExpiringSoon
                ? <AlertCircle className="w-5 h-5 text-warning shrink-0" />
                : <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isExpiringSoon ? "text-warning" : "text-secondary"}`}>
                  {isExpiringSoon ? `Plano expira em ${daysLeft}d — Renovar` : "Plano ativo"}
                </p>
                <p className="text-xs text-muted-foreground/60 truncate">{((activeSub as Record<string, unknown>).plans as Record<string, unknown>)?.name as string ?? "Assinatura"}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
            </div>
          );
        })()}

        {/* ═══ Return appointments ═══ */}
        {returnAppts.length > 0 && (
          <Card className="border-warning/20 bg-warning/[0.03] overflow-hidden rounded-2xl">
            <CardContent className="p-4 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center">
                  <Gift className="w-4 h-4 text-warning" />
                </div>
                <p className="text-sm font-bold text-warning">Retorno Grátis</p>
              </div>
              {returnAppts.map((ra: { id: string; return_deadline: string; doctor_name: string; doctor_id: string }) => {
                const daysRemaining = differenceInDays(new Date(ra.return_deadline), new Date());
                return (
                  <div key={ra.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/30">
                    <div className="text-xs min-w-0">
                      <p className="font-medium text-foreground truncate">{ra.doctor_name}</p>
                      <p className="text-muted-foreground">
                        {daysRemaining <= 3
                          ? <span className="text-destructive font-semibold">⚠️ {daysRemaining}d restantes</span>
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
        )}

        {/* ═══ Shortcuts — clean list-style like profile references ═══ */}
        <section className="bg-card rounded-2xl border border-border/20 overflow-hidden divide-y divide-border/10">
          <div className="px-4 py-3">
            <h2 className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Acesso Rápido</h2>
          </div>
          {shortcuts.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/30 active:bg-muted/50 transition-colors text-left"
            >
              <div className="size-9 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                <item.icon className={`w-[18px] h-[18px] ${item.color}`} />
              </div>
              <span className="text-[13px] font-medium text-foreground flex-1">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
            </button>
          ))}
        </section>

        {/* ═══ Smart health alerts ═══ */}
        {!loading && (() => {
          const alerts: { icon: string; text: string; color: string; action?: string }[] = [];
          if ((stats?.total ?? 0) > 0 && upcoming.length === 0) alerts.push({ icon: "📅", text: "Sem consultas agendadas — cuide da sua saúde!", color: "text-warning", action: "/dashboard/schedule?role=patient" });
          if ((stats?.prescriptions ?? 0) > 0 && (stats?.documents ?? 0) === 0) alerts.push({ icon: "📄", text: "Envie seus exames para o cofre de documentos", color: "text-primary", action: "/dashboard/patient/documents?role=patient" });
          if (!activeSub) alerts.push({ icon: "💳", text: "Assine um plano e economize até 30%", color: "text-secondary", action: "/dashboard/plans?role=patient" });
          if (alerts.length === 0) return null;
          return (
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <div key={i}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/30 cursor-pointer hover:border-primary/15 hover:shadow-sm active:scale-[0.98] transition-all duration-150"
                  onClick={() => alert.action && navigate(alert.action)}
                >
                  <span className="text-base shrink-0">{alert.icon}</span>
                  <p className={`text-xs font-medium flex-1 ${alert.color}`}>{alert.text}</p>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/25 shrink-0" />
                </div>
              ))}
            </div>
          );
        })()}

        {/* ═══ Favorite doctors — horizontal scroll ═══ */}
        {favDoctors.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" /> Meus Médicos
              </h2>
              <Button variant="link" size="sm" className="text-[11px] text-primary h-auto p-0 gap-1 font-semibold" onClick={() => navigate("/dashboard/doctors?role=patient")}>
                Ver todos <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
              {favDoctors.slice(0, 6).map((doc: { id: string; name: string; specs: string[]; rating: number | null }) => (
                <Card key={doc.id} className="border-border/30 shrink-0 w-[120px] snap-start cursor-pointer active:scale-[0.97] transition-all duration-150 hover:shadow-sm overflow-hidden rounded-xl" onClick={() => navigate(`/dashboard/schedule/${doc.id}?role=patient`)}>
                  <CardContent className="p-0">
                    <div className="h-14 bg-gradient-to-br from-primary/[0.04] to-secondary/[0.04] flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-primary/8 flex items-center justify-center text-sm font-bold text-primary">
                        {doc.name.charAt(6) || "M"}
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="text-[11px] font-semibold text-foreground truncate">{doc.name}</p>
                      <p className="text-[10px] text-muted-foreground/60 truncate">{doc.specs[0] || "Clínico"}</p>
                      {doc.rating && doc.rating > 0 && (
                        <div className="flex items-center gap-0.5 mt-1">
                          <Star className="w-2.5 h-2.5 text-warning fill-warning" />
                          <span className="text-[10px] text-muted-foreground/60">{Number(doc.rating).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ═══ Daily Health Tip ═══ */}
        <div className="bg-primary/[0.04] rounded-2xl p-4 border border-primary/8 flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-primary/8 flex items-center justify-center text-primary shrink-0">
            <TrendingUp className="w-[18px] h-[18px]" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-bold text-primary uppercase tracking-wide">Dica do Dia</h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{todayTip}</p>
          </div>
        </div>

        {/* Credits */}
        <CreditsWidget />
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
