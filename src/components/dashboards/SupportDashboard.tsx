import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Activity, Users, AlertTriangle, Eye, History, UserCog, MessageCircle, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import SupportChat from "@/components/support/SupportChat";
import { toast } from "sonner";

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

const SupportDashboard = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchLogs, setSearchLogs] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewAs, setViewAs] = useState<any>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [logsRes, profilesRes] = await Promise.all([
      supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(100),
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
    setLoading(false);
  };

  const filteredLogs = logs.filter(l =>
    `${l.action} ${l.entity_type} ${l.entity_id}`.toLowerCase().includes(searchLogs.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.phone}`.toLowerCase().includes(searchUsers.toLowerCase())
  );

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
      ["Data", "Ação", "Entidade", "ID"],
      ...filteredLogs.map(l => [
        format(new Date(l.created_at), "dd/MM/yyyy HH:mm"),
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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Helpdesk</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monitoramento de logs, usuários e acessos</p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {loading ? (
            [1, 2, 3].map(i => (
              <Card key={i} className="border-border">
                <CardContent className="p-4 space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-12" />
                </CardContent>
              </Card>
            ))
          ) : (
            [
              { label: "Usuários", value: users.length, icon: Users, color: "text-primary", bg: "bg-primary/10" },
              { label: "Logs", value: logs.length, icon: History, color: "text-secondary", bg: "bg-secondary/10" },
              { label: "Alertas", value: logs.filter(l => l.action?.includes("error") || l.action?.includes("cancel")).length, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
            ].map(s => (
              <Card key={s.label} className="border-border">
                <CardContent className="p-4">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Tabs defaultValue="chat">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="chat" className="flex-1 sm:flex-none">
              <MessageCircle className="w-4 h-4 mr-1.5" /> Chat
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex-1 sm:flex-none">
              <History className="w-4 h-4 mr-1.5" /> Logs
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 sm:flex-none">
              <Users className="w-4 h-4 mr-1.5" /> Usuários
            </TabsTrigger>
            {viewAs && (
              <TabsTrigger value="impersonate" className="flex-1 sm:flex-none">
                <Eye className="w-4 h-4 mr-1.5" /> Simulação
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="chat" className="mt-4">
            <SupportChat />
          </TabsContent>

          <TabsContent value="logs" className="mt-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Filtrar logs..." value={searchLogs} onChange={e => setSearchLogs(e.target.value)} className="pl-10" />
              </div>
              <Button size="sm" variant="outline" onClick={exportLogsCSV} disabled={loading}>
                <Download className="w-4 h-4 mr-1.5" /> CSV
              </Button>
            </div>
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
              <div className="rounded-xl border border-border overflow-hidden max-h-[480px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-xs">Data</TableHead>
                      <TableHead className="text-xs">Ação</TableHead>
                      <TableHead className="text-xs">Entidade</TableHead>
                      <TableHead className="text-xs">ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map(l => (
                      <TableRow key={l.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(l.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">{l.action}</TableCell>
                        <TableCell>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
                            {l.entity_type}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{l.entity_id?.slice(0, 8) ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {filteredLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhum log encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome ou telefone..." value={searchUsers} onChange={e => setSearchUsers(e.target.value)} className="pl-10" />
              </div>
              <Button size="sm" variant="outline" onClick={exportUsersCSV} disabled={loading}>
                <Download className="w-4 h-4 mr-1.5" /> CSV
              </Button>
            </div>
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
                    <Button size="sm" variant="outline" className="text-xs h-7 shrink-0" onClick={() => setViewAs(u)}>
                      <Eye className="w-3 h-3 mr-1" /> Ver
                    </Button>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">Nenhum usuário encontrado.</p>
                )}
              </div>
            )}
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
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 mb-4">
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
