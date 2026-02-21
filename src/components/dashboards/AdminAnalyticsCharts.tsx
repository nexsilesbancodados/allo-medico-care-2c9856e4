import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];

const AdminAnalyticsCharts = () => {
  const [dailyAppts, setDailyAppts] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);
  const [specialtyData, setSpecialtyData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [patientGrowth, setPatientGrowth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    const days = 14;
    const startDate = startOfDay(subDays(new Date(), days));

    const [apptsRes, specsRes, docSpecsRes, subsRes, profilesRes] = await Promise.all([
      supabase.from("appointments")
        .select("id, scheduled_at, status")
        .gte("scheduled_at", startDate.toISOString())
        .order("scheduled_at", { ascending: true }),
      supabase.from("specialties").select("id, name"),
      supabase.from("doctor_specialties").select("doctor_id, specialty_id"),
      supabase.from("subscriptions")
        .select("id, created_at, status, plan_id")
        .order("created_at", { ascending: true }),
      supabase.from("profiles")
        .select("id, created_at")
        .order("created_at", { ascending: true }),
    ]);

    // Daily appointments chart
    const dayMap = new Map<string, { date: string; total: number; completed: number; cancelled: number }>();
    for (let i = 0; i <= days; i++) {
      const d = format(subDays(new Date(), days - i), "dd/MM", { locale: ptBR });
      dayMap.set(d, { date: d, total: 0, completed: 0, cancelled: 0 });
    }
    (apptsRes.data ?? []).forEach((a) => {
      const d = format(new Date(a.scheduled_at), "dd/MM", { locale: ptBR });
      const entry = dayMap.get(d);
      if (entry) {
        entry.total++;
        if (a.status === "completed") entry.completed++;
        if (a.status === "cancelled") entry.cancelled++;
      }
    });
    setDailyAppts(Array.from(dayMap.values()));

    // Status breakdown pie
    const statusCount: Record<string, number> = {};
    (apptsRes.data ?? []).forEach((a) => {
      statusCount[a.status] = (statusCount[a.status] || 0) + 1;
    });
    const statusLabels: Record<string, string> = {
      scheduled: "Agendada", completed: "Concluída", cancelled: "Cancelada",
      in_progress: "Em andamento", waiting: "Esperando", no_show: "Ausente",
    };
    setStatusBreakdown(
      Object.entries(statusCount).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
      }))
    );

    // Specialty distribution
    const specMap = new Map((specsRes.data ?? []).map((s) => [s.id, s.name]));
    const specCount: Record<string, number> = {};
    (docSpecsRes.data ?? []).forEach((ds) => {
      const name = specMap.get(ds.specialty_id) || "Outro";
      specCount[name] = (specCount[name] || 0) + 1;
    });
    setSpecialtyData(
      Object.entries(specCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count }))
    );

    // Revenue by month (from active subs)
    const { data: plans } = await supabase.from("plans").select("id, price");
    const planPriceMap = new Map(plans?.map(p => [p.id, Number(p.price)]) ?? []);
    const revenueByMonth = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const monthKey = format(subDays(new Date(), i * 30), "MMM/yy", { locale: ptBR });
      revenueByMonth.set(monthKey, 0);
    }
    (subsRes.data ?? []).filter(s => s.status === "active").forEach(s => {
      const monthKey = format(new Date(s.created_at), "MMM/yy", { locale: ptBR });
      if (revenueByMonth.has(monthKey)) {
        revenueByMonth.set(monthKey, (revenueByMonth.get(monthKey) ?? 0) + (planPriceMap.get(s.plan_id) ?? 0));
      }
    });
    setRevenueData(Array.from(revenueByMonth.entries()).map(([month, revenue]) => ({ month, revenue })));

    // Patient growth by month
    const growthByMonth = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const monthKey = format(subDays(new Date(), i * 30), "MMM/yy", { locale: ptBR });
      growthByMonth.set(monthKey, 0);
    }
    (profilesRes.data ?? []).forEach(p => {
      const monthKey = format(new Date(p.created_at), "MMM/yy", { locale: ptBR });
      if (growthByMonth.has(monthKey)) {
        growthByMonth.set(monthKey, (growthByMonth.get(monthKey) ?? 0) + 1);
      }
    });
    let cumulative = 0;
    setPatientGrowth(Array.from(growthByMonth.entries()).map(([month, count]) => {
      cumulative += count;
      return { month, novos: count, total: cumulative };
    }));

    setLoading(false);
  };

  if (loading) return null;

  return (
    <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
      {/* Daily appointments line chart */}
      <Card className="border-border lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">📈 Consultas por Dia (últimos 14 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyAppts}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} name="Total" dot={false} />
                <Line type="monotone" dataKey="completed" stroke="hsl(var(--secondary))" strokeWidth={2} name="Concluídas" dot={false} />
                <Line type="monotone" dataKey="cancelled" stroke="hsl(var(--destructive))" strokeWidth={2} name="Canceladas" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue by month */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">💰 Receita Mensal (MRR)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Receita"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Patient growth */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">👥 Crescimento de Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={patientGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} name="Total acumulado" />
                <Bar dataKey="novos" fill="hsl(var(--primary) / 0.3)" name="Novos no mês" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Status breakdown pie */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">🔄 Status das Consultas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusBreakdown} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={10}>
                  {statusBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Specialty distribution bar */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">🩺 Médicos por Especialidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={specialtyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="name" fontSize={10} width={100} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
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
