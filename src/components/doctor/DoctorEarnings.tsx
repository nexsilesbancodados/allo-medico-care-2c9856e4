import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getDoctorNav } from "./doctorNav";
import { TrendingUp, Wallet, ArrowUpRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toast } from "sonner";

const PLATFORM_PERCENT = 10;
const DEFAULT_DOCTOR_PERCENT = 70;

const DoctorEarnings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, totalAppts: 0, available: 0 });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pixKey, setPixKey] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (user) fetchEarnings(); }, [user]);

  const fetchEarnings = async () => {
    const { data: docProfile } = await supabase.from("doctor_profiles").select("id, consultation_price").eq("user_id", user!.id).single();
    if (!docProfile) { setLoading(false); return; }

    const price = Number(docProfile.consultation_price) || 89;
    const doctorPercent = DEFAULT_DOCTOR_PERCENT;

    const [apptsRes, withdrawRes] = await Promise.all([
      supabase
        .from("appointments")
        .select("id, scheduled_at, status")
        .eq("doctor_id", docProfile.id)
        .eq("status", "completed")
        .order("scheduled_at", { ascending: false }),
      supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const allAppts = apptsRes.data ?? [];
    setWithdrawals(withdrawRes.data ?? []);

    const now = new Date();
    const monthStart = startOfMonth(now);
    const thisMonthAppts = allAppts.filter(a => new Date(a.scheduled_at) >= monthStart);

    const totalEarned = allAppts.length * price * (doctorPercent / 100);
    const totalWithdrawn = (withdrawRes.data ?? [])
      .filter(w => w.status === "approved")
      .reduce((sum: number, w: any) => sum + Number(w.amount), 0);

    setStats({
      total: totalEarned,
      thisMonth: thisMonthAppts.length * price * (doctorPercent / 100),
      totalAppts: allAppts.length,
      available: totalEarned - totalWithdrawn,
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
        valor: count * price * (doctorPercent / 100),
      });
    }
    setMonthlyData(chartData);
    setLoading(false);
  };

  const requestWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || amount > stats.available) {
      toast.error("Valor inválido ou superior ao saldo disponível");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user!.id,
      amount,
      pix_key: pixKey || null,
    });
    if (error) {
      toast.error("Erro ao solicitar saque");
    } else {
      toast.success("Solicitação de saque enviada!");
      setWithdrawOpen(false);
      setWithdrawAmount("");
      setPixKey("");
      fetchEarnings();
    }
    setSubmitting(false);
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-xs gap-1"><CheckCircle2 className="w-3 h-3" />Aprovado</Badge>;
    if (status === "rejected") return <Badge variant="destructive" className="text-xs gap-1"><XCircle className="w-3 h-3" />Rejeitado</Badge>;
    return <Badge variant="outline" className="text-xs gap-1"><Clock className="w-3 h-3" />Pendente</Badge>;
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

        {/* Split info */}
        <div className="mb-6 p-3 rounded-lg bg-muted/50 border border-border flex items-center gap-3 text-xs text-muted-foreground">
          <Wallet className="w-4 h-4 shrink-0" />
          <span>Split automático: <strong className="text-foreground">{DEFAULT_DOCTOR_PERCENT}% Médico</strong> · 20% Clínica · {PLATFORM_PERCENT}% Plataforma</span>
        </div>

        <div className="grid sm:grid-cols-4 gap-4 mb-8">
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
          <Card className="border-border border-secondary/20 bg-secondary/5">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Saldo Disponível</p>
              <p className="text-2xl font-bold text-secondary">R$ {stats.available.toFixed(2)}</p>
              <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="mt-2 text-xs gap-1 w-full border-secondary/30 text-secondary hover:bg-secondary/10">
                    <ArrowUpRight className="w-3 h-3" /> Solicitar Saque
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Solicitar Saque</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Saldo disponível: <strong className="text-foreground">R$ {stats.available.toFixed(2)}</strong>
                    </p>
                    <div>
                      <label className="text-xs font-medium text-foreground">Valor do saque (R$)</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={e => setWithdrawAmount(e.target.value)}
                        max={stats.available}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Chave PIX (opcional)</label>
                      <Input
                        placeholder="CPF, e-mail ou telefone"
                        value={pixKey}
                        onChange={e => setPixKey(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full bg-gradient-hero text-primary-foreground"
                      onClick={requestWithdrawal}
                      disabled={submitting || !withdrawAmount}
                    >
                      {submitting ? "Enviando..." : "Confirmar Solicitação"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border mb-8">
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

        {/* Withdrawal history */}
        {withdrawals.length > 0 && (
          <Card className="border-border">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wallet className="w-5 h-5" /> Histórico de Saques</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {withdrawals.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">R$ {Number(w.amount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(w.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        {w.pix_key && ` · PIX: ${w.pix_key}`}
                      </p>
                    </div>
                    {statusBadge(w.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorEarnings;
