import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CreditCard, CheckCircle2, Clock, XCircle, ChevronLeft, Star, Zap, Shield, Download, Filter, CalendarDays, X } from "lucide-react";
import { jsPDF } from "jspdf";
import { format, differenceInDays, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getPatientNav } from "./patientNav";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  active: {
    label: "Ativa",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: "bg-success/10 text-success border-success/20",
  },
  cancelled: {
    label: "Cancelada",
    icon: <XCircle className="w-3.5 h-3.5" />,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  expired: {
    label: "Vencida",
    icon: <Clock className="w-3.5 h-3.5" />,
    className: "bg-muted text-muted-foreground border-border",
  },
};

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

const PaymentHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<SubscriptionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) fetchPayments();
  }, [user]);

  const fetchPayments = async () => {
    const { data: subsData } = await supabase
      .from("subscriptions")
      .select("id, plan_id, status, starts_at, expires_at, created_at, payment_method, notes")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (!subsData || subsData.length === 0) {
      setLoading(false);
      return;
    }

    const planIds = [...new Set(subsData.map((s) => s.plan_id))];
    const { data: plans } = await supabase
      .from("plans")
      .select("id, name, price, description, features, interval")
      .in("id", planIds);
    const planMap = new Map(plans?.map((p) => [p.id, p]) ?? []);

    setSubs(
      subsData.map((s) => ({
        ...s,
        plan_name: planMap.get(s.plan_id)?.name ?? "—",
        plan_price: planMap.get(s.plan_id)?.price ?? 0,
        plan_description: planMap.get(s.plan_id)?.description ?? "",
        plan_interval: planMap.get(s.plan_id)?.interval ?? "monthly",
        plan_features: planMap.get(s.plan_id)?.features ?? [],
      }))
    );
    setLoading(false);
  };

  const filteredSubs = useMemo(() => {
    return subs.filter((s) => {
      if (filterMethod !== "all" && s.payment_method !== filterMethod) return false;
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (dateFrom && isBefore(new Date(s.created_at), startOfDay(dateFrom))) return false;
      if (dateTo && isAfter(new Date(s.created_at), endOfDay(dateTo))) return false;
      return true;
    });
  }, [subs, filterMethod, filterStatus, dateFrom, dateTo]);

  const hasActiveFilters = filterMethod !== "all" || filterStatus !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setFilterMethod("all");
    setFilterStatus("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const activeSub = subs.find((s) => s.status === "active");
  const totalSpent = filteredSubs
    .filter((s) => s.status !== "cancelled")
    .reduce((acc, s) => acc + Number(s.plan_price), 0);

  const generateReceipt = (s: SubscriptionEntry) => {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();

    doc.setFillColor(0, 168, 120);
    doc.rect(0, 0, w, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("AloClínica", 20, 22);
    doc.setFontSize(10);
    doc.text("Recibo de Pagamento", 20, 32);

    doc.setTextColor(40, 40, 40);
    let y = 55;
    const line = (label: string, value: string) => {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(label, 20, y);
      doc.setFont("helvetica", "bold");
      doc.text(value, 90, y);
      y += 10;
    };

    line("Plano:", s.plan_name);
    line("Valor:", `R$ ${Number(s.plan_price).toFixed(2)}`);
    line("Status:", s.status === "active" ? "Ativa" : s.status === "cancelled" ? "Cancelada" : "Vencida");
    line("Método:", s.payment_method === "credit_card" ? "Cartão de Crédito" : s.payment_method === "pix" ? "PIX" : s.payment_method === "boleto" ? "Boleto" : s.payment_method ?? "—");
    line("Data:", format(new Date(s.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }));
    if (s.starts_at) line("Início:", format(new Date(s.starts_at), "dd/MM/yyyy", { locale: ptBR }));
    if (s.expires_at) line("Expiração:", format(new Date(s.expires_at), "dd/MM/yyyy", { locale: ptBR }));
    line("ID Transação:", s.id.slice(0, 8).toUpperCase());

    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, w - 20, y);
    y += 12;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Este documento é um comprovante de pagamento gerado automaticamente.", 20, y);
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 20, y + 6);

    doc.save(`recibo-aloclinica-${s.id.slice(0, 8)}.pdf`);
  };

  const daysLeft = activeSub?.expires_at
    ? differenceInDays(new Date(activeSub.expires_at), new Date())
    : null;

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("payments")}>
      <div className="max-w-3xl space-y-6">
        <button
          onClick={() => navigate("/dashboard?role=patient")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Voltar ao painel
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Histórico de Pagamentos</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Suas assinaturas e pagamentos realizados</p>
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-primary-foreground" />
            )}
          </Button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <Card className="border-border">
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Payment method */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Método</label>
                  <Select value={filterMethod} onValueChange={setFilterMethod}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pix">⚡ PIX</SelectItem>
                      <SelectItem value="credit_card">💳 Cartão</SelectItem>
                      <SelectItem value="boleto">📄 Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                      <SelectItem value="expired">Vencida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date from */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">De</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("h-9 w-full text-xs justify-start", !dateFrom && "text-muted-foreground")}>
                        <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                        {dateFrom ? format(dateFrom, "dd/MM/yy") : "Início"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date to */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Até</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("h-9 w-full text-xs justify-start", !dateTo && "text-muted-foreground")}>
                        <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                        {dateTo ? format(dateTo, "dd/MM/yy") : "Fim"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {filteredSubs.length} de {subs.length} resultado{subs.length !== 1 ? "s" : ""}
                  </p>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={clearFilters}>
                    <X className="w-3 h-3" /> Limpar filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary KPIs */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Total investido",
                value: `R$ ${totalSpent.toFixed(2)}`,
                icon: CreditCard,
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                label: "Assinaturas",
                value: filteredSubs.length,
                icon: Star,
                color: "text-secondary",
                bg: "bg-secondary/10",
              },
              {
                label: daysLeft !== null && daysLeft >= 0 ? "Dias restantes" : "Status",
                value: daysLeft !== null && daysLeft >= 0 ? daysLeft : activeSub ? "Ativo" : "—",
                icon: Shield,
                color: "text-success",
                bg: "bg-success/10",
              },
            ].map((k) => (
              <Card key={k.label} className="border-border">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    <div className={`w-7 h-7 rounded-lg ${k.bg} flex items-center justify-center`}>
                      <k.icon className={`w-4 h-4 ${k.color}`} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-foreground">{k.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Active plan highlight */}
        {!loading && activeSub && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Plano Ativo
                </CardTitle>
                <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-success/10 text-success border-success/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div>
                  <p className="text-xl font-bold text-foreground">{activeSub.plan_name}</p>
                  {activeSub.plan_description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{activeSub.plan_description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {activeSub.starts_at && (
                      <span>Início: {format(new Date(activeSub.starts_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                    )}
                    {activeSub.expires_at && (
                      <span>· Expira: {format(new Date(activeSub.expires_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                    )}
                  </div>
                  {daysLeft !== null && daysLeft <= 15 && daysLeft >= 0 && (
                    <p className="mt-2 text-xs font-medium text-warning bg-warning/10 border border-warning/20 px-2.5 py-1 rounded-lg inline-block">
                      ⚠️ Expira em {daysLeft} dia{daysLeft !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-foreground">
                    R$ {Number(activeSub.plan_price).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    /{activeSub.plan_interval === "monthly" ? "mês" : activeSub.plan_interval === "yearly" ? "ano" : activeSub.plan_interval}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 text-xs"
                    onClick={() => navigate("/dashboard/plans")}
                  >
                    Trocar plano
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No active plan CTA */}
        {!loading && !activeSub && subs.length === 0 && (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <CreditCard className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="font-medium text-foreground mb-1">Nenhum plano ativo</p>
              <p className="text-sm text-muted-foreground mb-4">Assine um plano para ter acesso a consultas ilimitadas</p>
              <Button className="bg-gradient-hero text-primary-foreground" onClick={() => navigate("/dashboard/plans")}>
                Ver planos disponíveis
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment history list */}
        {!loading && filteredSubs.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> Histórico completo
            </h2>
            <div className="space-y-3">
              {filteredSubs.map((s) => {
                const cfg = statusConfig[s.status] ?? statusConfig.expired;
                return (
                  <Card key={s.id} className="border-border hover:shadow-sm transition-shadow">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-3 flex-col sm:flex-row">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <CreditCard className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-sm">{s.plan_name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(s.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                            {s.payment_method && (
                              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                {s.payment_method === "credit_card"
                                  ? "💳 Cartão de crédito"
                                  : s.payment_method === "pix"
                                  ? "⚡ PIX"
                                  : s.payment_method === "boleto"
                                  ? "📄 Boleto"
                                  : s.payment_method}
                              </p>
                            )}
                            {s.expires_at && (
                              <p className="text-xs text-muted-foreground">
                                Expira: {format(new Date(s.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                          <p className="font-bold text-foreground text-base">
                            R$ {Number(s.plan_price).toFixed(2)}
                          </p>
                          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.className}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs gap-1 text-muted-foreground hover:text-foreground"
                            onClick={(e) => { e.stopPropagation(); generateReceipt(s); }}
                          >
                            <Download className="w-3.5 h-3.5" /> Recibo
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* No results after filter */}
        {!loading && subs.length > 0 && filteredSubs.length === 0 && (
          <Card className="border-border">
            <CardContent className="py-10 text-center">
              <Filter className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-medium text-foreground mb-1">Nenhum resultado</p>
              <p className="text-sm text-muted-foreground mb-3">Nenhum pagamento encontrado com os filtros selecionados</p>
              <Button variant="outline" size="sm" onClick={clearFilters}>Limpar filtros</Button>
            </CardContent>
          </Card>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                      <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentHistory;
