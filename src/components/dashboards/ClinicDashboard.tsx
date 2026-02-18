import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, BarChart3, Settings, Stethoscope, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import BlobKPICard from "@/components/ui/blob-kpi-card";

const getClinicNav = (active: string) => [
  { label: "Visão Geral", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" />, active: active === "overview" },
  { label: "Médicos", href: "/dashboard/clinic/doctors", icon: <Stethoscope className="w-4 h-4" />, active: active === "doctors" },
  { label: "Agendamentos", href: "/dashboard/clinic/schedules", icon: <Calendar className="w-4 h-4" />, active: active === "schedules" },
  { label: "Perfil", href: "/dashboard/profile", icon: <Settings className="w-4 h-4" /> },
];

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
        .select("*")
        .in("doctor_id", doctorIds)
        .order("scheduled_at", { ascending: false })
        .limit(50);
      setAppointments(appts ?? []);
    }

    setLoading(false);
  };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthAppts = appointments.filter(a => new Date(a.scheduled_at) >= monthStart).length;
  const totalSlots = doctors.length * 20;
  const occupancy = totalSlots > 0 ? Math.round((monthAppts / totalSlots) * 100) : 0;

  const upcomingAppts = appointments
    .filter(a => new Date(a.scheduled_at) >= now && a.status !== "cancelled")
    .slice(0, 5);

  return (
    <DashboardLayout title="Clínica" nav={getClinicNav("overview")}>
      <div className="max-w-4xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {clinicProfile?.name ?? "Minha Clínica"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Painel de gestão da clínica</p>
        </div>

        {/* BLOB KPI Cards */}
        <div className="grid grid-cols-3 gap-4 py-2">
          <BlobKPICard
            variant={0}
            label="Médicos Vinculados"
            value={loading ? "…" : doctors.length}
            icon={<Users className="w-5 h-5" />}
            color="primary"
            delay={0}
          />
          <BlobKPICard
            variant={1}
            label="Consultas do Mês"
            value={loading ? "…" : monthAppts}
            icon={<Calendar className="w-5 h-5" />}
            color="secondary"
            delay={0.08}
          />
          <BlobKPICard
            variant={2}
            label="Ocupação"
            value={loading ? "…" : `${occupancy}%`}
            icon={<BarChart3 className="w-5 h-5" />}
            color="success"
            delay={0.16}
          />
        </div>

        {/* Upcoming appointments */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Próximas Consultas
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/clinic/schedules")}>
              Ver todas
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : upcomingAppts.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma consulta agendada.</p>
            ) : (
              <div className="space-y-2">
                {upcomingAppts.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(a.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{a.appointment_type ?? "consulta"}</p>
                    </div>
                    <Badge variant={a.status === "confirmed" ? "default" : "secondary"} className="text-xs">
                      {a.status === "confirmed" ? "Confirmado" : a.status === "pending" ? "Pendente" : a.status}
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
              <Stethoscope className="w-4 h-4 text-primary" />
              Médicos Vinculados
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/clinic/doctors")}>
              Gerenciar
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : doctors.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum médico vinculado ainda.</p>
            ) : (
              <div className="space-y-2">
                {doctors.map((d: any) => {
                  const profile = d.doctor_profiles?.profiles;
                  const name = profile
                    ? `${profile.first_name} ${profile.last_name}`
                    : "Médico";
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
    </DashboardLayout>
  );
};

export default ClinicDashboard;
