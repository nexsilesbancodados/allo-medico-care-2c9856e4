import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Stethoscope, Building2, Calendar, Shield, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const nav = [
  { label: "Visão Geral", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Médicos", href: "/dashboard/admin/doctors", icon: <Stethoscope className="w-4 h-4" /> },
  { label: "Pacientes", href: "/dashboard/admin/patients", icon: <Users className="w-4 h-4" /> },
  { label: "Clínicas", href: "/dashboard/admin/clinics", icon: <Building2 className="w-4 h-4" /> },
  { label: "Consultas", href: "/dashboard/admin/appointments", icon: <Calendar className="w-4 h-4" />, active: true },
  { label: "Especialidades", href: "/dashboard/admin/specialties", icon: <Shield className="w-4 h-4" /> },
];

const statusLabel: Record<string, string> = {
  scheduled: "Agendada", waiting: "Esperando", in_progress: "Em andamento",
  completed: "Concluída", cancelled: "Cancelada", no_show: "Ausente",
};

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    const { data } = await supabase.from("appointments")
      .select("id, scheduled_at, status, patient_id, doctor_id, duration_minutes")
      .order("scheduled_at", { ascending: false })
      .limit(50);

    if (!data) { setLoading(false); return; }

    const patientIds = [...new Set(data.map(a => a.patient_id))];
    const doctorIds = [...new Set(data.map(a => a.doctor_id))];

    const [pRes, dRes] = await Promise.all([
      supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", patientIds),
      supabase.from("doctor_profiles").select("id, user_id").in("id", doctorIds),
    ]);

    const pMap = new Map(pRes.data?.map(p => [p.user_id, `${p.first_name} ${p.last_name}`]) ?? []);
    const docUserIds = dRes.data?.map(d => d.user_id) ?? [];
    const { data: docProfiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", docUserIds);
    const docMap = new Map<string, string>();
    dRes.data?.forEach(d => {
      const profile = docProfiles?.find(p => p.user_id === d.user_id);
      if (profile) docMap.set(d.id, `${profile.first_name} ${profile.last_name}`);
    });

    setAppointments(data.map(a => ({
      ...a,
      patient_name: pMap.get(a.patient_id) ?? "—",
      doctor_name: docMap.get(a.doctor_id) ?? "—",
    })));
    setLoading(false);
  };

  return (
    <DashboardLayout title="Administração" nav={nav}>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Todas as Consultas</h1>
        <p className="text-muted-foreground mb-6">Histórico completo de atendimentos</p>

        {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma consulta registrada.</p>
        ) : (
          <div className="space-y-3">
            {appointments.map(a => (
              <Card key={a.id} className="border-border">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.patient_name}</p>
                    <p className="text-xs text-muted-foreground">Dr(a). {a.doctor_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground">{format(new Date(a.scheduled_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                    <Badge variant={a.status === "completed" ? "default" : a.status === "cancelled" ? "destructive" : "outline"} className="mt-1">
                      {statusLabel[a.status] ?? a.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminAppointments;
