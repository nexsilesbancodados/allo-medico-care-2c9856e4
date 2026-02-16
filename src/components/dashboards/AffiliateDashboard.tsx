import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link2, DollarSign, Users, TrendingUp, Copy, UserCog } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const affiliateNav = [
  { label: "Indicações", href: "/dashboard", icon: <Link2 className="w-4 h-4" />, active: true },
  { label: "Perfil", href: "/dashboard/profile", icon: <UserCog className="w-4 h-4" /> },
];

const AffiliateDashboard = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, converted: 0, pendingCommission: 0 });
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const { data } = await supabase.from("referrals")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    const refs = data ?? [];
    setReferrals(refs);

    const converted = refs.filter(r => r.status === "converted");
    const pendingCommission = converted.filter(r => !r.commission_paid)
      .reduce((acc, r) => acc + Number(r.commission_percent), 0);

    setStats({
      total: refs.length,
      converted: converted.length,
      pendingCommission,
    });

    // Check if user has a referral code
    const existing = refs.find(r => r.referrer_id === user.id);
    if (existing) {
      setReferralCode(existing.referral_code);
    }

    setLoading(false);
  };

  const generateCode = async () => {
    if (!user) return;
    const code = `REF-${user.id.slice(0, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const { error } = await supabase.from("referrals").insert({
      referrer_id: user.id,
      referral_code: code,
      source: "manual",
    });
    if (error) {
      toast.error("Erro ao gerar código.");
    } else {
      setReferralCode(code);
      toast.success("Código de indicação criado!");
      fetchData();
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(`${window.location.origin}?ref=${referralCode}`);
    toast.success("Link copiado!");
  };

  // Monthly conversion chart
  const monthlyData = referrals.reduce((acc: any[], r) => {
    if (r.status !== "converted" || !r.converted_at) return acc;
    const month = format(new Date(r.converted_at), "MMM/yy", { locale: ptBR });
    const existing = acc.find(a => a.month === month);
    if (existing) existing.conversoes++;
    else acc.push({ month, conversoes: 1 });
    return acc;
  }, []);

  const sourceData: Record<string, number> = {};
  referrals.forEach(r => {
    const src = r.source ?? "direto";
    sourceData[src] = (sourceData[src] ?? 0) + 1;
  });

  return (
    <DashboardLayout title="Afiliados" nav={affiliateNav}>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Painel de Indicações</h1>
        <p className="text-muted-foreground mb-6">Rastreie suas indicações e comissões</p>

        {/* Referral code */}
        <Card className="border-primary/30 bg-primary/5 mb-6">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-foreground mb-2">Seu Link de Indicação</p>
            {referralCode ? (
              <div className="flex gap-2">
                <Input value={`${window.location.origin}?ref=${referralCode}`} readOnly className="font-mono text-sm" />
                <Button variant="outline" onClick={copyCode}>
                  <Copy className="w-4 h-4 mr-1" /> Copiar
                </Button>
              </div>
            ) : (
              <Button onClick={generateCode}>Gerar Código de Indicação</Button>
            )}
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-border">
            <CardContent className="pt-6 text-center">
              <Users className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Indicações</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-1 text-secondary" />
              <p className="text-2xl font-bold text-foreground">{stats.converted}</p>
              <p className="text-xs text-muted-foreground">Convertidos</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6 text-center">
              <DollarSign className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold text-foreground">{stats.pendingCommission}%</p>
              <p className="text-xs text-muted-foreground">Comissão Pendente</p>
            </CardContent>
          </Card>
        </div>

        {/* Conversion chart */}
        {monthlyData.length > 0 && (
          <Card className="border-border mb-6">
            <CardHeader><CardTitle className="text-lg">Conversões por Mês</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="conversoes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Conversões" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Source breakdown */}
        {Object.keys(sourceData).length > 0 && (
          <Card className="border-border mb-6">
            <CardHeader><CardTitle className="text-lg">Origem das Indicações</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(sourceData).map(([src, count]) => (
                  <Badge key={src} variant="outline" className="text-sm py-1 px-3">
                    {src}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Referrals table */}
        <Card className="border-border">
          <CardHeader><CardTitle className="text-lg">Todas as Indicações</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground">Carregando...</p> : referrals.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma indicação ainda. Compartilhe seu link!</p>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-sm text-foreground">{r.referral_code}</TableCell>
                        <TableCell className="text-muted-foreground">{r.source ?? "direto"}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === "converted" ? "default" : r.status === "expired" ? "destructive" : "secondary"}>
                            {r.status === "converted" ? "Convertido" : r.status === "expired" ? "Expirado" : "Pendente"}
                          </Badge>
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
      </div>
    </DashboardLayout>
  );
};

export default AffiliateDashboard;
