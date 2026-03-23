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
  Calendar, FileText, Heart, Video, Clock, Zap,
  CheckCircle2, AlertCircle, Star, Activity, RefreshCw,
  Gift, ClipboardList, Stethoscope, ChevronRight,
  Pill, User, CreditCard, ArrowRight, Sparkles, CalendarPlus, Shield, Flame,
  FolderLock, FileCheck, MessageCircle, TrendingUp, Sun, Moon, CloudSun, Upload
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
import { PremiumHero } from "./PremiumHero";
import { WalletCard } from "./WalletCard";
import { PremiumActionGrid } from "./PremiumActionGrid";
import { BentoStatCards } from "./BentoStatCards";
import { HealthMetricsGrid } from "./HealthMetricsGrid";
import { AlertBox } from "./AlertBox";
import { DashboardShortcuts } from "./DashboardShortcuts";
import { PingoBanner, PingoEmpty } from "@/components/mascot/PingoMascot";

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
    const channel = supabase.channel("patient-updates")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments", filter: `patient_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["patient-upcoming-enriched"] });
        queryClient.invalidateQueries({ queryKey: ["patient-dashboard-stats"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "appointments", filter: `patient_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["patient-upcoming-enriched"] });
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
    "Beba pelo menos 2L de água hoje para manter a hidratação",
    "30 min de exercício reduz ansiedade em 40% — vai lá!",
    "Dormir 7-8h por noite fortalece o sistema imunológico",
    "Inclua 5 porções de frutas e vegetais na sua alimentação",
    "5 min de respiração profunda reduz o cortisol significativamente",
    "15 min de sol diário ajudam na produção de vitamina D",
    "Monitore sua pressão arterial regularmente",
  ];
  const todayTip = healthTips[new Date().getDay() % healthTips.length];

  const actions = [
    { label: "Agendar", icon: "📅", path: "/dashboard/schedule?role=patient", gradient: "bg-gradient-to-br from-[#1255C8] to-[#3B7FE8]", shadow: "0 6px 20px rgba(18,85,200,.35)" },
    { label: "Urgência", icon: "⚡", path: "/dashboard/urgent-care?role=patient", gradient: "bg-gradient-to-br from-[#C41A1A] to-[#EF4444]", shadow: "0 6px 20px rgba(196,26,26,.35)" },
    { label: "Exames", icon: "🧪", path: "/dashboard/patient/exam-results?role=patient", gradient: "bg-gradient-to-br from-[#0A6B47] to-[#12A36E]", shadow: "0 6px 20px rgba(10,107,71,.3)" },
    { label: "Docs", icon: "🔒", path: "/dashboard/patient/documents?role=patient", gradient: "bg-gradient-to-br from-[#5B21B6] to-[#7C3AED]", shadow: "0 6px 20px rgba(91,33,182,.3)" },
    { label: "Receitas", icon: "💊", path: "/dashboard/prescription-renewal?role=patient", gradient: "bg-gradient-to-br from-[#B05000] to-[#D97706]", shadow: "0 6px 20px rgba(176,80,0,.3)" },
  ];

  const shortcuts = [
    { label: "Prontuário", description: "Histórico médico completo", icon: <ClipboardList className="w-[17px] h-[17px]" />, path: "/dashboard/medical-records?role=patient", iconBg: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400" },
    { label: "Minha Saúde", description: "Métricas e bem-estar", icon: <Heart className="w-[17px] h-[17px]" />, path: "/dashboard/patient/health?role=patient", iconBg: "bg-red-50 dark:bg-red-950/30", iconColor: "text-red-500" },
    { label: "Pagamentos", description: "Histórico financeiro", icon: <CreditCard className="w-[17px] h-[17px]" />, path: "/dashboard/payment-history?role=patient", iconBg: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400" },
    { label: "Chat de Suporte", description: "Fale com a equipe", icon: <MessageCircle className="w-[17px] h-[17px]" />, path: "/dashboard/chat?role=patient", iconBg: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400" },
    { label: "Perfil", description: "Dados pessoais", icon: <User className="w-[17px] h-[17px]" />, path: "/dashboard/profile?role=patient", iconBg: "bg-muted", iconColor: "text-muted-foreground" },
  ];

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("home")} role="patient">
      {showOnboarding && <PatientOnboarding onComplete={() => setShowOnboarding(false)} />}

      <div className="mx-auto w-full max-w-5xl space-y-5 pb-24">

        {/* ── Premium Hero ── */}
        <PremiumHero
          gradient="bg-gradient-to-br from-[#0A2A7A] via-[#1255C8] to-[#1E6DD4]"
          orb1Color="radial-gradient(#3B7FE8, transparent)"
          orb2Color="radial-gradient(#10B981, transparent)"
          tag={`${greetData.text} · ${format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}`}
          tagIcon={greetData.icon}
          name={profile?.first_name || "Paciente"}
          badge={activeSub ? { label: "Plano Ativo · Premium" } : undefined}
          kpis={[
            { label: "Consultas", value: stats?.total ?? 0, icon: <Calendar className="w-4 h-4" /> },
            { label: "Receitas", value: stats?.prescriptions ?? 0, icon: <FileText className="w-4 h-4" /> },
            { label: "Documentos", value: stats?.documents ?? 0, icon: <Upload className="w-4 h-4" /> },
            { label: "Créditos", value: `R$${credits}`, icon: <Sparkles className="w-4 h-4" /> },
          ]}
          loading={loading}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          topRight={<MedicalHistoryExport />}
        />

        {/* ── Wallet Card ── */}
        <WalletCard
          name={`${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Paciente"}
          cardNumber="ALO · XXXX · XXXX · 0001"
          validUntil="12/2027"
          planName={(activeSub as Record<string, unknown>)?.plans ? ((activeSub as Record<string, unknown>).plans as Record<string, unknown>)?.name as string : "Plano Básico"}
          onClick={() => navigate("/dashboard/discount-card?role=patient")}
        />

        {/* ── Live consultation ── */}
        {waitingAppt && (
          <SectionErrorBoundary fallbackTitle="Erro na sala de espera">
            <PatientWaitingCard appointment={waitingAppt} />
          </SectionErrorBoundary>
        )}

        <SectionErrorBoundary fallbackTitle="Erro no banner"><CheckoutRecoveryBanner /></SectionErrorBoundary>
        <SectionErrorBoundary fallbackTitle="Erro no banner"><UpsellBanner /></SectionErrorBoundary>

        {/* ── Quick Actions ── */}
        <PremiumActionGrid actions={actions} title="Ações Rápidas" />

        {/* ── Bento Stats ── */}
        <BentoStatCards
          loading={loading}
          stats={[
            { label: "Total de consultas", value: stats?.total ?? 0, icon: "📅", iconBg: "bg-blue-50 dark:bg-blue-950/30", valueColor: "text-[#1255C8] dark:text-blue-400", trend: { value: 12 } },
            { label: "Receitas emitidas", value: stats?.prescriptions ?? 0, icon: "💊", iconBg: "bg-amber-50 dark:bg-amber-950/30", valueColor: "text-amber-600 dark:text-amber-400", trend: { value: 5 } },
            { label: "Documentos", value: stats?.documents ?? 0, icon: "📂", iconBg: "bg-violet-50 dark:bg-violet-950/30", valueColor: "text-violet-600 dark:text-violet-400" },
            { label: "Créditos disponíveis", value: `R$${credits}`, icon: "✨", iconBg: "bg-emerald-50 dark:bg-emerald-950/30", valueColor: "text-emerald-600 dark:text-emerald-400" },
          ]}
        />

        {/* ── Next Appointment ── */}
        {!loading && nextAppt && (
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">Próximas Consultas</h2>
              <Button variant="link" size="sm" className="h-auto gap-1 p-0 text-[11px] font-semibold text-primary" onClick={() => navigate("/dashboard/appointments?role=patient")}>
                Ver todas <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Card className={`cursor-pointer overflow-hidden rounded-2xl border-border/25 transition-all duration-200 hover:shadow-xl ${daysUntilNext === 0 ? "ring-2 ring-blue-500/20" : ""}`}
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,.06)" }}
                onClick={() => navigate("/dashboard/appointments?role=patient")}
              >
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className={`flex w-[60px] shrink-0 flex-col items-center justify-center py-4 ${daysUntilNext === 0 ? "bg-gradient-to-b from-[#1255C8] to-[#3B7FE8] text-white" : "bg-gradient-to-b from-muted/50 to-muted/30 text-muted-foreground"}`}>
                      <span className="text-[8px] font-bold uppercase tracking-wider opacity-70">{format(new Date(nextAppt.scheduled_at), "MMM", { locale: ptBR })}</span>
                      <span className="text-[26px] font-black leading-none">{format(new Date(nextAppt.scheduled_at), "dd")}</span>
                      <span className="text-[9px] font-semibold opacity-70">{format(new Date(nextAppt.scheduled_at), "EEE", { locale: ptBR })}</span>
                    </div>
                    <div className="flex flex-1 items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-foreground">{(nextAppt as Record<string, unknown>).doctor_name as string}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />{format(new Date(nextAppt.scheduled_at), "HH:mm")} · {nextAppt.duration_minutes || 30}min
                        </p>
                        {daysUntilNext === 0 && (
                          <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                            <Flame className="h-3 w-3" /> Hoje em {hoursUntilNext}h
                          </p>
                        )}
                        {daysUntilNext !== null && daysUntilNext > 0 && (
                          <p className="mt-1.5 text-[10px] text-muted-foreground/60">Em {daysUntilNext} dia{daysUntilNext > 1 ? "s" : ""}</p>
                        )}
                      </div>
                      {daysUntilNext === 0 ? (
                        <Button size="sm" className="h-10 shrink-0 rounded-xl bg-gradient-to-br from-[#1255C8] to-[#3B7FE8] px-4 text-[11px] font-bold text-white" style={{ boxShadow: "0 4px 14px rgba(18,85,200,.35)" }}
                          onClick={e => { e.stopPropagation(); navigate(`/dashboard/consultation/${nextAppt.id}`); }}>
                          <Video className="mr-1.5 h-3.5 w-3.5" /> Entrar
                        </Button>
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/25" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </section>
        )}

        {/* No appointments */}
        {!loading && upcoming.length === 0 && (
          <PingoEmpty
            variant="welcome"
            size={110}
            title="Nenhuma consulta agendada"
            subtitle="Encontre o médico ideal e agende sua consulta online agora mesmo"
            ctaLabel="Agendar consulta"
            onCta={() => navigate("/dashboard/schedule?role=patient")}
          />
        )}

        {/* ── Health Metrics ── */}
        {healthMetrics.length > 0 && (
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">Métricas de Saúde</h2>
              <Button variant="link" size="sm" className="h-auto gap-1 p-0 text-[11px] font-semibold text-primary" onClick={() => navigate("/dashboard/patient/health?role=patient")}>
                Ver tudo <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <HealthMetricsGrid metrics={healthMetrics as { type: string; value: number; unit: string }[]} />
          </section>
        )}

        {/* ── Alerts ── */}
        {!loading && (stats?.total ?? 0) > 0 && upcoming.length === 0 && (
          <AlertBox variant="warning" icon={<span className="text-[20px]">📅</span>} title="Sem consultas agendadas" subtitle="Agende agora e cuide da sua saúde!" actionLabel="Agendar" onAction={() => navigate("/dashboard/schedule?role=patient")} />
        )}
        {!activeSub && (
          <AlertBox variant="info" icon={<span className="text-[20px]">💳</span>} title="Assine um plano e economize até 30%" subtitle="Acesso ilimitado a consultas e benefícios exclusivos" actionLabel="Ver planos" onAction={() => navigate("/dashboard/plans?role=patient")} />
        )}

        {/* ── Return appointments ── */}
        {returnAppts.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-amber-200/60 bg-amber-50/50 dark:border-amber-800/30 dark:bg-amber-950/10 p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30"><Gift className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
              <p className="text-[12px] font-bold text-amber-700 dark:text-amber-400">Retorno Grátis Disponível</p>
            </div>
            {returnAppts.map((ra) => {
              const daysRemaining = differenceInDays(new Date(ra.return_deadline ?? new Date()), new Date());
              return (
                <div key={ra.id} className="flex items-center justify-between rounded-xl border border-border/25 bg-card p-3 mb-2 last:mb-0">
                  <div className="text-[11px]">
                    <p className="font-semibold text-foreground">{ra.doctor_name}</p>
                    <p className="text-muted-foreground mt-0.5">
                      {daysRemaining <= 3 ? <span className="font-semibold text-red-500">⚠️ {daysRemaining}d restantes</span> : `Até ${format(new Date(ra.return_deadline ?? new Date()), "dd/MM")} (${daysRemaining}d)`}
                    </p>
                  </div>
                  <Button size="sm" className="h-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10.5px] font-bold"
                    onClick={() => navigate(`/dashboard/schedule/${ra.doctor_id}?return=true&original=${ra.id}`)}>Agendar</Button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pingo — Dica do dia ── */}
        <PingoBanner
          variant="wave"
          mascotSize={88}
          bgClass="bg-blue-50 dark:bg-blue-950/30"
          accentColor="text-blue-600 dark:text-blue-400"
          label="Dica do dia"
          title={todayTip}
          animateMascot
        />

        {/* ── Shortcuts ── */}
        <DashboardShortcuts shortcuts={shortcuts} />

        {/* Credits */}
        <CreditsWidget />
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
