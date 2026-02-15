import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { Calendar, CreditCard, FileText, History, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const nav = [
  { label: "Meus Agendamentos", href: "/dashboard", icon: <Calendar className="w-4 h-4" />, active: true },
  { label: "Agendar Consulta", href: "/dashboard/schedule", icon: <Calendar className="w-4 h-4" /> },
  { label: "Histórico Médico", href: "/dashboard/history", icon: <FileText className="w-4 h-4" /> },
  { label: "Pagamento", href: "/dashboard/plans", icon: <CreditCard className="w-4 h-4" /> },
  { label: "Pagamentos Anteriores", href: "/dashboard/payment-history", icon: <History className="w-4 h-4" /> },
  { label: "Meu Perfil", href: "/dashboard/profile", icon: <User className="w-4 h-4" /> },
];

const statusLabel: Record<string, string> = {
  scheduled: "Agendada", completed: "Concluída", cancelled: "Cancelada", in_progress: "Em andamento", no_show: "Ausente",
};

const PatientDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    const now = new Date().toISOString();
    const [upRes, pastRes] = await Promise.all([
      supabase.from("appointments")
        .select("id, scheduled_at, status, doctor_id, duration_minutes")
        .eq("patient_id", user!.id)
        .gte("scheduled_at", now)
        .in("status", ["scheduled", "waiting"])
        .order("scheduled_at", { ascending: true })
        .limit(10),
      supabase.from("appointments")
        .select("id, scheduled_at, status, doctor_id")
        .eq("patient_id", user!.id)
        .lt("scheduled_at", now)
        .order("scheduled_at", { ascending: false })
        .limit(5),
    ]);

    const allDoctorIds = [...new Set([...(upRes.data ?? []), ...(pastRes.data ?? [])].map(a => a.doctor_id))];
    let docMap = new Map<string, string>();
    if (allDoctorIds.length > 0) {
      const { data: docs } = await supabase.from("doctor_profiles").select("id, user_id").in("id", allDoctorIds);
      if (docs && docs.length > 0) {
        const docUserIds = docs.map(d => d.user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", docUserIds);
        docs.forEach(d => {
          const p = profiles?.find(pr => pr.user_id === d.user_id);
          if (p) docMap.set(d.id, `Dr(a). ${p.first_name} ${p.last_name}`);
        });
      }
    }

    const enrich = (list: any[]) => list.map(a => ({ ...a, doctor_name: docMap.get(a.doctor_id) ?? "Médico" }));
    setUpcoming(enrich(upRes.data ?? []));
    setPast(enrich(pastRes.data ?? []));
    setLoading(false);
  };

  return (
    <DashboardLayout title="Paciente" nav={nav}>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Olá, {profile?.first_name || "Paciente"}! 👋
        </h1>
        <p className="text-muted-foreground mb-6">Seus agendamentos e pagamentos</p>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Card className="border-border hover:shadow-card transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/schedule")}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Agendar Consulta</p>
                <p className="text-sm text-muted-foreground">Encontre um médico e agende</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border hover:shadow-card transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/plans")}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Pagamento / Plano</p>
                <p className="text-sm text-muted-foreground">Gerencie seu plano e pagamentos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming */}
        <Card className="border-border mb-6">
          <CardHeader><CardTitle className="text-lg">Próximos Agendamentos</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> :
            upcoming.length === 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-3">Nenhuma consulta agendada.</p>
                <Button size="sm" className="bg-gradient-hero text-primary-foreground" onClick={() => navigate("/dashboard/schedule")}>
                  Agendar agora
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.doctor_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(a.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        {" · "}{a.duration_minutes || 30} min
                      </p>
                    </div>
                    <Badge variant="outline">{statusLabel[a.status] ?? a.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past */}
        {past.length > 0 && (
          <Card className="border-border">
            <CardHeader><CardTitle className="text-lg">Consultas Anteriores</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {past.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2 text-sm">
                    <span className="text-foreground">{a.doctor_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{format(new Date(a.scheduled_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                      <Badge variant={a.status === "completed" ? "default" : "destructive"} className="text-xs">
                        {statusLabel[a.status] ?? a.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
