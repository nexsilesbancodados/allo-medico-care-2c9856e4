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
  Gift, Share2, Copy, ClipboardList, Stethoscope, Smile, ChevronRight,
  Pill, User, CreditCard, ArrowRight, Sparkles, CalendarPlus
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

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } };

const PatientDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const now = new Date();

  const { data: stats, isLoading: statsLoading } = usePatientStats();
  const { data: upcoming = [], isLoading: upcomingLoading } = usePatientUpcoming();
  const { data: returnAppts = [] } = useReturnAppointments();
  const { data: favDoctors = [] } = useFavoriteDoctors();
  const { data: healthMetrics = [] } = useRecentHealthMetrics();
  const { data: activeSub } = useActiveSubscription();
  const { data: credits = 0 } = useUserCredits();

  const loading = statsLoading || upcomingLoading;
  const waitingAppt = upcoming.find((a: any) => a.status === "waiting" || a.status === "in_progress") ?? null;

  useEffect(() => {
    if (!loading && (stats?.total ?? 0) === 0 && !localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
  }, [loading, stats?.total]);

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
        // Trigger notification bell refresh
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profileData } = await supabase.from("profiles").select("referral_code").eq("user_id", user.id).single();
      if (profileData?.referral_code) {
        setReferralCode(profileData.referral_code);
      } else {
        const code = (profile?.first_name || "user").toLowerCase().slice(0, 4) + user.id.slice(0, 6);
        await supabase.from("profiles").update({ referral_code: code }).eq("user_id", user.id);
        setReferralCode(code);
      }
    })();
  }, [user, profile?.first_name]);

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
    { label: "Agendar", icon: Calendar, color: "bg-primary/10 text-primary", path: "/dashboard/schedule" },
    { label: "Urgência", icon: Zap, color: "bg-destructive/10 text-destructive", path: "/dashboard/schedule?urgency=true" },
    { label: "Exames", icon: Upload, color: "bg-secondary/10 text-secondary", path: "/dashboard/patient/documents" },
    { label: "Diário", icon: Smile, color: "bg-warning/10 text-warning", path: "/dashboard/patient/diary" },
  ];

  const shortcuts = [
    { label: "Prontuário", icon: ClipboardList, path: "/dashboard/medical-records" },
    { label: "Receitas", icon: Pill, path: "/dashboard/patient/health" },
    { label: "Pagamentos", icon: CreditCard, path: "/dashboard/payment-history" },
    { label: "Perfil", icon: User, path: "/dashboard/profile" },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 6) return "Boa madrugada 🌙";
    if (h < 12) return "Bom dia ☀️";
    if (h < 18) return "Boa tarde 🌤️";
    if (h < 22) return "Boa noite 🌆";
    return "Boa noite 🌙";
  };

  const greetingSubtext = () => {
    const h = new Date().getHours();
    if (h < 6) return "Descanse bem, o sono é essencial para a saúde.";
    if (h < 12) return "Comece o dia cuidando da sua saúde!";
    if (h < 18) return "Já bebeu água hoje? Mantenha-se hidratado.";
    if (h < 22) return "Que tal revisar seus próximos compromissos?";
    return "Hora de relaxar. Boa noite de sono!";
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

      <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto space-y-6">
        {/* Header greeting — mobile optimized */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 ring-2 ring-primary/20 shadow-lg shadow-primary/10">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-base sm:text-lg font-bold">
                {(profile?.first_name?.[0] ?? "") + (profile?.last_name?.[0] ?? "")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight leading-tight">
                {greeting()}, {profile?.first_name || "Paciente"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5 hidden sm:block">{greetingSubtext()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <MedicalHistoryExport />
            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </motion.div>

        {/* Daily wellness tip */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-success/5 to-primary/5 border border-success/20">
            <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 text-success" />
            </div>
            <p className="text-xs font-medium text-foreground flex-1">{todayTip}</p>
          </div>
        </motion.div>

        {/* Health summary strip */}
        {!loading && (stats?.total ?? 0) > 0 && (
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-primary/5 via-card to-secondary/5 border border-border/40">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Resumo de Saúde</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stats?.total ?? 0} consulta{(stats?.total ?? 0) !== 1 ? "s" : ""} · {stats?.prescriptions ?? 0} receita{(stats?.prescriptions ?? 0) !== 1 ? "s" : ""}
                </p>
              </div>
              <Button size="sm" variant="ghost" className="text-xs text-primary h-8 rounded-xl shrink-0" onClick={() => navigate("/dashboard/patient/health")}>
                Ver mais
              </Button>
            </div>
          </motion.div>
        )}

        {/* Health metrics mini-cards */}
        {healthMetrics.length > 0 && (
          <motion.div variants={fadeUp}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {healthMetrics.map((m: any, i: number) => {
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
                    className="p-3 rounded-2xl bg-card border border-border/50 hover:border-border hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => navigate("/dashboard/patient/health")}
                  >
                    <span className="text-base">{meta.icon}</span>
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

        {/* Quick Actions — refined cards */}
        <motion.div variants={fadeUp} className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {quickActions.map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, scale: 0.85, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 200, damping: 15 }}
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -2 }}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-2 sm:gap-2.5 py-4 sm:py-5 px-2 rounded-2xl bg-card border border-border/40 shadow-sm hover:shadow-md hover:border-border transition-all duration-200 group"
            >
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${item.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
              >
                <item.icon className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-foreground/80 leading-tight text-center">{item.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* KPI Stats */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse bg-muted/50 rounded-2xl" />)
          ) : (
            <>
              {[
                { onClick: () => navigate("/dashboard/appointments"), icon: Calendar, bg: "bg-primary/8", color: "text-primary", label: "Consultas", value: stats?.total ?? 0 },
                { onClick: () => navigate("/dashboard/patient/health"), icon: FileText, bg: "bg-warning/8", color: "text-warning", label: "Receitas", value: stats?.prescriptions ?? 0 },
                { onClick: () => navigate("/dashboard/patient/documents"), icon: Upload, bg: "bg-secondary/8", color: "text-secondary", label: "Documentos", value: stats?.documents ?? 0 },
              ].map((kpi, i) => (
                <motion.button
                  key={kpi.label}
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 180, damping: 14 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={kpi.onClick}
                  className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/40 shadow-sm hover:shadow-md hover:border-border transition-all text-left group"
                >
                  <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                      <kpi.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${kpi.color}`} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">{kpi.label}</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{kpi.value}</p>
                </motion.button>
              ))}
            </>
          )}
        </motion.div>

        {/* Next appointment — hero card */}
        {!loading && nextAppt && (
          <motion.div variants={fadeUp}>
            <Card
              className={`overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-200 hover:shadow-lg ${daysUntilNext === 0 ? "border-primary/40 shadow-primary/10 shadow-md" : "border-border/50"}`}
              onClick={() => navigate("/dashboard/appointments")}
            >
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className={`w-16 shrink-0 flex flex-col items-center justify-center gap-0.5 ${daysUntilNext === 0 ? "bg-primary/10" : "bg-muted/40"}`}>
                    <span className={`text-lg font-bold leading-none ${daysUntilNext === 0 ? "text-primary" : "text-foreground"}`}>
                      {format(new Date(nextAppt.scheduled_at), "dd")}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      {format(new Date(nextAppt.scheduled_at), "MMM", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex-1 p-4 flex items-center gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{(nextAppt as any).doctor_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(nextAppt.scheduled_at), "HH:mm", { locale: ptBR })} · {nextAppt.duration_minutes || 30}min
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {daysUntilNext === 0
                          ? `⏰ Hoje em ${hoursUntilNext}h`
                          : `📅 Em ${daysUntilNext} dia${daysUntilNext !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                    {daysUntilNext === 0 ? (
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground shrink-0 rounded-xl h-9 text-xs gap-1.5"
                        onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/consultation/${nextAppt.id}`); }}
                      >
                        <Video className="w-3.5 h-3.5" /> Entrar
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
          const daysLeft = (activeSub as any).expires_at ? differenceInDays(new Date((activeSub as any).expires_at), new Date()) : null;
          const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
          return (
            <motion.div variants={fadeUp}>
              <div
                className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer active:scale-[0.98] transition-all ${isExpiringSoon ? "border-warning/30 bg-warning/5" : "border-success/30 bg-success/5"}`}
                onClick={() => navigate("/dashboard/payment-history")}
              >
                {isExpiringSoon
                  ? <AlertCircle className="w-5 h-5 text-warning shrink-0" />
                  : <CheckCircle2 className="w-5 h-5 text-success shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isExpiringSoon ? "text-warning" : "text-success"}`}>
                    {isExpiringSoon ? `Plano expira em ${daysLeft}d` : "Plano ativo"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {(activeSub as any).plans?.name ?? "Assinatura"}
                  </p>
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
                  <Gift className="w-4 h-4 text-warning" />
                  <p className="text-sm font-semibold text-warning">Retorno Grátis</p>
                </div>
                {returnAppts.map((ra: any) => {
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
                        className="bg-warning text-warning-foreground text-xs h-8 rounded-xl shrink-0"
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

        {/* Shortcuts — refined */}
        <motion.div variants={fadeUp}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Acesso rápido</p>
          <div className="grid grid-cols-4 gap-3">
            {shortcuts.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-muted/40 border border-border/30 hover:bg-muted/70 hover:border-border/60 active:scale-[0.97] transition-all"
              >
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Upcoming appointments list */}
        {!loading && upcoming.length > 1 && (
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Próximas consultas</p>
              <Button variant="link" size="sm" className="text-xs text-primary h-auto p-0 gap-1" onClick={() => navigate("/dashboard/appointments")}>
                Ver todas <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-2">
              {upcoming.slice(1).map((a: any) => (
                <Card key={a.id} className="border-border/40 overflow-hidden hover:border-border/60 transition-colors">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 p-3.5">
                      <div className="w-10 h-10 rounded-xl bg-primary/8 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary leading-none">{format(new Date(a.scheduled_at), "dd")}</span>
                        <span className="text-[8px] text-primary/60 uppercase">{format(new Date(a.scheduled_at), "MMM", { locale: ptBR })}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{a.doctor_name}</p>
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
            <Card className="border border-border/40 overflow-hidden rounded-3xl shadow-lg shadow-primary/5">
              <CardContent className="p-0">
                <div className="relative bg-gradient-to-b from-primary/[0.06] via-card to-card p-8 sm:p-10 text-center">
                  {/* Decorative blurred circles */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-28 h-28 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

                  <motion.div
                    initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="relative w-[72px] h-[72px] mx-auto rounded-[20px] bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/15 flex items-center justify-center mb-5 ring-1 ring-primary/10"
                  >
                    <CalendarPlus className="w-8 h-8 text-primary drop-shadow-sm" />
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success ring-2 ring-card"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                    />
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl font-bold text-foreground mb-2 tracking-tight"
                  >
                    Nenhuma consulta agendada
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-muted-foreground mb-7 max-w-[280px] mx-auto leading-relaxed"
                  >
                    Encontre o médico ideal e agende sua primeira consulta por vídeo
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button 
                      className="bg-gradient-hero text-primary-foreground rounded-2xl h-13 px-8 text-sm font-semibold cta-shimmer group shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-shadow" 
                      onClick={() => navigate("/dashboard/schedule")}
                    >
                      <Calendar className="w-4 h-4 mr-2" /> 
                      Agendar consulta
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1.5" />
                    </Button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-center gap-5 mt-6"
                  >
                    {[
                      { icon: <CheckCircle2 className="w-3.5 h-3.5 text-success" />, label: "Sem fila" },
                      { icon: <Video className="w-3.5 h-3.5 text-primary" />, label: "HD" },
                      { icon: <Star className="w-3.5 h-3.5 text-warning" />, label: "4.9★" },
                    ].map((item, i) => (
                      <span key={i} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/80">
                        {item.icon} {item.label}
                      </span>
                    ))}
                  </motion.div>
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
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Meus médicos</p>
              </div>
              <Button variant="link" size="sm" className="text-xs text-primary h-auto p-0 gap-1" onClick={() => navigate("/dashboard/doctors")}>
                Ver todos <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
              {favDoctors.slice(0, 6).map((doc: any) => (
                <Card key={doc.id} className="border-border/40 shrink-0 w-32 snap-start cursor-pointer active:scale-[0.97] transition-all hover:shadow-md overflow-hidden" onClick={() => navigate(`/dashboard/schedule/${doc.id}`)}>
                  <CardContent className="p-0">
                    <div className="h-20 bg-gradient-to-br from-primary/8 to-secondary/8 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-base font-bold text-primary">
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

        {/* Referral card */}
        {referralCode && (
          <motion.div variants={fadeUp}>
            <Card className="relative border border-border/40 overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-secondary/[0.05] pointer-events-none" />
              <CardContent className="relative p-5">
                <div className="flex items-start gap-3 mb-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0 ring-1 ring-primary/10"
                  >
                    <Share2 className="w-5 h-5 text-primary" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-foreground tracking-tight">Indique e Ganhe</p>
                      {credits > 0 && (
                        <Badge className="text-[10px] font-bold bg-success/15 text-success border-0 px-2 py-0.5">
                          R$ {credits.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Convide amigos e ganhe <span className="font-semibold text-foreground">R$ 10</span> de crédito por cadastro.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-[11px] bg-muted/40 border border-border/50 rounded-xl px-3.5 py-3 truncate font-mono text-muted-foreground select-all">
                    {window.location.origin}/convite/{referralCode}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-11 w-11 shrink-0 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/convite/${referralCode}`);
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
