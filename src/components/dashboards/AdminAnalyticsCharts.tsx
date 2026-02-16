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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    const days = 14;
    const startDate = startOfDay(subDays(new Date(), days));

    const [apptsRes, specsRes, docSpecsRes] = await Promise.all([
      supabase.from("appointments")
        .select("id, scheduled_at, status")
        .gte("scheduled_at", startDate.toISOString())
        .order("scheduled_at", { ascending: true }),
      supabase.from("specialties").select("id, name"),
      supabase.from("doctor_specialties").select("doctor_id, specialty_id"),
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

    setLoading(false);
  };

  if (loading) return null;

  return (
    <div className="grid lg:grid-cols-2 gap-6 mb-6">
      {/* Daily appointments line chart */}
      <Card className="border-border lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">📈 Consultas por Dia (últimos 14 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyAppts}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
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

      {/* Status breakdown pie */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">🔄 Status das Consultas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
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
          <CardTitle className="text-lg">🩺 Médicos por Especialidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={specialtyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="name" fontSize={11} width={120} tick={{ fill: "hsl(var(--muted-foreground))" }} />
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
