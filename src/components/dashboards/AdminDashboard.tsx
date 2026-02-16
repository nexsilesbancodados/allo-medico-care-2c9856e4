import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminNav } from "@/components/admin/adminNav";
import { DollarSign, AlertTriangle, Users, TrendingUp, CreditCard, FileText, Activity, Clock, UserX, Video, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_revenue: 0, active_subs: 0, overdue_subs: 0, total_patients: 0,
    total_doctors: 0, monthly_appts: 0,
    live_now: 0, waiting_now: 0, no_show_rate: 0, cancel_rate: 0, avg_rating: 0,
  });
  const [recentSubs, setRecentSubs] = useState<any[]>([]);
  const [overdueSubs, setOverdueSubs] = useState<any[]>([]);
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [liveAppts, setLiveAppts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  // Realtime for live consultation monitoring
  useEffect(() => {
    const channel = supabase
      .channel("admin-live-monitor")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments" }, () => {
        fetchLiveStats();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchLiveStats = async () => {
    const [liveRes, waitRes, liveListRes] = await Promise.all([
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "waiting"),
      supabase.from("appointments")
        .select("id, scheduled_at, status, patient_id, doctor_id")
        .in("status", ["in_progress", "waiting"])
        .order("scheduled_at", { ascending: true })
        .limit(10),
    ]);

    setStats(prev => ({ ...prev, live_now: liveRes.count ?? 0, waiting_now: waitRes.count ?? 0 }));

    if (liveListRes.data && liveListRes.data.length > 0) {
      const patientIds = [...new Set(liveListRes.data.map(a => a.patient_id).filter(Boolean))];
      const doctorIds = [...new Set(liveListRes.data.map(a => a.doctor_id))];
      const [pRes, dRes] = await Promise.all([
        patientIds.length > 0 ? supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", patientIds) : { data: [] },
        supabase.from("doctor_profiles").select("id, user_id").in("id", doctorIds),
      ]);
      const pMap = new Map((pRes.data ?? []).map(p => [p.user_id, `${p.first_name} ${p.last_name}`]));
      const docUserIds = (dRes.data ?? []).map(d => d.user_id);
      const { data: docProfiles } = docUserIds.length > 0
        ? await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", docUserIds)
        : { data: [] };
      const docMap = new Map<string, string>();
      (dRes.data ?? []).forEach(d => {
        const p = docProfiles?.find(pr => pr.user_id === d.user_id);
        if (p) docMap.set(d.id, `Dr(a). ${p.first_name} ${p.last_name}`);
      });
      setLiveAppts(liveListRes.data.map(a => ({
        ...a,
        patient_name: pMap.get(a.patient_id!) ?? "—",
        doctor_name: docMap.get(a.doctor_id) ?? "—",
      })));
    } else {
      setLiveAppts([]);
    }
  };

  const fetchAll = async () => {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    const [patientsRes, doctorsRes, activeSubsRes, expiredSubsRes, monthApptsRes, pendingRes, allSubsRes, cancelledRes, noShowRes, totalMonthRes, ratingsRes] = await Promise.all([
      supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "patient"),
      supabase.from("doctor_profiles").select("id", { count: "exact", head: true }),
      supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("subscriptions").select("id, user_id, plan_id, expires_at, status")
        .in("status", ["expired", "cancelled"])
        .order("expires_at", { ascending: false }).limit(10),
      supabase.from("appointments").select("id", { count: "exact", head: true })
        .gte("scheduled_at", monthStart.toISOString()),
      supabase.from("doctor_profiles").select("id, user_id, crm, crm_state").eq("is_approved", false).limit(5),
      supabase.from("subscriptions").select("id, user_id, plan_id, status, starts_at, expires_at, created_at")
        .order("created_at", { ascending: false }).limit(10),
      // Cancellation metrics
      supabase.from("appointments").select("id", { count: "exact", head: true })
        .eq("status", "cancelled")
        .gte("scheduled_at", monthStart.toISOString()),
      supabase.from("appointments").select("id", { count: "exact", head: true })
        .eq("status", "no_show")
        .gte("scheduled_at", monthStart.toISOString()),
      supabase.from("appointments").select("id", { count: "exact", head: true })
        .gte("scheduled_at", monthStart.toISOString()),
      // Average doctor rating
      supabase.from("doctor_profiles").select("rating").gt("rating", 0),
    ]);

    // Rates
    const totalMonth = totalMonthRes.count ?? 0;
    const cancelRate = totalMonth > 0 ? ((cancelledRes.count ?? 0) / totalMonth) * 100 : 0;
    const noShowRate = totalMonth > 0 ? ((noShowRes.count ?? 0) / totalMonth) * 100 : 0;

    // Average rating
    const ratings = (ratingsRes.data ?? []).map(d => Number(d.rating)).filter(r => r > 0);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    // Revenue
    const activePlansRes = await supabase.from("subscriptions").select("plan_id").eq("status", "active");
    let totalRevenue = 0;
    if (activePlansRes.data && activePlansRes.data.length > 0) {
      const planIds = [...new Set(activePlansRes.data.map(s => s.plan_id))];
      const { data: plans } = await supabase.from("plans").select("id, price");
      const planPriceMap = new Map(plans?.map(p => [p.id, Number(p.price)]) ?? []);
      activePlansRes.data.forEach(s => { totalRevenue += planPriceMap.get(s.plan_id) ?? 0; });
    }

    setStats({
      total_revenue: totalRevenue,
      active_subs: activeSubsRes.count ?? 0,
      overdue_subs: expiredSubsRes.data?.length ?? 0,
      total_patients: patientsRes.count ?? 0,
      total_doctors: doctorsRes.count ?? 0,
      monthly_appts: monthApptsRes.count ?? 0,
      live_now: 0, waiting_now: 0,
      cancel_rate: cancelRate,
      no_show_rate: noShowRate,
      avg_rating: avgRating,
    });

    // Enrich subs
    const allSubs = [...(allSubsRes.data ?? []), ...(expiredSubsRes.data ?? [])];
    const userIds = [...new Set(allSubs.map(s => s.user_id))];
    const planIds = [...new Set(allSubs.map(s => s.plan_id))];
    const [profilesRes, plansRes2] = await Promise.all([
      userIds.length > 0 ? supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds) : { data: [] },
      planIds.length > 0 ? supabase.from("plans").select("id, name, price") : { data: [] },
    ]);
    const pMap = new Map((profilesRes.data ?? []).map((p: any) => [p.user_id, `${p.first_name} ${p.last_name}`] as const));
    const planMap = new Map((plansRes2.data ?? []).map((p: any) => [p.id, p] as const));
    const enrichSub = (s: any) => ({
      ...s,
      user_name: pMap.get(s.user_id) ?? "—",
      plan_name: planMap.get(s.plan_id)?.name ?? "—",
      plan_price: planMap.get(s.plan_id)?.price ?? 0,
    });
    setRecentSubs((allSubsRes.data ?? []).map(enrichSub));
    setOverdueSubs((expiredSubsRes.data ?? []).map(enrichSub));

    // Pending doctors
    if (pendingRes.data && pendingRes.data.length > 0) {
      const docUserIds = pendingRes.data.map(d => d.user_id);
      const { data: docProfiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", docUserIds);
      const dpMap = new Map(docProfiles?.map(p => [p.user_id, p]) ?? []);
      setPendingDoctors(pendingRes.data.map(d => ({
        ...d, name: dpMap.has(d.user_id) ? `${dpMap.get(d.user_id)!.first_name} ${dpMap.get(d.user_id)!.last_name}` : "—",
      })));
    }

    setLoading(false);
    fetchLiveStats();
  };

  const approveDoctor = async (id: string) => {
    await supabase.from("doctor_profiles").update({ is_approved: true }).eq("id", id);
    fetchAll();
  };

  const statusVariant: Record<string, "default" | "destructive" | "outline"> = {
    active: "default", cancelled: "destructive", expired: "outline", paused: "outline",
  };
  const statusLabel: Record<string, string> = { active: "Ativa", cancelled: "Cancelada", expired: "Vencida", paused: "Pausada" };

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("overview")}>
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Painel de Controle</h1>
        <p className="text-muted-foreground mb-6">Monitoramento em tempo real, finanças e operações</p>

        {/* Real-time Operations Banner */}
        <Card className="border-primary/30 bg-primary/5 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-primary animate-pulse" />
              <h2 className="font-semibold text-foreground">Monitoramento em Tempo Real</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Video className="w-4 h-4 text-primary" />
                  <span className="text-2xl font-bold text-foreground">{stats.live_now}</span>
                </div>
                <p className="text-xs text-muted-foreground">Ao vivo agora</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4 text-secondary" />
                  <span className="text-2xl font-bold text-foreground">{stats.waiting_now}</span>
                </div>
                <p className="text-xs text-muted-foreground">Na fila</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-foreground">{stats.cancel_rate.toFixed(1)}%</span>
                <p className="text-xs text-muted-foreground">Cancelamentos</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-destructive">{stats.no_show_rate.toFixed(1)}%</span>
                <p className="text-xs text-muted-foreground">Absenteísmo</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-2xl font-bold text-foreground">{stats.avg_rating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-muted-foreground">NPS Médicos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live consultations list */}
        {liveAppts.length > 0 && (
          <Card className="border-border mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Consultas Ativas ({liveAppts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {liveAppts.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <Badge variant={a.status === "in_progress" ? "default" : "secondary"} className="text-xs">
                        {a.status === "in_progress" ? "🔴 Ao vivo" : "⏳ Esperando"}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.patient_name}</p>
                        <p className="text-xs text-muted-foreground">{a.doctor_name}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(a.scheduled_at), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Financial KPIs */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="border-border bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Receita Recorrente</p>
                  <p className="text-2xl font-bold text-foreground">R$ {stats.total_revenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assinaturas Ativas</p>
                  <p className="text-2xl font-bold text-foreground">{stats.active_subs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Inadimplentes</p>
                  <p className="text-2xl font-bold text-foreground">{stats.overdue_subs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border cursor-pointer" onClick={() => navigate("/dashboard/admin/patients")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
                <div><p className="text-xs text-muted-foreground">Pacientes</p><p className="text-xl font-bold text-foreground">{stats.total_patients}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border cursor-pointer" onClick={() => navigate("/dashboard/admin/doctors")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center"><FileText className="w-5 h-5 text-secondary" /></div>
                <div><p className="text-xs text-muted-foreground">Médicos</p><p className="text-xl font-bold text-foreground">{stats.total_doctors}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border cursor-pointer" onClick={() => navigate("/dashboard/admin/appointments")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center"><TrendingUp className="w-5 h-5 text-accent-foreground" /></div>
                <div><p className="text-xs text-muted-foreground">Consultas no Mês</p><p className="text-xl font-bold text-foreground">{stats.monthly_appts}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Overdue / Inadimplência */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" /> Inadimplentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueSubs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum inadimplente no momento. 🎉</p>
              ) : (
                <div className="space-y-3">
                  {overdueSubs.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded border border-destructive/20 bg-destructive/5">
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.user_name}</p>
                        <p className="text-xs text-muted-foreground">{s.plan_name} · R$ {Number(s.plan_price).toFixed(2)}</p>
                      </div>
                      <Badge variant="destructive">{statusLabel[s.status] ?? s.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending doctors */}
          <Card className="border-border">
            <CardHeader><CardTitle className="text-lg">Médicos Pendentes</CardTitle></CardHeader>
            <CardContent>
              {pendingDoctors.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pendente.</p>
              ) : (
                <div className="space-y-3">
                  {pendingDoctors.map(d => (
                    <div key={d.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.name}</p>
                        <p className="text-xs text-muted-foreground">CRM {d.crm}/{d.crm_state}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => approveDoctor(d.id)}>Aprovar</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent subscriptions */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Assinaturas Recentes</CardTitle>
              <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/admin/subscriptions")}>Ver Todas</Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentSubs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma assinatura registrada.</p>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSubs.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium text-foreground">{s.user_name}</TableCell>
                        <TableCell className="text-muted-foreground">{s.plan_name}</TableCell>
                        <TableCell className="text-foreground">R$ {Number(s.plan_price).toFixed(2)}</TableCell>
                        <TableCell><Badge variant={statusVariant[s.status] ?? "outline"}>{statusLabel[s.status] ?? s.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
