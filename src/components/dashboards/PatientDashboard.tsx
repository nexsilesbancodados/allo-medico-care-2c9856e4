import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
const METRIC_CONFIGS: Record<string, { icon: typeof Heart; label: string; unit: string; colorClass: string }> = {
  pressao_arterial:    { icon: Activity,     label: "Pressão Arterial", unit: "mmHg",  colorClass: "text-primary" },
  peso:                { icon: Weight,        label: "Peso",             unit: "kg",    colorClass: "text-primary" },
  glicemia:            { icon: Droplets,      label: "Glicemia",         unit: "mg/dL", colorClass: "text-warning" },
  frequencia_cardiaca: { icon: Heart,         label: "Batimentos",       unit: "bpm",   colorClass: "text-destructive" },
  temperatura:         { icon: Thermometer,   label: "Temperatura",      unit: "°C",    colorClass: "text-warning" },
  saturacao:           { icon: Wind,          label: "SpO₂",             unit: "%",     colorClass: "text-secondary" },
};

const HEALTH_TIPS = [
  { title: "Mantenha-se hidratada hoje!", body: "Sua atividade física foi 15% maior ontem. O consumo de água é essencial para sua recuperação.", metric: "2.4L", metricLabel: "Meta Diária" },
  { title: "30 min de caminhada fazem diferença!", body: "Caminhar regularmente reduz a ansiedade em até 40%.", metric: "30min", metricLabel: "Ideal/dia" },
  { title: "Durma bem esta noite!", body: "Dormir 7-8h fortalece o sistema imunológico.", metric: "8h", metricLabel: "Ideal" },
  { title: "Frutas e vegetais no prato!", body: "5 porções de frutas e vegetais por dia.", metric: "5", metricLabel: "Porções/dia" },
  { title: "Respire fundo por 5 minutos!", body: "A respiração profunda reduz o cortisol.", metric: "5min", metricLabel: "Diário" },
  { title: "Tome um pouco de sol!", body: "15 minutos de sol diário ajudam na vitamina D.", metric: "15min", metricLabel: "Sol/dia" },
  { title: "Monitore sua pressão!", body: "Acompanhar a pressão regularmente é essencial.", metric: "12/8", metricLabel: "Ideal" },
];

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  path: string;
  bg: string;
  iconBg: string;
  accent?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Início",
    icon: <span className="text-2xl">🏠</span>,
    path: "/dashboard?role=patient",
    bg: "bg-card",
    iconBg: "bg-primary/10",
  },
  {
    label: "Agendar",
    icon: <Search className="h-6 w-6 text-primary" />,
    path: "/dashboard/schedule?role=patient",
    bg: "bg-card",
    iconBg: "bg-primary/10",
  },
  {
    label: "Urgência",
    icon: <Zap className="h-6 w-6 text-destructive" />,
    path: "/dashboard/urgent-care?role=patient",
    bg: "bg-destructive/8",
    iconBg: "bg-destructive/15",
    accent: true,
  },
  {
    label: "Consultas",
    icon: <ClipboardList className="h-6 w-6 text-primary" />,
    path: "/dashboard/appointments?role=patient",
    bg: "bg-card",
    iconBg: "bg-primary/10",
  },
];

const SUPPORT_LINKS = [
  { icon: MessageCircle, label: "Chat com Suporte", path: "/dashboard/chat?role=patient" },
  { icon: CreditCard,    label: "Pagamentos",       path: "/dashboard/payment-history?role=patient" },
  { icon: Settings,      label: "Configurações",    path: "/dashboard/settings?role=patient" },
] as const;

/* ── Helper: greeting by hour ── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6)  return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

const stagger = { delay: 0.06, type: "spring" as const, stiffness: 240, damping: 22 };

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
        <section className="relative -mx-4 -mt-5 overflow-hidden rounded-b-[2rem] bg-gradient-to-r from-primary via-primary to-[hsl(215_60%_45%)] md:-mx-6 md:-mt-5 md:rounded-[2rem] lg:-mx-8 lg:-mt-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/[0.07] blur-[50px]" />

          <div className="relative z-10 px-6 pt-10 pb-8 md:px-8 md:pt-12 md:pb-10">
            <motion.h1
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="font-[Manrope] text-[28px] font-extrabold text-primary-foreground leading-[1.15] md:text-4xl"
            >
              {getGreeting()}, {firstName}!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.45 }}
              className="mt-2 text-[15px] font-medium text-primary-foreground/65 leading-relaxed"
            >
              Sua jornada de saúde está em boas mãos hoje.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Button
                onClick={() => navigate("/dashboard/patient/health?role=patient")}
                className="mt-6 rounded-full bg-primary-foreground px-7 py-3 text-[15px] font-bold text-primary shadow-lg hover:bg-primary-foreground/90 active:scale-[0.97] transition-all"
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

        {/* ═══════════ QUICK ACTIONS ═══════════ */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * stagger.delay, type: stagger.type, stiffness: stagger.stiffness, damping: stagger.damping }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-start gap-3 rounded-2xl border p-5 cursor-pointer transition-all active:shadow-none
                ${action.accent
                  ? "border-destructive/15 bg-destructive/[0.06] hover:bg-destructive/10"
                  : "border-border/30 bg-card hover:bg-muted/50 shadow-[var(--shadow-card)]"
                }`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform ${action.iconBg}`}>
                {action.icon}
              </div>
              <span className={`text-[14px] font-semibold ${action.accent ? "text-destructive" : "text-foreground"}`}>
                {action.label}
              </span>
            </motion.button>
          ))}
        </section>

        {/* ═══════════ TWO COLUMNS ═══════════ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">

          {/* LEFT: Health Metrics */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-[Manrope] text-lg font-bold text-foreground">Métricas de Saúde</h2>
              <Button variant="link" className="p-0 text-sm font-bold text-primary h-auto"
                onClick={() => navigate("/dashboard/patient/health?role=patient")}>
                Ver histórico
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Heart Rate Card */}
              <Card className="overflow-hidden border-border/20 shadow-[var(--shadow-card)]">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Batimentos</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10">
                      <Heart className="h-4 w-4 text-destructive" fill="currentColor" />
                    </div>
                  </div>
                  <div className="mb-3 flex items-baseline gap-1.5">
                    <span className="font-[Manrope] text-3xl font-extrabold text-foreground">
                      {typedMetrics.find(m => m.type === "frequencia_cardiaca")?.value ?? 72}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">bpm</span>
                  </div>
                  <div className="flex h-10 w-full items-end gap-[3px] rounded-lg bg-muted/40 px-2 py-1.5">
                    {[40, 65, 50, 80, 70, 55, 75].map((h, i) => (
                      <div key={i} className="w-full rounded-t bg-destructive/60 transition-all" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Blood Pressure Card */}
              <Card className="overflow-hidden border-border/20 shadow-[var(--shadow-card)]">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Pressão Arterial</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="mb-3 flex items-baseline gap-1.5">
                    <span className="font-[Manrope] text-3xl font-extrabold text-foreground">
                      {typedMetrics.find(m => m.type === "pressao_arterial")?.value ?? "12/8"}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">mmHg</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[11px] font-bold text-success">Normal</span>
                  </div>
                </CardContent>
              </Card>

              {/* Dynamic metrics */}
              {typedMetrics
                .filter(m => m.type !== "frequencia_cardiaca" && m.type !== "pressao_arterial")
                .slice(0, 2)
                .map(m => {
                  const cfg = METRIC_CONFIGS[m.type];
                  const Icon = cfg?.icon ?? Heart;
                  return (
                    <Card key={m.type} className="overflow-hidden border-border/20 shadow-[var(--shadow-card)]">
                      <CardContent className="p-5">
                        <div className="mb-3 flex items-start justify-between">
                          <span className="text-xs font-semibold text-muted-foreground">{cfg?.label ?? m.type}</span>
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted">
                            <Icon className={`h-4 w-4 ${cfg?.colorClass ?? "text-muted-foreground"}`} />
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-[Manrope] text-3xl font-extrabold text-foreground">{m.value}</span>
                          <span className="text-xs font-medium text-muted-foreground">{m.unit}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>

            {/* Health Tip */}
            <div className="flex flex-col gap-4 rounded-2xl border border-border/20 bg-card p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dica de Saúde</p>
                <h3 className="mt-1.5 font-[Manrope] text-base font-bold text-foreground leading-snug">{todayTip.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{todayTip.body}</p>
              </div>
              <div className="flex min-w-[100px] flex-col items-center justify-center rounded-2xl bg-primary/8 p-4">
                <span className="text-xl font-extrabold text-primary">{todayTip.metric}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{todayTip.metricLabel}</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Next Appointment + Support */}
          <div className="space-y-5">
            <h2 className="font-[Manrope] text-lg font-bold text-foreground">Próxima Consulta</h2>

            {!loading && nextAppt ? (
              <NextAppointmentCard appt={nextAppt} daysUntilNext={daysUntilNext} navigate={navigate} />
            ) : !loading && (
              <EmptyAppointmentCard navigate={navigate} />
            )}

            {returnAppts.length > 0 && (
              <ReturnAppointments items={returnAppts as ReturnAppt[]} navigate={navigate} />
            )}

            {/* Quick Support Access */}
            <div className="space-y-1.5">
              {SUPPORT_LINKS.map(item => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="flex w-full items-center justify-between rounded-2xl border border-border/20 bg-card p-4 shadow-[var(--shadow-card)] transition-all hover:bg-muted/40 active:scale-[0.98] group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                      <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-[14px] font-semibold text-foreground">{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </button>
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
  <div className="overflow-hidden rounded-2xl border border-warning/20 bg-warning/5 p-4">
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning/15">
        <Gift className="h-4 w-4 text-warning" />
      </div>
      <p className="text-xs font-bold text-warning">Retorno Grátis Disponível</p>
    </div>
    {items.map(ra => {
      const daysR = differenceInDays(new Date(ra.return_deadline), new Date());
      return (
        <div key={ra.id} className="mb-2 flex items-center justify-between rounded-xl border border-border/20 bg-card p-3 last:mb-0">
          <div className="text-xs">
            <p className="font-semibold text-foreground">{ra.doctor_name}</p>
            <p className="mt-0.5 text-muted-foreground">
              {daysR <= 3
                ? <span className="font-semibold text-destructive">⚠️ {daysR}d restantes</span>
                : `Até ${format(new Date(ra.return_deadline), "dd/MM")} (${daysR}d)`}
            </p>
          </div>
          <Button size="sm" className="h-8 rounded-full bg-warning text-warning-foreground hover:bg-warning/90 text-[11px] font-bold"
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
    <Card className="relative overflow-hidden border-border/20 shadow-[var(--shadow-card)]">
      <CardContent className="p-5">
        <div className="absolute right-5 top-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Video className="h-5 w-5 text-primary" />
          </div>
        </div>
        <p className="mb-3 text-[13px] font-bold text-primary">
          {daysUntilNext === 0
            ? `Hoje, ${format(scheduledAt, "HH:mm")}`
            : daysUntilNext === 1
              ? `Amanhã, ${format(scheduledAt, "HH:mm")}`
              : format(scheduledAt, "dd/MM, HH:mm", { locale: ptBR })}
        </p>
        <h3 className="font-[Manrope] text-xl font-extrabold text-foreground">
          {appt.doctor_name as string}
        </h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {(appt.specialty as string) ?? "Consulta Geral"}
        </p>

        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted">
              <Video className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-[13px] font-medium text-foreground">Telemedicina</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-[13px] font-medium text-foreground">
              {(appt.duration_minutes as number) || 30} minutos
            </span>
          </div>
        </div>

        {daysUntilNext === 0 ? (
          <Button
            className="mt-6 w-full rounded-full bg-primary text-primary-foreground py-3 font-bold shadow-lg"
            onClick={() => navigate(`/dashboard/consultation/${appt.id}`)}
          >
            <Video className="mr-2 h-4 w-4" /> Entrar na Sala
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="mt-6 w-full rounded-full py-3 font-bold"
            onClick={() => navigate("/dashboard/appointments?role=patient")}
          >
            Ver Detalhes
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const EmptyAppointmentCard = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => (
  <Card className="border-dashed border-border/30">
    <CardContent className="flex flex-col items-center py-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Calendar className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <p className="font-[Manrope] text-[15px] font-bold text-foreground">Nenhuma consulta agendada</p>
      <p className="mt-1 text-[13px] text-muted-foreground">Agende agora e cuide da sua saúde</p>
      <Button
        className="mt-5 rounded-full bg-primary text-primary-foreground px-8 shadow-lg"
        onClick={() => navigate("/dashboard/schedule?role=patient")}
      >
        <Calendar className="mr-2 h-4 w-4" /> Agendar consulta
      </Button>
    </CardContent>
  </Card>
);

export default PatientDashboard;
