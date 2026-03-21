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
  Handshake, Bot, ShieldCheck, ArrowRight,
  Activity, RefreshCw, Globe, FileSearch, Monitor,
  Zap, TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PanelInfo {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  accentRing: string;
  route: string;
  roleKey: string;
  onlineCount: number;
  totalUsers: number;
  recentUsers: { name: string; page: string; lastSeen: string }[];
}

const PANELS: Omit<PanelInfo, "onlineCount" | "totalUsers" | "recentUsers">[] = [
  { id: "patient", label: "Paciente", description: "Agendamentos, consultas e saúde", icon: Users, gradient: "from-blue-500 to-blue-600", iconBg: "bg-blue-500/12", accentRing: "ring-blue-500/20", route: "/dashboard?role=patient", roleKey: "patient" },
  { id: "doctor", label: "Médico", description: "Consultas, prontuários e receitas", icon: Stethoscope, gradient: "from-emerald-500 to-teal-600", iconBg: "bg-emerald-500/12", accentRing: "ring-emerald-500/20", route: "/dashboard?role=doctor", roleKey: "doctor" },
  { id: "laudista", label: "Médico Laudista", description: "Fila de exames e laudos", icon: FileSearch, gradient: "from-cyan-500 to-sky-600", iconBg: "bg-cyan-500/12", accentRing: "ring-cyan-500/20", route: "/dashboard?role=laudista", roleKey: "doctor" },
  { id: "clinic", label: "Clínica", description: "Gestão de médicos e afiliações", icon: Building2, gradient: "from-violet-500 to-purple-600", iconBg: "bg-violet-500/12", accentRing: "ring-violet-500/20", route: "/dashboard?role=clinic", roleKey: "clinic" },
  { id: "receptionist", label: "Recepção", description: "Agendas, check-in e cobranças", icon: Monitor, gradient: "from-amber-500 to-orange-600", iconBg: "bg-amber-500/12", accentRing: "ring-amber-500/20", route: "/dashboard?role=receptionist", roleKey: "receptionist" },
  { id: "support", label: "Suporte", description: "Tickets, logs e monitoramento", icon: Headphones, gradient: "from-rose-500 to-pink-600", iconBg: "bg-rose-500/12", accentRing: "ring-rose-500/20", route: "/dashboard?role=support", roleKey: "support" },
  { id: "partner", label: "Parceiro", description: "Validações e integrações", icon: Handshake, gradient: "from-teal-500 to-emerald-600", iconBg: "bg-teal-500/12", accentRing: "ring-teal-500/20", route: "/dashboard?role=partner", roleKey: "partner" },
  { id: "admin", label: "Administração", description: "Controle total do sistema", icon: ShieldCheck, gradient: "from-primary to-blue-700", iconBg: "bg-primary/12", accentRing: "ring-primary/20", route: "/dashboard?role=admin", roleKey: "admin" },
  { id: "ai-assistant", label: "Assistente IA", description: "Chat, triagem e documentos", icon: Bot, gradient: "from-purple-500 to-fuchsia-600", iconBg: "bg-purple-500/12", accentRing: "ring-purple-500/20", route: "/dashboard/ai-assistant", roleKey: "ai-assistant" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
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
      const { data: onlineUsers } = await supabase
        .from("user_presence")
        .select("user_id, current_page, last_seen_at, is_online")
        .eq("is_online", true)
        .gte("last_seen_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

      const { data: allRoles } = await supabase
        .from("user_roles")
        .select("user_id, role");

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

      const roleTotals: Record<string, number> = {};
      (allRoles ?? []).forEach(r => {
        roleTotals[r.role] = (roleTotals[r.role] ?? 0) + 1;
      });

      const panelOnlineMap: Record<string, { name: string; page: string; lastSeen: string }[]> = {};
      
      (onlineUsers ?? []).forEach(u => {
        const page = u.current_page ?? "/dashboard";
        const roles = onlineRolesMap.get(u.user_id) ?? ["patient"];
        const name = profilesMap.get(u.user_id) ?? "Usuário";

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
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl space-y-8">

        {/* Hero Header */}
        <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-secondary/5 to-purple-500/5 border border-border/40 p-6 sm:p-8">
          {/* Ambient orbs */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-lg shadow-primary/25">
                  <LayoutGrid className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-success flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-success-foreground animate-ping" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Centro de Painéis
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-warning" />
                  Monitore e acesse todos os painéis em tempo real
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Stats pills */}
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-2.5 shadow-sm">
                <div className="relative">
                  <span className="w-2.5 h-2.5 rounded-full bg-success block" />
                  <span className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-success animate-ping opacity-75" />
                </div>
                <span className="text-lg font-bold text-foreground">{totalOnline}</span>
                <span className="text-xs text-muted-foreground">online</span>
                <span className="w-px h-5 bg-border mx-1" />
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-lg font-bold text-foreground">{totalUsers}</span>
                <span className="text-xs text-muted-foreground">total</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-2 h-10 px-4 bg-card/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm"
                onClick={() => fetchPresence(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Presence bar */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/40 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-secondary to-purple-500" />
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground">Presença em Tempo Real</span>
                <span className="text-[10px] text-muted-foreground ml-auto font-mono bg-muted/50 px-2 py-0.5 rounded-md">
                  {format(lastRefresh, "HH:mm:ss", { locale: ptBR })}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {panels.filter(p => p.onlineCount > 0).map(p => {
                  const Icon = p.icon;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Badge
                        variant="secondary"
                        className={`gap-1.5 text-xs py-1.5 px-3 ring-1 ${p.accentRing} bg-card hover:scale-105 transition-transform cursor-default`}
                      >
                        <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${p.gradient} flex items-center justify-center`}>
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        {p.label}: <span className="font-bold text-foreground">{p.onlineCount}</span>
                      </Badge>
                    </motion.div>
                  );
                })}
                {panels.every(p => p.onlineCount === 0) && (
                  <span className="text-xs text-muted-foreground italic">Nenhum usuário online no momento</span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Panel grid */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {panels.map((panel) => {
            const Icon = panel.icon;
            const hasOnline = panel.onlineCount > 0;
            return (
              <motion.div
                key={panel.id}
                variants={fadeUp}
                whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`relative overflow-hidden cursor-pointer group border-border/40 bg-card/90 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 ring-1 ring-transparent hover:ring-1 hover:${panel.accentRing}`}
                  onClick={() => navigate(panel.route)}
                >
                  {/* Top gradient accent line */}
                  <div className={`h-1 bg-gradient-to-r ${panel.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                  
                  {/* Subtle corner glow on hover */}
                  <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${panel.gradient} opacity-0 group-hover:opacity-[0.06] blur-2xl transition-opacity duration-500 pointer-events-none`} />

                  {/* Online ping badge */}
                  {hasOnline && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="relative flex items-center gap-1.5 bg-success/10 text-success px-2.5 py-1 rounded-full text-xs font-bold">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                        </span>
                        {panel.onlineCount}
                      </div>
                    </div>
                  )}

                  <CardContent className="p-5 pt-4">
                    <div className="flex items-start gap-4">
                      {/* Icon with gradient background */}
                      <div className={`relative w-13 h-13 rounded-2xl bg-gradient-to-br ${panel.gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}
                        style={{ width: 52, height: 52 }}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{panel.label}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{panel.description}</p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/40">
                      {panel.totalUsers > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          <span className="font-medium">{panel.totalUsers}</span>
                          <span>cadastrados</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="font-medium">{panel.onlineCount}</span>
                        <span>online</span>
                      </div>
                      <div className="ml-auto w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-300">
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>

                    {/* Recent online users */}
                    {panel.recentUsers.length > 0 && (
                      <div className="mt-3 space-y-1.5 bg-muted/30 rounded-xl p-2.5">
                        {panel.recentUsers.slice(0, 3).map((u, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px]">
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                            </span>
                            <span className="text-foreground font-medium truncate">{u.name}</span>
                            <span className="text-muted-foreground ml-auto truncate max-w-[80px] font-mono text-[10px]">{u.page}</span>
                          </div>
                        ))}
                        {panel.recentUsers.length > 3 && (
                          <p className="text-[10px] text-muted-foreground pl-4">
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
