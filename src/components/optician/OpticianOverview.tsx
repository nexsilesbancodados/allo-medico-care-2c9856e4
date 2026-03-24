import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Factory, DollarSign, Glasses, AlertTriangle } from "lucide-react";
import { HeroBanner } from "@/components/dashboards/HeroBanner";
import { StatBento } from "@/components/dashboards/StatBento";
import { AlertBox } from "@/components/dashboards/AlertBox";
import pingoOftalmo from "@/assets/pingo-oftalmo.png";

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

  return (
    <div className="space-y-4">
      <div className="-mx-4 -mt-4 md:-mx-6 md:-mt-5 lg:-mx-8 lg:-mt-6">
        <HeroBanner
          gradient="from-[#1a3a5c] via-[#1d6a8a] to-[#3498db]"
          pingoSrc={pingoOftalmo}
          pingoAlt="Pingo Ótica"
          bubble={{
            greeting: "Painel da Ótica",
            name: "Visão Óptica",
            sub: `${pendingOrders} pedidos pendentes`,
          }}
          kpis={[
            { label: "Pedidos",    value: totalOrders },
            { label: "Produção",   value: inProduction },
            { label: "Armações",   value: totalFrames },
            { label: "Receita",    value: `R$${(revenue / 1000).toFixed(1)}k` },
          ]}
        />
      </div>

      <StatBento stats={[
        { label: "Total Pedidos",  value: totalOrders,  icon: "🛍️", iconBg: "bg-blue-50 dark:bg-blue-950/30",    valueClass: "text-blue-700 dark:text-blue-400",    accentClass: "bg-blue-500",   sub: `${pendingOrders} pendentes` },
        { label: "Receita",        value: `R$${revenue.toFixed(0)}`, icon: "💰", iconBg: "bg-emerald-50 dark:bg-emerald-950/30", valueClass: "text-emerald-700 dark:text-emerald-400", accentClass: "bg-emerald-500" },
        { label: "Armações",       value: totalFrames,  icon: "👓", iconBg: lowStock > 0 ? "bg-red-50 dark:bg-red-950/30" : "bg-violet-50 dark:bg-violet-950/30", valueClass: lowStock > 0 ? "text-red-600" : "text-violet-600 dark:text-violet-400", accentClass: lowStock > 0 ? "bg-red-500" : "bg-violet-500", sub: `${lowStock} estoque baixo` },
        { label: "Em Produção",    value: inProduction, icon: "🏭", iconBg: "bg-amber-50 dark:bg-amber-950/30",   valueClass: "text-amber-600 dark:text-amber-400",   accentClass: "bg-amber-500" },
      ]} />

      {lowStock > 0 && (
        <AlertBox
          variant="warning"
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          title={`${lowStock} armação(ões) com estoque ≤ 3 unidades`}
          subtitle="Verifique a aba Estoque para repor."
        />
      )}
    </div>
  );
};

export default OpticianOverview;
