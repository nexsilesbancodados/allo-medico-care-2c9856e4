import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Users, Stethoscope, Building2, Calendar, Shield, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const nav = [
  { label: "Visão Geral", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" />, active: true },
  { label: "Médicos", href: "/dashboard/admin/doctors", icon: <Stethoscope className="w-4 h-4" /> },
  { label: "Pacientes", href: "/dashboard/admin/patients", icon: <Users className="w-4 h-4" /> },
  { label: "Clínicas", href: "/dashboard/admin/clinics", icon: <Building2 className="w-4 h-4" /> },
  { label: "Consultas", href: "/dashboard/admin/appointments", icon: <Calendar className="w-4 h-4" /> },
  { label: "Especialidades", href: "/dashboard/admin/specialties", icon: <Shield className="w-4 h-4" /> },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState({ patients: 0, doctors: 0, clinics: 0, appointments: 0 });
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [recentAppts, setRecentAppts] = useState<any[]>([]);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    const [patientsRes, doctorsRes, clinicsRes, apptsRes, pendingRes, recentRes] = await Promise.all([
      supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "patient"),
      supabase.from("doctor_profiles").select("id", { count: "exact", head: true }),
      supabase.from("clinic_profiles").select("id", { count: "exact", head: true }),
      supabase.from("appointments").select("id", { count: "exact", head: true }),
      supabase.from("doctor_profiles").select("id, user_id, crm, crm_state").eq("is_approved", false).limit(5),
      supabase.from("appointments").select("id, scheduled_at, status, patient_id").order("created_at", { ascending: false }).limit(5),
    ]);

    setStats({
      patients: patientsRes.count ?? 0,
      doctors: doctorsRes.count ?? 0,
      clinics: clinicsRes.count ?? 0,
      appointments: apptsRes.count ?? 0,
    });

    // Enrich pending doctors with names
    if (pendingRes.data && pendingRes.data.length > 0) {
      const userIds = pendingRes.data.map((d: any) => d.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
      setPendingDoctors(pendingRes.data.map((d: any) => ({
        ...d,
        name: profileMap.has(d.user_id) ? `${profileMap.get(d.user_id)!.first_name} ${profileMap.get(d.user_id)!.last_name}` : "—",
      })));
    }

    // Enrich recent appointments
    if (recentRes.data && recentRes.data.length > 0) {
      const patientIds = [...new Set(recentRes.data.map((a: any) => a.patient_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", patientIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
      setRecentAppts(recentRes.data.map((a: any) => ({
        ...a,
        patient_name: profileMap.has(a.patient_id) ? `${profileMap.get(a.patient_id)!.first_name} ${profileMap.get(a.patient_id)!.last_name}` : "—",
      })));
    }
  };

  const approveDoctor = async (id: string) => {
    await supabase.from("doctor_profiles").update({ is_approved: true }).eq("id", id);
    fetchStats();
  };

  const statCards = [
    { label: "Pacientes", value: stats.patients, icon: Users, color: "bg-primary/10 text-primary" },
    { label: "Médicos", value: stats.doctors, icon: Stethoscope, color: "bg-secondary/10 text-secondary" },
    { label: "Clínicas", value: stats.clinics, icon: Building2, color: "bg-accent text-accent-foreground" },
    { label: "Consultas", value: stats.appointments, icon: Calendar, color: "bg-destructive/10 text-destructive" },
  ];

  return (
    <DashboardLayout title="Administração" nav={nav}>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Painel Administrativo</h1>
        <p className="text-muted-foreground mb-8">Gestão completa da plataforma</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-border">
            <CardHeader><CardTitle className="text-lg">Médicos Pendentes</CardTitle></CardHeader>
            <CardContent>
              {pendingDoctors.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pendente.</p>
              ) : (
                <div className="space-y-3">
                  {pendingDoctors.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.name}</p>
                        <p className="text-xs text-muted-foreground">CRM {d.crm}/{d.crm_state}</p>
                      </div>
                      <button
                        onClick={() => approveDoctor(d.id)}
                        className="text-xs px-3 py-1 rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 font-medium transition-colors"
                      >
                        Aprovar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader><CardTitle className="text-lg">Consultas Recentes</CardTitle></CardHeader>
            <CardContent>
              {recentAppts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma consulta.</p>
              ) : (
                <div className="space-y-3">
                  {recentAppts.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between">
                      <p className="text-sm text-foreground">{a.patient_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        a.status === "completed" ? "bg-secondary/10 text-secondary" :
                        a.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                        "bg-primary/10 text-primary"
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
