import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, FileText, Download, Calendar, Clock, Users, Settings } from "lucide-react";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const { toast } = useToast();

  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [observations, setObservations] = useState("");
  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appointmentId && user) fetchData();
  }, [appointmentId, user]);

  const fetchData = async () => {
    // Get appointment
    const { data: appt } = await supabase
      .from("appointments")
      .select("patient_id, doctor_id")
      .eq("id", appointmentId)
      .single();

    if (!appt) return;
    setPatientId(appt.patient_id);

    // Get patient name, doctor info in parallel
    const [patientRes, doctorRes] = await Promise.all([
      supabase.from("profiles").select("first_name, last_name, cpf").eq("user_id", appt.patient_id).single(),
      supabase.from("doctor_profiles").select("id, crm, crm_state, user_id").eq("id", appt.doctor_id).single(),
    ]);

    if (patientRes.data) {
      setPatientName(`${patientRes.data.first_name} ${patientRes.data.last_name}`);
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

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header with gradient line
    doc.setDrawColor(30, 120, 200);
    doc.setLineWidth(3);
    doc.line(15, 15, pageWidth - 15, 15);

    doc.setFontSize(20);
    doc.setTextColor(30, 120, 200);
    doc.text("Receita Médica Digital", pageWidth / 2, 28, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Alô Médico — Plataforma de Telemedicina", pageWidth / 2, 35, { align: "center" });

    // Doctor info
    let y = 48;
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(`Médico(a): Dr(a). ${doctorInfo?.first_name} ${doctorInfo?.last_name}`, 15, y);
    y += 6;
    doc.text(`CRM: ${doctorInfo?.crm}/${doctorInfo?.crm_state}`, 15, y);

    // Date
    doc.text(`Data: ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`, pageWidth - 15, 48, { align: "right" });

    // Separator
    y += 10;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(15, y, pageWidth - 15, y);

    // Patient info
    y += 10;
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(`Paciente: ${patientName}`, 15, y);

    if (diagnosis) {
      y += 8;
      doc.text(`Diagnóstico: ${diagnosis}`, 15, y);
    }

    // Medications
    y += 14;
    doc.setFontSize(13);
    doc.setTextColor(30, 120, 200);
    doc.text("Prescrição", 15, y);

    y += 8;
    medications.forEach((med, i) => {
      if (!med.name) return;
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text(`${i + 1}. ${med.name}`, 15, y);
      y += 6;

      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      if (med.dosage) { doc.text(`   Dosagem: ${med.dosage}`, 15, y); y += 5; }
      if (med.frequency) { doc.text(`   Frequência: ${med.frequency}`, 15, y); y += 5; }
      if (med.duration) { doc.text(`   Duração: ${med.duration}`, 15, y); y += 5; }
      if (med.instructions) { doc.text(`   Instruções: ${med.instructions}`, 15, y); y += 5; }
      y += 4;
    });

    if (observations) {
      y += 6;
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text("Observações:", 15, y);
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const lines = doc.splitTextToSize(observations, pageWidth - 30);
      doc.text(lines, 15, y);
      y += lines.length * 5;
    }

    // Footer
    y = doc.internal.pageSize.getHeight() - 30;
    doc.setDrawColor(220, 220, 220);
    doc.line(15, y, pageWidth - 15, y);
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Este documento foi gerado digitalmente pela plataforma Alô Médico.", pageWidth / 2, y, { align: "center" });
    doc.text("Válido como receita médica digital conforme legislação vigente.", pageWidth / 2, y + 5, { align: "center" });

    return doc;
  };

  const handleSave = async () => {
    const validMeds = medications.filter(m => m.name.trim());
    if (validMeds.length === 0) {
      toast({ title: "Adicione pelo menos um medicamento", variant: "destructive" });
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("prescriptions").insert({
      appointment_id: appointmentId,
      doctor_id: doctorInfo.id,
      patient_id: patientId,
      medications: validMeds as any,
      diagnosis: diagnosis || null,
      observations: observations || null,
    } as any);

    setSaving(false);

    if (error) {
      toast({ title: "Erro ao salvar receita", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Receita salva com sucesso! ✅" });
      navigate("/dashboard/prescriptions");
    }
  };

  const handleDownloadPDF = () => {
    const doc = generatePDF();
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
