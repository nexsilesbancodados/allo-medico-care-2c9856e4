import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, FileText, Users, Search, Video, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const patientNav = [
  { label: "Início", href: "/dashboard", icon: <Clock className="w-4 h-4" /> },
  { label: "Agendar Consulta", href: "/dashboard/schedule", icon: <Calendar className="w-4 h-4" /> },
  { label: "Buscar Médicos", href: "/dashboard/doctors", icon: <Search className="w-4 h-4" /> },
  { label: "Minhas Consultas", href: "/dashboard/appointments", icon: <FileText className="w-4 h-4" />, active: true },
  { label: "Dependentes", href: "/dashboard/dependents", icon: <Users className="w-4 h-4" /> },
];

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  duration_minutes: number;
  doctor_name: string;
  doctor_crm: string;
  specialties: string[];
}

const statusLabel: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  scheduled: { label: "Agendada", variant: "default" },
  waiting: { label: "Sala de espera", variant: "secondary" },
  in_progress: { label: "Em andamento", variant: "secondary" },
  completed: { label: "Concluída", variant: "outline" },
  cancelled: { label: "Cancelada", variant: "destructive" },
  no_show: { label: "Não compareceu", variant: "destructive" },
};

const AppointmentsList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchAppointments(); }, [user]);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("id, scheduled_at, status, duration_minutes, doctor_id")
      .eq("patient_id", user!.id)
      .order("scheduled_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    // Get doctor info
    const doctorIds = [...new Set(data.map(a => a.doctor_id))];
    const { data: doctors } = await supabase
      .from("doctor_profiles")
      .select("id, user_id, crm, crm_state")
      .in("id", doctorIds);

    const userIds = doctors?.map(d => d.user_id) ?? [];
    const [profilesRes, specsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds),
      supabase.from("doctor_specialties").select("doctor_id, specialties(name)").in("doctor_id", doctorIds),
    ]);

    const doctorMap = new Map(doctors?.map(d => [d.id, d]) ?? []);
    const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) ?? []);
    const specMap = new Map<string, string[]>();
    specsRes.data?.forEach((s: any) => {
      const arr = specMap.get(s.doctor_id) ?? [];
      arr.push(s.specialties?.name ?? "");
      specMap.set(s.doctor_id, arr);
    });

    const results: Appointment[] = data.map(a => {
      const doc = doctorMap.get(a.doctor_id);
      const profile = doc ? profileMap.get(doc.user_id) : null;
      return {
        id: a.id,
        scheduled_at: a.scheduled_at,
        status: a.status,
        duration_minutes: a.duration_minutes,
        doctor_name: profile ? `${profile.first_name} ${profile.last_name}` : "Médico",
        doctor_crm: doc ? `${doc.crm}/${doc.crm_state}` : "",
        specialties: specMap.get(a.doctor_id) ?? [],
      };
    });

    setAppointments(results);
    setLoading(false);
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled", cancelled_by: user!.id })
      .eq("id", id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível cancelar.", variant: "destructive" });
    } else {
      toast({ title: "Consulta cancelada" });
      fetchAppointments();
    }
  };

  const upcoming = appointments.filter(a => ["scheduled", "waiting"].includes(a.status));
  const past = appointments.filter(a => ["completed", "cancelled", "no_show", "in_progress"].includes(a.status));

  const renderAppointment = (appt: Appointment) => (
    <Card key={appt.id} className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Dr(a). {appt.doctor_name}</h3>
            <p className="text-xs text-muted-foreground">CRM {appt.doctor_crm}</p>
            {appt.specialties.length > 0 && (
              <div className="flex gap-1 mt-1">
                {appt.specialties.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {format(new Date(appt.scheduled_at), "dd/MM/yyyy", { locale: ptBR })}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(appt.scheduled_at), "HH:mm")}h
            </p>
            <Badge variant={statusLabel[appt.status]?.variant ?? "outline"} className="mt-1">
              {statusLabel[appt.status]?.label ?? appt.status}
            </Badge>
          </div>
        </div>

        {appt.status === "scheduled" && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="destructive" onClick={() => handleCancel(appt.id)}>
              <X className="w-3 h-3 mr-1" /> Cancelar
            </Button>
          </div>
        )}

        {appt.status === "waiting" && (
          <Button size="sm" className="mt-3 bg-gradient-hero text-primary-foreground">
            <Video className="w-3 h-3 mr-1" /> Entrar na Consulta
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Paciente" nav={patientNav}>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Minhas Consultas</h1>
        <p className="text-muted-foreground mb-6">Acompanhe suas consultas agendadas e histórico</p>

        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Próximas ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Histórico ({past.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : upcoming.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-8 text-center">
                  <Calendar className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Nenhuma consulta agendada.</p>
                </CardContent>
              </Card>
            ) : upcoming.map(renderAppointment)}
          </TabsContent>

          <TabsContent value="past" className="space-y-3 mt-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : past.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-8 text-center">
                  <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Nenhuma consulta no histórico.</p>
                </CardContent>
              </Card>
            ) : past.map(renderAppointment)}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AppointmentsList;
