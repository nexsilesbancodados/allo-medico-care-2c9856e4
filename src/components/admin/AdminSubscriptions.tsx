import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getAdminNav } from "./adminNav";
import { Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { SubscriptionRow } from "@/types/domain";

const statusLabel: Record<string, string> = { active: "Ativa", cancelled: "Cancelada", expired: "Expirada", paused: "Pausada" };
const statusVariant: Record<string, "default" | "destructive" | "outline"> = { active: "default", cancelled: "destructive", expired: "outline", paused: "outline" };

const AdminSubscriptions = () => {
  
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [allUsers, setAllUsers] = useState<{ id: string; first_name: string; last_name: string; email?: string }[]>([]);
  const [form, setForm] = useState({ user_id: "", plan_id: "", status: "active", notes: "" });
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [subsRes, plansRes] = await Promise.all([
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("plans").select("id, name, price, interval"),
    ]);
    setPlans(plansRes.data ?? []);

    const subsData = subsRes.data ?? [];
    if (subsData.length === 0) { setSubs([]); setLoading(false); return; }

    const userIds = [...new Set(subsData.map(s => s.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);
    const pMap = new Map(profiles?.map(p => [p.user_id, `${p.first_name} ${p.last_name}`]) ?? []);
    const planMap = new Map(plansRes.data?.map(p => [p.id, p.name]) ?? []);

    setSubs(subsData.map(s => ({ ...s, user_name: pMap.get(s.user_id) ?? "—", plan_name: planMap.get(s.plan_id) ?? "—" })));
    setLoading(false);
  };

  const openCreateForm = async () => {
    const { data } = await supabase.from("profiles").select("user_id, first_name, last_name").order("first_name");
    setAllUsers(data ?? []);
    setForm({ user_id: "", plan_id: "", status: "active", notes: "" });
    setUserSearch("");
    setShowForm(true);
  };

  const createSubscription = async () => {
    if (!form.plan_id || !form.user_id) {
      toast.error("Selecione um usuário e um plano");
      return;
    }
    const plan = plans.find(p => p.id === form.plan_id);
    const expiresAt = new Date();
    if (plan?.interval === "monthly") expiresAt.setMonth(expiresAt.getMonth() + 1);
    else if (plan?.interval === "yearly") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { error } = await supabase.from("subscriptions").insert({
      user_id: form.user_id,
      plan_id: form.plan_id,
      status: form.status,
      notes: form.notes || null,
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });
    if (error) {
      toast.error("Erro ao criar assinatura", { description: error.message });
    } else {
      toast.success("Assinatura criada com sucesso! ✅");
      setShowForm(false);
      fetchData();
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const payload: Record<string, string | number | null | undefined> = { status: newStatus };
    if (newStatus === "cancelled") payload.cancelled_at = new Date().toISOString();
    await supabase.from("subscriptions").update(payload).eq("id", id);
    toast.success("Status atualizado!");
    fetchData();
  };

  const deleteSub = async (id: string) => {
    await supabase.from("subscriptions").delete().eq("id", id);
    toast.success("Assinatura removida");
    fetchData();
  };

  const filtered = subs.filter(s => {
    const matchSearch = `${s.user_name} ${s.plan_name}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const filteredUsers = allUsers.filter(u =>
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("subscriptions")}>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assinaturas</h1>
            <p className="text-muted-foreground text-sm">{filtered.length} assinatura(s)</p>
          </div>
          <Button onClick={openCreateForm} className="bg-gradient-hero text-primary-foreground">
            <Plus className="w-4 h-4 mr-1" /> Nova Assinatura
          </Button>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou plano..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativa</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
              <SelectItem value="expired">Expirada</SelectItem>
              <SelectItem value="paused">Pausada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Expiração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-foreground">{s.user_name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.plan_name}</TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(s.starts_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell className="text-muted-foreground">{s.expires_at ? format(new Date(s.expires_at), "dd/MM/yyyy", { locale: ptBR }) : "—"}</TableCell>
                    <TableCell><Badge variant={statusVariant[s.status] ?? "outline"}>{statusLabel[s.status] ?? s.status}</Badge></TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-1">
                      <Select value={s.status} onValueChange={v => updateStatus(s.id, v)}>
                        <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativa</SelectItem>
                          <SelectItem value="paused">Pausada</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                          <SelectItem value="expired">Expirada</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteSub(s.id)}>✕</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma assinatura.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Assinatura</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Usuário</label>
              <Input placeholder="Buscar usuário..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="mb-2" />
              <div className="max-h-32 overflow-y-auto border border-border rounded-lg">
                {filteredUsers.slice(0, 20).map(u => (
                  <button
                    key={u.user_id}
                    onClick={() => { setForm({ ...form, user_id: u.user_id }); setUserSearch(`${u.first_name} ${u.last_name}`); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${form.user_id === u.user_id ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                  >
                    {u.first_name} {u.last_name}
                  </button>
                ))}
                {filteredUsers.length === 0 && <p className="text-xs text-muted-foreground p-3">Nenhum usuário encontrado.</p>}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Plano</label>
              <Select value={form.plan_id} onValueChange={v => setForm({ ...form, plan_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — R$ {Number(p.price).toFixed(2)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Observações (opcional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <div className="flex gap-2">
              <Button onClick={createSubscription} className="bg-gradient-hero text-primary-foreground">Criar Assinatura</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminSubscriptions;
