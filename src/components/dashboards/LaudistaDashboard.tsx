import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getLaudistaNav } from "@/components/laudista/laudistaNav";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  ClipboardList, FileText, Clock, CheckCircle2, AlertTriangle,
  RefreshCw, Sparkles, ArrowRight, Target, Activity, BarChart2, Eye, UserCheck, Loader2
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SectionErrorBoundary from "@/components/ui/section-error-boundary";
import { toast } from "sonner";
import { useGsapEntrance } from "@/hooks/use-gsap-entrance";
import { HeroBanner } from "./HeroBanner";
import { StatBento } from "./StatBento";
import { ActionPills } from "./ActionPills";
import { PingoBannerCard } from "@/components/mascot/PingoBannerCard";
import { PremiumHero } from "./PremiumHero";
import { AlertBox } from "./AlertBox";
import mascotReading from "@/assets/mascot-reading.png";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } } };

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_review: "Em Análise",
  reported: "Laudado",
  delivered: "Entregue",
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  in_review: "bg-primary/10 text-primary border-primary/20",
  reported: "bg-success/10 text-success border-success/20",
  delivered: "bg-muted text-muted-foreground border-border",
};

const priorityColors: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
  normal: "bg-muted text-muted-foreground border-border",
};

const LaudistaDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const kpiRef = useGsapEntrance({ stagger: 0.07, y: 14, delay: 0.2 });
  const queryClient = useQueryClient();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const now = new Date();

  const { data: doctorProfile } = useQuery({
    queryKey: ["laudista-doctor-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("doctor_profiles")
        .select("id, crm, crm_state, crm_verified")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["laudista-stats", doctorProfile?.id],
    queryFn: async () => {
      const dpId = doctorProfile!.id;
      
      const [pendingRes, myInReviewRes, myReportedRes, todayRes] = await Promise.all([
        supabase.from("exam_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("exam_requests").select("id", { count: "exact", head: true }).eq("assigned_to", dpId).eq("status", "in_review"),
        supabase.from("exam_reports").select("id", { count: "exact", head: true }).eq("reporter_id", dpId),
        supabase.from("exam_reports").select("id", { count: "exact", head: true }).eq("reporter_id", dpId).gte("created_at", new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()),
      ]);
      
      return {
        pending: pendingRes.count ?? 0,
        inReview: myInReviewRes.count ?? 0,
        totalReported: myReportedRes.count ?? 0,
        todayReported: todayRes.count ?? 0,
      };
    },
    enabled: !!doctorProfile?.id,
  });

  const { data: recentExams, isLoading: loadingExams, isRefetching: refreshing } = useQuery({
    queryKey: ["laudista-recent-exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_requests")
        .select("*")
        .in("status", ["pending", "in_review"])
        .order("priority", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as { id: string; exam_type: string; status: string; priority: string; created_at: string; assigned_to: string | null; [key: string]: any }[];
    },
    enabled: !!user,
  });

  const handleClaim = async (examId: string) => {
    if (!doctorProfile?.id) return;
    setClaimingId(examId);
    try {
      const { error } = await supabase
        .from("exam_requests")
        .update({ assigned_to: doctorProfile.id, status: "in_review" })
        .eq("id", examId);
      if (error) throw error;
      toast.success("Exame assumido!", { description: "Você pode iniciar o laudo agora." });
      queryClient.invalidateQueries({ queryKey: ["laudista-recent-exams"] });
      queryClient.invalidateQueries({ queryKey: ["laudista-stats"] });
    } catch (err: unknown) {
      toast.error("Erro", { description: err instanceof Error ? err.message : "Erro inesperado" });
    } finally {
      setClaimingId(null);
    }
  };



  const urgentCount = recentExams?.filter(e => e.priority === "urgent").length ?? 0;

  return (
    <DashboardLayout title="Laudista" nav={getLaudistaNav("home")} role="doctor">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 pb-24 md:pb-8">

        {/* ── Premium Hero ── */}
        <div className="-mx-4 -mt-4 md:-mx-6 md:-mt-5 lg:-mx-8 lg:-mt-6">
        <HeroBanner
          gradient="from-[#040D24] via-[#0F2B5E] to-[#1e40af]"
          pingoSrc={mascotReading}
          pingoAlt="Pingo"
          liveDot={true}
          liveColor="red"
          bubble={{
            greeting: "📋 Telelaudo",
            name: "Painel Laudista",
            sub: "2 exames urgentes",
          }}
          kpis={[
            { label: "Fila", value: stats?.pending ?? 0 },
            { label: "Em análise", value: stats?.inReview ?? 0 },
            { label: "Laudados", value: stats?.reported ?? 0 },
            { label: "Hoje", value: stats?.todayReported ?? 0 },
          ]}
          loading={loading}
          onRefresh={() => { queryClient.refetchQueries({ queryKey: ["laudista-recent-exams"] }); }}
          refreshing={refreshing}
        />
      </div>

      {/* ── CONTENT ── */}
      <div className="mt-4 space-y-4 pb-24 md:pb-8">

        {/* ── Bento Stats — full width ── */}
        <StatBento loading={loadingStats} stats={[
          { label: "Na fila (pendente)", value: stats?.pending ?? 0, icon: "📋", iconBg: "bg-amber-50 dark:bg-amber-950/30", valueClass: "text-amber-700 dark:text-amber-400", accentClass: "bg-amber-500" },
          { label: "Em análise", value: stats?.inReview ?? 0, icon: "🔍", iconBg: "bg-blue-50 dark:bg-blue-950/30", valueClass: "text-[#1255C8] dark:text-blue-400", accentClass: "bg-blue-500" },
          { label: "Total laudados", value: stats?.totalReported ?? 0, icon: "✅", iconBg: "bg-emerald-50 dark:bg-emerald-950/30", valueClass: "text-emerald-700 dark:text-emerald-400", trend: 22, accentClass: "bg-emerald-500" },
          { label: "Laudados hoje", value: stats?.todayReported ?? 0, icon: "🎯", iconBg: "bg-violet-50 dark:bg-violet-950/30", valueClass: "text-violet-600 dark:text-violet-400", accentClass: "bg-violet-500" },
        ]} />

        {/* ── Desktop 2-col grid ── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">

        {/* LEFT col */}
        <div className="space-y-4">

        {/* ── Urgent Alert ── */}
        {!loadingExams && urgentCount > 0 && (
          <AlertBox
            variant="danger"
            icon={<span className="text-[20px]">🚨</span>}
            title={`${urgentCount} exame${urgentCount > 1 ? "s" : ""} urgente${urgentCount > 1 ? "s" : ""} — prioridade máxima`}
            subtitle="Laudar imediatamente antes dos exames normais"
            actionLabel="Ver fila urgente"
            onAction={() => navigate("/dashboard/laudista/queue?role=doctor")}
          />
        )}


        {/* Daily Progress */}
        {!loadingStats && (stats?.todayReported ?? 0) > 0 && (
          <motion.div variants={fadeUp}>
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-success to-success/70 flex items-center justify-center shadow-md shadow-success/15">
                      <Target className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Produtividade Hoje</p>
                      <p className="text-[10px] text-muted-foreground">Laudos emitidos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-foreground">{stats?.todayReported}</p>
                    <p className="text-[10px] text-muted-foreground">laudos hoje</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}


        {/* Pingo Banner */}
        </div>{/* end LEFT col */}

        {/* RIGHT col */}
        <div className="space-y-4">
        <PingoBannerCard
          pingImg={mascotReading}
          pingAlt="Pingo"
          pingSize={82}
          bgClass="bg-blue-50 dark:bg-blue-950/20"
          borderClass="border-blue-100 dark:border-blue-900/30"
          label="Fila de exames"
          labelColor="text-blue-600 dark:text-blue-400"
          title="Analise com precisão"
          subtitle="Urgentes no topo — laudar imediatamente"
        />

        {/* Recent Exams Queue */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/50">
            <CardHeader className="pb-3 pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <ClipboardList className="w-3.5 h-3.5 text-white" />
                  </div>
                  Fila de Exames
                  {!loadingExams && recentExams && recentExams.length > 0 && (
                    <Badge className="ml-1 text-[10px] h-5 px-2 bg-primary/10 text-primary border-0">{recentExams.length}</Badge>
                  )}
                </CardTitle>
                <Button size="sm" variant="ghost" className="text-xs text-primary h-8 gap-1 font-semibold" onClick={() => navigate("/dashboard/laudista/queue?role=doctor")}>
                  Ver Tudo <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingExams ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-border/40">
                      <Skeleton className="h-11 w-11 rounded-xl" />
                      <div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
                      <Skeleton className="h-9 w-20 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : !recentExams?.length ? (
                <div className="text-center py-12">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center mb-4 shadow-lg shadow-primary/5"
                  >
                    <Sparkles className="w-8 h-8 text-primary" />
                  </motion.div>
                  <p className="text-sm font-semibold text-foreground mb-1">Fila vazia!</p>
                  <p className="text-xs text-muted-foreground">Nenhum exame pendente no momento 🎉</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentExams.map(exam => (
                    <div
                      key={exam.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all hover:shadow-md hover:-translate-y-1 transition-all duration-200 ${
                        exam.priority === "urgent" ? "border-destructive/30 bg-destructive/5" : "border-border/40 hover:border-primary/20"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${exam.priority === "urgent" ? "from-destructive to-destructive/70" : "from-primary to-secondary"} flex items-center justify-center shrink-0 shadow-md`}>
                          <ClipboardList className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{exam.exam_type}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${statusColors[exam.status] || ""}`}>
                              {statusLabels[exam.status] || exam.status}
                            </Badge>
                            {exam.priority === "urgent" && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-destructive/10 text-destructive border-destructive/20">
                                Urgente
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(exam.created_at), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2">
                        {exam.status === "pending" && (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl h-9 px-4 text-xs gap-1.5 shadow-md shadow-primary/20"
                            onClick={() => handleClaim(exam.id)}
                            disabled={claimingId === exam.id}
                          >
                            {claimingId === exam.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                            Assumir
                          </Button>
                        )}
                        {exam.status === "in_review" && (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-secondary to-primary text-white rounded-xl h-9 px-4 text-xs gap-1.5 shadow-md"
                            onClick={() => navigate(`/dashboard/laudista/report-editor/${exam.id}?role=doctor`)}
                          >
                            <Eye className="w-3 h-3" />
                            Laudar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick actions */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Fila Completa", icon: ClipboardList, href: "/dashboard/laudista/queue?role=doctor", color: "from-primary to-secondary" },
              { label: "Meus Laudos", icon: FileText, href: "/dashboard/laudista/my-reports?role=doctor", color: "from-secondary to-primary" },
              { label: "Financeiro", icon: BarChart2, href: "/dashboard/laudista/financeiro?role=doctor", color: "from-success to-success/70" },
            ].map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.href)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border/40 bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-200 hover:border-primary/20 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-foreground">{action.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
        </div>{/* end RIGHT col */}
        </div>{/* end 2-col grid */}
      </div>{/* end content */}
      </motion.div>
    </DashboardLayout>
  );
};

export default LaudistaDashboard;