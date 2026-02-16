import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getPatientNav } from "@/components/patient/patientNav";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, CreditCard, FileText, Heart, Video, Clock, Zap, Upload, Search, AlertTriangle, Bell } from "lucide-react";

const statusLabel: Record<string, string> = {
  scheduled: "Agendada", completed: "Concluída", cancelled: "Cancelada",
  in_progress: "Em andamento", waiting: "Na sala de espera", no_show: "Ausente",
};

const PatientDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [waitingAppt, setWaitingAppt] = useState<any | null>(null);
  const [stats, setStats] = useState({ total: 0, prescriptions: 0, documents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  // Realtime for waiting room status
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("patient-updates")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "appointments",
        filter: `patient_id=eq.${user.id}`,
      }, () => { fetchData(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchData = async () => {
    const now = new Date().toISOString();

    const [upRes, completedRes, prescRes, docsRes, waitRes] = await Promise.all([
      supabase.from("appointments")
        .select("id, scheduled_at, status, doctor_id, duration_minutes, appointment_type")
        .eq("patient_id", user!.id)
        .gte("scheduled_at", now)
        .in("status", ["scheduled", "waiting", "in_progress"])
        .order("scheduled_at", { ascending: true })
        .limit(5),
      supabase.from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("patient_id", user!.id)
        .eq("status", "completed"),
      supabase.from("prescriptions")
        .select("id", { count: "exact", head: true })
        .eq("patient_id", user!.id),
      supabase.from("patient_documents")
        .select("id", { count: "exact", head: true })
        .eq("patient_id", user!.id),
      supabase.from("appointments")
        .select("id, scheduled_at, status, doctor_id")
        .eq("patient_id", user!.id)
        .in("status", ["waiting", "in_progress"])
        .limit(1)
        .single(),
    ]);

    setStats({
      total: completedRes.count ?? 0,
      prescriptions: prescRes.count ?? 0,
      documents: docsRes.count ?? 0,
    });

    // Enrich with doctor names
    const allAppts = upRes.data ?? [];
    if (allAppts.length > 0) {
      const doctorIds = [...new Set(allAppts.map(a => a.doctor_id))];
      const { data: docs } = await supabase.from("doctor_profiles").select("id, user_id").in("id", doctorIds);
      if (docs && docs.length > 0) {
        const userIds = docs.map(d => d.user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);
        const docMap = new Map<string, string>();
        docs.forEach(d => {
          const p = profiles?.find(pr => pr.user_id === d.user_id);
          if (p) docMap.set(d.id, `Dr(a). ${p.first_name} ${p.last_name}`);
        });
        setUpcoming(allAppts.map(a => ({ ...a, doctor_name: docMap.get(a.doctor_id) ?? "Médico" })));
      } else {
        setUpcoming(allAppts.map(a => ({ ...a, doctor_name: "Médico" })));
      }
    } else {
      setUpcoming([]);
    }

    if (waitRes.data) {
      const { data: doc } = await supabase.from("doctor_profiles").select("id, user_id").eq("id", waitRes.data.doctor_id).single();
      if (doc) {
        const { data: p } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", doc.user_id).single();
        setWaitingAppt({ ...waitRes.data, doctor_name: p ? `Dr(a). ${p.first_name} ${p.last_name}` : "Médico" });
      }
    } else {
      setWaitingAppt(null);
    }

    setLoading(false);
  };

  const enterWaitingRoom = async (appointmentId: string) => {
    await supabase.from("appointments").update({ status: "waiting" }).eq("id", appointmentId);
    navigate(`/dashboard/consultation/${appointmentId}`);
  };

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("home")}>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Olá, {profile?.first_name || "Paciente"}! 👋
        </h1>
        <p className="text-muted-foreground mb-6">Cuide da sua saúde com facilidade</p>

        {/* Active waiting room alert */}
        {waitingAppt && (
          <Card className="border-primary bg-primary/5 mb-6 animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Video className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {waitingAppt.status === "in_progress" ? "Consulta em andamento" : "Você está na sala de espera"}
                    </p>
                    <p className="text-sm text-muted-foreground">{waitingAppt.doctor_name}</p>
                  </div>
                </div>
                <Button className="bg-gradient-hero text-primary-foreground" onClick={() => navigate(`/dashboard/consultation/${waitingAppt.id}`)}>
                  <Video className="w-4 h-4 mr-1" /> Entrar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick actions - 3 columns */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="border-border hover:shadow-card transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/schedule")}>
            <CardContent className="pt-5 pb-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Agendar</p>
              <p className="text-xs text-muted-foreground">Consulta</p>
            </CardContent>
          </Card>
          <Card className="border-border hover:shadow-card transition-shadow cursor-pointer border-red-200 bg-red-50/50 dark:bg-red-950/10" onClick={() => navigate("/dashboard/schedule?urgency=true")}>
            <CardContent className="pt-5 pb-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-destructive/10 flex items-center justify-center mb-2">
                <Zap className="w-6 h-6 text-destructive" />
              </div>
              <p className="text-sm font-medium text-foreground">Urgência</p>
              <p className="text-xs text-muted-foreground">Falar agora</p>
            </CardContent>
          </Card>
          <Card className="border-border hover:shadow-card transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/patient/documents")}>
            <CardContent className="pt-5 pb-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-accent flex items-center justify-center mb-2">
                <Upload className="w-6 h-6 text-accent-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Enviar</p>
              <p className="text-xs text-muted-foreground">Exames</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Consultas</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{stats.prescriptions}</p>
            <p className="text-xs text-muted-foreground">Receitas</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{stats.documents}</p>
            <p className="text-xs text-muted-foreground">Documentos</p>
          </div>
        </div>

        {/* Upcoming appointments */}
        <Card className="border-border mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">📅 Próximos Agendamentos</CardTitle>
              <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/appointments")}>Ver todos</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> :
            upcoming.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
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
                        {format(new Date(a.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR })} · {a.duration_minutes || 30}min
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.status === "waiting" ? "secondary" : "outline"}>
                        {statusLabel[a.status] ?? a.status}
                      </Badge>
                      {a.status === "scheduled" && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => enterWaitingRoom(a.id)}>
                          <Clock className="w-3 h-3 mr-1" /> Entrar
                        </Button>
                      )}
                      {(a.status === "waiting" || a.status === "in_progress") && (
                        <Button size="sm" className="bg-gradient-hero text-primary-foreground text-xs" onClick={() => navigate(`/dashboard/consultation/${a.id}`)}>
                          <Video className="w-3 h-3 mr-1" /> Sala
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick links */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-border hover:shadow-card transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/patient/health")}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Minha Saúde</p>
                <p className="text-sm text-muted-foreground">Receitas, atestados e histórico</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border hover:shadow-card transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/payment-history")}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Pagamentos</p>
                <p className="text-sm text-muted-foreground">Plano e histórico financeiro</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
