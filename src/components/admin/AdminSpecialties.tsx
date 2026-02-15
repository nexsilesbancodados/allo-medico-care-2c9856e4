import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, Stethoscope, Building2, Calendar, Shield, BarChart3, Plus, Trash2 } from "lucide-react";

const nav = [
  { label: "Visão Geral", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Médicos", href: "/dashboard/admin/doctors", icon: <Stethoscope className="w-4 h-4" /> },
  { label: "Pacientes", href: "/dashboard/admin/patients", icon: <Users className="w-4 h-4" /> },
  { label: "Clínicas", href: "/dashboard/admin/clinics", icon: <Building2 className="w-4 h-4" /> },
  { label: "Consultas", href: "/dashboard/admin/appointments", icon: <Calendar className="w-4 h-4" /> },
  { label: "Especialidades", href: "/dashboard/admin/specialties", icon: <Shield className="w-4 h-4" />, active: true },
];

const AdminSpecialties = () => {
  const { toast } = useToast();
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSpecialties(); }, []);

  const fetchSpecialties = async () => {
    const { data } = await supabase.from("specialties").select("*").order("name");
    setSpecialties(data ?? []);
    setLoading(false);
  };

  const addSpecialty = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from("specialties").insert({ name: newName.trim() } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setNewName("");
      fetchSpecialties();
      toast({ title: "Especialidade adicionada!" });
    }
  };

  const removeSpecialty = async (id: string) => {
    await supabase.from("specialties").delete().eq("id", id);
    fetchSpecialties();
  };

  return (
    <DashboardLayout title="Administração" nav={nav}>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Especialidades</h1>
        <p className="text-muted-foreground mb-6">Gerencie as especialidades disponíveis</p>

        <Card className="border-border mb-6">
          <CardHeader><CardTitle className="text-base">Adicionar Especialidade</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome da especialidade" onKeyDown={e => e.key === "Enter" && addSpecialty()} />
              <Button onClick={addSpecialty} className="bg-gradient-hero text-primary-foreground">
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {specialties.map(s => (
            <Card key={s.id} className="border-border">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{s.name}</p>
                  {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeSpecialty(s.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSpecialties;
