import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { getAdminNav } from "./adminNav";
import { Plus, Trash2 } from "lucide-react";
import type { SpecialtyRow } from "@/types/domain";

const AdminSpecialties = () => {
  
  const [specialties, setSpecialties] = useState<SpecialtyRow[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSpecialties(); }, []);

  const fetchSpecialties = async () => {
    const { data } = await supabase.from("specialties").select("*").order("name");
    setSpecialties(data ?? []);
    setLoading(false);
  };

  const addSpecialty = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from("specialties").insert({ name: newName.trim(), description: newDesc.trim() || null, consultation_price: newPrice ? Number(newPrice) : null });
    if (error) toast.error("Erro", { description: error.message });
    else { setNewName(""); setNewDesc(""); setNewPrice(""); fetchSpecialties(); toast.success("Especialidade adicionada!"); }
  };

  const removeSpecialty = async (id: string) => {
    await supabase.from("specialties").delete().eq("id", id);
    fetchSpecialties();
  };

  const updatePrice = async (id: string, price: string) => {
    await supabase.from("specialties").update({ consultation_price: price ? Number(price) : null }).eq("id", id);
    fetchSpecialties();
    toast.success("Preço atualizado!");
  };

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("specialties")}>
      <div className="w-full mx-auto max-w-4xl pb-24 md:pb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Especialidades</h1>
        <p className="text-muted-foreground text-sm mb-6">Gerencie as especialidades disponíveis</p>

        <Card className="border-border mb-6">
          <CardHeader><CardTitle className="text-base">Adicionar Especialidade</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2">
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome" className="h-11" onKeyDown={e => e.key === "Enter" && addSpecialty()} />
              <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descrição (opcional)" className="h-11" />
              <Input value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Preço (R$)" className="h-11 w-full sm:w-28" type="number" min={0} step={0.01} />
              <Button onClick={addSpecialty} className="bg-gradient-hero text-primary-foreground h-11"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Preço (R$)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (

                Array.from({ length: 5 }).map((_, i) => (

                  <tr key={i} className="border-b border-border/30">
                          <td className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
      <td className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
      <td className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
      <td className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
      <td className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>

                  </tr>
                ))

              ) : specialties.map(s => (
                <TableRow key={s.id}>
                  <TableCell data-label="Nome" className="font-medium text-foreground">{s.name}</TableCell>
                  <TableCell data-label="Descrição" className="text-muted-foreground">{s.description || "—"}</TableCell>
                  <TableCell data-label="Preço">
                    <Input
                      type="number" min={0} step={0.01} className="w-24"
                      defaultValue={s.consultation_price ?? ""}
                      placeholder="—"
                      onBlur={e => updatePrice(s.id, e.target.value)}
                    />
                  </TableCell>
                  <TableCell data-label="">
                    <Button size="sm" variant="ghost" onClick={() => removeSpecialty(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSpecialties;
