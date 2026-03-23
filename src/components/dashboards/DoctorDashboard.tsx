import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Calendar, FileText, Users, DollarSign, Clock, Video, ChevronRight, TrendingUp, CheckCircle2, BarChart2, Activity, Pill, ExternalLink, ArrowRight, Sparkles, Star, ShieldCheck, Target, Bell, MoreVertical, Download, Filter, Stethoscope } from "lucide-react";
import DoctorAnalyticsCharts from "./DoctorAnalyticsCharts";
import DoctorOnboarding from "@/components/doctor/DoctorOnboarding";
import SectionErrorBoundary from "@/components/ui/section-error-boundary";
import { useDoctorStats } from "@/hooks/useDoctorDashboard";
import { useQueryClient } from "@tanstack/react-query";
import { PremiumHero } from "./PremiumHero";
import { BentoStatCards } from "./BentoStatCards";
import { PremiumActionGrid } from "./PremiumActionGrid";
import { LiveQueue, QueueItem } from "./LiveQueue";
import { GoalProgressCard } from "./GoalProgressCard";
import { DashboardShortcuts } from "./DashboardShortcuts";
import { PingoBanner, PingoEmpty } from "@/components/mascot/PingoMascot";
import { AlertBox } from "./AlertBox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusLabel: Record<string, string> = { scheduled: "Agendado", completed: "Concluída", cancelled: "Cancelada", in_progress: "Em andamento", waiting: "Em Espera" };
const statusColor: Record<string, string> = { scheduled: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400", waiting: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400", in_progress: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400", completed: "bg-muted text-muted-foreground", cancelled: "bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400" };

const DoctorDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const { data, isLoading: loading, isRefetching: refreshing } = useDoctorStats();

  interface DoctorAppointment { id: string; scheduled_at: string; status: string; patient_id: string; patient_name: string; duration_minutes: number | null; }

  const stats = data?.stats ?? { today: 0, total_patients: 0, prescriptions: 0, totalEarnings: 0 };
  const todayAppts = (data?.todayAppts ?? []) as DoctorAppointment[];
  const upcomingAppts = (data?.upcomingAppts ?? []) as DoctorAppointment[];

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("doctor-live-updates")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["doctor-dashboard-stats"] });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const waitingCount = todayAppts.filter(a => a.status === "waiting").length;
  const done = todayAppts.filter(a => a.status === "completed").length;
  const inProg = todayAppts.filter(a => a.status === "in_progress").length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const queueItems: QueueItem[] = todayAppts.slice(0, 5).map(a => ({
    id: a.id,
    initials: a.patient_name?.split(" ").map(n => n[0]).slice(0, 2).join("") ?? "?",
    name: a.patient_name,
    subtitle: a.status === "in_progress" ? `Em consulta · ${format(new Date(a.scheduled_at), "HH:mm")}` : a.status === "waiting" ? `Aguardando · ${format(new Date(a.scheduled_at), "HH:mm")}` : format(new Date(a.scheduled_at), "HH:mm"),
    status: a.status === "in_progress" ? "live" : a.status === "waiting" ? "waiting" : "scheduled",
    avatarBg: a.status === "in_progress" ? "bg-emerald-100 dark:bg-emerald-950/40" : a.status === "waiting" ? "bg-amber-100 dark:bg-amber-950/40" : "bg-blue-100 dark:bg-blue-950/40",
    avatarColor: a.status === "in_progress" ? "text-emerald-700 dark:text-emerald-300" : a.status === "waiting" ? "text-amber-700 dark:text-amber-300" : "text-blue-700 dark:text-blue-300",
    action: (a.status === "waiting" || a.status === "in_progress") ? (
      <Button size="sm" className="h-8 rounded-xl px-3 text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#0A6B47,#12A36E)", boxShadow: "0 3px 10px rgba(10,107,71,.3)" }}
        onClick={() => navigate(`/dashboard/consultation/${a.id}`)}>
        {a.status === "in_progress" ? "Entrar" : "Chamar"}
      </Button>
    ) : undefined,
    tag: a.status === "scheduled" ? "Agendado" : undefined,
    tagBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
  }));

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("home")} role="doctor">
      {!loading && !data?.crm && <DoctorOnboarding />}

      <div className="mx-auto w-full max-w-5xl space-y-5 pb-24">

        {/* ── Premium Hero ── */}
        <PremiumHero
          gradient="bg-gradient-to-br from-[#042A1C] via-[#0A6B47] to-[#12A36E]"
          orb1Color="radial-gradient(#12A36E, transparent)"
          orb2Color="radial-gradient(#3B7FE8, transparent)"
          tag={`${greeting()}, doutor · ${format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}`}
          tagIcon={<Stethoscope className="w-4 h-4" />}
          name={`Dr(a). ${profile?.first_name || "Médico"}`}
          subtitle={data?.crm ? `CRM ${data.crm}/${data.crmState}` : "Telemedicina"}
          badge={data?.crmVerified ? { label: "CRM Verificado · Ativo" } : undefined}
          liveDot={waitingCount > 0}
          liveCount={waitingCount}
          kpis={[
            { label: "Hoje", value: stats.today, icon: <Calendar className="w-4 h-4" /> },
            { label: "Na fila", value: waitingCount, icon: <Clock className="w-4 h-4" /> },
            { label: "Pacientes", value: stats.total_patients, icon: <Users className="w-4 h-4" /> },
            { label: "Ganhos", value: `R$${(stats.totalEarnings / 1000).toFixed(1)}k`, icon: <DollarSign className="w-4 h-4" /> },
          ]}
          loading={loading}
          topRight={waitingCount > 0 ? (
            <Button size="sm" variant="ghost" className="h-9 gap-1.5 rounded-xl border border-white/20 text-white/70 hover:bg-white/15 hover:text-white"
              onClick={() => navigate("/dashboard/doctor/waiting-room")}>
              <Bell className="h-4 w-4" />
              <span className="rounded-full bg-red-500 px-1.5 text-[9px] font-black text-white">{waitingCount}</span>
            </Button>
          ) : undefined}
        />

        {/* ── Goal Progress ── */}
        {todayAppts.length > 0 && (
          <GoalProgressCard done={done} total={todayAppts.length} inProgress={inProg} waiting={waitingCount} accentColor="bg-emerald-500" accentBg="bg-emerald-50 dark:bg-emerald-900/20" />
        )}

        {/* ── Bento Stats ── */}
        <BentoStatCards loading={loading} stats={[
          { label: "Consultas hoje", value: stats.today, icon: "🩺", iconBg: "bg-emerald-50 dark:bg-emerald-950/30", valueColor: "text-emerald-700 dark:text-emerald-400", trend: { value: 8 } },
          { label: "Em espera", value: waitingCount, icon: "⏳", iconBg: "bg-amber-50 dark:bg-amber-950/30", valueColor: "text-amber-600 dark:text-amber-400" },
          { label: "Total pacientes", value: stats.total_patients, icon: "👥", iconBg: "bg-blue-50 dark:bg-blue-950/30", valueColor: "text-[#1255C8] dark:text-blue-400", trend: { value: 15 } },
          { label: "Receitas", value: stats.prescriptions, icon: "💊", iconBg: "bg-violet-50 dark:bg-violet-950/30", valueColor: "text-violet-600 dark:text-violet-400" },
        ]} />

        {/* ── Quick Actions ── */}
        <PremiumActionGrid title="Ações do Médico" actions={[
          { label: "Sala", icon: "🎥", path: "/dashboard/doctor/waiting-room", gradient: "bg-gradient-to-br from-[#0A6B47] to-[#12A36E]", shadow: "0 6px 20px rgba(10,107,71,.35)", badge: waitingCount },
          { label: "Receitas", icon: "📋", path: "/dashboard/prescriptions", gradient: "bg-gradient-to-br from-[#1255C8] to-[#3B7FE8]", shadow: "0 6px 20px rgba(18,85,200,.3)" },
          { label: "Agenda", icon: "📅", path: "/dashboard/doctor/calendar", gradient: "bg-gradient-to-br from-[#5B21B6] to-[#7C3AED]", shadow: "0 6px 20px rgba(91,33,182,.3)" },
          { label: "Ganhos", icon: "💰", path: "/dashboard/earnings", gradient: "bg-gradient-to-br from-[#B05000] to-[#D97706]", shadow: "0 6px 20px rgba(176,80,0,.3)" },
          { label: "Analytics", icon: "📊", path: "/dashboard/doctor/analytics", gradient: "bg-gradient-to-br from-[#0F2B5E] to-[#1255C8]", shadow: "0 6px 20px rgba(15,43,94,.3)" },
        ]} />

        {/* ── Live Queue ── */}
        {queueItems.length > 0 && (
          <LiveQueue items={queueItems} title="Fila de pacientes" linkLabel={`${waitingCount} ao vivo`} onLinkClick={() => navigate("/dashboard/doctor/waiting-room")} />
        )}

        {todayAppts.length === 0 && !loading && (
          <PingoEmpty
            variant="wave"
            size={100}
            title="Agenda livre hoje"
            subtitle="Nenhuma consulta agendada. Configure seus horários disponíveis."
            ctaLabel="Configurar horários"
            onCta={() => navigate("/dashboard/availability")}
          />
        )}

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-11 rounded-xl border border-border/30 bg-muted/40 p-1">
            <TabsTrigger value="overview" className="rounded-lg text-[11.5px] gap-1.5 font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm"><BarChart2 className="w-3.5 h-3.5" /> Visão Geral</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg text-[11.5px] gap-1.5 font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm"><TrendingUp className="w-3.5 h-3.5" /> Análises</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-5 space-y-4">
            {upcomingAppts.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-border/25 bg-card" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/15">
                  <p className="text-[11.5px] font-bold text-foreground">Próximas Consultas</p>
                  <Button size="sm" variant="ghost" className="h-8 gap-1 text-[11px] font-semibold text-primary" onClick={() => navigate("/dashboard/doctor/consultations")}>Ver todas <ArrowRight className="w-3 h-3" /></Button>
                </div>
                {upcomingAppts.slice(0, 4).map(a => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0 border-border/15 hover:bg-muted/20 transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/40 text-[11px] font-bold text-foreground">{format(new Date(a.scheduled_at), "HH:mm")}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-semibold text-foreground">{a.patient_name}</p>
                      <p className="text-[10.5px] text-muted-foreground">{format(new Date(a.scheduled_at), "dd/MM · HH:mm", { locale: ptBR })} · {a.duration_minutes || 30}min</p>
                    </div>
                    <span className={`rounded-lg px-2 py-0.5 text-[9px] font-bold ${statusColor[a.status] ?? "bg-muted text-muted-foreground"}`}>{statusLabel[a.status] ?? a.status}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Pingo Memed Banner */}
            <PingoBanner
              variant="reading"
              mascotSize={84}
              bgClass="bg-blue-50 dark:bg-blue-950/30"
              accentColor="text-blue-600 dark:text-blue-400"
              label="Receitas Memed"
              title="Prescreva digitalmente com segurança"
              subtitle="Base nacional com +60.000 medicamentos integrada"
              ctaLabel="Acessar Memed"
              onCta={() => window.open('https://memed.com.br/login','_blank')}
            />
            {/* Memed detail card */}
            <div className="rounded-2xl border border-border/25 bg-card p-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30 text-[20px]">💊</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="text-[13px] font-bold text-foreground">Memed — Receita Digital</p><Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-0 text-[9px] font-bold">Integrado</Badge></div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Base nacional de medicamentos completa</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-9 rounded-xl text-[11px] gap-1.5" onClick={() => window.open("https://memed.com.br/login", "_blank")}><ExternalLink className="h-3.5 w-3.5" /> Portal</Button>
                  <Button size="sm" className="h-9 rounded-xl text-[11px] gap-1.5 bg-[#1255C8] text-white hover:bg-[#1255C8]/90" onClick={() => navigate("/dashboard/prescriptions")}><FileText className="h-3.5 w-3.5" /> Receitas</Button>
                </div>
              </div>
            </div>
            {/* Shortcuts */}
            <DashboardShortcuts title="Ferramentas" shortcuts={[
              { label: "Meus Pacientes", description: "Histórico e prontuários", icon: <Users className="w-[17px] h-[17px]" />, path: "/dashboard/patients", iconBg: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400" },
              { label: "Calendário", description: "Agenda e disponibilidade", icon: <Calendar className="w-[17px] h-[17px]" />, path: "/dashboard/doctor/calendar", iconBg: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400" },
              { label: "Meus Ganhos", description: "Faturamento e extrato", icon: <DollarSign className="w-[17px] h-[17px]" />, path: "/dashboard/earnings", iconBg: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
            ]} />
          </TabsContent>
          <TabsContent value="analytics" className="mt-5">
            <DoctorAnalyticsCharts />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
