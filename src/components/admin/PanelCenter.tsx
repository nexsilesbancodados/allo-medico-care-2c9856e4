import { logError } from "@/lib/logger";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminNav } from "@/components/admin/adminNav";
import {
  Users, Stethoscope, Building2, Headphones, LayoutGrid,
  Handshake, Megaphone, Bot, ShieldCheck, ArrowRight,
  Activity, RefreshCw, Monitor, Globe, FileSearch,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PanelInfo {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  emoji: string;
  color: string;
  bgColor: string;
  route: string;
  roleKey: string; // maps to user_roles.role or page pattern
  onlineCount: number;
  totalUsers: number;
  recentUsers: { name: string; page: string; lastSeen: string }[];
}

const PANELS: Omit<PanelInfo, "onlineCount" | "totalUsers" | "recentUsers">[] = [
  { id: "patient", label: "Paciente", description: "Agendamentos, consultas e saúde", icon: Users, emoji: "👤", color: "text-blue-500", bgColor: "bg-blue-500/10", route: "/dashboard?role=patient", roleKey: "patient" },
  { id: "doctor", label: "Médico", description: "Consultas, prontuários e receitas", icon: Stethoscope, emoji: "🩺", color: "text-emerald-500", bgColor: "bg-emerald-500/10", route: "/dashboard?role=doctor", roleKey: "doctor" },
  { id: "laudista", label: "Médico Laudista", description: "Fila de exames, laudos e templates", icon: FileSearch, emoji: "🔬", color: "text-cyan-500", bgColor: "bg-cyan-500/10", route: "/dashboard?role=laudista", roleKey: "doctor" },
  { id: "clinic", label: "Clínica", description: "Gestão de médicos e afiliações", icon: Building2, emoji: "🏢", color: "text-violet-500", bgColor: "bg-violet-500/10", route: "/dashboard?role=clinic", roleKey: "clinic" },
  { id: "receptionist", label: "Recepção", description: "Agendas, check-in e cobranças", icon: Monitor, emoji: "🏥", color: "text-amber-500", bgColor: "bg-amber-500/10", route: "/dashboard?role=receptionist", roleKey: "receptionist" },
  { id: "support", label: "Suporte", description: "Tickets, logs e monitoramento", icon: Headphones, emoji: "🎧", color: "text-rose-500", bgColor: "bg-rose-500/10", route: "/dashboard?role=support", roleKey: "support" },
  { id: "partner", label: "Parceiro", description: "Validações e integrações", icon: Handshake, emoji: "🤝", color: "text-teal-500", bgColor: "bg-teal-500/10", route: "/dashboard?role=partner", roleKey: "partner" },
  
  { id: "admin", label: "Administração", description: "Controle total do sistema", icon: ShieldCheck, emoji: "🛡️", color: "text-primary", bgColor: "bg-primary/10", route: "/dashboard?role=admin", roleKey: "admin" },
  { id: "ai-assistant", label: "Assistente IA", description: "Chat, triagem e documentos", icon: Bot, emoji: "🤖", color: "text-purple-500", bgColor: "bg-purple-500/10", route: "/dashboard/ai-assistant", roleKey: "ai-assistant" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const PanelCenter = () => {
  const navigate = useNavigate();
  const [panels, setPanels] = useState<PanelInfo[]>(
    PANELS.map(p => ({ ...p, onlineCount: 0, totalUsers: 0, recentUsers: [] }))
  );
  const [totalOnline, setTotalOnline] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchPresence = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);

    try {
      // 1. Get all online users from user_presence
      const { data: onlineUsers } = await supabase
        .from("user_presence")
        .select("user_id, current_page, last_seen_at, is_online")
        .eq("is_online", true)
        .gte("last_seen_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

      // 2. Get total users per role
      const { data: allRoles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      // 3. Get roles for online users
      const onlineUserIds = [...new Set((onlineUsers ?? []).map(u => u.user_id))];
      
      let onlineRolesMap: Map<string, string[]> = new Map();
      if (onlineUserIds.length > 0) {
        const { data: onlineRoles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", onlineUserIds);
        
        (onlineRoles ?? []).forEach(r => {
          const existing = onlineRolesMap.get(r.user_id) ?? [];
          existing.push(r.role);
          onlineRolesMap.set(r.user_id, existing);
        });
      }

      // 4. Get profiles for online users
      let profilesMap: Map<string, string> = new Map();
      if (onlineUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", onlineUserIds);
        
        (profiles ?? []).forEach(p => {
          profilesMap.set(p.user_id, `${p.first_name} ${p.last_name}`.trim() || "Usuário");
        });
      }

      // 5. Count totals per role
      const roleTotals: Record<string, number> = {};
      (allRoles ?? []).forEach(r => {
        roleTotals[r.role] = (roleTotals[r.role] ?? 0) + 1;
      });

      // 6. Determine which panel each online user is on based on current_page
      const panelOnlineMap: Record<string, { name: string; page: string; lastSeen: string }[]> = {};
      
      (onlineUsers ?? []).forEach(u => {
        const page = u.current_page ?? "/dashboard";
        const roles = onlineRolesMap.get(u.user_id) ?? ["patient"];
        const name = profilesMap.get(u.user_id) ?? "Usuário";

        // Determine panel from page URL or role
        let panelId = "patient";
        if (page.includes("ai-assistant")) panelId = "ai-assistant";
        else if (page.includes("role=admin") || page.includes("/admin/")) panelId = "admin";
        else if (page.includes("role=laudista") || page.includes("/laudista/")) panelId = "laudista";
        else if (page.includes("role=doctor") || page.includes("/doctor/") || page.includes("/availability") || page.includes("/prescriptions") || page.includes("/earnings") || page.includes("/patients") || page.includes("/certificates")) panelId = "doctor";
        else if (page.includes("role=receptionist") || page.includes("/reception/")) panelId = "receptionist";
        else if (page.includes("role=support")) panelId = "support";
        else if (page.includes("role=clinic") || page.includes("/clinic/")) panelId = "clinic";
        else if (page.includes("role=partner")) panelId = "partner";
        
        else if (roles.includes("doctor") && !page.includes("role=")) panelId = "doctor";
        else if (roles.includes("admin") && !page.includes("role=")) panelId = "admin";
        else panelId = "patient";

        if (!panelOnlineMap[panelId]) panelOnlineMap[panelId] = [];
        panelOnlineMap[panelId].push({
          name,
          page: page.replace("/dashboard", "").replace("?role=", "").slice(0, 30) || "Início",
          lastSeen: u.last_seen_at,
        });
      });

      // 7. Build final panel data
      const updatedPanels = PANELS.map(p => ({
        ...p,
        onlineCount: panelOnlineMap[p.id]?.length ?? 0,
        totalUsers: p.id === "ai-assistant" ? 0 : (roleTotals[p.roleKey] ?? 0),
        recentUsers: (panelOnlineMap[p.id] ?? []).slice(0, 5),
      }));

      setPanels(updatedPanels);
      setTotalOnline(onlineUserIds.length);
      
      const uniqueUserIds = new Set((allRoles ?? []).map(r => r.user_id));
      setTotalUsers(uniqueUserIds.size);
    } catch (e) {
      logError("PanelCenter fetch error", e);
    }

    setRefreshing(false);
    setLastRefresh(new Date());
  };

  useEffect(() => {
    fetchPresence();
    const interval = setInterval(() => fetchPresence(), 15000);
    return () => clearInterval(interval);
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("panel-center-presence")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, () => {
        fetchPresence();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <DashboardLayout title="Centro de Painéis" nav={getAdminNav("switch-panel")}>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl space-y-6">

        {/* Header */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-primary" />
              </div>
              Centro de Painéis
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse qualquer painel e monitore usuários em tempo real
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-semibold text-foreground">{totalOnline}</span>
              <span className="text-muted-foreground">online</span>
              <span className="text-muted-foreground mx-1">·</span>
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{totalUsers} total</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5 h-9"
              onClick={() => fetchPresence(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </motion.div>

        {/* Global stats bar */}
        <motion.div variants={fadeUp}>
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm font-semibold text-foreground">Presença em Tempo Real</span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  Atualizado: {format(lastRefresh, "HH:mm:ss", { locale: ptBR })}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {panels.filter(p => p.onlineCount > 0).map(p => {
                  const Icon = p.icon;
                  return (
                    <Badge key={p.id} variant="secondary" className="gap-1.5 text-xs py-1 px-2.5">
                      <Icon className={`w-3 h-3 ${p.color}`} />
                      {p.label}: <span className="font-bold">{p.onlineCount}</span>
                    </Badge>
                  );
                })}
                {panels.every(p => p.onlineCount === 0) && (
                  <span className="text-xs text-muted-foreground">Nenhum usuário online no momento</span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Panel grid */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {panels.map((panel) => {
            const Icon = panel.icon;
            return (
              <motion.div
                key={panel.id}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Card
                  className="border-border/50 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                  onClick={() => navigate(panel.route)}
                >
                  {/* Online indicator */}
                  {panel.onlineCount > 0 && (
                    <div className="absolute top-3 right-3">
                      <div className="flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        {panel.onlineCount}
                      </div>
                    </div>
                  )}

                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${panel.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-6 h-6 ${panel.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-foreground">{panel.label}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{panel.description}</p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50">
                      {panel.totalUsers > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{panel.totalUsers} cadastrados</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Activity className="w-3 h-3" />
                        <span>{panel.onlineCount} {panel.onlineCount === 1 ? "online" : "online"}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/50 ml-auto group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>

                    {/* Recent online users */}
                    {panel.recentUsers.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {panel.recentUsers.slice(0, 3).map((u, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                            <span className="text-foreground font-medium truncate">{u.name}</span>
                            <span className="text-muted-foreground ml-auto truncate max-w-[80px]">{u.page}</span>
                          </div>
                        ))}
                        {panel.recentUsers.length > 3 && (
                          <p className="text-[10px] text-muted-foreground pl-3.5">
                            +{panel.recentUsers.length - 3} mais...
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default PanelCenter;
