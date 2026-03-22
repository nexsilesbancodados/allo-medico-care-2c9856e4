import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Package, Factory, DollarSign, Glasses, AlertTriangle } from "lucide-react";

const OpticianOverview = () => {
  const { data: orders = [] } = useQuery({
    queryKey: ["optical-orders-overview"],
    queryFn: async () => {
      const { data } = await supabase.from("optical_orders" as any).select("status, total_price").limit(500);
      return (data || []) as any[];
    },
  });

  const { data: frames = [] } = useQuery({
    queryKey: ["optical-frames-overview"],
    queryFn: async () => {
      const { data } = await supabase.from("optical_frames" as any).select("stock_qty, is_active").eq("is_active", true);
      return (data || []) as any[];
    },
  });

  const { data: production = [] } = useQuery({
    queryKey: ["optical-production-overview"],
    queryFn: async () => {
      const { data } = await supabase.from("optical_production" as any).select("stage").in("stage", ["queued", "cutting", "assembly", "quality_check"]);
      return (data || []) as any[];
    },
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
  const revenue = orders.filter((o: any) => !["cancelled", "refunded"].includes(o.status)).reduce((s: number, o: any) => s + Number(o.total_price), 0);
  const totalFrames = frames.length;
  const lowStock = frames.filter((f: any) => f.stock_qty <= 3).length;
  const inProduction = production.length;

  const kpis = [
    { icon: ShoppingBag, label: "Total Pedidos", value: totalOrders, sub: `${pendingOrders} pendentes`, color: "text-primary" },
    { icon: DollarSign, label: "Receita", value: `R$ ${revenue.toFixed(0)}`, sub: "todas vendas", color: "text-primary" },
    { icon: Glasses, label: "Armações", value: totalFrames, sub: `${lowStock} estoque baixo`, color: lowStock > 0 ? "text-destructive" : "text-primary" },
    { icon: Factory, label: "Em Produção", value: inProduction, sub: "itens ativos", color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                  <p className="text-2xl font-extrabold text-foreground mt-1">{k.value}</p>
                  <p className={`text-[11px] mt-1 font-medium ${k.color}`}>{k.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center`}>
                  <k.icon className={`w-5 h-5 ${k.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {lowStock > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive font-medium">
              {lowStock} armação(ões) com estoque ≤ 3 unidades. Verifique a aba Estoque para repor.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OpticianOverview;
