import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

const OpticianFinancial = () => {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["optical-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("optical_transactions" as any).select("*, optical_orders(order_number)").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data as any[];
    },
  });

  const totalSales = transactions.filter((t: any) => t.type === "sale").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalRefunds = transactions.filter((t: any) => t.type === "refund").reduce((s: number, t: any) => s + Math.abs(Number(t.amount)), 0);
  const net = totalSales - totalRefunds;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card variant="kpi">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Vendas</p><p className="text-2xl font-extrabold text-foreground tabular-nums">R$ {totalSales.toFixed(2)}</p></div>
          </CardContent>
        </Card>
        <Card variant="kpi">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center"><TrendingDown className="w-6 h-6 text-destructive" /></div>
            <div><p className="text-sm text-muted-foreground">Estornos</p><p className="text-2xl font-extrabold text-foreground tabular-nums">R$ {totalRefunds.toFixed(2)}</p></div>
          </CardContent>
        </Card>
        <Card variant="kpi">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center"><DollarSign className="w-6 h-6 text-accent-foreground" /></div>
            <div><p className="text-sm text-muted-foreground">Líquido</p><p className="text-2xl font-extrabold text-foreground tabular-nums">R$ {net.toFixed(2)}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated">
        <CardHeader><CardTitle>Transações</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground text-sm">Carregando...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(t.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                    <TableCell className="font-mono text-xs">{t.optical_orders?.order_number || "—"}</TableCell>
                    <TableCell><Badge variant={t.type === "sale" ? "default" : "destructive"}>{t.type === "sale" ? "Venda" : "Estorno"}</Badge></TableCell>
                    <TableCell className="text-sm">{t.description}</TableCell>
                    <TableCell className={`text-right font-semibold ${Number(t.amount) < 0 ? "text-destructive" : ""}`}>R$ {Number(t.amount).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma transação</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OpticianFinancial;
