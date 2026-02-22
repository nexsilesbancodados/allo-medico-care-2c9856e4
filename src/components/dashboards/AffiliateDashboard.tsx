import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link2, DollarSign, Users, TrendingUp, Copy, UserCog, Sparkles, Wallet, ArrowUpRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

const affiliateNav = [
  { label: "Indicações", href: "/dashboard", icon: <Link2 className="w-4 h-4" />, active: true },
  { label: "Perfil", href: "/dashboard/profile", icon: <UserCog className="w-4 h-4" /> },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } };

const AffiliateDashboard = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [affiliateProfile, setAffiliateProfile] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, converted: 0, totalEarnings: 0, pendingBalance: 0, paidBalance: 0 });
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPixKey, setWithdrawPixKey] = useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    // Fetch affiliate profile
    const { data: profile } = await (supabase as any).from("affiliate_profiles")
      .select("*").eq("user_id", user.id).maybeSingle();
    setAffiliateProfile(profile);
    if (profile?.pix_key) setWithdrawPixKey(profile.pix_key);

    // Fetch referrals
    const { data } = await supabase.from("referrals")
      .select("*").eq("referrer_id", user.id).order("created_at", { ascending: false });
    const refs = data ?? [];
    setReferrals(refs);
    
    // Fetch withdrawals
    const { data: wData } = await supabase.from("withdrawal_requests")
      .select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setWithdrawals(wData ?? []);

    // Calculate earnings: 2% commission
    // For now we simulate based on converted referrals
    // Each converted referral = commission on the subscription/consultation value
    const converted = refs.filter(r => r.status === "converted");
    const commissionPercent = profile?.commission_percent ?? 2;
    
    // Simulated revenue per converted referral (avg consultation R$89)
    const avgRevenue = 89;
    const totalEarnings = converted.length * avgRevenue * (commissionPercent / 100);
    const paidBalance = (wData ?? []).filter(w => w.status === "approved").reduce((acc, w) => acc + Number(w.amount), 0);
    const pendingWithdraws = (wData ?? []).filter(w => w.status === "pending").reduce((acc, w) => acc + Number(w.amount), 0);
    const pendingBalance = totalEarnings - paidBalance - pendingWithdraws;

    setStats({ 
      total: refs.length, 
      converted: converted.length, 
      totalEarnings,
      pendingBalance: Math.max(0, pendingBalance),
      paidBalance,
    });
    
    const existing = refs.find(r => r.referrer_id === user.id);
    if (existing) setReferralCode(existing.referral_code);
    setLoading(false);
  };

  const generateCode = async () => {
    if (!user) return;
    const code = `REF-${user.id.slice(0, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const { error } = await supabase.from("referrals").insert({ referrer_id: user.id, referral_code: code, source: "manual", commission_percent: 2 });
    if (error) { toast.error("Erro ao gerar código."); }
    else { setReferralCode(code); toast.success("Código de indicação criado!"); fetchData(); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(`${window.location.origin}?ref=${referralCode}`);
    toast.success("Link copiado!");
  };

  const handleWithdraw = async () => {
    if (!user || !withdrawAmount || Number(withdrawAmount) <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    if (Number(withdrawAmount) > stats.pendingBalance) {
      toast.error("Saldo insuficiente.");
      return;
    }
    if (!withdrawPixKey.trim()) {
      toast.error("Informe sua chave PIX.");
      return;
    }
    setSubmittingWithdraw(true);
    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user.id,
      amount: Number(withdrawAmount),
      pix_key: withdrawPixKey,
      status: "pending",
    });
    setSubmittingWithdraw(false);
    if (error) {
      toast.error("Erro ao solicitar saque.");
    } else {
      toast.success("Solicitação de saque enviada! O administrador irá processar.");
      setShowWithdrawDialog(false);
      setWithdrawAmount("");
      fetchData();
    }
  };

  const monthlyData = referrals.reduce((acc: any[], r) => {
    if (r.status !== "converted" || !r.converted_at) return acc;
    const month = format(new Date(r.converted_at), "MMM/yy", { locale: ptBR });
    const existing = acc.find(a => a.month === month);
    if (existing) existing.conversoes++; else acc.push({ month, conversoes: 1 });
    return acc;
  }, []);

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <DashboardLayout title="Afiliados" nav={affiliateNav}>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl space-y-6">
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Painel de Afiliado</h1>
          <p className="text-sm text-muted-foreground mt-1">Comissão de {affiliateProfile?.commission_percent ?? 2}% sobre ganhos dos indicados</p>
        </motion.div>

        {/* Referral code */}
        <motion.div variants={fadeUp}>
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-foreground mb-3">Seu Link de Indicação</p>
              {referralCode ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input value={`${window.location.origin}?ref=${referralCode}`} readOnly className="font-mono text-sm rounded-xl" />
                    <Button variant="outline" onClick={copyCode} className="rounded-xl gap-1.5">
                      <Copy className="w-4 h-4" /> Copiar
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 flex-1"
                      onClick={() => {
                        const text = `Conheça a AloClínica! Use meu link: ${window.location.origin}?ref=${referralCode}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                      }}>📱 WhatsApp</Button>
                    <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 flex-1"
                      onClick={() => {
                        const text = `Conheça a AloClínica! ${window.location.origin}?ref=${referralCode}`;
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
                      }}>🐦 Twitter</Button>
                    <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 flex-1"
                      onClick={() => {
                        const subject = "Conheça a AloClínica";
                        const body = `Olá! Use meu link para se cadastrar: ${window.location.origin}?ref=${referralCode}`;
                        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                      }}>✉️ Email</Button>
                  </div>
                </div>
              ) : (
                <Button onClick={generateCode} className="rounded-xl">Gerar Código de Indicação</Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* KPIs */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Indicações", value: String(stats.total), icon: Users, color: "text-primary", bg: "bg-primary/10" },
            { label: "Convertidos", value: String(stats.converted), icon: TrendingUp, color: "text-secondary", bg: "bg-secondary/10" },
            { label: "Ganhos Totais", value: formatCurrency(stats.totalEarnings), icon: DollarSign, color: "text-success", bg: "bg-success/10" },
            { label: "Saldo Disponível", value: formatCurrency(stats.pendingBalance), icon: Wallet, color: "text-warning", bg: "bg-warning/10" },
          ].map(kpi => (
            <div key={kpi.label} className="p-4 rounded-2xl bg-card border border-border/50">
              <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-2`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Withdraw button */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Solicitar Saque</p>
                <p className="text-sm text-muted-foreground">Saldo disponível: {formatCurrency(stats.pendingBalance)}</p>
              </div>
              <Button 
                onClick={() => setShowWithdrawDialog(true)} 
                disabled={stats.pendingBalance <= 0}
                className="gap-2"
              >
                <ArrowUpRight className="w-4 h-4" /> Sacar via PIX
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Conversion chart */}
        {monthlyData.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-sm font-semibold">Conversões por Mês</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="conversoes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Conversões" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Withdrawal history */}
        {withdrawals.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-sm font-semibold">Histórico de Saques</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs">Valor</TableHead>
                        <TableHead className="text-xs">PIX</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map(w => (
                        <TableRow key={w.id} className="hover:bg-muted/20">
                          <TableCell className="font-semibold text-foreground">{formatCurrency(Number(w.amount))}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{w.pix_key}</TableCell>
                          <TableCell>
                            <Badge variant={w.status === "approved" ? "default" : w.status === "rejected" ? "destructive" : "secondary"}>
                              {w.status === "approved" ? "✅ Pago" : w.status === "rejected" ? "❌ Rejeitado" : "⏳ Pendente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{format(new Date(w.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Referrals table */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-sm font-semibold">Todas as Indicações</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground">Carregando...</p> : referrals.length === 0 ? (
                <div className="text-center py-10">
                  <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma indicação ainda. Compartilhe seu link!</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs">Código</TableHead>
                        <TableHead className="text-xs">Origem</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Comissão</TableHead>
                        <TableHead className="text-xs">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referrals.map(r => (
                        <TableRow key={r.id} className="hover:bg-muted/20">
                          <TableCell className="font-mono text-sm text-foreground">{r.referral_code}</TableCell>
                          <TableCell className="text-muted-foreground">{r.source ?? "direto"}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === "converted" ? "default" : r.status === "expired" ? "destructive" : "secondary"}>
                              {r.status === "converted" ? "Convertido" : r.status === "expired" ? "Expirado" : "Pendente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.status === "converted" ? formatCurrency(89 * ((affiliateProfile?.commission_percent ?? 2) / 100)) : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Solicitar Saque
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-muted/50 text-sm">
              <p className="text-muted-foreground">Saldo disponível: <strong className="text-foreground">{formatCurrency(stats.pendingBalance)}</strong></p>
            </div>
            <div>
              <Label>Valor do saque (R$)</Label>
              <Input 
                type="number" 
                value={withdrawAmount} 
                onChange={e => setWithdrawAmount(e.target.value)} 
                placeholder="0,00" 
                className="mt-1"
                max={stats.pendingBalance}
                min={1}
                step="0.01"
              />
            </div>
            <div>
              <Label>Chave PIX</Label>
              <Input 
                value={withdrawPixKey} 
                onChange={e => setWithdrawPixKey(e.target.value)} 
                placeholder="CPF, email, telefone ou chave aleatória" 
                className="mt-1" 
              />
            </div>
            <Button onClick={handleWithdraw} disabled={submittingWithdraw} className="w-full">
              {submittingWithdraw ? "Enviando..." : "Confirmar Solicitação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AffiliateDashboard;
