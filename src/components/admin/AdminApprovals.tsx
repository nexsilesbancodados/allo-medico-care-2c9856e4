import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getAdminNav } from "./adminNav";
import { Check, X, Eye, Clock, UserCheck } from "lucide-react";

const AdminApprovals = () => {
  const { toast } = useToast();
  const [pending, setPending] = useState<any[]>([]);
  const [approved, setApproved] = useState<any[]>([]);
  const [rejected, setRejected] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase.from("doctor_profiles")
      .select("id, user_id, crm, crm_state, is_approved, bio, consultation_price, experience_years, education, created_at")
      .order("created_at", { ascending: false });
    if (!data) { setLoading(false); return; }

    const userIds = data.map(d => d.user_id);
    const [profilesRes, specsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, first_name, last_name, phone, cpf").in("user_id", userIds),
      supabase.from("doctor_specialties").select("doctor_id, specialty_id").in("doctor_id", data.map(d => d.id)),
    ]);

    const specDoctorIds = [...new Set((specsRes.data ?? []).map(s => s.specialty_id))];
    const { data: specNames } = await supabase.from("specialties").select("id, name").in("id", specDoctorIds.length > 0 ? specDoctorIds : ["none"]);
    const specMap = new Map(specNames?.map(s => [s.id, s.name]) ?? []);

    const pMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) ?? []);

    const enriched = data.map(d => {
      const profile = pMap.get(d.user_id);
      const doctorSpecs = (specsRes.data ?? []).filter(s => s.doctor_id === d.id).map(s => specMap.get(s.specialty_id) ?? "—");
      return {
        ...d,
        first_name: profile?.first_name ?? "",
        last_name: profile?.last_name ?? "",
        phone: profile?.phone ?? "",
        cpf: profile?.cpf ?? "",
        specialties: doctorSpecs,
      };
    });

    setPending(enriched.filter(d => !d.is_approved));
    setApproved(enriched.filter(d => d.is_approved));
    setLoading(false);
  };

  const approveDoctor = async (id: string) => {
    await supabase.from("doctor_profiles").update({ is_approved: true }).eq("id", id);
    toast({ title: "Médico aprovado! ✅" });
    fetchAll();
  };

  const rejectDoctor = async (id: string) => {
    // For now, just keep as not approved. Could delete or flag.
    await supabase.from("doctor_profiles").update({ is_approved: false }).eq("id", id);
    toast({ title: "Cadastro rejeitado", description: rejectReason || undefined });
    setShowReject(false);
    setRejectReason("");
    setSelected(null);
    fetchAll();
  };

  const currentList = tab === "pending" ? pending : approved;

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("approvals")}>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <UserCheck className="w-6 h-6" /> Aprovações de Médicos
            </h1>
            <p className="text-muted-foreground text-sm">
              {pending.length} pedido(s) pendente(s)
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={tab === "pending" ? "default" : "outline"}
            onClick={() => setTab("pending")}
            className={tab === "pending" ? "bg-gradient-hero text-primary-foreground" : ""}
          >
            <Clock className="w-4 h-4 mr-1" /> Pendentes
            {pending.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">{pending.length}</Badge>
            )}
          </Button>
          <Button
            variant={tab === "approved" ? "default" : "outline"}
            onClick={() => setTab("approved")}
          >
            <Check className="w-4 h-4 mr-1" /> Aprovados ({approved.length})
          </Button>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
          <>
            {currentList.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {tab === "pending" ? "Nenhum pedido pendente. 🎉" : "Nenhum médico aprovado ainda."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {currentList.map(doc => (
                  <Card key={doc.id} className="border-border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12 mt-1">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {doc.first_name?.[0]}{doc.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground text-lg">
                              Dr(a). {doc.first_name} {doc.last_name}
                            </p>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <span>CRM: <strong className="text-foreground">{doc.crm}/{doc.crm_state}</strong></span>
                              <span>·</span>
                              <span>Telefone: {doc.phone || "—"}</span>
                              <span>·</span>
                              <span>CPF: {doc.cpf || "—"}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <span>Experiência: {doc.experience_years || 0} anos</span>
                              <span>·</span>
                              <span>Preço: R$ {doc.consultation_price || "—"}</span>
                            </div>
                            {doc.specialties.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {doc.specialties.map((s: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs bg-secondary/10 text-secondary">
                                    {s}
                                  </Badge>
                                ))
                                }
                              </div>
                            )}
                            {doc.education && (
                              <p className="text-xs text-muted-foreground mt-1">Formação: {doc.education}</p>
                            )}
                            {doc.bio && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Bio: {doc.bio}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Cadastro: {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          {tab === "pending" ? (
                            <>
                              <Button size="sm" onClick={() => approveDoctor(doc.id)} className="bg-secondary text-secondary-foreground">
                                <Check className="w-4 h-4 mr-1" /> Aprovar
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => { setSelected(doc); setShowReject(true); }}>
                                <X className="w-4 h-4 mr-1" /> Rejeitar
                              </Button>
                            </>
                          ) : (
                            <Badge variant="default" className="bg-secondary text-secondary-foreground">
                              <Check className="w-3 h-3 mr-1" /> Aprovado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
                }
              </div>
            )}
          </>
        )}
      </div>

      {/* Reject dialog */}
      <Dialog open={showReject} onOpenChange={() => { setShowReject(false); setSelected(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar Cadastro</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Rejeitar o cadastro de <strong className="text-foreground">Dr(a). {selected.first_name} {selected.last_name}</strong> (CRM {selected.crm}/{selected.crm_state})?
              </p>
              <Textarea
                placeholder="Motivo da rejeição (opcional)..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button variant="destructive" onClick={() => rejectDoctor(selected.id)}>
                  Confirmar Rejeição
                </Button>
                <Button variant="outline" onClick={() => { setShowReject(false); setSelected(null); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminApprovals;
