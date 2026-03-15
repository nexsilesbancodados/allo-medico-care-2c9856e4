import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "./adminNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, Search, Download,
  CreditCard, Receipt, Clock, CheckCircle2, XCircle, RefreshCw
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart } from "recharts";

const adminNav = getAdminNav("financial");

interface AppointmentPayment {
  id: string;
  status: string;
  payment_status: string | null;
  scheduled_at: string;
  created_at: string;
  payment_confirmed_at: string | null;
  cancel_reason: string | null;
  doctor_id: string;
  patient_id: string | null;
  guest_patient_id: string | null;
  doctor_name?: string;
  patient_name?: string;
  consultation_price?: number;
  price_at_booking?: number | null;
}

const statusColors: Record<string, string> = {
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  cancelled: "bg-red-500/10 text-red-600 border-red-200",
  refunded: "bg-purple-500/10 text-purple-600 border-purple-200",
  overdue: "bg-orange-500/10 text-orange-600 border-orange-200",
  confirmed: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

const statusLabels: Record<string, string> = {
  approved: "Aprovado",
  pending: "Pendente",
  cancelled: "Cancelado",
  refunded: "Estornado",
  overdue: "Vencido",
  confirmed: "Confirmado",
  scheduled: "Agendado",
  completed: "Concluído",
  in_progress: "Em andamento",
};

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#ef4444", "#8b5cf6"];

const AdminFinancial = () => {
  const [appointments, setAppointments] = useState<AppointmentPayment[]>([]);
  const [commissionData, setCommissionData] = useState<{ doctor_name: string; count: number; revenue: number; commission: number }[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; revenue: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<string>("30");

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const { data: appts } = await supabase
      .from("appointments")
      .select("id, status, payment_status, scheduled_at, created_at, payment_confirmed_at, cancel_reason, doctor_id, patient_id, guest_patient_id")
      .gte("created_at", daysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(500);

    if (!appts) { setLoading(false); return; }

    // Fetch doctor names and prices
    const doctorIds = [...new Set(appts.map(a => a.doctor_id))];
    const { data: docProfiles } = await supabase
      .from("doctor_profiles")
      .select("id, user_id, consultation_price")
      .in("id", doctorIds);
    const docPriceMap = new Map(docProfiles?.map(d => [d.id, Number(d.consultation_price) || 89]) ?? []);

    const userIds = [...new Set([
      ...(docProfiles?.map(d => d.user_id) ?? []),
      ...appts.filter(a => a.patient_id).map(a => a.patient_id!),
    ])];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, `${p.first_name} ${p.last_name}`]) ?? []);
    const docUserMap = new Map(docProfiles?.map(d => [d.id, d.user_id]) ?? []);

    // Fetch guest patient names
    const guestIds = appts.filter(a => a.guest_patient_id).map(a => a.guest_patient_id!);
    let guestMap = new Map<string, string>();
    if (guestIds.length > 0) {
      const { data: guests } = await supabase
        .from("guest_patients")
        .select("id, full_name")
        .in("id", guestIds);
      guestMap = new Map(guests?.map(g => [g.id, g.full_name]) ?? []);
    }

    const enriched: AppointmentPayment[] = appts.map(a => ({
      ...a,
      consultation_price: docPriceMap.get(a.doctor_id) ?? 89,
      doctor_name: profileMap.get(docUserMap.get(a.doctor_id) ?? "") ?? "—",
      patient_name: a.patient_id
        ? profileMap.get(a.patient_id) ?? "—"
        : a.guest_patient_id
          ? guestMap.get(a.guest_patient_id) ?? "Convidado"
          : "—",
    }));

    setAppointments(enriched);

    // Calculate commission breakdown per doctor
    const doctorRevenue = new Map<string, { name: string; count: number; revenue: number }>();
    enriched.forEach(a => {
      if (a.payment_status === "approved" || a.payment_status === "confirmed") {
        const price = a.consultation_price ?? 89;
        const existing = doctorRevenue.get(a.doctor_id) || { name: a.doctor_name || "—", count: 0, revenue: 0 };
        existing.count++;
        existing.revenue += price;
        doctorRevenue.set(a.doctor_id, existing);
      }
    });
    setCommissionData(
      Array.from(doctorRevenue.values())
        .map(d => ({ doctor_name: d.name, count: d.count, revenue: d.revenue, commission: d.revenue * 0.5 }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
    );

    // Monthly trend (last 6 months)
    const months: { month: string; revenue: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = format(d, "yyyy-MM");
      const monthLabel = format(d, "MMM/yy", { locale: ptBR });
      const monthAppts = enriched.filter(a => a.created_at.startsWith(monthKey) && (a.payment_status === "approved" || a.payment_status === "confirmed"));
      const monthRevenue = monthAppts.reduce((sum, a) => sum + (a.consultation_price ?? 89), 0);
      months.push({ month: monthLabel, revenue: monthRevenue, count: monthAppts.length });
    }
    setMonthlyTrend(months);

    setLoading(false);
  };

  // KPIs
  const totalRevenue = appointments
    .filter(a => a.payment_status === "approved" || a.payment_status === "confirmed")
    .reduce((sum, a) => sum + (a.consultation_price ?? 89), 0);

  const pendingPayments = appointments.filter(a => a.payment_status === "pending").length;
  const overduePayments = appointments.filter(a => a.payment_status === "overdue").length;
  const confirmedPayments = appointments.filter(a => a.payment_status === "approved" || a.payment_status === "confirmed").length;
  const cancelledPayments = appointments.filter(a => a.status === "cancelled").length;
  const totalAppointments = appointments.length;

  // Charts
  const paymentStatusData = [
    { name: "Confirmados", value: confirmedPayments },
    { name: "Pendentes", value: pendingPayments },
    { name: "Vencidos", value: overduePayments },
    { name: "Cancelados", value: cancelledPayments },
  ].filter(d => d.value > 0);

  // Daily revenue (last 7 days)
  const last7days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const dailyData = last7days.map(day => {
    const dayStr = format(day, "yyyy-MM-dd");
    const count = appointments.filter(a =>
      a.created_at.startsWith(dayStr) &&
      (a.payment_status === "approved" || a.payment_status === "confirmed")
    ).length;
    return {
      day: format(day, "dd/MM", { locale: ptBR }),
      receita: count * 89.9,
      consultas: count,
    };
  });

  // Filtered list
  const filtered = appointments.filter(a => {
    if (filter !== "all") {
      if (filter === "paid" && a.payment_status !== "approved" && a.payment_status !== "confirmed") return false;
      if (filter === "pending" && a.payment_status !== "pending") return false;
      if (filter === "overdue" && a.payment_status !== "overdue") return false;
      if (filter === "cancelled" && a.status !== "cancelled") return false;
    }
    if (search) {
      const s = search.toLowerCase();
      return (
        a.doctor_name?.toLowerCase().includes(s) ||
        a.patient_name?.toLowerCase().includes(s) ||
        a.id.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const exportCSV = () => {
    // BOM for Excel to recognize UTF-8 encoding correctly
    const BOM = "\uFEFF";
    const headers = "ID,Paciente,Médico,Data,Status,Pagamento,Valor\n";
    const rows = filtered.map(a => {
      const date = format(new Date(a.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR });
      const status = statusLabels[a.status] ?? a.status;
      const payment = statusLabels[a.payment_status ?? "pending"] ?? a.payment_status ?? "";
      const price = a.price_at_booking != null ? `R$ ${Number(a.price_at_booking).toFixed(2)}` : "";
      // Escape fields that may contain commas or quotes
      const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
      return [escape(a.id), escape(a.patient_name ?? ""), escape(a.doctor_name ?? ""), date, status, payment, price].join(",");
    }).join("\n");
    const csv = BOM + headers + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `financeiro_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Clean up object URL after download
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  return (
    <DashboardLayout title="Admin" nav={adminNav}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tabular-nums">Painel Financeiro</h1>
            <p className="text-sm text-muted-foreground">Receita, pagamentos e inadimplência</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchData} aria-label="Atualizar">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Receita Estimada
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> {confirmedPayments} pagos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="w-4 h-4 text-amber-500" />
                Pendentes
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{pendingPayments}</p>
              <p className="text-xs text-muted-foreground mt-1">aguardando pagamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Inadimplentes
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{overduePayments}</p>
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <TrendingDown className="w-3 h-3" /> vencidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Receipt className="w-4 h-4 text-primary" />
                Total Consultas
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{totalAppointments}</p>
              <p className="text-xs text-muted-foreground mt-1">no período</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Receita Diária (7 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Receita"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                    />
                    <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status dos Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                {paymentStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {paymentStatusData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Nenhum dado disponível
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend + Commission Breakdown */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Tendência Mensal (6 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === "revenue" ? `R$ ${value.toFixed(2)}` : value,
                          name === "revenue" ? "Receita" : "Consultas"
                        ]}
                        contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Comissões por Médico (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] overflow-y-auto">
                {commissionData.length > 0 ? (
                  <div className="space-y-2">
                    {commissionData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-primary w-5">{i + 1}.</span>
                          <span className="text-sm font-medium truncate">{d.doctor_name}</span>
                          <Badge variant="outline" className="text-[10px] shrink-0">{d.count} consultas</Badge>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">R$ {d.commission.toFixed(0)}</p>
                          <p className="text-[10px] text-muted-foreground">de R$ {d.revenue.toFixed(0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base">Transações</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 w-[200px]"
                  />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="paid">Pagos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="overdue">Vencidos</SelectItem>
                    <SelectItem value="cancelled">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Nenhuma transação encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice(0, 100).map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.patient_name}</TableCell>
                        <TableCell>{a.doctor_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(a.created_at), "dd/MM/yy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[a.status] || ""}>
                            {statusLabels[a.status] || a.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[a.payment_status || "pending"] || ""}>
                            {a.payment_status === "approved" || a.payment_status === "confirmed" ? (
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                            ) : a.payment_status === "overdue" ? (
                              <AlertTriangle className="w-3 h-3 mr-1" />
                            ) : a.status === "cancelled" ? (
                              <XCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {statusLabels[a.payment_status || "pending"] || a.payment_status || "Pendente"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filtered.length > 100 && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Mostrando 100 de {filtered.length} resultados
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminFinancial;
