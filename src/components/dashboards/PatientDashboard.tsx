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
  Calendar, Video, Clock, Flame, Gift, ChevronRight,
  Heart, Activity, Weight, Thermometer, Droplets, Wind,
  MessageCircle, CreditCard, Settings, Zap,
} from "lucide-react";
import PatientOnboarding, { ONBOARDING_KEY } from "@/components/patient/PatientOnboarding";
import PatientWaitingCard from "@/components/patient/PatientWaitingCard";
import SectionErrorBoundary from "@/components/ui/section-error-boundary";
import {
  usePatientStats, usePatientUpcoming, useReturnAppointments, useRecentHealthMetrics,
} from "@/hooks/usePatientDashboard";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@/hooks/use-local-storage";
import mascotWave from "@/assets/mascot-wave.png";

/* ── Metric display configs ── */
const METRIC_CONFIGS: Record<string, { icon: typeof Heart; label: string; unit: string; colorClass: string }> = {
  pressao_arterial:    { icon: Activity,     label: "Pressão Arterial", unit: "mmHg",  colorClass: "text-primary" },
  peso:                { icon: Weight,        label: "Peso",             unit: "kg",    colorClass: "text-primary" },
  glicemia:            { icon: Droplets,      label: "Glicemia",         unit: "mg/dL", colorClass: "text-amber-600" },
  frequencia_cardiaca: { icon: Heart,         label: "Batimentos",       unit: "bpm",   colorClass: "text-destructive" },
  temperatura:         { icon: Thermometer,   label: "Temperatura",      unit: "°C",    colorClass: "text-orange-500" },
  saturacao:           { icon: Wind,          label: "SpO₂",             unit: "%",     colorClass: "text-violet-600" },
};

const HEALTH_TIPS = [
  { title: "Mantenha-se hidratada hoje!", body: "Sua atividade física foi 15% maior ontem. O consumo de água é essencial para sua recuperação.", metric: "2.4L", metricLabel: "Meta Diária" },
  { title: "30 min de caminhada fazem diferença!", body: "Caminhar regularmente reduz a ansiedade em até 40% e melhora a saúde cardiovascular.", metric: "30min", metricLabel: "Ideal/dia" },
  { title: "Durma bem esta noite!", body: "Dormir 7-8h fortalece o sistema imunológico e melhora a concentração.", metric: "8h", metricLabel: "Ideal" },
  { title: "Frutas e vegetais no prato!", body: "5 porções de frutas e vegetais por dia fortalecem a imunidade.", metric: "5", metricLabel: "Porções/dia" },
  { title: "Respire fundo por 5 minutos!", body: "A respiração profunda reduz os níveis de cortisol e combate o estresse.", metric: "5min", metricLabel: "Diário" },
  { title: "Tome um pouco de sol!", body: "15 minutos de sol diário ajudam na produção de vitamina D.", metric: "15min", metricLabel: "Sol/dia" },
  { title: "Monitore sua pressão!", body: "Acompanhar a pressão arterial regularmente é essencial para prevenção.", metric: "12/8", metricLabel: "Ideal" },
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
  const firstName = profile?.first_name || "Paciente";

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("home")} role="patient">
      {showOnboarding && <PatientOnboarding onComplete={() => setShowOnboarding(false)} />}

      <div className="space-y-8 pb-24 md:pb-8">

        {/* ═══════════ HERO ═══════════ */}
        <section className="relative -mx-4 -mt-5 overflow-hidden rounded-b-[28px] bg-gradient-to-br from-[hsl(215,75%,25%)] to-[hsl(215,75%,40%)] md:-mx-6 md:-mt-5 md:rounded-[28px] lg:-mx-8 lg:-mt-6"
          style={{ boxShadow: "0 12px 48px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.15)" }}>
          {/* Decorative orbs */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/[0.06] blur-[60px]" />
          <div className="pointer-events-none absolute left-1/4 -bottom-10 h-48 w-48 rounded-full bg-white/[0.04] blur-[40px]" />

          <div className="relative z-10 flex items-end gap-4 px-6 pt-8 pb-8 md:px-8 md:pt-10 md:pb-10">
            {/* Left: greeting */}
            <div className="min-w-0 flex-1">
              <motion.h1
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="font-[Manrope] text-3xl font-extrabold text-white leading-tight md:text-4xl"
              >
                {greeting()}, {firstName}!
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mt-2 text-lg font-medium text-white/70 leading-relaxed"
              >
                Sua jornada de saúde está em boas mãos hoje.
              </motion.p>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <Button
                  onClick={() => navigate("/dashboard/patient/health?role=patient")}
                  className="mt-6 rounded-full bg-white px-6 py-3 font-bold text-[hsl(215,75%,25%)] shadow-xl hover:bg-white/90 active:scale-95 transition-transform"
                >
                  Ver check-up diário
                </Button>
              </motion.div>
            </div>

            {/* Right: mascot */}
            <motion.div className="shrink-0 -mb-2 hidden sm:block">
              <motion.img
                src={mascotWave} alt="Mascote Pinguim Médico" draggable={false}
                className="select-none object-contain w-[130px] h-[130px] md:w-[160px] md:h-[160px]"
                style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,.3))" }}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
              />
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
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Início",    icon: "🏠", bg: "bg-[hsl(210,40%,92%)]",  color: "text-primary",     path: "/dashboard?role=patient" },
            { label: "Agendar",   icon: "📅", bg: "bg-[hsl(30,100%,92%)]",  color: "text-[hsl(30,80%,35%)]", path: "/dashboard/schedule?role=patient" },
            { label: "Urgência",  icon: "🚨", bg: "bg-destructive",         color: "text-white",       path: "/dashboard/urgent-care?role=patient", urgent: true },
            { label: "Consultas", icon: "📋", bg: "bg-[hsl(215,60%,92%)]",  color: "text-primary",     path: "/dashboard/appointments?role=patient" },
          ].map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 240, damping: 22 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-start gap-4 rounded-2xl p-6 shadow-sm transition-shadow hover:shadow-md cursor-pointer group ${
                action.urgent
                  ? "bg-destructive/10 border border-destructive/20"
                  : "bg-card border border-border/20"
              }`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${action.bg} group-hover:scale-110 transition-transform text-2xl`}>
                {action.icon === "🚨" ? <Zap className="h-6 w-6 text-white" /> : action.icon}
              </div>
              <span className={`font-[Manrope] font-bold ${action.urgent ? "text-destructive" : "text-foreground"}`}>
                {action.label}
              </span>
            </motion.button>
          ))}
        </section>

        {/* ═══════════ TWO COLUMNS ═══════════ */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* LEFT: Health Metrics */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-[Manrope] text-xl font-bold text-foreground">Métricas de Saúde</h2>
              <Button variant="link" className="p-0 text-sm font-bold text-primary"
                onClick={() => navigate("/dashboard/patient/health?role=patient")}>
                Ver histórico
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Heart Rate Card */}
              <Card className="overflow-hidden border-border/15">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Batimentos</span>
                    <Heart className="h-5 w-5 text-destructive" fill="currentColor" />
                  </div>
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="font-[Manrope] text-4xl font-extrabold text-foreground">
                      {(healthMetrics as { type: string; value: number }[]).find(m => m.type === "frequencia_cardiaca")?.value ?? 72}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">bpm</span>
                  </div>
                  {/* Mini bar chart */}
                  <div className="flex h-12 w-full items-end gap-1 rounded-lg bg-muted/30 px-2 py-1">
                    {[40, 60, 55, 80, 70, 45].map((h, i) => (
                      <div key={i} className="w-full rounded-t-sm bg-destructive transition-all" style={{ height: `${h}%`, opacity: 0.5 + (i * 0.1) }} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Blood Pressure Card */}
              <Card className="overflow-hidden border-border/15">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Pressão Arterial</span>
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="font-[Manrope] text-4xl font-extrabold text-foreground">
                      {(healthMetrics as { type: string; value: number }[]).find(m => m.type === "pressao_arterial")?.value ?? "12/8"}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">mmHg</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-xs font-bold text-primary">Normal</span>
                  </div>
                </CardContent>
              </Card>

              {/* Extra metrics from healthMetrics */}
              {(healthMetrics as { type: string; value: number; unit: string }[])
                .filter(m => m.type !== "frequencia_cardiaca" && m.type !== "pressao_arterial")
                .slice(0, 2)
                .map(m => {
                  const cfg = METRIC_CONFIGS[m.type];
                  const Icon = cfg?.icon ?? Heart;
                  return (
                    <Card key={m.type} className="overflow-hidden border-border/15">
                      <CardContent className="p-6">
                        <div className="mb-4 flex items-start justify-between">
                          <span className="text-sm font-medium text-muted-foreground">{cfg?.label ?? m.type}</span>
                          <Icon className={`h-5 w-5 ${cfg?.colorClass ?? "text-muted-foreground"}`} />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-[Manrope] text-4xl font-extrabold text-foreground">{m.value}</span>
                          <span className="text-sm font-medium text-muted-foreground">{m.unit}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

              {/* Health Tip Glass Card */}
              <div className="sm:col-span-2 flex flex-col gap-6 rounded-2xl bg-gradient-to-r from-[hsl(210,40%,88%)] to-[hsl(215,60%,90%)] p-6 md:flex-row md:items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Dica de Saúde</p>
                  <h3 className="mt-1 font-[Manrope] text-lg font-bold text-foreground">{todayTip.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{todayTip.body}</p>
                </div>
                <div className="flex min-w-[120px] flex-col items-center justify-center rounded-2xl bg-white/40 p-4 backdrop-blur-md">
                  <span className="text-2xl font-bold text-primary">{todayTip.metric}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{todayTip.metricLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Next Appointment + Support */}
          <div className="space-y-6">
            <h2 className="font-[Manrope] text-xl font-bold text-foreground">Próxima Consulta</h2>

            {!loading && nextAppt ? (
              <Card className="relative overflow-hidden border-border/10 shadow-sm">
                <CardContent className="p-6">
                  <div className="absolute right-6 top-6">
                    <Video className="h-7 w-7 text-primary" />
                  </div>
                  <p className="mb-4 text-sm font-bold text-primary">
                    {daysUntilNext === 0
                      ? `Hoje, ${format(new Date(nextAppt.scheduled_at), "HH:mm")}`
                      : daysUntilNext === 1
                        ? `Amanhã, ${format(new Date(nextAppt.scheduled_at), "HH:mm")}`
                        : format(new Date(nextAppt.scheduled_at), "dd/MM, HH:mm", { locale: ptBR })}
                  </p>
                  <h3 className="font-[Manrope] text-xl font-extrabold text-foreground">
                    {(nextAppt as Record<string, unknown>).doctor_name as string}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {(nextAppt as Record<string, unknown>).specialty as string ?? "Consulta Geral"}
                  </p>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <Video className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Disponível via Telemedicina</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {nextAppt.duration_minutes || 30} minutos
                      </span>
                    </div>
                  </div>

                  {daysUntilNext === 0 ? (
                    <Button
                      className="mt-8 w-full rounded-full bg-gradient-to-br from-[hsl(215,75%,25%)] to-[hsl(215,75%,40%)] py-3 font-bold text-white shadow-lg"
                      onClick={() => navigate(`/dashboard/consultation/${nextAppt.id}`)}
                    >
                      <Video className="mr-2 h-4 w-4" /> Entrar na Sala
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      className="mt-8 w-full rounded-full py-3 font-bold"
                      onClick={() => navigate("/dashboard/appointments?role=patient")}
                    >
                      Ver Detalhes
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : !loading && (
              <Card className="border-dashed border-border/40">
                <CardContent className="flex flex-col items-center py-8 text-center">
                  <Calendar className="mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="font-[Manrope] text-sm font-bold text-foreground">Nenhuma consulta agendada</p>
                  <p className="mt-1 text-xs text-muted-foreground">Agende agora e cuide da sua saúde</p>
                  <Button
                    className="mt-5 rounded-full bg-gradient-to-br from-[hsl(215,75%,25%)] to-[hsl(215,75%,40%)] text-white shadow-lg"
                    onClick={() => navigate("/dashboard/schedule?role=patient")}
                  >
                    <Calendar className="mr-2 h-4 w-4" /> Agendar consulta
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Return appointments */}
            {returnAppts.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-amber-200/60 bg-amber-50/50 dark:border-amber-800/30 dark:bg-amber-950/10 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Gift className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Retorno Grátis Disponível</p>
                </div>
                {(returnAppts as { id: string; return_deadline: string; doctor_name: string; doctor_id: string }[]).map(ra => {
                  const daysR = differenceInDays(new Date(ra.return_deadline), new Date());
                  return (
                    <div key={ra.id} className="mb-2 flex items-center justify-between rounded-xl border border-border/20 bg-card p-3 last:mb-0">
                      <div className="text-xs">
                        <p className="font-semibold">{ra.doctor_name}</p>
                        <p className="mt-0.5 text-muted-foreground">
                          {daysR <= 3
                            ? <span className="font-semibold text-destructive">⚠️ {daysR}d restantes</span>
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

            {/* Quick Support Access */}
            <div className="rounded-2xl bg-muted/30 p-4 space-y-1">
              {[
                { icon: MessageCircle, label: "Chat com Suporte", path: "/dashboard/chat?role=patient" },
                { icon: CreditCard,    label: "Pagamentos",       path: "/dashboard/payment-history?role=patient" },
                { icon: Settings,      label: "Configurações",    path: "/dashboard/settings?role=patient" },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="flex w-full items-center justify-between rounded-xl p-3 transition-all hover:bg-card group"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
