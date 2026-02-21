import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link2, DollarSign, Users, TrendingUp, Copy, UserCog, Sparkles, Bot } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

const affiliateNav = [
  { label: "Indicações", href: "/dashboard", icon: <Link2 className="w-4 h-4" />, active: true },
  { label: "Assistente IA", href: "/dashboard/ai-assistant", icon: <Bot className="w-4 h-4" /> },
  { label: "Perfil", href: "/dashboard/profile", icon: <UserCog className="w-4 h-4" /> },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } };

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
      .select("*").eq("referrer_id", user.id).order("created_at", { ascending: false });
    const refs = data ?? [];
    setReferrals(refs);
    const converted = refs.filter(r => r.status === "converted");
    const pendingCommission = converted.filter(r => !r.commission_paid).reduce((acc, r) => acc + Number(r.commission_percent), 0);
    setStats({ total: refs.length, converted: converted.length, pendingCommission });
    const existing = refs.find(r => r.referrer_id === user.id);
    if (existing) setReferralCode(existing.referral_code);
    setLoading(false);
  };

  const generateCode = async () => {
    if (!user) return;
    const code = `REF-${user.id.slice(0, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const { error } = await supabase.from("referrals").insert({ referrer_id: user.id, referral_code: code, source: "manual" });
    if (error) { toast.error("Erro ao gerar código."); }
    else { setReferralCode(code); toast.success("Código de indicação criado!"); fetchData(); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(`${window.location.origin}?ref=${referralCode}`);
    toast.success("Link copiado!");
  };

  const monthlyData = referrals.reduce((acc: any[], r) => {
    if (r.status !== "converted" || !r.converted_at) return acc;
    const month = format(new Date(r.converted_at), "MMM/yy", { locale: ptBR });
    const existing = acc.find(a => a.month === month);
    if (existing) existing.conversoes++; else acc.push({ month, conversoes: 1 });
    return acc;
  }, []);

  const sourceData: Record<string, number> = {};
  referrals.forEach(r => { const src = r.source ?? "direto"; sourceData[src] = (sourceData[src] ?? 0) + 1; });

  return (
    <DashboardLayout title="Afiliados" nav={affiliateNav}>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl space-y-6">
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Painel de Indicações</h1>
          <p className="text-sm text-muted-foreground mt-1">Rastreie suas indicações e comissões</p>
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs gap-1.5 flex-1"
                      onClick={() => {
                        const text = `Conheça a AloClínica! Use meu link: ${window.location.origin}?ref=${referralCode}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                      }}
                    >
                      📱 WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs gap-1.5 flex-1"
                      onClick={() => {
                        const text = `Conheça a AloClínica! ${window.location.origin}?ref=${referralCode}`;
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
                      }}
                    >
                      🐦 Twitter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs gap-1.5 flex-1"
                      onClick={() => {
                        const subject = "Conheça a AloClínica";
                        const body = `Olá! Use meu link para se cadastrar: ${window.location.origin}?ref=${referralCode}`;
                        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                      }}
                    >
                      ✉️ Email
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={generateCode} className="rounded-xl">Gerar Código de Indicação</Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* KPIs with conversion rate visual */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Indicações", value: stats.total, icon: Users, color: "text-primary", bg: "bg-primary/10" },
            { label: "Convertidos", value: stats.converted, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
            { label: "Comissão", value: `${stats.pendingCommission}%`, icon: DollarSign, color: "text-warning", bg: "bg-warning/10" },
          ].map(kpi => (
            <div key={kpi.label} className="p-4 rounded-2xl bg-card border border-border/50">
              <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-2`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Conversion rate bar */}
        {stats.total > 0 && (
          <motion.div variants={fadeUp}>
            <div className="p-4 rounded-2xl bg-card border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground">Taxa de Conversão</p>
                <span className="text-sm font-bold text-foreground">{stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.total > 0 ? (stats.converted / stats.total) * 100 : 0}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {stats.converted} de {stats.total} indicações convertidas
              </p>
            </div>
          </motion.div>
        )}

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

        {/* Source breakdown */}
        {Object.keys(sourceData).length > 0 && (
          <motion.div variants={fadeUp}>
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-sm font-semibold">Origem das Indicações</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(sourceData).map(([src, count]) => (
                    <Badge key={src} variant="outline" className="text-sm py-1.5 px-3 rounded-xl">{src}: {count}</Badge>
                  ))}
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
    </DashboardLayout>
  );
};

export default AffiliateDashboard;
