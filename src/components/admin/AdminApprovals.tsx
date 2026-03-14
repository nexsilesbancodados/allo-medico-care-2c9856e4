import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { notifyDoctorApproval, notifyClinicApproval } from "@/lib/notifications";
import { logError } from "@/lib/logger";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getAdminNav } from "./adminNav";
import { Check, X, Clock, UserCheck, Building2, Handshake, ExternalLink, ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { ApprovalItem } from "@/types/domain";

const AdminApprovals = () => {
  
  /* eslint-disable @typescript-eslint/no-explicit-any -- Admin approval items have varying shapes across entity types */
  const [pendingDoctors, setPendingDoctors] = useState<ApprovalItem[]>([]);
  const [approvedDoctors, setApprovedDoctors] = useState<ApprovalItem[]>([]);
  const [pendingClinics, setPendingClinics] = useState<ApprovalItem[]>([]);
  const [approvedClinics, setApprovedClinics] = useState<ApprovalItem[]>([]);
  const [pendingPartners, setPendingPartners] = useState<ApprovalItem[]>([]);
  const [approvedPartners, setApprovedPartners] = useState<ApprovalItem[]>([]);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; type: "doctor" | "clinic" | "partner"; name: string; email?: string } | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    await Promise.all([fetchDoctors(), fetchClinics(), fetchPartners()]);
    setLoading(false);
  };

  const fetchDoctors = async () => {
    const { data } = await supabase.from("doctor_profiles")
      .select("id, user_id, crm, crm_state, is_approved, crm_verified, crm_verified_at, bio, consultation_price, experience_years, education, created_at")
      .order("created_at", { ascending: false });
    if (!data) return;
    const userIds = data.map(d => d.user_id);
    const [profilesRes, specsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, first_name, last_name, phone, cpf").in("user_id", userIds),
      supabase.from("doctor_specialties").select("doctor_id, specialty_id").in("doctor_id", data.map(d => d.id)),
    ]);
    const specIds = [...new Set((specsRes.data ?? []).map(s => s.specialty_id))];
    const { data: specNames } = specIds.length > 0 ? await supabase.from("specialties").select("id, name").in("id", specIds) : { data: [] };
    const specMap = new Map((specNames ?? []).map(s => [s.id, s.name] as const));
    const pMap = new Map(profilesRes.data?.map(p => [p.user_id, p] as const) ?? []);
    const enriched = data.map(d => {
      const profile = pMap.get(d.user_id);
      const doctorSpecs = (specsRes.data ?? []).filter(s => s.doctor_id === d.id).map(s => specMap.get(s.specialty_id) ?? "—");
      return { ...d, first_name: profile?.first_name ?? "", last_name: profile?.last_name ?? "", phone: profile?.phone ?? "", cpf: profile?.cpf ?? "", specialties: doctorSpecs };
    });
    setPendingDoctors(enriched.filter(d => !d.is_approved));
    setApprovedDoctors(enriched.filter(d => d.is_approved));
  };

  const fetchClinics = async () => {
    const { data } = await supabase.from("clinic_profiles").select("*").order("created_at", { ascending: false });
    if (!data) return;
    const userIds = data.map(c => c.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);
    const pMap = new Map(profiles?.map(p => [p.user_id, p] as const) ?? []);
    const enriched = data.map(c => ({ ...c, owner_name: pMap.has(c.user_id) ? `${pMap.get(c.user_id)!.first_name} ${pMap.get(c.user_id)!.last_name}` : "—" }));
    setPendingClinics(enriched.filter(c => !c.is_approved));
    setApprovedClinics(enriched.filter(c => c.is_approved));
  };

  const fetchPartners = async () => {
    const { data } = await supabase.from("partner_profiles").select("*").order("created_at", { ascending: false });
    if (!data) return;
    const userIds = data.map(p => p.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);
    const pMap = new Map(profiles?.map(p => [p.user_id, p] as const) ?? []);
    const enriched = data.map(p => ({ ...p, owner_name: pMap.has(p.user_id) ? `${pMap.get(p.user_id)!.first_name} ${pMap.get(p.user_id)!.last_name}` : "—" }));
    setPendingPartners(enriched.filter(p => !p.is_approved));
    setApprovedPartners(enriched.filter(p => p.is_approved));
  };


  const approve = async (id: string, type: "doctor" | "clinic" | "partner") => {
    const table = type === "doctor" ? "doctor_profiles" : type === "clinic" ? "clinic_profiles" : "partner_profiles";
    await supabase.from(table).update({ is_approved: true }).eq("id", id);

    if (type === "doctor") {
      const doc = [...pendingDoctors, ...approvedDoctors].find(d => d.id === id);
      if (doc) {
        notifyDoctorApproval(doc.user_id, `${doc.first_name} ${doc.last_name}`, true).catch(err => logError("notifyDoctorApproval failed", err));
      }
    } else if (type === "clinic") {
      const clinic = [...pendingClinics, ...approvedClinics].find(c => c.id === id);
      if (clinic) {
        notifyClinicApproval(clinic.user_id, clinic.name, true).catch(err => logError("notifyClinicApproval failed", err));
      }
    }

    toast.success(`${type === "doctor" ? "Médico" : type === "clinic" ? "Clínica" : "Parceiro"} aprovado! ✅`);
    fetchAll();
  };

  const toggleCrmVerified = async (id: string, currentValue: boolean) => {
    const updateData = { 
      crm_verified: !currentValue,
      crm_verified_at: !currentValue ? new Date().toISOString() : null,
    };
    await supabase.from("doctor_profiles").update(updateData).eq("id", id);
    toast.success(!currentValue ? "CRM verificado ✅" : "Verificação de CRM removida");
    fetchAll();
  };

  const [verifyingCrmId, setVerifyingCrmId] = useState<string | null>(null);

  const autoVerifyCrm = useCallback(async (item: ApprovalItem) => {
    setVerifyingCrmId(item.id);
    try {
      const { data, error } = await supabase.functions.invoke("verify-crm", {
        body: { crm: item.crm, uf: item.crm_state, doctor_profile_id: item.id },
      });
      if (error) throw error;
      if (data?.valid) {
        toast.success("✅ CRM verificado automaticamente!", { description: `${data.doctor?.nome} — ${data.doctor?.situacao}` });
      } else {
        toast.error("⚠️ Verificação falhou", { description: data?.message || "CRM não encontrado ou irregular" });
      }
      fetchAll();
    } catch (e: unknown) {
      toast.error("Erro na verificação", { description: e instanceof Error ? e.message : "Erro desconhecido" });
    } finally {
      setVerifyingCrmId(null);
    }
  }, [toast]);

  const reject = async () => {
    if (!rejectTarget) return;
    
    const table = rejectTarget.type === "doctor" ? "doctor_profiles" : rejectTarget.type === "clinic" ? "clinic_profiles" : "partner_profiles";
    await supabase.from(table).update({ is_approved: false }).eq("id", rejectTarget.id);

    if (rejectTarget.type === "doctor") {
      const doc = [...pendingDoctors, ...approvedDoctors].find(d => d.id === rejectTarget.id);
      if (doc) {
        notifyDoctorApproval(doc.user_id, `${doc.first_name} ${doc.last_name}`, false, rejectReason).catch(err => logError("notifyDoctorApproval reject failed", err));
      }
    } else if (rejectTarget.type === "clinic") {
      const clinic = [...pendingClinics, ...approvedClinics].find(c => c.id === rejectTarget.id);
      if (clinic) {
        notifyClinicApproval(clinic.user_id, clinic.name, false, rejectReason).catch(err => logError("notifyClinicApproval reject failed", err));
      }
    }
    
    toast.success("Cadastro rejeitado", { description: rejectReason || undefined });
    setShowReject(false);
    setRejectReason("");
    setRejectTarget(null);
    fetchAll();
  };

  const totalPending = pendingDoctors.length + pendingClinics.length + pendingPartners.length;
  const partnerTypeLabel: Record<string, string> = { pharmacy: "Farmácia", laboratory: "Laboratório", clinic: "Clínica", other: "Outro" };

  const renderApprovalCard = (item: ApprovalItem, type: "doctor" | "clinic" | "partner", isApproved: boolean) => (
    <Card key={item.id} className="border-border hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 mt-1">
              <AvatarFallback className="bg-primary/10 text-primary">
                {type === "doctor" ? `${item.first_name?.[0] ?? ""}${item.last_name?.[0] ?? ""}` :
                  type === "clinic" ? item.name?.[0] ?? "C" : 
                  type === "affiliate" ? `${item.first_name?.[0] ?? ""}${item.last_name?.[0] ?? ""}` :
                  item.business_name?.[0] ?? "P"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              {type === "doctor" && (
                <>
                  <p className="font-semibold text-foreground text-lg">Dr(a). {item.first_name} {item.last_name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>CRM: <strong className="text-foreground">{item.crm}/{item.crm_state}</strong></span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-primary hover:text-primary"
                      onClick={() => window.open(`https://portal.cfm.org.br/busca-medicos/?crm=${encodeURIComponent(item.crm)}&uf=${encodeURIComponent(item.crm_state)}`, "_blank")}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" /> Validar no CFM
                    </Button>
                    {!item.crm_verified && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs text-secondary border-secondary/30 hover:bg-secondary/10"
                        disabled={verifyingCrmId === item.id}
                        onClick={() => autoVerifyCrm(item)}
                      >
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        {verifyingCrmId === item.id ? "Verificando..." : "Auto-verificar"}
                      </Button>
                    )}
                    <span>· Tel: {item.phone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Checkbox
                      id={`crm-verified-${item.id}`}
                      checked={!!item.crm_verified}
                      onCheckedChange={() => toggleCrmVerified(item.id, !!item.crm_verified)}
                    />
                    <label htmlFor={`crm-verified-${item.id}`} className="text-sm cursor-pointer flex items-center gap-1">
                      {item.crm_verified ? (
                        <span className="text-secondary font-medium flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> CRM Verificado</span>
                      ) : (
                        <span className="text-muted-foreground">CRM não verificado</span>
                      )}
                    </label>
                    {item.crm_verified_at && <span className="text-xs text-muted-foreground">({new Date(item.crm_verified_at).toLocaleDateString("pt-BR")})</span>}
                  </div>
                  {item.specialties?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.specialties.map((s: string, i: number) => <Badge key={i} variant="outline" className="text-xs bg-secondary/10 text-secondary">{s}</Badge>)}
                    </div>
                  )}
                  {item.education && <p className="text-xs text-muted-foreground">Formação: {item.education}</p>}
                </>
              )}
              {type === "clinic" && (
                <>
                  <p className="font-semibold text-foreground text-lg">{item.name}</p>
                  <p className="text-sm text-muted-foreground">CNPJ: {item.cnpj || "—"} · Responsável: {item.owner_name}</p>
                  {item.address && <p className="text-xs text-muted-foreground">Endereço: {item.address}</p>}
                </>
              )}
              {type === "partner" && (
                <>
                  <p className="font-semibold text-foreground text-lg">{item.business_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Tipo: <Badge variant="outline" className="text-xs">{partnerTypeLabel[item.partner_type] ?? item.partner_type}</Badge>
                    {" · "}CNPJ: {item.cnpj || "—"} · Responsável: {item.owner_name}
                  </p>
                </>
              )}
              {type === "affiliate" && (
                <>
                  <p className="font-semibold text-foreground text-lg">{item.first_name} {item.last_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Comissão: <Badge variant="outline" className="text-xs">{item.commission_percent}%</Badge>
                    {item.pix_key && <> · PIX: {item.pix_key}</>}
                  </p>
                </>
              )}
              <p className="text-xs text-muted-foreground">Cadastro: {new Date(item.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            {!isApproved ? (
              <>
                <Button size="sm" onClick={() => type === "affiliate" ? approveAffiliate(item) : approve(item.id, type)} className="bg-secondary text-secondary-foreground">
                  <Check className="w-4 h-4 mr-1" /> Aprovar
                </Button>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => { 
                  setRejectTarget({ 
                    id: item.id, 
                    type, 
                    name: type === "doctor" ? `${item.first_name} ${item.last_name}` : type === "affiliate" ? `${item.first_name} ${item.last_name}` : item.name || item.business_name 
                  }); 
                  setShowReject(true); 
                }}>
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
  );

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("approvals")}>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <UserCheck className="w-6 h-6" /> Aprovações
            </h1>
            <p className="text-muted-foreground text-sm">{totalPending} pedido(s) pendente(s)</p>
          </div>
        </div>

        <Tabs defaultValue="doctors">
          <TabsList>
            <TabsTrigger value="doctors" className="gap-1">
              🩺 Médicos
              {pendingDoctors.length > 0 && <Badge variant="destructive" className="ml-1 text-xs h-5 w-5 p-0 flex items-center justify-center">{pendingDoctors.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="clinics" className="gap-1">
              <Building2 className="w-4 h-4 mr-1" /> Clínicas
              {pendingClinics.length > 0 && <Badge variant="destructive" className="ml-1 text-xs h-5 w-5 p-0 flex items-center justify-center">{pendingClinics.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="partners" className="gap-1">
              <Handshake className="w-4 h-4 mr-1" /> Parceiros
              {pendingPartners.length > 0 && <Badge variant="destructive" className="ml-1 text-xs h-5 w-5 p-0 flex items-center justify-center">{pendingPartners.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="affiliates" className="gap-1">
              <Megaphone className="w-4 h-4 mr-1" /> Afiliados
              {pendingAffiliates.length > 0 && <Badge variant="destructive" className="ml-1 text-xs h-5 w-5 p-0 flex items-center justify-center">{pendingAffiliates.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {loading ? <p className="text-sm text-muted-foreground mt-4">Carregando...</p> : (
            <>
              <TabsContent value="doctors" className="mt-4 space-y-4">
                {pendingDoctors.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Clock className="w-4 h-4" /> Pendentes</h3>
                    {pendingDoctors.map(d => renderApprovalCard(d, "doctor", false))}
                  </>
                )}
                {approvedDoctors.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1 mt-6"><Check className="w-4 h-4" /> Aprovados ({approvedDoctors.length})</h3>
                    {approvedDoctors.map(d => renderApprovalCard(d, "doctor", true))}
                  </>
                )}
                {pendingDoctors.length === 0 && approvedDoctors.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">Nenhum médico cadastrado.</p>
                )}
              </TabsContent>

              <TabsContent value="clinics" className="mt-4 space-y-4">
                {pendingClinics.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Clock className="w-4 h-4" /> Pendentes</h3>
                    {pendingClinics.map(c => renderApprovalCard(c, "clinic", false))}
                  </>
                )}
                {approvedClinics.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1 mt-6"><Check className="w-4 h-4" /> Aprovadas ({approvedClinics.length})</h3>
                    {approvedClinics.map(c => renderApprovalCard(c, "clinic", true))}
                  </>
                )}
                {pendingClinics.length === 0 && approvedClinics.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">Nenhuma clínica cadastrada.</p>
                )}
              </TabsContent>

              <TabsContent value="partners" className="mt-4 space-y-4">
                {pendingPartners.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Clock className="w-4 h-4" /> Pendentes</h3>
                    {pendingPartners.map(p => renderApprovalCard(p, "partner", false))}
                  </>
                )}
                {approvedPartners.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1 mt-6"><Check className="w-4 h-4" /> Aprovados ({approvedPartners.length})</h3>
                    {approvedPartners.map(p => renderApprovalCard(p, "partner", true))}
                  </>
                )}
                {pendingPartners.length === 0 && approvedPartners.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">Nenhum parceiro cadastrado.</p>
                )}
              </TabsContent>

              <TabsContent value="affiliates" className="mt-4 space-y-4">
                {pendingAffiliates.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Clock className="w-4 h-4" /> Pendentes</h3>
                    {pendingAffiliates.map(a => renderApprovalCard(a, "affiliate", false))}
                  </>
                )}
                {approvedAffiliates.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1 mt-6"><Check className="w-4 h-4" /> Aprovados ({approvedAffiliates.length})</h3>
                    {approvedAffiliates.map(a => renderApprovalCard(a, "affiliate", true))}
                  </>
                )}
                {pendingAffiliates.length === 0 && approvedAffiliates.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">Nenhum afiliado cadastrado.</p>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <Dialog open={showReject} onOpenChange={() => { setShowReject(false); setRejectTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar Cadastro</DialogTitle>
          </DialogHeader>
          {rejectTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Rejeitar o cadastro de <strong className="text-foreground">{rejectTarget.name}</strong>?
              </p>
              <Textarea placeholder="Motivo da rejeição (opcional)..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} />
              <div className="flex gap-2">
                <Button variant="destructive" onClick={reject}>Confirmar Rejeição</Button>
                <Button variant="outline" onClick={() => { setShowReject(false); setRejectTarget(null); }}>Cancelar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminApprovals;
