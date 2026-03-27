import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "./DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getPatientNav } from "@/components/patient/patientNav";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar, Video, Clock, Gift, ChevronRight,
  Heart, Activity, Weight, Thermometer, Droplets, Wind,
  Zap, ClipboardList,
  ArrowRight, FileText, Upload,
} from "lucide-react";
import PatientOnboarding, { ONBOARDING_KEY } from "@/components/patient/PatientOnboarding";
import { PingoMascot } from "@/components/mascot/PingoMascot";
import PatientWaitingCard from "@/components/patient/PatientWaitingCard";
import SectionErrorBoundary from "@/components/ui/section-error-boundary";
import {
  usePatientStats, usePatientUpcoming, useReturnAppointments, useRecentHealthMetrics,
} from "@/hooks/usePatientDashboard";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@/hooks/use-local-storage";

/* ── Metric display configs ── */
const METRIC_CONFIGS: Record<string, { icon: typeof Heart; label: string; unit: string; gradient: string; iconBg: string }> = {
  pressao_arterial:    { icon: Activity,     label: "Pressão",    unit: "mmHg",  gradient: "from-[hsl(var(--p-primary))]/12 to-[hsl(var(--p-primary))]/4", iconBg: "bg-[hsl(var(--p-primary))]/15" },
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
  icon: typeof Zap;
  path: string;
  iconBg: string;
  iconColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Agendar", icon: Calendar, path: "/dashboard/schedule?role=patient", iconBg: "bg-[hsl(var(--p-primary))]/10", iconColor: "text-[hsl(var(--p-primary))]" },
  { label: "Urgência", icon: Zap, path: "/dashboard/urgent-care?role=patient", iconBg: "bg-destructive/10", iconColor: "text-destructive" },
  { label: "Exames", icon: ClipboardList, path: "/dashboard/patient/exam-results?role=patient", iconBg: "bg-secondary/10", iconColor: "text-secondary" },
  { label: "Receitas", icon: FileText, path: "/dashboard/history?role=patient", iconBg: "bg-[hsl(var(--p-primary-mid))]/10", iconColor: "text-[hsl(var(--p-primary-mid))]" },
  { label: "Docs", icon: Upload, path: "/dashboard/patient/documents?role=patient", iconBg: "bg-warning/10", iconColor: "text-warning" },
];


const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

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

  if (loading) {
    return (
      <DashboardLayout title="Paciente" nav={getPatientNav("home")} role="patient">
        <div className="space-y-5 pb-24 md:pb-8">
          {/* Hero skeleton */}
          <div className="-mx-4 -mt-5 md:-mx-6 md:-mt-5 lg:-mx-8 lg:-mt-6">
            <Skeleton className="h-52 rounded-b-[2rem] md:rounded-[2rem]" />
          </div>
          {/* Quick actions skeleton */}
          <div className="grid grid-cols-5 gap-2">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="w-11 h-11 rounded-2xl" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
          {/* Cards skeleton */}
          <div className="grid grid-cols-2 gap-3">
            {[0,1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("home")} role="patient">
      {showOnboarding && <PatientOnboarding onComplete={() => setShowOnboarding(false)} />}

      <div className="space-y-5 pb-24 md:pb-8">

        {/* ═══════════ HERO BANNER ═══════════ */}
        <section className="relative -mx-4 -mt-5 overflow-hidden rounded-b-[28px] bg-gradient-to-br from-[#00347F] via-[#0D3F8C] to-[#2563EB] md:-mx-6 md:-mt-5 md:rounded-[2rem] lg:-mx-8 lg:-mt-6">
          {/* Decorative elements */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/[0.06] blur-[60px]" />
          <div className="pointer-events-none absolute left-0 bottom-0 h-40 w-40 rounded-full bg-[#2563EB]/30 blur-[50px]" />
          <div className="pointer-events-none absolute right-1/4 top-1/2 h-20 w-20 rounded-full bg-white/[0.04] blur-[25px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="relative z-10 flex items-center px-6 pt-10 pb-9 md:px-8 md:pt-14 md:pb-12">
            <div className="flex-1 min-w-0">
              {/* Greeting */}
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="font-[Manrope] text-[26px] font-extrabold text-white leading-[1.15] md:text-[36px]"
              >
                {getGreeting()}, <span className="capitalize">{firstName}</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.45 }}
                className="mt-1.5 text-[14px] font-medium text-white/55 leading-relaxed max-w-xs md:text-[15px]"
              >
                Cuide da sua saúde com quem entende.
              </motion.p>

              {/* KPI pills */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="flex gap-2.5 mt-5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.12] backdrop-blur-sm border border-white/[0.08] px-3.5 py-2 text-[12px] font-bold text-white/85 shadow-sm">
                  <Calendar className="w-3.5 h-3.5 opacity-70" /> {stats?.total ?? 0} consultas
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.12] backdrop-blur-sm border border-white/[0.08] px-3.5 py-2 text-[12px] font-bold text-white/85 shadow-sm">
                  <Heart className="w-3.5 h-3.5 opacity-70" /> {typedMetrics.length} métricas
                </span>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                <Button
                  onClick={() => navigate("/dashboard/patient/health?role=patient")}
                  className="mt-6 rounded-full bg-white px-8 py-3 h-auto text-[14px] font-bold text-[#00347F] shadow-lg shadow-black/10 hover:bg-white/95 hover:shadow-xl hover:shadow-black/15 active:scale-[0.97] transition-all duration-200"
                >
                  <Heart className="mr-2 h-4 w-4" /> Minha Saúde
                </Button>
              </motion.div>
            </div>

            {/* Pingo mascot */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="hidden sm:flex shrink-0 items-end ml-4"
            >
              <PingoMascot variant="wave" size={140} animate bounce className="drop-shadow-[0_8px_24px_rgba(0,0,0,0.25)]" />
            </motion.div>
          </div>
        </section>

        {/* Live consultation */}
        {waitingAppt && (
          <SectionErrorBoundary fallbackTitle="Erro na sala de espera">
            <PatientWaitingCard appointment={waitingAppt} />
          </SectionErrorBoundary>
        )}

        {/* ═══════════ QUICK ACTIONS — 5 col grid ═══════════ */}
        <section className="grid grid-cols-5 gap-2">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 24 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-1.5 py-2 cursor-pointer"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${action.iconBg} transition-transform`}>
                <action.icon className={`h-5 w-5 ${action.iconColor}`} />
              </div>
              <span className="text-[11px] font-semibold text-foreground leading-tight">{action.label}</span>
            </motion.button>
          ))}
        </section>

        {/* ═══════════ HEALTH METRICS + SIDEBAR ═══════════ */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">

          {/* LEFT: Health Tip */}
          <div className="lg:col-span-2 space-y-5">
            {/* Health Tip — Blue tinted */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileTap={{ scale: 0.97 }}
              className="relative overflow-hidden rounded-2xl border border-[hsl(var(--p-primary))]/10 bg-gradient-to-br from-[hsl(var(--p-primary))]/[0.06] to-[hsl(var(--p-primary))]/[0.02] p-5 sm:p-6"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[hsl(var(--p-primary))]/5 blur-xl" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{todayTip.emoji}</span>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--p-primary))]/60">Dica de Saúde</p>
                  </div>
                  <h3 className="font-[Manrope] text-base font-bold text-foreground leading-snug">{todayTip.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{todayTip.body}</p>
                </div>
                <div className="flex min-w-[100px] flex-col items-center justify-center rounded-2xl bg-card/80 backdrop-blur-sm border border-border/20 p-4 shadow-[var(--p-shadow-card)]">
                  <span className="text-xl font-extrabold text-[hsl(var(--p-primary))] font-[Manrope]">{todayTip.metric}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{todayTip.metricLabel}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Next Appointment + Support */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[hsl(var(--p-primary))]/10 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-[hsl(var(--p-primary))]" />
              </div>
              <h2 className="font-[Manrope] text-lg font-bold text-foreground">Próxima Consulta</h2>
            </div>

            {nextAppt ? (
              <NextAppointmentCard appt={nextAppt} daysUntilNext={daysUntilNext} navigate={navigate} />
            ) : (
              <EmptyAppointmentCard navigate={navigate} />
            )}

            {returnAppts.length > 0 && (
              <ReturnAppointments items={returnAppts as ReturnAppt[]} navigate={navigate} />
            )}

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
  <div className="overflow-hidden rounded-2xl border border-warning/20 bg-[hsl(var(--p-warning-soft))] p-4">
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning/15">
        <Gift className="h-4 w-4 text-warning" />
      </div>
      <p className="text-xs font-bold text-warning">Retorno Grátis Disponível</p>
    </div>
    {items.map(ra => {
      const daysR = differenceInDays(new Date(ra.return_deadline), new Date());
      return (
        <div key={ra.id} className="mb-2 flex items-center justify-between rounded-xl border border-border/20 bg-card p-3 last:mb-0 shadow-[var(--p-shadow-card)]">
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
    <Card className="relative overflow-hidden border-border/20 shadow-[var(--p-shadow-elevated)]">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#00347F] to-[#2563EB]" />
      <CardContent className="p-0">
        <div className="flex">
          {/* Left date column */}
          <div className="flex flex-col items-center justify-center px-4 py-5 bg-[#00347F] text-white min-w-[72px]">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{format(scheduledAt, "MMM", { locale: ptBR })}</span>
            <span className="font-[Manrope] text-[28px] font-extrabold leading-none mt-0.5">{format(scheduledAt, "dd")}</span>
            <span className="text-[11px] font-semibold mt-1 opacity-80">{format(scheduledAt, "HH:mm")}</span>
          </div>
          {/* Right content */}
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--p-primary))]/8 px-2.5 py-1 text-[11px] font-bold text-[hsl(var(--p-primary))]">
                <Clock className="w-3 h-3" />
                {daysUntilNext === 0 ? "Hoje" : daysUntilNext === 1 ? "Amanhã" : `${daysUntilNext}d`}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--p-primary))]/8">
                <Video className="h-4 w-4 text-[hsl(var(--p-primary))]" />
              </div>
            </div>

            <h3 className="font-[Manrope] text-[15px] font-extrabold text-foreground leading-tight mt-1">
              {appt.doctor_name as string}
            </h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {(appt.specialty as string) ?? "Consulta Geral"} · {(appt.duration_minutes as number) || 30}min
            </p>

            {daysUntilNext === 0 ? (
              <Button
                className="mt-3 w-full rounded-full bg-[#00347F] text-white py-2.5 font-bold text-[13px] shadow-[var(--p-shadow-btn)] hover:bg-[#00347F]/90"
                onClick={() => navigate(`/dashboard/consultation/${appt.id}`)}
              >
                <Video className="mr-2 h-4 w-4" /> Entrar na Sala
              </Button>
            ) : (
              <Button
                variant="outline"
                className="mt-3 w-full rounded-full py-2.5 font-bold text-[13px] border-[hsl(var(--p-primary))]/20 text-[hsl(var(--p-primary))] hover:bg-[hsl(var(--p-primary))]/5"
                onClick={() => navigate("/dashboard/appointments?role=patient")}
              >
                Ver Detalhes <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
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
        className="mt-6 rounded-full bg-[#00347F] text-white px-8 shadow-[var(--p-shadow-btn)]"
        onClick={() => navigate("/dashboard/schedule?role=patient")}
      >
        <Calendar className="mr-2 h-4 w-4" /> Agendar consulta
      </Button>
    </CardContent>
  </Card>
);

export default PatientDashboard;
