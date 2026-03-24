import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "./doctorNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Clock, UserCheck, Zap, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DoctorOnDutyPanel = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDoctorProfile();
      fetchQueue();
    }
  }, [user]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("on-duty-queue")
      .on("postgres_changes", { event: "*", schema: "public", table: "on_demand_queue" }, () => fetchQueue())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchDoctorProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("doctor_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (data) setDoctorProfileId(data.id);
  };

  const fetchQueue = async () => {
    const { data } = await supabase
      .from("on_demand_queue")
      .select("*")
      .eq("status", "waiting")
      .order("created_at", { ascending: true });
    setQueue(data ?? []);
    setLoading(false);
  };

  const handleAcceptPatient = async (entry: any) => {
    if (!doctorProfileId || !user) return;
    setAccepting(true);

    // Create appointment
    const { data: appt, error: apptError } = await supabase.from("appointments").insert({
      patient_id: entry.patient_id,
      doctor_id: doctorProfileId,
      scheduled_at: new Date().toISOString(),
      status: "in_progress",
      payment_status: "approved",
      appointment_type: "urgent_care",
    }).select("id").single();

    if (apptError || !appt) {
      toast.error("Erro ao criar consulta: " + (apptError?.message || ""));
      setAccepting(false);
      return;
    }

    // Update queue entry
    await supabase.from("on_demand_queue").update({
      status: "in_progress",
      assigned_doctor_id: doctorProfileId,
      assigned_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      appointment_id: appt.id,
    }).eq("id", entry.id);

    toast.success("Paciente aceito! Redirecionando...");
    setTimeout(() => {
      window.location.href = `/dashboard/consultation/${appt.id}?role=doctor`;
    }, 500);
    setAccepting(false);
  };

  const waitTime = (createdAt: string) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000 / 60);
    return `${diff} min`;
  };

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("on-duty")}>
      <div className="w-full mx-auto max-w-4xl pb-24 md:pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">🏥 Plantão 24h</h1>
            <p className="text-muted-foreground text-sm">Fila de pronto-atendimento digital</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Users className="w-4 h-4 mr-2" /> {queue.length} na fila
          </Badge>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando fila...</p>
        ) : queue.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Zap className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-foreground mb-1">Nenhum paciente na fila</h3>
              <p className="text-sm text-muted-foreground">Novos pacientes aparecerão aqui em tempo real.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto -mx-0.5 rounded-xl">

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posição</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Esperando</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((entry, i) => (
                  <TableRow key={entry.id} className={i === 0 ? "bg-primary/5" : ""}>
                    <TableCell data-label="Posição">
                      <Badge variant={i === 0 ? "default" : "outline"}>{i + 1}º</Badge>
                    </TableCell>
                    <TableCell data-label="Turno" className="text-sm">
                      {entry.shift === "day" ? "☀️ Diurno" : entry.shift === "night" ? "🌙 Noturno" : "🌃 Madrugada"}
                    </TableCell>
                    <TableCell data-label="Preço" className="text-sm font-medium">R$ {Number(entry.price).toFixed(2)}</TableCell>
                    <TableCell data-label="Espera">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-3 h-3" />
                        {waitTime(entry.created_at)}
                      </div>
                    </TableCell>
                    <TableCell data-label="">
                      <Button size="sm" disabled={accepting} onClick={() => handleAcceptPatient(entry)}>
                        <UserCheck className="w-4 h-4 mr-1" /> Atender
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorOnDutyPanel;
