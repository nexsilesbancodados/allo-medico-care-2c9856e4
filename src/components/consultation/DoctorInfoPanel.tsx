import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  User, Star, GraduationCap, Stethoscope, Shield, FileText, Clock,
  Award, Calendar, BadgeCheck, Timer, Activity
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

interface DoctorInfoPanelProps {
  doctorId: string;
  appointmentId: string;
}

interface DoctorData {
  crm: string;
  crm_state: string;
  bio: string | null;
  education: string | null;
  experience_years: number | null;
  rating: number | null;
  total_reviews: number | null;
  consultation_price: number | null;
  first_name: string;
  last_name: string;
  specialties: string[];
}

interface PrescriptionInfo {
  id: string;
  diagnosis: string | null;
  medications: any[];
  created_at: string;
}

interface MedicalRecordInfo {
  id: string;
  title: string;
  record_type: string;
  severity: string | null;
  is_active: boolean;
  created_at: string;
}

const DoctorInfoPanel = ({ doctorId, appointmentId }: DoctorInfoPanelProps) => {
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionInfo[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordInfo[]>([]);
  const [consultationCount, setConsultationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // Consultation timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!doctorId) return;
    fetchData();
  }, [doctorId]);

  const fetchData = async () => {
    // Get appointment to find patient_id
    const { data: appt } = await supabase
      .from("appointments")
      .select("patient_id")
      .eq("id", appointmentId)
      .single();

    const patientId = appt?.patient_id;

    const [docRes, specRes] = await Promise.all([
      supabase.from("doctor_profiles")
        .select("crm, crm_state, bio, education, experience_years, rating, total_reviews, consultation_price, user_id")
        .eq("id", doctorId)
        .single(),
      supabase.from("doctor_specialties")
        .select("specialties(name)")
        .eq("doctor_id", doctorId),
    ]);

    if (docRes.data) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", docRes.data.user_id)
        .single();

      const specialties = (specRes.data ?? []).map((s: any) => s.specialties?.name).filter(Boolean);

      setDoctor({
        ...docRes.data,
        first_name: profile?.first_name ?? "",
        last_name: profile?.last_name ?? "",
        specialties,
      });
    }

    // Fetch prescriptions, medical records, and consultation count for this patient
    if (patientId) {
      const [prescData, recordsData, countData] = await Promise.all([
        supabase
          .from("prescriptions")
          .select("id, diagnosis, medications, created_at")
          .eq("appointment_id", appointmentId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("medical_records")
          .select("id, title, record_type, severity, is_active, created_at")
          .eq("patient_id", patientId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("patient_id", patientId)
          .eq("status", "completed"),
      ]);

      if (prescData.data) setPrescriptions(prescData.data as any);
      if (recordsData.data) setMedicalRecords(recordsData.data as any);
      setConsultationCount(countData.count ?? 0);
    }

    setLoading(false);
  };

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!doctor) return null;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`}
      />
    ));
  };

  const recordTypeIcons: Record<string, string> = {
    diagnosis: "🩺", allergy: "⚠️", condition: "💊", procedure: "🔬",
    vaccination: "💉", lab_result: "🧪", imaging: "📷",
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-3">
        {/* Consultation timer */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 rounded-2xl bg-primary/5 border border-primary/15"
        >
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">Tempo de consulta</span>
          </div>
          <span className="text-sm font-mono font-bold text-primary">{formatElapsed(elapsed)}</span>
        </motion.div>

        {/* Doctor header card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[hsl(150,60%,40%)] flex items-center justify-center border-2 border-card">
                <BadgeCheck className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">
                Dr(a). {doctor.first_name} {doctor.last_name}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border font-mono">
                  CRM {doctor.crm}/{doctor.crm_state}
                </span>
                {consultationCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {consultationCount} consultas
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rating */}
          {doctor.rating && doctor.rating > 0 && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-0.5">
                {renderStars(doctor.rating)}
              </div>
              <span className="text-sm font-bold text-amber-400">{doctor.rating.toFixed(1)}</span>
              <span className="text-[10px] text-muted-foreground">({doctor.total_reviews} avaliações)</span>
            </div>
          )}

          {/* Specialties */}
          {doctor.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
              {doctor.specialties.map(s => (
                <span key={s} className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/8 text-primary border border-primary/15 flex items-center gap-1.5 font-medium">
                  <Stethoscope className="w-2.5 h-2.5" />{s}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Active medical records */}
        {medicalRecords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-4 space-y-3"
          >
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              Prontuário ativo
              <Badge variant="secondary" className="text-[9px] h-4 ml-auto">{medicalRecords.length}</Badge>
            </p>
            {medicalRecords.map(r => (
              <div key={r.id} className="p-2.5 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{recordTypeIcons[r.record_type] || "📋"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{r.title}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{r.record_type.replace("_", " ")}</p>
                  </div>
                  {r.severity && (
                    <Badge
                      variant={r.severity === "severe" ? "destructive" : "secondary"}
                      className="text-[9px] h-4"
                    >
                      {r.severity === "mild" ? "Leve" : r.severity === "moderate" ? "Moderado" : "Grave"}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* About */}
        {(doctor.bio || doctor.education || doctor.experience_years) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-border bg-card p-4 space-y-3"
          >
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
                <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              Sobre o profissional
            </p>
            {doctor.bio && (
              <p className="text-xs text-muted-foreground leading-relaxed">{doctor.bio}</p>
            )}
            {doctor.education && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50">
                <Award className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground">{doctor.education}</p>
              </div>
            )}
            {doctor.experience_years && doctor.experience_years > 0 && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-bold text-foreground">{doctor.experience_years}</span> anos de experiência
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Security badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-[hsl(150,40%,20%)] bg-[hsl(150,40%,8%)] p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(150,60%,40%,0.1)] flex items-center justify-center shrink-0 border border-[hsl(150,60%,40%,0.15)]">
              <Shield className="w-5 h-5 text-[hsl(150,60%,45%)]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[hsl(150,60%,55%)]">Consulta protegida</p>
              <p className="text-[10px] text-[hsl(150,40%,35%)] mt-0.5">Criptografia E2E · LGPD · CFM 2.314/2022</p>
            </div>
          </div>
        </motion.div>

        {/* Prescriptions from this consultation */}
        {prescriptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border border-border bg-card p-4 space-y-3"
          >
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              Receitas desta consulta
            </p>
            {prescriptions.map(p => (
              <div key={p.id} className="p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {Array.isArray(p.medications) ? `${p.medications.length} med.` : ""}
                  </span>
                </div>
                {p.diagnosis && <p className="text-xs text-foreground font-medium mt-1">{p.diagnosis}</p>}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </ScrollArea>
  );
};

export default DoctorInfoPanel;
