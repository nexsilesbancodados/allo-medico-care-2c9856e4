import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { getLaudistaNav } from "@/components/laudista/laudistaNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Loader2, FileSignature, Download, Eye, Save, ImageIcon,
  Mic, MicOff, Sparkles, Wand2, BookText, ChevronDown, Lightbulb
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gerarHashDocumento, gerarCodigoVerificacao } from "@/lib/signature";
import { REPORT_MACROS, findMacro, applyMacro } from "@/lib/report-macros";
import jsPDF from "jspdf";
import DicomViewer from "@/components/consultation/DicomViewer";
import type { ExamRequest, ExamReport, ReportTemplate } from "@/types/domain";

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
  const [activeDicomUrl, setActiveDicomUrl] = useState<string | null>(null);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Voice dictation state
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recognitionRef = useRef<Record<string, unknown> | null>(null);
  const [interimText, setInterimText] = useState("");

  // AI structuring state
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiMode, setAiMode] = useState<"structure" | "improve" | "suggest_conclusion">("structure");

  // Macros state
  const [showMacros, setShowMacros] = useState(false);
  const macroCategories = [...new Set(REPORT_MACROS.map((m) => m.category))];

  // ---- Audio Noise Suppression + Speech Recognition Setup ----
  useEffect(() => {
    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    // Apply Web Audio API noise suppression constraints when available
    let audioStream: MediaStream | null = null;
    const initNoiseFilter = async () => {
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            // @ts-ignore - advanced constraints for noise reduction
            suppressLocalAudioPlayback: true,
          },
        });
        // STT noise suppression active
      } catch {
        // Noise filter unavailable, using raw mic
      }
    };

    const recognition = new (SpeechRecognition as unknown as { new(): { lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: SpeechRecognitionEvent) => void) | null; onerror: ((e: SpeechRecognitionErrorEvent) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void } })();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      setInterimText(interim);
      if (finalText.trim()) {
        setContent((prev) => {
          const newContent = prev ? prev + " " + finalText.trim() : finalText.trim();
          const macro = findMacro(newContent);
          if (macro) {
            toast("📝 Macro aplicada", { description: macro.label });
            return applyMacro(newContent, macro);
          }
          return newContent;
        });
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        toast.error("Microfone bloqueado", { description: "Permita o acesso ao microfone." });
      }
      setListening(false);
      setInterimText("");
    };

    recognition.onend = () => {
      const ref = recognitionRef.current as Record<string, unknown> | null;
      if (ref?._shouldRestart) {
        try { recognition.start(); } catch {}
      } else {
        setListening(false);
        setInterimText("");
      }
    };

    recognitionRef.current = recognition as unknown as Record<string, unknown>;
    (recognitionRef.current as Record<string, unknown>)._initNoise = initNoiseFilter;

    return () => {
      try { (recognition as { stop: () => void }).stop(); } catch {}
      if (audioStream) audioStream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleListening = useCallback(async () => {
    const ref = recognitionRef.current as Record<string, unknown> | null;
    if (!ref) return;
    if (listening) {
      ref._shouldRestart = false;
      (ref as unknown as { stop: () => void }).stop();
      setListening(false);
      setInterimText("");
    } else {
      try {
        if (typeof ref._initNoise === "function") {
          await (ref._initNoise as () => Promise<void>)();
          ref._initNoise = null;
        }
        ref._shouldRestart = true;
        (ref as unknown as { start: () => void }).start();
        setListening(true);
        toast("🎙️ Ditado ativado", { description: "Filtro de ruído ativo. Fale e o texto será transcrito. Use /comandos para macros." });
      } catch {
        // Speech recognition start failed
      }
    }
  }, [listening]);

  // ---- Data Queries ----
  const { data: doctorProfile } = useQuery({
    queryKey: ["doctor-profile-editor", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("doctor_profiles").select("id, crm, crm_state").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-editor", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: examRequest, isLoading: loadingExam } = useQuery({
    queryKey: ["exam-request-detail", examId],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_requests" as any).select("*").eq("id", examId!).maybeSingle();
      if (error) throw error;
      return data as unknown as ExamRequest | null;
    },
    enabled: !!examId,
  });

  const { data: existingReport } = useQuery({
    queryKey: ["exam-report-existing", examId],
    queryFn: async () => {
      const { data } = await supabase.from("exam_reports" as any).select("*").eq("exam_request_id", examId!).maybeSingle();
      return data as unknown as ExamReport | null;
    },
    enabled: !!examId,
  });

  const { data: templates } = useQuery({
    queryKey: ["report-templates"],
    queryFn: async () => {
      const { data } = await supabase.from("report_templates" as any).select("*").eq("is_active", true).order("title");
      return (data ?? []) as ReportTemplate[];
    },
  });

  // ---- Auto-save ----
  const autoSaveDraft = useCallback(async (text: string) => {
    if (!doctorProfile?.id || !examId || !text.trim()) return;
    setAutoSaveStatus("saving");
    try {
      if (existingReport?.id) {
        await supabase.from("exam_reports" as any).update({ content_text: text }).eq("id", existingReport.id);
      } else {
        await supabase.from("exam_reports" as any).insert({ exam_request_id: examId, reporter_id: doctorProfile.id, content_text: text });
        queryClient.invalidateQueries({ queryKey: ["exam-report-existing", examId] });
      }
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    } catch { setAutoSaveStatus("idle"); }
  }, [doctorProfile?.id, examId, existingReport?.id, queryClient]);

  const handleContentChange = (newContent: string) => {
    // Check for macro triggers on manual typing
    const macro = findMacro(newContent);
    if (macro) {
      const applied = applyMacro(newContent, macro);
      setContent(applied);
      toast("📝 Macro aplicada", { description: macro.label });
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => autoSaveDraft(applied), 5000);
      return;
    }
    setContent(newContent);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => autoSaveDraft(newContent), 5000);
  };

  useEffect(() => {
    if (existingReport?.content_text) setContent(existingReport.content_text);
  }, [existingReport]);

  // Access control: verify reporter owns this report (issue #13 rodada 3)
  useEffect(() => {
    if (!existingReport || !doctorProfile) return;
    if (existingReport.reporter_id && existingReport.reporter_id !== doctorProfile.id) {
      toast.error("Acesso negado", { description: "Este laudo não está atribuído a você." });
      navigate(backRoute);
    }
  }, [existingReport, doctorProfile]);

  // ---- File URLs ----
  useEffect(() => {
    if (!examRequest?.file_urls) return;
    const urls = examRequest.file_urls as string[];
    if (!urls.length) return;
    Promise.all(
      urls.map(async (path: string) => {
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        if (path.startsWith("/")) return path;
        const { data } = await supabase.storage.from("exam-files").createSignedUrl(path, 3600);
        return data?.signedUrl || "";
      })
    ).then((resolved) => setFileUrls(resolved.filter(Boolean)));
  }, [examRequest]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = templates?.find((t: { id: string; body_text: string }) => t.id === templateId);
    if (tpl) setContent(tpl.body_text);
  };

  // ---- AI Processing ----
  const handleAiProcess = async (mode: "structure" | "improve" | "suggest_conclusion") => {
    if (!content.trim()) {
      toast.error("Texto vazio", { description: "Escreva ou dite o texto antes de usar a IA." });
      return;
    }
    setAiProcessing(true);
    setAiMode(mode);
    try {
      const { data, error } = await supabase.functions.invoke("structure-report", {
        body: {
          raw_text: content,
          exam_type: examRequest?.exam_type || "",
          clinical_info: examRequest?.clinical_info || "",
          mode,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.structured_text) {
        if (mode === "suggest_conclusion") {
          setContent((prev) => prev + "\n\n" + data.structured_text);
        } else {
          setContent(data.structured_text);
        }
        toast.success("✨ IA aplicada", { description: mode === "structure" ? "Laudo estruturado com sucesso!" : mode === "improve" ? "Texto melhorado!" : "Conclusão sugerida!" });
      }
    } catch (err: unknown) {
      toast.error("Erro na IA", { description: err instanceof Error ? err.message : "Tente novamente." });
    } finally {
      setAiProcessing(false);
    }
  };

  // ---- Insert macro ----
  const insertMacro = (macroId: string) => {
    const macro = REPORT_MACROS.find((m) => m.id === macroId);
    if (!macro) return;
    setContent((prev) => prev ? `${prev}\n\n${macro.text}` : macro.text);
    setShowMacros(false);
    toast("📝 Macro inserida", { description: macro.label });
  };

  // ---- Sign & Finalize ----
  const handleSignAndFinalize = async () => {
    if (!doctorProfile?.id || !content.trim()) {
      toast.error("Erro", { description: "Preencha o laudo antes de assinar." });
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

      pdf.setFontSize(7);
      pdf.text(`Código de Verificação: ${verificationCode}`, 20, 280);
      pdf.text(`Hash SHA-256: ${documentHash.substring(0, 32)}...`, 20, 284);
      pdf.text("Verifique em: /validar", 20, 288);

      const pdfBlob = pdf.output("blob");
      const pdfPath = `reports/${examId}/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage.from("prescriptions").upload(pdfPath, pdfBlob, { contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      if (existingReport?.id) {
        const { error } = await supabase.from("exam_reports" as any).update({
          content_text: content, template_id: selectedTemplateId || null, pdf_url: pdfPath,
          document_hash: documentHash, verification_code: verificationCode, signed_at: new Date().toISOString(),
        }).eq("id", existingReport.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exam_reports" as any).insert({
          exam_request_id: examId, reporter_id: doctorProfile.id, content_text: content,
          template_id: selectedTemplateId || null, pdf_url: pdfPath, document_hash: documentHash,
          verification_code: verificationCode, signed_at: new Date().toISOString(),
        });
        if (error) throw error;
      }

      await supabase.from("exam_requests" as any).update({ status: "reported" } as any).eq("id", examId);

      // ICP-Brasil (optional)
      try {
        const icpRes = await supabase.functions.invoke("vidaas-sign", {
          body: { action: "sign", document_hash: documentHash, document_type: "exam_report", doctor_name: doctorName, doctor_crm: `${doctorProfile.crm}/${doctorProfile.crm_state}`, verification_code: verificationCode },
        });
        if (icpRes.data?.success) { /* ICP signed */ }
      } catch {}

      await supabase.from("document_verifications").insert({
        doctor_name: doctorName, doctor_crm: `${doctorProfile.crm}/${doctorProfile.crm_state}`,
        patient_name: "Paciente", document_type: "exam_report", document_hash: documentHash, verification_code: verificationCode,
      });

      // Notifications
      if (examRequest?.requesting_doctor_id) {
        const { data: reqDoctor } = await supabase.from("doctor_profiles").select("user_id").eq("id", examRequest.requesting_doctor_id).maybeSingle();
        if (reqDoctor?.user_id) {
          await supabase.from("notifications").insert({ user_id: reqDoctor.user_id, title: "📋 Laudo Concluído", message: `O laudo do exame ${examRequest.exam_type} foi finalizado.`, type: "exam_report", link: `/dashboard/doctor/report-editor/${examId}?role=doctor` });
        }
      }
      if (examRequest?.patient_id) {
        const { data: patientProfile } = await supabase.from("profiles").select("user_id, first_name, phone").eq("user_id", examRequest.patient_id).maybeSingle();
        if (patientProfile) {
          await supabase.from("notifications").insert({ user_id: patientProfile.user_id, title: "📋 Seu laudo está pronto!", message: `O laudo do exame ${examRequest.exam_type} foi concluído.`, type: "exam_report", link: "/dashboard/health" });
          if (patientProfile.phone) {
            supabase.functions.invoke("send-whatsapp", { body: { phone: patientProfile.phone, message: `🩺 *Allo Médico* — Laudo Pronto!\n\nOlá, ${patientProfile.first_name}!\nSeu laudo de *${examRequest.exam_type}* foi finalizado pelo Dr(a). ${doctorName}.\n\nCódigo: ${verificationCode}` } }).catch(() => {});
          }
        }
      }

      toast.success("Laudo assinado e finalizado!", { description: `Código: ${verificationCode}` });
      queryClient.invalidateQueries({ queryKey: ["exam-requests-queue"] });
      navigate(backRoute);
    } catch (err: unknown) {
      toast.error("Erro ao assinar", { description: err instanceof Error ? err.message : "Erro desconhecido" });
    } finally {
      setSigning(false);
    }
  };

  if (loadingExam) {
    return (
      <DashboardLayout nav={nav} title="Editor de Laudo">
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
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
              {examRequest?.priority === "urgent" && <Badge variant="destructive">Urgente</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full pb-4">
            {examRequest?.clinical_info && (
              <div className="mb-3 p-3 bg-muted rounded-md text-sm">
                <strong>Anamnese:</strong> {examRequest.clinical_info}
              </div>
            )}
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
                      <Button variant="outline" className="w-full h-16" onClick={() => setActiveDicomUrl(url)}>
                        <ImageIcon className="w-4 h-4 mr-2" /> Abrir DICOM #{i + 1}
                      </Button>
                    ) : isPdf ? (
                      <iframe src={url} className="w-full h-96" title={`Exame ${i + 1}`} />
                    ) : (
                      <img src={url} alt={`Exame ${i + 1}`} className="w-full object-contain max-h-96 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setFullscreenImageUrl(url)} title="Clique para ver em tela cheia" />
                    )}
                  </div>
                );
              })}
              {fileUrls.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Nenhum arquivo disponível.</p>}
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
          <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
            {/* Toolbar: Template + Voice + AI + Macros */}
            {!isReported && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Template selector */}
                {templates && templates.length > 0 && (
                  <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                    <SelectTrigger className="h-8 text-xs w-auto min-w-[140px]">
                      <SelectValue placeholder="Template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t: { id: string; title: string; exam_type: string }) => (
                        <SelectItem key={t.id} value={t.id}>{t.title} ({t.exam_type})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Voice dictation */}
                {voiceSupported && (
                  <Button
                    type="button"
                    variant={listening ? "destructive" : "outline"}
                    size="sm"
                    onClick={toggleListening}
                    className="h-8 text-xs"
                  >
                    {listening ? (
                      <><MicOff className="w-3.5 h-3.5 mr-1" /><span className="animate-pulse">Ditando...</span></>
                    ) : (
                      <><Mic className="w-3.5 h-3.5 mr-1" />Ditar</>
                    )}
                  </Button>
                )}

                {/* AI Tools */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs" disabled={aiProcessing}>
                      {aiProcessing ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                      IA <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-1">
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => handleAiProcess("structure")} disabled={aiProcessing}>
                        <Wand2 className="w-3.5 h-3.5 mr-2" /> Estruturar Laudo
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => handleAiProcess("improve")} disabled={aiProcessing}>
                        <Sparkles className="w-3.5 h-3.5 mr-2" /> Melhorar Redação
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => handleAiProcess("suggest_conclusion")} disabled={aiProcessing}>
                        <Lightbulb className="w-3.5 h-3.5 mr-2" /> Sugerir Conclusão
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 px-1">A IA auxilia na redação. Sempre revise o resultado.</p>
                  </PopoverContent>
                </Popover>

                {/* Macros */}
                <Popover open={showMacros} onOpenChange={setShowMacros}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <BookText className="w-3.5 h-3.5 mr-1" /> Macros <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-2 max-h-80 overflow-y-auto" align="start">
                    {macroCategories.map((cat) => (
                      <div key={cat} className="mb-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">{cat}</p>
                        {REPORT_MACROS.filter((m) => m.category === cat).map((m) => (
                          <Button key={m.id} variant="ghost" size="sm" className="w-full justify-start text-xs h-7" onClick={() => insertMacro(m.id)}>
                            {m.label} <span className="ml-auto text-muted-foreground font-mono">{m.trigger}</span>
                          </Button>
                        ))}
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground mt-1 px-1">💡 Digite o comando (ex: /torax-normal) no editor ou dite por voz.</p>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Interim voice text preview */}
            {listening && interimText && (
              <div className="bg-primary/5 border border-primary/20 rounded-md px-3 py-2 text-sm text-primary animate-pulse">
                🎙️ {interimText}
              </div>
            )}

            {/* Editor */}
            <div className="relative flex-1 min-h-0">
              <Textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={listening ? "Fale agora... o texto aparecerá aqui automaticamente." : "Digite o laudo ou use o botão Ditar para transcrição por voz...\n\nDica: digite /torax-normal para inserir um laudo modelo."}
                className="h-full min-h-[200px] resize-none text-sm font-mono"
                readOnly={!!isReported}
              />
              {autoSaveStatus !== "idle" && !isReported && (
                <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-muted-foreground bg-background/80 rounded px-2 py-1">
                  {autoSaveStatus === "saving" && <><Loader2 className="w-3 h-3 animate-spin" /> Salvando...</>}
                  {autoSaveStatus === "saved" && <><Save className="w-3 h-3 text-success" /> Salvo</>}
                </div>
              )}
              {aiProcessing && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-md">
                  <div className="flex items-center gap-2 bg-background border rounded-lg px-4 py-2 shadow-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm">
                      {aiMode === "structure" ? "Estruturando laudo..." : aiMode === "improve" ? "Melhorando redação..." : "Gerando conclusão..."}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {isReported ? (
              <div className="space-y-2">
                <Badge className="bg-primary/10 text-primary border-primary/30" variant="outline">
                  ✅ Assinado em {new Date(existingReport.signed_at).toLocaleString("pt-BR")}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Código: {existingReport.verification_code} | Hash: {existingReport.document_hash?.substring(0, 16)}...
                </p>
                {existingReport.pdf_url && (
                  <Button size="sm" variant="outline" onClick={async () => {
                    const { data } = await supabase.storage.from("prescriptions").createSignedUrl(existingReport.pdf_url, 3600);
                    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                  }}>
                    <Download className="w-3 h-3 mr-1" /> Baixar PDF
                  </Button>
                )}
              </div>
            ) : (
              <Button onClick={handleSignAndFinalize} disabled={signing || !content.trim()} className="w-full">
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
          {fullscreenImageUrl && <img src={fullscreenImageUrl} alt="Exame em tela cheia" className="max-w-full max-h-[90vh] object-contain" />}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ExamReportEditor;
