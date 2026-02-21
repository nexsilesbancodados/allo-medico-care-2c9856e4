import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User, Star, GraduationCap, Stethoscope, Shield, FileText, Clock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DoctorInfoPanelProps {
  doctorId: string; // doctor_profiles.id
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

const DoctorInfoPanel = ({ doctorId, appointmentId }: DoctorInfoPanelProps) => {
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctorId) return;
    fetchData();
  }, [doctorId]);

  const fetchData = async () => {
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

    // Get prescriptions from this doctor for this patient
    const { data: prescData } = await supabase
      .from("prescriptions")
      .select("id, diagnosis, medications, created_at")
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (prescData) setPrescriptions(prescData as any);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!doctor) return null;

  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-3">
        {/* Doctor header */}
        <div className="p-3 rounded-xl bg-[hsl(220,20%,12%)] border border-[hsl(220,15%,18%)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">
                Dr(a). {doctor.first_name} {doctor.last_name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-[hsl(220,15%,50%)]">
                  CRM {doctor.crm}/{doctor.crm_state}
                </span>
                {doctor.rating && doctor.rating > 0 && (
                  <span className="flex items-center gap-0.5 text-[11px] text-yellow-500">
                    <Star className="w-3 h-3 fill-yellow-500" />
                    {doctor.rating.toFixed(1)}
                    <span className="text-[hsl(220,15%,40%)]">({doctor.total_reviews})</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Specialties */}
          {doctor.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {doctor.specialties.map(s => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                  <Stethoscope className="w-2.5 h-2.5" />{s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* About */}
        {(doctor.bio || doctor.education || doctor.experience_years) && (
          <div className="rounded-xl border border-[hsl(220,15%,16%)] bg-[hsl(220,20%,9%)] p-3 space-y-2">
            <p className="text-xs font-semibold text-[hsl(220,15%,70%)] flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[hsl(220,15%,50%)]" /> Sobre o médico
            </p>
            {doctor.bio && <p className="text-xs text-[hsl(220,15%,60%)] leading-relaxed">{doctor.bio}</p>}
            {doctor.education && (
              <p className="text-[11px] text-[hsl(220,15%,50%)]">
                🎓 {doctor.education}
              </p>
            )}
            {doctor.experience_years && doctor.experience_years > 0 && (
              <p className="text-[11px] text-[hsl(220,15%,50%)]">
                📅 {doctor.experience_years} anos de experiência
              </p>
            )}
          </div>
        )}

        {/* Security badge */}
        <div className="rounded-xl border border-[hsl(150,40%,20%)] bg-[hsl(150,40%,8%)] p-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[hsl(150,60%,50%)]" />
            <div>
              <p className="text-[11px] font-semibold text-[hsl(150,60%,60%)]">Consulta protegida</p>
              <p className="text-[10px] text-[hsl(150,40%,40%)]">Criptografia E2E · LGPD · CFM 2.314/2022</p>
            </div>
          </div>
        </div>

        {/* Prescriptions from this consultation */}
        {prescriptions.length > 0 && (
          <div className="rounded-xl border border-[hsl(220,15%,16%)] bg-[hsl(220,20%,9%)] p-3 space-y-2">
            <p className="text-xs font-semibold text-[hsl(220,15%,70%)] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[hsl(220,15%,50%)]" /> Receitas desta consulta
            </p>
            {prescriptions.map(p => (
              <div key={p.id} className="p-2 rounded-lg bg-[hsl(220,20%,12%)] border border-[hsl(220,15%,18%)]">
                <p className="text-[11px] text-[hsl(220,15%,55%)]">
                  {format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
                {p.diagnosis && <p className="text-xs text-white font-medium mt-0.5">{p.diagnosis}</p>}
                <p className="text-[10px] text-[hsl(220,15%,45%)]">
                  {Array.isArray(p.medications) ? `${p.medications.length} medicamento(s)` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default DoctorInfoPanel;
