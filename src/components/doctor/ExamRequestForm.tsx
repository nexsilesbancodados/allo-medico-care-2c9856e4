import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileImage, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

const EXAM_TYPES = [
  "Raio-X de Tórax",
  "Tomografia Computadorizada",
  "Ressonância Magnética",
  "Ultrassonografia",
  "Eletrocardiograma",
  "Hemograma Completo",
  "Ecocardiograma",
  "Mamografia",
  "Densitometria Óssea",
  "Outro",
];

const ExamRequestForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [examType, setExamType] = useState("");
  const [clinicalInfo, setClinicalInfo] = useState("");
  const [priority, setPriority] = useState("normal");
  const [patientId, setPatientId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: doctorProfile } = useQuery({
    queryKey: ["doctor-profile-for-exam", user?.id],
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorProfile?.id) {
      toast({ title: "Erro", description: "Perfil de médico não encontrado.", variant: "destructive" });
      return;
    }
    if (!examType || files.length === 0) {
      toast({ title: "Campos obrigatórios", description: "Selecione o tipo de exame e envie pelo menos um arquivo.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Upload files
      const fileUrls: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("exam-files")
          .upload(path, file);
        if (uploadError) throw uploadError;
        fileUrls.push(path);
      }

      // Create exam request
      const { error } = await supabase.from("exam_requests" as any).insert({
        requesting_doctor_id: doctorProfile.id,
        patient_id: patientId || null,
        exam_type: examType,
        clinical_info: clinicalInfo,
        file_urls: fileUrls,
        priority,
        status: "pending",
      } as any);

      if (error) throw error;

      toast({ title: "Solicitação enviada!", description: "O exame foi enviado para a fila de laudos." });
      navigate("/dashboard/doctor/report-queue?role=doctor");
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout nav={getDoctorNav("exam-request")} title="Solicitar Laudo">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5 text-primary" />
              Nova Solicitação de Laudo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="examType">Tipo de Exame *</Label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de exame" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientId">ID do Paciente (opcional)</Label>
                <Input
                  id="patientId"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="UUID do paciente (se aplicável)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicalInfo">Informações Clínicas / Anamnese</Label>
                <Textarea
                  id="clinicalInfo"
                  value={clinicalInfo}
                  onChange={(e) => setClinicalInfo(e.target.value)}
                  placeholder="Descreva o contexto clínico, queixa principal, hipótese diagnóstica..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Arquivos do Exame *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.dcm"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Clique para enviar PDF, imagens ou DICOM
                    </span>
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center justify-between bg-muted rounded-md px-3 py-2 text-sm">
                        <span className="truncate">{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(i)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {uploading ? "Enviando..." : "Enviar para Laudar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ExamRequestForm;
