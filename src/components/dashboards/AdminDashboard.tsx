import DashboardLayout from "./DashboardLayout";
import { Users, Stethoscope, Building2, Calendar, Shield, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const nav = [
  { label: "Visão Geral", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" />, active: true },
  { label: "Médicos", href: "/dashboard/admin/doctors", icon: <Stethoscope className="w-4 h-4" /> },
  { label: "Pacientes", href: "/dashboard/admin/patients", icon: <Users className="w-4 h-4" /> },
  { label: "Clínicas", href: "/dashboard/admin/clinics", icon: <Building2 className="w-4 h-4" /> },
  { label: "Consultas", href: "/dashboard/admin/appointments", icon: <Calendar className="w-4 h-4" /> },
  { label: "Permissões", href: "/dashboard/admin/roles", icon: <Shield className="w-4 h-4" /> },
];

const AdminDashboard = () => {
  return (
    <DashboardLayout title="Administração" nav={nav}>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Painel Administrativo</h1>
        <p className="text-muted-foreground mb-8">Gestão completa da plataforma</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Pacientes", value: "0", icon: Users, color: "bg-primary/10 text-primary" },
            { label: "Médicos", value: "0", icon: Stethoscope, color: "bg-secondary/10 text-secondary" },
            { label: "Clínicas", value: "0", icon: Building2, color: "bg-accent text-accent-foreground" },
            { label: "Consultas", value: "0", icon: Calendar, color: "bg-destructive/10 text-destructive" },
          ].map((stat) => (
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
            <CardHeader><CardTitle className="text-lg">Médicos Pendentes de Aprovação</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Nenhum médico aguardando aprovação.</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader><CardTitle className="text-lg">Consultas Recentes</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Nenhuma consulta registrada.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
