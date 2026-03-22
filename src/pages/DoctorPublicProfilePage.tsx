import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import DoctorPublicProfile from "@/components/doctor/DoctorPublicProfile";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const DoctorPublicProfilePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorMeta, setDoctorMeta] = useState<{ name: string; specialty: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const resolve = async () => {
      // Try to match slug as doctor ID first (backwards compat)
      let doctorProfileId: string | null = null;

      // Try UUID match
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(slug)) {
        doctorProfileId = slug;
      } else {
        // Parse slug: extract CRM from end (e.g., "dr-joao-silva-123456-sp")
        const parts = slug.split("-");
        if (parts.length >= 3) {
          const state = parts[parts.length - 1]?.toUpperCase();
          const crm = parts[parts.length - 2];
          if (crm && state && state.length === 2) {
            const { data } = await supabase
              .from("doctor_profiles")
              .select("id")
              .eq("crm", crm)
              .eq("crm_state", state)
              .eq("is_approved", true)
              .maybeSingle();
            if (data) doctorProfileId = data.id;
          }
        }

        // Fallback: try name-based search
        if (!doctorProfileId) {
          const nameParts = slug.replace(/^dr-/, "").split("-").filter(p => p.length > 1);
          if (nameParts.length >= 1) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("user_id, first_name, last_name")
              .ilike("first_name", `%${nameParts[0]}%`);

            if (profiles && profiles.length > 0) {
              for (const p of profiles) {
                const { data: dp } = await supabase
                  .from("doctor_profiles")
                  .select("id")
                  .eq("user_id", p.user_id)
                  .eq("is_approved", true)
                  .maybeSingle();
                if (dp) { doctorProfileId = dp.id; break; }
              }
            }
          }
        }
      }

      if (doctorProfileId) {
        setDoctorId(doctorProfileId);
        // Fetch meta for SEO
        const { data: doc } = await supabase
          .from("doctor_profiles")
          .select("user_id, id")
          .eq("id", doctorProfileId)
          .maybeSingle();
        if (doc) {
          const [pRes, sRes] = await Promise.all([
            supabase.from("profiles").select("first_name, last_name").eq("user_id", doc.user_id).maybeSingle(),
            supabase.from("doctor_specialties").select("specialties(name)").eq("doctor_id", doc.id).limit(1),
          ]);
          const name = pRes.data ? `Dr(a). ${pRes.data.first_name} ${pRes.data.last_name}` : "Médico";
          const specialty = (sRes.data as { specialties?: { name?: string } | null }[])?.[0]?.specialties?.name ?? "Clínica Geral";
          setDoctorMeta({ name, specialty });
        }
      }
      setLoading(false);
    };
    resolve();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(200,55%,97%)] via-[hsl(210,45%,93%)] to-[hsl(220,40%,88%)] dark:from-[hsl(200,25%,7%)] dark:via-[hsl(210,20%,9%)] dark:to-[hsl(220,18%,11%)]" />
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!doctorId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold text-foreground">Médico não encontrado</p>
          <p className="text-muted-foreground text-sm">O perfil solicitado não existe ou não está disponível.</p>
          <Button variant="outline" onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {doctorMeta && (
        <SEOHead
          title={`${doctorMeta.name} — ${doctorMeta.specialty} | AloClinica`}
          description={`Agende uma consulta online com ${doctorMeta.name}, especialista em ${doctorMeta.specialty}. Atendimento por videochamada na AloClinica.`}
        />
      )}
      {doctorMeta && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Physician",
          "name": doctorMeta.name,
          "medicalSpecialty": doctorMeta.specialty,
          "url": window.location.href,
          "availableService": {
            "@type": "MedicalProcedure",
            "name": "Teleconsulta",
            "procedureType": "https://schema.org/NoninvasiveProcedure"
          }
        })}} />
      )}
      <DoctorPublicProfile />
    </>
  );
};

export default DoctorPublicProfilePage;
