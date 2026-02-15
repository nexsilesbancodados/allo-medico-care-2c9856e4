import DashboardLayout from "./DashboardLayout";
import { Calendar, Clock, FileText, Users, Search, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const nav = [
  { label: "Início", href: "/dashboard", icon: <Clock className="w-4 h-4" />, active: true },
  { label: "Agendar Consulta", href: "/dashboard/schedule", icon: <Calendar className="w-4 h-4" /> },
  { label: "Buscar Médicos", href: "/dashboard/doctors", icon: <Search className="w-4 h-4" /> },
  { label: "Minhas Consultas", href: "/dashboard/appointments", icon: <FileText className="w-4 h-4" /> },
  { label: "Meu Plano", href: "/dashboard/plans", icon: <CreditCard className="w-4 h-4" /> },
  { label: "Dependentes", href: "/dashboard/dependents", icon: <Users className="w-4 h-4" /> },
];

const PatientDashboard = () => {
  const { profile } = useAuth();

  return (
    <DashboardLayout title="Paciente" nav={nav}>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Olá, {profile?.first_name || "Paciente"}! 👋
        </h1>
        <p className="text-muted-foreground mb-8">Como podemos ajudar você hoje?</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="border-border hover:shadow-card transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-base">Agendar Consulta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Encontre um médico e agende agora</p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-card transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-2">
                <FileText className="w-5 h-5 text-secondary" />
              </div>
              <CardTitle className="text-base">Receitas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Veja suas receitas médicas</p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-card transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-accent-foreground" />
              </div>
              <CardTitle className="text-base">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Consultas anteriores e prontuários</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Próximas Consultas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Nenhuma consulta agendada.</p>
            <Button className="mt-4 bg-gradient-hero text-primary-foreground" size="sm">
              Agendar agora
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
