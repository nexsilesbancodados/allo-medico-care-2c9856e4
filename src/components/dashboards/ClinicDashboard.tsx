import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar, BarChart3, User, Plus, Check, Clock, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const getClinicNav = (active: string) => [
  { label: "Início", href: "/dashboard?role=clinic", icon: <BarChart3 className="w-4 h-4" />, active: active === "home" },
  { label: "Médicos", href: "/dashboard/clinic/doctors", icon: <Users className="w-4 h-4" />, active: active === "doctors" },
  { label: "Perfil", href: "/dashboard/profile", icon: <User className="w-4 h-4" />, active: active === "profile" },
];

const statusLabel: Record<string, string> = {
  scheduled: "Agendada", waiting: "Esperando", in_progress: "Em consulta",
  completed: "Concluída", cancelled: "Cancelada",
};

const statusColor: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  waiting: "bg-warning/10 text-warning border-warning/20",
  in_progress: "bg-success/10 text-success border-success/20",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

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
    const { data: clinic } = await supabase.from("clinic_profiles").select("*").eq("user_id", user!.id).single();
    if (!clinic) { setLoading(false); return; }
    setClinicProfile(clinic);

    const { data: affiliations } = await supabase.from("clinic_affiliations")
      .select("doctor_id, status").eq("clinic_id", clinic.id).eq("status", "active");
    const doctorIds = (affiliations ?? []).map(a => a.doctor_id);

    if (doctorIds.length > 0) {
      const { data: docProfiles } = await supabase.from("doctor_profiles")
        .select("id, user_id, crm, crm_state, rating, consultation_price, is_approved").in("id", doctorIds);

      if (docProfiles && docProfiles.length > 0) {
        const userIds = docProfiles.map(d => d.user_id);
        const [profilesRes, specsRes] = await Promise.all([
          supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds),
          supabase.from("doctor_specialties").select("doctor_id, specialty_id").in("doctor_id", doctorIds),
        ]);
        const specIds = [...new Set((specsRes.data ?? []).map(s => s.specialty_id))];
        const { data: specNames } = specIds.length > 0
          ? await supabase.from("specialties").select("id, name").in("id", specIds) : { data: [] };
        const specMap = new Map((specNames ?? []).map(s => [s.id, s.name] as const));
        const pMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) ?? []);

        const enrichedDoctors = docProfiles.map(d => {
          const p = pMap.get(d.user_id);
          const specs = (specsRes.data ?? []).filter(s => s.doctor_id === d.id).map(s => specMap.get(s.specialty_id) ?? "");
          return { ...d, name: p ? `Dr(a). ${p.first_name} ${p.last_name}` : "—", specialties: specs };
        });
        setDoctors(enrichedDoctors);

        const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
        const { count } = await supabase.from("appointments")
          .select("id", { count: "exact", head: true }).in("doctor_id", doctorIds)
          .gte("scheduled_at", monthStart.toISOString());
        setMonthAppts(count ?? 0);

        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
        const { data: todayData } = await supabase.from("appointments")
          .select("id, scheduled_at, status, doctor_id, patient_id")
          .in("doctor_id", doctorIds)
          .gte("scheduled_at", todayStart.toISOString())
          .lte("scheduled_at", todayEnd.toISOString())
          .order("scheduled_at", { ascending: true }).limit(10);

        if (todayData && todayData.length > 0) {
          const patIds = [...new Set(todayData.map(a => a.patient_id).filter(Boolean))];
          const { data: patProfiles } = patIds.length > 0
            ? await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", patIds)
            : { data: [] };
          const patMap = new Map((patProfiles ?? []).map(p => [p.user_id, `${p.first_name} ${p.last_name}`] as const));
          const docNameMap = new Map(enrichedDoctors.map(d => [d.id, d.name]));
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

  const exportCSV = () => {
    const rows = [
      ["Horário", "Paciente", "Médico", "Status"],
      ...todayAppts.map(a => [
        format(new Date(a.scheduled_at), "HH:mm"),
        a.patient_name, a.doctor_name,
        statusLabel[a.status] ?? a.status,
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `agenda-clinica-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Agenda exportada!");
  };

  if (!clinicProfile && !loading) {
    return (
      <DashboardLayout title="Clínica" nav={getClinicNav("home")}>
        <div className="max-w-xl mx-auto text-center py-12">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Perfil de Clínica não encontrado</h2>
          <p className="text-muted-foreground mb-4">Você precisa cadastrar sua clínica primeiro.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Clínica" nav={getClinicNav("home")}>
      <div className="max-w-4xl space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            {loading ? (
              <Skeleton className="h-8 w-48 mb-1" />
            ) : (
              <h1 className="text-2xl font-bold text-foreground">{clinicProfile?.name ?? "Painel da Clínica"}</h1>
            )}
            <p className="text-sm text-muted-foreground mt-0.5">Visão geral dos atendimentos</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!loading && clinicProfile && !clinicProfile.is_approved && (
              <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5 text-xs">
                ⏳ Aguardando aprovação
              </Badge>
            )}
            {!loading && clinicProfile?.is_approved && (
              <Badge className="bg-success/10 text-success border border-success/30 text-xs">
                <Check className="w-3 h-3 mr-1" /> Aprovada
              </Badge>
            )}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {loading ? (
            [1, 2, 3].map(i => (
              <Card key={i} className="border-border">
                <CardContent className="pt-6 space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-9 w-12" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card className="border-border bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Médicos Vinculados</p>
                      <p className="text-3xl font-bold text-foreground">{doctors.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
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
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Taxa de Ocupação</p>
                  <p className="text-3xl font-bold text-foreground mb-2">{occupancy}%</p>
                  <Progress value={occupancy} className="h-1.5" />
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Today's appointments */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Agenda de Hoje
                {!loading && todayAppts.length > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">({todayAppts.length})</span>
                )}
              </CardTitle>
              {todayAppts.length > 0 && (
                <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={exportCSV}>
                  <Download className="w-3 h-3" /> CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-border">
                    <Skeleton className="h-10 w-14 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : todayAppts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">Nenhuma consulta agendada para hoje</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayAppts.map(a => (
                  <div key={a.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    a.status === "in_progress" ? "border-success/30 bg-success/5"
                    : a.status === "waiting" ? "border-warning/30 bg-warning/5"
                    : "border-border hover:bg-muted/30"
                  }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-[44px] text-center p-1 rounded-lg bg-muted/60">
                        <p className="text-sm font-bold text-foreground">{format(new Date(a.scheduled_at), "HH:mm")}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{a.patient_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.doctor_name}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${statusColor[a.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                      {statusLabel[a.status] ?? a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctors list */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Médicos Vinculados</CardTitle>
              <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/clinic/doctors")}>
                <Plus className="w-4 h-4 mr-1" /> Gerenciar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Users className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Nenhum médico vinculado</p>
                <p className="text-xs text-muted-foreground mb-4">Vincule médicos para começar a gerenciar agendamentos</p>
                <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/clinic/doctors")}>
                  Vincular Médico
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {doctors.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {d.name.replace("Dr(a). ", "").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          CRM {d.crm}/{d.crm_state}
                          {d.specialties.length > 0 && ` · ${d.specialties.slice(0, 2).join(", ")}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {d.rating > 0 && (
                        <span className="text-xs text-muted-foreground hidden sm:block">⭐ {Number(d.rating).toFixed(1)}</span>
                      )}
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${d.is_approved ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}`}>
                        {d.is_approved ? "Aprovado" : "Pendente"}
                      </span>
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
