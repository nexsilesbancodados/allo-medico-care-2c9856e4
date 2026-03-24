import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Zap, Phone, RefreshCw, AlertTriangle, QrCode, CreditCard, FileBarChart, Lock, Copy, CheckCircle2, Shield } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { notifyDoctorsNewQueueEntry } from "@/lib/notifications-queue";
import { logError } from "@/lib/logger";

type PaymentMethod = "pix" | "card" | "boleto";

const UrgentCareQueue = () => {
  const { user } = useAuth();
  const [shiftInfo, setShiftInfo] = useState<{ shift: string; price: number; label: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [myEntry, setMyEntry] = useState<{ id: string; status: string; position?: number; created_at: string } | null>(null);
  const [queuePosition, setQueuePosition] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [processing, setProcessing] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixCopyPaste, setPixCopyPaste] = useState<string | null>(null);
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [pendingQueueId, setPendingQueueId] = useState<string | null>(null);

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

  // Poll for payment confirmation (PIX/Boleto)
  useEffect(() => {
    if (!showPayment || !pendingQueueId) return;
    const hasPending = pixQrCode || boletoUrl;
    if (!hasPending) return;
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("on_demand_queue")
        .select("status, payment_id")
        .eq("id", pendingQueueId)
        .single();
      if (data && data.payment_id && data.status === "waiting") {
        clearInterval(poll);
        toast.success("✅ Pagamento confirmado! Você está na fila.");
        setShowPayment(false);
        setPixQrCode(null);
        setPixCopyPaste(null);
        setBoletoUrl(null);
        fetchMyEntry();
      }
    }, 8000);
    return () => clearInterval(poll);
  }, [showPayment, pendingQueueId, pixQrCode, boletoUrl]);

  const fetchShiftPrice = async () => {
    try {
      const { data } = await supabase.functions.invoke("calculate-shift-price");
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
    if (data) setMyEntry({ id: data.id, status: data.status, position: data.position ?? undefined, created_at: data.created_at });
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

  const priceWithDiscount = shiftInfo ? (discountPercent > 0 ? shiftInfo.price * (1 - discountPercent / 100) : shiftInfo.price) : 0;

  // Step 1: Show payment UI
  const handleStartPayment = () => {
    setShowPayment(true);
  };

  // Step 2: Process payment, then enter queue
  const handlePayment = async () => {
    if (!user || !shiftInfo) return;
    if (paymentMethod === "card" && (!cardName || !cardNumber || !cardExpiry || !cardCvv)) {
      toast.error("Preencha todos os campos do cartão");
      return;
    }
    setProcessing(true);

    try {
      const { data: profile } = await supabase.from("profiles").select("first_name, last_name, cpf, phone").eq("user_id", user.id).single();
      if (!profile?.cpf) {
        toast.error("CPF obrigatório", { description: "Complete seu perfil com o CPF antes de pagar." });
        setProcessing(false);
        return;
      }

      const customerName = `${profile.first_name} ${profile.last_name}`.trim();
      const billingTypeMap: Record<PaymentMethod, string> = { pix: "PIX", card: "CREDIT_CARD", boleto: "BOLETO" };

      // Create queue entry with pending_payment status
      const { data: queueEntry, error: queueError } = await supabase.from("on_demand_queue").insert({
        patient_id: user.id,
        shift: shiftInfo.shift,
        price: priceWithDiscount,
        status: "pending_payment",
      }).select("id").single();

      if (queueError || !queueEntry) {
        toast.error("Erro ao reservar lugar na fila");
        setProcessing(false);
        return;
      }
      setPendingQueueId(queueEntry.id);

      const payload: Record<string, any> = {
        customerName,
        customerCpf: profile.cpf,
        customerEmail: user.email || "",
        customerMobilePhone: profile.phone || "",
        billingType: billingTypeMap[paymentMethod],
        value: priceWithDiscount,
        description: `Plantão 24h - AloClínica (${shiftInfo.label})`,
        appointmentId: `queue_${queueEntry.id}`,
      };

      if (paymentMethod === "card") {
        const [expiryMonth, expiryYear] = cardExpiry.split("/");
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke("tokenize-card", {
          body: {
            customerName, customerCpf: profile.cpf, customerEmail: user.email, customerPhone: profile.phone,
            cardHolderName: cardName, cardNumber: cardNumber.replace(/\s/g, ""),
            cardExpiryMonth: expiryMonth, cardExpiryYear: `20${expiryYear}`, cardCcv: cardCvv,
            cardHolderCpf: profile.cpf, cardHolderPhone: profile.phone, remoteIp: "0.0.0.0",
          },
        });
        if (tokenError || !tokenData?.success) {
          toast.error("Erro no cartão", { description: tokenData?.error });
          // Rollback queue entry
          await supabase.from("on_demand_queue").delete().eq("id", queueEntry.id);
          setProcessing(false);
          return;
        }
        payload.creditCardToken = tokenData.creditCardToken;
      }

      const { data, error } = await supabase.functions.invoke("create-asaas-payment", { body: payload });

      if (error || !data?.success) {
        toast.error("Erro no pagamento", { description: data?.error || "Tente novamente." });
        await supabase.from("on_demand_queue").delete().eq("id", queueEntry.id);
        setProcessing(false);
        return;
      }

      if (paymentMethod === "pix") {
        setPixQrCode(data.pixQrCode || null);
        setPixCopyPaste(data.pixCopyPaste || null);
        setProcessing(false);
        toast.success("PIX gerado! 🎉", { description: "Escaneie o QR Code para pagar e entrar na fila." });
        return;
      }

      if (paymentMethod === "boleto") {
        setBoletoUrl(data.bankSlipUrl || data.invoiceUrl || null);
        setProcessing(false);
        toast.success("Boleto gerado! 📄");
        return;
      }

      // Card — instant confirmation
      if (data.status === "CONFIRMED" || data.status === "RECEIVED") {
        await supabase.from("on_demand_queue").update({
          status: "waiting",
          payment_id: data.paymentId,
        }).eq("id", queueEntry.id);

        toast.success("Pagamento confirmado! Você está na fila. 🚀");
        setShowPayment(false);

        // Notify on-duty doctors
        notifyDoctorsNewQueueEntry(profile.first_name || "Paciente", shiftInfo.shift, priceWithDiscount);
        fetchMyEntry();
      } else {
        toast.success("Pagamento criado!", { description: "Aguardando confirmação." });
      }
    } catch (err: unknown) {
      logError("UrgentCareQueue payment error", err);
      toast.error("Erro", { description: err instanceof Error ? err.message : "Erro inesperado." });
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestRefund = async () => {
    if (!myEntry) return;
    await supabase.from("on_demand_queue").update({ status: "refunded", completed_at: new Date().toISOString() }).eq("id", myEntry.id);
    toast.success("Reembolso solicitado com sucesso.");
    setMyEntry(null);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const formatCardNum = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})/g, "$1 ").trim();
  const formatExp = (v: string) => { const c = v.replace(/\D/g, "").slice(0, 4); return c.length >= 3 ? `${c.slice(0, 2)}/${c.slice(2)}` : c; };

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("urgent-care")}>
      <div className="max-w-2xl mx-auto pb-24 md:pb-6">
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
                    <Button variant="outline" onClick={() => fetchMyEntry()} className="mt-2">
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
        ) : showPayment ? (
          /* ═══ PAYMENT STEP ═══ */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Lock className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
                  <h2 className="text-lg font-bold text-foreground">Pagamento — Plantão 24h</h2>
                  <p className="text-muted-foreground text-sm">
                    {discountPercent > 0 ? (
                      <>
                        <span className="line-through text-muted-foreground/60">R$ {shiftInfo?.price.toFixed(2)}</span>{" "}
                        <span className="text-secondary font-bold">R$ {priceWithDiscount.toFixed(2)} ({discountPercent}% off)</span>
                      </>
                    ) : (
                      <>R$ {priceWithDiscount.toFixed(2)}</>
                    )} • Turno {shiftInfo?.label}
                  </p>
                </div>

                {/* Payment method selector */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {([
                    { id: "pix" as PaymentMethod, label: "PIX", icon: QrCode, badge: "Instantâneo" },
                    { id: "card" as PaymentMethod, label: "Cartão", icon: CreditCard, badge: null },
                    { id: "boleto" as PaymentMethod, label: "Boleto", icon: FileBarChart, badge: null },
                  ]).map(method => (
                    <motion.button key={method.id} whileTap={{ scale: 0.97 }} onClick={() => setPaymentMethod(method.id)}
                      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === method.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                      }`}>
                      <method.icon className={`w-5 h-5 ${paymentMethod === method.id ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-xs font-semibold ${paymentMethod === method.id ? "text-primary" : "text-foreground"}`}>{method.label}</span>
                      {method.badge && <Badge className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0 bg-secondary text-secondary-foreground border-0">{method.badge}</Badge>}
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {paymentMethod === "pix" && (
                    <motion.div key="pix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                      {pixQrCode ? (
                        <>
                          <div className="w-48 h-48 mx-auto rounded-2xl bg-card border-2 border-border p-2 mb-4">
                            <img src={`data:image/png;base64,${pixQrCode}`} alt="QR Code PIX" className="w-full h-full object-contain rounded-xl" />
                          </div>
                          <Button variant="outline" className="w-full mb-4 text-xs" onClick={() => { navigator.clipboard.writeText(pixCopyPaste || ""); setPixCopied(true); toast.success("Copiado!"); setTimeout(() => setPixCopied(false), 3000); }}>
                            {pixCopied ? <><CheckCircle2 className="w-4 h-4 mr-2 text-secondary" /> Copiado!</> : <><Copy className="w-4 h-4 mr-2" /> Copiar código PIX</>}
                          </Button>
                          <p className="text-xs text-muted-foreground">Após o pagamento, você entrará na fila automaticamente.</p>
                        </>
                      ) : (
                        <>
                          <QrCode className="w-12 h-12 mx-auto text-primary/60 mb-4" />
                          <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12" onClick={handlePayment} disabled={processing}>
                            {processing ? "Gerando PIX..." : `Gerar PIX • R$ ${priceWithDiscount.toFixed(2)}`}
                          </Button>
                        </>
                      )}
                    </motion.div>
                  )}

                  {paymentMethod === "card" && (
                    <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div><Label className="text-xs text-muted-foreground">Nome no cartão</Label><Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Nome no cartão" className="mt-1" /></div>
                      <div><Label className="text-xs text-muted-foreground">Número</Label><Input value={cardNumber} onChange={e => setCardNumber(formatCardNum(e.target.value))} placeholder="0000 0000 0000 0000" className="mt-1 font-mono" maxLength={19} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label className="text-xs text-muted-foreground">Validade</Label><Input value={cardExpiry} onChange={e => setCardExpiry(formatExp(e.target.value))} placeholder="MM/AA" className="mt-1 font-mono" maxLength={5} /></div>
                        <div><Label className="text-xs text-muted-foreground">CVV</Label><Input value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="•••" className="mt-1 font-mono" maxLength={4} type="password" /></div>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12" onClick={handlePayment} disabled={processing}>
                        {processing ? "Processando..." : <><Lock className="w-4 h-4 mr-2" /> Pagar R$ {priceWithDiscount.toFixed(2)}</>}
                      </Button>
                    </motion.div>
                  )}

                  {paymentMethod === "boleto" && (
                    <motion.div key="boleto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                      {boletoUrl ? (
                        <>
                          <CheckCircle2 className="w-12 h-12 mx-auto text-secondary mb-4" />
                          <a href={boletoUrl} target="_blank" rel="noopener noreferrer"><Button className="w-full">📄 Abrir Boleto</Button></a>
                          <p className="text-xs text-muted-foreground mt-3">Após compensação, você entrará na fila automaticamente.</p>
                        </>
                      ) : (
                        <>
                          <FileBarChart className="w-12 h-12 mx-auto text-primary/60 mb-4" />
                          <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12" onClick={handlePayment} disabled={processing}>
                            {processing ? "Gerando..." : `Gerar Boleto • R$ ${priceWithDiscount.toFixed(2)}`}
                          </Button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-center gap-2 mt-5 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" /> Pagamento seguro via Asaas
                </div>

                <Button variant="ghost" onClick={() => setShowPayment(false)} className="w-full mt-3 text-sm text-muted-foreground">
                  Voltar
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* ═══ MAIN VIEW ═══ */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">{shiftInfo?.label}</h3>
                    <p className="text-xs text-muted-foreground">Turno atual</p>
                  </div>
                  <div className="text-right shrink-0">
                    {discountPercent > 0 && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-through">R$ {shiftInfo?.price.toFixed(2)}</p>
                    )}
                    <p className="text-xl sm:text-2xl font-bold text-primary">R$ {priceWithDiscount.toFixed(2)}</p>
                    {discountPercent > 0 && (
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">-{discountPercent}% Cartão Desconto</Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {[
                    { label: "Diurno", hours: "07–19h", price: "R$ 75", active: shiftInfo?.shift === "day" },
                    { label: "Noturno", hours: "19–00h", price: "R$ 100", active: shiftInfo?.shift === "night" },
                    { label: "Madrugada", hours: "00–07h", price: "R$ 120", active: shiftInfo?.shift === "dawn" },
                  ].map(s => (
                    <div key={s.label} className={`flex-1 min-w-[90px] rounded-xl p-2.5 sm:p-3 border text-center text-xs transition-all ${s.active ? "border-primary bg-primary/10 font-bold shadow-sm" : "border-border"}`}>
                      <p className="text-foreground font-medium leading-tight">{s.label}</p>
                      <p className="text-muted-foreground text-[10px]">{s.hours}</p>
                      <p className="text-primary font-semibold mt-0.5">{s.price}</p>
                    </div>
                  ))}
                </div>

                <Button onClick={handleStartPayment} disabled={joining} className="w-full h-12 text-sm sm:text-base" size="lg">
                  <Zap className="w-5 h-5 mr-2 shrink-0" />
                  <span className="truncate">Entrar na Fila — Atendimento Imediato</span>
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
                  <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>Escolha o método de pagamento e pague</li>
                  <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>Você entra na fila automaticamente após confirmação</li>
                  <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</span>Um clínico geral de plantão aceita seu atendimento</li>
                  <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">4</span>Consulta por videochamada com receita digital inclusa</li>
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
