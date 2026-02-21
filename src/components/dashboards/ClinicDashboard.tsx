import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, BarChart3, Settings, Stethoscope, Clock, DollarSign, TrendingUp, FileText } from "lucide-react";
import { format, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import BlobKPICard from "@/components/ui/blob-kpi-card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const getClinicNav = (active: string) => [
  { label: "Visão Geral", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" />, active: active === "overview" },
  { label: "Médicos", href: "/dashboard/clinic/doctors", icon: <Stethoscope className="w-4 h-4" />, active: active === "doctors" },
  { label: "Agendamentos", href: "/dashboard/clinic/schedules", icon: <Calendar className="w-4 h-4" />, active: active === "schedules" },
  { label: "Financeiro", href: "/dashboard/clinic/finance", icon: <DollarSign className="w-4 h-4" />, active: active === "finance" },
  { label: "Relatórios", href: "/dashboard/clinic/reports", icon: <FileText className="w-4 h-4" />, active: active === "reports" },
  { label: "Perfil", href: "/dashboard/profile", icon: <Settings className="w-4 h-4" /> },
];

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--destructive))"];

const ClinicDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clinicProfile, setClinicProfile] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);

    const { data: clinic } = await supabase
      .from("clinic_profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single();

    setClinicProfile(clinic);
    if (!clinic) { setLoading(false); return; }

    const { data: affiliations } = await supabase
      .from("clinic_affiliations")
      .select("*, doctor_profiles(*, profiles(first_name, last_name))")
      .eq("clinic_id", clinic.id);

    setDoctors(affiliations ?? []);

    const doctorIds = (affiliations ?? []).map((a: any) => a.doctor_id);
    if (doctorIds.length > 0) {
      const { data: appts } = await supabase
        .from("appointments")
        .select("*, doctor_profiles(consultation_price)")
        .in("doctor_id", doctorIds)
        .gte("scheduled_at", subMonths(new Date(), 6).toISOString())
        .order("scheduled_at", { ascending: false });
      setAppointments(appts ?? []);
    }

    setLoading(false);
  };

  const now = new Date();
  const monthStart = startOfMonth(now);
  const thisMonthAppts = appointments.filter(a => new Date(a.scheduled_at) >= monthStart);
  const completed = thisMonthAppts.filter(a => a.status === "completed");
  const revenue = completed.reduce((sum, a) => sum + (a.doctor_profiles?.consultation_price ?? 89), 0);
  const activeDoctors = doctors.filter(d => d.status === "active").length;
  const totalSlots = activeDoctors * 20;
  const occupancy = totalSlots > 0 ? Math.round((thisMonthAppts.length / totalSlots) * 100) : 0;

  const upcomingAppts = appointments
    .filter(a => new Date(a.scheduled_at) >= now && a.status !== "cancelled")
    .slice(0, 5);

  // Monthly chart data (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const ms = startOfMonth(month);
    const me = startOfMonth(subMonths(now, 4 - i));
    const ma = appointments.filter(a => {
      const d = new Date(a.scheduled_at);
      return d >= ms && (i < 5 ? d < me : true);
    });
    return {
      month: format(month, "MMM", { locale: ptBR }),
      consultas: ma.length,
      receita: ma.filter(a => a.status === "completed").reduce((s, a) => s + (a.doctor_profiles?.consultation_price ?? 89), 0),
    };
  });

  // Doctor performance
  const doctorPerformance = doctors.filter(d => d.status === "active").map(d => {
    const profile = d.doctor_profiles?.profiles;
    const name = profile ? `Dr(a). ${profile.first_name}` : "Médico";
    const docAppts = appointments.filter(a => a.doctor_id === d.doctor_id);
    return { name, consultas: docAppts.length, completadas: docAppts.filter(a => a.status === "completed").length };
  }).sort((a, b) => b.consultas - a.consultas);

  // Status pie
  const statusCounts = [
    { name: "Concluídas", value: appointments.filter(a => a.status === "completed").length },
    { name: "Agendadas", value: appointments.filter(a => a.status === "scheduled").length },
    { name: "Canceladas", value: appointments.filter(a => a.status === "cancelled").length },
  ].filter(s => s.value > 0);

  const SkeletonCard = () => (
    <Card className="border-border">
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Clínica" nav={getClinicNav("overview")} role="clinic">
      <div className="max-w-5xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {clinicProfile?.name ?? "Minha Clínica"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Painel de gestão completo</p>
        </div>

        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
            <BlobKPICard variant={0} label="Médicos Ativos" value={activeDoctors} icon={<Users className="w-5 h-5" />} color="primary" delay={0} />
            <BlobKPICard variant={1} label="Consultas do Mês" value={thisMonthAppts.length} icon={<Calendar className="w-5 h-5" />} color="secondary" delay={0.08} />
            <BlobKPICard variant={2} label="Receita do Mês" value={`R$ ${revenue.toLocaleString("pt-BR")}`} icon={<DollarSign className="w-5 h-5" />} color="success" delay={0.12} />
            <BlobKPICard variant={3} label="Ocupação" value={`${occupancy}%`} icon={<TrendingUp className="w-5 h-5" />} color="primary" delay={0.16} />
          </div>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto sm:mx-0">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Visão Geral</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs sm:text-sm">Performance</TabsTrigger>
            <TabsTrigger value="finance" className="text-xs sm:text-sm">Financeiro</TabsTrigger>
          </TabsList>

          {/* Overview tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Upcoming appointments */}
              <Card className="border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Próximas Consultas
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/clinic/schedules")}>Ver todas</Button>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                  ) : upcomingAppts.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">Nenhuma consulta agendada.</p>
                  ) : (
                    <div className="space-y-2">
                      {upcomingAppts.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {format(new Date(a.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">{a.appointment_type ?? "consulta"}</p>
                          </div>
                          <Badge variant={a.status === "confirmed" ? "default" : "secondary"} className="text-xs">
                            {a.status === "confirmed" ? "Confirmado" : a.status === "scheduled" ? "Agendado" : a.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Doctors list */}
              <Card className="border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-primary" /> Médicos Vinculados
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/clinic/doctors")}>Gerenciar</Button>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                  ) : doctors.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">Nenhum médico vinculado.</p>
                  ) : (
                    <div className="space-y-2">
                      {doctors.map((d: any) => {
                        const profile = d.doctor_profiles?.profiles;
                        const name = profile ? `${profile.first_name} ${profile.last_name}` : "Médico";
                        return (
                          <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                            <div>
                              <p className="text-sm font-medium text-foreground">{name}</p>
                              <p className="text-xs text-muted-foreground">CRM: {d.doctor_profiles?.crm ?? "—"}</p>
                            </div>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${d.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}`}>
                              {d.status === "active" ? "Ativo" : "Pendente"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Status distribution */}
            {statusCounts.length > 0 && (
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Distribuição de Status</CardTitle></CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {statusCounts.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Performance tab */}
          <TabsContent value="performance" className="space-y-4 mt-4">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base">Consultas por Mês</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="consultas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {doctorPerformance.length > 0 && (
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Ranking de Médicos</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {doctorPerformance.map((doc, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                        <span className="text-lg font-bold text-primary w-8 text-center">#{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.completadas} concluídas de {doc.consultas} total</p>
                        </div>
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${doc.consultas > 0 ? (doc.completadas / doc.consultas) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Finance tab */}
          <TabsContent value="finance" className="space-y-4 mt-4">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base">Receita Mensal</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${v}`} />
                    <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]} />
                    <Bar dataKey="receita" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">R$ {revenue.toLocaleString("pt-BR")}</p>
                  <p className="text-xs text-muted-foreground mt-1">Receita este mês</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{completed.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Consultas concluídas</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    R$ {completed.length > 0 ? Math.round(revenue / completed.length).toLocaleString("pt-BR") : "0"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Ticket médio</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ClinicDashboard;
