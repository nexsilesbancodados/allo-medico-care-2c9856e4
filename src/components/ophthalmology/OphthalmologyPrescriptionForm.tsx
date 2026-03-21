import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Download, ExternalLink, Loader2, Glasses, Eye, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import useProfile from "@/hooks/useProfile";

interface OphExam {
  id: string;
  patient_name: string;
  patient_cpf: string | null;
  exam_type: string;
  od_spherical: number | null;
  od_cylindrical: number | null;
  od_axis: number | null;
  oe_spherical: number | null;
  oe_cylindrical: number | null;
  oe_axis: number | null;
  od_acuity: string | null;
  oe_acuity: string | null;
  intraocular_pressure_od: number | null;
  intraocular_pressure_oe: number | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface Props {
  exam: OphExam;
  onBack: () => void;
}

const OphthalmologyPrescriptionForm = ({ exam, onBack }: Props) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setSaving] = useState(false);
  const [form, setForm] = useState({
    od_spherical: exam.od_spherical?.toString() || "",
    od_cylindrical: exam.od_cylindrical?.toString() || "",
    od_axis: exam.od_axis?.toString() || "",
    od_addition: "",
    oe_spherical: exam.oe_spherical?.toString() || "",
    oe_cylindrical: exam.oe_cylindrical?.toString() || "",
    oe_axis: exam.oe_axis?.toString() || "",
    oe_addition: "",
    interpupillary_distance: "",
    lens_type: "monofocal",
    lens_material: "",
    lens_treatment: "",
    observations: "",
  });

  const handleChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const fmtVal = (v: string | null | undefined) => {
    if (!v) return "—";
    const n = parseFloat(v);
    return n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    const doctorName = profile ? `Dr(a). ${profile.first_name} ${profile.last_name || ""}`.trim() : "Médico Oftalmologista";

    // Header gradient bar
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, w, 28, "F");
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 24, w, 4, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("RECEITA DE ÓCULOS", w / 2, 16, { align: "center" });

    let y = 38;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Paciente: ${exam.patient_name}`, 14, y);
    if (exam.patient_cpf) doc.text(`CPF: ${exam.patient_cpf}`, w - 14, y, { align: "right" });
    y += 6;
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, y);
    doc.text(`Médico: ${doctorName}`, w - 14, y, { align: "right" });

    y += 12;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, w - 14, y);
    y += 8;

    // Table header
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(14, y, w - 28, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const cols = [20, 55, 85, 115, 145];
    doc.text("OLHO", cols[0], y + 7);
    doc.text("ESFÉRICO", cols[1], y + 7);
    doc.text("CILÍNDRICO", cols[2], y + 7);
    doc.text("EIXO", cols[3], y + 7);
    doc.text("ADIÇÃO", cols[4], y + 7);
    y += 14;

    // OD row
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.text("OD", cols[0], y);
    doc.text(fmtVal(form.od_spherical), cols[1], y);
    doc.text(fmtVal(form.od_cylindrical), cols[2], y);
    doc.text(form.od_axis || "—", cols[3], y);
    doc.text(fmtVal(form.od_addition), cols[4], y);
    y += 8;

    // OE row
    doc.text("OE", cols[0], y);
    doc.text(fmtVal(form.oe_spherical), cols[1], y);
    doc.text(fmtVal(form.oe_cylindrical), cols[2], y);
    doc.text(form.oe_axis || "—", cols[3], y);
    doc.text(fmtVal(form.oe_addition), cols[4], y);
    y += 12;

    doc.line(14, y, w - 14, y);
    y += 8;

    if (form.interpupillary_distance) {
      doc.text(`DNP (Distância Pupilar): ${form.interpupillary_distance} mm`, 14, y);
      y += 7;
    }
    if (form.lens_type) { doc.text(`Tipo de Lente: ${form.lens_type}`, 14, y); y += 7; }
    if (form.lens_material) { doc.text(`Material: ${form.lens_material}`, 14, y); y += 7; }
    if (form.lens_treatment) { doc.text(`Tratamento: ${form.lens_treatment}`, 14, y); y += 7; }
    if (form.observations) {
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.text("Observações:", 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(form.observations, w - 28);
      doc.text(lines, 14, y);
    }

    // Footer
    const fh = doc.internal.pageSize.getHeight();
    doc.setFillColor(248, 248, 252);
    doc.rect(0, fh - 22, w, 22, "F");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text("Documento assinado digitalmente. Valide a autenticidade em assinaturadigital.iti.gov.br", w / 2, fh - 10, { align: "center" });

    doc.save(`receita-oculos-${exam.patient_name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  const handleSaveAndGenerate = async () => {
    setSaving(true);
    try {
      const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      // Get doctor profile id
      const { data: dp } = await supabase
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", user?.id || "")
        .maybeSingle();

      if (!dp) { toast.error("Perfil de médico não encontrado"); setSaving(false); return; }

      await supabase.from("ophthalmology_prescriptions" as any).insert({
        exam_id: exam.id,
        doctor_id: dp.id,
        patient_name: exam.patient_name,
        patient_cpf: exam.patient_cpf,
        od_spherical: form.od_spherical ? parseFloat(form.od_spherical) : null,
        od_cylindrical: form.od_cylindrical ? parseFloat(form.od_cylindrical) : null,
        od_axis: form.od_axis ? parseInt(form.od_axis) : null,
        od_addition: form.od_addition ? parseFloat(form.od_addition) : null,
        oe_spherical: form.oe_spherical ? parseFloat(form.oe_spherical) : null,
        oe_cylindrical: form.oe_cylindrical ? parseFloat(form.oe_cylindrical) : null,
        oe_axis: form.oe_axis ? parseInt(form.oe_axis) : null,
        oe_addition: form.oe_addition ? parseFloat(form.oe_addition) : null,
        interpupillary_distance: form.interpupillary_distance ? parseFloat(form.interpupillary_distance) : null,
        lens_type: form.lens_type || null,
        lens_material: form.lens_material || null,
        lens_treatment: form.lens_treatment || null,
        observations: form.observations || null,
        verification_code: verificationCode,
        signed_at: new Date().toISOString(),
      } as any);

      // Mark exam as completed
      await supabase
        .from("ophthalmology_exams" as any)
        .update({ status: "completed" } as any)
        .eq("id", exam.id);

      generatePDF();
      toast.success("Receita salva e PDF gerado!");
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="gap-2 rounded-xl">
        <ArrowLeft className="w-4 h-4" /> Voltar à fila
      </Button>

      {/* Info banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-sm">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Receita — {exam.patient_name}</h2>
            <p className="text-white/70 text-sm">Exame: {exam.exam_type} • {new Date(exam.created_at).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
      </div>

      {/* Exam summary */}
      <Card className="border-border/20 rounded-2xl shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4 text-violet-600" /> Dados do Exame (Técnico)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="p-2.5 rounded-xl bg-muted/50">
              <p className="text-[10px] text-muted-foreground">OD Esférico</p>
              <p className="font-semibold">{exam.od_spherical ?? "—"}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/50">
              <p className="text-[10px] text-muted-foreground">OD Cilíndrico</p>
              <p className="font-semibold">{exam.od_cylindrical ?? "—"}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/50">
              <p className="text-[10px] text-muted-foreground">OE Esférico</p>
              <p className="font-semibold">{exam.oe_spherical ?? "—"}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/50">
              <p className="text-[10px] text-muted-foreground">OE Cilíndrico</p>
              <p className="font-semibold">{exam.oe_cylindrical ?? "—"}</p>
            </div>
            {exam.intraocular_pressure_od != null && (
              <div className="p-2.5 rounded-xl bg-muted/50">
                <p className="text-[10px] text-muted-foreground">PIO OD</p>
                <p className="font-semibold">{exam.intraocular_pressure_od} mmHg</p>
              </div>
            )}
            {exam.intraocular_pressure_oe != null && (
              <div className="p-2.5 rounded-xl bg-muted/50">
                <p className="text-[10px] text-muted-foreground">PIO OE</p>
                <p className="font-semibold">{exam.intraocular_pressure_oe} mmHg</p>
              </div>
            )}
          </div>
          {exam.notes && <p className="mt-3 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">📝 {exam.notes}</p>}
        </CardContent>
      </Card>

      {/* Prescription form */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/20 rounded-2xl shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 mr-2">OD</Badge>
              Olho Direito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-xs text-muted-foreground block mb-1">Esférico</label><Input type="number" step="0.25" value={form.od_spherical} onChange={e => handleChange("od_spherical", e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Cilíndrico</label><Input type="number" step="0.25" value={form.od_cylindrical} onChange={e => handleChange("od_cylindrical", e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Eixo</label><Input type="number" step="1" value={form.od_axis} onChange={e => handleChange("od_axis", e.target.value)} /></div>
            </div>
            <div><label className="text-xs text-muted-foreground block mb-1">Adição (perto)</label><Input type="number" step="0.25" value={form.od_addition} onChange={e => handleChange("od_addition", e.target.value)} placeholder="+0.00" /></div>
          </CardContent>
        </Card>

        <Card className="border-border/20 rounded-2xl shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 mr-2">OE</Badge>
              Olho Esquerdo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-xs text-muted-foreground block mb-1">Esférico</label><Input type="number" step="0.25" value={form.oe_spherical} onChange={e => handleChange("oe_spherical", e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Cilíndrico</label><Input type="number" step="0.25" value={form.oe_cylindrical} onChange={e => handleChange("oe_cylindrical", e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Eixo</label><Input type="number" step="1" value={form.oe_axis} onChange={e => handleChange("oe_axis", e.target.value)} /></div>
            </div>
            <div><label className="text-xs text-muted-foreground block mb-1">Adição (perto)</label><Input type="number" step="0.25" value={form.oe_addition} onChange={e => handleChange("oe_addition", e.target.value)} placeholder="+0.00" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Lens details */}
      <Card className="border-border/20 rounded-2xl shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Glasses className="w-4 h-4 text-violet-600" /> Especificações da Lente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">DNP (mm)</label>
              <Input type="number" step="0.5" value={form.interpupillary_distance} onChange={e => handleChange("interpupillary_distance", e.target.value)} placeholder="63" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tipo de Lente</label>
              <Select value={form.lens_type} onValueChange={v => handleChange("lens_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monofocal">Monofocal</SelectItem>
                  <SelectItem value="bifocal">Bifocal</SelectItem>
                  <SelectItem value="multifocal">Multifocal</SelectItem>
                  <SelectItem value="progressiva">Progressiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Material</label>
              <Select value={form.lens_material} onValueChange={v => handleChange("lens_material", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CR-39">CR-39</SelectItem>
                  <SelectItem value="policarbonato">Policarbonato</SelectItem>
                  <SelectItem value="trivex">Trivex</SelectItem>
                  <SelectItem value="alto_indice">Alto Índice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tratamento</label>
              <Select value={form.lens_treatment} onValueChange={v => handleChange("lens_treatment", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="antirreflexo">Antirreflexo</SelectItem>
                  <SelectItem value="fotossensivel">Fotossensível</SelectItem>
                  <SelectItem value="blue_cut">Blue Cut</SelectItem>
                  <SelectItem value="transitions">Transitions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Observações</label>
            <Textarea rows={3} value={form.observations} onChange={e => handleChange("observations", e.target.value)} placeholder="Observações adicionais para a ótica..." />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleSaveAndGenerate} disabled={loading} size="lg" className="flex-1 rounded-2xl h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-xl text-base">
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
          Salvar & Baixar Receita PDF
        </Button>
        <Button variant="outline" size="lg" className="rounded-2xl h-14 border-2 text-base" asChild>
          <a href="https://assinaturadigital.iti.gov.br" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-5 h-5 mr-2" />
            Assinador Digital (Grátis)
          </a>
        </Button>
      </div>
    </div>
  );
};

export default OphthalmologyPrescriptionForm;
