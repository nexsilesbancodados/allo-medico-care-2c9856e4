import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Stethoscope, Building2, Calendar, Shield, BarChart3 } from "lucide-react";

const nav = [
  { label: "Visão Geral", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Médicos", href: "/dashboard/admin/doctors", icon: <Stethoscope className="w-4 h-4" /> },
  { label: "Pacientes", href: "/dashboard/admin/patients", icon: <Users className="w-4 h-4" /> },
  { label: "Clínicas", href: "/dashboard/admin/clinics", icon: <Building2 className="w-4 h-4" />, active: true },
  { label: "Consultas", href: "/dashboard/admin/appointments", icon: <Calendar className="w-4 h-4" /> },
  { label: "Especialidades", href: "/dashboard/admin/specialties", icon: <Shield className="w-4 h-4" /> },
];

const AdminClinics = () => {
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchClinics(); }, []);

  const fetchClinics = async () => {
    const { data } = await supabase.from("clinic_profiles")
      .select("id, user_id, name, cnpj, is_approved, created_at")
      .order("created_at", { ascending: false });

    setClinics(data ?? []);
    setLoading(false);
  };

  const toggleApproval = async (id: string, current: boolean) => {
    await supabase.from("clinic_profiles").update({ is_approved: !current }).eq("id", id);
    fetchClinics();
  };

  return (
    <DashboardLayout title="Administração" nav={nav}>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Clínicas</h1>
        <p className="text-muted-foreground mb-6">Gerencie as clínicas cadastradas</p>

        {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : clinics.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma clínica cadastrada.</p>
        ) : (
          <div className="space-y-3">
            {clinics.map(c => (
              <Card key={c.id} className="border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      {c.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.cnpj || "Sem CNPJ"}</p>
                  </div>
                  <Badge variant={c.is_approved ? "default" : "outline"}>
                    {c.is_approved ? "Aprovada" : "Pendente"}
                  </Badge>
                  <button
                    onClick={() => toggleApproval(c.id, c.is_approved)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                      c.is_approved ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "bg-secondary/10 text-secondary hover:bg-secondary/20"
                    }`}
                  >
                    {c.is_approved ? "Desativar" : "Aprovar"}
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminClinics;
