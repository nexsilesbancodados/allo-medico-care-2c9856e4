import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "@/components/admin/adminNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, Users, Stethoscope, XCircle, UserX, Star, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["hsl(210,90%,45%)", "hsl(160,55%,45%)", "hsl(40,90%,55%)", "hsl(0,84%,60%)", "hsl(270,60%,55%)"];

const AdminReports = () => {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [specialtyData, setSpecialtyData] = useState<any[]>([]);
  const [cancellationData, setCancellationData] = useState<any[]>([]);
  const [topDoctors, setTopDoctors] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalRevenue: 0, totalAppts: 0, totalCancelled: 0, totalNoShow: 0, avgTicket: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    const now = new Date();

    // Revenue by month (last 6 months)
    const { data: subs } = await supabase.from("subscriptions").select("plan_id, created_at, status");
    const { data: plans } = await supabase.from("plans").select("id, price");
    const planPriceMap = new Map(plans?.map(p => [p.id, Number(p.price)]) ?? []);

    const revChart = [];
    let totalRevAll = 0;
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const monthSubs = (subs ?? []).filter(s => {
        const d = new Date(s.created_at);
        return d >= mStart && d <= mEnd;
      });
      const revenue = monthSubs.reduce((acc, s) => acc + (planPriceMap.get(s.plan_id) ?? 0), 0);
      totalRevAll += revenue;
      revChart.push({ month: format(m, "MMM/yy", { locale: ptBR }), receita: revenue });
    }
    setRevenueData(revChart);

    // User growth
    const { data: roles } = await supabase.from("user_roles").select("role, created_at");
    const growthChart = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const mEnd = endOfMonth(m);
      const patients = (roles ?? []).filter(r => r.role === "patient" && new Date(r.created_at) <= mEnd).length;
      const doctors = (roles ?? []).filter(r => r.role === "doctor" && new Date(r.created_at) <= mEnd).length;
      growthChart.push({ month: format(m, "MMM/yy", { locale: ptBR }), pacientes: patients, medicos: doctors });
    }
    setUserGrowth(growthChart);

    // Appointments by specialty
    const { data: appts } = await supabase.from("appointments").select("doctor_id, status, scheduled_at");
    const completedAppts = (appts ?? []).filter(a => a.status === "completed");
    const doctorIds = [...new Set(completedAppts.map(a => a.doctor_id))];
    if (doctorIds.length > 0) {
      const { data: docSpecs } = await supabase.from("doctor_specialties").select("doctor_id, specialty_id").in("doctor_id", doctorIds);
      const specIds = [...new Set((docSpecs ?? []).map(ds => ds.specialty_id))];
      const { data: specs } = await supabase.from("specialties").select("id, name").in("id", specIds.length > 0 ? specIds : ["none"]);
      const specMap = new Map(specs?.map(s => [s.id, s.name]) ?? []);
      const docSpecMap = new Map<string, string>();
      (docSpecs ?? []).forEach(ds => docSpecMap.set(ds.doctor_id, specMap.get(ds.specialty_id) ?? "Outros"));
      const specCount: Record<string, number> = {};
      completedAppts.forEach(a => {
        const spec = docSpecMap.get(a.doctor_id) ?? "Sem especialidade";
        specCount[spec] = (specCount[spec] ?? 0) + 1;
      });
      setSpecialtyData(Object.entries(specCount).map(([name, value]) => ({ name, value })));
    }

    // Cancellation & no-show trends (last 6 months)
    const cancelChart = [];
    let totalAppts = 0, totalCancelled = 0, totalNoShow = 0;
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const monthAppts = (appts ?? []).filter(a => {
        const d = new Date(a.scheduled_at);
        return d >= mStart && d <= mEnd;
      });
      const total = monthAppts.length;
      const cancelled = monthAppts.filter(a => a.status === "cancelled").length;
      const noShow = monthAppts.filter(a => a.status === "no_show").length;
      totalAppts += total;
      totalCancelled += cancelled;
      totalNoShow += noShow;
      cancelChart.push({
        month: format(m, "MMM/yy", { locale: ptBR }),
        cancelamentos: total > 0 ? ((cancelled / total) * 100) : 0,
        absenteismo: total > 0 ? ((noShow / total) * 100) : 0,
      });
    }
    setCancellationData(cancelChart);

    // Top doctors by rating
    const { data: docProfiles } = await supabase.from("doctor_profiles")
      .select("id, user_id, rating, total_reviews, consultation_price")
      .gt("total_reviews", 0)
      .order("rating", { ascending: false })
      .limit(5);
    if (docProfiles && docProfiles.length > 0) {
      const userIds = docProfiles.map(d => d.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);
      const pMap = new Map(profiles?.map(p => [p.user_id, `Dr(a). ${p.first_name} ${p.last_name}`]) ?? []);
      setTopDoctors(docProfiles.map(d => ({
        ...d, name: pMap.get(d.user_id) ?? "—",
      })));
    }

    const activeSubs = (subs ?? []).filter(s => s.status === "active");
    const avgTicket = activeSubs.length > 0
      ? activeSubs.reduce((acc, s) => acc + (planPriceMap.get(s.plan_id) ?? 0), 0) / activeSubs.length
      : 0;

    setSummaryStats({
      totalRevenue: totalRevAll,
      totalAppts,
      totalCancelled,
      totalNoShow,
      avgTicket,
    });

    setLoading(false);
  };

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(r => Object.values(r).join(",")).join("\n");
    const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("reports")}>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Relatórios & Análises</h1>
            <p className="text-muted-foreground">Métricas financeiras, operacionais e de qualidade</p>
          </div>
          <Button variant="outline" onClick={() => exportCSV(revenueData, "receita-mensal")}>
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
        </div>

        {loading ? <p className="text-muted-foreground">Carregando...</p> : (
          <>
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <DollarSign className="w-4 h-4 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold text-foreground">R$ {summaryStats.totalRevenue.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Receita 6 meses</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-foreground">{summaryStats.totalAppts}</p>
                <p className="text-xs text-muted-foreground">Consultas 6 meses</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-foreground">R$ {summaryStats.avgTicket.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-destructive/5">
                <XCircle className="w-4 h-4 mx-auto text-destructive mb-1" />
                <p className="text-lg font-bold text-destructive">{summaryStats.totalCancelled}</p>
                <p className="text-xs text-muted-foreground">Cancelamentos</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-destructive/5">
                <UserX className="w-4 h-4 mx-auto text-destructive mb-1" />
                <p className="text-lg font-bold text-destructive">{summaryStats.totalNoShow}</p>
                <p className="text-xs text-muted-foreground">Ausências</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue chart */}
              <Card className="border-border">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Receita Mensal</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `R$${v}`} />
                      <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Receita"]} />
                      <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Cancellation & no-show trend */}
              <Card className="border-border">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><XCircle className="w-5 h-5 text-destructive" /> Cancelamentos & Absenteísmo (%)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={cancellationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `${v}%`} />
                      <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`]} />
                      <Area type="monotone" dataKey="cancelamentos" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.1)" strokeWidth={2} name="Cancelamentos" />
                      <Area type="monotone" dataKey="absenteismo" stroke="hsl(40,90%,55%)" fill="hsl(40,90%,55%,0.1)" strokeWidth={2} name="Absenteísmo" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* User growth */}
              <Card className="border-border">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5" /> Crescimento de Usuários</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip />
                      <Line type="monotone" dataKey="pacientes" stroke="hsl(var(--primary))" strokeWidth={2} name="Pacientes" />
                      <Line type="monotone" dataKey="medicos" stroke="hsl(var(--secondary))" strokeWidth={2} name="Médicos" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Specialty pie */}
              <Card className="border-border">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Stethoscope className="w-5 h-5" /> Consultas por Especialidade</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-center">
                  {specialtyData.length === 0 ? (
                    <p className="text-muted-foreground py-8">Sem dados de consultas concluídas.</p>
                  ) : (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width={220} height={220}>
                        <PieChart>
                          <Pie data={specialtyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                            {specialtyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1">
                        {specialtyData.map((s, i) => (
                          <div key={s.name} className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-foreground">{s.name}: {s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top rated doctors */}
            {topDoctors.length > 0 && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" /> Top Médicos (Avaliação)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topDoctors.map((d, i) => (
                      <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{d.name}</p>
                            <p className="text-xs text-muted-foreground">{d.total_reviews} avaliações</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold text-foreground">{Number(d.rating).toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
