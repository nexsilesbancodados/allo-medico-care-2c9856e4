import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ClipboardList, Eye, UserCheck } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_review: "Em Análise",
  reported: "Laudado",
  delivered: "Entregue",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  in_review: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  reported: "bg-green-500/10 text-green-700 border-green-500/30",
  delivered: "bg-muted text-muted-foreground border-border",
};

const ExamReportQueue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const { data: doctorProfile } = useQuery({
    queryKey: ["doctor-profile-queue", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: examRequests, isLoading } = useQuery({
    queryKey: ["exam-requests-queue", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("exam_requests" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch patient names
      const patientIds = [...new Set((data || []).filter((e: any) => e.patient_id).map((e: any) => e.patient_id))];
      let patientMap: Record<string, string> = {};
      if (patientIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", patientIds);
        if (profiles) {
          profiles.forEach((p: any) => {
            patientMap[p.user_id] = `${p.first_name} ${p.last_name}`.trim();
          });
        }
      }

      return (data || []).map((e: any) => ({
        ...e,
        patient_name: e.patient_id ? patientMap[e.patient_id] || "Paciente" : (e.clinical_info?.match(/Paciente: (.+)/)?.[1] || "—"),
      }));
    },
    enabled: !!user,
  });

  const handleClaim = async (examId: string) => {
    if (!doctorProfile?.id) return;
    setClaimingId(examId);
    try {
      const { error } = await supabase
        .from("exam_requests" as any)
        .update({ assigned_to: doctorProfile.id, status: "in_review" })
        .eq("id", examId);
      if (error) throw error;
      toast.success("Exame assumido!", { description: "Você pode iniciar o laudo agora." });
      queryClient.invalidateQueries({ queryKey: ["exam-requests-queue"] });
    } catch (err: unknown) {
      toast.error("Erro", { description: err instanceof Error ? err.message : "Erro desconhecido" });
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <DashboardLayout nav={getDoctorNav("report-queue")} title="Fila de Laudos">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Exames para Laudar
          </CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="in_review">Em Análise</SelectItem>
              <SelectItem value="reported">Laudados</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !examRequests?.length ? (
            <p className="text-center text-muted-foreground py-8">Nenhum exame na fila.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examRequests.map((exam: any) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.exam_type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{exam.patient_name}</TableCell>
                      <TableCell>
                        <Badge variant={exam.priority === "urgent" ? "destructive" : "secondary"}>
                          {exam.priority === "urgent" ? "Urgente" : "Normal"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[exam.status] || ""} variant="outline">
                          {statusLabels[exam.status] || exam.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(exam.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {exam.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClaim(exam.id)}
                            disabled={claimingId === exam.id}
                          >
                            {claimingId === exam.id ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <UserCheck className="w-3 h-3 mr-1" />
                            )}
                            Assumir
                          </Button>
                        )}
                        {(exam.status === "in_review" || exam.status === "reported") && (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/dashboard/doctor/report-editor/${exam.id}?role=doctor`)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {exam.status === "in_review" ? "Laudar" : "Ver Laudo"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ExamReportQueue;
