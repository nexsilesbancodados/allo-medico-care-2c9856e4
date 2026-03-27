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
  Calendar, FileText, Heart, Video, Clock, Flame,
  Gift, ClipboardList, ChevronRight,
  Pill, User, CreditCard, ArrowRight, CalendarPlus, MessageCircle, Upload,
} from "lucide-react";
import PatientOnboarding, { ONBOARDING_KEY } from "@/components/patient/PatientOnboarding";
import MedicalHistoryExport from "@/components/patient/MedicalHistoryExport";

import PatientWaitingCard from "@/components/patient/PatientWaitingCard";
import SectionErrorBoundary from "@/components/ui/section-error-boundary";
import {
  usePatientStats, usePatientUpcoming, useReturnAppointments, useRecentHealthMetrics,
} from "@/hooks/usePatientDashboard";
import { useActiveSubscription, useUserCredits } from "@/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { HeroBanner } from "./HeroBanner";
import { ActionPills } from "./ActionPills";
import { StatBento } from "./StatBento";
import { WalletCard } from "./WalletCard";
import { PingoBannerCard } from "@/components/mascot/PingoBannerCard";
import { DashboardShortcuts } from "./DashboardShortcuts";
import { AlertBox } from "./AlertBox";
import mascotWave from "@/assets/mascot-wave.png";
import mascotReading from "@/assets/mascot-reading.png";
import mascotWelcome from "@/assets/mascot-welcome.png";

const METRIC_CONFIGS: Record<string, { emoji: string; label: string; color: string }> = {
  pressao_arterial:    { emoji: "🫀", label: "Pressão",     color: "text-red-500" },
  peso:                { emoji: "⚖️",  label: "Peso",        color: "text-blue-600" },
  glicemia:            { emoji: "🩸", label: "Glicemia",    color: "text-amber-600" },
  frequencia_cardiaca: { emoji: "💓", label: "Freq.",        color: "text-red-500" },
  temperatura:         { emoji: "🌡️", label: "Temperatura", color: "text-orange-500" },
  saturacao:           { emoji: "🫁", label: "SpO₂",        color: "text-violet-600" },
};

const HEALTH_TIPS = [
  "Beba 2L de água hoje para manter sua imunidade em alta",
  "30 minutos de caminhada reduzem a ansiedade em 40%",
  "Dormir 7-8h fortalece o sistema imunológico",
  "5 porções de frutas e vegetais por dia — tente hoje!",
  "5 min de respiração profunda reduzem o cortisol",
  "15 min de sol diário ajudam na vitamina D",
  "Monitorar a pressão arterial regularmente é essencial",
];

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
  const { data: healthMetrics = [] } = useRecentHealthMetrics();
  const { data: activeSub } = useActiveSubscription();
  const { data: credits = 0 } = useUserCredits();
  const loading = statsLoading || upcomingLoading;
  const waitingAppt = upcoming.find((a: { status: string }) =>
    a.status === "waiting" || a.status === "in_progress"
  ) ?? null;

  useEffect(() => {
    if (!loading && (stats?.total ?? 0) === 0 && !onboardingDone) setShowOnboarding(true);
  }, [loading, stats?.total, onboardingDone]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("patient-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `patient_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["patient-upcoming-enriched"] });
        queryClient.invalidateQueries({ queryKey: ["patient-dashboard-stats"] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
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
    const h = now.getHours();
    if (h < 6) return "Boa madrugada";
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const todayTip = HEALTH_TIPS[now.getDay() % HEALTH_TIPS.length];

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("home")} role="patient">
      {showOnboarding && <PatientOnboarding onComplete={() => setShowOnboarding(false)} />}

      {/* Full-width hero — no padding wrapper */}
      <div className="-mx-4 -mt-5 md:-mx-6 md:-mt-5 lg:-mx-8 lg:-mt-6">
        <HeroBanner
          gradient="from-[#1e3a8a] via-[#2563EB] to-[#3b82f6]"
          pingoSrc={mascotWave}
          pingoAlt="Pingo acenando"
          bubble={{
            greeting: `${greeting()} · ${format(now, "EEE, dd/MM", { locale: ptBR })}`,
            name: profile?.first_name ? `${profile.first_name}!` : "Paciente!",
            sub: activeSub ? "Plano Ativo ✓" : "Bem-vindo(a)",
          }}
          kpis={[
            { label: "Consultas", value: stats?.total ?? 0 },
            { label: "Receitas",  value: stats?.prescriptions ?? 0 },
            { label: "Exames",    value: stats?.documents ?? 0 },
            
          ]}
          loading={loading}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          topRight={<MedicalHistoryExport />}
        />
      </div>

      {/* ── MAIN CONTENT — responsive 1-col mobile / 2-col desktop ── */}
      <div className="mt-5 md:mt-5 space-y-5 pb-24 md:pb-8">

        {/* Live consultation */}
        {waitingAppt && (
          <SectionErrorBoundary fallbackTitle="Erro na sala de espera">
            <PatientWaitingCard appointment={waitingAppt} />
          </SectionErrorBoundary>
        )}

        {/* Desktop 2-column layout */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:items-start">

          {/* LEFT COLUMN */}
          <div className="space-y-5">
            {/* Wallet Card */}
            <WalletCard
              name={`${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Paciente"}
              cardNumber="ALO · XXXX · XXXX · 0001"
              validUntil="12/2027"
              planName={(activeSub as Record<string, unknown>)?.plans
                ? ((activeSub as Record<string, unknown>).plans as Record<string, unknown>)?.name as string
                : "Plano Básico"}
              
            />

            {/* Action Pills */}
            <ActionPills
              title="Ações rápidas"
              actions={[
                { label: "Agendar",    icon: "📅", iconBg: "bg-blue-50 dark:bg-blue-950/30",     path: "/dashboard/schedule?role=patient" },
                { label: "Urgência",   icon: "⚡", iconBg: "bg-red-50 dark:bg-red-950/30",       path: "/dashboard/urgent-care?role=patient", badge: waitingAppt ? 1 : 0 },
                { label: "Exames",     icon: "🧪", iconBg: "bg-emerald-50 dark:bg-emerald-950/30", path: "/dashboard/patient/exam-results?role=patient" },
                { label: "Documentos", icon: "🔒", iconBg: "bg-violet-50 dark:bg-violet-950/30",   path: "/dashboard/patient/documents?role=patient" },
                { label: "Receitas",   icon: "💊", iconBg: "bg-amber-50 dark:bg-amber-950/30",    path: "/dashboard/prescription-renewal?role=patient" },
              ]}
            />

            {/* Next Appointment */}
            {!loading && nextAppt ? (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">Próxima consulta</h2>
                  <Button variant="link" size="sm" className="h-auto p-0 text-[11px] font-semibold text-primary"
                    onClick={() => navigate("/dashboard/appointments?role=patient")}>
                    Ver todas <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Card className="cursor-pointer overflow-hidden rounded-2xl border-border/20 shadow-[0_3px_14px_rgba(0,0,0,.07)]"
                    onClick={() => navigate("/dashboard/appointments?role=patient")}>
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        <div className={`flex w-[56px] shrink-0 flex-col items-center justify-center py-4 ${daysUntilNext === 0 ? "bg-gradient-to-b from-[#1e3a8a] to-[#2563EB] text-white" : "bg-muted/40 text-muted-foreground"}`}>
                          <span className="text-[8px] font-bold uppercase tracking-wide opacity-70">{format(new Date(nextAppt.scheduled_at), "MMM", { locale: ptBR })}</span>
                          <span className="text-[24px] font-black leading-none">{format(new Date(nextAppt.scheduled_at), "dd")}</span>
                          <span className="text-[9px] font-semibold opacity-70">{format(new Date(nextAppt.scheduled_at), "EEE", { locale: ptBR })}</span>
                        </div>
                        <div className="flex flex-1 items-center gap-3 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-bold text-foreground">{(nextAppt as Record<string, unknown>).doctor_name as string}</p>
                            <p className="mt-1 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(nextAppt.scheduled_at), "HH:mm")} · {nextAppt.duration_minutes || 30}min
                            </p>
                            {daysUntilNext === 0 && (
                              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-blue-600">
                                <Flame className="h-3 w-3" /> Hoje em {hoursUntilNext}h
                              </p>
                            )}
                          </div>
                          {daysUntilNext === 0 ? (
                            <Button size="sm"
                              className="h-9 shrink-0 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#2563EB] px-4 text-[11px] font-bold text-white shadow-[0_4px_14px_rgba(37,99,235,.3)]"
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
              </div>
            ) : !loading && (
              <div className="flex flex-col items-center py-6 text-center rounded-2xl border border-dashed border-border/40 bg-muted/10">
                <motion.img src={mascotWelcome} alt="Pingo"
                  className="mb-3 h-24 w-24 object-contain select-none"
                  style={{ filter: "drop-shadow(0 8px 18px rgba(0,0,0,.15))" }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} />
                <p className="text-[13.5px] font-bold text-foreground">Nenhuma consulta agendada</p>
                <p className="mt-1 text-[11.5px] text-muted-foreground">Agende agora e cuide da sua saúde</p>
                <Button className="mt-5 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#2563EB] text-white shadow-[0_4px_14px_rgba(37,99,235,.3)]"
                  onClick={() => navigate("/dashboard/schedule?role=patient")}>
                  <Calendar className="mr-2 h-4 w-4" /> Agendar consulta
                </Button>
              </div>
            )}

            {/* Alerts */}
            {!activeSub && (
              <AlertBox variant="info" icon={<span className="text-[20px]">💳</span>}
                title="Assine um plano e economize até 30%"
                subtitle="Acesso ilimitado + benefícios exclusivos"
                actionLabel="Ver planos"
                onAction={() => navigate("/dashboard/plans?role=patient")} />
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            {/* Bento Stats */}
            <StatBento loading={loading} stats={[
              { label: "Consultas",  value: stats?.total ?? 0,         icon: "📅", iconBg: "bg-blue-50 dark:bg-blue-950/30",    valueClass: "text-[#1e3a8a] dark:text-blue-400",    accentClass: "bg-blue-500",   trend: 12 },
              { label: "Receitas",   value: stats?.prescriptions ?? 0, icon: "💊", iconBg: "bg-amber-50 dark:bg-amber-950/30",  valueClass: "text-amber-600 dark:text-amber-400",    accentClass: "bg-amber-500",  trend: 5 },
              { label: "Documentos", value: stats?.documents ?? 0,     icon: "📂", iconBg: "bg-violet-50 dark:bg-violet-950/30",valueClass: "text-violet-600 dark:text-violet-400",  accentClass: "bg-violet-500" },
              
            ]} />

            {/* Health Metrics 3x2 */}
            {(healthMetrics as { type: string; value: number; unit: string }[]).length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">Métricas de saúde</h2>
                  <Button variant="link" size="sm" className="h-auto p-0 text-[11px] font-semibold text-primary"
                    onClick={() => navigate("/dashboard/patient/health?role=patient")}>
                    Ver tudo →
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(healthMetrics as { type: string; value: number; unit: string }[]).slice(0, 6).map((m, i) => {
                    const cfg = METRIC_CONFIGS[m.type] ?? { emoji: "📊", label: m.type, color: "text-muted-foreground" };
                    return (
                      <motion.button key={m.type}
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 20 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => navigate("/dashboard/patient/health?role=patient")}
                        className="flex flex-col items-center rounded-2xl border border-border/20 bg-card py-2.5 text-center shadow-[0_1px_6px_rgba(0,0,0,.06)] transition-all hover:-translate-y-1 hover:shadow-md"
                      >
                        <span className="text-[18px] md:text-[20px]">{cfg.emoji}</span>
                        <p className={`mt-1 text-[13px] font-black leading-none tracking-tight md:text-[14px] ${cfg.color}`}>
                          {m.value}<span className="ml-0.5 text-[8px] font-normal text-muted-foreground/55">{m.unit}</span>
                        </p>
                        <p className="mt-0.5 text-[8.5px] font-medium text-muted-foreground/65">{cfg.label}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pingo Dica */}
            <PingoBannerCard
              pingImg={mascotReading}
              pingAlt="Pingo com dica"
              pingSize={80}
              bgClass="bg-blue-50 dark:bg-blue-950/30"
              borderClass="border-blue-100 dark:border-blue-900/30"
              label="Dica do dia"
              labelColor="text-blue-600 dark:text-blue-400"
              title={todayTip}
              titleColor="text-blue-900 dark:text-blue-100"
            />

            {/* Return appointments */}
            {returnAppts.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-amber-200/60 bg-amber-50/50 dark:border-amber-800/30 dark:bg-amber-950/10 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Gift className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-[12px] font-bold text-amber-700 dark:text-amber-400">Retorno Grátis Disponível</p>
                </div>
                {(returnAppts as { id: string; return_deadline: string; doctor_name: string; doctor_id: string }[]).map(ra => {
                  const daysR = differenceInDays(new Date(ra.return_deadline), new Date());
                  return (
                    <div key={ra.id} className="mb-2 flex items-center justify-between rounded-xl border border-border/20 bg-card p-3 last:mb-0">
                      <div className="text-[11px]">
                        <p className="font-semibold">{ra.doctor_name}</p>
                        <p className="mt-0.5 text-muted-foreground">
                          {daysR <= 3
                            ? <span className="font-semibold text-red-500">⚠️ {daysR}d restantes</span>
                            : `Até ${format(new Date(ra.return_deadline), "dd/MM")} (${daysR}d)`}
                        </p>
                      </div>
                      <Button size="sm" className="h-8 rounded-xl bg-amber-500 text-white hover:bg-amber-600 text-[10.5px] font-bold"
                        onClick={() => navigate(`/dashboard/schedule/${ra.doctor_id}?return=true&original=${ra.id}`)}>
                        Agendar
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Shortcuts */}
            <DashboardShortcuts shortcuts={[
              { label: "Prontuário",    description: "Histórico médico",        icon: <ClipboardList className="w-[17px] h-[17px]" />, path: "/dashboard/medical-records?role=patient",  iconBg: "bg-blue-50 dark:bg-blue-950/30",    iconColor: "text-blue-600 dark:text-blue-400" },
              { label: "Minha Saúde",  description: "Métricas e bem-estar",    icon: <Heart className="w-[17px] h-[17px]" />,         path: "/dashboard/patient/health?role=patient",   iconBg: "bg-red-50 dark:bg-red-950/30",      iconColor: "text-red-500" },
              { label: "Pagamentos",   description: "Histórico financeiro",    icon: <CreditCard className="w-[17px] h-[17px]" />,    path: "/dashboard/payment-history?role=patient",  iconBg: "bg-amber-50 dark:bg-amber-950/30",  iconColor: "text-amber-600 dark:text-amber-400" },
              { label: "Chat Suporte", description: "Fale com a equipe",       icon: <MessageCircle className="w-[17px] h-[17px]" />, path: "/dashboard/chat?role=patient",             iconBg: "bg-blue-50 dark:bg-blue-950/30",    iconColor: "text-blue-600 dark:text-blue-400" },
              { label: "Perfil",       description: "Dados pessoais",          icon: <User className="w-[17px] h-[17px]" />,          path: "/dashboard/profile?role=patient",          iconBg: "bg-muted",                          iconColor: "text-muted-foreground" },
            ]} />

            
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
