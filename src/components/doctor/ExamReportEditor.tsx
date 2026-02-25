import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { getLaudistaNav } from "@/components/laudista/laudistaNav";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileSignature, Download, Eye, Shield, Database, ImageIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gerarHashDocumento, gerarCodigoVerificacao } from "@/lib/signature";
import jsPDF from "jspdf";
import DicomViewer from "@/components/consultation/DicomViewer";

const ExamReportEditor = () => {
  const { examId } = useParams<{ examId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLaudista = location.pathname.includes("/laudista/");
  const nav = isLaudista ? getLaudistaNav("queue") : getDoctorNav("report-queue");
  const backRoute = isLaudista ? "/dashboard/laudista/queue?role=doctor" : "/dashboard/doctor/report-queue?role=doctor";
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [signing, setSigning] = useState(false);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [icpStatus, setIcpStatus] = useState<"idle" | "loading" | "signed" | "unavailable">("idle");
  const [pacsStatus, setPacsStatus] = useState<"idle" | "loading" | "connected" | "unavailable">("idle");
  const [activeDicomUrl, setActiveDicomUrl] = useState<string | null>(null);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);

  const { data: doctorProfile } = useQuery({
    queryKey: ["doctor-profile-editor", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("doctor_profiles")
        .select("id, crm, crm_state")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-editor", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: examRequest, isLoading: loadingExam } = useQuery({
    queryKey: ["exam-request-detail", examId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_requests" as any)
        .select("*")
        .eq("id", examId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!examId,
  });

  const { data: existingReport } = useQuery({
    queryKey: ["exam-report-existing", examId],
    queryFn: async () => {
      const { data } = await supabase
        .from("exam_reports" as any)
        .select("*")
        .eq("exam_request_id", examId!)
        .maybeSingle();
      return data as any;
    },
    enabled: !!examId,
  });

  const { data: templates } = useQuery({
    queryKey: ["report-templates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("report_templates" as any)
        .select("*")
        .eq("is_active", true)
        .order("title");
      return data as any[];
    },
  });

  // Load existing report content
  useEffect(() => {
    if (existingReport?.content_text) {
      setContent(existingReport.content_text);
    }
  }, [existingReport]);

  // Generate signed URLs for exam files (or use directly if external URL)
  useEffect(() => {
    if (!examRequest?.file_urls) return;
    const urls = examRequest.file_urls as string[];
    if (!urls.length) return;
    Promise.all(
      urls.map(async (path: string) => {
        if (path.startsWith("http://") || path.startsWith("https://")) {
          return path;
        }
        const { data } = await supabase.storage
          .from("exam-files")
          .createSignedUrl(path, 3600);
        return data?.signedUrl || "";
      })
    ).then((resolved) => setFileUrls(resolved.filter(Boolean)));
  }, [examRequest]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = templates?.find((t: any) => t.id === templateId);
    if (tpl) {
      setContent(tpl.body_text);
    }
  };

  const handleSignAndFinalize = async () => {
    if (!doctorProfile?.id || !content.trim()) {
      toast({ title: "Erro", description: "Preencha o laudo antes de assinar.", variant: "destructive" });
      return;
    }

    setSigning(true);
    try {
      const documentHash = await gerarHashDocumento(content);
      const verificationCode = gerarCodigoVerificacao();
      const doctorName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();

      // Generate PDF
      const pdf = new jsPDF();
      pdf.setFontSize(16);
      pdf.text("LAUDO MÉDICO", 105, 20, { align: "center" });
      pdf.setFontSize(10);
      pdf.text(`Tipo de Exame: ${examRequest?.exam_type || ""}`, 20, 35);
      pdf.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 20, 42);
      pdf.text(`Médico Laudista: Dr(a). ${doctorName}`, 20, 49);
      pdf.text(`CRM: ${doctorProfile.crm}/${doctorProfile.crm_state}`, 20, 56);

      if (examRequest?.clinical_info) {
        pdf.setFontSize(11);
        pdf.text("Informações Clínicas:", 20, 68);
        pdf.setFontSize(9);
        const clinicalLines = pdf.splitTextToSize(examRequest.clinical_info, 170);
        pdf.text(clinicalLines, 20, 75);
      }

      pdf.setFontSize(11);
      const yStart = examRequest?.clinical_info ? 75 + pdf.splitTextToSize(examRequest.clinical_info, 170).length * 5 + 10 : 68;
      pdf.text("Laudo:", 20, yStart);
      pdf.setFontSize(9);
      const contentLines = pdf.splitTextToSize(content, 170);
      pdf.text(contentLines, 20, yStart + 7);

      // Footer with hash
      pdf.setFontSize(7);
      pdf.text(`Código de Verificação: ${verificationCode}`, 20, 280);
      pdf.text(`Hash SHA-256: ${documentHash.substring(0, 32)}...`, 20, 284);
      pdf.text("Verifique em: /validar", 20, 288);

      const pdfBlob = pdf.output("blob");
      const pdfPath = `reports/${examId}/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("prescriptions")
        .upload(pdfPath, pdfBlob, { contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      // Save or update report
      if (existingReport?.id) {
        const { error } = await supabase
          .from("exam_reports" as any)
          .update({
            content_text: content,
            template_id: selectedTemplateId || null,
            pdf_url: pdfPath,
            document_hash: documentHash,
            verification_code: verificationCode,
            signed_at: new Date().toISOString(),
          } as any)
          .eq("id", existingReport.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exam_reports" as any).insert({
          exam_request_id: examId,
          reporter_id: doctorProfile.id,
          content_text: content,
          template_id: selectedTemplateId || null,
          pdf_url: pdfPath,
          document_hash: documentHash,
          verification_code: verificationCode,
          signed_at: new Date().toISOString(),
        } as any);
        if (error) throw error;
      }

      // Update exam request status
      await supabase
        .from("exam_requests" as any)
        .update({ status: "reported" } as any)
        .eq("id", examId);

      // Try ICP-Brasil signature via VIDaaS (optional enhancement)
      try {
        const icpRes = await supabase.functions.invoke("vidaas-sign", {
          body: {
            action: "sign",
            document_hash: documentHash,
            document_type: "exam_report",
            doctor_name: doctorName,
            doctor_crm: `${doctorProfile.crm}/${doctorProfile.crm_state}`,
            verification_code: verificationCode,
          },
        });
        if (icpRes.data?.success) {
          setIcpStatus("signed");
        }
      } catch {
        // ICP-Brasil is optional — SHA-256 signature is always applied
      }

      // Register in document_verifications
      await supabase.from("document_verifications").insert({
        doctor_name: doctorName,
        doctor_crm: `${doctorProfile.crm}/${doctorProfile.crm_state}`,
        patient_name: "Paciente",
        document_type: "exam_report",
        document_hash: documentHash,
        verification_code: verificationCode,
      });

      // Notify requesting doctor
      if (examRequest?.requesting_doctor_id) {
        const { data: reqDoctor } = await supabase
          .from("doctor_profiles")
          .select("user_id")
          .eq("id", examRequest.requesting_doctor_id)
          .maybeSingle();
        if (reqDoctor?.user_id) {
          await supabase.from("notifications").insert({
            user_id: reqDoctor.user_id,
            title: "📋 Laudo Concluído",
            message: `O laudo do exame ${examRequest.exam_type} foi finalizado.`,
            type: "exam_report",
            link: `/dashboard/doctor/report-editor/${examId}?role=doctor`,
          });
        }
      }

      // Notify patient via WhatsApp + Email
      if (examRequest?.patient_id) {
        const { data: patientProfile } = await supabase
          .from("profiles")
          .select("user_id, first_name, phone")
          .eq("user_id", examRequest.patient_id)
          .maybeSingle();

        if (patientProfile) {
          // In-app notification
          await supabase.from("notifications").insert({
            user_id: patientProfile.user_id,
            title: "📋 Seu laudo está pronto!",
            message: `O laudo do exame ${examRequest.exam_type} foi concluído. Acesse sua área de saúde para visualizar.`,
            type: "exam_report",
            link: "/dashboard/health",
          });

          // WhatsApp notification via edge function
          if (patientProfile.phone) {
            supabase.functions.invoke("send-whatsapp", {
              body: {
                phone: patientProfile.phone,
                message: `🩺 *Allo Médico* — Laudo Pronto!\n\nOlá, ${patientProfile.first_name}!\nSeu laudo de *${examRequest.exam_type}* foi finalizado pelo Dr(a). ${doctorName}.\n\n📄 Acesse sua área de saúde para visualizar e baixar o PDF.\n\nCódigo de verificação: ${verificationCode}`,
              },
            }).catch(console.error);
          }

          // Email notification via edge function
          supabase.functions.invoke("send-email", {
            body: {
              to: examRequest.patient_id,
              subject: `Seu laudo de ${examRequest.exam_type} está pronto`,
              html: `<h2>Laudo Médico Finalizado</h2><p>Olá ${patientProfile.first_name},</p><p>Seu laudo de <strong>${examRequest.exam_type}</strong> foi concluído pelo Dr(a). ${doctorName}.</p><p>Código de verificação: <strong>${verificationCode}</strong></p><p>Acesse a plataforma para visualizar e baixar o PDF.</p>`,
            },
          }).catch(console.error);
        }
      }

      toast({ title: "Laudo assinado e finalizado!", description: `Código: ${verificationCode}` });
      queryClient.invalidateQueries({ queryKey: ["exam-requests-queue"] });
      navigate(backRoute);
    } catch (err: any) {
      toast({ title: "Erro ao assinar", description: err.message, variant: "destructive" });
    } finally {
      setSigning(false);
    }
  };

  if (loadingExam) {
    return (
      <DashboardLayout nav={nav} title="Editor de Laudo">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const isReported = examRequest?.status === "reported" && existingReport?.signed_at;

  return (
    <DashboardLayout nav={nav} title="Editor de Laudo">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: File Viewer */}
        <Card className="h-[calc(100vh-12rem)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Arquivos do Exame — {examRequest?.exam_type}
              {examRequest?.priority === "urgent" && (
                <Badge variant="destructive">Urgente</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full pb-4">
            {examRequest?.clinical_info && (
              <div className="mb-3 p-3 bg-muted rounded-md text-sm">
                <strong>Anamnese:</strong> {examRequest.clinical_info}
              </div>
            )}
            {/* DICOM Viewer */}
            {activeDicomUrl && (
              <div className="mb-3 h-80">
                <DicomViewer fileUrl={activeDicomUrl} fileName="Exame DICOM" />
              </div>
            )}

            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: activeDicomUrl ? "calc(100% - 28rem)" : "calc(100% - 6rem)" }}>
              {fileUrls.map((url, i) => {
                const originalPath = (examRequest?.file_urls as string[])?.[i] || "";
                const isPdf = originalPath.toLowerCase().endsWith(".pdf");
                const isDicom = originalPath.toLowerCase().endsWith(".dcm") || originalPath.toLowerCase().endsWith(".dicom");
                return (
                  <div key={i} className="border rounded-md overflow-hidden">
                    {isDicom ? (
                      <Button
                        variant="outline"
                        className="w-full h-16"
                        onClick={() => setActiveDicomUrl(url)}
                      >
                        <ImageIcon className="w-4 h-4 mr-2" /> Abrir DICOM #{i + 1} no Visualizador
                      </Button>
                    ) : isPdf ? (
                      <iframe src={url} className="w-full h-96" title={`Exame ${i + 1}`} />
                    ) : (
                      <img
                        src={url}
                        alt={`Exame ${i + 1}`}
                        className="w-full object-contain max-h-96 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setFullscreenImageUrl(url)}
                        title="Clique para ver em tela cheia"
                      />
                    )}
                  </div>
                );
              })}
              {fileUrls.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhum arquivo disponível.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Report Editor */}
        <Card className="h-[calc(100vh-12rem)] flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSignature className="w-4 h-4" />
              {isReported ? "Laudo Finalizado" : "Redigir Laudo"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            {!isReported && templates && templates.length > 0 && (
              <div>
                <Label className="text-xs">Modelo de Laudo</Label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Selecionar template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.title} ({t.exam_type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Digite o laudo médico aqui..."
              className="flex-1 min-h-[200px] resize-none text-sm"
              readOnly={!!isReported}
            />

            {isReported ? (
              <div className="space-y-2">
                <Badge className="bg-primary/10 text-primary border-primary/30" variant="outline">
                  ✅ Assinado em {new Date(existingReport.signed_at).toLocaleString("pt-BR")}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Código: {existingReport.verification_code} | Hash: {existingReport.document_hash?.substring(0, 16)}...
                </p>
                {existingReport.pdf_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const { data } = await supabase.storage
                        .from("prescriptions")
                        .createSignedUrl(existingReport.pdf_url, 3600);
                      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                    }}
                  >
                    <Download className="w-3 h-3 mr-1" /> Baixar PDF
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={handleSignAndFinalize}
                disabled={signing || !content.trim()}
                className="w-full"
              >
                {signing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSignature className="w-4 h-4 mr-2" />}
                {signing ? "Assinando..." : "Assinar e Finalizar Laudo"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Fullscreen image dialog */}
      <Dialog open={!!fullscreenImageUrl} onOpenChange={() => setFullscreenImageUrl(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 flex items-center justify-center">
          {fullscreenImageUrl && (
            <img
              src={fullscreenImageUrl}
              alt="Exame em tela cheia"
              className="max-w-full max-h-[90vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ExamReportEditor;
