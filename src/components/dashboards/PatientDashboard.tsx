import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  CalendarCheck, VideoCamera, Clock, Gift, ArrowRight,
  Heart, Lightning, ClipboardText, FileText, UploadSimple,
  Sparkle, Stethoscope, MagnifyingGlass,
} from "@phosphor-icons/react";
import PatientOnboarding, { ONBOARDING_KEY } from "@/components/patient/PatientOnboarding";
import { PingoMascot } from "@/components/mascot/PingoMascot";
import PatientWaitingCard from "@/components/patient/PatientWaitingCard";
import SectionErrorBoundary from "@/components/ui/section-error-boundary";
import {
  usePatientStats, usePatientUpcoming, useReturnAppointments, useRecentHealthMetrics,
} from "@/hooks/usePatientDashboard";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@/hooks/use-local-storage";

const HEALTH_TIPS = [
  { title: "Hidratação é chave!", body: "Beba pelo menos 2L de água por dia para manter corpo e mente funcionando bem.", metric: "2.4L", metricLabel: "Meta Diária", emoji: "💧" },
  { title: "Mexa-se hoje!", body: "30 min de caminhada reduzem ansiedade em até 40%.", metric: "30min", metricLabel: "Ideal/dia", emoji: "🏃" },
  { title: "Durma bem!", body: "7-8h de sono fortalecem a imunidade.", metric: "8h", metricLabel: "Ideal", emoji: "😴" },
  { title: "Frutas no prato!", body: "5 porções diárias fortalecem a imunidade.", metric: "5", metricLabel: "Porções", emoji: "🍎" },
  { title: "Respire fundo!", body: "Respiração profunda reduz o cortisol.", metric: "5min", metricLabel: "Diário", emoji: "🧘" },
  { title: "Sol na medida!", body: "15 min de sol ajudam na vitamina D.", metric: "15min", metricLabel: "Sol/dia", emoji: "☀️" },
  { title: "Monitore a pressão!", body: "Acompanhamento regular é prevenção.", metric: "12/8", metricLabel: "Ideal", emoji: "❤️" },
];

/* ── Quick Actions with Phosphor Icons ── */
const QUICK_ACTIONS = [
  { label: "Agendar", icon: CalendarCheck, path: "/dashboard/schedule?role=patient", iconBg: "bg-[hsl(var(--p-primary))]/10", iconColor: "text-[hsl(var(--p-primary))]" },
  { label: "Urgência", icon: Lightning, path: "/dashboard/urgent-care?role=patient", iconBg: "bg-destructive/10", iconColor: "text-destructive" },
  { label: "Exames", icon: ClipboardText, path: "/dashboard/patient/exam-results?role=patient", iconBg: "bg-secondary/10", iconColor: "text-secondary" },
  { label: "Receitas", icon: FileText, path: "/dashboard/history?role=patient", iconBg: "bg-[hsl(var(--p-primary-mid))]/10", iconColor: "text-[hsl(var(--p-primary-mid))]" },
  { label: "Docs", icon: UploadSimple, path: "/dashboard/patient/documents?role=patient", iconBg: "bg-warning/10", iconColor: "text-warning" },
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

  const typedMetrics = healthMetrics as { type: string; value: number; unit: string }[];

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

  if (loading) {
    return (
      <DashboardLayout title="Paciente" nav={getPatientNav("home")} role="patient">
        <div className="space-y-5 pb-24 md:pb-8">
          <div className="-mx-4 -mt-5 md:-mx-6 md:-mt-5 lg:-mx-8 lg:-mt-6">
            <Skeleton className="h-52 rounded-b-[2rem] md:rounded-[2rem]" />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="w-11 h-11 rounded-2xl" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
          <Skeleton className="h-36 rounded-2xl" />
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
        <section className="relative -mx-4 -mt-5 overflow-hidden rounded-b-[32px] bg-gradient-to-br from-[#001d4a] via-[#00347F] to-[#1a5ccc] md:-mx-6 md:-mt-5 md:rounded-[2rem] lg:-mx-8 lg:-mt-6"
          style={{ boxShadow: "0 16px 56px rgba(0,29,74,.35), inset 0 1px 0 rgba(255,255,255,.12)" }}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[#2563EB]/25 blur-[80px]" />
          <div className="pointer-events-none absolute -left-8 bottom-4 h-48 w-48 rounded-full bg-[#3b82f6]/20 blur-[60px]" />
          <div className="pointer-events-none absolute right-1/3 top-1/3 h-24 w-24 rounded-full bg-white/[0.04] blur-[30px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />

          <div className="relative z-10 px-6 pt-10 pb-5 md:px-8 md:pt-14 md:pb-8">
            <div className="flex items-end gap-3">
              <div className="flex-1 min-w-0">
                <motion.h1
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="font-[Manrope] text-[28px] font-extrabold text-white leading-[1.1] tracking-tight md:text-[38px]"
                >
                  {getGreeting()},<br />
                  <span className="capitalize bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{firstName}</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.45 }}
                  className="mt-2 text-[13.5px] font-medium text-white/50 leading-relaxed max-w-[220px] md:text-[15px] md:max-w-xs"
                >
                  Cuide da sua saúde com quem entende.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="shrink-0 -mb-1"
              >
                <PingoMascot variant="wave" size={120} animate bounce className="drop-shadow-[0_12px_32px_rgba(0,0,0,0.35)] sm:!w-[150px] sm:!h-[150px]" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.45 }}
              className="flex gap-2 mt-5 flex-wrap"
            >
              {[
                { icon: CalendarCheck, label: `${stats?.total ?? 0} consultas` },
                { icon: Heart, label: `${typedMetrics.length} métricas` },
              ].map((pill, i) => (
                <motion.span
                  key={pill.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.22 + i * 0.06 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.1] backdrop-blur-md border border-white/[0.1] px-4 py-2 text-[12px] font-bold text-white/80 shadow-[0_2px_8px_rgba(0,0,0,.15)] hover:bg-white/[0.15] transition-colors cursor-default"
                >
                  <pill.icon size={14} weight="fill" className="opacity-60" /> {pill.label}
                </motion.span>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Button
                onClick={() => navigate("/dashboard/patient/health?role=patient")}
                className="mt-5 rounded-full bg-white px-8 py-3 h-auto text-[14px] font-extrabold text-[#00347F] shadow-[0_6px_24px_rgba(0,0,0,.15)] hover:bg-white/95 hover:shadow-[0_8px_32px_rgba(0,0,0,.2)] hover:scale-[1.02] active:scale-[0.97] transition-all duration-200"
              >
                <Heart size={16} weight="fill" className="mr-2" /> Minha Saúde
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

        {/* ═══════════ QUICK ACTIONS — Phosphor Icons ═══════════ */}
        <section className="grid grid-cols-5 gap-3">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.05, type: "spring", stiffness: 300, damping: 24 }}
              whileTap={{ scale: 0.9 }}
              whileHover={{ y: -3 }}
              onClick={() => navigate(action.path)}
              className="group flex flex-col items-center gap-2 py-3 cursor-pointer"
            >
              <div className={`relative flex h-[52px] w-[52px] items-center justify-center rounded-2xl ${action.iconBg} shadow-sm border border-border/10 transition-all duration-200 group-hover:shadow-md group-hover:scale-105`}>
                <action.icon size={22} weight="fill" className={`${action.iconColor} transition-transform duration-200 group-hover:scale-110`} />
              </div>
              <span className="text-[11.5px] font-semibold text-muted-foreground group-hover:text-foreground leading-tight transition-colors">{action.label}</span>
            </motion.button>
          ))}
        </section>

        {/* ═══════════ NEXT APPOINTMENT (prioritized) + HEALTH TIP ═══════════ */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">

          {/* LEFT: Next Appointment — now first for mobile-first */}
          <div className="space-y-5 lg:col-span-1 order-first">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[hsl(var(--p-primary))]/10 flex items-center justify-center">
                <CalendarCheck size={14} weight="fill" className="text-[hsl(var(--p-primary))]" />
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

          {/* RIGHT: Health Tip */}
          <div className="lg:col-span-2 space-y-5 order-last">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileTap={{ scale: 0.98 }}
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

            {/* Promo banner — now about finding doctors, not duplicating Urgência */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative overflow-hidden rounded-2xl border border-secondary/15 bg-gradient-to-r from-secondary/[0.08] via-secondary/[0.04] to-[hsl(var(--p-primary))]/[0.04] p-5"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-secondary/10 blur-2xl" />
              <div className="flex items-center gap-4">
                <PingoMascot variant="thumbsup" size={64} bounce className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkle size={14} weight="fill" className="text-secondary" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-secondary">Encontre seu médico</span>
                  </div>
                  <p className="text-[14px] font-bold text-foreground leading-snug">Busque por especialidade ou médico</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">Veja perfis, avaliações e horários disponíveis.</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate("/dashboard/schedule?role=patient")}
                  className="shrink-0 rounded-full bg-secondary text-secondary-foreground text-[12px] font-bold px-5 shadow-md hover:bg-secondary/90 active:scale-95 transition-all"
                >
                  <MagnifyingGlass size={14} weight="bold" className="mr-1.5" /> Buscar
                </Button>
              </div>
            </motion.div>
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
        <Gift size={16} weight="fill" className="text-warning" />
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
          <div className="flex flex-col items-center justify-center px-4 py-5 bg-[#00347F] text-white min-w-[72px]">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{format(scheduledAt, "MMM", { locale: ptBR })}</span>
            <span className="font-[Manrope] text-[28px] font-extrabold leading-none mt-0.5">{format(scheduledAt, "dd")}</span>
            <span className="text-[11px] font-semibold mt-1 opacity-80">{format(scheduledAt, "HH:mm")}</span>
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--p-primary))]/8 px-2.5 py-1 text-[11px] font-bold text-[hsl(var(--p-primary))]">
                <Clock size={12} weight="fill" />
                {daysUntilNext === 0 ? "Hoje" : daysUntilNext === 1 ? "Amanhã" : `${daysUntilNext}d`}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--p-primary))]/8">
                <VideoCamera size={16} weight="fill" className="text-[hsl(var(--p-primary))]" />
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
                <VideoCamera size={16} weight="fill" className="mr-2" /> Entrar na Sala
              </Button>
            ) : (
              <Button
                variant="outline"
                className="mt-3 w-full rounded-full py-2.5 font-bold text-[13px] border-[hsl(var(--p-primary))]/20 text-[hsl(var(--p-primary))] hover:bg-[hsl(var(--p-primary))]/5"
                onClick={() => navigate("/dashboard/appointments?role=patient")}
              >
                Ver Detalhes <ArrowRight size={14} weight="bold" className="ml-2" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyAppointmentCard = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => (
  <Card className="relative overflow-hidden border-dashed border-border/30 bg-gradient-to-br from-[hsl(var(--p-primary))]/[0.03] to-transparent">
    <CardContent className="flex flex-col items-center py-10 text-center">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 h-24 w-24 rounded-full bg-[hsl(var(--p-primary))]/8 blur-2xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <PingoMascot variant="solitario" size={90} bounce animate={false} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        className="mt-4"
      >
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--p-primary))]/8 px-3 py-1 mb-3">
          <Stethoscope size={12} weight="fill" className="text-[hsl(var(--p-primary))]" />
          <span className="text-[10px] font-bold text-[hsl(var(--p-primary))] uppercase tracking-wider">Agenda livre</span>
        </div>
        <p className="font-[Manrope] text-[16px] font-bold text-foreground">Nenhuma consulta agendada</p>
        <p className="mt-1.5 text-[13px] text-muted-foreground max-w-[240px] mx-auto leading-relaxed">
          Encontre especialistas disponíveis e agende sua consulta em poucos toques.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Button
          className="mt-6 rounded-full bg-[#00347F] text-white px-8 py-3 h-auto text-[14px] font-bold shadow-[0_6px_20px_rgba(0,52,127,.25)] hover:shadow-[0_8px_28px_rgba(0,52,127,.35)] hover:scale-[1.02] active:scale-[0.97] transition-all duration-200"
          onClick={() => navigate("/dashboard/schedule?role=patient")}
        >
          <CalendarCheck size={16} weight="fill" className="mr-2" /> Agendar consulta
        </Button>
      </motion.div>
    </CardContent>
  </Card>
);

export default PatientDashboard;
