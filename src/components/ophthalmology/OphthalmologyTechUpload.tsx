import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, Send, Loader2, CheckCircle2 } from "lucide-react";

const EXAM_TYPES = [
  { value: "refração", label: "Refração / Autorefração" },
  { value: "topografia", label: "Topografia Corneana" },
  { value: "tonometria", label: "Tonometria" },
  { value: "campimetria", label: "Campimetria" },
  { value: "fundo_olho", label: "Fundo de Olho" },
  { value: "oct", label: "OCT (Tomografia)" },
  { value: "biometria", label: "Biometria" },
  { value: "paquimetria", label: "Paquimetria" },
  { value: "retinografia", label: "Retinografia" },
  { value: "outro", label: "Outro" },
];

const OphthalmologyTechUpload = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    patient_name: "",
    patient_cpf: "",
    exam_type: "refração",
    od_spherical: "", od_cylindrical: "", od_axis: "",
    oe_spherical: "", oe_cylindrical: "", oe_axis: "",
    od_acuity: "", oe_acuity: "",
    intraocular_pressure_od: "", intraocular_pressure_oe: "",
    notes: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.patient_name.trim()) {
      toast.error("Informe o nome do paciente");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("ophthalmology_exams" as any).insert({
        patient_name: form.patient_name,
        patient_cpf: form.patient_cpf || null,
        exam_type: form.exam_type,
        od_spherical: form.od_spherical ? parseFloat(form.od_spherical) : null,
        od_cylindrical: form.od_cylindrical ? parseFloat(form.od_cylindrical) : null,
        od_axis: form.od_axis ? parseInt(form.od_axis) : null,
        oe_spherical: form.oe_spherical ? parseFloat(form.oe_spherical) : null,
        oe_cylindrical: form.oe_cylindrical ? parseFloat(form.oe_cylindrical) : null,
        oe_axis: form.oe_axis ? parseInt(form.oe_axis) : null,
        od_acuity: form.od_acuity || null,
        oe_acuity: form.oe_acuity || null,
        intraocular_pressure_od: form.intraocular_pressure_od ? parseFloat(form.intraocular_pressure_od) : null,
        intraocular_pressure_oe: form.intraocular_pressure_oe ? parseFloat(form.intraocular_pressure_oe) : null,
        notes: form.notes || null,
        technician_id: user?.id,
        status: "pending",
      } as any);
      if (error) throw error;
      toast.success("Exame enviado com sucesso!");
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setForm({
          patient_name: "", patient_cpf: "", exam_type: "refração",
          od_spherical: "", od_cylindrical: "", od_axis: "",
          oe_spherical: "", oe_cylindrical: "", oe_axis: "",
          od_acuity: "", oe_acuity: "",
          intraocular_pressure_od: "", intraocular_pressure_oe: "",
          notes: "",
        });
      }, 2000);
    } catch (err: any) {
      toast.error("Erro ao enviar exame: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-700 p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-sm">
            <Eye className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Envio de Exame Oftalmológico</h1>
            <p className="text-white/80 text-sm mt-1">Registre as leituras dos equipamentos e envie para análise médica</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Exame enviado! Aguardando análise do oftalmologista.</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Patient Info */}
        <Card className="border-border/20 shadow-lg rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Dados do Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome Completo *</label>
              <Input value={form.patient_name} onChange={e => handleChange("patient_name", e.target.value)} placeholder="Nome do paciente" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">CPF</label>
              <Input value={form.patient_cpf} onChange={e => handleChange("patient_cpf", e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de Exame</label>
              <Select value={form.exam_type} onValueChange={v => handleChange("exam_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pressure */}
        <Card className="border-border/20 shadow-lg rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              Pressão Intraocular (mmHg)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">OD (Direito)</label>
                <Input type="number" step="0.1" value={form.intraocular_pressure_od} onChange={e => handleChange("intraocular_pressure_od", e.target.value)} placeholder="Ex: 14" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">OE (Esquerdo)</label>
                <Input type="number" step="0.1" value={form.intraocular_pressure_oe} onChange={e => handleChange("intraocular_pressure_oe", e.target.value)} placeholder="Ex: 15" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">AV OD</label>
                <Input value={form.od_acuity} onChange={e => handleChange("od_acuity", e.target.value)} placeholder="20/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">AV OE</label>
                <Input value={form.oe_acuity} onChange={e => handleChange("oe_acuity", e.target.value)} placeholder="20/20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refraction Data */}
      <Card className="border-border/20 shadow-lg rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            Dados de Refração
          </CardTitle>
          <CardDescription>Valores do autorefrator ou refração subjetiva</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* OD */}
            <div>
              <Badge variant="outline" className="mb-2 text-xs">OD — Olho Direito</Badge>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Esférico</label>
                  <Input type="number" step="0.25" value={form.od_spherical} onChange={e => handleChange("od_spherical", e.target.value)} placeholder="+0.00" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Cilíndrico</label>
                  <Input type="number" step="0.25" value={form.od_cylindrical} onChange={e => handleChange("od_cylindrical", e.target.value)} placeholder="-0.00" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Eixo (°)</label>
                  <Input type="number" step="1" min="0" max="180" value={form.od_axis} onChange={e => handleChange("od_axis", e.target.value)} placeholder="0–180" />
                </div>
              </div>
            </div>
            {/* OE */}
            <div>
              <Badge variant="outline" className="mb-2 text-xs">OE — Olho Esquerdo</Badge>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Esférico</label>
                  <Input type="number" step="0.25" value={form.oe_spherical} onChange={e => handleChange("oe_spherical", e.target.value)} placeholder="+0.00" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Cilíndrico</label>
                  <Input type="number" step="0.25" value={form.oe_cylindrical} onChange={e => handleChange("oe_cylindrical", e.target.value)} placeholder="-0.00" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Eixo (°)</label>
                  <Input type="number" step="1" min="0" max="180" value={form.oe_axis} onChange={e => handleChange("oe_axis", e.target.value)} placeholder="0–180" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="border-border/20 shadow-lg rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea rows={3} value={form.notes} onChange={e => handleChange("notes", e.target.value)} placeholder="Observações adicionais sobre o exame..." />
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={loading || !form.patient_name.trim()} size="lg" className="w-full rounded-2xl h-14 text-base bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-xl">
        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
        Enviar para Análise Médica
      </Button>
    </div>
  );
};

export default OphthalmologyTechUpload;
