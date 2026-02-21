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
import { Users, Calendar, BarChart3, Settings, Stethoscope, Clock, DollarSign, TrendingUp, FileText, Sparkles } from "lucide-react";
import { format, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

const getClinicNav = (active: string) => [
  { label: "Visão Geral", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" />, active: active === "overview" },
  { label: "Médicos", href: "/dashboard/clinic/doctors", icon: <Stethoscope className="w-4 h-4" />, active: active === "doctors" },
  { label: "Agendamentos", href: "/dashboard/clinic/schedules", icon: <Calendar className="w-4 h-4" />, active: active === "schedules" },
  { label: "Financeiro", href: "/dashboard/clinic/finance", icon: <DollarSign className="w-4 h-4" />, active: active === "finance" },
  { label: "Relatórios", href: "/dashboard/clinic/reports", icon: <FileText className="w-4 h-4" />, active: active === "reports" },
  { label: "Perfil", href: "/dashboard/profile", icon: <Settings className="w-4 h-4" /> },
];

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--destructive))"];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } };

const ClinicDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clinicProfile, setClinicProfile] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const { data: clinic } = await supabase.from("clinic_profiles").select("*").eq("user_id", user!.id).single();
    setClinicProfile(clinic);
    if (!clinic) { setLoading(false); return; }
    const { data: affiliations } = await supabase.from("clinic_affiliations").select("*, doctor_profiles(*, profiles(first_name, last_name))").eq("clinic_id", clinic.id);
    setDoctors(affiliations ?? []);
    const doctorIds = (affiliations ?? []).map((a: any) => a.doctor_id);
    if (doctorIds.length > 0) {
      const { data: appts } = await supabase.from("appointments").select("*, doctor_profiles(consultation_price)").in("doctor_id", doctorIds).gte("scheduled_at", subMonths(new Date(), 6).toISOString()).order("scheduled_at", { ascending: false });
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
  const upcomingAppts = appointments.filter(a => new Date(a.scheduled_at) >= now && a.status !== "cancelled").slice(0, 5);

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const ms = startOfMonth(month);
    const me = startOfMonth(subMonths(now, 4 - i));
    const ma = appointments.filter(a => { const d = new Date(a.scheduled_at); return d >= ms && (i < 5 ? d < me : true); });
    return { month: format(month, "MMM", { locale: ptBR }), consultas: ma.length, receita: ma.filter(a => a.status === "completed").reduce((s, a) => s + (a.doctor_profiles?.consultation_price ?? 89), 0) };
  });

  const doctorPerformance = doctors.filter(d => d.status === "active").map(d => {
    const profile = d.doctor_profiles?.profiles;
    const name = profile ? `Dr(a). ${profile.first_name}` : "Médico";
    const docAppts = appointments.filter(a => a.doctor_id === d.doctor_id);
    return { name, consultas: docAppts.length, completadas: docAppts.filter(a => a.status === "completed").length };
  }).sort((a, b) => b.consultas - a.consultas);

  const statusCounts = [
    { name: "Concluídas", value: appointments.filter(a => a.status === "completed").length },
    { name: "Agendadas", value: appointments.filter(a => a.status === "scheduled").length },
    { name: "Canceladas", value: appointments.filter(a => a.status === "cancelled").length },
  ].filter(s => s.value > 0);

  return (
    <DashboardLayout title="Clínica" nav={getClinicNav("overview")} role="clinic">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl space-y-6">
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{clinicProfile?.name ?? "Minha Clínica"}</h1>
            <p className="text-sm text-muted-foreground mt-1">Painel de gestão · {format(now, "dd 'de' MMMM", { locale: ptBR })}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-9" onClick={() => navigate("/dashboard/clinic/doctors")}>
              <Users className="w-3.5 h-3.5" /> Médicos
            </Button>
            <Button size="sm" className="rounded-xl gap-1.5 h-9 bg-primary text-primary-foreground" onClick={() => navigate("/dashboard/clinic/schedules")}>
              <Calendar className="w-3.5 h-3.5" /> Agendamentos
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading ? (
            [0,1,2,3].map(i => <div key={i} className="h-24 animate-pulse bg-muted/50 rounded-2xl" />)
          ) : (
            [
              { label: "Médicos Ativos", value: activeDoctors, icon: Users, color: "text-primary", bg: "bg-primary/10" },
              { label: "Consultas do Mês", value: thisMonthAppts.length, icon: Calendar, color: "text-secondary", bg: "bg-secondary/10" },
              { label: "Receita do Mês", value: `R$ ${revenue.toLocaleString("pt-BR")}`, icon: DollarSign, color: "text-success", bg: "bg-success/10" },
              { label: "Ocupação", value: `${occupancy}%`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
            ].map(kpi => (
              <div key={kpi.label} className="p-4 rounded-2xl bg-card border border-border/50">
                <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-2`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">{kpi.label}</p>
              </div>
            ))
          )}
        </motion.div>

        <motion.div variants={fadeUp}>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-muted/50 border border-border/40 h-10 rounded-xl p-1 w-full max-w-md">
              <TabsTrigger value="overview" className="text-xs rounded-lg flex-1">Visão Geral</TabsTrigger>
              <TabsTrigger value="performance" className="text-xs rounded-lg flex-1">Performance</TabsTrigger>
              <TabsTrigger value="finance" className="text-xs rounded-lg flex-1">Financeiro</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-5">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Próximas Consultas</CardTitle>
                    <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => navigate("/dashboard/clinic/schedules")}>Ver todas</Button>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
                    ) : upcomingAppts.length === 0 ? (
                      <div className="text-center py-8"><Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Nenhuma consulta agendada.</p></div>
                    ) : (
                      <div className="space-y-2">
                        {upcomingAppts.map(a => (
                          <div key={a.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                            <div>
                              <p className="text-sm font-medium text-foreground">{format(new Date(a.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</p>
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

                <Card className="border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2"><Stethoscope className="w-4 h-4 text-primary" /> Médicos Vinculados</CardTitle>
                    <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => navigate("/dashboard/clinic/doctors")}>Gerenciar</Button>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
                    ) : doctors.length === 0 ? (
                      <div className="text-center py-8"><Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Nenhum médico vinculado.</p></div>
                    ) : (
                      <div className="space-y-2">
                        {doctors.map((d: any) => {
                          const profile = d.doctor_profiles?.profiles;
                          const name = profile ? `${profile.first_name} ${profile.last_name}` : "Médico";
                          return (
                            <div key={d.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/40">
                              <div>
                                <p className="text-sm font-medium text-foreground">{name}</p>
                                <p className="text-xs text-muted-foreground">CRM: {d.doctor_profiles?.crm ?? "—"}</p>
                              </div>
                              <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${d.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}`}>
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

              {statusCounts.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="text-sm font-semibold">Distribuição de Status</CardTitle></CardHeader>
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

            <TabsContent value="performance" className="space-y-4 mt-5">
              <Card className="border-border/50">
                <CardHeader><CardTitle className="text-sm font-semibold">Consultas por Mês</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="consultas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {doctorPerformance.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="text-sm font-semibold">Ranking de Médicos</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {doctorPerformance.map((doc, i) => (
                        <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/40">
                          <span className="text-lg font-bold text-primary w-8 text-center">#{i + 1}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.completadas} concluídas de {doc.consultas} total</p>
                          </div>
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${doc.consultas > 0 ? (doc.completadas / doc.consultas) * 100 : 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="finance" className="space-y-4 mt-5">
              <Card className="border-border/50">
                <CardHeader><CardTitle className="text-sm font-semibold">Receita Mensal</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${v}`} />
                      <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]} />
                      <Bar dataKey="receita" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { label: "Receita este mês", value: `R$ ${revenue.toLocaleString("pt-BR")}` },
                  { label: "Consultas concluídas", value: completed.length },
                  { label: "Ticket médio", value: `R$ ${completed.length > 0 ? Math.round(revenue / completed.length).toLocaleString("pt-BR") : "0"}` },
                ].map(item => (
                  <Card key={item.label} className="border-border/50">
                    <CardContent className="p-5 text-center">
                      <p className="text-2xl font-bold text-foreground">{item.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default ClinicDashboard;
