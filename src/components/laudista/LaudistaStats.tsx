import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getLaudistaNav } from "@/components/laudista/laudistaNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart2, TrendingUp, Clock, CheckCircle2, Target, Zap, Activity,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { motion } from "framer-motion";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--accent))",
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

const LaudistaStats = () => {
  const { user } = useAuth();

  const { data: doctorProfile } = useQuery({
    queryKey: ["laudista-doctor-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: reports, isLoading } = useQuery({
    queryKey: ["laudista-full-stats-reports", doctorProfile?.id],
    queryFn: async () => {
      const dpId = doctorProfile!.id;
      const { data, error } = await supabase
        .from("exam_reports")
        .select("id, created_at, signed_at, exam_request_id")
        .eq("reporter_id", dpId)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!doctorProfile?.id,
  });

  const { data: examRequests } = useQuery({
    queryKey: ["laudista-stats-exam-requests", doctorProfile?.id],
    queryFn: async () => {
      const dpId = doctorProfile!.id;
      const { data, error } = await supabase
        .from("exam_requests")
        .select("id, exam_type, created_at, started_at, completed_at, status, assigned_to")
        .eq("assigned_to", dpId)
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!doctorProfile?.id,
  });

  // Computed stats
  const stats = useMemo(() => {
    if (!reports) return null;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getTime() - now.getDay() * 86400000);
    const signed = reports.filter(r => r.signed_at);
    const thisMonth = reports.filter(r => new Date(r.created_at) >= startOfMonth);
    const thisWeek = reports.filter(r => new Date(r.created_at) >= startOfWeek);

    return {
      total: reports.length,
      signed: signed.length,
      thisMonth: thisMonth.length,
      thisWeek: thisWeek.length,
    };
  }, [reports]);

  // Daily chart (last 30 days)
  const dailyChart = useMemo(() => {
    if (!reports) return [];
    const now = new Date();
    const days: { date: string; laudos: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = startOfDay(subDays(now, i));
      const nextDay = startOfDay(subDays(now, i - 1));
      const count = reports.filter(r => {
        const d = new Date(r.created_at);
        return d >= day && d < nextDay;
      }).length;
      days.push({ date: format(day, "dd/MM", { locale: ptBR }), laudos: count });
    }
    return days;
  }, [reports]);

  // Average turnaround time
  const avgTurnaround = useMemo(() => {
    if (!examRequests) return null;
    const completed = examRequests.filter(e => e.started_at && e.completed_at);
    if (completed.length === 0) return null;
    const totalMin = completed.reduce((sum, e) => {
      return sum + differenceInMinutes(new Date(e.completed_at!), new Date(e.started_at!));
    }, 0);
    const avg = totalMin / completed.length;
    if (avg < 60) return `${Math.round(avg)} min`;
    return `${(avg / 60).toFixed(1)}h`;
  }, [examRequests]);

  // Modality ranking
  const modalityRanking = useMemo(() => {
    if (!examRequests) return [];
    const counts: Record<string, number> = {};
    examRequests.forEach(e => {
      const key = e.exam_type || "Outros";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [examRequests]);

  const kpis = [
    { label: "Total de Laudos", value: stats?.total ?? 0, icon: BarChart2, color: "from-primary to-secondary" },
    { label: "Este Mês", value: stats?.thisMonth ?? 0, icon: TrendingUp, color: "from-success to-success/70" },
    { label: "Esta Semana", value: stats?.thisWeek ?? 0, icon: Clock, color: "from-warning to-warning/70" },
    { label: "Assinados", value: stats?.signed ?? 0, icon: CheckCircle2, color: "from-secondary to-primary" },
  ];

  return (
    <DashboardLayout nav={getLaudistaNav("stats")} title="Estatísticas" role="doctor">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        className="max-w-5xl space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeUp}>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            Estatísticas de Laudos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Visão completa do seu desempenho</p>
        </motion.div>

        {/* KPIs */}
        <motion.div variants={fadeUp}>
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07, type: "spring", stiffness: 200, damping: 15 }}
                >
                  <Card variant="kpi" className="overflow-hidden">
                    <CardContent className="p-5">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center mb-3 shadow-md`}>
                        <kpi.icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-3xl font-black text-foreground tabular-nums">{kpi.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Tempo Médio */}
        {avgTurnaround && (
          <motion.div variants={fadeUp}>
            <Card variant="kpi">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Tempo Médio de Laudo</p>
                  <p className="text-2xl font-black text-primary tabular-nums">{avgTurnaround}</p>
                  <p className="text-[10px] text-muted-foreground">Do início à assinatura</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Daily Chart - 30 days */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-white" />
                </div>
                Laudos por Dia (últimos 30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] w-full rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={dailyChart}>
                    <defs>
                      <linearGradient id="colorLaudos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      interval={4}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                      formatter={(v: number) => [v, "Laudos"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="laudos"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorLaudos)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Modality Ranking */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pie Chart */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-success to-success/70 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5 text-white" />
                  </div>
                  Distribuição por Modalidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading || modalityRanking.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                    {isLoading ? <Skeleton className="h-[200px] w-[200px] rounded-full" /> : "Sem dados ainda"}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={modalityRanking}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {modalityRanking.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                        formatter={(v: number, name: string) => [v, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Ranking list */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-warning to-warning/70 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-white" />
                  </div>
                  Ranking por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
                  </div>
                ) : modalityRanking.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Sem dados ainda</p>
                ) : (
                  <div className="space-y-2">
                    {modalityRanking.map((item, i) => {
                      const maxVal = modalityRanking[0]?.value || 1;
                      const pct = (item.value / maxVal) * 100;
                      return (
                        <div key={item.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors">
                          <span className="text-xs font-bold text-muted-foreground w-5 text-right tabular-nums">{i + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                            <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: COLORS[i % COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] h-5 px-2 tabular-nums shrink-0">
                            {item.value}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default LaudistaStats;
