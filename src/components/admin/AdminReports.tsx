import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "@/components/admin/adminNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, TrendingUp, Users, Stethoscope, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["hsl(210,90%,45%)", "hsl(160,55%,45%)", "hsl(40,90%,55%)", "hsl(0,84%,60%)", "hsl(270,60%,55%)"];

const AdminReports = () => {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [specialtyData, setSpecialtyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    const now = new Date();

    // Revenue by month (last 6 months)
    const { data: subs } = await supabase.from("subscriptions").select("plan_id, created_at, status");
    const { data: plans } = await supabase.from("plans").select("id, price");
    const planPriceMap = new Map(plans?.map(p => [p.id, Number(p.price)]) ?? []);

    const revChart = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const monthSubs = (subs ?? []).filter(s => {
        const d = new Date(s.created_at);
        return d >= mStart && d <= mEnd;
      });
      const revenue = monthSubs.reduce((acc, s) => acc + (planPriceMap.get(s.plan_id) ?? 0), 0);
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
    const { data: appts } = await supabase.from("appointments").select("doctor_id, status").eq("status", "completed");
    const doctorIds = [...new Set((appts ?? []).map(a => a.doctor_id))];
    if (doctorIds.length > 0) {
      const { data: docSpecs } = await supabase.from("doctor_specialties").select("doctor_id, specialty_id").in("doctor_id", doctorIds);
      const specIds = [...new Set((docSpecs ?? []).map(ds => ds.specialty_id))];
      const { data: specs } = await supabase.from("specialties").select("id, name").in("id", specIds.length > 0 ? specIds : ["none"]);
      const specMap = new Map(specs?.map(s => [s.id, s.name]) ?? []);
      const docSpecMap = new Map<string, string>();
      (docSpecs ?? []).forEach(ds => docSpecMap.set(ds.doctor_id, specMap.get(ds.specialty_id) ?? "Outros"));

      const specCount: Record<string, number> = {};
      (appts ?? []).forEach(a => {
        const spec = docSpecMap.get(a.doctor_id) ?? "Sem especialidade";
        specCount[spec] = (specCount[spec] ?? 0) + 1;
      });
      setSpecialtyData(Object.entries(specCount).map(([name, value]) => ({ name, value })));
    }

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
            <h1 className="text-2xl font-bold text-foreground mb-1">Relatórios</h1>
            <p className="text-muted-foreground">Análises e métricas da plataforma</p>
          </div>
          <Button variant="outline" onClick={() => exportCSV(revenueData, "receita-mensal")}>
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
        </div>

        {loading ? <p className="text-muted-foreground">Carregando...</p> : (
          <div className="grid lg:grid-cols-2 gap-6">
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
            <Card className="border-border lg:col-span-2">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Stethoscope className="w-5 h-5" /> Consultas por Especialidade</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center">
                {specialtyData.length === 0 ? (
                  <p className="text-muted-foreground py-8">Sem dados de consultas concluídas.</p>
                ) : (
                  <div className="flex items-center gap-8">
                    <ResponsiveContainer width={280} height={280}>
                      <PieChart>
                        <Pie data={specialtyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {specialtyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
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
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
