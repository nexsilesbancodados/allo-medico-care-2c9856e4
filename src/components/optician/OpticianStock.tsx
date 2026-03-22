import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, AlertTriangle } from "lucide-react";

const OpticianStock = () => {
  const { data: frames = [], isLoading } = useQuery({
    queryKey: ["optical-frames-stock"],
    queryFn: async () => {
      const { data, error } = await supabase.from("optical_frames" as any).select("*").eq("is_active", true).order("stock_qty", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["optical-stock-movements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("optical_stock_movements" as any).select("*, optical_frames(name)").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data as any[];
    },
  });

  const lowStock = frames.filter((f: any) => f.stock_qty <= 3);

  return (
    <div className="space-y-6">
      {lowStock.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> Estoque Baixo ({lowStock.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((f: any) => (
                <Badge key={f.id} variant="destructive">{f.name} ({f.brand}) — {f.stock_qty} un.</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" /> Estoque Atual</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground text-sm">Carregando...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Armação</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-center">Quantidade</TableHead>
                  <TableHead className="text-right">Valor Unit.</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {frames.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell>{f.brand}</TableCell>
                    <TableCell><Badge variant="secondary">{f.material}</Badge></TableCell>
                    <TableCell className="text-center">
                      <Badge variant={f.stock_qty > 5 ? "default" : f.stock_qty > 0 ? "secondary" : "destructive"}>{f.stock_qty}</Badge>
                    </TableCell>
                    <TableCell className="text-right">R$ {Number(f.price).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">R$ {(Number(f.price) * f.stock_qty).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Últimas Movimentações</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Armação</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell>{m.optical_frames?.name || "—"}</TableCell>
                  <TableCell><Badge variant={m.movement_type === "entry" ? "default" : "destructive"}>{m.movement_type === "entry" ? "Entrada" : "Saída"}</Badge></TableCell>
                  <TableCell className="text-center">{m.quantity}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.reason || "—"}</TableCell>
                </TableRow>
              ))}
              {movements.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Sem movimentações</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OpticianStock;
