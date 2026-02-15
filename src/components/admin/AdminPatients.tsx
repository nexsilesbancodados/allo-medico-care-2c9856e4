import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getAdminNav } from "./adminNav";
import { Search, Eye, Edit, Phone, Mail } from "lucide-react";

const AdminPatients = () => {
  const { toast } = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", phone: "", cpf: "" });
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "patient");
    if (!roles || roles.length === 0) { setLoading(false); return; }
    const userIds = roles.map(r => r.user_id);
    const { data: profiles } = await supabase.from("profiles")
      .select("user_id, first_name, last_name, phone, cpf, date_of_birth, created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });
    setPatients(profiles ?? []);
    setLoading(false);
  };

  const openDetail = async (p: any) => {
    setSelected(p);
    setEditForm({ first_name: p.first_name, last_name: p.last_name, phone: p.phone || "", cpf: p.cpf || "" });
    const { data } = await supabase.from("appointments")
      .select("id, scheduled_at, status, doctor_id")
      .eq("patient_id", p.user_id)
      .order("scheduled_at", { ascending: false })
      .limit(10);
    setAppointments(data ?? []);
  };

  const saveEdit = async () => {
    if (!selected) return;
    const { error } = await supabase.from("profiles").update({
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      phone: editForm.phone || null,
      cpf: editForm.cpf || null,
    }).eq("user_id", selected.user_id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Paciente atualizado!" });
      setEditing(false);
      setSelected(null);
      fetchPatients();
    }
  };

  const filtered = patients.filter(p =>
    `${p.first_name} ${p.last_name} ${p.cpf || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const statusLabel: Record<string, string> = {
    scheduled: "Agendada", completed: "Concluída", cancelled: "Cancelada",
  };

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("patients")}>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
            <p className="text-muted-foreground text-sm">{filtered.length} paciente(s) cadastrado(s)</p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou CPF..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {p.first_name?.[0]}{p.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{p.first_name} {p.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.phone || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{p.cpf || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => openDetail(p)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum paciente encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setEditing(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Paciente" : "Detalhes do Paciente"}</DialogTitle>
          </DialogHeader>
          {selected && !editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Nome:</span><p className="font-medium text-foreground">{selected.first_name} {selected.last_name}</p></div>
                <div><span className="text-muted-foreground">Telefone:</span><p className="font-medium text-foreground">{selected.phone || "—"}</p></div>
                <div><span className="text-muted-foreground">CPF:</span><p className="font-medium text-foreground">{selected.cpf || "—"}</p></div>
                <div><span className="text-muted-foreground">Nascimento:</span><p className="font-medium text-foreground">{selected.date_of_birth ? new Date(selected.date_of_birth).toLocaleDateString("pt-BR") : "—"}</p></div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Edit className="w-4 h-4 mr-1" /> Editar</Button>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Últimas Consultas</h4>
                {appointments.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma consulta.</p> : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {appointments.map(a => (
                      <div key={a.id} className="flex justify-between text-xs border border-border rounded p-2">
                        <span className="text-foreground">{new Date(a.scheduled_at).toLocaleDateString("pt-BR")}</span>
                        <Badge variant="outline" className="text-xs">{statusLabel[a.status] ?? a.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {selected && editing && (
            <div className="space-y-3">
              <Input placeholder="Nome" value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} />
              <Input placeholder="Sobrenome" value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} />
              <Input placeholder="Telefone" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              <Input placeholder="CPF" value={editForm.cpf} onChange={e => setEditForm({ ...editForm, cpf: e.target.value })} />
              <div className="flex gap-2">
                <Button onClick={saveEdit} className="bg-gradient-hero text-primary-foreground">Salvar</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminPatients;
