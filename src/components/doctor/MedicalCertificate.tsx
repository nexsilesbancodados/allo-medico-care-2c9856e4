import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, FileText, Settings, FileBadge } from "lucide-react";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const nav = [
  { label: "Agenda", href: "/dashboard", icon: <Calendar className="w-4 h-4" /> },
  { label: "Atestados", href: "/dashboard/certificates", icon: <FileBadge className="w-4 h-4" />, active: true },
  { label: "Prontuários", href: "/dashboard/patients", icon: <FileText className="w-4 h-4" /> },
  { label: "Disponibilidade", href: "/dashboard/availability", icon: <Settings className="w-4 h-4" /> },
];

const MedicalCertificate = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("");
  const [patientCpf, setPatientCpf] = useState("");
  const [days, setDays] = useState(1);
  const [reason, setReason] = useState("");
  const [cid, setCid] = useState("");
  const [generating, setGenerating] = useState(false);
  const [doctorCrm, setDoctorCrm] = useState("");

  useState(() => {
    if (user) {
      supabase.from("doctor_profiles").select("crm, crm_state").eq("user_id", user.id).single().then(({ data }) => {
        if (data) setDoctorCrm(`${data.crm}/${data.crm_state}`);
      });
    }
  });

  const generateCertificate = () => {
    if (!patientName) {
      toast({ title: "Informe o nome do paciente", variant: "destructive" });
      return;
    }
    setGenerating(true);

    const doc = new jsPDF();
    const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const doctorName = `Dr(a). ${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`;

    doc.setFontSize(20);
    doc.text("ATESTADO MÉDICO", 105, 30, { align: "center" });

    doc.setFontSize(12);
    const text = `Atesto para os devidos fins que o(a) paciente ${patientName}${patientCpf ? `, CPF ${patientCpf}` : ""}, foi atendido(a) nesta data e necessita de ${days} dia(s) de afastamento de suas atividades${reason ? `, devido a ${reason}` : ""}${cid ? ` (CID: ${cid})` : ""}.`;

    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 20, 60);

    const signY = 140;
    doc.text(today, 105, signY, { align: "center" });
    doc.line(50, signY + 20, 160, signY + 20);
    doc.text(doctorName, 105, signY + 27, { align: "center" });
    doc.text(`CRM ${doctorCrm}`, 105, signY + 34, { align: "center" });

    doc.save(`atestado-${patientName.replace(/\s/g, "-").toLowerCase()}.pdf`);
    setGenerating(false);
    toast({ title: "Atestado gerado!", description: "O PDF foi baixado." });
  };

  return (
    <DashboardLayout title="Médico" nav={nav}>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Atestados Médicos</h1>
        <p className="text-muted-foreground mb-6">Gere atestados e declarações em PDF</p>

        <Card className="border-border">
          <CardHeader><CardTitle className="text-lg">Novo Atestado</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nome do Paciente</Label><Input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Nome completo" className="mt-1" required /></div>
              <div><Label>CPF (opcional)</Label><Input value={patientCpf} onChange={e => setPatientCpf(e.target.value)} placeholder="000.000.000-00" className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Dias de Afastamento</Label><Input type="number" value={days} onChange={e => setDays(Number(e.target.value))} min={1} className="mt-1" /></div>
              <div><Label>CID (opcional)</Label><Input value={cid} onChange={e => setCid(e.target.value)} placeholder="Ex: J06" className="mt-1" /></div>
            </div>
            <div>
              <Label>Motivo / Observação</Label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} placeholder="Descrição do motivo..." />
            </div>
            <Button onClick={generateCertificate} disabled={generating} className="bg-gradient-hero text-primary-foreground" size="lg">
              <FileBadge className="w-4 h-4 mr-2" />
              {generating ? "Gerando..." : "Gerar Atestado PDF"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MedicalCertificate;
