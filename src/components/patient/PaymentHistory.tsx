import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getPatientNav } from "./patientNav";

const statusLabel: Record<string, string> = { active: "Ativa", cancelled: "Cancelada", expired: "Vencida" };
const statusVariant: Record<string, "default" | "destructive" | "outline"> = { active: "default", cancelled: "destructive", expired: "outline" };

const PaymentHistory = () => {
  const { user } = useAuth();
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchPayments(); }, [user]);

  const fetchPayments = async () => {
    const { data: subsData } = await supabase
      .from("subscriptions")
      .select("id, plan_id, status, starts_at, expires_at, created_at, payment_method")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (!subsData || subsData.length === 0) { setLoading(false); return; }

    const planIds = [...new Set(subsData.map(s => s.plan_id))];
    const { data: plans } = await supabase.from("plans").select("id, name, price").in("id", planIds);
    const planMap = new Map(plans?.map(p => [p.id, p]) ?? []);

    setSubs(subsData.map(s => ({
      ...s,
      plan_name: planMap.get(s.plan_id)?.name ?? "—",
      plan_price: planMap.get(s.plan_id)?.price ?? 0,
    })));
    setLoading(false);
  };

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("payments")}>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Histórico de Pagamentos</h1>
        <p className="text-muted-foreground mb-6">Suas assinaturas e pagamentos realizados</p>

        {loading ? <p className="text-muted-foreground">Carregando...</p> :
        subs.length === 0 ? (
          <Card className="border-border"><CardContent className="py-12 text-center text-muted-foreground">Nenhum pagamento encontrado.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {subs.map(s => (
              <Card key={s.id} className="border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{s.plan_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(s.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        {s.expires_at && ` · Expira: ${format(new Date(s.expires_at), "dd/MM/yyyy", { locale: ptBR })}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">R$ {Number(s.plan_price).toFixed(2)}</p>
                      <Badge variant={statusVariant[s.status] ?? "outline"}>{statusLabel[s.status] ?? s.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentHistory;
