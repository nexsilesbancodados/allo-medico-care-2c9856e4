import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Stethoscope, Building2, Calendar, Shield, BarChart3 } from "lucide-react";

const nav = [
  { label: "Visão Geral", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Médicos", href: "/dashboard/admin/doctors", icon: <Stethoscope className="w-4 h-4" /> },
  { label: "Pacientes", href: "/dashboard/admin/patients", icon: <Users className="w-4 h-4" />, active: true },
  { label: "Clínicas", href: "/dashboard/admin/clinics", icon: <Building2 className="w-4 h-4" /> },
  { label: "Consultas", href: "/dashboard/admin/appointments", icon: <Calendar className="w-4 h-4" /> },
  { label: "Especialidades", href: "/dashboard/admin/specialties", icon: <Shield className="w-4 h-4" /> },
];

const AdminPatients = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "patient");
    if (!roles || roles.length === 0) { setLoading(false); return; }

    const userIds = roles.map(r => r.user_id);
    const { data: profiles } = await supabase.from("profiles")
      .select("user_id, first_name, last_name, phone, created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    setPatients(profiles ?? []);
    setLoading(false);
  };

  return (
    <DashboardLayout title="Administração" nav={nav}>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Pacientes</h1>
        <p className="text-muted-foreground mb-6">Todos os pacientes cadastrados</p>

        {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
          <div className="space-y-3">
            {patients.map(p => (
              <Card key={p.user_id} className="border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {p.first_name?.[0]}{p.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{p.first_name} {p.last_name}</p>
                    <p className="text-xs text-muted-foreground">{p.phone || "Sem telefone"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </CardContent>
              </Card>
            ))}
            {patients.length === 0 && <p className="text-sm text-muted-foreground">Nenhum paciente.</p>}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPatients;
