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
    { label: "Agendar", icon: Calendar, path: "/dashboard/schedule" },
    { label: "Urgência", icon: Zap, path: "/dashboard/schedule?urgency=true" },
    { label: "Exames", icon: Upload, path: "/dashboard/patient/documents" },
    { label: "Diário", icon: Smile, path: "/dashboard/patient/diary" },
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

      <motion.div variants={container} initial="hidden" animate="show" className="max-w-md mx-auto w-full space-y-4 pb-24">

        {/* ═══ Profile card — clean white ═══ */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-4 bg-card p-4 rounded-2xl shadow-md border border-border/40">
            <Avatar className="h-16 w-16 shrink-0 border-2 border-primary/20">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-muted text-foreground text-lg font-bold">
                {(profile?.first_name?.[0] ?? "") + (profile?.last_name?.[0] ?? "")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold leading-tight text-foreground">
                {greeting()}, {profile?.first_name || "Paciente"}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="size-2 bg-success rounded-full" />
                <p className="text-sm text-muted-foreground font-medium">
                  {activeSub ? ((activeSub as Record<string, unknown>).plans as Record<string, unknown>)?.name as string ?? "Plano Ativo" : "Sem plano"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <MedicalHistoryExport />
              <Button size="icon" 
                variant="ghost" 
                className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted" 
                onClick={handleRefresh} 
                disabled={refreshing} aria-label="Ação"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ═══ Digital Card Banner — gradient primary ═══ */}
        <motion.div variants={fadeUp}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/95 to-secondary p-6 shadow-xl shadow-primary/25">
            {/* Decorative orbs */}
            <div className="absolute -right-12 -top-12 size-48 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -left-12 -bottom-12 size-32 bg-black/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-widest mb-1">Cartão Digital</p>
                  <h3 className="text-primary-foreground text-xl font-bold">Acesso Rápido</h3>
                </div>
                <Sparkles className="w-7 h-7 text-primary-foreground/60" />
              </div>

              {/* Inline KPIs */}
              {!loading && (
                <div ref={kpiRef} className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Consultas", value: stats?.total ?? 0, icon: Calendar },
                    { label: "Receitas", value: stats?.prescriptions ?? 0, icon: FileText },
                    { label: "Documentos", value: stats?.documents ?? 0, icon: Upload },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="kpi-card bg-white/12 backdrop-blur-md rounded-xl p-3 text-center border border-white/15 hover:bg-white/18 transition-colors"
                    >
                      <kpi.icon className="w-4 h-4 mx-auto mb-1.5 text-primary-foreground/70" aria-hidden="true" />
                      <p className="text-2xl font-black leading-none text-primary-foreground tabular-nums">{kpi.value.toLocaleString('pt-BR')}</p>
                      <p className="text-[10px] text-primary-foreground/60 mt-1">{kpi.label}</p>
                    </div>
                  ))}
                </div>
              )}
              {loading && (
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl shimmer-v2 bg-white/10" />)}
                </div>
              )}

              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <p className="text-primary-foreground/60 text-[10px] uppercase tracking-wider">Válido até</p>
                  <p className="text-primary-foreground font-mono font-medium text-sm">
                    {activeSub && (activeSub as Record<string, unknown>).expires_at
                      ? format(new Date((activeSub as Record<string, unknown>).expires_at as string), "MM/yyyy")
                      : "—"
                    }
                  </p>
                </div>
                <Button 
                  size="sm" 
                  className="bg-white text-primary hover:bg-white/90 rounded-lg text-sm font-bold shadow-sm h-9 px-4"
                  onClick={() => navigate("/dashboard/discount-card")}
                >
                  Ver Cartão
                </Button>
              </div>
            </div>
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
                    className="p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md hover:-translate-y-1 transition-all duration-200 transition-all cursor-pointer group"
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

        {/* ═══ Quick Actions — clean white cards with primary icons ═══ */}
        <motion.div variants={fadeUp}>
          <h3 className="text-foreground font-bold mb-3 flex items-center gap-2 px-1 text-sm tracking-tight">
            <Zap className="w-4 h-4 text-primary" />
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-4 gap-3" role="list" aria-label="Ações rápidas">
            {quickActions.map((item, i) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, scale: 0.8, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.07, type: "spring", stiffness: 200, damping: 15 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                role="listitem"
                className="flex flex-col items-center gap-2 py-3"
              >
                <div className="size-14 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-center text-primary hover:shadow-lg hover:-translate-y-1 transition-all duration-200 hover:border-primary/25">
                  <item.icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ═══ Next appointment — clean card with date badge ═══ */}
        {!loading && nextAppt && (
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-foreground font-bold">Próximas Consultas</h3>
              <Button variant="link" size="sm" className="text-xs text-primary h-auto p-0" onClick={() => navigate("/dashboard/appointments")}>
                Ver tudo
              </Button>
            </div>
            <div className="space-y-3">
              <Card
                className={`overflow-hidden cursor-pointer active:scale-[0.98] transition-all border-border/50 hover:shadow-md hover:-translate-y-1 transition-all duration-200 ${
                  daysUntilNext === 0 ? "border-primary/30" : ""
                }`}
                onClick={() => navigate("/dashboard/appointments")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`size-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                      daysUntilNext === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      <span className="text-[10px] font-bold uppercase leading-none">
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
                        <p className="text-xs mt-1">
                          <span className="inline-flex items-center gap-1 text-primary font-semibold">
                            <Flame className="w-3 h-3" /> Hoje em {hoursUntilNext}h
                          </span>
                        </p>
                      )}
                    </div>
                    {daysUntilNext === 0 ? (
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground shrink-0 rounded-xl h-10 px-5 text-xs font-bold shadow-md shadow-primary/20"
                        onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/consultation/${nextAppt.id}`); }}
                      >
                        <Video className="w-3.5 h-3.5 mr-1.5" /> Entrar
                      </Button>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground/30 shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Additional upcoming */}
              {upcoming.slice(1).map((a: { id: string; scheduled_at: string; status: string; doctor_name: string; duration_minutes?: number | null }) => (
                <Card key={a.id} className="border-border/50 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-200 transition-all cursor-pointer active:scale-[0.98]" onClick={() => navigate("/dashboard/appointments")}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-xl bg-muted/50 flex flex-col items-center justify-center shrink-0 text-muted-foreground">
                        <span className="text-[10px] font-bold uppercase leading-none">
                          {format(new Date(a.scheduled_at), "MMM", { locale: ptBR })}
                        </span>
                        <span className="text-lg font-bold leading-none">
                          {format(new Date(a.scheduled_at), "dd")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-foreground truncate">{a.doctor_name}</h4>
                        <p className="text-xs text-muted-foreground">{format(new Date(a.scheduled_at), "HH:mm")} · {a.duration_minutes || 30}min</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground/30 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Subscription banner */}
        {activeSub && (() => {
          const daysLeft = (activeSub as Record<string, unknown>).expires_at ? differenceInDays(new Date((activeSub as Record<string, unknown>).expires_at as string), new Date()) : null;
          const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
          return (
            <motion.div variants={fadeUp}>
              <div
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer active:scale-[0.98] transition-all ${
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
            <Card className="border-warning/30 bg-warning/5 overflow-hidden rounded-xl">
              <CardContent className="p-4 space-y-3">
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
                            ? <span className="text-destructive font-semibold">⚠️ {daysRemaining}d restante{daysRemaining !== 1 ? "s" : ""}</span>
                            : `Até ${format(new Date(ra.return_deadline), "dd/MM")} (${daysRemaining}d)`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-warning text-warning-foreground text-xs h-8 rounded-xl shrink-0 shadow-md shadow-warning/20"
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
                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-colors">
                      <span className="text-base">{alert.icon}</span>
                      <p className={`text-xs font-medium ${alert.color}`}>{alert.text}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* ═══ Shortcuts — clean grid ═══ */}
        <motion.div variants={fadeUp}>
          <p className="text-foreground font-bold mb-3 px-1">Acesso Rápido</p>
          <div className="grid grid-cols-4 gap-3">
            {shortcuts.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-2 py-3"
              >
                <div className="size-14 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-center text-primary hover:shadow-md hover:-translate-y-1 transition-all duration-200 hover:border-primary/20 active:scale-95">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* No appointments CTA */}
        {!loading && upcoming.length === 0 && (
          <motion.div variants={fadeUp}>
            <Card className="border border-border/50 overflow-hidden rounded-xl">
              <CardContent className="p-0">
                <div className="relative bg-card p-8 text-center">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="relative w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-5"
                  >
                    <CalendarPlus className="w-7 h-7 text-primary" />
                  </motion.div>

                  <h3 className="text-lg font-bold text-foreground mb-2 tracking-tight">Nenhuma consulta agendada</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-[280px] mx-auto leading-relaxed">
                    Encontre o médico ideal e agende sua primeira consulta
                  </p>

                  <Button 
                    className="w-full bg-primary text-primary-foreground rounded-xl h-14 text-sm font-bold shadow-lg shadow-primary/20"
                    onClick={() => navigate("/dashboard/schedule")}
                  >
                    <Calendar className="w-4 h-4 mr-2" /> 
                    Agendar consulta
                  </Button>

                  <div className="flex items-center justify-center gap-5 mt-5">
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

        {/* Favorite doctors */}
        {favDoctors.length > 0 && (
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-primary" />
                <p className="text-foreground font-bold text-sm">Meus Médicos</p>
              </div>
              <Button variant="link" size="sm" className="text-xs text-primary h-auto p-0 gap-1" onClick={() => navigate("/dashboard/doctors")}>
                Ver todos <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
              {favDoctors.slice(0, 6).map((doc: { id: string; name: string; specs: string[]; rating: number | null }) => (
                <Card key={doc.id} className="border-border/50 shrink-0 w-32 snap-start cursor-pointer active:scale-[0.97] transition-all hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden group" onClick={() => navigate(`/dashboard/schedule/${doc.id}`)}>
                  <CardContent className="p-0">
                    <div className="h-20 bg-muted/50 group-hover:bg-primary/5 flex items-center justify-center transition-colors">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-base font-bold text-primary group-hover:scale-110 transition-transform">
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

        {/* Locate hospitals banner */}
        <motion.div variants={fadeUp}>
          <div 
            className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all hover:bg-primary/[0.08]"
            onClick={() => navigate("/dashboard/schedule")}
          >
            <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-primary">Dica de Saúde</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{todayTip}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-primary/40 shrink-0" />
          </div>
        </motion.div>

        {/* Credits widget */}
        <motion.div variants={fadeUp}>
          <CreditsWidget />
        </motion.div>

      </motion.div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
