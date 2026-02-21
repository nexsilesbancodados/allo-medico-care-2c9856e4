import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, GraduationCap, Clock, Calendar, ArrowLeft, Video, Award } from "lucide-react";
import { motion } from "framer-motion";

interface DoctorPublicData {
  id: string;
  bio: string | null;
  consultation_price: number | null;
  crm: string;
  crm_state: string;
  rating: number | null;
  total_reviews: number | null;
  education: string | null;
  experience_years: number | null;
  name: string;
  avatar_url: string | null;
  specialties: string[];
}

interface Review {
  nps_score: number;
  quality_score: number | null;
  comment: string | null;
  created_at: string;
  patient_name: string;
}

const DoctorPublicProfile = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<DoctorPublicData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (doctorId) fetchDoctor();
  }, [doctorId]);

  const fetchDoctor = async () => {
    const { data: doc } = await supabase
      .from("doctor_profiles")
      .select("id, bio, consultation_price, crm, crm_state, rating, total_reviews, education, experience_years, user_id")
      .eq("id", doctorId)
      .eq("is_approved", true)
      .single();

    if (!doc) { setLoading(false); return; }

    const [profileRes, specsRes, surveysRes] = await Promise.all([
      supabase.from("profiles").select("first_name, last_name, avatar_url").eq("user_id", doc.user_id).single(),
      supabase.from("doctor_specialties").select("specialties(name)").eq("doctor_id", doc.id),
      supabase.from("satisfaction_surveys").select("nps_score, quality_score, comment, created_at, patient_id").eq("doctor_id", doc.id).order("created_at", { ascending: false }).limit(10),
    ]);

    const specialties = (specsRes.data as any[])?.map((s: any) => s.specialties?.name).filter(Boolean) ?? [];

    // Get patient names for reviews
    const patientIds = [...new Set(surveysRes.data?.map(s => s.patient_id) ?? [])];
    const { data: patientProfiles } = patientIds.length > 0
      ? await supabase.from("profiles").select("user_id, first_name").in("user_id", patientIds)
      : { data: [] };
    const patientMap = new Map<string, string>(patientProfiles?.map(p => [p.user_id, p.first_name] as [string, string]) ?? []);

    setDoctor({
      id: doc.id,
      bio: doc.bio,
      consultation_price: doc.consultation_price,
      crm: doc.crm,
      crm_state: doc.crm_state,
      rating: doc.rating,
      total_reviews: doc.total_reviews,
      education: doc.education,
      experience_years: doc.experience_years,
      name: profileRes.data ? `${profileRes.data.first_name} ${profileRes.data.last_name}` : "Médico",
      avatar_url: profileRes.data?.avatar_url ?? null,
      specialties,
    });

    setReviews(
      surveysRes.data?.map(s => ({
        nps_score: s.nps_score,
        quality_score: s.quality_score,
        comment: s.comment,
        created_at: s.created_at,
        patient_name: patientMap.get(s.patient_id) ?? "Paciente",
      } as Review)) ?? []
    );

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Médico não encontrado.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </div>
    );
  }

  const starRating = Math.round((doctor.rating ?? 0) * 2) / 2;

  return (
    <div className="min-h-screen bg-background">
      {/* Header gradient */}
      <div className="bg-gradient-hero h-48 relative">
        <div className="container mx-auto px-4 pt-6">
          <Button variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-20 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          {/* Profile card */}
          <Card className="shadow-elevated border-border overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Avatar */}
                <div className="w-28 h-28 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 ring-4 ring-background shadow-lg">
                  {doctor.avatar_url ? (
                    <img src={doctor.avatar_url} alt={doctor.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-primary">
                      {doctor.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </span>
                  )}
                </div>

                <div className="text-center sm:text-left flex-1">
                  <h1 className="text-2xl font-bold text-foreground">Dr(a). {doctor.name}</h1>
                  <p className="text-sm text-muted-foreground mt-1">CRM {doctor.crm}/{doctor.crm_state}</p>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                    {doctor.specialties.map(s => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`w-5 h-5 ${i <= starRating ? "text-yellow-500 fill-yellow-500" : i - 0.5 <= starRating ? "text-yellow-500 fill-yellow-500/50" : "text-muted-foreground/20"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{doctor.rating?.toFixed(1) ?? "0.0"}</span>
                    <span className="text-xs text-muted-foreground">({doctor.total_reviews ?? 0} avaliações)</span>
                  </div>

                  {/* Quick stats */}
                  <div className="flex flex-wrap gap-4 mt-4 justify-center sm:justify-start">
                    {doctor.experience_years && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {doctor.experience_years} anos de experiência
                      </div>
                    )}
                    {doctor.education && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <GraduationCap className="w-4 h-4" />
                        {doctor.education}
                      </div>
                    )}
                  </div>
                </div>

                {/* Price + CTA */}
                <div className="text-center shrink-0">
                  <p className="text-sm text-muted-foreground">Consulta a partir de</p>
                  <p className="text-3xl font-bold text-primary">
                    R$ {(doctor.consultation_price ?? 89).toFixed(2).replace(".", ",")}
                  </p>
                  <Button
                    className="mt-3 bg-gradient-hero text-primary-foreground rounded-full px-6"
                    onClick={() => navigate(`/dashboard/schedule/${doctor.id}`)}
                  >
                    <Calendar className="w-4 h-4 mr-2" /> Agendar
                  </Button>
                </div>
              </div>

              {/* Bio */}
              {doctor.bio && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="font-semibold text-foreground mb-2">Sobre</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{doctor.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Avaliações dos Pacientes ({reviews.length})
            </h2>

            {reviews.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Star className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {reviews.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {r.patient_name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{r.patient_name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(r.created_at).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(((r.quality_score ?? r.nps_score / 2) / 5) * 5) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"}`} />
                            ))}
                          </div>
                        </div>
                        {r.comment && (
                          <p className="text-sm text-muted-foreground mt-2">"{r.comment}"</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DoctorPublicProfile;
