import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Video, FileText, Pill, Upload, ArrowLeft, Activity } from "lucide-react";
import { getPatientNav } from "./patientNav";

interface TimelineEvent {
  id: string;
  date: string;
  type: "consultation" | "prescription" | "document" | "record";
  title: string;
  subtitle: string;
  icon: typeof Video;
  color: string;
}

const HealthTimeline = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchTimeline();
  }, [user]);

  const fetchTimeline = async () => {
    const [apptsRes, prescsRes, docsRes, recordsRes] = await Promise.all([
      supabase.from("appointments").select("id, scheduled_at, status, doctor_id").eq("patient_id", user!.id).eq("status", "completed").order("scheduled_at", { ascending: false }).limit(50),
      supabase.from("prescriptions").select("id, created_at, diagnosis, doctor_id").eq("patient_id", user!.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("patient_documents").select("id, created_at, file_name, description").eq("patient_id", user!.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("medical_records").select("id, created_at, title, record_type").eq("patient_id", user!.id).order("created_at", { ascending: false }).limit(50),
    ]);

    // Fetch doctor names
    const allDoctorIds = [
      ...new Set([
        ...(apptsRes.data?.map(a => a.doctor_id) ?? []),
        ...(prescsRes.data?.map(p => p.doctor_id) ?? []),
      ]),
    ];
    let docNames = new Map<string, string>();
    if (allDoctorIds.length > 0) {
      const { data: docs } = await supabase.from("doctor_profiles").select("id, user_id").in("id", allDoctorIds);
      if (docs && docs.length > 0) {
        const userIds = docs.map(d => d.user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);
        docs.forEach(d => {
          const p = profiles?.find(pr => pr.user_id === d.user_id);
          if (p) docNames.set(d.id, `Dr(a). ${p.first_name} ${p.last_name}`);
        });
      }
    }

    const timeline: TimelineEvent[] = [
      ...(apptsRes.data?.map(a => ({
        id: `appt-${a.id}`,
        date: a.scheduled_at,
        type: "consultation" as const,
        title: "Consulta Realizada",
        subtitle: docNames.get(a.doctor_id) ?? "Médico",
        icon: Video,
        color: "text-primary bg-primary/10",
      })) ?? []),
      ...(prescsRes.data?.map(p => ({
        id: `presc-${p.id}`,
        date: p.created_at,
        type: "prescription" as const,
        title: p.diagnosis || "Receita Médica",
        subtitle: docNames.get(p.doctor_id) ?? "Médico",
        icon: Pill,
        color: "text-warning bg-warning/10",
      })) ?? []),
      ...(docsRes.data?.map(d => ({
        id: `doc-${d.id}`,
        date: d.created_at,
        type: "document" as const,
        title: d.file_name,
        subtitle: d.description || "Documento anexado",
        icon: Upload,
        color: "text-secondary bg-secondary/10",
      })) ?? []),
      ...(recordsRes.data?.map(r => ({
        id: `rec-${r.id}`,
        date: r.created_at,
        type: "record" as const,
        title: r.title,
        subtitle: r.record_type,
        icon: FileText,
        color: "text-accent-foreground bg-accent/50",
      })) ?? []),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setEvents(timeline);
    setLoading(false);
  };

  // Group events by month
  const grouped = events.reduce<Record<string, TimelineEvent[]>>((acc, ev) => {
    const key = format(new Date(ev.date), "MMMM yyyy", { locale: ptBR });
    (acc[key] = acc[key] || []).push(ev);
    return acc;
  }, {});

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("health")}>
      <div className="max-w-2xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Linha do Tempo da Saúde</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : events.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Activity className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm">Nenhum evento registrado ainda.</p>
              <p className="text-xs mt-1">Após sua primeira consulta, sua linha do tempo aparecerá aqui.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([month, evts]) => (
              <div key={month}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs capitalize font-semibold">{month}</Badge>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="relative pl-6 border-l-2 border-border/50 space-y-3">
                  {evts.map(ev => {
                    const Icon = ev.icon;
                    return (
                      <div key={ev.id} className="relative">
                        <div className={`absolute -left-[calc(0.75rem+1px)] top-2 w-6 h-6 rounded-full flex items-center justify-center ${ev.color}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <Card className="border-border/50 hover:shadow-sm transition-shadow">
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                              <p className="text-xs text-muted-foreground">{ev.subtitle}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground shrink-0 ml-2">
                              {format(new Date(ev.date), "dd/MM · HH:mm")}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HealthTimeline;
