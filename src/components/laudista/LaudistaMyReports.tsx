import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getLaudistaNav } from "@/components/laudista/laudistaNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, Eye, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const LaudistaMyReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: doctorProfile } = useQuery({
    queryKey: ["laudista-doctor-profile", user?.id],
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

  const { data: reports, isLoading } = useQuery({
    queryKey: ["laudista-my-reports", doctorProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_reports")
        .select("*, exam_requests!inner(exam_type, priority)")
        .eq("reporter_id", doctorProfile!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ExamReport[];
    },
    enabled: !!doctorProfile?.id,
  });

  return (
    <DashboardLayout nav={getLaudistaNav("my-reports")} title="Meus Laudos" role="doctor">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Meus Laudos Emitidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !reports?.length ? (
            <p className="text-center text-muted-foreground py-8">Nenhum laudo emitido ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exame</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report: { id: string; created_at: string; signed_at: string | null; verification_code: string | null; pdf_url: string | null; exam_request_id: string; exam_requests?: { exam_type: string } | null }) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.exam_requests?.exam_type ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={report.signed_at ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}>
                          {report.signed_at ? "Assinado" : "Rascunho"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(report.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {report.verification_code || "—"}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/laudista/report-editor/${report.exam_request_id}?role=doctor`)}>
                          <Eye className="w-3 h-3 mr-1" /> Ver
                        </Button>
                        {report.pdf_url && (
                          <Button size="sm" variant="ghost" onClick={async () => {
                            const { data } = await supabase.storage.from("prescriptions").createSignedUrl(report.pdf_url, 3600);
                            if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                          }}>
                            <Download className="w-3 h-3 mr-1" /> PDF
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

export default LaudistaMyReports;