import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getReceptionNav } from "./receptionNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle, Clock, Video, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const ReceptionCheckin = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUpcoming(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("reception-checkin")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments" }, () => fetchUpcoming())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchUpcoming = async () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const { data } = await supabase.from("appointments")
      .select("id, scheduled_at, status, patient_id, doctor_id, appointment_type, payment_status")
      .gte("scheduled_at", now.toISOString())
      .lt("scheduled_at", endOfDay.toISOString())
      .in("status", ["scheduled", "waiting", "in_progress"])
      .order("scheduled_at", { ascending: true });

    if (!data) { setLoading(false); return; }

    const patientIds = [...new Set(data.map(a => a.patient_id).filter(Boolean))];
    const doctorIds = [...new Set(data.map(a => a.doctor_id))];
    const [pRes, dRes] = await Promise.all([
      patientIds.length > 0 ? supabase.from("profiles").select("user_id, first_name, last_name, phone").in("user_id", patientIds.filter((id): id is string => !!id)) : { data: [] },
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

    setAppointments(data.map(a => {
      const patient = pMap.get(a.patient_id!);
      return {
        ...a,
        patient_name: patient ? `${patient.first_name} ${patient.last_name}` : "—",
        patient_phone: patient?.phone ?? "",
        doctor_name: docMap.get(a.doctor_id) ?? "—",
      };
    }));
    setLoading(false);
  };

  const doCheckin = async (id: string) => {
    await supabase.from("appointments").update({ status: "waiting" }).eq("id", id);
    toast.success("Check-in realizado! Paciente na sala de espera.");
  };

  const markNoShow = async (id: string) => {
    await supabase.from("appointments").update({ status: "no_show" }).eq("id", id);
    toast.info("Paciente marcado como ausente.");
  };

  const confirmPayment = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("appointments").update({
      payment_status: "confirmed",
      payment_confirmed_by: user?.id,
      payment_confirmed_at: new Date().toISOString(),
    }).eq("id", id);
    toast.success("Pagamento confirmado!");
  };

  const filtered = appointments.filter(a =>
    `${a.patient_name} ${a.doctor_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const statusIcon: Record<string, React.ReactNode> = {
    scheduled: <Clock className="w-4 h-4 text-muted-foreground" />,
    waiting: <CheckCircle className="w-4 h-4 text-secondary" />,
    in_progress: <Video className="w-4 h-4 text-primary" />,
  };

  return (
    <DashboardLayout title="Recepção" nav={getReceptionNav("checkin")}>
      <div className="max-w-3xl pb-24 md:pb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Check-in de Pacientes</h1>
        <p className="text-muted-foreground text-sm mb-4">Marque a chegada do paciente na sala virtual</p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar paciente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {loading ? <div className="shimmer-v2 h-20 rounded-2xl"/> : filtered.length === 0 ? (
          <Card className="border-border"><CardContent className="py-8 text-center text-muted-foreground">Nenhuma consulta pendente hoje.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => (
              <Card key={a.id} className={`border-border ${a.status === "waiting" ? "border-secondary/50 bg-secondary/5" : a.status === "in_progress" ? "border-primary/50 bg-primary/5" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {statusIcon[a.status]}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{a.patient_name}</p>
                        <p className="text-xs text-muted-foreground">{a.doctor_name} · {format(new Date(a.scheduled_at), "HH:mm")}</p>
                        {a.patient_phone && <p className="text-xs text-muted-foreground">📞 {a.patient_phone}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.status === "waiting" ? "secondary" : a.status === "in_progress" ? "default" : "outline"}>
                        {a.status === "scheduled" ? "Aguardando" : a.status === "waiting" ? "Na sala" : "Em consulta"}
                      </Badge>
                      {a.payment_status !== "confirmed" && a.status !== "in_progress" && (
                        <Button size="sm" variant="outline" onClick={() => confirmPayment(a.id)} className="text-green-600 border-green-300 hover:bg-green-50">
                          <DollarSign className="w-3 h-3 mr-1" /> Confirmar Pgto
                        </Button>
                      )}
                      {a.payment_status === "confirmed" && (
                        <Badge variant="outline" className="text-green-600 border-green-300 text-[10px]">Pago ✓</Badge>
                      )}
                      {a.status === "scheduled" && (
                        <>
                          <Button size="sm" onClick={() => doCheckin(a.id)}>
                            <CheckCircle className="w-3 h-3 mr-1" /> Check-in
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => markNoShow(a.id)}>
                            <XCircle className="w-3 h-3 mr-1" /> Faltou
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReceptionCheckin;
