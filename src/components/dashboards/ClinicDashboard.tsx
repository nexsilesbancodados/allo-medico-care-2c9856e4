import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Calendar, BarChart3, Settings, User, Plus, Check, X, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const getClinicNav = (active: string) => [
  { label: "Início", href: "/dashboard?role=clinic", icon: <BarChart3 className="w-4 h-4" />, active: active === "home" },
  { label: "Médicos", href: "/dashboard/clinic/doctors", icon: <Users className="w-4 h-4" />, active: active === "doctors" },
  { label: "Perfil", href: "/dashboard/profile", icon: <User className="w-4 h-4" />, active: active === "profile" },
];

const ClinicDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clinicProfile, setClinicProfile] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [monthAppts, setMonthAppts] = useState(0);
  const [todayAppts, setTodayAppts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    // Get clinic profile
    const { data: clinic } = await supabase.from("clinic_profiles")
      .select("*").eq("user_id", user!.id).single();
    
    if (!clinic) { setLoading(false); return; }
    setClinicProfile(clinic);

    // Get affiliated doctors
    const { data: affiliations } = await supabase.from("clinic_affiliations")
      .select("doctor_id, status").eq("clinic_id", clinic.id).eq("status", "active");

    const doctorIds = (affiliations ?? []).map(a => a.doctor_id);

    if (doctorIds.length > 0) {
      const { data: docProfiles } = await supabase.from("doctor_profiles")
        .select("id, user_id, crm, crm_state, rating, consultation_price, is_approved")
        .in("id", doctorIds);

      if (docProfiles && docProfiles.length > 0) {
        const userIds = docProfiles.map(d => d.user_id);
        const [profilesRes, specsRes] = await Promise.all([
          supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds),
          supabase.from("doctor_specialties").select("doctor_id, specialty_id").in("doctor_id", doctorIds),
        ]);
        const specIds = [...new Set((specsRes.data ?? []).map(s => s.specialty_id))];
        const { data: specNames } = specIds.length > 0
          ? await supabase.from("specialties").select("id, name").in("id", specIds)
          : { data: [] };
        const specMap = new Map((specNames ?? []).map(s => [s.id, s.name] as const));
        const pMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) ?? []);

        setDoctors(docProfiles.map(d => {
          const p = pMap.get(d.user_id);
          const specs = (specsRes.data ?? []).filter(s => s.doctor_id === d.id).map(s => specMap.get(s.specialty_id) ?? "");
          return {
            ...d,
            name: p ? `Dr(a). ${p.first_name} ${p.last_name}` : "—",
            specialties: specs,
          };
        }));

        // Month appointments for affiliated doctors
        const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
        const { count } = await supabase.from("appointments")
          .select("id", { count: "exact", head: true })
          .in("doctor_id", doctorIds)
          .gte("scheduled_at", monthStart.toISOString());
        setMonthAppts(count ?? 0);

        // Today appointments
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
        const { data: todayData } = await supabase.from("appointments")
          .select("id, scheduled_at, status, doctor_id, patient_id")
          .in("doctor_id", doctorIds)
          .gte("scheduled_at", todayStart.toISOString())
          .lte("scheduled_at", todayEnd.toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(10);

        if (todayData && todayData.length > 0) {
          const patIds = [...new Set(todayData.map(a => a.patient_id).filter(Boolean))];
          const { data: patProfiles } = patIds.length > 0
            ? await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", patIds)
            : { data: [] };
          const patMap = new Map((patProfiles ?? []).map(p => [p.user_id, `${p.first_name} ${p.last_name}`] as const));
          const docNameMap = new Map(doctors.map(d => [d.id, d.name]));

          setTodayAppts(todayData.map(a => ({
            ...a,
            patient_name: patMap.get(a.patient_id!) ?? "—",
            doctor_name: docNameMap.get(a.doctor_id) ?? "—",
          })));
        }
      }
    }
    setLoading(false);
  };

  const occupancy = doctors.length > 0 ? Math.min(100, Math.round((monthAppts / (doctors.length * 20)) * 100)) : 0;

  const statusLabel: Record<string, string> = {
    scheduled: "Agendada", waiting: "Esperando", in_progress: "Em consulta", completed: "Concluída", cancelled: "Cancelada",
  };

  if (!clinicProfile && !loading) {
    return (
      <DashboardLayout title="Clínica" nav={getClinicNav("home")}>
        <div className="max-w-xl mx-auto text-center py-12">
          <h2 className="text-xl font-bold text-foreground mb-2">Perfil de Clínica não encontrado</h2>
          <p className="text-muted-foreground mb-4">Você precisa cadastrar sua clínica primeiro.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Clínica" nav={getClinicNav("home")}>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-foreground">
            {clinicProfile?.name ?? "Painel da Clínica"}
          </h1>
          {clinicProfile && !clinicProfile.is_approved && (
            <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5">
              ⏳ Aguardando aprovação
            </Badge>
          )}
          {clinicProfile?.is_approved && (
            <Badge variant="default" className="bg-secondary text-secondary-foreground">
              <Check className="w-3 h-3 mr-1" /> Aprovada
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mb-6">Visão geral dos atendimentos</p>

        {/* KPIs */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-border bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Médicos Vinculados</p>
                  <p className="text-3xl font-bold text-foreground">{doctors.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Consultas do Mês</p>
                  <p className="text-3xl font-bold text-foreground">{monthAppts}</p>
                </div>
                <Calendar className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Ocupação</p>
                  <p className="text-3xl font-bold text-foreground">{occupancy}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's appointments */}
        {todayAppts.length > 0 && (
          <Card className="border-border mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" /> Agenda de Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todayAppts.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.patient_name}</p>
                      <p className="text-xs text-muted-foreground">{a.doctor_name} · {format(new Date(a.scheduled_at), "HH:mm", { locale: ptBR })}</p>
                    </div>
                    <Badge variant="outline">{statusLabel[a.status] ?? a.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Doctors list */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Médicos Vinculados</CardTitle>
              <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/clinic/doctors")}>
                <Plus className="w-4 h-4 mr-1" /> Gerenciar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> :
            doctors.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Nenhum médico vinculado ainda.</p>
                <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/clinic/doctors")}>
                  Vincular Médico
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-secondary/10 text-secondary text-xs">
                          {d.name.replace("Dr(a). ", "").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.name}</p>
                        <p className="text-xs text-muted-foreground">
                          CRM {d.crm}/{d.crm_state}
                          {d.specialties.length > 0 && ` · ${d.specialties.join(", ")}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.rating > 0 && (
                        <span className="text-xs text-muted-foreground">⭐ {Number(d.rating).toFixed(1)}</span>
                      )}
                      <Badge variant={d.is_approved ? "default" : "outline"}>
                        {d.is_approved ? "Aprovado" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClinicDashboard;
