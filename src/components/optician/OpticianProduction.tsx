import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Factory } from "lucide-react";
import { format } from "date-fns";

const stageMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  queued: { label: "Na fila", variant: "secondary" },
  cutting: { label: "Corte de lentes", variant: "outline" },
  assembly: { label: "Montagem", variant: "outline" },
  quality_check: { label: "Conferência", variant: "default" },
  ready: { label: "Pronto", variant: "default" },
  shipped: { label: "Enviado", variant: "default" },
};

const OpticianProduction = () => {
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["optical-production"],
    queryFn: async () => {
      const { data, error } = await supabase.from("optical_production" as any).select("*, optical_orders(order_number, total_price, status)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const updates: any = { stage, updated_at: new Date().toISOString() };
      if (stage === "cutting") updates.started_at = new Date().toISOString();
      if (stage === "ready" || stage === "shipped") updates.completed_at = new Date().toISOString();
      const { error } = await supabase.from("optical_production" as any).update(updates).eq("id", id);
      if (error) throw error;
      // Also update order status
      if (stage === "ready") {
        const prod = items.find((i: any) => i.id === id);
        if (prod?.order_id) await supabase.from("optical_orders" as any).update({ status: "ready", updated_at: new Date().toISOString() }).eq("id", prod.order_id);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["optical-production"] }); qc.invalidateQueries({ queryKey: ["optical-orders"] }); toast.success("Etapa atualizada!"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Factory className="w-5 h-5" /> Fila de Produção ({items.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground text-sm">Carregando...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Conclusão</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono font-bold text-xs">{p.optical_orders?.order_number || "—"}</TableCell>
                    <TableCell><Badge variant={stageMap[p.stage]?.variant || "secondary"}>{stageMap[p.stage]?.label || p.stage}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.started_at ? format(new Date(p.started_at), "dd/MM HH:mm") : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.completed_at ? format(new Date(p.completed_at), "dd/MM HH:mm") : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Select onValueChange={v => updateStage.mutate({ id: p.id, stage: v })}>
                        <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Avançar etapa" /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(stageMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum item em produção</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OpticianProduction;
