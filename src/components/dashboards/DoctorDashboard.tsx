import DashboardLayout from "./DashboardLayout";
import { Calendar, Clock, Users, FileText, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const nav = [
  { label: "Início", href: "/dashboard", icon: <Clock className="w-4 h-4" />, active: true },
  { label: "Agenda", href: "/dashboard/schedule", icon: <Calendar className="w-4 h-4" /> },
  { label: "Pacientes", href: "/dashboard/patients", icon: <Users className="w-4 h-4" /> },
  { label: "Receitas", href: "/dashboard/prescriptions", icon: <FileText className="w-4 h-4" /> },
  { label: "Disponibilidade", href: "/dashboard/availability", icon: <Settings className="w-4 h-4" /> },
];

const DoctorDashboard = () => {
  const { profile } = useAuth();

  return (
    <DashboardLayout title="Médico" nav={nav}>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Dr(a). {profile?.first_name} {profile?.last_name}
        </h1>
        <p className="text-muted-foreground mb-8">Sua agenda do dia</p>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Consultas Hoje", value: "0", icon: Calendar, color: "primary" },
            { label: "Pacientes Total", value: "0", icon: Users, color: "secondary" },
            { label: "Receitas Emitidas", value: "0", icon: FileText, color: "accent-foreground" },
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
          <CardHeader>
            <CardTitle className="text-lg">Próximas Consultas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Nenhuma consulta agendada para hoje.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
