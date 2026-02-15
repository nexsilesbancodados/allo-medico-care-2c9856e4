import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAdminNav } from "./adminNav";
import { Plus, Edit, Trash2 } from "lucide-react";

const intervalLabel: Record<string, string> = { monthly: "Mensal", yearly: "Anual", single: "Avulso" };

const AdminPlans = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", interval: "monthly", max_appointments: "", is_active: true });

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    const { data } = await supabase.from("plans").select("*").order("created_at", { ascending: false });
    setPlans(data ?? []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", interval: "monthly", max_appointments: "", is_active: true });
    setEditingPlan(null);
    setShowForm(false);
  };

  const openEdit = (p: any) => {
    setEditingPlan(p);
    setForm({
      name: p.name, description: p.description || "", price: String(p.price),
      interval: p.interval, max_appointments: p.max_appointments ? String(p.max_appointments) : "", is_active: p.is_active,
    });
    setShowForm(true);
  };

  const savePlan = async () => {
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price) || 0,
      interval: form.interval,
      max_appointments: form.max_appointments ? parseInt(form.max_appointments) : null,
      is_active: form.is_active,
    };

    if (editingPlan) {
      const { error } = await supabase.from("plans").update(payload).eq("id", editingPlan.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Plano atualizado!" });
    } else {
      const { error } = await supabase.from("plans").insert(payload as any);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Plano criado!" });
    }
    resetForm();
    fetchPlans();
  };

  const deletePlan = async (id: string) => {
    await supabase.from("plans").delete().eq("id", id);
    fetchPlans();
    toast({ title: "Plano removido" });
  };

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("plans")}>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Planos</h1>
            <p className="text-muted-foreground text-sm">Gerencie os planos da plataforma</p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-gradient-hero text-primary-foreground">
            <Plus className="w-4 h-4 mr-1" /> Novo Plano
          </Button>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Consultas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{p.name}</p>
                        {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">R$ {Number(p.price).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">{intervalLabel[p.interval] ?? p.interval}</TableCell>
                    <TableCell className="text-muted-foreground">{p.max_appointments ?? "Ilimitado"}</TableCell>
                    <TableCell><Badge variant={p.is_active ? "default" : "outline"}>{p.is_active ? "Ativo" : "Inativo"}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => deletePlan(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {plans.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum plano cadastrado.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={() => resetForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome do plano" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Preço (R$)" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              <Select value={form.interval} onValueChange={v => setForm({ ...form, interval: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                  <SelectItem value="single">Avulso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Máx. consultas (vazio = ilimitado)" type="number" value={form.max_appointments} onChange={e => setForm({ ...form, max_appointments: e.target.value })} />
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              <span className="text-sm text-foreground">Plano ativo</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={savePlan} className="bg-gradient-hero text-primary-foreground">{editingPlan ? "Salvar" : "Criar"}</Button>
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminPlans;
