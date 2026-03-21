import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getLaudistaNav } from "./laudistaNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, Wallet, ArrowUpRight, Clock, CheckCircle2, XCircle, Microscope } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

const EXAM_BASE_PRICE = 80;
const LAUDISTA_PERCENT = 50;
const MIN_WITHDRAWAL = 50;

const LaudistaEarnings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pixKey, setPixKey] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: doctorProfile } = useQuery({
    queryKey: ["laudista-doctor-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("doctor_profiles").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: earningsData, isLoading } = useQuery({
    queryKey: ["laudista-earnings", doctorProfile?.id],
    queryFn: async () => {
      const dpId = doctorProfile!.id;
      const [reportsRes, withdrawRes, walletRes] = await Promise.all([
        supabase
          .from("exam_reports")
          .select("id, created_at, signed_at")
          .eq("reporter_id", dpId)
          .not("signed_at", "is", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("withdrawal_requests")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      const reports = reportsRes.data ?? [];
      const withdrawals = withdrawRes.data ?? [];
      const walletTxns = walletRes.data ?? [];

      const pricePerReport = EXAM_BASE_PRICE * (LAUDISTA_PERCENT / 100);
      const walletCredits = walletTxns
        .filter((t: any) => t.type === "credit" || t.type === "refund")
        .reduce((s: number, t: any) => s + Number(t.amount), 0);
      const walletDebits = walletTxns
        .filter((t: any) => t.type === "withdrawal" || t.type === "debit")
        .reduce((s: number, t: any) => s + Number(t.amount), 0);
      const hasWalletData = walletTxns.length > 0;

      const totalEarned = hasWalletData ? walletCredits : reports.length * pricePerReport;
      const availableBalance = hasWalletData
        ? Math.max(0, walletCredits - walletDebits)
        : Math.max(0, totalEarned - withdrawals.filter((w: any) => w.status === "approved").reduce((sum: number, w: any) => sum + Number(w.amount), 0));

      const now = new Date();
      const monthStart = startOfMonth(now);
      const thisMonthReports = reports.filter((r: any) => new Date(r.created_at) >= monthStart);

      // Last 6 months chart
      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const m = subMonths(now, i);
        const mStart = startOfMonth(m);
        const mEnd = endOfMonth(m);
        const monthReports = reports.filter((r: any) => {
          const d = new Date(r.created_at);
          return d >= mStart && d <= mEnd;
        });
        chartData.push({
          month: format(m, "MMM", { locale: ptBR }),
          laudos: monthReports.length,
          valor: monthReports.length * pricePerReport,
        });
      }

      return {
        total: totalEarned,
        thisMonth: thisMonthReports.length * pricePerReport,
        totalReports: reports.length,
        available: availableBalance,
        monthlyData: chartData,
        withdrawals,
      };
    },
    enabled: !!doctorProfile?.id,
  });

  const requestWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < MIN_WITHDRAWAL) {
      toast.error(`Valor mínimo para saque: R$ ${MIN_WITHDRAWAL.toFixed(2)}`);
      return;
    }
    if (!earningsData || amount > earningsData.available) {
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
      toast.error("Erro ao solicitar saque", { description: error.message });
    } else {
      toast.success("Solicitação de saque enviada!");
      setWithdrawOpen(false);
      setWithdrawAmount("");
      setPixKey("");
      queryClient.invalidateQueries({ queryKey: ["laudista-earnings"] });
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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl space-y-6"
      >
        <div>
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
            Voltar ao painel
          </button>
          <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <Microscope className="w-6 h-6 text-secondary" /> Ganhos de Laudos
          </h1>
          <p className="text-muted-foreground text-sm">Resumo financeiro dos laudos assinados</p>
        </div>

        {/* Split info */}
        <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/20 flex items-center gap-3 text-xs text-muted-foreground">
          <Wallet className="w-4 h-4 shrink-0 text-secondary" />
          <span>Split automático: <strong className="text-foreground">{LAUDISTA_PERCENT}% Laudista</strong> · {100 - LAUDISTA_PERCENT}% Plataforma · Base R$ {EXAM_BASE_PRICE}/laudo</span>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="border-border/50">
                <CardContent className="pt-6 space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-28" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : earningsData && (
          <div className="grid sm:grid-cols-4 gap-4">
            <Card className="border-border/50 bg-gradient-to-br from-secondary/5 to-transparent">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Ganho Total</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">R$ {earningsData.total.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Este Mês</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">R$ {earningsData.thisMonth.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Laudos Assinados</p>
                <p className="text-2xl font-bold text-foreground">{earningsData.totalReports}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 border-secondary/20 bg-secondary/5">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Saldo Disponível</p>
                <p className="text-2xl font-bold text-secondary tabular-nums">R$ {earningsData.available.toFixed(2)}</p>
                <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="mt-2 text-xs gap-1 w-full border-secondary/30 text-secondary hover:bg-secondary/10 rounded-xl">
                      <ArrowUpRight className="w-3 h-3" /> Solicitar Saque
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Solicitar Saque</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Saldo disponível: <strong className="text-foreground">R$ {earningsData.available.toFixed(2)}</strong></p>
                      <p className="text-xs text-muted-foreground">Valor mínimo: R$ {MIN_WITHDRAWAL.toFixed(2)} · Processamento em 3-5 dias úteis</p>
                      <div>
                        <label className="text-xs font-medium text-foreground">Valor do saque (R$) *</label>
                        <Input type="number" placeholder={`Mín. ${MIN_WITHDRAWAL.toFixed(2)}`} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} min={MIN_WITHDRAWAL} max={earningsData.available} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground">Chave PIX *</label>
                        <Input placeholder="CPF, e-mail ou telefone" value={pixKey} onChange={e => setPixKey(e.target.value)} />
                      </div>
                      <Button className="w-full bg-gradient-to-r from-secondary to-primary text-white rounded-xl" onClick={requestWithdrawal} disabled={submitting || !withdrawAmount || !pixKey.trim()}>
                        {submitting ? "Enviando..." : "Confirmar Solicitação"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chart */}
        {!isLoading && earningsData && (
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Faturamento Mensal</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={earningsData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `R$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Valor"]}
                  />
                  <Bar dataKey="valor" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Withdrawals */}
        {!isLoading && earningsData && earningsData.withdrawals.length > 0 && (
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wallet className="w-5 h-5 text-primary" /> Histórico de Saques</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {earningsData.withdrawals.map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground tabular-nums">R$ {Number(w.amount).toFixed(2)}</p>
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
      </motion.div>
    </DashboardLayout>
  );
};

export default LaudistaEarnings;
