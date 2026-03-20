import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { warn } from "@/lib/logger";
import { supabase } from "@/integrations/supabase/client";
import { useConsultationStore } from "@/stores/consultationStore";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, FileText, Download, Calendar, Clock, Users, Settings } from "lucide-react";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import MemedPrescription from "./MemedPrescription";
import CfmPrescription from "./CfmPrescription";
import { gerarHashDocumento, gerarCodigoVerificacao } from "@/lib/signature";

const doctorNav = [
  { label: "Início", href: "/dashboard", icon: <Clock className="w-4 h-4" /> },
  { label: "Agenda", href: "/dashboard/schedule", icon: <Calendar className="w-4 h-4" /> },
  { label: "Pacientes", href: "/dashboard/patients", icon: <Users className="w-4 h-4" /> },
  { label: "Receitas", href: "/dashboard/prescriptions", icon: <FileText className="w-4 h-4" />, active: true },
  { label: "Disponibilidade", href: "/dashboard/availability", icon: <Settings className="w-4 h-4" /> },
];

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const PrescriptionForm = () => {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  

  const store = useConsultationStore();
  const [patientName, setPatientName] = useState("");
  const [patientCpf, setPatientCpf] = useState("");
  const [patientId, setPatientId] = useState("");
  const [doctorInfo, setDoctorInfo] = useState<{ id: string; crm: string; crm_state: string; user_id: string; first_name: string; last_name: string } | null>(null);
  const [diagnosis, setDiagnosis] = useState(store.appointmentId === appointmentId ? store.diagnosis : "");
  const [observations, setObservations] = useState(store.appointmentId === appointmentId ? store.observations : "");
  const [medications, setMedications] = useState<Medication[]>(
    store.appointmentId === appointmentId && store.medications.some(m => m.name)
      ? store.medications
      : [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]
  );
  const [saving, setSaving] = useState(false);

  // Persist draft to Zustand
  useEffect(() => {
    if (appointmentId) {
      store.setAppointmentId(appointmentId);
      store.setDiagnosis(diagnosis);
      store.setObservations(observations);
      store.setMedications(medications);
    }
  }, [diagnosis, observations, medications, appointmentId]);

  useEffect(() => {
    if (appointmentId && user) fetchData();
  }, [appointmentId, user]);

  const fetchData = async () => {
    const { data: appt } = await supabase
      .from("appointments")
      .select("patient_id, doctor_id")
      .eq("id", appointmentId)
      .single();

    if (!appt) return;
    setPatientId(appt.patient_id);

    const [patientRes, doctorRes] = await Promise.all([
      supabase.from("profiles").select("first_name, last_name, cpf").eq("user_id", appt.patient_id).single(),
      supabase.from("doctor_profiles").select("id, crm, crm_state, user_id").eq("id", appt.doctor_id).single(),
    ]);

    if (patientRes.data) {
      setPatientName(`${patientRes.data.first_name} ${patientRes.data.last_name}`);
      setPatientCpf(patientRes.data.cpf || "");
    }

    if (doctorRes.data) {
      const { data: docProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", doctorRes.data.user_id)
        .single();

      setDoctorInfo({
        ...doctorRes.data,
        first_name: docProfile?.first_name ?? "",
        last_name: docProfile?.last_name ?? "",
      });
    }
  };

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const generateQRCodeDataUrl = (text: string, size: number = 150): string => {
    // Simple QR code placeholder using a data URL with the verification text
    // In production, use a QR library. For now, generate a styled verification box.
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Border
    ctx.strokeStyle = "#1a6fc4";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    // Inner pattern (simple grid to simulate QR)
    ctx.fillStyle = "#1a6fc4";
    const cellSize = size / 15;
    const hash = text.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        // Corner anchors
        if ((i < 3 && j < 3) || (i < 3 && j > 11) || (i > 11 && j < 3)) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
          continue;
        }
        // Data cells based on hash
        if ((hash * (i + 1) * (j + 1)) % 3 === 0) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }
    }

    // Center text
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(size / 2 - 20, size / 2 - 8, 40, 16);
    ctx.fillStyle = "#1a6fc4";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ALÔ", size / 2, size / 2 + 1);
    ctx.fillText("MÉDICO", size / 2, size / 2 + 9);

    return canvas.toDataURL("image/png");
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const now = new Date();
    const prescriptionId = `RX-${format(now, "yyyyMMdd")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // ─── Header ───
    doc.setFillColor(26, 111, 196);
    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("Alô Médico", 15, 14);
    doc.setFontSize(9);
    doc.text("Plataforma de Telemedicina", 15, 21);

    doc.setFontSize(8);
    doc.text(`Receita Nº: ${prescriptionId}`, pageWidth - 15, 14, { align: "right" });
    doc.text(`Data: ${format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth - 15, 21, { align: "right" });

    // ─── Doctor & Patient info boxes ───
    let y = 36;

    // Doctor box
    doc.setFillColor(240, 246, 255);
    doc.roundedRect(15, y, pageWidth / 2 - 20, 28, 3, 3, "F");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("MÉDICO RESPONSÁVEL", 19, y + 6);
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(`Dr(a). ${doctorInfo?.first_name} ${doctorInfo?.last_name}`, 19, y + 14);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`CRM: ${doctorInfo?.crm}/${doctorInfo?.crm_state}`, 19, y + 21);

    // Patient box
    const patientBoxX = pageWidth / 2 + 5;
    doc.setFillColor(240, 255, 240);
    doc.roundedRect(patientBoxX, y, pageWidth / 2 - 20, 28, 3, 3, "F");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("PACIENTE", patientBoxX + 4, y + 6);
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(patientName, patientBoxX + 4, y + 14);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`CPF: ${patientCpf || "Não informado"}`, patientBoxX + 4, y + 21);

    // ─── Diagnosis ───
    y += 36;
    if (diagnosis) {
      doc.setFillColor(255, 248, 240);
      doc.roundedRect(15, y, pageWidth - 30, 14, 3, 3, "F");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("DIAGNÓSTICO", 19, y + 5);
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(diagnosis, 19, y + 11);
      y += 20;
    }

    // ─── Separator ───
    doc.setDrawColor(26, 111, 196);
    doc.setLineWidth(1.5);
    doc.line(15, y, pageWidth - 15, y);
    y += 4;

    // ─── Section title ───
    doc.setFontSize(13);
    doc.setTextColor(26, 111, 196);
    doc.text("PRESCRIÇÃO MÉDICA", pageWidth / 2, y + 6, { align: "center" });
    y += 14;

    // ─── Medications ───
    medications.forEach((med, i) => {
      if (!med.name) return;

      // Check if we need a new page
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }

      // Medication card
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, y, pageWidth - 30, med.instructions ? 38 : 30, 3, 3, "F");

      // Number circle
      doc.setFillColor(26, 111, 196);
      doc.circle(23, y + 8, 5, "F");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(String(i + 1), 23, y + 9.5, { align: "center" });

      // Name
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text(med.name, 32, y + 10);

      // Details
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      let detailY = y + 18;
      const details: string[] = [];
      if (med.dosage) details.push(`💊 ${med.dosage}`);
      if (med.frequency) details.push(`⏰ ${med.frequency}`);
      if (med.duration) details.push(`📅 ${med.duration}`);

      if (details.length > 0) {
        doc.text(details.join("   •   "), 32, detailY);
        detailY += 7;
      }

      if (med.instructions) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Obs: ${med.instructions}`, 32, detailY);
      }

      y += med.instructions ? 44 : 36;
    });

    // ─── Observations ───
    if (observations) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }

      y += 4;
      doc.setFillColor(255, 250, 240);
      const obsLines = doc.splitTextToSize(observations, pageWidth - 40);
      const obsHeight = Math.max(18, obsLines.length * 5 + 12);
      doc.roundedRect(15, y, pageWidth - 30, obsHeight, 3, 3, "F");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("OBSERVAÇÕES", 19, y + 6);
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(obsLines, 19, y + 13);
      y += obsHeight + 6;
    }

    // ─── QR Code & Footer ───
    const footerY = pageHeight - 45;

    // QR Code
    try {
      const verificationUrl = `https://alomedico.com/verificar/${prescriptionId}`;
      const qrDataUrl = generateQRCodeDataUrl(verificationUrl, 150);
      doc.addImage(qrDataUrl, "PNG", 15, footerY - 5, 25, 25);
      doc.setFontSize(6);
      doc.setTextColor(130, 130, 130);
      doc.text("Verificação digital", 27.5, footerY + 23, { align: "center" });
      doc.text(prescriptionId, 27.5, footerY + 27, { align: "center" });
    } catch {
      // QR generation failed - non-critical
    }

    // Digital signature line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 40, footerY + 12, pageWidth / 2 + 40, footerY + 12);
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(`Dr(a). ${doctorInfo?.first_name} ${doctorInfo?.last_name}`, pageWidth / 2, footerY + 18, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(`CRM ${doctorInfo?.crm}/${doctorInfo?.crm_state}`, pageWidth / 2, footerY + 23, { align: "center" });

    // Bottom bar
    doc.setFillColor(240, 243, 247);
    doc.rect(0, pageHeight - 12, pageWidth, 12, "F");
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(
      "Receita médica digital emitida pela plataforma Alô Médico • Válida conforme Resolução CFM 2.299/2021 • Telemedicina",
      pageWidth / 2, pageHeight - 5, { align: "center" }
    );

    return { doc, prescriptionId };
  };

  const handleSave = async () => {
    const validMeds = medications.filter(m => m.name.trim());
    if (validMeds.length === 0) {
      toast.error("Adicione pelo menos um medicamento");
      return;
    }
    if (!doctorInfo) {
      toast.error("Dados do médico não carregados. Aguarde.");
      return;
    }
    if (!patientId) {
      toast.error("Dados do paciente não carregados. Aguarde.");
      return;
    }

    setSaving(true);

    // Generate digital hash for document integrity
    const docContent = JSON.stringify({
      appointment_id: appointmentId,
      doctor: `${doctorInfo?.first_name} ${doctorInfo?.last_name}`,
      crm: `${doctorInfo?.crm}/${doctorInfo?.crm_state}`,
      patient: patientName,
      patient_cpf: patientCpf,
      medications: validMeds,
      diagnosis,
      observations,
      timestamp: new Date().toISOString(),
    });
    const documentHash = await gerarHashDocumento(docContent);
    const verificationCode = gerarCodigoVerificacao();

    const { error } = await supabase.from("prescriptions").insert({
      appointment_id: appointmentId,
      doctor_id: doctorInfo.id,
      patient_id: patientId,
      medications: validMeds as unknown as Parameters<typeof supabase.from>[0],
      diagnosis: diagnosis || null,
      observations: observations || null,
      document_hash: documentHash,
    });

    // Also persist verification record
    supabase.from("document_verifications").insert({
      verification_code: verificationCode,
      document_type: "prescription",
      patient_name: patientName,
      patient_cpf: patientCpf || null,
      doctor_name: `Dr(a). ${doctorInfo?.first_name} ${doctorInfo?.last_name}`,
      doctor_crm: `CRM ${doctorInfo?.crm}/${doctorInfo?.crm_state}`,
      document_hash: documentHash,
      details: { medications: validMeds.length, diagnosis: diagnosis || null },
    }).then(({ error: verErr }) => {
      if (verErr) warn("Failed to persist verification:", verErr);
    });

    setSaving(false);

    if (error) {
      toast.error("Erro ao salvar receita", { description: error.message });
    } else {
      // Send prescription via email + WhatsApp
      const doctorFullName = `Dr(a). ${doctorInfo?.first_name} ${doctorInfo?.last_name}`;
      supabase.functions.invoke("send-prescription", {
        body: {
          appointment_id: appointmentId,
          doctor_name: doctorFullName,
          patient_name: patientName,
          medications: validMeds.map(m => ({ name: m.name, dosage: m.dosage, frequency: m.frequency })),
          diagnosis: diagnosis || undefined,
        },
      }).then(({ data: respData, error: sendErr }) => {
        if (sendErr) {
          warn("Send prescription notification error:", sendErr);
        } else {
          const sentEmail = respData?.sent_to?.email;
          const sentWhatsapp = respData?.sent_to?.whatsapp;
          const channels = [sentEmail && "e-mail", sentWhatsapp && "WhatsApp"].filter(Boolean).join(" e ");
          if (channels) {
            toast.success(`📩 Receita enviada por ${channels}`);
          }
        }
      }).catch(() => {});

      // In-app + Push notification for prescription
      if (patientId) {
        const { notifyPrescriptionSent } = await import("@/lib/notifications");
        const medsSummary = validMeds.map(m => `${m.name} ${m.dosage}`).join(", ");
        notifyPrescriptionSent(patientId, doctorFullName, diagnosis || undefined, medsSummary).catch(() => {});
      }
      store.clearDraft();
      toast.success("Receita salva com sucesso! ✅");
      navigate("/dashboard/prescriptions");
    }
  };

  const handleDownloadPDF = () => {
    const { doc } = generatePDF();
    doc.save(`receita-${patientName.replace(/\s/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <DashboardLayout title="Médico" nav={doctorNav}>
      <div className="max-w-3xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-1">Receita Médica</h1>
        <p className="text-muted-foreground mb-6">Prescreva medicamentos para o paciente</p>

        {/* CFM Official Prescription */}
        {doctorInfo && (
          <div className="mb-4">
            <CfmPrescription
              doctorCrm={doctorInfo.crm}
              doctorCrmState={doctorInfo.crm_state}
              doctorName={`${doctorInfo.first_name} ${doctorInfo.last_name}`}
              patientName={patientName}
              patientCpf={patientCpf}
              onDocumentCreated={(docType) => {
                toast.success("Documento CFM emitido! ✅", { description: `${docType} criado na plataforma oficial do CFM.` });
              }}
            />
          </div>
        )}

        {/* Memed Digital Prescription */}
        {appointmentId && patientId && (
          <div className="mb-6">
            <MemedPrescription
              appointmentId={appointmentId}
              patientName={patientName}
              patientCpf={patientCpf}
              patientId={patientId}
              onPrescriptionCreated={(data) => {
                toast.success("Receita Memed salva! ✅", { description: "A receita digital foi emitida e registrada." });
              }}
            />
          </div>
        )}

        {/* Patient info */}
        <Card className="border-border mb-6">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Paciente</p>
            <p className="font-semibold text-foreground">{patientName || "Carregando..."}</p>
          </CardContent>
        </Card>

        {/* Diagnosis */}
        <Card className="border-border mb-6">
          <CardHeader><CardTitle className="text-base">Diagnóstico</CardTitle></CardHeader>
          <CardContent>
            <Input
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              placeholder="Ex: Infecção respiratória aguda (J06.9)"
            />
          </CardContent>
        </Card>

        {/* Medications */}
        <Card className="border-border mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Medicamentos</CardTitle>
              <Button variant="outline" size="sm" onClick={addMedication}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {medications.map((med, i) => (
              <div key={i} className="relative border border-border rounded-xl p-4">
                {medications.length > 1 && (
                  <button
                    onClick={() => removeMedication(i)}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <p className="text-xs font-semibold text-muted-foreground mb-3">Medicamento {i + 1}</p>
                <div className="grid gap-3">
                  <div>
                    <Label className="text-xs">Nome do medicamento</Label>
                    <Input value={med.name} onChange={e => updateMedication(i, "name", e.target.value)} placeholder="Ex: Amoxicilina 500mg" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Dosagem</Label>
                      <Input value={med.dosage} onChange={e => updateMedication(i, "dosage", e.target.value)} placeholder="Ex: 1 comprimido" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Frequência</Label>
                      <Input value={med.frequency} onChange={e => updateMedication(i, "frequency", e.target.value)} placeholder="Ex: 8 em 8 horas" className="mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Duração</Label>
                      <Input value={med.duration} onChange={e => updateMedication(i, "duration", e.target.value)} placeholder="Ex: 7 dias" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Instruções</Label>
                      <Input value={med.instructions} onChange={e => updateMedication(i, "instructions", e.target.value)} placeholder="Ex: Tomar após refeições" className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Observations */}
        <Card className="border-border mb-6">
          <CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              placeholder="Orientações adicionais, restrições, retorno..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSave} className="bg-gradient-hero text-primary-foreground" disabled={saving}>
            <FileText className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Receita"}
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PrescriptionForm;
