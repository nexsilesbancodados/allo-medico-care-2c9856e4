import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  User, Heart, AlertTriangle, Droplets, FileText, Stethoscope,
  ChevronDown, ChevronUp, Clock, Pill
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientInfoPanelProps {
  patientId: string;
  appointmentId: string;
}

interface PatientData {
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  blood_type: string | null;
  allergies: string[];
  chronic_conditions: string[];
  phone: string | null;
  cpf: string | null;
}

interface PreConsultationData {
  main_complaint: string;
  symptoms: string[];
  severity: string;
  duration: string;
  additional_notes: string | null;
}

interface PastConsultation {
  id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
}

interface PrescriptionData {
  id: string;
  diagnosis: string | null;
  medications: any[];
  created_at: string;
}

const severityColor: Record<string, string> = {
  mild: "bg-green-500/15 text-green-600 border-green-500/20",
  moderate: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  severe: "bg-destructive/15 text-destructive border-destructive/20",
};

const severityLabel: Record<string, string> = {
  mild: "Leve",
  moderate: "Moderado",
  severe: "Grave",
};

const PatientInfoPanel = ({ patientId, appointmentId }: PatientInfoPanelProps) => {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [preConsult, setPreConsult] = useState<PreConsultationData | null>(null);
  const [pastConsults, setPastConsults] = useState<PastConsultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    symptoms: true,
    health: true,
    history: false,
    prescriptions: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (!patientId) return;
    fetchAllData();
  }, [patientId, appointmentId]);

  const fetchAllData = async () => {
    const [profileRes, symptomsRes, pastRes, prescRes] = await Promise.all([
      supabase.from("profiles")
        .select("first_name, last_name, date_of_birth, blood_type, allergies, chronic_conditions, phone, cpf")
        .eq("user_id", patientId)
        .single(),
      supabase.from("pre_consultation_symptoms")
        .select("main_complaint, symptoms, severity, duration, additional_notes")
        .eq("appointment_id", appointmentId)
        .single(),
      supabase.from("appointments")
        .select("id, scheduled_at, status, notes")
        .eq("patient_id", patientId)
        .eq("status", "completed")
        .neq("id", appointmentId)
        .order("scheduled_at", { ascending: false })
        .limit(5),
      supabase.from("prescriptions")
        .select("id, diagnosis, medications, created_at")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (profileRes.data) setPatient(profileRes.data as any);
    if (symptomsRes.data) setPreConsult(symptomsRes.data as any);
    if (pastRes.data) setPastConsults(pastRes.data);
    if (prescRes.data) setPrescriptions(prescRes.data as any);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const age = patient?.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-3">
        {/* Patient header */}
        {patient && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(220,20%,12%)] border border-[hsl(220,15%,18%)]">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {patient.first_name} {patient.last_name}
              </p>
              <p className="text-[11px] text-[hsl(220,15%,50%)]">
                {age ? `${age} anos` : ""}{age && patient.blood_type ? " · " : ""}
                {patient.blood_type ? `Tipo ${patient.blood_type}` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Pre-consultation symptoms */}
        <Section
          title="Sintomas Pré-consulta"
          icon={<Stethoscope className="w-3.5 h-3.5" />}
          expanded={expandedSections.symptoms}
          onToggle={() => toggleSection("symptoms")}
          highlight={!!preConsult}
        >
          {preConsult ? (
            <div className="space-y-2">
              <div>
                <p className="text-[10px] uppercase text-[hsl(220,15%,45%)] font-semibold mb-1">Queixa principal</p>
                <p className="text-sm text-white">{preConsult.main_complaint}</p>
              </div>
              {preConsult.severity && (
                <Badge variant="outline" className={`text-[10px] ${severityColor[preConsult.severity] ?? ""}`}>
                  {severityLabel[preConsult.severity] ?? preConsult.severity}
                </Badge>
              )}
              {preConsult.duration && (
                <p className="text-xs text-[hsl(220,15%,55%)]">
                  <Clock className="w-3 h-3 inline mr-1" />Duração: {preConsult.duration}
                </p>
              )}
              {preConsult.symptoms && preConsult.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {preConsult.symptoms.map((s, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {preConsult.additional_notes && (
                <p className="text-xs text-[hsl(220,15%,55%)] italic">"{preConsult.additional_notes}"</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-[hsl(220,15%,40%)]">Paciente não preencheu sintomas</p>
          )}
        </Section>

        {/* Health info */}
        <Section
          title="Saúde do Paciente"
          icon={<Heart className="w-3.5 h-3.5" />}
          expanded={expandedSections.health}
          onToggle={() => toggleSection("health")}
        >
          {/* Allergies */}
          <div className="space-y-2">
            {patient?.allergies && patient.allergies.length > 0 ? (
              <div>
                <p className="text-[10px] uppercase text-destructive font-semibold flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3 h-3" /> Alergias
                </p>
                <div className="flex flex-wrap gap-1">
                  {patient.allergies.map((a, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[hsl(220,15%,40%)]">
                <AlertTriangle className="w-3 h-3 inline mr-1" />Sem alergias registradas
              </p>
            )}

            {/* Chronic conditions */}
            {patient?.chronic_conditions && patient.chronic_conditions.length > 0 ? (
              <div>
                <p className="text-[10px] uppercase text-amber-500 font-semibold flex items-center gap-1 mb-1">
                  <Heart className="w-3 h-3" /> Condições crônicas
                </p>
                <div className="flex flex-wrap gap-1">
                  {patient.chronic_conditions.map((c, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[hsl(220,15%,40%)]">Sem condições crônicas</p>
            )}

            {patient?.blood_type && (
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3 h-3 text-red-400" />
                <p className="text-xs text-[hsl(220,15%,60%)]">Tipo sanguíneo: <span className="font-semibold text-white">{patient.blood_type}</span></p>
              </div>
            )}
          </div>
        </Section>

        {/* Past consultations */}
        <Section
          title={`Histórico (${pastConsults.length})`}
          icon={<Clock className="w-3.5 h-3.5" />}
          expanded={expandedSections.history}
          onToggle={() => toggleSection("history")}
        >
          {pastConsults.length > 0 ? (
            <div className="space-y-2">
              {pastConsults.map(c => (
                <div key={c.id} className="p-2 rounded-lg bg-[hsl(220,20%,10%)] border border-[hsl(220,15%,16%)]">
                  <p className="text-[11px] text-[hsl(220,15%,55%)]">
                    {format(new Date(c.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  {c.notes && <p className="text-xs text-[hsl(220,15%,70%)] mt-1 line-clamp-2">{c.notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[hsl(220,15%,40%)]">Primeira consulta com você</p>
          )}
        </Section>

        {/* Recent prescriptions */}
        <Section
          title={`Receitas (${prescriptions.length})`}
          icon={<Pill className="w-3.5 h-3.5" />}
          expanded={expandedSections.prescriptions}
          onToggle={() => toggleSection("prescriptions")}
        >
          {prescriptions.length > 0 ? (
            <div className="space-y-2">
              {prescriptions.map(p => (
                <div key={p.id} className="p-2 rounded-lg bg-[hsl(220,20%,10%)] border border-[hsl(220,15%,16%)]">
                  <p className="text-[11px] text-[hsl(220,15%,55%)]">
                    {format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                  {p.diagnosis && <p className="text-xs text-white font-medium mt-0.5">{p.diagnosis}</p>}
                  <p className="text-[10px] text-[hsl(220,15%,45%)] mt-0.5">
                    {Array.isArray(p.medications) ? `${p.medications.length} medicamento(s)` : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[hsl(220,15%,40%)]">Sem receitas anteriores</p>
          )}
        </Section>
      </div>
    </ScrollArea>
  );
};

// Collapsible section component
const Section = ({
  title,
  icon,
  expanded,
  onToggle,
  highlight,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  highlight?: boolean;
  children: React.ReactNode;
}) => (
  <div className={`rounded-xl border ${highlight ? "border-primary/30 bg-primary/5" : "border-[hsl(220,15%,16%)] bg-[hsl(220,20%,9%)]"}`}>
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2.5 text-left"
    >
      <div className="flex items-center gap-2">
        <span className={highlight ? "text-primary" : "text-[hsl(220,15%,50%)]"}>{icon}</span>
        <span className="text-xs font-semibold text-[hsl(220,15%,80%)]">{title}</span>
        {highlight && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
      </div>
      {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[hsl(220,15%,40%)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[hsl(220,15%,40%)]" />}
    </button>
    {expanded && <div className="px-3 pb-3">{children}</div>}
  </div>
);

export default PatientInfoPanel;
