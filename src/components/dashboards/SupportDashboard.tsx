import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, AlertTriangle, Activity, MessageCircle, UserCog, ShieldAlert, History, Eye, Search, Filter, Download, RefreshCw, Inbox, Wifi, Shield } from "lucide-react";
import SupportChat from "@/components/support/SupportChat";
import SupportInbox from "@/components/support/SupportInbox";
import { toast } from "sonner";
import BlobKPICard from "@/components/ui/blob-kpi-card";
const supportNav = [
  { label: "Visão Geral", href: "/dashboard", icon: <Activity className="w-4 h-4" />, active: true },
  { label: "Perfil", href: "/dashboard/profile", icon: <UserCog className="w-4 h-4" /> },
];

const roleLabel: Record<string, string> = {
  patient: "Paciente", doctor: "Médico", clinic: "Clínica", admin: "Admin",
  receptionist: "Recepção", support: "Suporte", partner: "Parceiro", affiliate: "Afiliado",
};

const roleColor: Record<string, string> = {
  patient: "bg-primary/10 text-primary border-primary/20",
  doctor: "bg-secondary/10 text-secondary border-secondary/20",
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  support: "bg-warning/10 text-warning border-warning/20",
  clinic: "bg-accent text-accent-foreground border-border",
  receptionist: "bg-muted text-muted-foreground border-border",
  partner: "bg-success/10 text-success border-success/20",
  affiliate: "bg-muted text-muted-foreground border-border",
};

const LOG_TYPES = [
  { value: "all", label: "Todos os tipos" },
  { value: "appointment", label: "Consultas" },
  { value: "subscription", label: "Assinaturas" },
  { value: "auth", label: "Autenticação" },
  { value: "payment", label: "Pagamentos" },
  { value: "error", label: "Erros" },
  { value: "cancel", label: "Cancelamentos" },
];

const USER_ROLE_FILTER = [
  { value: "all", label: "Todos os perfis" },
  { value: "patient", label: "Pacientes" },
  { value: "doctor", label: "Médicos" },
  { value: "clinic", label: "Clínicas" },
  { value: "admin", label: "Admins" },
];

const getLogSeverity = (log: any): "error" | "warn" | "info" => {
  const a = (log.action ?? "").toLowerCase();
  if (a.includes("error") || a.includes("failed") || a.includes("cancel")) return "error";
  if (a.includes("warn") || a.includes("timeout") || a.includes("no_show")) return "warn";
  return "info";
};

const severityStyle: Record<string, string> = {
  error: "bg-destructive/10 text-destructive border-destructive/20",
  warn: "bg-warning/10 text-warning border-warning/20",
  info: "bg-muted text-muted-foreground border-border",
};

const severityLabel: Record<string, string> = {
  error: "Erro",
  warn: "Aviso",
  info: "Info",
};

const SupportDashboard = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [searchLogs, setSearchLogs] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState("all");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewAs, setViewAs] = useState<any>(null);
  const lastFetch = useRef<Date>(new Date());

  // Fetch online users
  useEffect(() => {
    const fetchOnline = async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("user_presence")
        .select("user_id, last_seen_at, current_page, is_online")
        .eq("is_online", true)
        .gte("last_seen_at", fiveMinAgo);
      if (!data || data.length === 0) { setOnlineUsers([]); return; }
      const userIds = data.map(d => d.user_id);
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds),
        supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
      ]);
      const pMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) ?? []);
      const rMap = new Map<string, string[]>();
      rolesRes.data?.forEach(r => {
        if (!rMap.has(r.user_id)) rMap.set(r.user_id, []);
        rMap.get(r.user_id)!.push(r.role);
      });
      setOnlineUsers(data.map(d => ({
        ...d,
        first_name: pMap.get(d.user_id)?.first_name ?? "",
        last_name: pMap.get(d.user_id)?.last_name ?? "",
        roles: rMap.get(d.user_id) ?? [],
      })));
    };
    fetchOnline();
    const interval = setInterval(fetchOnline, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { fetchData(); }, []);

  // Realtime: refresh logs on new activity
  useEffect(() => {
    const channel = supabase
      .channel("support-live-logs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs" }, (payload) => {
        setLogs(prev => [payload.new, ...prev].slice(0, 100));
        lastFetch.current = new Date();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    const [logsRes, profilesRes] = await Promise.all([
      supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("user_id, first_name, last_name, phone, avatar_url, created_at"),
    ]);
    setLogs(logsRes.data ?? []);

    const userIds = (profilesRes.data ?? []).map(p => p.user_id);
    const { data: rolesData } = userIds.length > 0
      ? await supabase.from("user_roles").select("user_id, role").in("user_id", userIds)
      : { data: [] };
    const roleMap = new Map<string, string[]>();
    (rolesData ?? []).forEach(r => {
      if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, []);
      roleMap.get(r.user_id)!.push(r.role);
    });
    setUsers((profilesRes.data ?? []).map(p => ({ ...p, roles: roleMap.get(p.user_id) ?? [] })));
    lastFetch.current = new Date();
    setLoading(false);
    setRefreshing(false);
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = `${l.action} ${l.entity_type} ${l.entity_id}`.toLowerCase().includes(searchLogs.toLowerCase());
    const matchesType = logTypeFilter === "all" || l.entity_type?.toLowerCase().includes(logTypeFilter) || l.action?.toLowerCase().includes(logTypeFilter);
    return matchesSearch && matchesType;
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = `${u.first_name} ${u.last_name} ${u.phone}`.toLowerCase().includes(searchUsers.toLowerCase());
    const matchesRole = userRoleFilter === "all" || u.roles.includes(userRoleFilter);
    return matchesSearch && matchesRole;
  });

  // Computed stats
  const errorCount = logs.filter(l => getLogSeverity(l) === "error").length;
  const warnCount = logs.filter(l => getLogSeverity(l) === "warn").length;
  const todayLogs = logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length;

  const exportUsersCSV = () => {
    const rows = [
      ["Nome", "Telefone", "Perfis", "Cadastro"],
      ...filteredUsers.map(u => [
        `${u.first_name} ${u.last_name}`,
        u.phone ?? "—",
        u.roles.map((r: string) => roleLabel[r] ?? r).join("; "),
        format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR }),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `usuarios-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Usuários exportados em CSV!");
  };

  const exportLogsCSV = () => {
    const rows = [
      ["Data", "Severidade", "Ação", "Entidade", "ID"],
      ...filteredLogs.map(l => [
        format(new Date(l.created_at), "dd/MM/yyyy HH:mm"),
        severityLabel[getLogSeverity(l)],
        l.action, l.entity_type, l.entity_id ?? "—",
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `logs-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Logs exportados em CSV!");
  };

  return (
    <DashboardLayout title="Suporte Técnico" nav={supportNav}>
      <div className="max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Helpdesk</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitoramento em tempo real · Atualizado{" "}
              <span className="font-medium text-foreground">
                {formatDistanceToNow(lastFetch.current, { addSuffix: true, locale: ptBR })}
              </span>
            </p>
          </div>
          <Button
            size="sm" variant="outline"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="shrink-0"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* BLOB KPI Cards — Suporte */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
          <BlobKPICard variant={0} label="Usuários" value={users.length} icon={<Users className="w-5 h-5" />} color="primary" delay={0} />
          <BlobKPICard variant={1} label="Logs Hoje" value={logs.length} icon={<Activity className="w-5 h-5" />} color="secondary" delay={0.08} />
          <BlobKPICard variant={2} label="Erros Críticos" value={logs.filter(l => getLogSeverity(l.action) === "error").length} icon={<AlertTriangle className="w-5 h-5" />} color="destructive" delay={0.16} />
          <BlobKPICard variant={3} label="Alertas" value={logs.filter(l => getLogSeverity(l.action) === "warn").length} icon={<ShieldAlert className="w-5 h-5" />} color="warning" delay={0.24} />
        </div>

        {/* Stats strip original */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {loading ? (
            [1, 2, 3, 4].map(i => (
              <Card key={i} className="border-border">
                <CardContent className="p-4 space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-12" />
                </CardContent>
              </Card>
            ))
          ) : (
            [
              { label: "Usuários", value: users.length, icon: Users, color: "text-primary", bg: "bg-primary/10", sub: `${filteredUsers.length} filtrados` },
              { label: "Logs hoje", value: todayLogs, icon: Activity, color: "text-secondary", bg: "bg-secondary/10", sub: `${logs.length} total` },
              { label: "Erros", value: errorCount, icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10", sub: `${warnCount} avisos` },
              { label: "Alertas", value: errorCount + warnCount, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", sub: "Revisão necessária" },
            ].map(s => (
              <Card key={s.label} className="border-border">
                <CardContent className="p-4">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">{s.sub}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Alert banner for critical errors */}
        {!loading && errorCount > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-destructive/20 bg-destructive/5">
            <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">{errorCount} erro{errorCount > 1 ? "s" : ""} detectado{errorCount > 1 ? "s" : ""}</p>
              <p className="text-xs text-muted-foreground">Revise os logs de erro abaixo para diagnóstico</p>
            </div>
            <Button size="sm" variant="ghost" className="text-xs text-destructive h-7 shrink-0" onClick={() => setLogTypeFilter("error")}>
              Ver erros →
            </Button>
          </div>
        )}

        <Tabs defaultValue="inbox">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="inbox" className="flex-1 sm:flex-none">
              <Inbox className="w-4 h-4 mr-1.5" /> Inbox
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex-1 sm:flex-none">
              <MessageCircle className="w-4 h-4 mr-1.5" /> Chat IA
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex-1 sm:flex-none">
              <History className="w-4 h-4 mr-1.5" /> Logs
              {errorCount > 0 && (
                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground leading-none">
                  {errorCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 sm:flex-none">
              <Users className="w-4 h-4 mr-1.5" /> Usuários
            </TabsTrigger>
            <TabsTrigger value="online" className="flex-1 sm:flex-none">
              <Wifi className="w-4 h-4 mr-1.5" /> Online
              {onlineUsers.length > 0 && (
                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground leading-none">
                  {onlineUsers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex-1 sm:flex-none">
              <Shield className="w-4 h-4 mr-1.5" /> Auditoria
            </TabsTrigger>
            {viewAs && (
              <TabsTrigger value="impersonate" className="flex-1 sm:flex-none">
                <Eye className="w-4 h-4 mr-1.5" /> Perfil
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="inbox" className="mt-4">
            <SupportInbox />
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <SupportChat />
          </TabsContent>

          <TabsContent value="logs" className="mt-4 space-y-3">
            {/* Log filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Filtrar logs..." value={searchLogs} onChange={e => setSearchLogs(e.target.value)} className="pl-10" />
              </div>
              <Select value={logTypeFilter} onValueChange={setLogTypeFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <Filter className="w-4 h-4 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {LOG_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={exportLogsCSV} disabled={loading}>
                <Download className="w-4 h-4 mr-1.5" /> CSV
              </Button>
            </div>

            {/* Summary badges */}
            {!loading && (
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">{filteredLogs.length} log{filteredLogs.length !== 1 ? "s" : ""}</span>
                {[
                  { sev: "error", label: "Erros", count: filteredLogs.filter(l => getLogSeverity(l) === "error").length },
                  { sev: "warn", label: "Avisos", count: filteredLogs.filter(l => getLogSeverity(l) === "warn").length },
                ].map(b => b.count > 0 && (
                  <span key={b.sev} className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${severityStyle[b.sev]}`}>
                    {b.count} {b.label}
                  </span>
                ))}
              </div>
            )}

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-border">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 flex-1" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="max-h-[480px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-xs">Data</TableHead>
                        <TableHead className="text-xs">Severity</TableHead>
                        <TableHead className="text-xs">Ação</TableHead>
                        <TableHead className="text-xs">Entidade</TableHead>
                        <TableHead className="text-xs">ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map(l => {
                        const sev = getLogSeverity(l);
                        return (
                          <TableRow key={l.id} className={`hover:bg-muted/30 ${sev === "error" ? "bg-destructive/5" : sev === "warn" ? "bg-warning/5" : ""}`}>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(l.created_at), "dd/MM HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${severityStyle[sev]}`}>
                                {severityLabel[sev]}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-foreground max-w-[180px] truncate">{l.action}</TableCell>
                            <TableCell>
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
                                {l.entity_type}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">{l.entity_id?.slice(0, 8) ?? "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nenhum log encontrado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome ou telefone..." value={searchUsers} onChange={e => setSearchUsers(e.target.value)} className="pl-10" />
              </div>
              <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <Filter className="w-4 h-4 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Perfil" />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLE_FILTER.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={exportUsersCSV} disabled={loading}>
                <Download className="w-4 h-4 mr-1.5" /> CSV
              </Button>
            </div>

            {/* User count */}
            {!loading && (
              <p className="text-xs text-muted-foreground">
                {filteredUsers.length} usuário{filteredUsers.length !== 1 ? "s" : ""} encontrado{filteredUsers.length !== 1 ? "s" : ""}
                {userRoleFilter !== "all" && ` · Perfil: ${roleLabel[userRoleFilter] ?? userRoleFilter}`}
              </p>
            )}

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-7 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map(u => (
                  <div key={u.user_id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                        {u.first_name?.[0]}{u.last_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.first_name} {u.last_name}</p>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {u.roles.slice(0, 2).map((r: string) => (
                            <span key={r} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${roleColor[r] ?? "bg-muted text-muted-foreground border-border"}`}>
                              {roleLabel[r] ?? r}
                            </span>
                          ))}
                          {u.phone && <span className="text-xs text-muted-foreground hidden sm:block">· {u.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-muted-foreground hidden sm:block">
                        {format(new Date(u.created_at), "dd/MM/yy")}
                      </span>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setViewAs(u)}>
                        <Eye className="w-3 h-3 mr-1" /> Ver
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">Nenhum usuário encontrado.</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="online" className="mt-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-secondary" />
                  Usuários Online ({onlineUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {onlineUsers.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Nenhum usuário online no momento.</p>
                ) : (
                  <div className="space-y-2">
                    {onlineUsers.map(u => (
                      <div key={u.user_id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center text-xs font-bold text-secondary">
                              {u.first_name?.[0]}{u.last_name?.[0]}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-secondary border-2 border-background" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{u.first_name} {u.last_name}</p>
                            <div className="flex items-center gap-1.5">
                              {u.roles.slice(0, 2).map((r: string) => (
                                <span key={r} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${roleColor[r] ?? "bg-muted text-muted-foreground border-border"}`}>
                                  {roleLabel[r] ?? r}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{u.current_page ?? "/"}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(u.last_seen_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Auditoria LGPD — Acessos a Dados Sensíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">
                  Registros de quem acessou prontuários, receitas e documentos de pacientes. Exigência da LGPD para dados de saúde.
                </p>
                {loading ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto">
                    {logs
                      .filter(l => {
                        const a = (l.action ?? "").toLowerCase();
                        const e = (l.entity_type ?? "").toLowerCase();
                        return e.includes("medical_record") || e.includes("prescription") || e.includes("patient_document") ||
                          a.includes("view_record") || a.includes("access") || a.includes("prontuario") || a.includes("receita");
                      })
                      .map(l => {
                        const performer = users.find(u => u.user_id === l.performed_by || u.user_id === l.user_id);
                        return (
                          <div key={l.id} className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                              {performer?.first_name?.[0]}{performer?.last_name?.[0] ?? "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground">
                                <span className="font-medium">{performer ? `${performer.first_name} ${performer.last_name}` : l.performed_by?.slice(0,8) ?? "Sistema"}</span>
                                {" "}<span className="text-muted-foreground">{l.action}</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {l.entity_type} · ID: {l.entity_id?.slice(0,8) ?? "—"} · {format(new Date(l.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {l.entity_type}
                            </Badge>
                          </div>
                        );
                      })
                    }
                    {logs.filter(l => {
                      const e = (l.entity_type ?? "").toLowerCase();
                      return e.includes("medical_record") || e.includes("prescription") || e.includes("patient_document");
                    }).length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">Nenhum registro de auditoria encontrado.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {viewAs && (
            <TabsContent value="impersonate" className="mt-4">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Eye className="w-4 h-4" /> Perfil: {viewAs.first_name} {viewAs.last_name}
                    </CardTitle>
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => setViewAs(null)}>Fechar ×</Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Nome Completo</p>
                      <p className="text-sm font-medium text-foreground">{viewAs.first_name} {viewAs.last_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Telefone</p>
                      <p className="text-sm text-foreground">{viewAs.phone ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cadastro</p>
                      <p className="text-sm text-foreground">{format(new Date(viewAs.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Perfis</p>
                      <div className="flex gap-1 flex-wrap">
                        {viewAs.roles.map((r: string) => (
                          <span key={r} className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${roleColor[r] ?? "bg-muted text-muted-foreground border-border"}`}>
                            {roleLabel[r] ?? r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent logs for this user */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Atividade recente</p>
                    <div className="space-y-1.5">
                      {logs.filter(l => l.user_id === viewAs.user_id || l.performed_by === viewAs.user_id).slice(0, 5).map(l => (
                        <div key={l.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${severityStyle[getLogSeverity(l)]}`}>
                            {severityLabel[getLogSeverity(l)]}
                          </span>
                          <p className="text-xs text-foreground flex-1 truncate">{l.action}</p>
                          <p className="text-[10px] text-muted-foreground whitespace-nowrap">{format(new Date(l.created_at), "dd/MM HH:mm")}</p>
                        </div>
                      ))}
                      {logs.filter(l => l.user_id === viewAs.user_id || l.performed_by === viewAs.user_id).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-3">Nenhuma atividade encontrada para este usuário.</p>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                      A simulação real (impersonation) requer acesso ao Supabase Admin. Aqui você visualiza o perfil para orientar o usuário por telefone ou chat.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SupportDashboard;
