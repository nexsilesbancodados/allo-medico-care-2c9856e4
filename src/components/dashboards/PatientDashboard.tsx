import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getPatientNav } from "@/components/patient/patientNav";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar, FileText, Heart, Video, Clock, Zap, Upload, TrendingUp,
  Bell, CheckCircle2, AlertCircle, Star, BarChart2, Activity, RefreshCw,
  Gift, Share2, Copy, ClipboardList, Stethoscope, Smile, ChevronRight
} from "lucide-react";
import { differenceInDays } from "date-fns";
import BlobKPICard from "@/components/ui/blob-kpi-card";
import PatientOnboarding, { ONBOARDING_KEY } from "@/components/patient/PatientOnboarding";
import MedicalHistoryExport from "@/components/patient/MedicalHistoryExport";

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

const PatientDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [waitingAppt, setWaitingAppt] = useState<any | null>(null);
  const [stats, setStats] = useState({ total: 0, prescriptions: 0, documents: 0 });
  const [activeSub, setActiveSub] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
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

    // Fetch referral code
    const { data: profileData } = await supabase.from("profiles").select("referral_code").eq("user_id", user!.id).single();
    if (profileData?.referral_code) {
      setReferralCode(profileData.referral_code);
    } else {
      const code = (profile?.first_name || "user").toLowerCase().slice(0, 4) + user!.id.slice(0, 6);
      await supabase.from("profiles").update({ referral_code: code }).eq("user_id", user!.id);
      setReferralCode(code);
    }

    // Fetch credits
    const { data: creditsData } = await supabase.from("user_credits").select("amount").eq("user_id", user!.id);
    if (creditsData) setCredits(creditsData.reduce((sum, c) => sum + Number(c.amount), 0));

    // Fetch completed appointments with return deadline
    const { data: returnData } = await supabase.from("appointments")
      .select("id, scheduled_at, doctor_id, return_deadline")
      .eq("patient_id", user!.id)
      .eq("status", "completed")
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

    // Fetch latest care plan
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

    // Fetch favorite doctors
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

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("home")} role="patient">
      {showOnboarding && <PatientOnboarding onComplete={() => setShowOnboarding(false)} />}
      <div className="max-w-4xl space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Início</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {greeting()}, {profile?.first_name || "Paciente"}! · {format(now, "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <MedicalHistoryExport />
            <Button size="sm" variant="outline" className="h-9 gap-1.5 rounded-xl border-border/60" onClick={() => fetchData(true)} disabled={refreshing}>
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Atualizar
            </Button>
          </div>
        </div>

        {/* ── Active waiting room alert ── */}
        {waitingAppt && (
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {waitingAppt.status === "in_progress" ? "🔴 Consulta em andamento" : "⏳ Você está na sala de espera"}
                    </p>
                    <p className="text-xs text-muted-foreground">{waitingAppt.doctor_name}</p>
                  </div>
                </div>
                <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-white shrink-0 rounded-xl" onClick={() => navigate(`/dashboard/consultation/${waitingAppt.id}`)}>
                  <Video className="w-4 h-4 mr-1" /> Entrar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 border border-border/40 h-10 rounded-xl p-1">
            <TabsTrigger value="overview" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4">
              <BarChart2 className="w-3.5 h-3.5" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="appointments" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4">
              <Calendar className="w-3.5 h-3.5" /> Consultas
            </TabsTrigger>
            <TabsTrigger value="health" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4">
              <Activity className="w-3.5 h-3.5" /> Saúde
            </TabsTrigger>
          </TabsList>

          {/* ══ Visão Geral ══ */}
          <TabsContent value="overview" className="mt-6 space-y-6">

            {/* BLOB KPI Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-5">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="aspect-square animate-pulse bg-muted/50 rounded-full" />)
              ) : (
                <>
                  <BlobKPICard variant={0} label="Consultas" value={stats.total} icon={<Calendar className="w-5 h-5" />} color="primary" delay={0} onClick={() => navigate("/dashboard/appointments")} />
                  <BlobKPICard variant={1} label="Receitas" value={stats.prescriptions} icon={<FileText className="w-5 h-5" />} color="warning" delay={0.08} onClick={() => navigate("/dashboard/patient/health")} />
                  <BlobKPICard variant={2} label="Documentos" value={stats.documents} icon={<Upload className="w-5 h-5" />} color="secondary" delay={0.16} onClick={() => navigate("/dashboard/patient/documents")} />
                </>
              )}
            </div>

            {/* Subscription banner */}
            {activeSub && (() => {
              const daysLeft = activeSub.expires_at ? differenceInDays(new Date(activeSub.expires_at), new Date()) : null;
              const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
              return (
                <div
                  className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${
                    isExpiringSoon ? "border-warning/30 bg-warning/5 hover:bg-warning/10" : "border-success/30 bg-success/5 hover:bg-success/10"
                  }`}
                  onClick={() => navigate("/dashboard/payment-history")}
                >
                  {isExpiringSoon
                    ? <AlertCircle className="w-5 h-5 text-warning shrink-0" />
                    : <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isExpiringSoon ? "text-warning" : "text-success"}`}>
                      {isExpiringSoon ? `⚠️ Plano expira em ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}` : "✅ Plano ativo"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {(activeSub.plans as any)?.name ?? "Assinatura"} ·{" "}
                      {activeSub.expires_at ? `Válido até ${format(new Date(activeSub.expires_at), "dd/MM/yyyy")}` : "Sem expiração"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                </div>
              );
            })()}

            {/* Next appointment countdown */}
            {!loading && nextAppt && (
              <div
                className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${daysUntilNext === 0 ? "border-primary/30 bg-primary/5" : "border-border/50 bg-muted/20"}`}
                onClick={() => navigate("/dashboard/appointments")}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${daysUntilNext === 0 ? "bg-primary/20" : "bg-muted/60"}`}>
                  <Bell className={`w-5 h-5 ${daysUntilNext === 0 ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {daysUntilNext === 0 ? `⏰ Consulta hoje em ${hoursUntilNext}h` : `📅 Próxima consulta em ${daysUntilNext} dia${daysUntilNext !== 1 ? "s" : ""}`}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {(nextAppt as any).doctor_name} · {format(new Date(nextAppt.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {daysUntilNext === 0 && (
                  <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-white text-xs h-8 shrink-0 rounded-xl"
                    onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/consultation/${nextAppt.id}`); }}>
                    Entrar
                  </Button>
                )}
              </div>
            )}

            {/* Quick actions — prominent cards matching reference */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Agendar", sub: "Consulta", icon: Calendar, color: "bg-primary/8 hover:bg-primary/12", iconBg: "bg-primary/15", iconColor: "text-primary", path: "/dashboard/schedule" },
                { label: "Urgência", sub: "Falar agora", icon: Zap, color: "bg-destructive/5 hover:bg-destructive/10", iconBg: "bg-destructive/15", iconColor: "text-destructive", path: "/dashboard/schedule?urgency=true" },
                { label: "Enviar", sub: "Exames", icon: Upload, color: "bg-secondary/8 hover:bg-secondary/12", iconBg: "bg-secondary/15", iconColor: "text-secondary", path: "/dashboard/patient/documents" },
              ].map(item => (
                <Card
                  key={item.label}
                  className={`border-border/40 ${item.color} transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 active:scale-[0.97] group`}
                  onClick={() => navigate(item.path)}
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col items-start gap-3">
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${item.iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-foreground">{item.label}</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground">{item.sub}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Return appointments */}
            {returnAppts.length > 0 && (
              <Card className="border-amber-400/30 bg-gradient-to-r from-amber-50/80 to-yellow-50/80 dark:from-amber-900/20 dark:to-yellow-900/20">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Retorno Grátis Disponível</p>
                  </div>
                  {returnAppts.map(ra => (
                    <div key={ra.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/60 dark:bg-background/40">
                      <div className="text-xs">
                        <p className="font-medium text-foreground">{ra.doctor_name}</p>
                        <p className="text-muted-foreground">Válido até {format(new Date(ra.return_deadline), "dd/MM/yyyy")}</p>
                      </div>
                      <Button size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs h-7 rounded-lg"
                        onClick={() => navigate(`/dashboard/schedule/${ra.doctor_id}?return=true&original=${ra.id}`)}>
                        ✨ Agendar Retorno
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Favorite doctors grid — matching reference image style */}
            {favDoctors.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Meus Médicos</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-primary h-7 rounded-lg" onClick={() => navigate("/dashboard/doctors")}>
                    Ver todos →
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {favDoctors.slice(0, 4).map(doc => (
                    <Card
                      key={doc.id}
                      className="border-border/40 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 overflow-hidden group"
                      onClick={() => navigate(`/dashboard/schedule/${doc.id}`)}
                    >
                      <CardContent className="p-0">
                        <div className="aspect-[3/4] bg-gradient-to-b from-muted/30 to-muted/60 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                            {doc.name.charAt(6) || "M"}
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-semibold text-foreground truncate">{doc.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {doc.specs.join(", ") || "Clínico Geral"}
                          </p>
                          {doc.rating > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span className="text-[10px] text-muted-foreground">{Number(doc.rating).toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Symptom diary card — matching reference */}
            <Card className="border-border/40 hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 overflow-hidden" onClick={() => navigate("/dashboard/patient/diary")}>
              <CardContent className="p-0 flex items-stretch">
                <div className="flex-1 p-5">
                  <h3 className="text-base font-bold text-foreground mb-1">Diário de Sintomas</h3>
                  <p className="text-sm text-muted-foreground">Registre como você está se sentindo hoje</p>
                  <Button size="sm" variant="outline" className="mt-3 h-8 text-xs rounded-xl gap-1.5">
                    <Smile className="w-3.5 h-3.5" /> Registrar
                  </Button>
                </div>
                <div className="w-24 sm:w-32 bg-gradient-to-br from-accent/10 to-secondary/10 flex items-center justify-center shrink-0">
                  <Smile className="w-10 h-10 text-accent-foreground/30" />
                </div>
              </CardContent>
            </Card>

            {/* Referral & Credits Section */}
            {referralCode && (
              <Card className="border-border/40">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">Indique e Ganhe</p>
                    </div>
                    {credits > 0 && (
                      <Badge variant="outline" className="text-xs text-success border-success/30 bg-success/10">
                        Saldo: R$ {credits.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Convide amigos e ganhe R$ 10 de crédito para cada cadastro realizado.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 text-xs bg-muted/50 border border-border/50 rounded-xl px-3 py-2.5 truncate font-mono">
                      {window.location.origin}/convite/{referralCode}
                    </div>
                    <Button size="sm" variant="outline" className="h-9 shrink-0 rounded-xl" onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/convite/${referralCode}`);
                    }}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Care Plan Card */}
            {carePlan && (
              <Card className="border-secondary/30 bg-gradient-to-r from-secondary/5 to-primary/5">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="w-4 h-4 text-secondary" />
                    <p className="text-sm font-semibold text-foreground">Plano de Cuidado</p>
                    <Badge variant="outline" className="text-[10px] ml-auto border-secondary/30 text-secondary">
                      {format(new Date(carePlan.date), "dd/MM/yyyy")}
                    </Badge>
                  </div>
                  <div className="p-3 bg-card rounded-xl border border-border/50 mb-2">
                    <p className="text-sm text-foreground whitespace-pre-line">{carePlan.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Orientações de {carePlan.doctor}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ══ Consultas ══ */}
          <TabsContent value="appointments" className="mt-6">
            <Card className="border-border/40">
              <CardHeader className="pb-3 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Próximos Agendamentos
                    {!loading && upcoming.length > 0 && (
                      <Badge variant="outline" className="ml-1 text-[10px] h-4 px-1.5">{upcoming.length}</Badge>
                    )}
                  </CardTitle>
                  <Button size="sm" variant="ghost" className="text-xs text-primary h-7 rounded-lg" onClick={() => navigate("/dashboard/appointments")}>
                    Ver todos →
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/40">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-7 w-20 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : upcoming.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <Calendar className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">Nenhuma consulta agendada</p>
                    <p className="text-xs text-muted-foreground mb-4">Agende uma consulta com um médico de sua escolha</p>
                    <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl" onClick={() => navigate("/dashboard/schedule")}>
                      Agendar agora
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                            <p className="text-sm font-bold text-primary leading-none">{format(new Date(a.scheduled_at), "HH")}</p>
                            <p className="text-[9px] text-primary/60">{format(new Date(a.scheduled_at), "mm")}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{(a as any).doctor_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(a.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR })} · {a.duration_minutes || 30}min
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${statusColor[a.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                            {statusLabel[a.status] ?? a.status}
                          </span>
                          {a.status === "scheduled" && (
                            <Button size="sm" variant="outline" className="text-xs h-7 rounded-lg" onClick={() => enterWaitingRoom(a.id)}>
                              Entrar
                            </Button>
                          )}
                          {(a.status === "waiting" || a.status === "in_progress") && (
                            <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-white text-xs h-7 rounded-lg" onClick={() => navigate(`/dashboard/consultation/${a.id}`)}>
                              <Video className="w-3 h-3 mr-1" /> Sala
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ Saúde ══ */}
          <TabsContent value="health" className="mt-6">
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "Minha Saúde", sub: "Receitas, atestados e histórico", icon: Heart, color: "bg-primary/8", iconColor: "text-primary", path: "/dashboard/patient/health" },
                { label: "Timeline", sub: "Linha do tempo visual", icon: Activity, color: "bg-accent/8", iconColor: "text-accent-foreground", path: "/dashboard/timeline" },
                { label: "Histórico", sub: "Prontuário completo", icon: FileText, color: "bg-warning/8", iconColor: "text-warning", path: "/dashboard/medical-records" },
                { label: "Planos", sub: "Assinatura e pagamentos", icon: TrendingUp, color: "bg-success/8", iconColor: "text-success", path: "/dashboard/plans" },
                { label: "Perfil", sub: "Dados pessoais e saúde", icon: Activity, color: "bg-secondary/8", iconColor: "text-secondary", path: "/dashboard/profile" },
              ].map(item => (
                <Card
                  key={item.label}
                  className="border-border/40 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group"
                  onClick={() => navigate(item.path)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                      <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 ml-auto shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
