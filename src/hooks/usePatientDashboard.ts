import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const usePatientStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["patient-dashboard-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [completedRes, prescRes, docsRes] = await Promise.all([
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("patient_id", user.id).eq("status", "completed"),
        supabase.from("prescriptions").select("id", { count: "exact", head: true }).eq("patient_id", user.id),
        supabase.from("patient_documents").select("id", { count: "exact", head: true }).eq("patient_id", user.id),
      ]);
      return {
        total: completedRes.count ?? 0,
        prescriptions: prescRes.count ?? 0,
        documents: docsRes.count ?? 0,
      };
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });
};

export const usePatientUpcoming = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["patient-upcoming-enriched", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const nowIso = new Date().toISOString();
      const { data: allAppts } = await supabase.from("appointments")
        .select("id, scheduled_at, status, doctor_id, duration_minutes, appointment_type")
        .eq("patient_id", user.id).gte("scheduled_at", nowIso)
        .in("status", ["scheduled", "waiting", "in_progress"])
        .order("scheduled_at", { ascending: true }).limit(5);

      if (!allAppts || allAppts.length === 0) return [];

      const doctorIds = [...new Set(allAppts.map(a => a.doctor_id))];
      const { data: docs } = await supabase.from("doctor_profiles").select("id, user_id").in("id", doctorIds);
      if (!docs || docs.length === 0) return allAppts.map(a => ({ ...a, doctor_name: "Médico" }));

      const userIds = docs.map(d => d.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);
      const docMap = new Map<string, string>();
      docs.forEach(d => {
        const p = profiles?.find(pr => pr.user_id === d.user_id);
        if (p) docMap.set(d.id, `Dr(a). ${p.first_name} ${p.last_name}`);
      });
      return allAppts.map(a => ({ ...a, doctor_name: docMap.get(a.doctor_id) ?? "Médico" }));
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useReturnAppointments = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["patient-return-appts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: returnData } = await supabase.from("appointments")
        .select("id, scheduled_at, doctor_id, return_deadline")
        .eq("patient_id", user.id).eq("status", "completed")
        .not("return_deadline", "is", null)
        .gte("return_deadline", new Date().toISOString());
      if (!returnData || returnData.length === 0) return [];

      const retDoctorIds = [...new Set(returnData.map(a => a.doctor_id))];
      const { data: retDocs } = await supabase.from("doctor_profiles").select("id, user_id").in("id", retDoctorIds);
      if (!retDocs) return returnData.map(a => ({ ...a, doctor_name: "Médico" }));

      const retUserIds = retDocs.map(d => d.user_id);
      const { data: retProfiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", retUserIds);
      const retMap = new Map<string, string>();
      retDocs.forEach(d => {
        const p = retProfiles?.find(pr => pr.user_id === d.user_id);
        if (p) retMap.set(d.id, `Dr(a). ${p.first_name} ${p.last_name}`);
      });
      return returnData.map(a => ({ ...a, doctor_name: retMap.get(a.doctor_id) ?? "Médico" }));
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
};

export const useRecentHealthMetrics = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["patient-recent-metrics", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("health_metrics")
        .select("type, value, unit, measured_at")
        .eq("patient_id", user.id)
        .order("measured_at", { ascending: false })
        .limit(10);
      if (!data || data.length === 0) return [];
      // Get latest of each type
      const latest = new Map<string, typeof data[0]>();
      data.forEach(m => {
        if (!latest.has(m.type)) latest.set(m.type, m);
      });
      return Array.from(latest.values()).slice(0, 4);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};

export const useFavoriteDoctors = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["patient-fav-doctors", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: favData } = await supabase.from("favorite_doctors").select("doctor_id").eq("patient_id", user.id);
      if (!favData || favData.length === 0) return [];

      const favDocIds = favData.map(f => f.doctor_id);
      const { data: favDocs } = await supabase.from("doctor_profiles").select("id, user_id, consultation_price, rating").in("id", favDocIds);
      if (!favDocs) return [];

      const favUserIds = favDocs.map(d => d.user_id);
      const [{ data: favProfiles }, { data: favSpecs }] = await Promise.all([
        supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", favUserIds),
        supabase.from("doctor_specialties").select("doctor_id, specialties(name)").in("doctor_id", favDocIds),
      ]);

      return favDocs.map(d => {
        const p = favProfiles?.find(pr => pr.user_id === d.user_id);
        const specs = favSpecs?.filter((s: { doctor_id: string; specialties?: { name?: string } | null }) => s.doctor_id === d.id).map((s: { specialties?: { name?: string } | null }) => s.specialties?.name).filter(Boolean) as string[] ?? [];
        return { ...d, name: p ? `Dr(a). ${p.first_name} ${p.last_name}` : "Médico", specs };
      });
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};
