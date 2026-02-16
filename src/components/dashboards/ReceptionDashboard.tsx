import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "./DashboardLayout";
import { getReceptionNav } from "@/components/reception/receptionNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, CheckCircle, Video, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ReceptionDashboard = () => {
  const [todayAppts, setTodayAppts] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, waiting: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchToday(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("reception-live")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments" }, () => fetchToday())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchToday = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data } = await supabase
      .from("appointments")
      .select("id, scheduled_at, status, patient_id, doctor_id, duration_minutes, appointment_type, notes")
      .gte("scheduled_at", today.toISOString())
      .lt("scheduled_at", tomorrow.toISOString())
      .order("scheduled_at", { ascending: true });

    if (!data) { setLoading(false); return; }

    const patientIds = [...new Set(data.map(a => a.patient_id).filter(Boolean))];
    const doctorIds = [...new Set(data.map(a => a.doctor_id))];

    const [pRes, dRes] = await Promise.all([
      patientIds.length > 0 ? supabase.from("profiles").select("user_id, first_name, last_name, phone").in("user_id", patientIds) : { data: [] },
      supabase.from("doctor_profiles").select("id, user_id").in("id", doctorIds),
    ]);

    const pMap = new Map((pRes.data ?? []).map(p => [p.user_id, p]));
    const docUserIds = (dRes.data ?? []).map(d => d.user_id);
    const { data: docProfiles } = docUserIds.length > 0
      ? await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", docUserIds)
      : { data: [] };
    const docMap = new Map<string, string>();
    (dRes.data ?? []).forEach(d => {
      const p = docProfiles?.find(pr => pr.user_id === d.user_id);
      if (p) docMap.set(d.id, `Dr(a). ${p.first_name} ${p.last_name}`);
    });

    const enriched = data.map(a => {
      const patient = pMap.get(a.patient_id!);
      return {
        ...a,
        patient_name: patient ? `${patient.first_name} ${patient.last_name}` : "—",
        patient_phone: patient?.phone ?? "",
        doctor_name: docMap.get(a.doctor_id) ?? "—",
      };
    });

    setTodayAppts(enriched);
    setStats({
      total: data.length,
      waiting: data.filter(a => a.status === "waiting").length,
      inProgress: data.filter(a => a.status === "in_progress").length,
      completed: data.filter(a => a.status === "completed").length,
    });
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
  };

  const statusLabel: Record<string, string> = {
    scheduled: "Agendada", waiting: "Na sala", in_progress: "Em consulta",
    completed: "Concluída", cancelled: "Cancelada", no_show: "Faltou",
  };
  const statusVariant: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
    scheduled: "outline", waiting: "secondary", in_progress: "default",
    completed: "default", cancelled: "destructive", no_show: "destructive",
  };

  return (
    <DashboardLayout title="Recepção" nav={getReceptionNav("overview")}>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Painel da Recepção</h1>
        <p className="text-muted-foreground mb-6">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Consultas Hoje", value: stats.total, icon: Calendar, color: "text-primary" },
            { label: "Na Sala de Espera", value: stats.waiting, icon: Clock, color: "text-secondary" },
            { label: "Em Andamento", value: stats.inProgress, icon: Video, color: "text-primary" },
            { label: "Concluídas", value: stats.completed, icon: CheckCircle, color: "text-muted-foreground" },
          ].map(s => (
            <Card key={s.label} className="border-border">
              <CardContent className="p-4 text-center">
                <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Agenda do Dia — Todos os Médicos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : todayAppts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma consulta agendada para hoje.</p>
            ) : (
              <div className="space-y-3">
                {todayAppts.map(a => (
                  <div key={a.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-border gap-3 ${a.status === "in_progress" ? "bg-primary/5" : a.status === "waiting" ? "bg-secondary/5" : ""}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-center min-w-[50px]">
                        <p className="text-lg font-bold text-foreground">{format(new Date(a.scheduled_at), "HH:mm")}</p>
                        <p className="text-[10px] text-muted-foreground">{a.duration_minutes || 30} min</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{a.patient_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.doctor_name}</p>
                        {a.patient_phone && <p className="text-xs text-muted-foreground">📞 {a.patient_phone}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={statusVariant[a.status] ?? "outline"}>
                        {a.status === "in_progress" && <span className="w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse inline-block" />}
                        {statusLabel[a.status] ?? a.status}
                      </Badge>
                      {a.status === "scheduled" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "waiting")}>
                          Check-in
                        </Button>
                      )}
                      {a.status === "scheduled" && (
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(a.id, "no_show")}>
                          Faltou
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReceptionDashboard;
