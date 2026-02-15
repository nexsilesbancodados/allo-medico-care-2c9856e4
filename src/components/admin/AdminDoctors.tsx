import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Users, Stethoscope, Building2, Calendar, Shield, BarChart3, Check, X } from "lucide-react";

const nav = [
  { label: "Visão Geral", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Médicos", href: "/dashboard/admin/doctors", icon: <Stethoscope className="w-4 h-4" />, active: true },
  { label: "Pacientes", href: "/dashboard/admin/patients", icon: <Users className="w-4 h-4" /> },
  { label: "Clínicas", href: "/dashboard/admin/clinics", icon: <Building2 className="w-4 h-4" /> },
  { label: "Consultas", href: "/dashboard/admin/appointments", icon: <Calendar className="w-4 h-4" /> },
  { label: "Especialidades", href: "/dashboard/admin/specialties", icon: <Shield className="w-4 h-4" /> },
];

const AdminDoctors = () => {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    const { data } = await supabase.from("doctor_profiles")
      .select("id, user_id, crm, crm_state, is_approved, created_at")
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    const userIds = data.map(d => d.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

    setDoctors(data.map(d => ({
      ...d,
      first_name: profileMap.get(d.user_id)?.first_name ?? "",
      last_name: profileMap.get(d.user_id)?.last_name ?? "",
    })));
    setLoading(false);
  };

  const toggleApproval = async (id: string, current: boolean) => {
    await supabase.from("doctor_profiles").update({ is_approved: !current }).eq("id", id);
    toast({ title: current ? "Médico desativado" : "Médico aprovado! ✅" });
    fetchDoctors();
  };

  return (
    <DashboardLayout title="Administração" nav={nav}>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Gestão de Médicos</h1>
        <p className="text-muted-foreground mb-6">Aprove e gerencie os médicos da plataforma</p>

        {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
          <div className="space-y-3">
            {doctors.map(doc => (
              <Card key={doc.id} className="border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {doc.first_name[0]}{doc.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Dr(a). {doc.first_name} {doc.last_name}</p>
                    <p className="text-xs text-muted-foreground">CRM {doc.crm}/{doc.crm_state}</p>
                  </div>
                  <Badge variant={doc.is_approved ? "default" : "outline"}>
                    {doc.is_approved ? "Aprovado" : "Pendente"}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => toggleApproval(doc.id, doc.is_approved)}>
                    {doc.is_approved ? <X className="w-4 h-4 text-destructive" /> : <Check className="w-4 h-4 text-secondary" />}
                  </Button>
                </CardContent>
              </Card>
            ))}
            {doctors.length === 0 && <p className="text-sm text-muted-foreground">Nenhum médico cadastrado.</p>}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDoctors;
