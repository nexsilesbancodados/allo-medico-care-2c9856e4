import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "./DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getPatientNav } from "@/components/patient/patientNav";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar, Video, Clock, Gift, ChevronRight,
  Heart, Activity, Weight, Thermometer, Droplets, Wind,
  MessageCircle, CreditCard, Settings, Zap, Search, ClipboardList,
  Sparkles, ArrowRight, Star, TrendingUp,
} from "lucide-react";
import PatientOnboarding, { ONBOARDING_KEY } from "@/components/patient/PatientOnboarding";
import PatientWaitingCard from "@/components/patient/PatientWaitingCard";
import SectionErrorBoundary from "@/components/ui/section-error-boundary";
import {
  usePatientStats, usePatientUpcoming, useReturnAppointments, useRecentHealthMetrics,
} from "@/hooks/usePatientDashboard";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@/hooks/use-local-storage";

/* ── Metric display configs ── */
const METRIC_CONFIGS: Record<string, { icon: typeof Heart; label: string; unit: string; gradient: string; iconBg: string }> = {
  pressao_arterial:    { icon: Activity,     label: "Pressão",    unit: "mmHg",  gradient: "from-primary/12 to-primary/4", iconBg: "bg-primary/15" },
  peso:                { icon: Weight,        label: "Peso",       unit: "kg",    gradient: "from-warning/12 to-warning/4", iconBg: "bg-warning/15" },
  glicemia:            { icon: Droplets,      label: "Glicemia",   unit: "mg/dL", gradient: "from-secondary/12 to-secondary/4", iconBg: "bg-secondary/15" },
  frequencia_cardiaca: { icon: Heart,         label: "Batimentos", unit: "bpm",   gradient: "from-destructive/12 to-destructive/4", iconBg: "bg-destructive/15" },
  temperatura:         { icon: Thermometer,   label: "Temp.",      unit: "°C",    gradient: "from-warning/12 to-warning/4", iconBg: "bg-warning/15" },
  saturacao:           { icon: Wind,          label: "SpO₂",       unit: "%",     gradient: "from-secondary/12 to-secondary/4", iconBg: "bg-secondary/15" },
};

const HEALTH_TIPS = [
  { title: "Hidratação é chave!", body: "Beba pelo menos 2L de água por dia para manter corpo e mente funcionando bem.", metric: "2.4L", metricLabel: "Meta Diária", emoji: "💧" },
  { title: "Mexa-se hoje!", body: "30 min de caminhada reduzem ansiedade em até 40%.", metric: "30min", metricLabel: "Ideal/dia", emoji: "🏃" },
  { title: "Durma bem!", body: "7-8h de sono fortalecem a imunidade.", metric: "8h", metricLabel: "Ideal", emoji: "😴" },
  { title: "Frutas no prato!", body: "5 porções diárias fortalecem a imunidade.", metric: "5", metricLabel: "Porções", emoji: "🍎" },
  { title: "Respire fundo!", body: "Respiração profunda reduz o cortisol.", metric: "5min", metricLabel: "Diário", emoji: "🧘" },
  { title: "Sol na medida!", body: "15 min de sol ajudam na vitamina D.", metric: "15min", metricLabel: "Sol/dia", emoji: "☀️" },
  { title: "Monitore a pressão!", body: "Acompanhamento regular é prevenção.", metric: "12/8", metricLabel: "Ideal", emoji: "❤️" },
];

interface QuickAction {
  label: string;
  emoji: string;
  icon?: typeof Zap;
  path: string;
  accent?: boolean;
  accentColor?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Início", emoji: "🏠", path: "/dashboard?role=patient" },
  { label: "Agendar", emoji: "📅", path: "/dashboard/schedule?role=patient" },
  { label: "Urgência", emoji: "", icon: Zap, path: "/dashboard/urgent-care?role=patient", accent: true, accentColor: "destructive" },
  { label: "Consultas", emoji: "📋", path: "/dashboard/appointments?role=patient" },
];

const SUPPORT_LINKS = [
  { icon: MessageCircle, label: "Chat com Suporte", desc: "Fale com nossa equipe", path: "/dashboard/chat?role=patient", color: "text-primary" },
  { icon: CreditCard, label: "Pagamentos", desc: "Faturas e histórico", path: "/dashboard/payment-history?role=patient", color: "text-success" },
  { icon: Settings, label: "Configurações", desc: "Preferências do app", path: "/dashboard/settings?role=patient", color: "text-muted-foreground" },
] as const;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

const stagger = { delay: 0.05 };

const PatientDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingDone] = useLocalStorage<boolean>(ONBOARDING_KEY, false);

  const { data: stats, isLoading: statsLoading } = usePatientStats();
  const { data: upcoming = [], isLoading: upcomingLoading } = usePatientUpcoming();
  const { data: returnAppts = [] } = useReturnAppointments();
  const { data: healthMetrics = [] } = useRecentHealthMetrics();

  const loading = statsLoading || upcomingLoading;
  const waitingAppt = upcoming.find((a: { status: string }) =>
    a.status === "waiting" || a.status === "in_progress"
  ) ?? null;

  const nextAppt = upcoming[0];
  const daysUntilNext = nextAppt ? differenceInDays(new Date(nextAppt.scheduled_at), new Date()) : null;

  const todayTip = HEALTH_TIPS[new Date().getDay() % HEALTH_TIPS.length];
  const firstName = profile?.first_name || "Paciente";

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

  const typedMetrics = healthMetrics as { type: string; value: number; unit: string }[];

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("home")} role="patient">
      {showOnboarding && <PatientOnboarding onComplete={() => setShowOnboarding(false)} />}

      <div className="space-y-6 pb-24 md:pb-8">

        {/* ═══════════ HERO BANNER ═══════════ */}
        <section className="relative -mx-4 -mt-5 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-primary via-[hsl(215_70%_38%)] to-[hsl(215_55%_48%)] md:-mx-6 md:-mt-5 md:rounded-[2rem] lg:-mx-8 lg:-mt-6">
          {/* Decorative elements */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/[0.07] blur-[50px]" />
          <div className="pointer-events-none absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-white/[0.04] blur-[30px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          <div className="relative z-10 px-6 pt-10 pb-8 md:px-8 md:pt-12 md:pb-10">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 mb-3"
            >
              <Sparkles className="w-3 h-3 text-white/70" />
              <span className="text-[11px] font-semibold text-white/70">Clinical Sanctuary</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="font-[Manrope] text-[28px] font-extrabold text-primary-foreground leading-[1.15] md:text-4xl"
            >
              {getGreeting()}, {firstName}!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.45 }}
              className="mt-2 text-[15px] font-medium text-primary-foreground/60 leading-relaxed max-w-sm"
            >
              Sua jornada de saúde está em boas mãos hoje.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
              <Button
                onClick={() => navigate("/dashboard/patient/health?role=patient")}
                className="mt-6 rounded-full bg-primary-foreground px-7 py-3 text-[14px] font-bold text-primary shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:bg-primary-foreground/90 active:scale-[0.97] transition-all"
              >
                Ver check-up diário
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Live consultation */}
        {waitingAppt && (
          <SectionErrorBoundary fallbackTitle="Erro na sala de espera">
            <PatientWaitingCard appointment={waitingAppt} />
          </SectionErrorBoundary>
        )}

        {/* ═══════════ QUICK ACTIONS — App-like Grid ═══════════ */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * stagger.delay, type: "spring", stiffness: 300, damping: 24 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(action.path)}
              className={`group relative flex flex-col items-start gap-3 rounded-[1.25rem] border p-5 cursor-pointer transition-all duration-200
                ${action.accent
                  ? "border-destructive/15 bg-destructive/[0.04] hover:bg-destructive/[0.08] hover:border-destructive/25"
                  : "border-border/25 bg-card hover:bg-muted/40 hover:border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                }`}
            >
              {/* Hover glow */}
              <div className={`absolute inset-0 rounded-[1.25rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300
                ${action.accent ? "bg-gradient-to-br from-destructive/5 to-transparent" : "bg-gradient-to-br from-primary/5 to-transparent"}`}
              />

              <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-105
                ${action.accent ? "bg-destructive/10" : "bg-primary/8"}`}
              >
                {action.icon
                  ? <action.icon className={`h-6 w-6 ${action.accent ? "text-destructive" : "text-primary"}`} />
                  : <span className="text-2xl leading-none">{action.emoji}</span>
                }
              </div>
              <span className={`relative text-[14px] font-semibold ${action.accent ? "text-destructive" : "text-foreground"}`}>
                {action.label}
              </span>
            </motion.button>
          ))}
        </section>

        {/* ═══════════ HEALTH METRICS + SIDEBAR ═══════════ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">

          {/* LEFT: Health Metrics */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                </div>
                <h2 className="font-[Manrope] text-lg font-bold text-foreground">Métricas de Saúde</h2>
              </div>
              <Button variant="ghost" size="sm" className="text-sm font-semibold text-primary h-8 gap-1 hover:bg-primary/5"
                onClick={() => navigate("/dashboard/patient/health?role=patient")}>
                Ver histórico <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Heart Rate Card — Featured */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden rounded-2xl border border-border/20 bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-destructive/60 to-destructive/20" />
                <div className="mb-3 flex items-start justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Batimentos</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10">
                    <Heart className="h-4 w-4 text-destructive" fill="currentColor" />
                  </div>
                </div>
                <div className="mb-3 flex items-baseline gap-1.5">
                  <span className="font-[Manrope] text-[32px] font-extrabold text-foreground leading-none tabular-nums">
                    {typedMetrics.find(m => m.type === "frequencia_cardiaca")?.value ?? 72}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">bpm</span>
                </div>
                <div className="flex h-10 w-full items-end gap-[3px] rounded-lg bg-muted/30 px-2 py-1.5">
                  {[40, 65, 50, 80, 70, 55, 75, 60].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.3 + i * 0.04, duration: 0.4 }}
                      className="w-full rounded-t bg-gradient-to-t from-destructive/50 to-destructive/30"
                    />
                  ))}
                </div>
              </motion.div>

              {/* Blood Pressure Card — Featured */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="relative overflow-hidden rounded-2xl border border-border/20 bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/60 to-primary/20" />
                <div className="mb-3 flex items-start justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pressão</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="mb-3 flex items-baseline gap-1.5">
                  <span className="font-[Manrope] text-[32px] font-extrabold text-foreground leading-none tabular-nums">
                    {typedMetrics.find(m => m.type === "pressao_arterial")?.value ?? "12/8"}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">mmHg</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span className="text-[11px] font-bold text-success">Normal</span>
                </div>
              </motion.div>

              {/* Dynamic metrics */}
              {typedMetrics
                .filter(m => m.type !== "frequencia_cardiaca" && m.type !== "pressao_arterial")
                .slice(0, 2)
                .map((m, i) => {
                  const cfg = METRIC_CONFIGS[m.type];
                  const Icon = cfg?.icon ?? Heart;
                  return (
                    <motion.div
                      key={m.type}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className="relative overflow-hidden rounded-2xl border border-border/20 bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${cfg?.gradient ?? "from-muted to-transparent"}`} />
                      <div className="mb-3 flex items-start justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{cfg?.label ?? m.type}</span>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${cfg?.iconBg ?? "bg-muted"}`}>
                          <Icon className="h-4 w-4 text-inherit" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-[Manrope] text-[32px] font-extrabold text-foreground leading-none tabular-nums">{m.value}</span>
                        <span className="text-xs font-medium text-muted-foreground">{m.unit}</span>
                      </div>
                    </motion.div>
                  );
                })}
            </div>

            {/* Health Tip — Glass-style */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/[0.06] to-secondary/[0.04] p-5 sm:p-6"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-xl" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{todayTip.emoji}</span>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary/60">Dica de Saúde</p>
                  </div>
                  <h3 className="font-[Manrope] text-base font-bold text-foreground leading-snug">{todayTip.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{todayTip.body}</p>
                </div>
                <div className="flex min-w-[100px] flex-col items-center justify-center rounded-2xl bg-card/80 backdrop-blur-sm border border-border/20 p-4 shadow-sm">
                  <span className="text-xl font-extrabold text-primary font-[Manrope]">{todayTip.metric}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{todayTip.metricLabel}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Next Appointment + Support */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-primary" />
              </div>
              <h2 className="font-[Manrope] text-lg font-bold text-foreground">Próxima Consulta</h2>
            </div>

            {!loading && nextAppt ? (
              <NextAppointmentCard appt={nextAppt} daysUntilNext={daysUntilNext} navigate={navigate} />
            ) : !loading && (
              <EmptyAppointmentCard navigate={navigate} />
            )}

            {returnAppts.length > 0 && (
              <ReturnAppointments items={returnAppts as ReturnAppt[]} navigate={navigate} />
            )}

            {/* Quick Support Access */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1">Acesso Rápido</p>
              {SUPPORT_LINKS.map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.04 }}
                  onClick={() => navigate(item.path)}
                  className="flex w-full items-center justify-between rounded-2xl border border-border/20 bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:bg-muted/30 hover:border-border/30 active:scale-[0.98] group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 group-hover:bg-primary/8 transition-colors">
                      <item.icon className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-left">
                      <span className="text-[14px] font-semibold text-foreground block">{item.label}</span>
                      <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ── Sub-components ── */

interface ReturnAppt {
  id: string;
  return_deadline: string;
  doctor_name: string;
  doctor_id: string;
}

const ReturnAppointments = ({ items, navigate }: { items: ReturnAppt[]; navigate: ReturnType<typeof useNavigate> }) => (
  <div className="overflow-hidden rounded-2xl border border-warning/20 bg-gradient-to-br from-warning/[0.06] to-warning/[0.02] p-4">
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning/15">
        <Gift className="h-4 w-4 text-warning" />
      </div>
      <p className="text-xs font-bold text-warning">Retorno Grátis Disponível</p>
    </div>
    {items.map(ra => {
      const daysR = differenceInDays(new Date(ra.return_deadline), new Date());
      return (
        <div key={ra.id} className="mb-2 flex items-center justify-between rounded-xl border border-border/20 bg-card p-3 last:mb-0 shadow-sm">
          <div className="text-xs">
            <p className="font-semibold text-foreground">{ra.doctor_name}</p>
            <p className="mt-0.5 text-muted-foreground">
              {daysR <= 3
                ? <span className="font-semibold text-destructive">⚠️ {daysR}d restantes</span>
                : `Até ${format(new Date(ra.return_deadline), "dd/MM")} (${daysR}d)`}
            </p>
          </div>
          <Button size="sm" className="h-8 rounded-full bg-warning text-warning-foreground hover:bg-warning/90 text-[11px] font-bold shadow-sm"
            onClick={() => navigate(`/dashboard/schedule/${ra.doctor_id}?return=true&original=${ra.id}`)}>
            Agendar
          </Button>
        </div>
      );
    })}
  </div>
);

const NextAppointmentCard = ({
  appt, daysUntilNext, navigate,
}: {
  appt: Record<string, unknown>;
  daysUntilNext: number | null;
  navigate: ReturnType<typeof useNavigate>;
}) => {
  const scheduledAt = new Date(appt.scheduled_at as string);
  return (
    <Card className="relative overflow-hidden border-border/20 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary to-secondary" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1">
            <Clock className="w-3 h-3 text-primary" />
            <span className="text-[12px] font-bold text-primary">
              {daysUntilNext === 0
                ? `Hoje, ${format(scheduledAt, "HH:mm")}`
                : daysUntilNext === 1
                  ? `Amanhã, ${format(scheduledAt, "HH:mm")}`
                  : format(scheduledAt, "dd/MM, HH:mm", { locale: ptBR })}
            </span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/8">
            <Video className="h-5 w-5 text-primary" />
          </div>
        </div>

        <h3 className="font-[Manrope] text-lg font-extrabold text-foreground leading-tight">
          {appt.doctor_name as string}
        </h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {(appt.specialty as string) ?? "Consulta Geral"}
        </p>

        <div className="mt-4 flex items-center gap-4 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5" /> Telemedicina
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {(appt.duration_minutes as number) || 30}min
          </span>
        </div>

        {daysUntilNext === 0 ? (
          <Button
            className="mt-5 w-full rounded-full bg-primary text-primary-foreground py-3 font-bold shadow-[0_4px_16px_hsl(215_75%_32%/0.3)]"
            onClick={() => navigate(`/dashboard/consultation/${appt.id}`)}
          >
            <Video className="mr-2 h-4 w-4" /> Entrar na Sala
          </Button>
        ) : (
          <Button
            variant="outline"
            className="mt-5 w-full rounded-full py-3 font-bold border-primary/20 text-primary hover:bg-primary/5"
            onClick={() => navigate("/dashboard/appointments?role=patient")}
          >
            Ver Detalhes <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const EmptyAppointmentCard = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => (
  <Card className="border-dashed border-border/30 bg-gradient-to-br from-muted/20 to-transparent">
    <CardContent className="flex flex-col items-center py-10 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
        <Calendar className="h-7 w-7 text-muted-foreground/40" />
      </div>
      <p className="font-[Manrope] text-[15px] font-bold text-foreground">Nenhuma consulta agendada</p>
      <p className="mt-1 text-[13px] text-muted-foreground max-w-[200px]">Agende agora e cuide da sua saúde com especialistas</p>
      <Button
        className="mt-6 rounded-full bg-primary text-primary-foreground px-8 shadow-[0_4px_16px_hsl(215_75%_32%/0.25)]"
        onClick={() => navigate("/dashboard/schedule?role=patient")}
      >
        <Calendar className="mr-2 h-4 w-4" /> Agendar consulta
      </Button>
    </CardContent>
  </Card>
);

export default PatientDashboard;
