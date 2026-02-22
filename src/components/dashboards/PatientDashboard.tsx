import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
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
  Pill, User, CreditCard, ArrowRight, Sparkles
} from "lucide-react";
import PatientOnboarding, { ONBOARDING_KEY } from "@/components/patient/PatientOnboarding";
import MedicalHistoryExport from "@/components/patient/MedicalHistoryExport";
import CreditsWidget from "@/components/patient/CreditsWidget";
import UpsellBanner from "@/components/patient/UpsellBanner";
import PatientWaitingCard from "@/components/patient/PatientWaitingCard";
import SectionErrorBoundary from "@/components/ui/section-error-boundary";
import CheckoutRecoveryBanner from "@/components/patient/CheckoutRecoveryBanner";
import { usePatientStats, usePatientUpcoming, useReturnAppointments, useFavoriteDoctors } from "@/hooks/usePatientDashboard";
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
        {/* Header greeting — enhanced */}
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {greeting()}, {profile?.first_name || "Paciente"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">{greetingSubtext()}</p>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Quick Actions — refined pill style */}
        <motion.div variants={fadeUp} className="grid grid-cols-4 gap-3">
          {quickActions.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-card border border-border/50 hover:border-border hover:shadow-lg hover:shadow-primary/5 active:scale-[0.97] transition-all duration-200 group"
            >
              <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-foreground">{item.label}</span>
            </button>
          ))}
        </motion.div>

        {/* KPI Stats — inline cards instead of blobs */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse bg-muted/50 rounded-2xl" />)
          ) : (
            <>
              <button onClick={() => navigate("/dashboard/appointments")} className="p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all text-left group">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Consultas</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.total ?? 0}</p>
              </button>
              <button onClick={() => navigate("/dashboard/patient/health")} className="p-4 rounded-2xl bg-card border border-border/50 hover:border-warning/30 hover:shadow-md transition-all text-left group">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-warning" />
                  <span className="text-xs font-medium text-muted-foreground">Receitas</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.prescriptions ?? 0}</p>
              </button>
              <button onClick={() => navigate("/dashboard/patient/documents")} className="p-4 rounded-2xl bg-card border border-border/50 hover:border-secondary/30 hover:shadow-md transition-all text-left group">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="w-4 h-4 text-secondary" />
                  <span className="text-xs font-medium text-muted-foreground">Documentos</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.documents ?? 0}</p>
              </button>
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
            <Card className="border-dashed border-border/60">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <p className="text-base font-semibold text-foreground mb-1">Sem consultas agendadas</p>
                <p className="text-sm text-muted-foreground mb-5">Agende agora com um de nossos especialistas</p>
                <Button className="bg-primary text-primary-foreground rounded-xl h-11 px-8 text-sm" onClick={() => navigate("/dashboard/schedule")}>
                  <Calendar className="w-4 h-4 mr-2" /> Agendar consulta
                </Button>
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
            <Card className="border-border/40 overflow-hidden bg-gradient-to-r from-primary/3 to-secondary/3">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Indique e Ganhe</p>
                  </div>
                  {credits > 0 && (
                    <Badge variant="outline" className="text-xs text-success border-success/30 bg-success/10">
                      R$ {credits.toFixed(2)}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Convide amigos e ganhe R$ 10 de crédito por cadastro.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-xs bg-muted/50 border border-border/40 rounded-xl px-3 py-2.5 truncate font-mono">
                    {window.location.origin}/convite/{referralCode}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-10 w-10 shrink-0 rounded-xl"
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/convite/${referralCode}`)}
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
