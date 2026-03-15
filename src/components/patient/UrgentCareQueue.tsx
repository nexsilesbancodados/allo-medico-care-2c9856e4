import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Phone, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { notifyDoctorsNewQueueEntry } from "@/lib/notifications-queue";

const UrgentCareQueue = () => {
  const { user } = useAuth();
  const [shiftInfo, setShiftInfo] = useState<{ shift: string; price: number; label: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [myEntry, setMyEntry] = useState<{ id: string; status: string; position?: number; created_at: string } | null>(null);
  const [queuePosition, setQueuePosition] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    fetchShiftPrice();
    if (user) {
      fetchMyEntry();
      checkDiscountCard();
    }
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("urgent-care-queue")
      .on("postgres_changes", { event: "*", schema: "public", table: "on_demand_queue", filter: `patient_id=eq.${user.id}` }, () => fetchMyEntry())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Timer for wait time
  useEffect(() => {
    if (!myEntry || myEntry.status !== "waiting") return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - new Date(myEntry.created_at).getTime()) / 1000);
      setElapsed(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [myEntry]);

  const fetchShiftPrice = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("calculate-shift-price");
      if (data) setShiftInfo(data);
    } catch {
      setShiftInfo({ shift: "day", price: 75, label: "Diurno" });
    }
    setLoading(false);
  };

  const checkDiscountCard = async () => {
    if (!user) return;
    const { data } = await supabase.from("discount_cards").select("discount_percent").eq("user_id", user.id).eq("status", "active").maybeSingle();
    if (data) setDiscountPercent(Number(data.discount_percent));
  };

  const fetchMyEntry = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("on_demand_queue")
      .select("*")
      .eq("patient_id", user.id)
      .in("status", ["waiting", "assigned", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setMyEntry(data);
    if (data?.status === "waiting") {
      const { count } = await supabase
        .from("on_demand_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "waiting")
        .lt("created_at", data.created_at);
      setQueuePosition((count ?? 0) + 1);
    }
    if (data?.status === "in_progress" && data?.appointment_id) {
      window.location.href = `/dashboard/consultation/${data.appointment_id}?role=patient`;
    }
  };

  const handleJoinQueue = async () => {
    if (!user || !shiftInfo) return;
    setJoining(true);
    const finalPrice = discountPercent > 0 ? shiftInfo.price * (1 - discountPercent / 100) : shiftInfo.price;

    const { error } = await supabase.from("on_demand_queue").insert({
      patient_id: user.id,
      shift: shiftInfo.shift,
      price: finalPrice,
      status: "waiting",
    });

    if (error) {
      toast.error("Erro ao entrar na fila: " + error.message);
    } else {
      toast.success("Você entrou na fila! Aguarde um médico.");
      // Notify on-duty doctors
      const { data: profile } = await supabase.from("profiles").select("first_name").eq("user_id", user.id).maybeSingle();
      notifyDoctorsNewQueueEntry(profile?.first_name || "Paciente", shiftInfo.shift, finalPrice);
      fetchMyEntry();
    }
    setJoining(false);
  };

  const handleRequestRefund = async () => {
    if (!myEntry) return;
    await supabase.from("on_demand_queue").update({ status: "refunded", completed_at: new Date().toISOString() }).eq("id", myEntry.id);
    toast.success("Reembolso solicitado com sucesso.");
    setMyEntry(null);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const priceWithDiscount = shiftInfo ? (discountPercent > 0 ? shiftInfo.price * (1 - discountPercent / 100) : shiftInfo.price) : 0;

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("urgent-care")}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-1">🚨 Plantão 24h</h1>
        <p className="text-muted-foreground text-sm mb-6">Pronto-atendimento digital com clínico geral</p>

        {loading ? (
          <div className="shimmer-v2 h-5 rounded w-32 inline-block" aria-label="Carregando" />
        ) : myEntry ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-8 text-center">
                {myEntry.status === "waiting" && (
                  <>
                    <Clock className="w-12 h-12 mx-auto text-primary mb-4 animate-pulse" />
                    <h2 className="text-xl font-bold mb-2">Você está na fila</h2>
                    <p className="text-4xl font-bold text-primary mb-1">{queuePosition}º</p>
                    <p className="text-sm text-muted-foreground mb-4">posição na fila</p>
                    <Badge variant="outline" className="text-lg px-4 py-1 mb-4">{formatTime(elapsed)}</Badge>
                    <p className="text-xs text-muted-foreground mb-6">Tempo de espera</p>
                    {elapsed > 900 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-center gap-2 text-destructive mb-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">Espera acima de 15 minutos</span>
                        </div>
                        <Button variant="destructive" onClick={handleRequestRefund}>Solicitar Reembolso</Button>
                      </div>
                    )}
                    <Button variant="outline" onClick={() => { setMyEntry(null); }} className="mt-2">
                      <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
                    </Button>
                  </>
                )}
                {myEntry.status === "assigned" && (
                  <>
                    <Phone className="w-12 h-12 mx-auto text-primary mb-4" />
                    <h2 className="text-xl font-bold mb-2">Médico encontrado!</h2>
                    <p className="text-muted-foreground mb-4">Aguarde, a consulta começará em instantes...</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Shift info */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{shiftInfo?.label}</h3>
                    <p className="text-xs text-muted-foreground">Turno atual</p>
                  </div>
                  <div className="text-right">
                    {discountPercent > 0 && (
                      <p className="text-sm text-muted-foreground line-through">R$ {shiftInfo?.price.toFixed(2)}</p>
                    )}
                    <p className="text-2xl font-bold text-primary">R$ {priceWithDiscount.toFixed(2)}</p>
                    {discountPercent > 0 && (
                      <Badge variant="secondary" className="text-xs">-{discountPercent}% Cartão Desconto</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6 text-center text-xs">
                  {[
                    { label: "Diurno 07–19h", price: "R$ 75", active: shiftInfo?.shift === "day" },
                    { label: "Noturno 19–00h", price: "R$ 100", active: shiftInfo?.shift === "night" },
                    { label: "Madrugada 00–07h", price: "R$ 120", active: shiftInfo?.shift === "dawn" },
                  ].map(s => (
                    <div key={s.label} className={`rounded-lg p-3 border ${s.active ? "border-primary bg-primary/10 font-bold" : "border-border"}`}>
                      <p className="text-foreground">{s.label}</p>
                      <p className="text-primary font-semibold">{s.price}</p>
                    </div>
                  ))}
                </div>

                <Button onClick={handleJoinQueue} disabled={joining} className="w-full h-12 text-base" size="lg">
                  <Zap className="w-5 h-5 mr-2" />
                  {joining ? "Entrando..." : "Entrar na Fila — Atendimento Imediato"}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  SLA de 15 minutos • Reembolso automático se exceder
                </p>
              </CardContent>
            </Card>

            {/* How it works */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Como funciona</h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>Você entra na fila e realiza o pagamento</li>
                  <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>Um clínico geral de plantão aceita seu atendimento</li>
                  <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</span>Consulta por videochamada com receita digital inclusa</li>
                  <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">4</span>Se a espera ultrapassar 15 minutos, reembolso garantido</li>
                </ol>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UrgentCareQueue;
