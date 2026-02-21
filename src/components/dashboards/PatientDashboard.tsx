import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Pill, User, CreditCard
} from "lucide-react";
import BlobKPICard from "@/components/ui/blob-kpi-card";
import PatientOnboarding, { ONBOARDING_KEY } from "@/components/patient/PatientOnboarding";
import MedicalHistoryExport from "@/components/patient/MedicalHistoryExport";
import CreditsWidget from "@/components/patient/CreditsWidget";
import UpsellBanner from "@/components/patient/UpsellBanner";
import PatientWaitingCard from "@/components/patient/PatientWaitingCard";
import SectionErrorBoundary from "@/components/ui/section-error-boundary";
import CheckoutRecoveryBanner from "@/components/patient/CheckoutRecoveryBanner";

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

/* ── Stagger animation helpers ── */
const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } } };

const PatientDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [waitingAppt, setWaitingAppt] = useState<any | null>(null);
  const [stats, setStats] = useState({ total: 0, prescriptions: 0, documents: 0 });
  const [activeSub, setActiveSub] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [returnAppts, setReturnAppts] = useState<any[]>([]);
  const [carePlan, setCarePlan] = useState<any | null>(null);
  const [favDoctors, setFavDoctors] = useState<any[]>([]);
  const now = new Date();

  useEffect(() => { if (user) fetchData(); }, [user]);

  useEffect(() => {
    if (!loading && stats.total === 0 && !localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
  }, [loading, stats.total]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("patient-updates")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments", filter: `patient_id=eq.${user.id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    const nowIso = new Date().toISOString();
    const [upRes, completedRes, prescRes, docsRes, waitRes, subRes] = await Promise.all([
      supabase.from("appointments")
        .select("id, scheduled_at, status, doctor_id, duration_minutes, appointment_type")
        .eq("patient_id", user!.id).gte("scheduled_at", nowIso)
        .in("status", ["scheduled", "waiting", "in_progress"])
        .order("scheduled_at", { ascending: true }).limit(5),
      supabase.from("appointments").select("id", { count: "exact", head: true })
        .eq("patient_id", user!.id).eq("status", "completed"),
      supabase.from("prescriptions").select("id", { count: "exact", head: true }).eq("patient_id", user!.id),
      supabase.from("patient_documents").select("id", { count: "exact", head: true }).eq("patient_id", user!.id),
      supabase.from("appointments")
        .select("id, scheduled_at, status, doctor_id")
        .eq("patient_id", user!.id).in("status", ["waiting", "in_progress"])
        .limit(1).single(),
      supabase.from("subscriptions")
        .select("*, plans(name, price)")
        .eq("user_id", user!.id).eq("status", "active")
        .order("created_at", { ascending: false }).limit(1).single(),
    ]);

    setStats({ total: completedRes.count ?? 0, prescriptions: prescRes.count ?? 0, documents: docsRes.count ?? 0 });
    if (subRes.data) setActiveSub(subRes.data);

    const allAppts = upRes.data ?? [];
    if (allAppts.length > 0) {
      const doctorIds = [...new Set(allAppts.map(a => a.doctor_id))];
      const { data: docs } = await supabase.from("doctor_profiles").select("id, user_id").in("id", doctorIds);
      if (docs && docs.length > 0) {
        const userIds = docs.map(d => d.user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);
        const docMap = new Map<string, string>();
        docs.forEach(d => {
          const p = profiles?.find(pr => pr.user_id === d.user_id);
          if (p) docMap.set(d.id, `Dr(a). ${p.first_name} ${p.last_name}`);
        });
        setUpcoming(allAppts.map(a => ({ ...a, doctor_name: docMap.get(a.doctor_id) ?? "Médico" })));
      } else {
        setUpcoming(allAppts.map(a => ({ ...a, doctor_name: "Médico" })));
      }
    } else {
      setUpcoming([]);
    }

    if (waitRes.data) {
      const { data: doc } = await supabase.from("doctor_profiles").select("id, user_id").eq("id", waitRes.data.doctor_id).single();
      if (doc) {
        const { data: p } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", doc.user_id).single();
        setWaitingAppt({ ...waitRes.data, doctor_name: p ? `Dr(a). ${p.first_name} ${p.last_name}` : "Médico" });
      }
    } else {
      setWaitingAppt(null);
    }
    setLoading(false);
    setRefreshing(false);

    const { data: profileData } = await supabase.from("profiles").select("referral_code").eq("user_id", user!.id).single();
    if (profileData?.referral_code) {
      setReferralCode(profileData.referral_code);
    } else {
      const code = (profile?.first_name || "user").toLowerCase().slice(0, 4) + user!.id.slice(0, 6);
      await supabase.from("profiles").update({ referral_code: code }).eq("user_id", user!.id);
      setReferralCode(code);
    }

    const { data: creditsData } = await supabase.from("user_credits").select("amount").eq("user_id", user!.id);
    if (creditsData) setCredits(creditsData.reduce((sum, c) => sum + Number(c.amount), 0));

    const { data: returnData } = await supabase.from("appointments")
      .select("id, scheduled_at, doctor_id, return_deadline")
      .eq("patient_id", user!.id).eq("status", "completed")
      .not("return_deadline", "is", null)
      .gte("return_deadline", new Date().toISOString());
    if (returnData && returnData.length > 0) {
      const retDoctorIds = [...new Set(returnData.map(a => a.doctor_id))];
      const { data: retDocs } = await supabase.from("doctor_profiles").select("id, user_id").in("id", retDoctorIds);
      if (retDocs) {
        const retUserIds = retDocs.map(d => d.user_id);
        const { data: retProfiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", retUserIds);
        const retMap = new Map<string, string>();
        retDocs.forEach(d => {
          const p = retProfiles?.find(pr => pr.user_id === d.user_id);
          if (p) retMap.set(d.id, `Dr(a). ${p.first_name} ${p.last_name}`);
        });
        setReturnAppts(returnData.map(a => ({ ...a, doctor_name: retMap.get(a.doctor_id) ?? "Médico" })));
      }
    }

    const { data: latestCompleted } = await supabase.from("appointments")
      .select("id, scheduled_at, doctor_id")
      .eq("patient_id", user!.id).eq("status", "completed")
      .order("scheduled_at", { ascending: false }).limit(1).single();
    if (latestCompleted) {
      const { data: noteData } = await supabase.from("consultation_notes")
        .select("content, updated_at")
        .eq("appointment_id", latestCompleted.id).single();
      if (noteData && noteData.content) {
        const { data: doc } = await supabase.from("doctor_profiles").select("user_id").eq("id", latestCompleted.doctor_id).single();
        let docName = "Médico";
        if (doc) {
          const { data: p } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", doc.user_id).single();
          if (p) docName = `Dr(a). ${p.first_name} ${p.last_name}`;
        }
        setCarePlan({ content: noteData.content, doctor: docName, date: latestCompleted.scheduled_at });
      }
    }

    const { data: favData } = await supabase.from("favorite_doctors").select("doctor_id").eq("patient_id", user!.id);
    if (favData && favData.length > 0) {
      const favDocIds = favData.map(f => f.doctor_id);
      const { data: favDocs } = await supabase.from("doctor_profiles").select("id, user_id, consultation_price, rating").in("id", favDocIds);
      if (favDocs) {
        const favUserIds = favDocs.map(d => d.user_id);
        const { data: favProfiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", favUserIds);
        const { data: favSpecs } = await supabase.from("doctor_specialties").select("doctor_id, specialties(name)").in("doctor_id", favDocIds);
        setFavDoctors(favDocs.map(d => {
          const p = favProfiles?.find(pr => pr.user_id === d.user_id);
          const specs = favSpecs?.filter((s: any) => s.doctor_id === d.id).map((s: any) => s.specialties?.name).filter(Boolean) ?? [];
          return { ...d, name: p ? `Dr(a). ${p.first_name} ${p.last_name}` : "Médico", specs };
        }));
      }
    }
  };

  const enterWaitingRoom = async (appointmentId: string) => {
    await supabase.from("appointments").update({ status: "waiting" }).eq("id", appointmentId);
    navigate(`/dashboard/consultation/${appointmentId}`);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const nextAppt = upcoming[0];
  const daysUntilNext = nextAppt ? differenceInDays(new Date(nextAppt.scheduled_at), new Date()) : null;
  const hoursUntilNext = nextAppt ? Math.max(0, Math.round((new Date(nextAppt.scheduled_at).getTime() - Date.now()) / 3600000)) : null;

  /* ── Quick action items ── */
  const quickActions = [
    { label: "Agendar", icon: Calendar, gradient: "from-primary to-primary/70", path: "/dashboard/schedule" },
    { label: "Urgência", icon: Zap, gradient: "from-destructive to-destructive/70", path: "/dashboard/schedule?urgency=true" },
    { label: "Exames", icon: Upload, gradient: "from-secondary to-secondary/70", path: "/dashboard/patient/documents" },
    { label: "Diário", icon: Smile, gradient: "from-accent to-accent/70", path: "/dashboard/patient/diary" },
  ];

  /* ── Shortcuts ── */
  const shortcuts = [
    { label: "Prontuário", icon: ClipboardList, path: "/dashboard/medical-records" },
    { label: "Receitas", icon: Pill, path: "/dashboard/patient/health" },
    { label: "Pagamentos", icon: CreditCard, path: "/dashboard/payment-history" },
    { label: "Perfil", icon: User, path: "/dashboard/profile" },
  ];

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("home")} role="patient">
      {showOnboarding && <PatientOnboarding onComplete={() => setShowOnboarding(false)} />}

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto space-y-5"
      >
        {/* ── Header greeting ── */}
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
              {greeting()}, {profile?.first_name || "Paciente"} 👋
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <MedicalHistoryExport />
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-xl"
              onClick={() => fetchData(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </motion.div>

        {/* ── Live consultation / Waiting Room ── */}
        {waitingAppt && (
          <motion.div variants={fadeUp}>
            <SectionErrorBoundary fallbackTitle="Erro na sala de espera">
              <PatientWaitingCard appointment={waitingAppt} />
            </SectionErrorBoundary>
          </motion.div>
        )}

        {/* ── Checkout recovery banner ── */}
        <motion.div variants={fadeUp}>
          <SectionErrorBoundary fallbackTitle="Erro no banner">
            <CheckoutRecoveryBanner />
          </SectionErrorBoundary>
        </motion.div>

        {/* ── Upsell banner ── */}
        <motion.div variants={fadeUp}>
          <SectionErrorBoundary fallbackTitle="Erro no banner">
            <UpsellBanner />
          </SectionErrorBoundary>
        </motion.div>

        {/* ── Quick Actions — 4 large touch targets ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-4 gap-2.5">
          {quickActions.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/40 hover:shadow-md active:scale-95 transition-all duration-200 group"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-foreground leading-tight">{item.label}</span>
            </button>
          ))}
        </motion.div>

        {/* ── KPI Blobs ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="aspect-square animate-pulse bg-muted/50 rounded-full" />)
          ) : (
            <>
              <BlobKPICard variant={0} label="Consultas" value={stats.total} icon={<Calendar className="w-5 h-5" />} color="primary" delay={0} onClick={() => navigate("/dashboard/appointments")} />
              <BlobKPICard variant={1} label="Receitas" value={stats.prescriptions} icon={<FileText className="w-5 h-5" />} color="warning" delay={0.06} onClick={() => navigate("/dashboard/patient/health")} />
              <BlobKPICard variant={2} label="Documentos" value={stats.documents} icon={<Upload className="w-5 h-5" />} color="secondary" delay={0.12} onClick={() => navigate("/dashboard/patient/documents")} />
            </>
          )}
        </motion.div>

        {/* ── Next appointment card ── */}
        {!loading && nextAppt && (
          <motion.div variants={fadeUp}>
            <Card
              className={`overflow-hidden cursor-pointer active:scale-[0.98] transition-transform ${
                daysUntilNext === 0 ? "border-primary/40" : "border-border/40"
              }`}
              onClick={() => navigate("/dashboard/appointments")}
            >
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  {/* Date pill */}
                  <div className={`w-16 shrink-0 flex flex-col items-center justify-center gap-0.5 ${
                    daysUntilNext === 0 ? "bg-primary/10" : "bg-muted/40"
                  }`}>
                    <span className={`text-lg font-bold leading-none ${daysUntilNext === 0 ? "text-primary" : "text-foreground"}`}>
                      {format(new Date(nextAppt.scheduled_at), "dd")}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      {format(new Date(nextAppt.scheduled_at), "MMM", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex-1 p-3.5 flex items-center gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{(nextAppt as any).doctor_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(nextAppt.scheduled_at), "HH:mm", { locale: ptBR })} · {nextAppt.duration_minutes || 30}min
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        {daysUntilNext === 0
                          ? `⏰ Hoje em ${hoursUntilNext}h`
                          : `📅 Em ${daysUntilNext} dia${daysUntilNext !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                    {daysUntilNext === 0 && (
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground shrink-0 rounded-xl h-8 text-xs"
                        onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/consultation/${nextAppt.id}`); }}
                      >
                        <Video className="w-3.5 h-3.5 mr-1" /> Entrar
                      </Button>
                    )}
                    {daysUntilNext !== 0 && (
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

        {/* ── Subscription banner ── */}
        {activeSub && (() => {
          const daysLeft = activeSub.expires_at ? differenceInDays(new Date(activeSub.expires_at), new Date()) : null;
          const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
          return (
            <motion.div variants={fadeUp}>
              <div
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer active:scale-[0.98] transition-all ${
                  isExpiringSoon ? "border-warning/30 bg-warning/5" : "border-success/30 bg-success/5"
                }`}
                onClick={() => navigate("/dashboard/payment-history")}
              >
                {isExpiringSoon
                  ? <AlertCircle className="w-5 h-5 text-warning shrink-0" />
                  : <CheckCircle2 className="w-5 h-5 text-success shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${isExpiringSoon ? "text-warning" : "text-success"}`}>
                    {isExpiringSoon ? `Plano expira em ${daysLeft}d` : "Plano ativo"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {(activeSub.plans as any)?.name ?? "Assinatura"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              </div>
            </motion.div>
          );
        })()}

        {/* ── Return appointments ── */}
        {returnAppts.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card className="border-warning/30 bg-warning/5 overflow-hidden">
              <CardContent className="p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-warning" />
                  <p className="text-xs font-semibold text-warning">Retorno Grátis</p>
                </div>
                {returnAppts.map(ra => (
                  <div key={ra.id} className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/40">
                    <div className="text-xs min-w-0">
                      <p className="font-medium text-foreground truncate">{ra.doctor_name}</p>
                      <p className="text-muted-foreground">Até {format(new Date(ra.return_deadline), "dd/MM")}</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-warning text-warning-foreground text-[10px] h-7 rounded-lg shrink-0"
                      onClick={() => navigate(`/dashboard/schedule/${ra.doctor_id}?return=true&original=${ra.id}`)}
                    >
                      Agendar
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Shortcuts grid ── */}
        <motion.div variants={fadeUp}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 px-1">Acesso rápido</p>
          <div className="grid grid-cols-4 gap-2">
            {shortcuts.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-muted/30 border border-border/30 hover:bg-muted/60 active:scale-95 transition-all"
              >
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Upcoming appointments list ── */}
        {!loading && upcoming.length > 1 && (
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Próximas consultas</p>
              <Button variant="link" size="sm" className="text-xs text-primary h-auto p-0" onClick={() => navigate("/dashboard/appointments")}>
                Ver todas →
              </Button>
            </div>
            <div className="space-y-2">
              {upcoming.slice(1).map(a => (
                <Card key={a.id} className="border-border/40 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 p-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/8 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary leading-none">{format(new Date(a.scheduled_at), "dd")}</span>
                        <span className="text-[8px] text-primary/60 uppercase">{format(new Date(a.scheduled_at), "MMM", { locale: ptBR })}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{(a as any).doctor_name}</p>
                        <p className="text-[11px] text-muted-foreground">{format(new Date(a.scheduled_at), "HH:mm")} · {a.duration_minutes || 30}min</p>
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

        {/* ── No appointments CTA ── */}
        {!loading && upcoming.length === 0 && (
          <motion.div variants={fadeUp}>
            <Card className="border-dashed border-border/60">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
                  <Calendar className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">Sem consultas agendadas</p>
                <p className="text-xs text-muted-foreground mb-4">Agende agora com um de nossos especialistas</p>
                <Button
                  className="bg-primary text-primary-foreground rounded-xl h-10 px-6"
                  onClick={() => navigate("/dashboard/schedule")}
                >
                  <Calendar className="w-4 h-4 mr-2" /> Agendar consulta
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Favorite doctors ── */}
        {favDoctors.length > 0 && (
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <div className="flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Meus médicos</p>
              </div>
              <Button variant="link" size="sm" className="text-xs text-primary h-auto p-0" onClick={() => navigate("/dashboard/doctors")}>
                Ver todos →
              </Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
              {favDoctors.slice(0, 6).map(doc => (
                <Card
                  key={doc.id}
                  className="border-border/40 shrink-0 w-28 snap-start cursor-pointer active:scale-95 transition-transform overflow-hidden"
                  onClick={() => navigate(`/dashboard/schedule/${doc.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="h-20 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-base font-bold text-primary">
                        {doc.name.charAt(6) || "M"}
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="text-[11px] font-semibold text-foreground truncate">{doc.name}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{doc.specs[0] || "Clínico"}</p>
                      {doc.rating > 0 && (
                        <div className="flex items-center gap-0.5 mt-1">
                          <Star className="w-2.5 h-2.5 text-warning fill-warning" />
                          <span className="text-[9px] text-muted-foreground">{Number(doc.rating).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Care plan ── */}
        {carePlan && (
          <motion.div variants={fadeUp}>
            <Card className="border-secondary/30 bg-secondary/5">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="w-4 h-4 text-secondary" />
                  <p className="text-xs font-semibold text-foreground">Plano de Cuidado</p>
                  <Badge variant="outline" className="text-[9px] ml-auto border-secondary/30 text-secondary">
                    {format(new Date(carePlan.date), "dd/MM")}
                  </Badge>
                </div>
                <div className="p-2.5 bg-card rounded-xl border border-border/40 mb-2">
                  <p className="text-xs text-foreground whitespace-pre-line line-clamp-4">{carePlan.content}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">{carePlan.doctor}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Credits widget ── */}
        <motion.div variants={fadeUp}>
          <CreditsWidget />
        </motion.div>

        {/* ── Referral card ── */}
        {referralCode && (
          <motion.div variants={fadeUp}>
            <Card className="border-border/40 overflow-hidden">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-primary" />
                    <p className="text-xs font-semibold text-foreground">Indique e Ganhe</p>
                  </div>
                  {credits > 0 && (
                    <Badge variant="outline" className="text-[10px] text-success border-success/30 bg-success/10">
                      R$ {credits.toFixed(2)}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mb-2.5">
                  Convide amigos e ganhe R$ 10 de crédito por cadastro.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-[11px] bg-muted/40 border border-border/40 rounded-xl px-3 py-2 truncate font-mono">
                    {window.location.origin}/convite/{referralCode}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 shrink-0 rounded-xl"
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/convite/${referralCode}`)}
                  >
                    <Copy className="w-3.5 h-3.5" />
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
