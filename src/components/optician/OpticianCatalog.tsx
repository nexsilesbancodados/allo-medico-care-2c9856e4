import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";

const OpticianCatalog = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFrame, setEditingFrame] = useState<any>(null);
  const [form, setForm] = useState({ name: "", brand: "", model: "", color: "", material: "acetato", gender: "unissex", price: "", stock_qty: "" });

  const { data: frames = [], isLoading } = useQuery({
    queryKey: ["optical-frames"],
    queryFn: async () => {
      const { data, error } = await supabase.from("optical_frames" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = { ...values, price: Number(values.price) || 0, stock_qty: Number(values.stock_qty) || 0 };
      delete payload.id; delete payload.created_at; delete payload.updated_at;
      if (editingFrame) {
        const { error } = await supabase.from("optical_frames" as any).update(payload).eq("id", editingFrame.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("optical_frames" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["optical-frames"] }); setDialogOpen(false); resetForm(); toast.success(editingFrame ? "Armação atualizada!" : "Armação cadastrada!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("optical_frames" as any).update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["optical-frames"] }); toast.success("Armação removida"); },
  });

  const resetForm = () => { setForm({ name: "", brand: "", model: "", color: "", material: "acetato", gender: "unissex", price: "", stock_qty: "" }); setEditingFrame(null); };

  const openEdit = (f: any) => {
    setEditingFrame(f);
    setForm({ name: f.name, brand: f.brand, model: f.model, color: f.color, material: f.material, gender: f.gender, price: String(f.price), stock_qty: String(f.stock_qty) });
    setDialogOpen(true);
  };

  const filtered = frames.filter((f: any) => f.is_active && [f.name, f.brand, f.model, f.color].join(" ").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar armações..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Nova Armação</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingFrame ? "Editar" : "Nova"} Armação</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
                <div><Label>Marca</Label><Input value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} /></div>
                <div><Label>Modelo</Label><Input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} /></div>
                <div><Label>Cor</Label><Input value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} /></div>
                <div>
                  <Label>Material</Label>
                  <Select value={form.material} onValueChange={v => setForm(p => ({ ...p, material: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acetato">Acetato</SelectItem>
                      <SelectItem value="metal">Metal</SelectItem>
                      <SelectItem value="titanio">Titânio</SelectItem>
                      <SelectItem value="tr90">TR-90</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Gênero</Label>
                  <Select value={form.gender} onValueChange={v => setForm(p => ({ ...p, gender: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="unissex">Unissex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required /></div>
                <div><Label>Estoque</Label><Input type="number" value={form.stock_qty} onChange={e => setForm(p => ({ ...p, stock_qty: e.target.value }))} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card variant="elevated">
        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" /> Catálogo de Armações ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground text-sm">Carregando...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell>{f.brand}</TableCell>
                    <TableCell><Badge variant="secondary">{f.material}</Badge></TableCell>
                    <TableCell>{f.color}</TableCell>
                    <TableCell className="text-right font-semibold">R$ {Number(f.price).toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={f.stock_qty > 5 ? "default" : f.stock_qty > 0 ? "secondary" : "destructive"}>
                        {f.stock_qty}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => openEdit(f)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => deleteMutation.mutate(f.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma armação encontrada</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OpticianCatalog;
