import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, Clock, XCircle, Download, Shield, Wifi, ChevronRight } from "lucide-react";
import { jsPDF } from "jspdf";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getPatientNav } from "./patientNav";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import mascotWave from "@/assets/mascot-wave.png";

import type { Json } from "@/integrations/supabase/types";

interface SubscriptionEntry {
  id: string;
  plan_id: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  payment_method: string | null;
  notes: string | null;
  plan_name: string;
  plan_price: number;
  plan_description: string;
  plan_interval: string;
  plan_features: Json;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  active: { label: "Ativa", icon: <CheckCircle2 className="w-3.5 h-3.5" />, className: "bg-success/10 text-success border-success/20" },
  cancelled: { label: "Cancelada", icon: <XCircle className="w-3.5 h-3.5" />, className: "bg-destructive/10 text-destructive border-destructive/20" },
  expired: { label: "Vencida", icon: <Clock className="w-3.5 h-3.5" />, className: "bg-muted text-muted-foreground border-border" },
};

const PaymentHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<SubscriptionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchPayments(); }, [user]);

  const fetchPayments = async () => {
    const { data: subsData } = await supabase
      .from("subscriptions")
      .select("id, plan_id, status, starts_at, expires_at, created_at, payment_method, notes")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (!subsData || subsData.length === 0) { setLoading(false); return; }

    const planIds = [...new Set(subsData.map((s) => s.plan_id))];
    const { data: plans } = await supabase
      .from("plans")
      .select("id, name, price, description, features, interval")
      .in("id", planIds);
    const planMap = new Map(plans?.map((p) => [p.id, p]) ?? []);

    setSubs(subsData.map((s) => ({
      ...s,
      plan_name: planMap.get(s.plan_id)?.name ?? "—",
      plan_price: planMap.get(s.plan_id)?.price ?? 0,
      plan_description: planMap.get(s.plan_id)?.description ?? "",
      plan_interval: planMap.get(s.plan_id)?.interval ?? "monthly",
      plan_features: planMap.get(s.plan_id)?.features ?? [],
    })));
    setLoading(false);
  };

  const activeSub = subs.find((s) => s.status === "active");
  const totalSpent = subs.filter((s) => s.status !== "cancelled").reduce((acc, s) => acc + Number(s.plan_price), 0);
  const daysLeft = activeSub?.expires_at ? differenceInDays(new Date(activeSub.expires_at), new Date()) : null;

  const generateReceipt = (s: SubscriptionEntry) => {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    doc.setFillColor(0, 52, 127);
    doc.rect(0, 0, w, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("AloClínica", 20, 22);
    doc.setFontSize(10);
    doc.text("Recibo de Pagamento", 20, 32);
    doc.setTextColor(40, 40, 40);
    let y = 55;
    const line = (label: string, value: string) => {
      doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text(label, 20, y);
      doc.setFont("helvetica", "bold"); doc.text(value, 90, y); y += 10;
    };
    line("Plano:", s.plan_name);
    line("Valor:", `R$ ${Number(s.plan_price).toFixed(2)}`);
    line("Status:", s.status === "active" ? "Ativa" : s.status === "cancelled" ? "Cancelada" : "Vencida");
    line("Data:", format(new Date(s.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }));
    line("ID:", s.id.slice(0, 8).toUpperCase());
    doc.save(`recibo-aloclinica-${s.id.slice(0, 8)}.pdf`);
  };

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("payments")} role="patient">
      <div className="w-full mx-auto max-w-2xl pb-24 md:pb-6 space-y-6">

        {/* ═══ BANNER — Fatura em aberto ═══ */}
        {!loading && activeSub && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-primary p-6 text-primary-foreground"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/70">
              Fatura em aberto
            </p>
            <p className="font-[Manrope] text-[32px] font-extrabold mt-1">
              R$ {Number(activeSub.plan_price).toFixed(2)}
            </p>
            <p className="text-sm text-primary-foreground/70 mt-0.5">
              {activeSub.expires_at
                ? `Vencimento: ${format(new Date(activeSub.expires_at), "dd/MM/yyyy", { locale: ptBR })}`
                : "Plano ativo"
              }
            </p>
            <div className="flex justify-end mt-4">
              <Button
                className="rounded-full bg-primary-foreground text-primary gap-2 font-bold text-sm"
                onClick={() => navigate("/dashboard/plans")}
              >
                <CreditCard className="w-4 h-4" /> Pagar Agora
              </Button>
            </div>
          </motion.div>
        )}

        {/* ═══ CARTÃO ═══ */}
        {!loading && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground">Meus Cartões</h2>
              <button className="text-sm font-semibold text-primary">+ Novo</button>
            </div>
            {/* Physical card */}
            <div className="rounded-2xl bg-gradient-to-br from-[hsl(240,30%,12%)] to-[hsl(240,25%,18%)] p-5 text-white mb-3">
              <div className="flex items-center justify-between mb-8">
                <Wifi className="w-6 h-6 text-white/60 rotate-90" />
                <CreditCard className="w-6 h-6 text-white/60" />
              </div>
              <p className="text-lg font-semibold tracking-[0.2em] font-mono">
                •••• •••• •••• 8821
              </p>
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-white/70 uppercase tracking-wider">Titular</p>
                <p className="text-xs text-white/70">12/28</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ HISTÓRICO DE PAGAMENTOS ═══ */}
        {!loading && subs.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-3">Histórico de Pagamentos</h2>
            <div className="space-y-3">
              {subs.map((s, i) => {
                const cfg = statusConfig[s.status] ?? statusConfig.expired;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-foreground">{s.plan_name}</p>
                      <p className="text-[13px] text-muted-foreground">
                        {format(new Date(s.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        {s.payment_method && ` · ${s.payment_method === "credit_card" ? "Cartão" : s.payment_method === "pix" ? "PIX" : s.payment_method}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-foreground">R$ {Number(s.plan_price).toFixed(2)}</p>
                      <button
                        className="text-[13px] font-semibold text-primary"
                        onClick={() => generateReceipt(s)}
                      >
                        Ver Recibo
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ EMPTY STATE ═══ */}
        {!loading && subs.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <CreditCard className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="font-bold text-foreground mb-1">Nenhum pagamento</p>
            <p className="text-sm text-muted-foreground mb-4">Seus pagamentos aparecerão aqui</p>
            <Button className="rounded-full" onClick={() => navigate("/dashboard/plans")}>
              Ver planos disponíveis
            </Button>
          </div>
        )}

        {/* ═══ SECURITY CARD ═══ */}
        {!loading && subs.length > 0 && (
          <div className="rounded-2xl p-4 flex items-center gap-4" style={{ backgroundColor: "hsl(30, 100%, 97%)" }}>
            <div className="flex-1">
              <p className="text-[15px] font-bold text-foreground">Segurança em primeiro lugar</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Todos os seus pagamentos são protegidos com criptografia de ponta a ponta.
              </p>
            </div>
            <img src={mascotWave} alt="Pingo" className="w-20 h-20 object-contain shrink-0" loading="lazy" />
          </div>
        )}

        {/* ═══ LOADING ═══ */}
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentHistory;
