import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))", "hsl(var(--warning))"];

const AdminAnalyticsCharts = () => {
  const [dailyAppts, setDailyAppts] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);
  const [specialtyData, setSpecialtyData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [patientGrowth, setPatientGrowth] = useState<any[]>([]);
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchChartData(); }, []);

  const fetchChartData = async () => {
    const days = 14;
    const startDate = startOfDay(subDays(new Date(), days));

    const [apptsRes, specsRes, docSpecsRes, subsRes, profilesRes, allApptsRes, surveysRes] = await Promise.all([
      supabase.from("appointments").select("id, scheduled_at, status").gte("scheduled_at", startDate.toISOString()).order("scheduled_at", { ascending: true }),
      supabase.from("specialties").select("id, name"),
      supabase.from("doctor_specialties").select("doctor_id, specialty_id"),
      supabase.from("subscriptions").select("id, created_at, status, plan_id").order("created_at", { ascending: true }),
      supabase.from("profiles").select("id, created_at").order("created_at", { ascending: true }),
      supabase.from("appointments").select("id, status, patient_id").order("scheduled_at", { ascending: false }).limit(500),
      supabase.from("satisfaction_surveys").select("nps_score, created_at").order("created_at", { ascending: true }),
    ]);

    // Daily appointments
    const dayMap = new Map<string, { date: string; total: number; completed: number; cancelled: number }>();
    for (let i = 0; i <= days; i++) {
      const d = format(subDays(new Date(), days - i), "dd/MM", { locale: ptBR });
      dayMap.set(d, { date: d, total: 0, completed: 0, cancelled: 0 });
    }
    (apptsRes.data ?? []).forEach((a) => {
      const d = format(new Date(a.scheduled_at), "dd/MM", { locale: ptBR });
      const entry = dayMap.get(d);
      if (entry) { entry.total++; if (a.status === "completed") entry.completed++; if (a.status === "cancelled") entry.cancelled++; }
    });
    setDailyAppts(Array.from(dayMap.values()));

    // Status pie
    const statusCount: Record<string, number> = {};
    (apptsRes.data ?? []).forEach((a) => { statusCount[a.status] = (statusCount[a.status] || 0) + 1; });
    const statusLabels: Record<string, string> = { scheduled: "Agendada", completed: "Concluída", cancelled: "Cancelada", in_progress: "Em andamento", waiting: "Esperando", no_show: "Ausente" };
    setStatusBreakdown(Object.entries(statusCount).map(([status, count]) => ({ name: statusLabels[status] || status, value: count })));

    // Specialty distribution
    const specMap = new Map((specsRes.data ?? []).map((s) => [s.id, s.name]));
    const specCount: Record<string, number> = {};
    (docSpecsRes.data ?? []).forEach((ds) => { const name = specMap.get(ds.specialty_id) || "Outro"; specCount[name] = (specCount[name] || 0) + 1; });
    setSpecialtyData(Object.entries(specCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count })));

    // Revenue
    const { data: plans } = await supabase.from("plans").select("id, price");
    const planPriceMap = new Map(plans?.map(p => [p.id, Number(p.price)]) ?? []);
    const revenueByMonth = new Map<string, number>();
    for (let i = 5; i >= 0; i--) { revenueByMonth.set(format(subDays(new Date(), i * 30), "MMM/yy", { locale: ptBR }), 0); }
    (subsRes.data ?? []).filter(s => s.status === "active").forEach(s => {
      const mk = format(new Date(s.created_at), "MMM/yy", { locale: ptBR });
      if (revenueByMonth.has(mk)) revenueByMonth.set(mk, (revenueByMonth.get(mk) ?? 0) + (planPriceMap.get(s.plan_id) ?? 0));
    });
    setRevenueData(Array.from(revenueByMonth.entries()).map(([month, revenue]) => ({ month, revenue })));

    // Patient growth
    const growthByMonth = new Map<string, number>();
    for (let i = 5; i >= 0; i--) { growthByMonth.set(format(subDays(new Date(), i * 30), "MMM/yy", { locale: ptBR }), 0); }
    (profilesRes.data ?? []).forEach(p => {
      const mk = format(new Date(p.created_at), "MMM/yy", { locale: ptBR });
      if (growthByMonth.has(mk)) growthByMonth.set(mk, (growthByMonth.get(mk) ?? 0) + 1);
    });
    let cum = 0;
    setPatientGrowth(Array.from(growthByMonth.entries()).map(([month, count]) => { cum += count; return { month, novos: count, total: cum }; }));

    // Retention
    const completedByPatient = new Map<string, number>();
    (allApptsRes.data ?? []).filter(a => a.status === "completed" && a.patient_id).forEach(a => {
      completedByPatient.set(a.patient_id!, (completedByPatient.get(a.patient_id!) ?? 0) + 1);
    });
    const totalP = completedByPatient.size;
    const returning = [...completedByPatient.values()].filter(c => c >= 2).length;
    const loyal = [...completedByPatient.values()].filter(c => c >= 4).length;
    setRetentionData([
      { name: "Primeira consulta", value: totalP, fill: "hsl(var(--primary) / 0.3)" },
      { name: "Retorno (2+)", value: returning, fill: "hsl(var(--secondary))" },
      { name: "Fiel (4+)", value: loyal, fill: "hsl(var(--primary))" },
    ]);

    // Conversion funnel
    const totalProfiles = profilesRes.data?.length ?? 0;
    const scheduled = (allApptsRes.data ?? []).filter(a => ["scheduled", "completed", "in_progress", "waiting"].includes(a.status)).length;
    const completed = (allApptsRes.data ?? []).filter(a => a.status === "completed").length;
    const surveyed = surveysRes.data?.length ?? 0;
    setFunnelData([
      { stage: "Cadastro", count: totalProfiles },
      { stage: "Agendou", count: scheduled },
      { stage: "Concluiu", count: completed },
      { stage: "Avaliou", count: surveyed },
    ]);

    setLoading(false);
  };

  if (loading) return null;

  const ts = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6" role="region" aria-label="Gráficos de análise">
      {/* Daily appointments */}
      <Card className="border-border lg:col-span-2">
        <CardHeader><CardTitle className="text-base sm:text-lg">📈 Consultas por Dia (últimos 14 dias)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyAppts}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={ts} />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} name="Total" dot={false} />
                <Line type="monotone" dataKey="completed" stroke="hsl(var(--secondary))" strokeWidth={2} name="Concluídas" dot={false} />
                <Line type="monotone" dataKey="cancelled" stroke="hsl(var(--destructive))" strokeWidth={2} name="Canceladas" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card className="border-border">
        <CardHeader><CardTitle className="text-base sm:text-lg">🎯 Funil de Conversão</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.map((stage, i) => {
              const maxVal = funnelData[0]?.count || 1;
              const pct = maxVal > 0 ? (stage.count / maxVal) * 100 : 0;
              const colors = ["primary", "secondary", "primary", "warning"];
              return (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{stage.stage}</span>
                    <span className="font-semibold text-foreground">{stage.count} <span className="text-xs text-muted-foreground">({pct.toFixed(0)}%)</span></span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, 2)}%`, background: `hsl(var(--${colors[i]}) / ${1 - i * 0.15})` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Retention */}
      <Card className="border-border">
        <CardHeader><CardTitle className="text-base sm:text-lg">🔁 Retenção de Pacientes</CardTitle></CardHeader>
        <CardContent>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retentionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="name" fontSize={10} width={110} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={ts} />
                <Bar dataKey="value" name="Pacientes" radius={[0, 6, 6, 0]}>
                  {retentionData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue */}
      <Card className="border-border">
        <CardHeader><CardTitle className="text-base sm:text-lg">💰 Receita Mensal (MRR)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Receita"]} contentStyle={ts} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--secondary))" fill="url(#revenueGrad)" strokeWidth={2} name="Receita" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Patient growth */}
      <Card className="border-border">
        <CardHeader><CardTitle className="text-base sm:text-lg">👥 Crescimento de Pacientes</CardTitle></CardHeader>
        <CardContent>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={patientGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={ts} />
                <Bar dataKey="novos" fill="hsl(var(--primary) / 0.3)" name="Novos no mês" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} name="Total acumulado" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Status pie */}
      <Card className="border-border">
        <CardHeader><CardTitle className="text-base sm:text-lg">📊 Status das Consultas</CardTitle></CardHeader>
        <CardContent>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusBreakdown} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={10}>
                  {statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={ts} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Specialty distribution */}
      <Card className="border-border">
        <CardHeader><CardTitle className="text-base sm:text-lg">🩺 Médicos por Especialidade</CardTitle></CardHeader>
        <CardContent>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={specialtyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="name" fontSize={10} width={100} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={ts} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Médicos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalyticsCharts;
