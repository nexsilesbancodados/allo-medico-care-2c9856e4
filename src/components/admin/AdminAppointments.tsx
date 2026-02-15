import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminNav } from "./adminNav";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabel: Record<string, string> = {
  scheduled: "Agendada", waiting: "Esperando", in_progress: "Em andamento",
  completed: "Concluída", cancelled: "Cancelada", no_show: "Ausente",
};

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    const { data } = await supabase.from("appointments")
      .select("id, scheduled_at, status, patient_id, doctor_id, duration_minutes, notes")
      .order("scheduled_at", { ascending: false }).limit(100);
    if (!data) { setLoading(false); return; }

    const patientIds = [...new Set(data.map(a => a.patient_id))];
    const doctorIds = [...new Set(data.map(a => a.doctor_id))];
    const [pRes, dRes] = await Promise.all([
      supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", patientIds),
      supabase.from("doctor_profiles").select("id, user_id").in("id", doctorIds),
    ]);
    const pMap = new Map(pRes.data?.map(p => [p.user_id, `${p.first_name} ${p.last_name}`]) ?? []);
    const docUserIds = dRes.data?.map(d => d.user_id) ?? [];
    const { data: docProfiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", docUserIds);
    const docMap = new Map<string, string>();
    dRes.data?.forEach(d => {
      const p = docProfiles?.find(pr => pr.user_id === d.user_id);
      if (p) docMap.set(d.id, `${p.first_name} ${p.last_name}`);
    });

    setAppointments(data.map(a => ({ ...a, patient_name: pMap.get(a.patient_id) ?? "—", doctor_name: docMap.get(a.doctor_id) ?? "—" })));
    setLoading(false);
  };

  const filtered = appointments.filter(a => {
    const matchSearch = `${a.patient_name} ${a.doctor_name}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("appointments")}>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Consultas</h1>
        <p className="text-muted-foreground text-sm mb-4">{filtered.length} consulta(s)</p>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar paciente ou médico..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="scheduled">Agendada</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
              <SelectItem value="no_show">Ausente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-foreground">{a.patient_name}</TableCell>
                    <TableCell className="text-muted-foreground">Dr(a). {a.doctor_name}</TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(a.scheduled_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell className="text-muted-foreground">{a.duration_minutes || 30} min</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "completed" ? "default" : a.status === "cancelled" ? "destructive" : "outline"}>
                        {statusLabel[a.status] ?? a.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma consulta.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminAppointments;
