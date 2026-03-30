import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "./DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getPatientNav } from "@/components/patient/patientNav";
import { format, differenceInDays, differenceInHours, differenceInMinutes, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarCheck, VideoCamera, Clock, Gift, ArrowRight,
  Heart, Lightning, ClipboardText, FileText, UploadSimple,
  Sparkle, Stethoscope, MagnifyingGlass, Star, Plus, Warning,
  Pill, CaretRight, Heartbeat, Timer, TrendUp, TrendDown,
  FirstAidKit, ChatCircleDots, User,
} from "@phosphor-icons/react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import PatientOnboarding, { ONBOARDING_KEY, KYC_PENDING_KEY } from "@/components/patient/PatientOnboarding";
import { PingoMascot } from "@/components/mascot/PingoMascot";
import LazyAvatar from "@/components/ui/lazy-avatar";
import PatientWaitingCard from "@/components/patient/PatientWaitingCard";
import SectionErrorBoundary from "@/components/ui/section-error-boundary";
import Sparkline from "@/components/ui/sparkline";
import {
  usePatientStats, usePatientUpcoming, useReturnAppointments, useRecentHealthMetrics,
} from "@/hooks/usePatientDashboard";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";

/* ── Constants ── */

const HEALTH_TIPS = [
  { title: "Hidratação é chave!", body: "Beba pelo menos 2L de água por dia para manter corpo e mente funcionando bem.", metric: "2L", metricLabel: "Meta Diária", emoji: "💧" },
  { title: "Mexa-se hoje!", body: "30 min de caminhada reduzem ansiedade em até 40%.", metric: "30min", metricLabel: "Ideal/dia", emoji: "🏃" },
  { title: "Durma bem!", body: "7-8h de sono fortalecem a imunidade.", metric: "8h", metricLabel: "Ideal", emoji: "😴" },
  { title: "Frutas no prato!", body: "5 porções diárias fortalecem a imunidade.", metric: "5", metricLabel: "Porções", emoji: "🍎" },
  { title: "Respire fundo!", body: "Respiração profunda reduz o cortisol.", metric: "5min", metricLabel: "Diário", emoji: "🧘" },
  { title: "Sol na medida!", body: "15 min de sol ajudam na vitamina D.", metric: "15min", metricLabel: "Sol/dia", emoji: "☀️" },
  { title: "Monitore a pressão!", body: "Acompanhamento regular é prevenção.", metric: "12/8", metricLabel: "Ideal", emoji: "❤️" },
];

const QUICK_ACTIONS = [
  { label: "Agendar", icon: CalendarCheck, path: "/dashboard/schedule?role=patient", color: "hsl(var(--p-primary))", bg: "hsl(var(--p-primary) / 0.08)" },
  { label: "Urgência", icon: Lightning, path: "/dashboard/urgent-care?role=patient", color: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.08)" },
  { label: "Exames", icon: ClipboardText, path: "/dashboard/patient/exam-results?role=patient", color: "hsl(var(--secondary))", bg: "hsl(var(--secondary) / 0.08)" },
  { label: "Receitas", icon: FileText, path: "/dashboard/history?role=patient", color: "hsl(var(--p-primary-mid))", bg: "hsl(var(--p-primary-mid) / 0.08)" },
  { label: "Docs", icon: UploadSimple, path: "/dashboard/patient/documents?role=patient", color: "hsl(var(--warning))", bg: "hsl(var(--warning) / 0.08)" },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

const getAvatarRingColor = (nextAppt: Record<string, unknown> | undefined) => {
  if (!nextAppt) return "ring-emerald-400";
  const mins = differenceInMinutes(new Date(nextAppt.scheduled_at as string), new Date());
  if (mins <= 60) return "ring-red-400 animate-pulse";
  if (mins <= 180) return "ring-amber-400";
  return "ring-emerald-400";
};

const getContextualSubtitle = (upcoming: unknown[], stats: { total: number } | null | undefined) => {
  const today = upcoming.filter((a: any) => {
    const d = new Date(a.scheduled_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  if (today.length > 0) return `Você tem ${today.length} consulta${today.length > 1 ? "s" : ""} hoje`;
  if ((upcoming?.length ?? 0) > 0) return "Você tem consultas agendadas";
  if ((stats?.total ?? 0) > 0) return "Tudo em dia por aqui ✓";
  return "Cuide da sua saúde com quem entende";
};

/* ── Main Component ── */

const PatientDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const forceOnboarding = searchParams.get("onboarding") === "true";
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
  const minutesUntilNext = nextAppt ? differenceInMinutes(new Date(nextAppt.scheduled_at), new Date()) : null;

  const todayTip = HEALTH_TIPS[new Date().getDay() % HEALTH_TIPS.length];
  const firstName = profile?.first_name || "Paciente";
  const typedMetrics = healthMetrics as { type: string; value: number; unit: string }[];

  // Pull-to-refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["patient-upcoming-enriched"] });
    await queryClient.invalidateQueries({ queryKey: ["patient-dashboard-stats"] });
    await queryClient.invalidateQueries({ queryKey: ["patient-return-appts"] });
    await queryClient.invalidateQueries({ queryKey: ["patient-recent-metrics"] });
    setTimeout(() => setIsRefreshing(false), 600);
  }, [queryClient]);

  // Pull-to-refresh touch handlers
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 0) pullStartY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (pullStartY.current === 0) return;
      const delta = e.touches[0].clientY - pullStartY.current;
      if (delta > 60 && el.scrollTop <= 0) setIsPulling(true);
    };
    const onTouchEnd = () => {
      if (isPulling) {
        handleRefresh();
        setIsPulling(false);
      }
      pullStartY.current = 0;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [isPulling, handleRefresh]);

  useEffect(() => {
    if (loading) return;
    if (forceOnboarding) {
      setShowOnboarding(true);
      return;
    }
    // Force onboarding if profile is incomplete (missing mandatory fields)
    const profileIncomplete = !profile?.cpf || !profile?.phone || !profile?.date_of_birth;
    if (profileIncomplete || (!onboardingDone && (stats?.total ?? 0) === 0)) {
      setShowOnboarding(true);
    }
  }, [loading, stats?.total, onboardingDone, forceOnboarding, profile]);

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
        <div className="space-y-6 pb-24 md:pb-8">
          <div className="-mx-4 -mt-5 md:-mx-6 md:-mt-5 lg:-mx-8 lg:-mt-6">
            <Skeleton className="h-56 rounded-b-[2rem] md:rounded-[2rem]" />
          </div>
          <div className="grid grid-cols-5 gap-3 px-2">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center gap-2.5">
                <Skeleton className="w-14 h-14 rounded-2xl" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("home")} role="patient">
      {showOnboarding && <PatientOnboarding onComplete={() => setShowOnboarding(false)} />}

      <div ref={scrollRef} className="space-y-5 pb-24 md:pb-8">

        {/* Pull-to-refresh indicator */}
        <AnimatePresence>
          {(isPulling || isRefreshing) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 40 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-center"
            >
              <RefreshCw className={cn("w-5 h-5 text-muted-foreground", isRefreshing && "animate-spin")} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* KYC Pending Warning */}
        {localStorage.getItem(KYC_PENDING_KEY) === "true" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Verificação pendente</p>
              <p className="text-xs text-muted-foreground">Complete o KYC para agendar consultas e usar o app.</p>
            </div>
            <Button size="sm" variant="destructive" className="rounded-xl shrink-0" onClick={() => navigate("/dashboard/profile?role=patient&kyc=open")}>
              Verificar
            </Button>
          </motion.div>
        )}

        {/* ═══════════ HERO BANNER ═══════════ */}
        <section
          className="relative -mx-4 -mt-5 overflow-hidden rounded-b-[32px] bg-gradient-to-br from-[hsl(var(--p-primary))] via-[hsl(215_70%_24%)] to-[hsl(var(--p-primary-mid))] md:-mx-6 md:-mt-5 md:rounded-[2rem] lg:-mx-8 lg:-mt-6"
          style={{ boxShadow: "0 16px 56px rgba(0,29,74,.35), inset 0 1px 0 rgba(255,255,255,.12)" }}
        >
          {/* Decorative elements */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/[0.06] blur-[80px] hidden md:block" />
          <div className="pointer-events-none absolute -left-8 bottom-4 h-48 w-48 rounded-full bg-white/[0.04] blur-[60px] hidden md:block" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          {/* Subtle pattern overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />

          <div className="relative z-10 px-5 pt-8 pb-7 md:px-8 md:pt-12 md:pb-9">
            <div className="flex items-start gap-4">
              {/* Avatar with colored ring */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={cn(
                  "ring-[3px] ring-offset-2 ring-offset-transparent rounded-full",
                  getAvatarRingColor(nextAppt)
                )}>
                  <LazyAvatar
                    src={profile?.avatar_url}
                    name={firstName}
                    className="h-16 w-16 md:h-[72px] md:w-[72px] border-2 border-white/20 shadow-lg"
                    fallbackClassName="bg-white/15 text-white text-lg"
                  />
                </div>
              </motion.div>

              <div className="flex-1 min-w-0">
                <motion.h1
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="font-[Manrope] text-[26px] font-extrabold text-white leading-[1.1] tracking-tight md:text-[38px]"
                >
                  {getGreeting()}, {firstName}! 👋
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.45 }}
                  className="mt-2 text-[13px] font-medium text-white/70 leading-relaxed md:text-[15px]"
                >
                  {getContextualSubtitle(upcoming, stats)}
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="shrink-0 -mt-2 hidden sm:block"
              >
                <PingoMascot variant="wave" size={110} animate bounce className="drop-shadow-[0_12px_32px_rgba(0,0,0,0.35)] sm:!w-[130px] sm:!h-[130px]" />
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
                { icon: FileText, label: `${stats?.prescriptions ?? 0} receitas` },
                { icon: Heart, label: `${typedMetrics.length} métricas` },
              ].map((pill, i) => (
                <motion.span
                  key={pill.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.22 + i * 0.06 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.12] backdrop-blur-md border border-white/[0.1] px-3.5 py-1.5 text-[11px] font-bold text-white/80 shadow-[0_2px_8px_rgba(0,0,0,.12)]"
                >
                  <pill.icon size={12} weight="fill" className="opacity-70" /> {pill.label}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════ URGENT BANNER ═══════════ */}
        <AnimatePresence>
          {nextAppt && minutesUntilNext !== null && minutesUntilNext > 0 && minutesUntilNext <= 60 && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl bg-emerald-500 dark:bg-emerald-600 text-white p-4 flex items-center gap-3 shadow-lg"
            >
              <div className="animate-pulse w-3 h-3 rounded-full bg-white shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[14px]">Sua consulta começa em breve!</p>
                <p className="text-[12px] opacity-90">{nextAppt.doctor_name} · às {format(new Date(nextAppt.scheduled_at), "HH:mm")}</p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/dashboard/consultation/${nextAppt.id}`)}
                className="shrink-0 rounded-full bg-white text-emerald-700 font-bold text-[12px] hover:bg-white/90 shadow-sm"
              >
                Entrar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live consultation */}
        {waitingAppt && (
          <SectionErrorBoundary fallbackTitle="Erro na sala de espera">
            <PatientWaitingCard appointment={waitingAppt} />
          </SectionErrorBoundary>
        )}

        {/* ═══════════ QUICK ACTIONS ═══════════ */}
        <section className="grid grid-cols-5 gap-2 sm:gap-4">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04, type: "spring", stiffness: 320, damping: 26 }}
              whileTap={{ scale: 0.88 }}
              whileHover={{ y: -4, scale: 1.05 }}
              onClick={() => navigate(action.path)}
              className="group flex flex-col items-center gap-2.5 py-2 cursor-pointer"
            >
              <div
                className="relative flex h-[58px] w-[58px] items-center justify-center rounded-[20px] border border-border/8 shadow-[0_3px_14px_rgba(0,0,0,0.06)] transition-all duration-300 group-hover:shadow-lg group-hover:border-border/15"
                style={{ backgroundColor: action.bg }}
              >
                <action.icon size={25} weight="fill" style={{ color: action.color }} className="transition-transform duration-300 group-hover:scale-110" />
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: `inset 0 0 0 1px ${action.color}20` }} />
              </div>
              <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground leading-tight transition-colors duration-200">{action.label}</span>
            </motion.button>
          ))}
        </section>

        {/* ═══════════ BENTO STATS ═══════════ */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Consultas", value: stats?.total ?? 0, icon: CalendarCheck, color: "hsl(var(--p-primary))", bgToken: "hsl(var(--p-primary) / 0.07)" },
              { label: "Receitas", value: stats?.prescriptions ?? 0, icon: Pill, color: "hsl(var(--secondary))", bgToken: "hsl(var(--secondary) / 0.07)" },
              { label: "Documentos", value: stats?.documents ?? 0, icon: ClipboardText, color: "hsl(var(--warning))", bgToken: "hsl(var(--warning) / 0.07)" },
              { label: "Próx. retorno", value: returnAppts.length > 0 ? `${differenceInDays(new Date((returnAppts[0] as any).return_deadline), new Date())}d` : "—", icon: Timer, color: "hsl(var(--p-primary-mid))", bgToken: "hsl(var(--p-primary-mid) / 0.07)" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="kpi-card rounded-2xl border border-border/10 bg-card p-4 shadow-[var(--p-shadow-card)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: stat.bgToken }}
                  >
                    <stat.icon size={18} weight="fill" style={{ color: stat.color }} />
                  </div>
                  <TrendUp size={14} weight="bold" className="text-emerald-500 opacity-60" />
                </div>
                <p className="font-[Manrope] text-[24px] font-extrabold text-foreground leading-none">{stat.value}</p>
                <p className="text-[10.5px] font-semibold text-muted-foreground mt-1.5 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══════════ CONTENT GRID ═══════════ */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 lg:gap-8">

          {/* LEFT: Next Appointment */}
          <div className="space-y-5 lg:col-span-2 order-first">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(var(--p-primary) / 0.1)" }}>
                <CalendarCheck size={14} weight="fill" className="text-[hsl(var(--p-primary))]" />
              </div>
              <h2 className="font-[Manrope] text-[17px] font-bold text-foreground tracking-tight">Próxima Consulta</h2>
            </div>

            {nextAppt ? (
              <NextAppointmentCard appt={nextAppt} daysUntilNext={daysUntilNext} minutesUntil={minutesUntilNext} navigate={navigate} />
            ) : (
              <EmptyAppointmentCard navigate={navigate} />
            )}

            {returnAppts.length > 0 && (
              <ReturnAppointments items={returnAppts as ReturnAppt[]} navigate={navigate} />
            )}
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-3 space-y-5 order-last">

            {/* Health Tip — redesigned */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="card-interactive relative overflow-hidden rounded-2xl border border-[hsl(var(--p-primary))]/8 bg-card p-5 sm:p-6 shadow-[var(--p-shadow-card)]"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[hsl(var(--p-primary))]/5 blur-2xl" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[48px] leading-none">{todayTip.emoji}</span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--p-primary))]/50">Dica de Saúde</span>
                      <h3 className="font-[Manrope] text-[16px] font-bold text-foreground leading-snug">{todayTip.title}</h3>
                    </div>
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-muted-foreground">{todayTip.body}</p>
                </div>
                <div className="flex min-w-[100px] flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-[hsl(var(--p-primary))]/[0.08] to-[hsl(var(--p-primary))]/[0.03] border border-[hsl(var(--p-primary))]/10 p-5 shadow-sm">
                  <span className="text-[26px] font-extrabold text-[hsl(var(--p-primary))] font-[Manrope] leading-none">{todayTip.metric}</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground mt-2">{todayTip.metricLabel}</span>
                </div>
              </div>
            </motion.div>

            {/* Find your doctor */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="card-interactive relative overflow-hidden rounded-2xl border border-secondary/12 bg-gradient-to-r from-secondary/[0.06] to-secondary/[0.02] p-5"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-secondary/8 blur-2xl" />
              <div className="flex items-center gap-4">
                <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10">
                  <Stethoscope size={22} weight="fill" className="text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Sparkle size={12} weight="fill" className="text-secondary" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-secondary">Encontre seu médico</span>
                  </div>
                  <p className="text-[13.5px] font-bold text-foreground leading-snug">Busque por especialidade ou médico</p>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground leading-relaxed">Perfis, avaliações e horários disponíveis.</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate("/dashboard/schedule?role=patient")}
                  className="shrink-0 rounded-full bg-secondary text-secondary-foreground text-[12px] font-bold px-5 h-9 shadow-sm hover:bg-secondary/90 active:scale-95 transition-all"
                >
                  <MagnifyingGlass size={14} weight="bold" className="mr-1.5" /> Buscar
                </Button>
              </div>
            </motion.div>

            {/* Health Metrics with Sparklines */}
            {typedMetrics.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42 }}
                className="rounded-2xl border border-border/10 bg-card p-5 shadow-[var(--p-shadow-card)]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Heartbeat size={16} weight="fill" className="text-destructive" />
                    <span className="font-[Manrope] text-[14px] font-bold text-foreground">Métricas de Saúde</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/dashboard/patient/health?role=patient")}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground h-7 px-2"
                  >
                    Ver tudo <ArrowRight size={12} className="ml-1" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {typedMetrics.slice(0, 4).map((m, i) => (
                    <div key={i} className="kpi-card rounded-xl bg-muted/40 border border-border/5 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider capitalize">{m.type}</p>
                      </div>
                      <p className="text-[20px] font-extrabold font-[Manrope] text-foreground leading-none">{m.value}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{m.unit}</p>
                      <div className="mt-2 -mx-1">
                        <Sparkline data={[m.value * 0.9, m.value * 0.95, m.value * 1.02, m.value * 0.98, m.value]} height={32} color="hsl(var(--p-primary))" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recent History */}
            {upcoming.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl border border-border/10 bg-card p-5 shadow-[var(--p-shadow-card)]"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={15} weight="fill" className="text-[hsl(var(--p-primary))]" />
                  <span className="font-[Manrope] text-[14px] font-bold text-foreground">Próximas Consultas</span>
                </div>
                <div className="space-y-2">
                  {upcoming.slice(0, 3).map((appt: any, i: number) => (
                    <motion.div
                      key={appt.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 + i * 0.05 }}
                      onClick={() => navigate("/dashboard/appointments?role=patient")}
                      className="card-interactive flex items-center gap-3 p-3 rounded-xl border border-border/5 cursor-pointer"
                    >
                      <LazyAvatar name={appt.doctor_name} className="h-10 w-10" fallbackClassName="bg-[hsl(var(--p-primary))]/10 text-[hsl(var(--p-primary))] text-xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-foreground truncate">{appt.doctor_name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(appt.scheduled_at), "dd/MM · HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-bold shrink-0",
                        appt.status === "scheduled" && "border-[hsl(var(--p-primary))]/20 text-[hsl(var(--p-primary))] bg-[hsl(var(--p-primary))]/5",
                        appt.status === "waiting" && "border-warning/20 text-warning bg-warning/5",
                        appt.status === "in_progress" && "border-emerald-500/20 text-emerald-600 bg-emerald-500/5",
                      )}>
                        {appt.status === "scheduled" ? "Agendada" : appt.status === "waiting" ? "Aguardando" : "Em andamento"}
                      </Badge>
                      <CaretRight size={14} className="text-muted-foreground/50 shrink-0" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
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
  <div className="overflow-hidden rounded-2xl border border-warning/15 bg-warning/[0.04] p-4">
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-warning/12">
        <Gift size={14} weight="fill" className="text-warning" />
      </div>
      <p className="text-[11px] font-bold text-warning uppercase tracking-wide">Retorno Grátis</p>
    </div>
    {items.map(ra => {
      const daysR = differenceInDays(new Date(ra.return_deadline), new Date());
      return (
        <div key={ra.id} className="card-interactive mb-2 flex items-center justify-between rounded-xl border border-border/10 bg-card p-3 last:mb-0 shadow-sm">
          <div className="flex items-center gap-3">
            <LazyAvatar name={ra.doctor_name} className="h-9 w-9" fallbackClassName="bg-warning/10 text-warning text-xs" />
            <div className="text-xs">
              <p className="font-semibold text-foreground">{ra.doctor_name}</p>
              <p className="mt-0.5 text-muted-foreground">
                {daysR <= 3
                  ? <span className="font-semibold text-destructive">⚠️ {daysR}d restantes</span>
                  : `Até ${format(new Date(ra.return_deadline), "dd/MM")} (${daysR}d)`}
              </p>
            </div>
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
  appt, daysUntilNext, minutesUntil, navigate,
}: {
  appt: Record<string, unknown>;
  daysUntilNext: number | null;
  minutesUntil: number | null;
  navigate: ReturnType<typeof useNavigate>;
}) => {
  const scheduledAt = new Date(appt.scheduled_at as string);
  const isToday = daysUntilNext === 0;
  const isSoon = minutesUntil !== null && minutesUntil > 0 && minutesUntil <= 30;

  return (
    <Card className="relative overflow-hidden border-border/10 shadow-[var(--p-shadow-elevated)] bg-card">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[hsl(var(--p-primary))] to-[hsl(var(--p-primary-mid))]" />
      <CardContent className="p-0">
        <div className="flex">
          {/* Date column */}
          <div className="flex flex-col items-center justify-center px-4 py-5 bg-[hsl(var(--p-primary))] text-white min-w-[72px]">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{format(scheduledAt, "MMM", { locale: ptBR })}</span>
            <span className="font-[Manrope] text-[28px] font-extrabold leading-none mt-0.5">{format(scheduledAt, "dd")}</span>
            <span className="text-[11px] font-semibold mt-1 opacity-75">{format(scheduledAt, "HH:mm")}</span>
          </div>
          {/* Info */}
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--p-primary))]/8 px-2.5 py-1 text-[10.5px] font-bold text-[hsl(var(--p-primary))]">
                <Clock size={11} weight="fill" />
                {isToday
                  ? (minutesUntil !== null && minutesUntil > 0 ? `Em ${minutesUntil < 60 ? `${minutesUntil}min` : `${Math.floor(minutesUntil / 60)}h`}` : "Hoje")
                  : daysUntilNext === 1 ? "Amanhã" : `Em ${daysUntilNext}d`}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(var(--p-primary))]/8">
                <VideoCamera size={15} weight="fill" className="text-[hsl(var(--p-primary))]" />
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-1">
              <LazyAvatar name={appt.doctor_name as string} className="h-9 w-9" fallbackClassName="bg-[hsl(var(--p-primary))]/10 text-[hsl(var(--p-primary))] text-xs" />
              <div>
                <h3 className="font-[Manrope] text-[14.5px] font-extrabold text-foreground leading-tight">
                  {appt.doctor_name as string}
                </h3>
                <p className="text-[11.5px] text-muted-foreground">
                  {(appt.specialty as string) ?? "Consulta Geral"} · {(appt.duration_minutes as number) || 30}min
                </p>
              </div>
            </div>

            {isToday ? (
              <Button
                className={cn(
                  "mt-3 w-full rounded-full bg-emerald-500 text-white py-2.5 font-bold text-[13px] shadow-lg hover:bg-emerald-600 active:scale-[0.97] transition-all",
                  isSoon && "animate-pulse"
                )}
                onClick={() => navigate(`/dashboard/consultation/${appt.id}`)}
              >
                <VideoCamera size={15} weight="fill" className="mr-1.5" /> Entrar na Consulta
              </Button>
            ) : (
              <Button
                variant="outline"
                className="mt-3 w-full rounded-full py-2.5 font-bold text-[12.5px] border-[hsl(var(--p-primary))]/15 text-[hsl(var(--p-primary))] hover:bg-[hsl(var(--p-primary))]/5"
                onClick={() => navigate("/dashboard/appointments?role=patient")}
              >
                Ver Detalhes <ArrowRight size={13} weight="bold" className="ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyAppointmentCard = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => (
  <Card className="relative overflow-hidden border-dashed border-border/20 bg-card">
    <CardContent className="flex flex-col items-center py-10 text-center">
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-28 w-28 rounded-full bg-[hsl(var(--p-primary))]/6 blur-2xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <PingoMascot variant="wave" size={85} bounce animate />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        className="mt-4"
      >
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--p-primary))]/8 px-3 py-1 mb-3">
          <Stethoscope size={11} weight="fill" className="text-[hsl(var(--p-primary))]" />
          <span className="text-[10px] font-bold text-[hsl(var(--p-primary))] uppercase tracking-wider">Agenda livre</span>
        </div>
        <p className="font-[Manrope] text-[16px] font-bold text-foreground">Tudo tranquilo por aqui! 🎉</p>
        <p className="mt-1.5 text-[12.5px] text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
          Que tal agendar uma consulta? Encontre especialistas e agende em poucos toques.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Button
          className="mt-5 rounded-full bg-[hsl(var(--p-primary))] text-white px-8 py-3 h-auto text-[14px] font-bold shadow-[0_4px_16px_rgba(0,52,127,.2)] hover:shadow-[0_6px_24px_rgba(0,52,127,.3)] hover:scale-[1.02] active:scale-[0.97] transition-all duration-200"
          onClick={() => navigate("/dashboard/schedule?role=patient")}
        >
          <Plus size={16} weight="bold" className="mr-2" /> Agendar agora
        </Button>
      </motion.div>
    </CardContent>
  </Card>
);

export default PatientDashboard;
