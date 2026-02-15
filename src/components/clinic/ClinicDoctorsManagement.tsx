import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, BarChart3, Settings, Plus, Check, X, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const nav = [
  { label: "Início", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" />, active: true },
  { label: "Médicos", href: "/dashboard/clinic/doctors", icon: <Users className="w-4 h-4" /> },
  { label: "Consultas", href: "/dashboard/appointments", icon: <Calendar className="w-4 h-4" /> },
  { label: "Configurações", href: "/dashboard/settings", icon: <Settings className="w-4 h-4" /> },
];

interface ClinicDoctor {
  affiliation_id: string;
  doctor_id: string;
  status: string;
  first_name: string;
  last_name: string;
  crm: string;
  crm_state: string;
  specialties: string[];
}

const ClinicDoctorsManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clinicProfileId, setClinicProfileId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<ClinicDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCrm, setSearchCrm] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => { if (user) fetchClinicProfile(); }, [user]);

  const fetchClinicProfile = async () => {
    const { data } = await supabase
      .from("clinic_profiles")
      .select("id")
      .eq("user_id", user!.id)
      .single();

    if (data) {
      setClinicProfileId(data.id);
      fetchDoctors(data.id);
    }
    setLoading(false);
  };

  const fetchDoctors = async (clinicId: string) => {
    const { data: affiliations } = await supabase
      .from("clinic_affiliations")
      .select("id, doctor_id, status")
      .eq("clinic_id", clinicId);

    if (!affiliations || affiliations.length === 0) {
      setDoctors([]);
      return;
    }

    const doctorIds = affiliations.map(a => a.doctor_id);
    const { data: docProfiles } = await supabase
      .from("doctor_profiles")
      .select("id, user_id, crm, crm_state")
      .in("id", doctorIds);

    const userIds = docProfiles?.map(d => d.user_id) ?? [];
    const [profilesRes, specsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds),
      supabase.from("doctor_specialties").select("doctor_id, specialties(name)").in("doctor_id", doctorIds),
    ]);

    const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) ?? []);
    const specMap = new Map<string, string[]>();
    specsRes.data?.forEach((s: any) => {
      const arr = specMap.get(s.doctor_id) ?? [];
      arr.push(s.specialties?.name ?? "");
      specMap.set(s.doctor_id, arr);
    });

    const results: ClinicDoctor[] = affiliations.map(a => {
      const doc = docProfiles?.find(d => d.id === a.doctor_id);
      const profile = doc ? profileMap.get(doc.user_id) : null;
      return {
        affiliation_id: a.id,
        doctor_id: a.doctor_id,
        status: a.status,
        first_name: profile?.first_name ?? "",
        last_name: profile?.last_name ?? "",
        crm: doc?.crm ?? "",
        crm_state: doc?.crm_state ?? "",
        specialties: specMap.get(a.doctor_id) ?? [],
      };
    });

    setDoctors(results);
  };

  const searchDoctor = async () => {
    if (!searchCrm.trim()) return;
    setSearching(true);
    setSearchResult(null);

    const { data } = await supabase
      .from("doctor_profiles")
      .select("id, user_id, crm, crm_state")
      .eq("crm", searchCrm.trim())
      .single();

    if (!data) {
      toast({ title: "Médico não encontrado", description: "Verifique o CRM informado.", variant: "destructive" });
      setSearching(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("user_id", data.user_id)
      .single();

    setSearchResult({
      ...data,
      first_name: profile?.first_name ?? "",
      last_name: profile?.last_name ?? "",
    });
    setSearching(false);
  };

  const addDoctor = async () => {
    if (!clinicProfileId || !searchResult) return;

    const { error } = await supabase.from("clinic_affiliations").insert({
      clinic_id: clinicProfileId,
      doctor_id: searchResult.id,
      status: "pending",
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Convite enviado!" });
      setDialogOpen(false);
      setSearchCrm("");
      setSearchResult(null);
      fetchDoctors(clinicProfileId);
    }
  };

  const updateStatus = async (affiliationId: string, status: string) => {
    await supabase.from("clinic_affiliations").update({ status }).eq("id", affiliationId);
    if (clinicProfileId) fetchDoctors(clinicProfileId);
  };

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pendente", variant: "outline" },
    active: { label: "Ativo", variant: "default" },
    inactive: { label: "Inativo", variant: "destructive" },
  };

  return (
    <DashboardLayout title="Clínica" nav={nav.map(n => ({ ...n, active: n.href === "/dashboard/clinic/doctors" }))}>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Médicos Vinculados</h1>
            <p className="text-muted-foreground">Gerencie os médicos da sua clínica</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-hero text-primary-foreground">
                <Plus className="w-4 h-4 mr-1" /> Adicionar Médico
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Médico</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por CRM..."
                    value={searchCrm}
                    onChange={e => setSearchCrm(e.target.value)}
                  />
                  <Button onClick={searchDoctor} disabled={searching}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {searchResult && (
                  <Card className="border-border">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          Dr(a). {searchResult.first_name} {searchResult.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          CRM {searchResult.crm}/{searchResult.crm_state}
                        </p>
                      </div>
                      <Button onClick={addDoctor} size="sm" className="bg-gradient-hero text-primary-foreground">
                        <Plus className="w-4 h-4 mr-1" /> Vincular
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : doctors.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-8 text-center">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhum médico vinculado ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {doctors.map(doc => (
              <Card key={doc.affiliation_id} className="border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {doc.first_name[0]}{doc.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Dr(a). {doc.first_name} {doc.last_name}</p>
                    <p className="text-xs text-muted-foreground">CRM {doc.crm}/{doc.crm_state}</p>
                    {doc.specialties.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {doc.specialties.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusConfig[doc.status]?.variant ?? "outline"}>
                      {statusConfig[doc.status]?.label ?? doc.status}
                    </Badge>
                    {doc.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(doc.affiliation_id, "active")}>
                        <Check className="w-4 h-4 text-secondary" />
                      </Button>
                    )}
                    {doc.status === "active" && (
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(doc.affiliation_id, "inactive")}>
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClinicDoctorsManagement;
