import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDoctorNav } from "./doctorNav";
import { TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const DoctorEarnings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, totalAppts: 0 });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchEarnings(); }, [user]);

  const fetchEarnings = async () => {
    const { data: docProfile } = await supabase.from("doctor_profiles").select("id, consultation_price").eq("user_id", user!.id).single();
    if (!docProfile) { setLoading(false); return; }

    const price = Number(docProfile.consultation_price) || 89;

    const { data: appts } = await supabase
      .from("appointments")
      .select("id, scheduled_at, status")
      .eq("doctor_id", docProfile.id)
      .eq("status", "completed")
      .order("scheduled_at", { ascending: false });

    const allAppts = appts ?? [];
    const now = new Date();
    const monthStart = startOfMonth(now);

    const thisMonthAppts = allAppts.filter(a => new Date(a.scheduled_at) >= monthStart);
    setStats({
      total: allAppts.length * price,
      thisMonth: thisMonthAppts.length * price,
      totalAppts: allAppts.length,
    });

    // Last 6 months chart
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const count = allAppts.filter(a => {
        const d = new Date(a.scheduled_at);
        return d >= mStart && d <= mEnd;
      }).length;
      chartData.push({
        month: format(m, "MMM", { locale: ptBR }),
        consultas: count,
        valor: count * price,
      });
    }
    setMonthlyData(chartData);
    setLoading(false);
  };

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("earnings")}>
      <div className="max-w-4xl">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
          Voltar ao painel
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-1">Meus Ganhos</h1>
        <p className="text-muted-foreground mb-6">Resumo financeiro das consultas realizadas</p>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-border bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Total Acumulado</p>
              <p className="text-2xl font-bold text-foreground">R$ {stats.total.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Este Mês</p>
              <p className="text-2xl font-bold text-foreground">R$ {stats.thisMonth.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Consultas Realizadas</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalAppts}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Faturamento Mensal</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground">Carregando...</p> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `R$${v}`} />
                  <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Valor"]} />
                  <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DoctorEarnings;
