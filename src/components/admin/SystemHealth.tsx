import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "@/components/admin/adminNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, Clock, Database, Bot, Globe, Server } from "lucide-react";
import { format } from "date-fns";

interface HealthCheck {
  name: string;
  status: "ok" | "error" | "checking";
  latency?: number;
  message?: string;
  icon: React.ReactNode;
}

const SystemHealth = () => {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => { runChecks(); }, []);

  const runChecks = async () => {
    setRunning(true);
    const results: HealthCheck[] = [];

    // 1. Supabase Database
    const dbStart = performance.now();
    try {
      const { error } = await supabase.from("specialties").select("id").limit(1);
      const latency = Math.round(performance.now() - dbStart);
      results.push({
        name: "Banco de Dados (Supabase)",
        status: error ? "error" : "ok",
        latency,
        message: error ? error.message : `Respondendo em ${latency}ms`,
        icon: <Database className="w-5 h-5" />,
      });
    } catch (e: any) {
      results.push({ name: "Banco de Dados (Supabase)", status: "error", message: e.message, icon: <Database className="w-5 h-5" /> });
    }

    // 2. Supabase Auth
    const authStart = performance.now();
    try {
      const { data } = await supabase.auth.getSession();
      const latency = Math.round(performance.now() - authStart);
      results.push({
        name: "Autenticação (Auth)",
        status: "ok",
        latency,
        message: data.session ? `Sessão ativa • ${latency}ms` : `Sem sessão ativa • ${latency}ms`,
        icon: <Server className="w-5 h-5" />,
      });
    } catch (e: any) {
      results.push({ name: "Autenticação (Auth)", status: "error", message: e.message, icon: <Server className="w-5 h-5" /> });
    }

    // 3. Edge Functions (pingo-chat as proxy test)
    const efStart = performance.now();
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medical-autocomplete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: "test", field: "notes" }),
      });
      const latency = Math.round(performance.now() - efStart);
      results.push({
        name: "Edge Functions + Lovable AI",
        status: res.ok ? "ok" : "error",
        latency,
        message: res.ok ? `Gateway ativo • ${latency}ms` : `HTTP ${res.status}`,
        icon: <Bot className="w-5 h-5" />,
      });
    } catch (e: any) {
      results.push({ name: "Edge Functions + Lovable AI", status: "error", message: e.message, icon: <Bot className="w-5 h-5" /> });
    }

    // 4. Supabase Realtime
    const rtStart = performance.now();
    try {
      const channel = supabase.channel("health-check-ping");
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => { reject(new Error("Timeout")); }, 5000);
        channel.subscribe((status) => {
          clearTimeout(timeout);
          if (status === "SUBSCRIBED") resolve();
          else reject(new Error(`Status: ${status}`));
        });
      });
      supabase.removeChannel(channel);
      const latency = Math.round(performance.now() - rtStart);
      results.push({
        name: "Realtime (WebSocket)",
        status: "ok",
        latency,
        message: `Conectado • ${latency}ms`,
        icon: <Globe className="w-5 h-5" />,
      });
    } catch (e: any) {
      results.push({ name: "Realtime (WebSocket)", status: "error", message: e.message, icon: <Globe className="w-5 h-5" /> });
    }

    // 5. Storage
    const stStart = performance.now();
    try {
      const { error } = await supabase.storage.from("avatars").list("", { limit: 1 });
      const latency = Math.round(performance.now() - stStart);
      results.push({
        name: "Storage (Buckets)",
        status: error ? "error" : "ok",
        latency,
        message: error ? error.message : `Acessível • ${latency}ms`,
        icon: <Server className="w-5 h-5" />,
      });
    } catch (e: any) {
      results.push({ name: "Storage (Buckets)", status: "error", message: e.message, icon: <Server className="w-5 h-5" /> });
    }

    setChecks(results);
    setLastCheck(new Date());
    setRunning(false);
  };

  const allOk = checks.length > 0 && checks.every(c => c.status === "ok");
  const hasErrors = checks.some(c => c.status === "error");

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("health")}>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Saúde do Sistema</h1>
            <p className="text-sm text-muted-foreground">Diagnóstico em tempo real de todos os serviços</p>
          </div>
          <div className="flex items-center gap-3">
            {lastCheck && (
              <span className="text-xs text-muted-foreground">
                Última verificação: {format(lastCheck, "HH:mm:ss")}
              </span>
            )}
            <Button size="sm" variant="outline" onClick={runChecks} disabled={running}>
              <RefreshCw className={`w-4 h-4 mr-1 ${running ? "animate-spin" : ""}`} />
              {running ? "Verificando..." : "Verificar"}
            </Button>
          </div>
        </div>

        {/* Overall status */}
        {checks.length > 0 && (
          <Card className={`mb-6 border-2 ${allOk ? "border-green-500/30 bg-green-500/5" : hasErrors ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
            <CardContent className="p-6 text-center">
              {allOk ? (
                <>
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
                  <h2 className="text-xl font-bold text-foreground">Todos os sistemas operacionais</h2>
                  <p className="text-sm text-muted-foreground mt-1">Nenhum problema detectado</p>
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 text-destructive mx-auto mb-3" />
                  <h2 className="text-xl font-bold text-foreground">Problemas detectados</h2>
                  <p className="text-sm text-muted-foreground mt-1">{checks.filter(c => c.status === "error").length} serviço(s) com falha</p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Individual checks */}
        <div className="space-y-3">
          {checks.map((check, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      check.status === "ok" ? "bg-green-500/10 text-green-500" :
                      check.status === "error" ? "bg-destructive/10 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {check.icon}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{check.name}</p>
                      <p className="text-xs text-muted-foreground">{check.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {check.latency && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {check.latency}ms
                      </span>
                    )}
                    <Badge variant={check.status === "ok" ? "default" : "destructive"} className="text-xs">
                      {check.status === "ok" ? "✓ OK" : check.status === "error" ? "✗ Falha" : "..."}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {checks.length === 0 && !running && (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <Server className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground">Clique em "Verificar" para iniciar o diagnóstico.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SystemHealth;
