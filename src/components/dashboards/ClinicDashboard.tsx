import DashboardLayout from "./DashboardLayout";
import { Users, Calendar, BarChart3, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const nav = [
  { label: "Início", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" />, active: true },
  { label: "Médicos", href: "/dashboard/doctors", icon: <Users className="w-4 h-4" /> },
  { label: "Consultas", href: "/dashboard/appointments", icon: <Calendar className="w-4 h-4" /> },
  { label: "Configurações", href: "/dashboard/settings", icon: <Settings className="w-4 h-4" /> },
];

const ClinicDashboard = () => {
  return (
    <DashboardLayout title="Clínica" nav={nav}>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Painel da Clínica</h1>
        <p className="text-muted-foreground mb-8">Visão geral dos atendimentos</p>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Médicos Vinculados", value: "0", icon: Users },
            { label: "Consultas do Mês", value: "0", icon: Calendar },
            { label: "Taxa de Ocupação", value: "0%", icon: BarChart3 },
          ].map((stat) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <stat.icon className="w-8 h-8 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border">
          <CardHeader><CardTitle className="text-lg">Médicos</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Nenhum médico vinculado ainda.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClinicDashboard;
