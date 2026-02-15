import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { Calendar, FileText, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const nav = [
  { label: "Agenda", href: "/dashboard", icon: <Calendar className="w-4 h-4" />, active: true },
  { label: "Prontuários", href: "/dashboard/patients", icon: <FileText className="w-4 h-4" /> },
  { label: "Receitas", href: "/dashboard/prescriptions", icon: <FileText className="w-4 h-4" /> },
  { label: "Disponibilidade", href: "/dashboard/availability", icon: <Settings className="w-4 h-4" /> },
];

const statusLabel: Record<string, string> = {
  scheduled: "Agendada", completed: "Concluída", cancelled: "Cancelada", in_progress: "Em andamento", waiting: "Esperando",
};

const DoctorDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [todayAppts, setTodayAppts] = useState<any[]>([]);
  const [stats, setStats] = useState({ today: 0, total_patients: 0, prescriptions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    // Get doctor profile id
    const { data: docProfile } = await supabase.from("doctor_profiles").select("id").eq("user_id", user!.id).single();
    if (!docProfile) { setLoading(false); return; }
    const doctorId = docProfile.id;

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [todayRes, totalPatientsRes, prescriptionsRes] = await Promise.all([
      supabase.from("appointments")
        .select("id, scheduled_at, status, patient_id, duration_minutes")
        .eq("doctor_id", doctorId)
        .gte("scheduled_at", todayStart.toISOString())
        .lte("scheduled_at", todayEnd.toISOString())
        .order("scheduled_at", { ascending: true }),
      supabase.from("appointments")
        .select("patient_id", { count: "exact", head: false })
        .eq("doctor_id", doctorId),
      supabase.from("prescriptions")
        .select("id", { count: "exact", head: true })
        .eq("doctor_id", doctorId),
    ]);

    const uniquePatients = new Set(totalPatientsRes.data?.map(a => a.patient_id) ?? []);
    setStats({
      today: todayRes.data?.length ?? 0,
      total_patients: uniquePatients.size,
      prescriptions: prescriptionsRes.count ?? 0,
    });

    // Enrich today's appointments with patient names
    const appts = todayRes.data ?? [];
    if (appts.length > 0) {
      const patientIds = [...new Set(appts.map(a => a.patient_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", patientIds);
      const pMap = new Map(profiles?.map(p => [p.user_id, `${p.first_name} ${p.last_name}`]) ?? []);
      setTodayAppts(appts.map(a => ({ ...a, patient_name: pMap.get(a.patient_id) ?? "Paciente" })));
    }
    setLoading(false);
  };

  return (
    <DashboardLayout title="Médico" nav={nav}>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Dr(a). {profile?.first_name} {profile?.last_name}
        </h1>
        <p className="text-muted-foreground mb-6">Sua agenda e prontuários</p>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Consultas Hoje</p>
                  <p className="text-3xl font-bold text-foreground">{stats.today}</p>
                </div>
                <Calendar className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border cursor-pointer" onClick={() => navigate("/dashboard/patients")}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pacientes</p>
                  <p className="text-3xl font-bold text-foreground">{stats.total_patients}</p>
                </div>
                <FileText className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border cursor-pointer" onClick={() => navigate("/dashboard/prescriptions")}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receitas</p>
                  <p className="text-3xl font-bold text-foreground">{stats.prescriptions}</p>
                </div>
                <FileText className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's schedule */}
        <Card className="border-border mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Agenda de Hoje</CardTitle>
              <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/availability")}>
                Gerenciar Horários
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> :
            todayAppts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma consulta agendada para hoje.</p>
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
                      <Badge variant={a.status === "completed" ? "default" : "outline"}>
                        {statusLabel[a.status] ?? a.status}
                      </Badge>
                      {a.status === "scheduled" && (
                        <Button size="sm" className="bg-gradient-hero text-primary-foreground text-xs" onClick={() => navigate(`/dashboard/consultation/${a.id}`)}>
                          Iniciar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick access */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-border hover:shadow-card transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/patients")}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Prontuários</p>
                <p className="text-sm text-muted-foreground">Histórico dos pacientes</p>
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
                <p className="text-sm text-muted-foreground">Receitas emitidas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
