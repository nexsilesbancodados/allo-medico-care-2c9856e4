import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "./doctorNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Video, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabel: Record<string, string> = {
  scheduled: "Agendada", completed: "Concluída", cancelled: "Cancelada",
  in_progress: "Em andamento", waiting: "Esperando", no_show: "Ausente",
};

const DoctorConsultations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => { if (user) fetchAppointments(); }, [user]);

  const fetchAppointments = async () => {
    const { data: docProfile } = await supabase.from("doctor_profiles").select("id").eq("user_id", user!.id).single();
    if (!docProfile) { setLoading(false); return; }

    const { data } = await supabase.from("appointments")
      .select("id, scheduled_at, status, patient_id, duration_minutes, notes, guest_patient_id")
      .eq("doctor_id", docProfile.id)
      .order("scheduled_at", { ascending: false })
      .limit(200);

    if (!data || data.length === 0) { setAppointments([]); setLoading(false); return; }

    // Get patient names
    const patientIds = [...new Set(data.filter(a => a.patient_id).map(a => a.patient_id))];
    const guestIds = [...new Set(data.filter(a => a.guest_patient_id).map(a => a.guest_patient_id))];

    const [profilesRes, guestsRes] = await Promise.all([
      patientIds.length > 0
        ? supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", patientIds)
        : { data: [] },
      guestIds.length > 0
        ? supabase.from("guest_patients").select("id, full_name").in("id", guestIds)
        : { data: [] },
    ]);

    const pMap = new Map((profilesRes.data ?? []).map((p: any) => [p.user_id, `${p.first_name} ${p.last_name}`] as const));
    const gMap = new Map((guestsRes.data ?? []).map((g: any) => [g.id, g.full_name] as const));

    setAppointments(data.map(a => ({
      ...a,
      patient_name: a.patient_id ? (pMap.get(a.patient_id) ?? "Paciente") : (gMap.get(a.guest_patient_id) ?? "Paciente Avulso"),
    })));
    setLoading(false);
  };

  const filtered = appointments.filter(a => {
    const matchSearch = a.patient_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const completedCount = appointments.filter(a => a.status === "completed").length;
  const scheduledCount = appointments.filter(a => a.status === "scheduled").length;

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("consultations")}>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Minhas Consultas</h1>
        <p className="text-muted-foreground text-sm mb-2">
          {scheduledCount} agendada(s) · {completedCount} concluída(s) · {appointments.length} total
        </p>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar paciente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="scheduled">Agendadas</SelectItem>
              <SelectItem value="completed">Concluídas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-foreground">{a.patient_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(a.scheduled_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{a.duration_minutes || 30} min</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "completed" ? "default" : a.status === "cancelled" ? "destructive" : "outline"}>
                        {statusLabel[a.status] ?? a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {a.status === "scheduled" && (
                        <Button size="sm" className="bg-gradient-hero text-primary-foreground text-xs" onClick={() => navigate(`/dashboard/consultation/${a.id}`)}>
                          <Video className="w-3 h-3 mr-1" /> Iniciar
                        </Button>
                      )}
                      {a.status === "completed" && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate(`/dashboard/prescribe/${a.id}`)}>
                          <FileText className="w-3 h-3 mr-1" /> Receita
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhuma consulta encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorConsultations;
