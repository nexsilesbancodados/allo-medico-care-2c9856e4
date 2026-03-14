import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft, QrCode, CreditCard, FileBarChart, Lock, Shield, Check,
  Copy, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type PaymentMethod = "pix" | "card" | "boleto";

interface CardPlan {
  id: string;
  name: string;
  price: number;
  people: string;
  icon: React.ReactNode;
  highlighted: boolean;
  gradient: string;
  benefits: string[];
  tag: string | null;
}

interface Props {
  plan: CardPlan;
  user: User | null;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  cardName: string; setCardName: (v: string) => void;
  cardNumber: string; setCardNumber: (v: string) => void;
  cardExpiry: string; setCardExpiry: (v: string) => void;
  cardCvv: string; setCardCvv: (v: string) => void;
  pixQrCode: string | null;
  pixCopyPaste: string | null;
  boletoUrl: string | null;
  onBack: () => void;
  onSuccess: () => void;
  onPixGenerated: (qr: string, code: string) => void;
  onBoletoGenerated: (url: string) => void;
}

const CardSubscriptionCheckout = ({
  plan, user, paymentMethod, setPaymentMethod,
  cardName, setCardName, cardNumber, setCardNumber,
  cardExpiry, setCardExpiry, cardCvv, setCardCvv,
  pixQrCode, pixCopyPaste, boletoUrl,
  onBack, onSuccess, onPixGenerated, onBoletoGenerated,
}: Props) => {
  const [processing, setProcessing] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  // PIX polling for card subscription confirmation
  useEffect(() => {
    if (!pixQrCode || !user) return;
    const pollTimer = setInterval(async () => {
      const { data } = await supabase
        .from("discount_cards")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1);
      if (data && data.length > 0) {
        clearInterval(pollTimer);
        toast.success("✅ Pagamento confirmado! Cartão ativado.");
        onSuccess();
      }
    }, 10000);
    return () => clearInterval(pollTimer);
  }, [pixQrCode, user]);

  const handleSubscribe = async () => {
    if (!user) return;
    if (paymentMethod === "card" && (!cardName || !cardNumber || !cardExpiry || !cardCvv)) {
      toast.error("Preencha todos os campos do cartão");
      return;
    }
    setProcessing(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, cpf, phone")
        .eq("user_id", user.id)
        .single();

      if (!profile?.cpf) {
        toast.error("CPF obrigatório", { description: "Complete seu perfil com o CPF antes de assinar." });
        setProcessing(false);
        return;
      }

      const customerName = `${profile.first_name} ${profile.last_name}`.trim();
      const customerCpf = profile.cpf;
      const customerEmail = user.email || "";
      const customerPhone = profile.phone || "";

      const billingTypeMap: Record<PaymentMethod, string> = {
        pix: "PIX",
        card: "CREDIT_CARD",
        boleto: "BOLETO",
      };

      const payload: Record<string, string | number | boolean | null | undefined> = {
        customerName,
        customerCpf,
        customerEmail,
        customerMobilePhone: customerPhone,
        billingType: billingTypeMap[paymentMethod],
        value: plan.price,
        description: `Cartão de Benefícios ${plan.name} - AloClínica`,
        planId: `card_${plan.id}_${user.id}`,
        cycle: "MONTHLY",
      };

      // Tokenize card if credit card
      if (paymentMethod === "card") {
        const [expiryMonth, expiryYear] = cardExpiry.split("/");
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke("tokenize-card", {
          body: {
            customerName,
            customerCpf,
            customerEmail,
            customerPhone,
            cardHolderName: cardName,
            cardNumber: cardNumber.replace(/\s/g, ""),
            cardExpiryMonth: expiryMonth,
            cardExpiryYear: `20${expiryYear}`,
            cardCcv: cardCvv,
            cardHolderCpf: customerCpf,
            cardHolderPhone: customerPhone,
            remoteIp: "0.0.0.0",
          },
        });

        if (tokenError || !tokenData?.success) {
          toast.error("Erro no cartão", { description: tokenData?.error || "Não foi possível processar o cartão." });
          setProcessing(false);
          return;
        }
        payload.creditCardToken = tokenData.creditCardToken;
      }

      const { data, error } = await supabase.functions.invoke("create-asaas-payment", {
        body: payload,
      });

      if (error || !data?.success) {
        toast.error("Erro no pagamento", { description: data?.error || "Tente novamente." });
        setProcessing(false);
        return;
      }

      if (paymentMethod === "pix" && data.pixQrCode) {
        onPixGenerated(data.pixQrCode, data.pixCopyPaste || "");
        setProcessing(false);
        toast.success("PIX gerado! 🎉", { description: "Escaneie o QR Code para ativar sua assinatura." });
        return;
      }

      if (paymentMethod === "boleto" && (data.bankSlipUrl || data.invoiceUrl)) {
        onBoletoGenerated(data.bankSlipUrl || data.invoiceUrl);
        setProcessing(false);
        toast.success("Boleto gerado!", { description: "Pague o boleto para ativar sua assinatura." });
        return;
      }

      // Card — usually instant
      if (data.status === "ACTIVE" || data.status === "CONFIRMED") {
        onSuccess();
      } else {
        toast.success("Assinatura criada!", { description: "Aguardando confirmação do pagamento." });
        onSuccess();
      }
    } catch (err: unknown) {
      toast.error("Erro", { description: err instanceof Error ? err.message : "Erro desconhecido" });
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCopyPaste || "");
    setPixCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setPixCopied(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Voltar aos planos
      </button>

      <div className="text-center mb-6">
        <Lock className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
        <h2 className="text-xl font-bold text-foreground">Assinar {plan.name}</h2>
        <p className="text-muted-foreground text-sm">R$ {plan.price.toFixed(2).replace(".", ",")}/mês • Cobrança recorrente via Asaas</p>
      </div>

      {/* Payment method selector */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {([
          { id: "pix" as PaymentMethod, label: "PIX", icon: QrCode, badge: "Instantâneo" },
          { id: "card" as PaymentMethod, label: "Cartão", icon: CreditCard, badge: null },
          { id: "boleto" as PaymentMethod, label: "Boleto", icon: FileBarChart, badge: null },
        ]).map(method => (
          <motion.button
            key={method.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setPaymentMethod(method.id)}
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
              paymentMethod === method.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <method.icon className={`w-5 h-5 ${paymentMethod === method.id ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-xs font-semibold ${paymentMethod === method.id ? "text-primary" : "text-foreground"}`}>{method.label}</span>
            {method.badge && (
              <Badge className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0 bg-secondary text-secondary-foreground border-0">
                {method.badge}
              </Badge>
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* PIX */}
        {paymentMethod === "pix" && (
          <motion.div key="pix" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="border-border">
              <CardContent className="p-6 text-center">
                {pixQrCode ? (
                  <>
                    <div className="w-48 h-48 mx-auto rounded-2xl bg-card border-2 border-border p-2 mb-4">
                      <img src={`data:image/png;base64,${pixQrCode}`} alt="QR Code PIX" className="w-full h-full object-contain rounded-xl" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Escaneie o QR Code ou copie o código</p>
                    <Button variant="outline" className="w-full mb-4 font-mono text-xs" onClick={handleCopyPix}>
                      {pixCopied ? <><CheckCircle2 className="w-4 h-4 mr-2 text-secondary" /> Copiado!</> : <><Copy className="w-4 h-4 mr-2" /> Copiar código PIX</>}
                    </Button>
                    <p className="text-xs text-muted-foreground">Após o pagamento, seu cartão será ativado automaticamente.</p>
                  </>
                ) : (
                  <>
                    <QrCode className="w-12 h-12 mx-auto text-primary/60 mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">Clique abaixo para gerar o QR Code PIX</p>
                    <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12 text-base" onClick={handleSubscribe} disabled={processing}>
                      {processing ? (
                        <motion.div className="flex items-center gap-2" animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Gerando PIX...
                        </motion.div>
                      ) : `Gerar PIX • R$ ${plan.price.toFixed(2)}`}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Card */}
        {paymentMethod === "card" && (
          <motion.div key="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome no cartão</Label>
                  <Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Nome como está no cartão" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Número do cartão</Label>
                  <Input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" className="mt-1 font-mono" maxLength={19} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Validade</Label>
                    <Input value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/AA" className="mt-1 font-mono" maxLength={5} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">CVV</Label>
                    <Input value={cardCvv} onChange={e => setCardCvv(e.target.value)} placeholder="•••" className="mt-1 font-mono" maxLength={4} type="password" />
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12 text-base mt-2" onClick={handleSubscribe} disabled={processing}>
                  {processing ? (
                    <motion.div className="flex items-center gap-2" animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Processando...
                    </motion.div>
                  ) : <><Lock className="w-4 h-4 mr-2" /> Assinar R$ {plan.price.toFixed(2)}/mês</>}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Boleto */}
        {paymentMethod === "boleto" && (
          <motion.div key="boleto" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="border-border">
              <CardContent className="p-6 text-center">
                {boletoUrl ? (
                  <>
                    <CheckCircle2 className="w-12 h-12 mx-auto text-secondary mb-4" />
                    <h3 className="font-bold text-foreground mb-2">Boleto Gerado!</h3>
                    <p className="text-sm text-muted-foreground mb-4">Pague o boleto para ativar sua assinatura.</p>
                    <a href={boletoUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full">📄 Abrir Boleto</Button>
                    </a>
                  </>
                ) : (
                  <>
                    <FileBarChart className="w-12 h-12 mx-auto text-primary/60 mb-4" />
                    <h3 className="font-bold text-foreground mb-2">Boleto Bancário</h3>
                    <p className="text-sm text-muted-foreground mb-4">O boleto será gerado e pode levar até 2 dias úteis para compensação.</p>
                    <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12 text-base" onClick={handleSubscribe} disabled={processing}>
                      {processing ? (
                        <motion.div className="flex items-center gap-2" animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Gerando boleto...
                        </motion.div>
                      ) : `Gerar Boleto • R$ ${plan.price.toFixed(2)}`}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security badges */}
      <div className="flex items-center justify-center gap-4 mt-4 text-muted-foreground">
        <div className="flex items-center gap-1 text-xs"><Lock className="w-3 h-3" /> SSL 256-bit</div>
        <div className="flex items-center gap-1 text-xs"><Shield className="w-3 h-3" /> PCI DSS</div>
        <div className="flex items-center gap-1 text-xs"><Check className="w-3 h-3" /> LGPD</div>
      </div>
    </div>
  );
};

export default CardSubscriptionCheckout;
