import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getLaudistaNav } from "./laudistaNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, Wallet, ArrowUpRight, Clock, CheckCircle2, XCircle, AlertCircle, Microscope } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toast } from "sonner";

const EXAM_BASE_PRICE = 80; // R$ 80 per report (configurable)
const LAUDISTA_PERCENT = 50;
const MIN_WITHDRAWAL = 50;

const LaudistaEarnings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, totalReports: 0, available: 0 });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pixKey, setPixKey] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (user) fetchEarnings(); }, [user]);

  const fetchEarnings = async () => {
    const { data: docProfile } = await supabase.from("doctor_profiles").select("id").eq("user_id", user!.id).single();
    if (!docProfile) { setLoading(false); return; }

    const [reportsRes, withdrawRes] = await Promise.all([
      supabase.from("exam_reports")
        .select("id, created_at, signed_at")
        .eq("reporter_id", docProfile.id)
        .not("signed_at", "is", null)
        .order("created_at", { ascending: false }),
      supabase.from("withdrawal_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const reports = reportsRes.data ?? [];
    setWithdrawals(withdrawRes.data ?? []);

    const pricePerReport = EXAM_BASE_PRICE * (LAUDISTA_PERCENT / 100); // R$ 40 per report
    const totalEarned = reports.length * pricePerReport;
    const totalWithdrawn = (withdrawRes.data ?? [])
      .filter((w: any) => w.status === "approved")
      .reduce((sum: number, w: any) => sum + Number(w.amount), 0);

    const now = new Date();
    const monthStart = startOfMonth(now);
    const thisMonthReports = reports.filter(r => new Date(r.created_at) >= monthStart);

    setStats({
      total: totalEarned,
      thisMonth: thisMonthReports.length * pricePerReport,
      totalReports: reports.length,
      available: Math.max(0, totalEarned - totalWithdrawn),
    });

    // Last 6 months chart
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const monthReports = reports.filter(r => {
        const d = new Date(r.created_at);
        return d >= mStart && d <= mEnd;
      });
      chartData.push({
        month: format(m, "MMM", { locale: ptBR }),
        laudos: monthReports.length,
        valor: monthReports.length * pricePerReport,
      });
    }
    setMonthlyData(chartData);
    setLoading(false);
  };

  const requestWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < MIN_WITHDRAWAL) {
      toast.error(`Valor mínimo para saque: R$ ${MIN_WITHDRAWAL.toFixed(2)}`);
      return;
    }
    if (amount > stats.available) {
      toast.error("Valor superior ao saldo disponível");
      return;
    }
    if (!pixKey.trim()) {
      toast.error("Informe sua chave PIX");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user!.id,
      amount,
      pix_key: pixKey,
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
    if (status === "approved") return <Badge className="bg-success/10 text-success border-success/20 text-xs gap-1"><CheckCircle2 className="w-3 h-3" />Aprovado</Badge>;
    if (status === "rejected") return <Badge variant="destructive" className="text-xs gap-1"><XCircle className="w-3 h-3" />Rejeitado</Badge>;
    return <Badge variant="outline" className="text-xs gap-1"><Clock className="w-3 h-3" />Pendente</Badge>;
  };

  return (
    <DashboardLayout title="Laudista" nav={getLaudistaNav("earnings")} role="doctor">
      <div className="max-w-4xl">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
          Voltar ao painel
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
          <Microscope className="w-6 h-6 text-secondary" /> Ganhos de Laudos
        </h1>
        <p className="text-muted-foreground mb-6">Resumo financeiro dos laudos assinados</p>

        {/* Split info */}
        <div className="mb-6 p-3 rounded-lg bg-secondary/5 border border-secondary/20 flex items-center gap-3 text-xs text-muted-foreground">
          <Wallet className="w-4 h-4 shrink-0 text-secondary" />
          <span>Split automático: <strong className="text-foreground">{LAUDISTA_PERCENT}% Laudista</strong> · {100 - LAUDISTA_PERCENT}% Plataforma · Base R$ {EXAM_BASE_PRICE}/laudo</span>
        </div>

        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          <Card className="border-border bg-gradient-to-br from-secondary/5 to-transparent">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Ganho Total</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">R$ {stats.total.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Este Mês</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">R$ {stats.thisMonth.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Laudos Assinados</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalReports}</p>
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
                  <DialogHeader><DialogTitle>Solicitar Saque</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Saldo disponível: <strong className="text-foreground">R$ {stats.available.toFixed(2)}</strong></p>
                    <p className="text-xs text-muted-foreground">Valor mínimo: R$ {MIN_WITHDRAWAL.toFixed(2)} · Processamento em 3-5 dias úteis</p>
                    <div>
                      <label className="text-xs font-medium text-foreground">Valor do saque (R$) *</label>
                      <Input type="number" placeholder={`Mín. ${MIN_WITHDRAWAL.toFixed(2)}`} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} min={MIN_WITHDRAWAL} max={stats.available} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Chave PIX *</label>
                      <Input placeholder="CPF, e-mail ou telefone" value={pixKey} onChange={e => setPixKey(e.target.value)} />
                    </div>
                    <Button className="w-full bg-gradient-to-r from-secondary to-primary text-white" onClick={requestWithdrawal} disabled={submitting || !withdrawAmount || !pixKey.trim()}>
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
            {loading ? <div className="h-[200px] flex items-center justify-center text-muted-foreground">Carregando...</div> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `R$${v}`} />
                  <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Valor"]} />
                  <Bar dataKey="valor" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {withdrawals.length > 0 && (
          <Card className="border-border">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wallet className="w-5 h-5" /> Histórico de Saques</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {withdrawals.map((w: any) => (
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

export default LaudistaEarnings;
