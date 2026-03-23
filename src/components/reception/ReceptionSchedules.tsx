import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getReceptionNav } from "./receptionNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

const ReceptionSchedules = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("all");
  const [weekAppts, setWeekAppts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDoctors(); }, []);
  useEffect(() => { fetchWeek(); }, [selectedDoctor]);

  const fetchDoctors = async () => {
    const { data: docProfiles } = await supabase.from("doctor_profiles").select("id, user_id").eq("is_approved", true);
    if (!docProfiles) return;
    const userIds = docProfiles.map(d => d.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);
    const pMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
    setDoctors(docProfiles.map(d => ({
      ...d, name: pMap.has(d.user_id) ? `Dr(a). ${pMap.get(d.user_id)!.first_name} ${pMap.get(d.user_id)!.last_name}` : "—",
    })));
  };

  const fetchWeek = async () => {
    setLoading(true);
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);

    let query = supabase.from("appointments")
      .select("id, scheduled_at, status, patient_id, doctor_id, appointment_type")
      .gte("scheduled_at", weekStart.toISOString())
      .lt("scheduled_at", weekEnd.toISOString())
      .order("scheduled_at", { ascending: true });

    if (selectedDoctor !== "all") {
      query = query.eq("doctor_id", selectedDoctor);
    }

    const { data } = await query;
    if (!data) { setLoading(false); return; }

    const patientIds = [...new Set(data.map(a => a.patient_id).filter(Boolean))];
    const { data: pProfiles } = patientIds.length > 0
      ? await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", patientIds.filter((id): id is string => !!id))
      : { data: [] };
    const pMap = new Map((pProfiles ?? []).map(p => [p.user_id, `${p.first_name} ${p.last_name}`]));

    setWeekAppts(data.map(a => ({ ...a, patient_name: pMap.get(a.patient_id!) ?? "—" })));
    setLoading(false);
  };

  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i));
  const doctorName = (docId: string) => doctors.find(d => d.id === docId)?.name ?? "—";

  const statusColor: Record<string, string> = {
    scheduled: "bg-primary/10 text-primary", waiting: "bg-secondary/10 text-secondary",
    in_progress: "bg-primary text-primary-foreground", completed: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/10 text-destructive", no_show: "bg-destructive/10 text-destructive",
  };

  return (
    <DashboardLayout title="Recepção" nav={getReceptionNav("schedules")}>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Agendas</h1>
            <p className="text-muted-foreground text-sm">Visão semanal multimédico</p>
          </div>
          <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Filtrar médico" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Médicos</SelectItem>
              {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? <div className="shimmer-v2 h-5 rounded w-32 inline-block" aria-label="Carregando" /> : (
          <div className="grid grid-cols-7 gap-2">
            {days.map(day => {
              const dayStr = format(day, "yyyy-MM-dd");
              const dayAppts = weekAppts.filter(a => a.scheduled_at.startsWith(dayStr));
              const isToday = format(new Date(), "yyyy-MM-dd") === dayStr;
              return (
                <div key={dayStr}>
                  <div className={`text-center p-2 rounded-t-lg text-sm font-medium ${isToday ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <p>{format(day, "EEE", { locale: ptBR })}</p>
                    <p className="text-lg font-bold">{format(day, "dd")}</p>
                  </div>
                  <div className="border border-border rounded-b-lg min-h-[200px] p-1 space-y-1">
                    {dayAppts.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground text-center py-4">—</p>
                    ) : dayAppts.map(a => (
                      <div key={a.id} className={`rounded p-1.5 text-[11px] ${statusColor[a.status] ?? "bg-muted"}`}>
                        <p className="font-bold">{format(new Date(a.scheduled_at), "HH:mm")}</p>
                        <p className="truncate">{a.patient_name}</p>
                        {selectedDoctor === "all" && <p className="truncate opacity-70">{doctorName(a.doctor_id)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReceptionSchedules;
