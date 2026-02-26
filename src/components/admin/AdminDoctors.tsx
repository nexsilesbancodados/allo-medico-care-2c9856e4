import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAdminNav } from "./adminNav";
import { Search, Eye, Edit, Check, X, UserPlus, Mail, Shield, Loader2, Sparkles } from "lucide-react";

const UF_OPTIONS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const AdminDoctors = () => {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ crm: "", crm_state: "", bio: "", consultation_price: "" });

  // Onboard dialog state
  const [showOnboard, setShowOnboard] = useState(false);
  const [onboardForm, setOnboardForm] = useState({ email: "", full_name: "", crm: "", crm_state: "SP", phone: "" });
  const [onboarding, setOnboarding] = useState(false);
  const [onboardResult, setOnboardResult] = useState<any>(null);

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    const { data } = await supabase.from("doctor_profiles")
      .select("id, user_id, crm, crm_state, is_approved, bio, consultation_price, experience_years, education, rating, total_reviews, created_at, crm_verified")
      .order("created_at", { ascending: false });
    if (!data) { setLoading(false); return; }
    const userIds = data.map(d => d.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name, phone").in("user_id", userIds);
    const pMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
    setDoctors(data.map(d => ({ ...d, ...pMap.get(d.user_id) })));
    setLoading(false);
  };

  const toggleApproval = async (id: string, current: boolean) => {
    await supabase.from("doctor_profiles").update({ is_approved: !current }).eq("id", id);
    toast({ title: current ? "Médico desativado" : "Médico aprovado! ✅" });
    fetchDoctors();
  };

  const openDetail = (doc: any) => {
    setSelected(doc);
    setEditForm({ crm: doc.crm, crm_state: doc.crm_state, bio: doc.bio || "", consultation_price: String(doc.consultation_price || "") });
  };

  const saveEdit = async () => {
    if (!selected) return;
    const { error } = await supabase.from("doctor_profiles").update({
      crm: editForm.crm,
      crm_state: editForm.crm_state,
      bio: editForm.bio || null,
      consultation_price: parseFloat(editForm.consultation_price) || null,
    }).eq("id", selected.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Médico atualizado!" });
      setEditing(false); setSelected(null); fetchDoctors();
    }
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboarding(true);
    setOnboardResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("doctor-onboard-automation", {
        body: onboardForm,
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        if (data.details) {
          toast({ title: "Detalhes", description: data.details.join(", "), variant: "destructive" });
        }
      } else {
        setOnboardResult(data);
        toast({ title: "Convite enviado! ✉️", description: `Código ${data.invite_code} enviado para ${onboardForm.email}` });
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Erro ao processar convite", variant: "destructive" });
    }
    setOnboarding(false);
  };

  const resetOnboard = () => {
    setOnboardForm({ email: "", full_name: "", crm: "", crm_state: "SP", phone: "" });
    setOnboardResult(null);
    setShowOnboard(false);
  };

  const filtered = doctors.filter(d => {
    const matchSearch = `${d.first_name} ${d.last_name} ${d.crm}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || (filterStatus === "approved" && d.is_approved) || (filterStatus === "pending" && !d.is_approved);
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("doctors")}>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-foreground">Médicos</h1>
          <Button onClick={() => setShowOnboard(true)} className="bg-gradient-to-r from-secondary to-primary text-primary-foreground shadow-lg">
            <UserPlus className="w-4 h-4 mr-2" />
            Cadastrar Médico
          </Button>
        </div>
        <p className="text-muted-foreground text-sm mb-4">{filtered.length} médico(s)</p>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou CRM..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="approved">Aprovados</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Médico</TableHead>
                  <TableHead>CRM</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{doc.first_name?.[0]}{doc.last_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium text-foreground">Dr(a). {doc.first_name} {doc.last_name}</span>
                          {doc.crm_verified && <Shield className="inline w-3.5 h-3.5 text-success ml-1.5" />}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{doc.crm}/{doc.crm_state}</TableCell>
                    <TableCell className="text-muted-foreground">R$ {doc.consultation_price || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={doc.is_approved ? "default" : "outline"}>{doc.is_approved ? "Aprovado" : "Pendente"}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => openDetail(doc)}><Eye className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleApproval(doc.id, doc.is_approved)}>
                        {doc.is_approved ? <X className="w-4 h-4 text-destructive" /> : <Check className="w-4 h-4 text-secondary" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum médico encontrado.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Detail / Edit Dialog */}
      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setEditing(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Médico" : "Detalhes do Médico"}</DialogTitle></DialogHeader>
          {selected && !editing && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Nome:</span><p className="font-medium text-foreground">Dr(a). {selected.first_name} {selected.last_name}</p></div>
                <div><span className="text-muted-foreground">CRM:</span><p className="font-medium text-foreground">{selected.crm}/{selected.crm_state}</p></div>
                <div><span className="text-muted-foreground">Preço:</span><p className="font-medium text-foreground">R$ {selected.consultation_price || "—"}</p></div>
                <div><span className="text-muted-foreground">Experiência:</span><p className="font-medium text-foreground">{selected.experience_years || 0} anos</p></div>
                <div><span className="text-muted-foreground">Avaliação:</span><p className="font-medium text-foreground">{selected.rating ?? "—"} ({selected.total_reviews} avaliações)</p></div>
                <div><span className="text-muted-foreground">Formação:</span><p className="font-medium text-foreground">{selected.education || "—"}</p></div>
              </div>
              {selected.bio && <div><span className="text-muted-foreground">Bio:</span><p className="text-foreground">{selected.bio}</p></div>}
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Edit className="w-4 h-4 mr-1" /> Editar</Button>
            </div>
          )}
          {selected && editing && (
            <div className="space-y-3">
              <Input placeholder="CRM" value={editForm.crm} onChange={e => setEditForm({ ...editForm, crm: e.target.value })} />
              <Input placeholder="Estado CRM" value={editForm.crm_state} onChange={e => setEditForm({ ...editForm, crm_state: e.target.value })} />
              <Input placeholder="Preço consulta" type="number" value={editForm.consultation_price} onChange={e => setEditForm({ ...editForm, consultation_price: e.target.value })} />
              <Input placeholder="Bio" value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} />
              <div className="flex gap-2">
                <Button onClick={saveEdit} className="bg-gradient-to-r from-secondary to-primary text-primary-foreground">Salvar</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Onboard Doctor Dialog */}
      <Dialog open={showOnboard} onOpenChange={(open) => { if (!open) resetOnboard(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Cadastrar Novo Médico
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do médico. Um código de acesso será gerado e enviado por email automaticamente.
            </DialogDescription>
          </DialogHeader>

          {!onboardResult ? (
            <form onSubmit={handleOnboard} className="space-y-4">
              <div>
                <Label>Nome Completo *</Label>
                <Input
                  value={onboardForm.full_name}
                  onChange={e => setOnboardForm({ ...onboardForm, full_name: e.target.value })}
                  placeholder="Dr(a). Maria Silva"
                  required
                  minLength={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={onboardForm.email}
                  onChange={e => setOnboardForm({ ...onboardForm, email: e.target.value })}
                  placeholder="medico@email.com"
                  required
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>CRM *</Label>
                  <Input
                    value={onboardForm.crm}
                    onChange={e => setOnboardForm({ ...onboardForm, crm: e.target.value.replace(/\D/g, "") })}
                    placeholder="123456"
                    required
                    maxLength={7}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>UF *</Label>
                  <Select value={onboardForm.crm_state} onValueChange={v => setOnboardForm({ ...onboardForm, crm_state: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UF_OPTIONS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={onboardForm.phone}
                  onChange={e => setOnboardForm({ ...onboardForm, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="mt-1"
                />
              </div>

              <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary" /> <strong>O sistema irá automaticamente:</strong></p>
                <ul className="list-disc list-inside space-y-0.5 ml-5">
                  <li>Validar os dados informados</li>
                  <li>Verificar o CRM no Conselho Federal</li>
                  <li>Gerar código de acesso seguro (7 dias)</li>
                  <li>Enviar email com instruções de cadastro</li>
                  <li>Registrar log de auditoria</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-secondary to-primary text-primary-foreground h-11"
                disabled={onboarding}
              >
                {onboarding ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Processando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Gerar Convite e Enviar Email
                  </span>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
                <Check className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="font-bold text-foreground">Convite Enviado com Sucesso!</p>
                <p className="text-sm text-muted-foreground mt-1">Email enviado para <strong>{onboardForm.email}</strong></p>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                <p className="text-xs text-muted-foreground mb-1">Código de Acesso:</p>
                <p className="text-2xl font-bold text-primary font-mono tracking-widest">{onboardResult.invite_code}</p>
                <p className="text-xs text-muted-foreground mt-1">Válido até {new Date(onboardResult.expires_at).toLocaleDateString("pt-BR")}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground text-xs">CRM Verificado</p>
                  <p className="font-semibold text-foreground">{onboardResult.crm_verified ? "✅ Sim" : "⏳ Pendente"}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="font-semibold text-foreground">{onboardResult.email_sent ? "✅ Enviado" : "❌ Falha"}</p>
                </div>
              </div>

              {onboardResult.crm_details?.nome && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p className="text-muted-foreground text-xs mb-1">Dados do CFM:</p>
                  <p className="font-medium text-foreground">{onboardResult.crm_details.nome}</p>
                  <p className="text-muted-foreground">{onboardResult.crm_details.situacao} — {onboardResult.crm_details.especialidade || "Sem especialidade"}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={resetOnboard} variant="outline" className="flex-1">Fechar</Button>
                <Button onClick={() => { setOnboardResult(null); setOnboardForm({ email: "", full_name: "", crm: "", crm_state: "SP", phone: "" }); }} className="flex-1 bg-gradient-to-r from-secondary to-primary text-primary-foreground">
                  <UserPlus className="w-4 h-4 mr-1" /> Novo Convite
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminDoctors;
