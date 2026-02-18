import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getPatientNav } from "@/components/patient/patientNav";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, CreditCard, FileText, Heart, Video, Clock, Zap, Upload, TrendingUp, Bell, CheckCircle2, AlertCircle, Star } from "lucide-react";
import { differenceInDays } from "date-fns";
import Sparkline from "@/components/ui/sparkline";

const statusLabel: Record<string, string> = {
  scheduled: "Agendada",
  completed: "Concluída",
  cancelled: "Cancelada",
  in_progress: "Em andamento",
  waiting: "Na espera",
  no_show: "Ausente",
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

  useEffect(() => { if (user) fetchData(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("patient-updates")
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "appointments",
        filter: `patient_id=eq.${user.id}`,
      }, () => { fetchData(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchData = async () => {
    const now = new Date().toISOString();
    const [upRes, completedRes, prescRes, docsRes, waitRes, subRes] = await Promise.all([
      supabase.from("appointments")
        .select("id, scheduled_at, status, doctor_id, duration_minutes, appointment_type")
        .eq("patient_id", user!.id).gte("scheduled_at", now)
        .in("status", ["scheduled", "waiting", "in_progress"])
        .order("scheduled_at", { ascending: true }).limit(5),
      supabase.from("appointments").select("id", { count: "exact", head: true })
        .eq("patient_id", user!.id).eq("status", "completed"),
      supabase.from("prescriptions").select("id", { count: "exact", head: true })
        .eq("patient_id", user!.id),
      supabase.from("patient_documents").select("id", { count: "exact", head: true })
        .eq("patient_id", user!.id),
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

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("home")}>
      <div className="max-w-3xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting()}, {profile?.first_name || "Paciente"}! 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Cuide da sua saúde com facilidade</p>
        </div>

        {/* Active waiting room alert */}
        {waitingAppt && (
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-success/5">
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
                <Button size="sm" className="bg-gradient-hero text-primary-foreground shrink-0" onClick={() => navigate(`/dashboard/consultation/${waitingAppt.id}`)}>
                  <Video className="w-4 h-4 mr-1" /> Entrar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active subscription banner */}
        {activeSub && (() => {
          const daysLeft = activeSub.expires_at ? differenceInDays(new Date(activeSub.expires_at), new Date()) : null;
          const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
          return (
            <div
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                isExpiringSoon
                  ? "border-warning/30 bg-warning/5 hover:bg-warning/10"
                  : "border-success/30 bg-success/5 hover:bg-success/10"
              }`}
              onClick={() => navigate("/dashboard/payment-history")}
            >
              {isExpiringSoon
                ? <AlertCircle className="w-5 h-5 text-warning shrink-0" />
                : <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isExpiringSoon ? "text-warning" : "text-success"}`}>
                  {isExpiringSoon ? `⚠️ Plano expira em ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}` : `✅ Plano ativo`}
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

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3 stagger-children">
          {[
            { label: "Agendar", sub: "Consulta", icon: Calendar, color: "bg-primary/10", iconColor: "text-primary", path: "/dashboard/schedule" },
            { label: "Urgência", sub: "Falar agora", icon: Zap, color: "bg-destructive/10", iconColor: "text-destructive", path: "/dashboard/schedule?urgency=true", urgent: true },
            { label: "Enviar", sub: "Exames", icon: Upload, color: "bg-secondary/10", iconColor: "text-secondary", path: "/dashboard/patient/documents" },
          ].map(item => (
            <Card
              key={item.label}
              className={`border-border hover:shadow-card transition-all duration-200 cursor-pointer hover:-translate-y-0.5 ${item.urgent ? "border-destructive/20 bg-destructive/3" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <CardContent className="pt-5 pb-4 text-center">
                <div className={`w-12 h-12 mx-auto rounded-xl ${item.color} flex items-center justify-center mb-2`}>
                  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats with sparklines */}
        <div className="grid grid-cols-3 gap-3">
          {loading ? (
            [1, 2, 3].map(i => (
              <Card key={i} className="border-border overflow-hidden">
                <CardContent className="pt-3 pb-0 px-3 space-y-1">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-7 w-10" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            [
              { value: stats.total, label: "Consultas", numColor: "text-primary", sparkColor: "hsl(var(--primary))", data: [1,2,1,3,2,4,stats.total] },
              { value: stats.prescriptions, label: "Receitas", numColor: "text-warning", sparkColor: "hsl(var(--warning))", data: [0,1,0,2,1,1,stats.prescriptions] },
              { value: stats.documents, label: "Documentos", numColor: "text-secondary", sparkColor: "hsl(var(--secondary))", data: [0,0,1,1,2,1,stats.documents] },
            ].map(s => (
              <Card key={s.label} className="border-border overflow-hidden">
                <CardContent className="pt-3 pb-0 px-3">
                  <p className="text-[11px] text-muted-foreground font-medium mb-0.5">{s.label}</p>
                  <p className={`text-2xl font-extrabold tracking-tight ${s.numColor}`}>{s.value}</p>
                </CardContent>
                <div className="-mb-[1px]">
                  <Sparkline data={s.data} color={s.sparkColor} height={40} />
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Next appointment countdown */}
        {!loading && upcoming.length > 0 && (() => {
          const next = upcoming[0];
          const daysUntil = differenceInDays(new Date(next.scheduled_at), new Date());
          const hoursUntil = Math.max(0, Math.round((new Date(next.scheduled_at).getTime() - Date.now()) / 3600000));
          const isToday = daysUntil === 0;
          return (
            <div className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${isToday ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"}`} onClick={() => navigate("/dashboard/appointments")}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isToday ? "bg-primary/20" : "bg-muted/60"}`}>
                <Bell className={`w-5 h-5 ${isToday ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {isToday ? `⏰ Consulta hoje em ${hoursUntil}h` : `📅 Próxima consulta em ${daysUntil} dia${daysUntil !== 1 ? "s" : ""}`}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {next.doctor_name} · {format(new Date(next.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              {isToday && (
                <Button size="sm" className="bg-gradient-hero text-primary-foreground text-xs h-7 shrink-0" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/consultation/${next.id}`); }}>
                  Entrar
                </Button>
              )}
            </div>
          );
        })()}

        {/* Upcoming appointments */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Próximos Agendamentos
              </CardTitle>
              <Button size="sm" variant="ghost" className="text-xs text-primary" onClick={() => navigate("/dashboard/appointments")}>
                Ver todos →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Calendar className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Nenhuma consulta agendada</p>
                <p className="text-xs text-muted-foreground mb-4">Agende uma consulta com um médico de sua escolha</p>
                <Button size="sm" className="bg-gradient-hero text-primary-foreground" onClick={() => navigate("/dashboard/schedule")}>
                  Agendar agora
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{a.doctor_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(a.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR })} · {a.duration_minutes || 30}min
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusColor[a.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                        {statusLabel[a.status] ?? a.status}
                      </span>
                      {a.status === "scheduled" && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => enterWaitingRoom(a.id)}>
                          <Clock className="w-3 h-3 mr-1" /> Entrar
                        </Button>
                      )}
                      {(a.status === "waiting" || a.status === "in_progress") && (
                        <Button size="sm" className="bg-gradient-hero text-primary-foreground text-xs h-7" onClick={() => navigate(`/dashboard/consultation/${a.id}`)}>
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

        {/* Quick links */}
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { label: "Minha Saúde", sub: "Receitas, atestados e histórico", icon: Heart, color: "bg-primary/10", iconColor: "text-primary", path: "/dashboard/patient/health" },
            { label: "Pagamentos", sub: "Plano e histórico financeiro", icon: CreditCard, color: "bg-secondary/10", iconColor: "text-secondary", path: "/dashboard/payment-history" },
          ].map(item => (
            <Card key={item.label} className="border-border hover:shadow-card transition-all duration-200 cursor-pointer hover:-translate-y-0.5" onClick={() => navigate(item.path)}>
              <CardContent className="pt-5 pb-4 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
