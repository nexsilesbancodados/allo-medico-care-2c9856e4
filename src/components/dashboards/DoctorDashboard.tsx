import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, FileText, Users, DollarSign, Clock } from "lucide-react";
import DoctorAnalyticsCharts from "./DoctorAnalyticsCharts";

const statusLabel: Record<string, string> = {
  scheduled: "Agendada", completed: "Concluída", cancelled: "Cancelada", in_progress: "Em andamento", waiting: "Esperando",
};

const DoctorDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [todayAppts, setTodayAppts] = useState<any[]>([]);
  const [upcomingAppts, setUpcomingAppts] = useState<any[]>([]);
  const [stats, setStats] = useState({ today: 0, total_patients: 0, prescriptions: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data: docProfile } = await supabase.from("doctor_profiles").select("id, consultation_price").eq("user_id", user!.id).single();
    if (!docProfile) { setLoading(false); return; }
    const doctorId = docProfile.id;
    const price = Number(docProfile.consultation_price) || 89;

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [todayRes, totalPatientsRes, prescriptionsRes, completedRes, upcomingRes] = await Promise.all([
      supabase.from("appointments")
        .select("id, scheduled_at, status, patient_id, duration_minutes")
        .eq("doctor_id", doctorId)
        .gte("scheduled_at", todayStart.toISOString())
        .lte("scheduled_at", todayEnd.toISOString())
        .order("scheduled_at", { ascending: true }),
      supabase.from("appointments")
        .select("patient_id")
        .eq("doctor_id", doctorId),
      supabase.from("prescriptions")
        .select("id", { count: "exact", head: true })
        .eq("doctor_id", doctorId),
      supabase.from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("doctor_id", doctorId)
        .eq("status", "completed"),
      supabase.from("appointments")
        .select("id, scheduled_at, status, patient_id, duration_minutes")
        .eq("doctor_id", doctorId)
        .eq("status", "scheduled")
        .gt("scheduled_at", todayEnd.toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5),
    ]);

    const uniquePatients = new Set(totalPatientsRes.data?.map(a => a.patient_id) ?? []);
    const completedCount = completedRes.count ?? 0;

    setStats({
      today: todayRes.data?.length ?? 0,
      total_patients: uniquePatients.size,
      prescriptions: prescriptionsRes.count ?? 0,
      totalEarnings: completedCount * price,
    });

    // Enrich appointments with patient names
    const allAppts = [...(todayRes.data ?? []), ...(upcomingRes.data ?? [])];
    if (allAppts.length > 0) {
      const patientIds = [...new Set(allAppts.map(a => a.patient_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", patientIds);
      const pMap = new Map(profiles?.map(p => [p.user_id, `${p.first_name} ${p.last_name}`]) ?? []);
      
      setTodayAppts((todayRes.data ?? []).map(a => ({ ...a, patient_name: pMap.get(a.patient_id) ?? "Paciente" })));
      setUpcomingAppts((upcomingRes.data ?? []).map(a => ({ ...a, patient_name: pMap.get(a.patient_id) ?? "Paciente" })));
    }
    setLoading(false);
  };

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("home")}>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Olá, Dr(a). {profile?.first_name} {profile?.last_name} 👋
        </h1>
        <p className="text-muted-foreground mb-6">Sua agenda e resumo de atividades</p>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-border bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold text-foreground">{stats.today}</p>
                  <p className="text-xs text-muted-foreground">consulta(s)</p>
                </div>
                <Calendar className="w-7 h-7 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border cursor-pointer" onClick={() => navigate("/dashboard/patients")}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pacientes</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total_patients}</p>
                  <p className="text-xs text-muted-foreground">atendidos</p>
                </div>
                <Users className="w-7 h-7 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border cursor-pointer" onClick={() => navigate("/dashboard/prescriptions")}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Receitas</p>
                  <p className="text-2xl font-bold text-foreground">{stats.prescriptions}</p>
                  <p className="text-xs text-muted-foreground">emitidas</p>
                </div>
                <FileText className="w-7 h-7 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border cursor-pointer" onClick={() => navigate("/dashboard/earnings")}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Ganhos</p>
                  <p className="text-2xl font-bold text-foreground">R$ {stats.totalEarnings.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">total</p>
                </div>
                <DollarSign className="w-7 h-7 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <DoctorAnalyticsCharts />

        {/* Today's schedule */}
        <Card className="border-border mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">📅 Agenda de Hoje</CardTitle>
              <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/availability")}>
                Gerenciar Horários
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> :
            todayAppts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma consulta agendada para hoje. 🎉</p>
            ) : (
              <div className="space-y-3">
                {todayAppts.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.patient_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(a.scheduled_at), "HH:mm", { locale: ptBR })} · {a.duration_minutes || 30} min
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.status === "completed" ? "default" : a.status === "cancelled" ? "destructive" : "outline"}>
                        {statusLabel[a.status] ?? a.status}
                      </Badge>
                      {a.status === "scheduled" && (
                        <Button size="sm" className="bg-gradient-hero text-primary-foreground text-xs" onClick={() => navigate(`/dashboard/consultation/${a.id}`)}>
                          Iniciar
                        </Button>
                      )}
                      {a.status === "completed" && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate(`/dashboard/prescribe/${a.id}`)}>
                          Receita
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming appointments */}
        {upcomingAppts.length > 0 && (
          <Card className="border-border mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">📋 Próximas Consultas</CardTitle>
                <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/doctor/consultations")}>
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingAppts.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.patient_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(a.scheduled_at), "dd/MM · HH:mm", { locale: ptBR })} · {a.duration_minutes || 30} min
                      </p>
                    </div>
                    <Badge variant="outline">{statusLabel[a.status] ?? a.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick access */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="border-border hover:shadow-card transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/doctor/consultations")}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Consultas</p>
                <p className="text-sm text-muted-foreground">Histórico completo</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border hover:shadow-card transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/prescriptions")}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Receitas</p>
                <p className="text-sm text-muted-foreground">Prescrições emitidas</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border hover:shadow-card transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/earnings")}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Financeiro</p>
                <p className="text-sm text-muted-foreground">Ganhos e pagamentos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
