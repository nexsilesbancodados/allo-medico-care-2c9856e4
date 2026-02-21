import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Line } from "recharts";
import { format, subDays, startOfDay, getDay, getHours } from "date-fns";
import { ptBR } from "date-fns/locale";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const DoctorAnalyticsCharts = () => {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [ratingData, setRatingData] = useState<any[]>([]);
  const [earningsData, setEarningsData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

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

    const [apptsRes, surveysRes, allApptsRes] = await Promise.all([
      supabase.from("appointments")
        .select("id, scheduled_at, status")
        .eq("doctor_id", docProfile.id)
        .gte("scheduled_at", startDate.toISOString()),
      supabase.from("satisfaction_surveys")
        .select("nps_score, created_at")
        .eq("doctor_id", docProfile.id)
        .order("created_at", { ascending: true })
        .limit(20),
      supabase.from("appointments")
        .select("scheduled_at, status")
        .eq("doctor_id", docProfile.id)
        .gte("scheduled_at", subDays(new Date(), 60).toISOString()),
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

    // Cumulative earnings (last 4 weeks)
    const earningsMap = new Map<string, number>();
    for (let i = 3; i >= 0; i--) {
      earningsMap.set(format(subDays(new Date(), i * 7), "dd/MM", { locale: ptBR }), 0);
    }
    (allApptsRes.data ?? []).filter(a => a.status === "completed").forEach(a => {
      const wk = format(new Date(a.scheduled_at), "dd/MM", { locale: ptBR });
      if (earningsMap.has(wk)) earningsMap.set(wk, (earningsMap.get(wk) ?? 0) + price);
    });
    let cumEarnings = 0;
    setEarningsData(Array.from(earningsMap.entries()).map(([week, val]) => {
      cumEarnings += val;
      return { week, ganho: val, acumulado: cumEarnings };
    }));

    // Heatmap for doctor
    const heatGrid: Record<string, number> = {};
    (allApptsRes.data ?? []).forEach(a => {
      const dt = new Date(a.scheduled_at);
      const day = getDay(dt);
      const hour = getHours(dt);
      heatGrid[`${day}-${hour}`] = (heatGrid[`${day}-${hour}`] || 0) + 1;
    });
    const heatArr: any[] = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 6; h <= 22; h++) {
        heatArr.push({ day: DAYS[d], hour: `${h}h`, count: heatGrid[`${d}-${h}`] || 0, x: h, y: d });
      }
    }
    setHeatmapData(heatArr);

    setLoading(false);
  };

  if (loading || (weeklyData.length === 0 && heatmapData.length === 0)) return null;

  const ts = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
  };

  return (
    <div className="grid sm:grid-cols-2 gap-4 mb-6">
      {/* Weekly consultations */}
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
                <Tooltip contentStyle={ts} />
                <Bar dataKey="consultas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Consultas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Ratings */}
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
                  <Tooltip contentStyle={ts} />
                  <Area type="monotone" dataKey="nota" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.2} name="NPS" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cumulative earnings */}
      {earningsData.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">💰 Ganhos Acumulados (4 semanas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `R$${v}`} />
                  <Tooltip contentStyle={ts} formatter={(v: number) => [`R$ ${v.toFixed(0)}`, ""]} />
                  <Bar dataKey="ganho" fill="hsl(var(--primary) / 0.3)" name="Semanal" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="acumulado" stroke="hsl(var(--primary))" strokeWidth={2} name="Acumulado" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Doctor Heatmap */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">🗓️ Seus Horários de Pico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              <div className="flex ml-10 mb-1">
                {Array.from({ length: 17 }, (_, i) => i + 6).map(h => (
                  <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground">{h}h</div>
                ))}
              </div>
              {DAYS.map((dayName, dayIdx) => (
                <div key={dayName} className="flex items-center gap-0.5 mb-0.5">
                  <span className="w-8 text-[10px] text-muted-foreground text-right pr-1">{dayName}</span>
                  {Array.from({ length: 17 }, (_, i) => i + 6).map(h => {
                    const cell = heatmapData.find(c => c.y === dayIdx && c.x === h);
                    const count = cell?.count ?? 0;
                    const maxCount = Math.max(...heatmapData.map(c => c.count), 1);
                    const intensity = count / maxCount;
                    return (
                      <div
                        key={h}
                        className="flex-1 aspect-square rounded-[2px] transition-colors"
                        style={{
                          backgroundColor: count === 0
                            ? "hsl(var(--muted) / 0.3)"
                            : `hsl(var(--primary) / ${0.15 + intensity * 0.85})`,
                        }}
                        title={`${dayName} ${h}h: ${count} consulta${count !== 1 ? "s" : ""}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorAnalyticsCharts;
