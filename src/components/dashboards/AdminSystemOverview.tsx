import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Database, Shield, Zap, Users, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface SystemMetric {
  label: string;
  value: string | number;
  status: "healthy" | "warning" | "error";
  icon: typeof Activity;
}

const AdminSystemOverview = () => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    checkSystem();
    const interval = setInterval(checkSystem, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkSystem = async () => {
    const start = Date.now();
    const results: SystemMetric[] = [];

    // DB latency
    try {
      const dbStart = Date.now();
      await supabase.from("app_settings").select("key").limit(1);
      const dbLatency = Date.now() - dbStart;
      results.push({
        label: "Latência DB",
        value: `${dbLatency}ms`,
        status: dbLatency < 200 ? "healthy" : dbLatency < 500 ? "warning" : "error",
        icon: Database,
      });
    } catch {
      results.push({ label: "Latência DB", value: "Erro", status: "error", icon: Database });
    }

    // Auth check
    try {
      const authStart = Date.now();
      await supabase.auth.getSession();
      const authLatency = Date.now() - authStart;
      results.push({
        label: "Auth Service",
        value: `${authLatency}ms`,
        status: authLatency < 300 ? "healthy" : authLatency < 800 ? "warning" : "error",
        icon: Shield,
      });
    } catch {
      results.push({ label: "Auth Service", value: "Erro", status: "error", icon: Shield });
    }

    // Active users (online in last 5 min)
    try {
      const { count } = await supabase
        .from("user_presence")
        .select("id", { count: "exact", head: true })
        .eq("is_online", true);
      results.push({
        label: "Usuários Online",
        value: count ?? 0,
        status: "healthy",
        icon: Users,
      });
    } catch {
      results.push({ label: "Usuários Online", value: "N/A", status: "warning", icon: Users });
    }

    // Pending actions
    try {
      const [pendingDocs, openTickets, queueWaiting] = await Promise.all([
        supabase.from("doctor_profiles").select("id", { count: "exact", head: true }).eq("is_approved", false),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
        supabase.from("on_demand_queue").select("id", { count: "exact", head: true }).eq("status", "waiting"),
      ]);
      const pendingCount = (pendingDocs.count ?? 0) + (openTickets.count ?? 0) + (queueWaiting.count ?? 0);
      results.push({
        label: "Ações Pendentes",
        value: pendingCount,
        status: pendingCount === 0 ? "healthy" : pendingCount < 5 ? "warning" : "error",
        icon: AlertTriangle,
      });
    } catch {
      results.push({ label: "Ações Pendentes", value: "N/A", status: "warning", icon: AlertTriangle });
    }

    // Edge function check
    try {
      const fnStart = Date.now();
      await supabase.functions.invoke("rate-limiter", {
        body: { endpoint: "health-check", identifier: "admin-system-check" },
      });
      const fnLatency = Date.now() - fnStart;
      results.push({
        label: "Edge Functions",
        value: `${fnLatency}ms`,
        status: fnLatency < 500 ? "healthy" : fnLatency < 1500 ? "warning" : "error",
        icon: Zap,
      });
    } catch {
      results.push({ label: "Edge Functions", value: "Offline", status: "error", icon: Zap });
    }

    // Uptime (just total elapsed check time)
    results.push({
      label: "Tempo Check",
      value: `${Date.now() - start}ms`,
      status: "healthy",
      icon: Clock,
    });

    setMetrics(results);
    setLastCheck(new Date());
    setLoading(false);
  };

  const overallStatus = metrics.some(m => m.status === "error")
    ? "error"
    : metrics.some(m => m.status === "warning")
    ? "warning"
    : "healthy";

  const statusConfig = {
    healthy: { label: "Operacional", color: "bg-success text-success-foreground", border: "border-success/20" },
    warning: { label: "Atenção", color: "bg-warning text-warning-foreground", border: "border-warning/20" },
    error: { label: "Crítico", color: "bg-destructive text-destructive-foreground", border: "border-destructive/20" },
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="text-sm">Verificando saúde do sistema...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-border/50 ${statusConfig[overallStatus].border}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Saúde do Sistema
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`text-[10px] ${statusConfig[overallStatus].color}`}>
              {statusConfig[overallStatus].label}
            </Badge>
            {lastCheck && (
              <span className="text-[10px] text-muted-foreground">
                {lastCheck.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`p-3 rounded-xl border transition-colors ${
                metric.status === "healthy"
                  ? "border-success/20 bg-success/5"
                  : metric.status === "warning"
                  ? "border-warning/20 bg-warning/5"
                  : "border-destructive/20 bg-destructive/5"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <metric.icon className={`w-3.5 h-3.5 ${
                  metric.status === "healthy" ? "text-success" : metric.status === "warning" ? "text-warning" : "text-destructive"
                }`} />
                <span className="text-[10px] font-medium text-muted-foreground truncate">{metric.label}</span>
              </div>
              <p className={`text-sm font-bold ${
                metric.status === "healthy" ? "text-foreground" : metric.status === "warning" ? "text-warning" : "text-destructive"
              }`}>
                {metric.value}
              </p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSystemOverview;
