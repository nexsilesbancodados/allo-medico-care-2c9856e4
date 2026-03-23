import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "@/components/patient/patientNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, Download, Eye, ShieldCheck, Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { generateShareableLink } from "@/lib/services/report-service";
import { toastShareLinkCopied, toastShareLinkFailed } from "@/lib/toast-helpers";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_review: "Em Análise",
  reported: "Laudo Pronto",
  delivered: "Entregue",
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  in_review: "bg-primary/10 text-primary border-primary/20",
  reported: "bg-success/10 text-success border-success/20",
  delivered: "bg-muted text-muted-foreground border-border",
};

const PatientExamResults = () => {
  const { user } = useAuth();

  const { data: examRequests, isLoading } = useQuery({
    queryKey: ["patient-exam-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_requests")
        .select("*")
        .eq("patient_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  interface ExamReportRow {
    id: string;
    exam_request_id: string;
    verification_code: string | null;
    pdf_url: string | null;
    signed_at: string | null;
  }

  const { data: examReports } = useQuery({
    queryKey: ["patient-exam-reports", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_reports")
        .select("id, exam_request_id, verification_code, pdf_url, signed_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ExamReportRow[];
    },
    enabled: !!user,
  });

  const getReportForExam = (examId: string) => {
    return examReports?.find((r) => r.exam_request_id === examId);
  };

  const handleDownloadPdf = async (pdfUrl: string) => {
    const { data } = await supabase.storage
      .from("prescriptions")
      .createSignedUrl(pdfUrl, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <DashboardLayout nav={getPatientNav("exam-results")} title="Resultados de Exames">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Meus Laudos e Exames
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !examRequests?.length ? (
            <div className="text-center py-12 space-y-2">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <div className="text-center py-8 rounded-2xl border border-dashed border-border/40 bg-muted/10 mt-4"><img src="/src/assets/mascot-reading.png" alt="Pingo" className="w-20 h-20 object-contain mx-auto drop-shadow-md mb-2 select-none" /><p className="text-[13px] font-semibold text-foreground mb-1">Nenhum exame solicitado ainda</p><p className="text-[11px] text-muted-foreground">Seus exames solicitados aparecerão aqui</p></div>
              <p className="text-xs text-muted-foreground">Quando seu médico solicitar laudos, eles aparecerão aqui.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de Exame</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Verificação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examRequests.map((exam) => {
                    const report = getReportForExam(exam.id);
                    return (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.exam_type}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[exam.status] || ""} variant="outline">
                            {statusLabels[exam.status] || exam.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(exam.created_at), "dd/MM/yy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {report?.verification_code ? (
                            <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-success" />
                              {report.verification_code}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {report?.pdf_url ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadPdf(report.pdf_url!)}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Baixar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  const link = await generateShareableLink(report.pdf_url!);
                                  if (link) {
                                    await navigator.clipboard.writeText(link);
                                    toastShareLinkCopied();
                                  } else {
                                    toastShareLinkFailed();
                                  }
                                }}
                              >
                                <Share2 className="w-3 h-3 mr-1" />
                                Compartilhar
                              </Button>
                            </>
                          ) : exam.status === "reported" || exam.status === "delivered" ? (
                            <Badge variant="secondary" className="text-xs">Processando...</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Aguardando laudo</span>
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
    </DashboardLayout>
  );
};

export default PatientExamResults;
