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
import { Calendar, FileText, Heart, Video, Clock, Zap, Upload, TrendingUp, Bell, CheckCircle2, AlertCircle, Star, BarChart2, Activity, RefreshCw, Gift, Share2, Copy } from "lucide-react";
import { differenceInDays } from "date-fns";
import BlobKPICard from "@/components/ui/blob-kpi-card";
import Sparkline from "@/components/ui/sparkline";
import PatientOnboarding, { ONBOARDING_KEY } from "@/components/patient/PatientOnboarding";

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
  const now = new Date();

  useEffect(() => { if (user) fetchData(); }, [user]);

  // Show onboarding for first-time users
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
      // Generate one if missing
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
      <div className="max-w-3xl space-y-5">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Início</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {greeting()}, {profile?.first_name || "Paciente"}! · {format(now, "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
          <Button size="sm" variant="outline" className="h-8 self-start sm:self-auto" onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""} mr-1.5`} /> Atualizar
          </Button>
        </div>

        {/* ── Active waiting room alert ── */}
        {waitingAppt && (
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5">
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
                <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-white shrink-0" onClick={() => navigate(`/dashboard/consultation/${waitingAppt.id}`)}>
                  <Video className="w-4 h-4 mr-1" /> Entrar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 border border-border/40 h-9">
            <TabsTrigger value="overview" className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <BarChart2 className="w-3.5 h-3.5" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="appointments" className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Calendar className="w-3.5 h-3.5" /> Consultas
            </TabsTrigger>
            <TabsTrigger value="health" className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Activity className="w-3.5 h-3.5" /> Saúde
            </TabsTrigger>
          </TabsList>

          {/* ══ Visão Geral ══ */}
          <TabsContent value="overview" className="mt-5 space-y-5">

            {/* BLOB KPI Cards — Paciente */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 py-2">
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
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
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
                  <Star className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                </div>
              );
            })()}

            {/* Next appointment countdown */}
            {!loading && nextAppt && (
              <div
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer ${daysUntilNext === 0 ? "border-primary/30 bg-primary/5" : "border-border/50 bg-muted/20"}`}
                onClick={() => navigate("/dashboard/appointments")}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${daysUntilNext === 0 ? "bg-primary/20" : "bg-muted/60"}`}>
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
                  <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-white text-xs h-8 shrink-0"
                    onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/consultation/${nextAppt.id}`); }}>
                    Entrar
                  </Button>
                )}
              </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: "Agendar", sub: "Consulta", icon: Calendar, color: "bg-primary/10", iconColor: "text-primary", path: "/dashboard/schedule" },
                { label: "Urgência", sub: "Falar agora", icon: Zap, color: "bg-destructive/10", iconColor: "text-destructive", path: "/dashboard/schedule?urgency=true" },
                { label: "Enviar", sub: "Exames", icon: Upload, color: "bg-secondary/10", iconColor: "text-secondary", path: "/dashboard/patient/documents" },
              ].map(item => (
                <Card
                  key={item.label}
                  className="border-border/50 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-[0.97]"
                  onClick={() => navigate(item.path)}
                >
                  <CardContent className="p-3 sm:p-4 flex flex-col items-start gap-1.5 sm:gap-2">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${item.color} flex items-center justify-center`}>
                      <item.icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${item.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{item.sub}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Return appointments (golden button) */}
            {returnAppts.length > 0 && (
              <Card className="border-amber-400/30 bg-gradient-to-r from-amber-50/80 to-yellow-50/80 dark:from-amber-900/20 dark:to-yellow-900/20">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Retorno Grátis Disponível</p>
                  </div>
                  {returnAppts.map(ra => (
                    <div key={ra.id} className="flex items-center justify-between p-2 rounded-lg bg-white/60 dark:bg-background/40">
                      <div className="text-xs">
                        <p className="font-medium text-foreground">{ra.doctor_name}</p>
                        <p className="text-muted-foreground">Válido até {format(new Date(ra.return_deadline), "dd/MM/yyyy")}</p>
                      </div>
                      <Button size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs h-7"
                        onClick={() => navigate(`/dashboard/schedule/${ra.doctor_id}?return=true&original=${ra.id}`)}>
                        ✨ Agendar Retorno
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Referral & Credits Section */}
            {referralCode && (
              <Card className="border-border/50">
                <CardContent className="p-4">
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
                    <div className="flex-1 text-xs bg-muted/50 border border-border/50 rounded-lg px-3 py-2 truncate font-mono">
                      {window.location.origin}/convite/{referralCode}
                    </div>
                    <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/convite/${referralCode}`);
                    }}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ══ Consultas ══ */}
          <TabsContent value="appointments" className="mt-5">
            <Card className="border-border/60">
              <CardHeader className="pb-3 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Próximos Agendamentos
                    {!loading && upcoming.length > 0 && (
                      <Badge variant="outline" className="ml-1 text-[10px] h-4 px-1.5">{upcoming.length}</Badge>
                    )}
                  </CardTitle>
                  <Button size="sm" variant="ghost" className="text-xs text-primary h-7" onClick={() => navigate("/dashboard/appointments")}>
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
                    <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-white" onClick={() => navigate("/dashboard/schedule")}>
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
                            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => enterWaitingRoom(a.id)}>
                              Entrar
                            </Button>
                          )}
                          {(a.status === "waiting" || a.status === "in_progress") && (
                            <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-white text-xs h-7" onClick={() => navigate(`/dashboard/consultation/${a.id}`)}>
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
          <TabsContent value="health" className="mt-5">
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "Minha Saúde", sub: "Receitas, atestados e histórico", icon: Heart, color: "bg-primary/10", iconColor: "text-primary", path: "/dashboard/patient/health" },
                { label: "Histórico", sub: "Prontuário completo", icon: FileText, color: "bg-warning/10", iconColor: "text-warning", path: "/dashboard/medical-records" },
                { label: "Planos", sub: "Assinatura e pagamentos", icon: TrendingUp, color: "bg-success/10", iconColor: "text-success", path: "/dashboard/plans" },
                { label: "Perfil", sub: "Dados pessoais e saúde", icon: Activity, color: "bg-secondary/10", iconColor: "text-secondary", path: "/dashboard/profile" },
              ].map(item => (
                <Card
                  key={item.label}
                  className="border-border/50 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                  onClick={() => navigate(item.path)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                    </div>
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
