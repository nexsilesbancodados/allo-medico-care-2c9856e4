import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardList, Plus, Eye, FileText, Download, ExternalLink } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_review: "Em Digitação",
  reported: "Laudado",
  delivered: "Entregue",
};

const statusVariant: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  in_review: "bg-primary/10 text-primary border-primary/20",
  reported: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  delivered: "bg-muted text-muted-foreground border-border",
};

const ClinicMyExams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Get clinic profile
  const { data: clinicProfile } = useQuery({
    queryKey: ["clinic-profile-myexams", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("clinic_profiles")
        .select("id, name")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Fetch exam requests
  const { data: exams, isLoading } = useQuery({
    queryKey: ["clinic-exam-requests", clinicProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_requests")
        .select("*")
        .eq("requesting_clinic_id", clinicProfile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clinicProfile?.id,
  });

  // Real-time updates
  useEffect(() => {
    if (!clinicProfile?.id) return;
    const channel = supabase
      .channel("clinic-exams-rt")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "exam_requests",
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["clinic-exam-requests", clinicProfile.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clinicProfile?.id, queryClient]);

  const openReport = async (exam: any) => {
    setSelectedExam(exam);
    setLoadingReport(true);
    try {
      const { data } = await supabase
        .from("exam_reports")
        .select("*, doctor_profiles:reporter_id(crm, crm_state, user_id)")
        .eq("exam_request_id", exam.id)
        .maybeSingle();

      if (data) {
        // Get reporter name
        let reporterName = "Laudista";
        if ((data as any).doctor_profiles?.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("user_id", (data as any).doctor_profiles.user_id)
            .maybeSingle();
          if (profile) reporterName = `Dr(a). ${profile.first_name} ${profile.last_name}`.trim();
        }
        setReport({ ...data, reporter_name: reporterName });
      }
    } catch {
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const nav = [
    { label: "Visão Geral", href: "/dashboard?role=clinic", icon: <ClipboardList className="w-4 h-4" />, active: false, group: "Principal" },
    { label: "Meus Laudos", href: "/dashboard/clinic/my-exams?role=clinic", icon: <FileText className="w-4 h-4" />, active: true, group: "Telelaudo" },
    { label: "Solicitar Laudo", href: "/dashboard/clinic/exam-request?role=clinic", icon: <Plus className="w-4 h-4" />, active: false, group: "Telelaudo" },
  ];

  return (
    <DashboardLayout nav={nav} title="Meus Laudos" role="clinic">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Exames Enviados</h1>
          <Button
            onClick={() => navigate("/dashboard/clinic/exam-request?role=clinic")}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Solicitar Exame
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : !exams?.length ? (
              <div className="text-center py-16">
                <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Nenhum exame enviado ainda</p>
                <p className="text-xs text-muted-foreground mt-1">Envie seu primeiro exame para receber o laudo</p>
                <Button className="mt-4" onClick={() => navigate("/dashboard/clinic/exam-request?role=clinic")}>
                  <Plus className="w-4 h-4 mr-2" /> Solicitar Exame
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data Envio</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Laudo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.map((exam: any) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">
                          {exam.patient_name || "—"}
                        </TableCell>
                        <TableCell className="text-sm">{exam.exam_type}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(exam.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={exam.priority === "urgent" ? "destructive" : "secondary"}>
                            {exam.priority === "urgent" ? "🚨 Urgente" : "Normal"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusVariant[exam.status] || ""} variant="outline">
                            {statusLabels[exam.status] || exam.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {exam.status === "reported" || exam.status === "delivered" ? (
                            <Button size="sm" variant="outline" onClick={() => openReport(exam)}>
                              <Eye className="w-3 h-3 mr-1" /> Ver Laudo
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Aguardando</span>
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
      </div>

      {/* Report Dialog */}
      <Dialog open={!!selectedExam} onOpenChange={(open) => { if (!open) { setSelectedExam(null); setReport(null); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Laudo — {selectedExam?.exam_type}
            </DialogTitle>
          </DialogHeader>

          {loadingReport ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : report ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Paciente:</span>
                  <p className="font-medium">{selectedExam?.patient_name || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo de Exame:</span>
                  <p className="font-medium">{selectedExam?.exam_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Laudista:</span>
                  <p className="font-medium">{report.reporter_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CRM:</span>
                  <p className="font-medium">
                    {(report as any).doctor_profiles?.crm}/{(report as any).doctor_profiles?.crm_state}
                  </p>
                </div>
                {report.signed_at && (
                  <div>
                    <span className="text-muted-foreground">Data Assinatura:</span>
                    <p className="font-medium">
                      {format(new Date(report.signed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
                {report.verification_code && (
                  <div>
                    <span className="text-muted-foreground">Código Verificação:</span>
                    <p className="font-mono text-xs">{report.verification_code}</p>
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="text-sm font-semibold mb-2">Laudo</h4>
                <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                  {report.content_text}
                </div>
              </div>

              {report.pdf_url && (
                <Button variant="outline" className="w-full gap-2" asChild>
                  <a href={report.pdf_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4" />
                    Baixar PDF do Laudo
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">Laudo não encontrado.</p>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClinicMyExams;
