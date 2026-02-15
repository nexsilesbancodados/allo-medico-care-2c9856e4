import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAdminNav } from "./adminNav";
import { Plus, Search, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabel: Record<string, string> = { active: "Ativa", cancelled: "Cancelada", expired: "Expirada", paused: "Pausada" };
const statusVariant: Record<string, "default" | "destructive" | "outline"> = { active: "default", cancelled: "destructive", expired: "outline", paused: "outline" };

const AdminSubscriptions = () => {
  const { toast } = useToast();
  const [subs, setSubs] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ user_email: "", plan_id: "", status: "active", notes: "" });

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

  const createSubscription = async () => {
    if (!form.plan_id) { toast({ title: "Selecione um plano", variant: "destructive" }); return; }
    // For now, admin creates subscriptions by user_id directly; in production, look up by email
    toast({ title: "Funcionalidade em desenvolvimento", description: "Use o painel para gerenciar assinaturas existentes." });
    setShowForm(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const payload: any = { status: newStatus };
    if (newStatus === "cancelled") payload.cancelled_at = new Date().toISOString();
    await supabase.from("subscriptions").update(payload).eq("id", id);
    toast({ title: "Status atualizado!" });
    fetchData();
  };

  const filtered = subs.filter(s => {
    const matchSearch = `${s.user_name} ${s.plan_name}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("subscriptions")}>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assinaturas</h1>
            <p className="text-muted-foreground text-sm">{filtered.length} assinatura(s)</p>
          </div>
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
                    <TableCell className="text-right">
                      <Select value={s.status} onValueChange={v => updateStatus(s.id, v)}>
                        <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativa</SelectItem>
                          <SelectItem value="paused">Pausada</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                          <SelectItem value="expired">Expirada</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma assinatura.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminSubscriptions;
