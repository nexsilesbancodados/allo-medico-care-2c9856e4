import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getAdminNav } from "./adminNav";
import { Plus, Trash2 } from "lucide-react";

const AdminSpecialties = () => {
  const { toast } = useToast();
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSpecialties(); }, []);

  const fetchSpecialties = async () => {
    const { data } = await supabase.from("specialties").select("*").order("name");
    setSpecialties(data ?? []);
    setLoading(false);
  };

  const addSpecialty = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from("specialties").insert({ name: newName.trim(), description: newDesc.trim() || null } as any);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { setNewName(""); setNewDesc(""); fetchSpecialties(); toast({ title: "Especialidade adicionada!" }); }
  };

  const removeSpecialty = async (id: string) => {
    await supabase.from("specialties").delete().eq("id", id);
    fetchSpecialties();
  };

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("specialties")}>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Especialidades</h1>
        <p className="text-muted-foreground text-sm mb-6">Gerencie as especialidades disponíveis</p>

        <Card className="border-border mb-6">
          <CardHeader><CardTitle className="text-base">Adicionar Especialidade</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome" className="flex-1" onKeyDown={e => e.key === "Enter" && addSpecialty()} />
              <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descrição (opcional)" className="flex-1" />
              <Button onClick={addSpecialty} className="bg-gradient-hero text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specialties.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.description || "—"}</TableCell>
                  <TableCell className="text-right">
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
