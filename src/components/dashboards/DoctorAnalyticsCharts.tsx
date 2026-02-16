import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const DoctorAnalyticsCharts = () => {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [ratingData, setRatingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data: docProfile } = await supabase
      .from("doctor_profiles")
      .select("id, consultation_price")
      .eq("user_id", user!.id)
      .single();
    if (!docProfile) { setLoading(false); return; }

    const price = Number(docProfile.consultation_price) || 89;
    const days = 7;
    const startDate = startOfDay(subDays(new Date(), days));

    const [apptsRes, surveysRes] = await Promise.all([
      supabase.from("appointments")
        .select("id, scheduled_at, status")
        .eq("doctor_id", docProfile.id)
        .gte("scheduled_at", startDate.toISOString()),
      supabase.from("satisfaction_surveys")
        .select("nps_score, created_at")
        .eq("doctor_id", docProfile.id)
        .order("created_at", { ascending: true })
        .limit(20),
    ]);

    // Weekly appointments
    const dayMap = new Map<string, { date: string; consultas: number; ganhos: number }>();
    for (let i = 0; i <= days; i++) {
      const d = format(subDays(new Date(), days - i), "EEE", { locale: ptBR });
      const key = format(subDays(new Date(), days - i), "yyyy-MM-dd");
      dayMap.set(key, { date: d, consultas: 0, ganhos: 0 });
    }
    (apptsRes.data ?? []).forEach((a) => {
      const key = format(new Date(a.scheduled_at), "yyyy-MM-dd");
      const entry = dayMap.get(key);
      if (entry && a.status === "completed") {
        entry.consultas++;
        entry.ganhos += price;
      }
    });
    setWeeklyData(Array.from(dayMap.values()));

    // Rating trend
    setRatingData(
      (surveysRes.data ?? []).map((s) => ({
        date: format(new Date(s.created_at), "dd/MM", { locale: ptBR }),
        nota: s.nps_score,
      }))
    );

    setLoading(false);
  };

  if (loading || weeklyData.length === 0) return null;

  return (
    <div className="grid sm:grid-cols-2 gap-4 mb-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">📊 Semana (concluídas)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="consultas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Consultas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {ratingData.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">⭐ Avaliações recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 10]} fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Area type="monotone" dataKey="nota" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.2} name="NPS" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorAnalyticsCharts;
