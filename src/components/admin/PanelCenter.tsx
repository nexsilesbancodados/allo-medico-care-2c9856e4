import { logError } from "@/lib/logger";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminNav } from "@/components/admin/adminNav";
import {
  Users, Stethoscope, Building2, Headphones,
  Handshake, Bot, ShieldCheck, ArrowRight,
  Activity, RefreshCw, Monitor, TrendingUp, Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HeroBanner } from "@/components/dashboards/HeroBanner";
import { cn } from "@/lib/utils";
import pingoAdmin from "@/assets/pingo-admin.png";

interface RecentUser { name: string; page: string; lastSeen: string }
interface PanelInfo {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  accentRing: string;
  route: string;
  roleKey: string;
  onlineCount: number;
  totalUsers: number;
  recentUsers: RecentUser[];
}

const PANELS: Omit<PanelInfo, "onlineCount" | "totalUsers" | "recentUsers">[] = [
  { id: "patient", label: "Paciente", description: "Agendamentos e jornada de saúde", icon: Users, gradient: "from-blue-500 to-blue-600", accentRing: "ring-blue-500/20", route: "/dashboard?role=patient", roleKey: "patient" },
  { id: "doctor", label: "Médico", description: "Consultas, prontuários e receitas", icon: Stethoscope, gradient: "from-emerald-500 to-teal-600", accentRing: "ring-emerald-500/20", route: "/dashboard?role=doctor", roleKey: "doctor" },
  { id: "clinic", label: "Clínica", description: "Gestão de médicos e afiliações", icon: Building2, gradient: "from-violet-500 to-purple-600", accentRing: "ring-violet-500/20", route: "/dashboard?role=clinic", roleKey: "clinic" },
  { id: "receptionist", label: "Recepção", description: "Agendas, check-in e cobranças", icon: Monitor, gradient: "from-amber-500 to-orange-600", accentRing: "ring-amber-500/20", route: "/dashboard?role=receptionist", roleKey: "receptionist" },
  { id: "support", label: "Suporte", description: "Tickets, logs e monitoramento", icon: Headphones, gradient: "from-rose-500 to-pink-600", accentRing: "ring-rose-500/20", route: "/dashboard?role=support", roleKey: "support" },
  { id: "partner", label: "Parceiro", description: "Validações e integrações", icon: Handshake, gradient: "from-teal-500 to-emerald-600", accentRing: "ring-teal-500/20", route: "/dashboard?role=partner", roleKey: "partner" },
  { id: "admin", label: "Administração", description: "Controle total do sistema", icon: ShieldCheck, gradient: "from-primary to-blue-700", accentRing: "ring-primary/20", route: "/dashboard?role=admin", roleKey: "admin" },
  { id: "ai-assistant", label: "Assistente IA", description: "Chat, triagem e documentos", icon: Bot, gradient: "from-purple-500 to-fuchsia-600", accentRing: "ring-purple-500/20", route: "/dashboard/ai-assistant", roleKey: "ai-assistant" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
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
      const { data: onlineUsers } = await db
        .from("user_presence")
        .select("user_id, current_page, last_seen_at, is_online")
        .eq("is_online", true)
        .gte("last_seen_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

      const { data: allRoles } = await db.from("user_roles").select("user_id, role");

      const onlineUserIds = [...new Set((onlineUsers ?? []).map(u => u.user_id))];

      const onlineRolesMap: Map<string, string[]> = new Map();
      if (onlineUserIds.length > 0) {
        const { data: onlineRoles } = await db
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", onlineUserIds);
        (onlineRoles ?? []).forEach(r => {
          const existing = onlineRolesMap.get(r.user_id) ?? [];
          existing.push(r.role);
          onlineRolesMap.set(r.user_id, existing);
        });
      }

      const profilesMap: Map<string, string> = new Map();
      if (onlineUserIds.length > 0) {
        const { data: profiles } = await db
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", onlineUserIds);
        (profiles ?? []).forEach(p => {
          profilesMap.set(p.user_id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Usuário");
        });
      }

      const roleTotals: Record<string, number> = {};
      (allRoles ?? []).forEach(r => {
        roleTotals[r.role] = (roleTotals[r.role] ?? 0) + 1;
      });

      const panelOnlineMap: Record<string, RecentUser[]> = {};

      (onlineUsers ?? []).forEach(u => {
        const page = u.current_page ?? "/dashboard";
        const roles = onlineRolesMap.get(u.user_id) ?? ["patient"];
        const name = profilesMap.get(u.user_id) ?? "Usuário";

        let panelId = "patient";
        if (page.includes("ai-assistant")) panelId = "ai-assistant";
        else if (page.includes("role=admin") || page.includes("/admin/")) panelId = "admin";
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
    const channel = db
      .channel("panel-center-presence")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, () => {
        fetchPresence();
      })
      .subscribe();
    return () => { db.removeChannel(channel); };
  }, []);

  // ── Live activity feed (most recent 8 across all panels) ──
  const liveActivity = useMemo(() => {
    const all: { name: string; page: string; lastSeen: string; panel: PanelInfo }[] = [];
    panels.forEach(p => p.recentUsers.forEach(u => all.push({ ...u, panel: p })));
    return all
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
      .slice(0, 8);
  }, [panels]);

  const activePanels = panels.filter(p => p.onlineCount > 0).length;

  return (
    <DashboardLayout title="Centro de Painéis" nav={getAdminNav("panel-center")}>
      <motion.div variants={container} initial="hidden" animate="show" className="w-full max-w-7xl mx-auto space-y-5 pb-24 md:pb-8">

        {/* ── Hero ── */}
        <div className="-mx-4 -mt-5 md:-mx-6 md:-mt-5 lg:-mx-8 lg:-mt-6">
          <HeroBanner
            gradient="from-[#0b1220] via-[#1e293b] to-[#0f172a]"
            pingoSrc={pingoAdmin}
            pingoAlt="Pingo Admin"
            liveDot={totalOnline > 0}
            liveColor="green"
            bubble={{
              greeting: "🎛️ Centro de Controle",
              name: "Painéis da Plataforma",
              sub: `${totalOnline} ${totalOnline === 1 ? "pessoa online" : "pessoas online"} • atualizado ${formatDistanceToNow(lastRefresh, { locale: ptBR, addSuffix: true })}`,
            }}
            kpis={[
              { label: "Online agora", value: totalOnline },
              { label: "Cadastrados", value: totalUsers },
              { label: "Painéis ativos", value: activePanels },
              { label: "Total de painéis", value: PANELS.length },
            ]}
            loading={false}
            onRefresh={() => fetchPresence(true)}
            refreshing={refreshing}
          />
        </div>

        {/* ── Live Activity Feed ── */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-emerald-500 via-primary to-purple-500" />
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground leading-tight">Atividade em tempo real</h2>
                  <p className="text-[11px] text-muted-foreground">Últimos {liveActivity.length} eventos de presença</p>
                </div>
                <Badge variant="secondary" className="ml-auto gap-1.5 font-mono text-[10px]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  {format(lastRefresh, "HH:mm:ss", { locale: ptBR })}
                </Badge>
              </div>

              {liveActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Sparkles className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-medium text-foreground">Nenhum usuário online no momento</p>
                  <p className="text-xs text-muted-foreground mt-0.5">A presença atualiza automaticamente a cada 15s</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {liveActivity.map((u, i) => {
                    const Icon = u.panel.icon;
                    return (
                      <motion.button
                        key={`${u.name}-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => navigate(u.panel.route)}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors text-left group"
                      >
                        <div className={cn(
                          "shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm",
                          u.panel.gradient
                        )}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                            </span>
                            <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                          </div>
                          <p className="text-[10.5px] text-muted-foreground font-mono truncate">
                            {u.panel.label} · {u.page || "/"}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Section header ── */}
        <motion.div variants={fadeUp} className="flex items-end justify-between pt-1">
          <div>
            <h2 className="text-base md:text-lg font-bold text-foreground tracking-tight">Acesso aos painéis</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Entre em qualquer painel como administrador</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchPresence(true)}
            disabled={refreshing}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
            Atualizar
          </Button>
        </motion.div>

        {/* ── Panels grid ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {panels.map((panel) => {
            const Icon = panel.icon;
            const hasOnline = panel.onlineCount > 0;
            return (
              <motion.div
                key={panel.id}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={cn(
                    "relative overflow-hidden cursor-pointer group border-border/40 bg-card/90 backdrop-blur-sm transition-all duration-300",
                    "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 ring-1 ring-transparent"
                  )}
                  onClick={() => navigate(panel.route)}
                >
                  <div className={cn("h-[3px] bg-gradient-to-r opacity-70 group-hover:opacity-100 transition-opacity", panel.gradient)} />
                  <div className={cn("absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br opacity-0 group-hover:opacity-[0.08] blur-2xl transition-opacity duration-500 pointer-events-none", panel.gradient)} />

                  {hasOnline && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ring-emerald-500/20">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                        {panel.onlineCount} online
                      </div>
                    </div>
                  )}

                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300",
                        panel.gradient
                      )}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="text-[13.5px] font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                          {panel.label}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                          {panel.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-border/40">
                      <div className="flex items-center gap-3 text-[11px]">
                        {panel.totalUsers > 0 && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span className="font-semibold text-foreground">{panel.totalUsers}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          <span className="font-semibold text-foreground">{panel.onlineCount}</span>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary transition-all duration-300">
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
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
