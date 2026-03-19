import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle, User, Heart, Activity, FileText, Stethoscope,
  Thermometer, Weight, HeartPulse, Wind, Droplets, Save, Clock,
  Shield, Search, Upload, Download, History, Eye, Plus, Loader2,
  ClipboardList, Brain
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface PatientEMRProps {
  patientId: string;
  appointmentId?: string;
  isDoctor?: boolean;
  readOnly?: boolean;
}

interface AnamnesisData {
  id?: string;
  social_name: string;
  gender: string;
  chief_complaint: string;
  history_present_illness: string;
  past_medical_history: string;
  family_history: string;
  lifestyle_habits: string;
  review_of_systems: string;
  blood_pressure_sys: number | null;
  blood_pressure_dia: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  spo2: number | null;
  temperature: number | null;
  weight: number | null;
  height: number | null;
  physical_exam_notes: string;
  diagnostic_hypothesis: string;
  cid_codes: string[];
  treatment_plan: string;
  created_at?: string;
  updated_at?: string;
}

interface AuditEntry {
  id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  changed_by: string;
}

interface MedicalRecord {
  id: string;
  record_type: string;
  title: string;
  description: string | null;
  cid_code: string | null;
  severity: string | null;
  is_active: boolean;
  created_at: string;
}

const EMPTY_ANAMNESIS: AnamnesisData = {
  social_name: "", gender: "", chief_complaint: "", history_present_illness: "",
  past_medical_history: "", family_history: "", lifestyle_habits: "", review_of_systems: "",
  blood_pressure_sys: null, blood_pressure_dia: null, heart_rate: null, respiratory_rate: null,
  spo2: null, temperature: null, weight: null, height: null, physical_exam_notes: "",
  diagnostic_hypothesis: "", cid_codes: [], treatment_plan: "",
};

const FIELD_LABELS: Record<string, string> = {
  chief_complaint: "Queixa Principal",
  history_present_illness: "HDA",
  past_medical_history: "Hist. Patológico",
  family_history: "Hist. Familiar",
  lifestyle_habits: "Hábitos de Vida",
  review_of_systems: "Rev. de Sistemas",
  blood_pressure_sys: "PA Sistólica",
  blood_pressure_dia: "PA Diastólica",
  heart_rate: "Freq. Cardíaca",
  respiratory_rate: "Freq. Respiratória",
  spo2: "SpO2",
  temperature: "Temperatura",
  weight: "Peso",
  height: "Altura",
  physical_exam_notes: "Exame Físico",
  diagnostic_hypothesis: "Hipótese Diagnóstica",
  treatment_plan: "Plano Terapêutico",
  social_name: "Nome Social",
  gender: "Gênero",
};

const PatientEMR = ({ patientId, appointmentId, isDoctor = false, readOnly = false }: PatientEMRProps) => {
  const { user, roles } = useAuth();
  const isDoctorRole = isDoctor || roles.includes("doctor");
  const canEdit = isDoctorRole && !readOnly && !!appointmentId;

  const [anamnesis, setAnamnesis] = useState<AnamnesisData>(EMPTY_ANAMNESIS);
  const [pastAnamneses, setPastAnamneses] = useState<(AnamnesisData & { id: string; created_at: string })[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("anamnesis");
  const [showAudit, setShowAudit] = useState(false);
  const [cidSearch, setCidSearch] = useState("");
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null);
  const [existingAnamnesisId, setExistingAnamnesisId] = useState<string | null>(null);

  // Fetch all data in parallel
  useEffect(() => {
    if (!patientId) return;
    fetchAllData();
    // Log access for LGPD compliance
    if (user && isDoctorRole && patientId !== user.id) {
      supabase.from("medical_record_access_logs" as any).insert({
        patient_id: patientId,
        accessed_by: user.id,
        access_type: "emr_view",
        user_agent: navigator.userAgent,
      }).then(() => {});
    }
  }, [patientId, appointmentId]);

  const fetchAllData = async () => {
    setLoading(true);
    const [profileRes, recordsRes, docsRes, pastRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", patientId).maybeSingle(),
      supabase.from("medical_records").select("id, record_type, title, description, cid_code, severity, is_active, created_at")
        .eq("patient_id", patientId).order("created_at", { ascending: false }),
      supabase.from("patient_documents").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }),
      supabase.from("clinical_anamnesis" as any).select("*").eq("patient_id", patientId)
        .order("created_at", { ascending: false }) as any,
    ]);

    let currentAnamnesisRes: any = null;
    if (appointmentId) {
      currentAnamnesisRes = await (supabase.from("clinical_anamnesis" as any).select("*")
        .eq("appointment_id", appointmentId).maybeSingle() as any);
    }

    let docProfileRes: any = null;
    if (user && isDoctorRole) {
      docProfileRes = await supabase.from("doctor_profiles").select("id").eq("user_id", user.id).maybeSingle();
    }

    if (profileRes.data) setPatient(profileRes.data);
    if (recordsRes.data) setRecords(recordsRes.data as MedicalRecord[]);
    if (docsRes.data) setDocuments(docsRes.data);
    if (pastRes.data) setPastAnamneses(pastRes.data as any[]);

    if (currentAnamnesisRes?.data) {
      const existing = currentAnamnesisRes.data;
      setExistingAnamnesisId(existing.id);
      setAnamnesis({
        social_name: existing.social_name || "",
        gender: existing.gender || "",
        chief_complaint: existing.chief_complaint || "",
        history_present_illness: existing.history_present_illness || "",
        past_medical_history: existing.past_medical_history || "",
        family_history: existing.family_history || "",
        lifestyle_habits: existing.lifestyle_habits || "",
        review_of_systems: existing.review_of_systems || "",
        blood_pressure_sys: existing.blood_pressure_sys,
        blood_pressure_dia: existing.blood_pressure_dia,
        heart_rate: existing.heart_rate,
        respiratory_rate: existing.respiratory_rate,
        spo2: existing.spo2,
        temperature: existing.temperature,
        weight: existing.weight,
        height: existing.height,
        physical_exam_notes: existing.physical_exam_notes || "",
        diagnostic_hypothesis: existing.diagnostic_hypothesis || "",
        cid_codes: existing.cid_codes || [],
        treatment_plan: existing.treatment_plan || "",
      });
      // Fetch audit log
      const auditRes = await (supabase.from("clinical_evolution_audit" as any)
        .select("*").eq("record_id", existing.id).order("changed_at", { ascending: false }) as any);
      if (auditRes.data) setAuditLog(auditRes.data as unknown as AuditEntry[]);
    }

    if (docProfileRes?.data) {
      setDoctorProfileId(docProfileRes.data.id);
    }

    setLoading(false);
  };

  const updateField = useCallback((field: keyof AnamnesisData, value: any) => {
    setAnamnesis(prev => ({ ...prev, [field]: value }));
  }, []);

  const saveAnamnesis = async () => {
    if (!appointmentId || !doctorProfileId) {
      toast.error("Dados insuficientes para salvar");
      return;
    }
    setSaving(true);

    const payload = {
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorProfileId,
      ...anamnesis,
    };

    let error;
    if (existingAnamnesisId) {
      const { social_name, gender, chief_complaint, history_present_illness,
        past_medical_history, family_history, lifestyle_habits, review_of_systems,
        blood_pressure_sys, blood_pressure_dia, heart_rate, respiratory_rate,
        spo2, temperature, weight, height, physical_exam_notes,
        diagnostic_hypothesis, cid_codes, treatment_plan } = anamnesis;
      ({ error } = await supabase.from("clinical_anamnesis" as any).update({
        social_name, gender, chief_complaint, history_present_illness,
        past_medical_history, family_history, lifestyle_habits, review_of_systems,
        blood_pressure_sys, blood_pressure_dia, heart_rate, respiratory_rate,
        spo2, temperature, weight, height, physical_exam_notes,
        diagnostic_hypothesis, cid_codes, treatment_plan,
      }).eq("id", existingAnamnesisId));
    } else {
      const res = await (supabase.from("clinical_anamnesis" as any).insert(payload).select("id").single() as any);
      error = res.error;
      if (res.data) setExistingAnamnesisId((res.data as any).id);
    }

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar prontuário");
    } else {
      toast.success("Prontuário salvo com sucesso!");
    }
  };

  // Auto-save every 30s
  useEffect(() => {
    if (!canEdit || !existingAnamnesisId) return;
    const interval = setInterval(() => {
      saveAnamnesis();
    }, 30000);
    return () => clearInterval(interval);
  }, [canEdit, existingAnamnesisId, anamnesis]);

  const activeAllergies = records.filter(r => r.record_type === "allergy" && r.is_active);
  const activeConditions = records.filter(r => r.record_type === "condition" && r.is_active);
  const activeMeds = records.filter(r => r.record_type === "medication" && r.is_active);

  const age = patient?.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const bmi = anamnesis.weight && anamnesis.height
    ? (anamnesis.weight / Math.pow(anamnesis.height / 100, 2)).toFixed(1)
    : null;

  const exportHL7 = () => {
    const lines = [
      `MSH|^~\\&|ALLO_MEDICO|EMR|||${new Date().toISOString()}||ADT^A01|${Date.now()}|P|2.5`,
      `PID|||${patientId}||${patient?.last_name}^${patient?.first_name}||${patient?.date_of_birth || ""}|${anamnesis.gender || "U"}`,
      `DG1|1||${anamnesis.cid_codes?.join("~") || ""}||${new Date().toISOString()}|A`,
      `OBX|1|NM|BP_SYS||${anamnesis.blood_pressure_sys || ""}|mmHg`,
      `OBX|2|NM|BP_DIA||${anamnesis.blood_pressure_dia || ""}|mmHg`,
      `OBX|3|NM|HR||${anamnesis.heart_rate || ""}|bpm`,
      `OBX|4|NM|TEMP||${anamnesis.temperature || ""}|°C`,
      `OBX|5|NM|SPO2||${anamnesis.spo2 || ""}|%`,
      `OBX|6|NM|WEIGHT||${anamnesis.weight || ""}|kg`,
      `OBX|7|NM|HEIGHT||${anamnesis.height || ""}|cm`,
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prontuario-${patientId.slice(0, 8)}-${format(new Date(), "yyyyMMdd")}.hl7`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportado em formato HL7!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* ─── Patient Header ─── */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {patient?.avatar_url ? (
                <img src={patient.avatar_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-foreground">
                  {anamnesis.social_name || `${patient?.first_name || ""} ${patient?.last_name || ""}`}
                </h2>
                {anamnesis.social_name && (
                  <Badge variant="outline" className="text-[10px]">Nome social</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                {patient?.cpf && <span>CPF: {patient.cpf}</span>}
                {patient?.date_of_birth && <span>{format(new Date(patient.date_of_birth), "dd/MM/yyyy")} ({age} anos)</span>}
                {anamnesis.gender && <span>{anamnesis.gender}</span>}
                {patient?.blood_type && (
                  <span className="text-destructive font-medium flex items-center gap-0.5">
                    <Droplets className="w-3 h-3" />{patient.blood_type}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <Button onClick={saveAnamnesis} disabled={saving} size="sm" className="gap-1.5">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Salvar
                </Button>
              )}
              <Button onClick={exportHL7} variant="outline" size="sm" className="gap-1.5">
                <Download className="w-3.5 h-3.5" /> HL7
              </Button>
              <Button onClick={() => setShowAudit(true)} variant="ghost" size="sm" className="gap-1.5">
                <History className="w-3.5 h-3.5" /> Auditoria
              </Button>
            </div>
          </div>

          {/* ─── Allergy Alert Banner ─── */}
          {activeAllergies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2"
            >
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">⚠️ Alergias Ativas</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {activeAllergies.map(a => (
                    <Badge key={a.id} variant="destructive" className="text-xs">
                      {a.title} {a.severity === "severe" ? "🔴" : a.severity === "moderate" ? "🟠" : "🟡"}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* ─── Main Tabs ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="anamnesis" className="text-xs gap-1"><ClipboardList className="w-3.5 h-3.5" /> Anamnese</TabsTrigger>
          <TabsTrigger value="vitals" className="text-xs gap-1"><HeartPulse className="w-3.5 h-3.5" /> Sinais Vitais</TabsTrigger>
          <TabsTrigger value="diagnosis" className="text-xs gap-1"><Brain className="w-3.5 h-3.5" /> Diagnóstico</TabsTrigger>
          <TabsTrigger value="records" className="text-xs gap-1"><Activity className="w-3.5 h-3.5" /> Prontuário</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs gap-1"><FileText className="w-3.5 h-3.5" /> Arquivos</TabsTrigger>
          <TabsTrigger value="evolution" className="text-xs gap-1"><Clock className="w-3.5 h-3.5" /> Evolução</TabsTrigger>
        </TabsList>

        {/* ─── Anamnesis Tab ─── */}
        <TabsContent value="anamnesis" className="mt-4 space-y-4">
          {canEdit && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Nome Social (se houver)</Label>
                <Input value={anamnesis.social_name} onChange={e => updateField("social_name", e.target.value)}
                  placeholder="Nome social do paciente" className="mt-1" disabled={!canEdit} />
              </div>
              <div>
                <Label className="text-xs">Gênero</Label>
                <Select value={anamnesis.gender} onValueChange={v => updateField("gender", v)} disabled={!canEdit}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Não-binário">Não-binário</SelectItem>
                    <SelectItem value="Prefere não informar">Prefere não informar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-primary" /> Queixa Principal *
            </Label>
            <Textarea value={anamnesis.chief_complaint}
              onChange={e => updateField("chief_complaint", e.target.value)}
              placeholder="Queixa principal do paciente..." rows={2} className="mt-1" disabled={!canEdit} />
          </div>

          <div>
            <Label className="text-xs font-semibold">História da Doença Atual (HDA)</Label>
            <Textarea value={anamnesis.history_present_illness}
              onChange={e => updateField("history_present_illness", e.target.value)}
              placeholder="Início, evolução, características dos sintomas..." rows={3} className="mt-1" disabled={!canEdit} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Antecedentes Pessoais</Label>
              <Textarea value={anamnesis.past_medical_history}
                onChange={e => updateField("past_medical_history", e.target.value)}
                placeholder="Cirurgias, internações, doenças prévias..." rows={3} className="mt-1" disabled={!canEdit} />
            </div>
            <div>
              <Label className="text-xs font-semibold">Histórico Familiar</Label>
              <Textarea value={anamnesis.family_history}
                onChange={e => updateField("family_history", e.target.value)}
                placeholder="Doenças na família, HAS, DM, câncer..." rows={3} className="mt-1" disabled={!canEdit} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Hábitos de Vida</Label>
              <Textarea value={anamnesis.lifestyle_habits}
                onChange={e => updateField("lifestyle_habits", e.target.value)}
                placeholder="Tabagismo, etilismo, atividade física, dieta..." rows={3} className="mt-1" disabled={!canEdit} />
            </div>
            <div>
              <Label className="text-xs font-semibold">Revisão de Sistemas</Label>
              <Textarea value={anamnesis.review_of_systems}
                onChange={e => updateField("review_of_systems", e.target.value)}
                placeholder="Cardiovascular, respiratório, neurológico..." rows={3} className="mt-1" disabled={!canEdit} />
            </div>
          </div>
        </TabsContent>

        {/* ─── Vitals Tab ─── */}
        <TabsContent value="vitals" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <VitalCard icon={HeartPulse} label="PA (mmHg)" color="text-destructive">
              <div className="flex items-center gap-1">
                <Input type="number" value={anamnesis.blood_pressure_sys ?? ""} placeholder="Sys"
                  onChange={e => updateField("blood_pressure_sys", e.target.value ? parseInt(e.target.value) : null)}
                  className="h-8 text-center text-sm" disabled={!canEdit} />
                <span className="text-muted-foreground">/</span>
                <Input type="number" value={anamnesis.blood_pressure_dia ?? ""} placeholder="Dia"
                  onChange={e => updateField("blood_pressure_dia", e.target.value ? parseInt(e.target.value) : null)}
                  className="h-8 text-center text-sm" disabled={!canEdit} />
              </div>
            </VitalCard>
            <VitalCard icon={Activity} label="FC (bpm)" color="text-primary">
              <Input type="number" value={anamnesis.heart_rate ?? ""} placeholder="—"
                onChange={e => updateField("heart_rate", e.target.value ? parseInt(e.target.value) : null)}
                className="h-8 text-center text-sm" disabled={!canEdit} />
            </VitalCard>
            <VitalCard icon={Wind} label="FR (irpm)" color="text-blue-400">
              <Input type="number" value={anamnesis.respiratory_rate ?? ""} placeholder="—"
                onChange={e => updateField("respiratory_rate", e.target.value ? parseInt(e.target.value) : null)}
                className="h-8 text-center text-sm" disabled={!canEdit} />
            </VitalCard>
            <VitalCard icon={Droplets} label="SpO₂ (%)" color="text-cyan-400">
              <Input type="number" value={anamnesis.spo2 ?? ""} placeholder="—" step="0.1"
                onChange={e => updateField("spo2", e.target.value ? parseFloat(e.target.value) : null)}
                className="h-8 text-center text-sm" disabled={!canEdit} />
            </VitalCard>
            <VitalCard icon={Thermometer} label="Temp (°C)" color="text-orange-400">
              <Input type="number" value={anamnesis.temperature ?? ""} placeholder="—" step="0.1"
                onChange={e => updateField("temperature", e.target.value ? parseFloat(e.target.value) : null)}
                className="h-8 text-center text-sm" disabled={!canEdit} />
            </VitalCard>
            <VitalCard icon={Weight} label="Peso (kg)" color="text-emerald-400">
              <Input type="number" value={anamnesis.weight ?? ""} placeholder="—" step="0.1"
                onChange={e => updateField("weight", e.target.value ? parseFloat(e.target.value) : null)}
                className="h-8 text-center text-sm" disabled={!canEdit} />
            </VitalCard>
            <VitalCard icon={User} label="Altura (cm)" color="text-violet-400">
              <Input type="number" value={anamnesis.height ?? ""} placeholder="—" step="0.1"
                onChange={e => updateField("height", e.target.value ? parseFloat(e.target.value) : null)}
                className="h-8 text-center text-sm" disabled={!canEdit} />
            </VitalCard>
            {bmi && (
              <div className="p-3 rounded-xl border border-border bg-card text-center">
                <p className="text-[10px] text-muted-foreground font-medium mb-1">IMC</p>
                <p className={`text-lg font-bold ${
                  parseFloat(bmi) < 18.5 ? "text-blue-400" :
                  parseFloat(bmi) < 25 ? "text-emerald-400" :
                  parseFloat(bmi) < 30 ? "text-orange-400" : "text-destructive"
                }`}>{bmi}</p>
                <p className="text-[10px] text-muted-foreground">
                  {parseFloat(bmi) < 18.5 ? "Abaixo do peso" :
                   parseFloat(bmi) < 25 ? "Normal" :
                   parseFloat(bmi) < 30 ? "Sobrepeso" : "Obesidade"}
                </p>
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs font-semibold">Exame Físico / Objetivo</Label>
            <Textarea value={anamnesis.physical_exam_notes}
              onChange={e => updateField("physical_exam_notes", e.target.value)}
              placeholder="Achados do exame físico detalhado..." rows={4} className="mt-1" disabled={!canEdit} />
          </div>
        </TabsContent>

        {/* ─── Diagnosis Tab ─── */}
        <TabsContent value="diagnosis" className="mt-4 space-y-4">
          <div>
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-primary" /> Hipótese Diagnóstica
            </Label>
            <Textarea value={anamnesis.diagnostic_hypothesis}
              onChange={e => updateField("diagnostic_hypothesis", e.target.value)}
              placeholder="Hipóteses diagnósticas baseadas na avaliação clínica..." rows={3} className="mt-1" disabled={!canEdit} />
          </div>

          <div>
            <Label className="text-xs font-semibold">Códigos CID-10/11</Label>
            <div className="flex gap-2 mt-1">
              <Input value={cidSearch} onChange={e => setCidSearch(e.target.value)}
                placeholder="Adicionar código CID (ex: J45, E11, I10)..."
                disabled={!canEdit}
                onKeyDown={e => {
                  if (e.key === "Enter" && cidSearch.trim()) {
                    updateField("cid_codes", [...anamnesis.cid_codes, cidSearch.trim().toUpperCase()]);
                    setCidSearch("");
                  }
                }} />
              <Button size="sm" variant="outline" disabled={!canEdit || !cidSearch.trim()}
                onClick={() => {
                  updateField("cid_codes", [...anamnesis.cid_codes, cidSearch.trim().toUpperCase()]);
                  setCidSearch("");
                }}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {anamnesis.cid_codes.map((code, i) => (
                <Badge key={i} variant="secondary" className="text-xs gap-1">
                  {code}
                  {canEdit && (
                    <button className="ml-1 text-muted-foreground hover:text-destructive"
                      onClick={() => updateField("cid_codes", anamnesis.cid_codes.filter((_, j) => j !== i))}>
                      ×
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-xs font-semibold">Plano Terapêutico</Label>
            <Textarea value={anamnesis.treatment_plan}
              onChange={e => updateField("treatment_plan", e.target.value)}
              placeholder="Conduta, orientações, encaminhamentos, retorno..." rows={4} className="mt-1" disabled={!canEdit} />
          </div>
        </TabsContent>

        {/* ─── Records Tab (allergies, conditions, meds) ─── */}
        <TabsContent value="records" className="mt-4 space-y-4">
          {/* Active Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SummaryCard title="Alergias" items={activeAllergies} icon={AlertTriangle} color="text-destructive" bgColor="bg-destructive/5" />
            <SummaryCard title="Condições Crônicas" items={activeConditions} icon={Activity} color="text-orange-400" bgColor="bg-orange-500/5" />
            <SummaryCard title="Medicamentos Contínuos" items={activeMeds} icon={Heart} color="text-primary" bgColor="bg-primary/5" />
          </div>

          {/* Timeline of all records */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Registros Cronológicos</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96">
                {records.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum registro encontrado.</p>
                ) : (
                  <div className="space-y-2">
                    {records.map(r => (
                      <div key={r.id} className={`p-3 rounded-lg border border-border ${!r.is_active ? "opacity-50" : ""}`}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{r.record_type}</Badge>
                          <span className="text-sm font-medium text-foreground">{r.title}</span>
                          {r.cid_code && <Badge variant="secondary" className="text-[10px]">CID: {r.cid_code}</Badge>}
                        </div>
                        {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(r.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Documents Tab ─── */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" /> Arquivos do Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum arquivo enviado pelo paciente.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{d.file_type?.includes("image") ? "🖼️" : "📄"}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{d.description || d.file_name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Badge variant="outline" className="text-[10px]">{d.category || "Geral"}</Badge>
                            <span>{format(new Date(d.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                            {d.file_size && <span>{(d.file_size / 1024).toFixed(0)} KB</span>}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={async () => {
                        const { data } = await supabase.storage.from("patient-documents").createSignedUrl(d.file_url, 3600);
                        if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                      }}>
                        <Eye className="w-3 h-3 mr-1" /> Ver
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Clinical Evolution Tab ─── */}
        <TabsContent value="evolution" className="mt-4 space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Evolução Clínica — Consultas Anteriores</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                {pastAnamneses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma evolução registrada.</p>
                ) : (
                  <div className="space-y-3">
                    {pastAnamneses.map(a => (
                      <div key={a.id} className="p-4 rounded-xl border border-border bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(a.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          {a.cid_codes && a.cid_codes.length > 0 && (
                            <div className="flex gap-1">
                              {a.cid_codes.map((c: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-[10px]">{c}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {a.chief_complaint && (
                          <div className="mb-2">
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Queixa Principal</p>
                            <p className="text-sm text-foreground">{a.chief_complaint}</p>
                          </div>
                        )}
                        {a.diagnostic_hypothesis && (
                          <div className="mb-2">
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Hipótese Diagnóstica</p>
                            <p className="text-sm text-foreground">{a.diagnostic_hypothesis}</p>
                          </div>
                        )}
                        {a.treatment_plan && (
                          <div>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Conduta</p>
                            <p className="text-sm text-foreground">{a.treatment_plan}</p>
                          </div>
                        )}
                        {(a.blood_pressure_sys || a.heart_rate || a.temperature) && (
                          <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
                            {a.blood_pressure_sys && a.blood_pressure_dia && <span>PA: {a.blood_pressure_sys}/{a.blood_pressure_dia}</span>}
                            {a.heart_rate && <span>FC: {a.heart_rate} bpm</span>}
                            {a.temperature && <span>T: {a.temperature}°C</span>}
                            {a.spo2 && <span>SpO₂: {a.spo2}%</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── LGPD / Compliance Footer ─── */}
      <div className="flex items-center gap-2.5 p-3 rounded-lg bg-accent/30 border border-border">
        <Shield className="w-4 h-4 text-primary shrink-0" />
        <div>
          <p className="text-[11px] font-medium text-primary">Prontuário protegido pela LGPD</p>
          <p className="text-[10px] text-muted-foreground">CFM 2.314/22 · Guarda mínima 20 anos · Trilha de auditoria ativa</p>
        </div>
      </div>

      {/* ─── Audit Trail Dialog ─── */}
      <Dialog open={showAudit} onOpenChange={setShowAudit}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Trilha de Auditoria
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {auditLog.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma alteração registrada.</p>
            ) : (
              <div className="space-y-3">
                {auditLog.map(entry => (
                  <div key={entry.id} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[10px]">{FIELD_LABELS[entry.field_name] || entry.field_name}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(entry.changed_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="p-2 rounded bg-destructive/5 border border-destructive/10">
                        <p className="text-[10px] text-destructive font-medium mb-0.5">Anterior</p>
                        <p className="text-xs text-foreground">{entry.old_value || "—"}</p>
                      </div>
                      <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/10">
                        <p className="text-[10px] text-emerald-500 font-medium mb-0.5">Novo</p>
                        <p className="text-xs text-foreground">{entry.new_value || "—"}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Usuário: {entry.changed_by?.slice(0, 8)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Helper components ─────────────────────────────────────────

const VitalCard = ({ icon: Icon, label, color, children }: {
  icon: any; label: string; color: string; children: React.ReactNode;
}) => (
  <div className="p-3 rounded-xl border border-border bg-card">
    <div className="flex items-center gap-1.5 mb-2">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
    </div>
    {children}
  </div>
);

const SummaryCard = ({ title, items, icon: Icon, color, bgColor }: {
  title: string; items: MedicalRecord[]; icon: any; color: string; bgColor: string;
}) => (
  <Card className={`border-border ${bgColor}`}>
    <CardContent className="p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <Badge variant="outline" className="text-[10px] ml-auto">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum registro ✓</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.map(i => (
            <Badge key={i.id} variant="secondary" className="text-[10px]">{i.title}</Badge>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default PatientEMR;
