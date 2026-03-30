import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getLaudistaNav } from "@/components/laudista/laudistaNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Loader2, ClipboardList, Eye, UserCheck, AlertTriangle, Clock, Timer, Filter, Search, Radio } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow, differenceInMinutes, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_review: "Em Digitação",
  reported: "Laudado",
  delivered: "Entregue",
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  in_review: "bg-primary/10 text-primary border-primary/20",
  reported: "bg-success/10 text-success border-success/20",
  delivered: "bg-muted text-muted-foreground border-border",
};

function SlaCountdown({ deadline, priority }: { deadline: string; priority: string }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const deadlineDate = new Date(deadline);
  const isOverdue = isPast(deadlineDate);
  const totalMinutes = priority === "urgent" ? 120 : 1440;
  const minutesLeft = differenceInMinutes(deadlineDate, now);
  const progressPct = Math.max(0, Math.min(100, ((totalMinutes - minutesLeft) / totalMinutes) * 100));

  const timeText = isOverdue
    ? `Atrasado ${formatDistanceToNow(deadlineDate, { locale: ptBR })}`
    : formatDistanceToNow(deadlineDate, { addSuffix: false, locale: ptBR });

  return (
    <div className="space-y-1 min-w-[120px]">
      <div className="flex items-center gap-1">
        {isOverdue ? (
          <AlertTriangle className="w-3.5 h-3.5 text-destructive animate-pulse" />
        ) : progressPct > 75 ? (
          <Timer className="w-3.5 h-3.5 text-warning" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        )}
        <span className={`text-xs font-medium ${isOverdue ? "text-destructive" : progressPct > 75 ? "text-warning" : "text-muted-foreground"}`}>
          {timeText}
        </span>
      </div>
      <Progress
        value={progressPct}
        className={`h-1.5 ${isOverdue ? "[&>div]:bg-destructive" : progressPct > 75 ? "[&>div]:bg-warning" : "[&>div]:bg-primary"}`}
      />
    </div>
  );
}

const LaudistaReportQueue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const { data: doctorProfile } = useQuery({
    queryKey: ["laudista-doctor-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("doctor_profiles").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: examRequests, isLoading } = useQuery({
    queryKey: ["laudista-exam-queue", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("exam_requests")
        .select("*")
        .order("priority", { ascending: true })
        .order("created_at", { ascending: true });

      if (statusFilter === "active") {
        query = query.in("status", ["pending", "in_review"]);
      } else if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const patientIds = [...new Set((data || []).filter((e: any) => e.patient_id).map((e: any) => e.patient_id))];
      let patientMap: Record<string, string> = {};
      if (patientIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", patientIds);
        if (profiles) profiles.forEach((p: any) => { patientMap[p.user_id] = `${p.first_name} ${p.last_name}`.trim(); });
      }

      const clinicIds = [...new Set((data || []).filter((e: any) => e.requesting_clinic_id).map((e: any) => e.requesting_clinic_id))];
      let clinicMap: Record<string, string> = {};
      if (clinicIds.length > 0) {
        const { data: clinics } = await supabase.from("clinic_profiles").select("id, name").in("id", clinicIds);
        if (clinics) clinics.forEach((c: any) => { clinicMap[c.id] = c.name; });
      }

      return (data || []).map((e: any) => ({
        ...e,
        patient_display: e.patient_name || (e.patient_id ? patientMap[e.patient_id] || "Paciente" : "—"),
        origin: e.requesting_clinic_id ? clinicMap[e.requesting_clinic_id] || "Clínica" : "Médico",
      }));
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("laudista-exam-queue-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exam_requests" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["laudista-exam-queue"] });
          queryClient.invalidateQueries({ queryKey: ["laudista-stats"] });
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const filteredExams = examRequests?.filter((exam: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      exam.exam_type?.toLowerCase().includes(q) ||
      exam.patient_display?.toLowerCase().includes(q) ||
      exam.origin?.toLowerCase().includes(q)
    );
  }) ?? [];

  const handleClaim = async (examId: string) => {
    if (!doctorProfile?.id) {
      toast.error("Erro", { description: "Perfil de médico não encontrado." });
      return;
    }
    setClaimingId(examId);
    try {
      const { error } = await supabase
        .from("exam_requests")
        .update({ assigned_to: doctorProfile.id, status: "in_review" })
        .eq("id", examId);
      if (error) throw error;
      toast.success("Exame assumido!", { description: "Você pode iniciar o laudo agora." });
      queryClient.invalidateQueries({ queryKey: ["laudista-exam-queue"] });
    } catch (err: unknown) {
      toast.error("Erro", { description: err instanceof Error ? err.message : "Erro desconhecido" });
    } finally {
      setClaimingId(null);
    }
  };

  const stats = {
    pending: examRequests?.filter((e: any) => e.status === "pending").length || 0,
    inReview: examRequests?.filter((e: any) => e.status === "in_review").length || 0,
    urgent: examRequests?.filter((e: any) => e.priority === "urgent" && e.status !== "reported").length || 0,
    overdue: examRequests?.filter((e: any) => e.sla_deadline && isPast(new Date(e.sla_deadline)) && e.status !== "reported").length || 0,
  };

  return (
    <DashboardLayout nav={getLaudistaNav("queue")} title="Worklist de Laudos" role="laudista">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4 pb-24 md:pb-8"
      >
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Pendentes", value: stats.pending, highlight: false, color: "" },
            { label: "Em Digitação", value: stats.inReview, highlight: false, color: "text-primary" },
            { label: "🚨 Urgentes", value: stats.urgent, highlight: stats.urgent > 0, color: "" },
            { label: "⏰ SLA Estourado", value: stats.overdue, highlight: stats.overdue > 0, color: "" },
          ].map((s) => (
            <Card key={s.label} className={`p-3 border-border/50 ${s.highlight ? (s.label.includes("Urgente") ? "border-destructive/50 bg-destructive/5" : "border-warning/50 bg-warning/5") : ""}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <Badge variant={s.highlight ? "destructive" : s.color ? "outline" : "secondary"} className={`text-lg font-bold ${s.color}`}>
                  {s.value}
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-white" />
              </div>
              Fila de Trabalho
              {realtimeConnected && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-1 bg-success/10 text-success border-success/20">
                  <Radio className="w-2.5 h-2.5 animate-pulse" /> Ao vivo
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente, exame..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 w-48 text-xs"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-8 text-sm">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="in_review">Em Digitação</SelectItem>
                  <SelectItem value="reported">Laudados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : filteredExams.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">
                  {searchQuery ? "Nenhum resultado encontrado" : "Nenhum exame na fila"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchQuery ? "Tente alterar os filtros de busca" : "Os exames aparecerão aqui quando forem enviados pelas clínicas."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Exame</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead>Recebido</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExams.map((exam: any) => {
                      const isOverdue = exam.sla_deadline && isPast(new Date(exam.sla_deadline)) && exam.status !== "reported";
                      return (
                        <TableRow
                          key={exam.id}
                          className={
                            exam.priority === "urgent" && exam.status !== "reported"
                              ? "bg-destructive/5 hover:bg-destructive/10"
                              : isOverdue
                              ? "bg-warning/5 hover:bg-warning/10"
                              : ""
                          }
                        >
                          <TableCell>
                            <div>
                              <span className="font-medium">{exam.exam_type}</span>
                              {exam.specialty_required && (
                                <span className="block text-[10px] text-muted-foreground">{exam.specialty_required}</span>
                              )}
                              {exam.source && exam.source !== "manual" && (
                                <Badge variant="outline" className="text-[9px] mt-0.5">{exam.source === "orthanc" ? "DICOM Router" : exam.source}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{exam.patient_display}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{exam.origin}</TableCell>
                          <TableCell>
                            <Badge variant={exam.priority === "urgent" ? "destructive" : "secondary"}>
                              {exam.priority === "urgent" ? "🚨 Urgente" : "Normal"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[exam.status] || ""} variant="outline">
                              {statusLabels[exam.status] || exam.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {exam.sla_deadline && exam.status !== "reported" ? (
                              <SlaCountdown deadline={exam.sla_deadline} priority={exam.priority} />
                            ) : exam.status === "reported" ? (
                              <span className="text-xs text-success">✅ Concluído</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(exam.created_at), "dd/MM HH:mm", { locale: ptBR })}
                            {exam.started_at && exam.status === "in_review" && (
                              <span className="block text-[10px]">
                                Iniciado {formatDistanceToNow(new Date(exam.started_at), { locale: ptBR, addSuffix: true })}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            {exam.status === "pending" && (
                              <Button size="sm" variant={exam.priority === "urgent" ? "destructive" : "outline"} onClick={() => handleClaim(exam.id)} disabled={claimingId === exam.id} className="rounded-lg">
                                {claimingId === exam.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <UserCheck className="w-3 h-3 mr-1" />}
                                Assumir
                              </Button>
                            )}
                            {(exam.status === "in_review" || exam.status === "reported") && (
                              <Button size="sm" variant={exam.status === "in_review" && isOverdue ? "destructive" : "default"} onClick={() => navigate(`/dashboard/laudista/report-editor/${exam.id}?role=laudista`)} className="rounded-lg">
                                <Eye className="w-3 h-3 mr-1" />
                                {exam.status === "in_review" ? "Laudar" : "Ver"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default LaudistaReportQueue;
