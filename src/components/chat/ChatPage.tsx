import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { getPatientNav } from "@/components/patient/patientNav";
import AppointmentChat from "./AppointmentChat";

interface ChatConversation {
  appointmentId: string;
  otherName: string;
  scheduledAt: string;
  status: string;
  lastMessage?: string;
  unreadCount: number;
}

const ChatPage = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selected, setSelected] = useState<ChatConversation | null>(null);
  const [loading, setLoading] = useState(true);

  const isDoctor = roles.includes("doctor");
  const forceRole = searchParams.get("role");
  const activeRole = forceRole || (isDoctor ? "doctor" : "patient");
  const nav = activeRole === "doctor" ? getDoctorNav("chat") : getPatientNav("chat");
  const backHref = activeRole === "doctor" ? "/dashboard?role=doctor" : "/dashboard?role=patient";

  useEffect(() => { if (user) fetchConversations(); }, [user]);

  const fetchConversations = async () => {
    // Get appointments involving this user
    let query = supabase.from("appointments").select("id, scheduled_at, status, patient_id, doctor_id")
      .in("status", ["scheduled", "waiting", "in_progress", "completed"])
      .order("scheduled_at", { ascending: false })
      .limit(50);

    if (isDoctor) {
      const { data: doc } = await supabase.from("doctor_profiles").select("id").eq("user_id", user!.id).single();
      if (doc) query = query.eq("doctor_id", doc.id);
      else { setLoading(false); return; }
    } else {
      query = query.eq("patient_id", user!.id);
    }

    const { data: appts } = await query;
    if (!appts || appts.length === 0) { setLoading(false); return; }

    // Get other user names
    const otherIds = isDoctor
      ? [...new Set(appts.map(a => a.patient_id).filter(Boolean))]
      : [...new Set(appts.map(a => a.doctor_id))];

    let nameMap = new Map<string, string>();

    if (isDoctor) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", otherIds as string[]);
      profiles?.forEach(p => nameMap.set(p.user_id, `${p.first_name} ${p.last_name}`));
    } else {
      const { data: docs } = await supabase.from("doctor_profiles").select("id, user_id").in("id", otherIds);
      const docUserIds = docs?.map(d => d.user_id) ?? [];
      const { data: profiles } = docUserIds.length > 0
        ? await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", docUserIds)
        : { data: [] };
      const pMap = new Map<string, string>();
      profiles?.forEach(p => pMap.set(p.user_id, `Dr(a). ${p.first_name} ${p.last_name}`));
      docs?.forEach(d => nameMap.set(d.id, pMap.get(d.user_id) ?? "Médico"));
    }

    // Get unread counts
    const apptIds = appts.map(a => a.id);
    const { data: unreadMsgs } = await supabase
      .from("messages")
      .select("appointment_id")
      .in("appointment_id", apptIds)
      .eq("is_read", false)
      .neq("sender_id", user!.id);

    const unreadMap = new Map<string, number>();
    (unreadMsgs ?? []).forEach((m: any) => {
      unreadMap.set(m.appointment_id, (unreadMap.get(m.appointment_id) ?? 0) + 1);
    });

    const convos: ChatConversation[] = appts.map(a => ({
      appointmentId: a.id,
      otherName: isDoctor
        ? (nameMap.get(a.patient_id ?? "") ?? "Paciente")
        : (nameMap.get(a.doctor_id) ?? "Médico"),
      scheduledAt: a.scheduled_at,
      status: a.status,
      unreadCount: unreadMap.get(a.id) ?? 0,
    }));

    setConversations(convos);
    setLoading(false);
  };

  const statusLabel: Record<string, string> = {
    scheduled: "Agendada", waiting: "Aguardando", in_progress: "Em andamento", completed: "Concluída",
  };

  return (
    <DashboardLayout title={activeRole === "doctor" ? "Médico" : "Paciente"} nav={nav} role={activeRole}>
      <div className="max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(backHref)} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-1">Mensagens</h1>
        <p className="text-muted-foreground mb-6">Converse com {activeRole === "doctor" ? "seus pacientes" : "seus médicos"}</p>

        <div className="grid md:grid-cols-[300px_1fr] gap-4">
          {/* Conversations list */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : conversations.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-8 text-center">
                  <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma conversa disponível.</p>
                </CardContent>
              </Card>
            ) : conversations.map(c => (
              <Card
                key={c.appointmentId}
                className={`border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                  selected?.appointmentId === c.appointmentId ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelected(c)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground truncate">{c.otherName}</p>
                    {c.unreadCount > 0 && (
                      <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5">{c.unreadCount}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(c.scheduledAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                  <Badge variant="outline" className="text-[10px] mt-1">{statusLabel[c.status] ?? c.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chat area */}
          <div className="min-h-[500px]">
            {selected ? (
              <AppointmentChat appointmentId={selected.appointmentId} otherUserName={selected.otherName} />
            ) : (
              <div className="flex items-center justify-center h-full border border-border rounded-lg bg-card">
                <p className="text-sm text-muted-foreground">Selecione uma conversa para começar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
