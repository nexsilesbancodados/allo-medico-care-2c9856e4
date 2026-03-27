import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import mascotReading from "@/assets/mascot-reading.png";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "@/components/patient/patientNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Download, ShieldCheck, Share2, ClipboardList, Calendar, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { generateShareableLink } from "@/lib/services/report-service";
import { toastShareLinkCopied, toastShareLinkFailed } from "@/lib/toast-helpers";
import { motion } from "framer-motion";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_review: "Em Análise",
  reported: "Disponível",
  delivered: "Entregue",
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  in_review: "bg-primary/10 text-primary border-primary/20",
  reported: "bg-[hsl(152,60%,40%)]/10 text-[hsl(152,60%,35%)] border-[hsl(152,60%,40%)]/20",
  delivered: "bg-muted text-muted-foreground border-border",
};

const examIcons: Record<string, string> = {
  hemograma: "🩸",
  "raio-x": "📷",
  ultrassom: "🔊",
  tomografia: "🧠",
  ressonancia: "🧲",
  eletrocardiograma: "❤️",
};

const getExamIcon = (type: string) => {
  const lower = type.toLowerCase();
  for (const [key, icon] of Object.entries(examIcons)) {
    if (lower.includes(key)) return icon;
  }
  return "🔬";
};

type FilterTab = "all" | "reported" | "pending";

const PatientExamResults = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

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

  const getReportForExam = (examId: string) => examReports?.find(r => r.exam_request_id === examId);

  const handleDownloadPdf = async (pdfUrl: string) => {
    const { data } = await supabase.storage.from("prescriptions").createSignedUrl(pdfUrl, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const filtered = examRequests?.filter(e => {
    if (activeTab === "reported") return e.status === "reported" || e.status === "delivered";
    if (activeTab === "pending") return e.status === "pending" || e.status === "in_review";
    return true;
  });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "Recentes" },
    { key: "reported", label: "Disponíveis" },
    { key: "pending", label: "Em Análise" },
  ];

  return (
    <DashboardLayout nav={getPatientNav("exam-results")} title="Exames">
      <div className="max-w-2xl mx-auto pb-24 md:pb-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-foreground font-[Manrope]">Seus Exames</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe seus resultados e histórico laboratorial.</p>
        </div>

        {/* Hero Banner */}
        <div className="relative rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-6 mb-6 overflow-hidden">
          <div className="relative z-10 max-w-[65%]">
            <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">Fique tranquilo!</p>
            <p className="text-sm text-white/80 leading-relaxed">
              Assim que os resultados estiverem prontos, seu médico será notificado para revisá-los e agendar o retorno.
            </p>
          </div>
          <img
            src={mascotReading}
            alt="Pingo lendo"
            className="absolute right-2 bottom-0 w-28 h-28 object-contain select-none opacity-90"
            loading="lazy" decoding="async" width={112} height={112}
          />
          <div className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/[0.06] blur-[40px]" />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !filtered?.length ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-muted/10">
            <img src={mascotReading} alt="Pingo" className="w-20 h-20 object-contain mx-auto drop-shadow-md mb-3 select-none" loading="lazy" decoding="async" width={80} height={80} />
            <p className="text-sm font-semibold text-foreground mb-1">Nenhum exame encontrado</p>
            <p className="text-xs text-muted-foreground">Quando seu médico solicitar exames, eles aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((exam, i) => {
              const report = getReportForExam(exam.id);
              const isAvailable = exam.status === "reported" || exam.status === "delivered";
              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card-interactive rounded-2xl bg-card border border-border/20 p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-2xl shrink-0">
                      {getExamIcon(exam.exam_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-foreground text-sm">{exam.exam_type}</h3>
                        <Badge className={`text-[10px] ${statusColors[exam.status] ?? ""}`} variant="outline">
                          {statusLabels[exam.status] ?? exam.status}
                        </Badge>
                      </div>
                      {exam.clinical_info && (
                        <p className="text-xs text-muted-foreground mb-1 truncate">{exam.clinical_info}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(exam.created_at), "dd MMM yyyy", { locale: ptBR })}
                        </span>
                        {report?.verification_code && (
                          <span className="flex items-center gap-1 text-success">
                            <ShieldCheck className="w-3 h-3" />
                            {report.verification_code}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {isAvailable && report?.pdf_url && (
                    <div className="flex gap-2 mt-4 pl-16">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-xs h-8 gap-1.5"
                        onClick={() => handleDownloadPdf(report.pdf_url!)}
                      >
                        <Download className="w-3 h-3" /> Visualizar PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-xs h-8 gap-1.5"
                        onClick={async () => {
                          const link = await generateShareableLink(report.pdf_url!);
                          if (link) { await navigator.clipboard.writeText(link); toastShareLinkCopied(); }
                          else { toastShareLinkFailed(); }
                        }}
                      >
                        <Share2 className="w-3 h-3" /> Compartilhar
                      </Button>
                    </div>
                  )}
                  {!isAvailable && (
                    <div className="mt-3 pl-16">
                      <p className="text-xs text-muted-foreground italic">
                        {exam.status === "in_review" ? "Processando..." : "Aguardando laudo"}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientExamResults;
