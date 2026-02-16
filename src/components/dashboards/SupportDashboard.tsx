import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Shield, Activity, Users, AlertTriangle, Eye, History, UserCog, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import SupportChat from "@/components/support/SupportChat";

const supportNav = [
  { label: "Visão Geral", href: "/dashboard", icon: <Activity className="w-4 h-4" />, active: true },
  { label: "Perfil", href: "/dashboard/profile", icon: <UserCog className="w-4 h-4" /> },
];

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
    // Enrich users with roles
    const userIds = (profilesRes.data ?? []).map(p => p.user_id);
    const { data: rolesData } = userIds.length > 0
      ? await supabase.from("user_roles").select("user_id, role").in("user_id", userIds)
      : { data: [] };
    const roleMap = new Map<string, string[]>();
    (rolesData ?? []).forEach(r => {
      if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, []);
      roleMap.get(r.user_id)!.push(r.role);
    });
    setUsers((profilesRes.data ?? []).map(p => ({
      ...p,
      roles: roleMap.get(p.user_id) ?? [],
    })));
    setLoading(false);
  };

  const filteredLogs = logs.filter(l =>
    `${l.action} ${l.entity_type} ${l.entity_id}`.toLowerCase().includes(searchLogs.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.phone}`.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const roleLabel: Record<string, string> = {
    patient: "Paciente", doctor: "Médico", clinic: "Clínica", admin: "Admin",
    receptionist: "Recepção", support: "Suporte", partner: "Parceiro", affiliate: "Afiliado",
  };

  return (
    <DashboardLayout title="Suporte Técnico" nav={supportNav}>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Helpdesk</h1>
        <p className="text-muted-foreground mb-6">Monitoramento de logs, usuários e acessos</p>

        <Tabs defaultValue="chat">
          <TabsList>
            <TabsTrigger value="chat"><MessageCircle className="w-4 h-4 mr-1" /> Chat</TabsTrigger>
            <TabsTrigger value="logs"><History className="w-4 h-4 mr-1" /> Logs</TabsTrigger>
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-1" /> Usuários</TabsTrigger>
            {viewAs && <TabsTrigger value="impersonate"><Eye className="w-4 h-4 mr-1" /> Visão do Usuário</TabsTrigger>}
          </TabsList>

          <TabsContent value="chat" className="mt-4">
            <SupportChat />
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Filtrar logs..." value={searchLogs} onChange={e => setSearchLogs(e.target.value)} className="pl-10" />
            </div>
            {loading ? <p className="text-muted-foreground">Carregando...</p> : (
              <div className="rounded-lg border border-border overflow-hidden max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map(l => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(l.created_at), "dd/MM HH:mm", { locale: ptBR })}</TableCell>
                        <TableCell className="text-sm text-foreground">{l.action}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{l.entity_type}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{l.entity_id?.slice(0, 8) ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {filteredLogs.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Nenhum log encontrado.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou telefone..." value={searchUsers} onChange={e => setSearchUsers(e.target.value)} className="pl-10" />
            </div>
            <div className="rounded-lg border border-border overflow-hidden max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(u => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium text-foreground">{u.first_name} {u.last_name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.phone ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {u.roles.map((r: string) => <Badge key={r} variant="outline" className="text-[10px]">{roleLabel[r] ?? r}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setViewAs(u)}>
                          <Eye className="w-3 h-3 mr-1" /> Ver como
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {viewAs && (
            <TabsContent value="impersonate" className="mt-4">
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="w-5 h-5" /> Simulação: {viewAs.first_name} {viewAs.last_name}
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => setViewAs(null)}>Fechar</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Nome</p>
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
                        {viewAs.roles.map((r: string) => <Badge key={r} variant="secondary" className="text-xs">{roleLabel[r] ?? r}</Badge>)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      A simulação real (impersonation) requer acesso ao Supabase Admin. Aqui você visualiza o perfil e dados do usuário para orientá-lo por telefone.
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
