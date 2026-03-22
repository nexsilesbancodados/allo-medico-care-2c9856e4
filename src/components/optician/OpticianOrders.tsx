import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, ShoppingBag, Truck, Eye } from "lucide-react";
import { format } from "date-fns";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "secondary" },
  confirmed: { label: "Confirmado", variant: "default" },
  in_production: { label: "Em produção", variant: "outline" },
  ready: { label: "Pronto", variant: "default" },
  shipped: { label: "Enviado", variant: "default" },
  delivered: { label: "Entregue", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  refunded: { label: "Estornado", variant: "destructive" },
};

const OpticianOrders = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["optical-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("optical_orders" as any).select("*, optical_frames(name, brand), optical_lens_types(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === "shipped") updates.shipped_at = new Date().toISOString();
      if (status === "delivered") updates.delivered_at = new Date().toISOString();
      if (status === "cancelled") updates.cancelled_at = new Date().toISOString();
      const { error } = await supabase.from("optical_orders" as any).update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["optical-orders"] }); toast.success("Status atualizado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = orders.filter((o: any) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search && !o.order_number?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por número..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card variant="elevated">
        <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> Pedidos ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground text-sm">Carregando...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Armação</TableHead>
                  <TableHead>Lente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono font-bold text-xs">{o.order_number}</TableCell>
                    <TableCell>{o.optical_frames?.name || "—"} <span className="text-muted-foreground text-xs">{o.optical_frames?.brand}</span></TableCell>
                    <TableCell>{o.optical_lens_types?.name || "—"}</TableCell>
                    <TableCell className="text-right font-semibold">R$ {Number(o.total_price).toFixed(2)}</TableCell>
                    <TableCell><Badge variant={statusMap[o.status]?.variant || "secondary"}>{statusMap[o.status]?.label || o.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(o.created_at), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Select onValueChange={v => updateStatus.mutate({ id: o.id, status: v })}>
                        <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Alterar status" /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum pedido encontrado</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OpticianOrders;
