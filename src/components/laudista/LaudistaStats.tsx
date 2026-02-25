import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getLaudistaNav } from "@/components/laudista/laudistaNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart2, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const LaudistaStats = () => {
  const { user } = useAuth();

  const { data: doctorProfile } = useQuery({
    queryKey: ["laudista-doctor-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ["laudista-full-stats", doctorProfile?.id],
    queryFn: async () => {
      const dpId = doctorProfile!.id;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfWeek = new Date(now.getTime() - now.getDay() * 86400000).toISOString();

      const [totalRes, monthRes, weekRes, signedRes] = await Promise.all([
        supabase.from("exam_reports").select("id", { count: "exact", head: true }).eq("reporter_id", dpId),
        supabase.from("exam_reports").select("id", { count: "exact", head: true }).eq("reporter_id", dpId).gte("created_at", startOfMonth),
        supabase.from("exam_reports").select("id", { count: "exact", head: true }).eq("reporter_id", dpId).gte("created_at", startOfWeek),
        supabase.from("exam_reports").select("id", { count: "exact", head: true }).eq("reporter_id", dpId).not("signed_at", "is", null),
      ]);

      return {
        total: totalRes.count ?? 0,
        thisMonth: monthRes.count ?? 0,
        thisWeek: weekRes.count ?? 0,
        signed: signedRes.count ?? 0,
      };
    },
    enabled: !!doctorProfile?.id,
  });

  const cards = [
    { label: "Total de Laudos", value: stats?.total ?? 0, icon: BarChart2, color: "from-primary to-secondary" },
    { label: "Este Mês", value: stats?.thisMonth ?? 0, icon: TrendingUp, color: "from-success to-success/70" },
    { label: "Esta Semana", value: stats?.thisWeek ?? 0, icon: Clock, color: "from-warning to-warning/70" },
    { label: "Assinados", value: stats?.signed ?? 0, icon: CheckCircle2, color: "from-secondary to-primary" },
  ];

  return (
    <DashboardLayout nav={getLaudistaNav("stats")} title="Estatísticas" role="doctor">
      <div className="max-w-4xl space-y-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary" />
          Estatísticas de Laudos
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(card => (
              <Card key={card.label} className="border-border/50 overflow-hidden">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 shadow-md`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-3xl font-black text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LaudistaStats;