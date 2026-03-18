import { logError } from "@/lib/logger";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Check, Star, CreditCard, Calendar as CalIcon, Clock, FileText,
  Search, ArrowLeft, Shield, User, History, QrCode, FileBarChart, Copy, CheckCircle2, Lock,
  Crown, Diamond, Building2, ArrowRight, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, setHours, setMinutes, isBefore } from "date-fns";
import { saveCheckoutDraft, clearCheckoutDraft } from "./CheckoutRecoveryBanner";
import { ptBR } from "date-fns/locale";
import CardSubscriptionCheckout from "./CardSubscriptionCheckout";

type PaymentMethod = "pix" | "card" | "boleto";

const patientNav = [
  { label: "Início", href: "/dashboard", icon: <Clock className="w-4 h-4" /> },
  { label: "Agendar Consulta", href: "/dashboard/schedule", icon: <CalIcon className="w-4 h-4" /> },
  { label: "Histórico Médico", href: "/dashboard/history", icon: <FileText className="w-4 h-4" /> },
  { label: "Pagamento", href: "/dashboard/plans", icon: <CreditCard className="w-4 h-4" />, active: true },
  { label: "Meu Perfil", href: "/dashboard/profile", icon: <User className="w-4 h-4" /> },
];

const plans = [
  {
    id: "avulsa",
    name: "Consulta Avulsa",
    price: 89,
    period: "por consulta",
    description: "Ideal para quem precisa de atendimento pontual.",
    features: ["1 consulta por videochamada", "Receita digital inclusa", "Chat pós-consulta (48h)", "Escolha de especialidade"],
    highlighted: false,
  },
];

const cardPlans = [
  {
    id: "prata_familiar",
    name: "Mini Família",
    price: 47.9,
    people: "Titular + até 4 dependentes",
    icon: <Shield className="w-6 h-6 text-white" />,
    highlighted: false,
    gradient: "from-[hsl(210,15%,60%)] to-[hsl(210,15%,45%)]",
    benefits: ["Telemedicina 24h/7", "Clube de Vantagens (até 80% off)"],
    tag: null,
  },
  {
    id: "ouro_individual",
    name: "Solitário",
    price: 37.9,
    people: "Apenas o titular",
    icon: <Star className="w-6 h-6 text-white" />,
    highlighted: false,
    gradient: "from-[hsl(45,80%,50%)] to-[hsl(35,80%,42%)]",
    benefits: ["Telemedicina 24h/7", "Clube de Vantagens", "Assistência Funeral"],
    tag: null,
  },
  {
    id: "ouro_familiar",
    name: "King Família",
    price: 77.9,
    people: "Titular + até 4 dependentes",
    icon: <Crown className="w-6 h-6 text-white" />,
    highlighted: true,
    gradient: "from-primary via-primary to-secondary",
    benefits: ["Telemedicina 24h/7 (todos)", "Clube de Vantagens (todos)"],
    tag: "⭐ MAIS POPULAR",
  },
  {
    id: "diamante_familiar",
    name: "Prime Família",
    price: 157.9,
    people: "Titular + até 4 dependentes",
    icon: <Diamond className="w-6 h-6 text-white" />,
    highlighted: false,
    gradient: "from-[hsl(260,60%,55%)] to-[hsl(280,60%,45%)]",
    benefits: ["Telemedicina 24h/7 (todos)", "Clube de Vantagens (todos)", "Assistência Funeral (todos)"],
    tag: "💎 COMPLETO",
  },
];

type Step = "select" | "specialty" | "doctor" | "datetime" | "checkout" | "success";

interface DoctorOption {
  id: string;
  user_id: string;
  crm: string;
  crm_state: string;
  consultation_price: number;
  rating: number;
  total_reviews: number;
  experience_years: number;
  first_name: string;
  last_name: string;
  specialties: string[];
  slots: { day_of_week: number; start_time: string; end_time: string }[];
}

const PlansCheckout = () => {
  const navigate = useNavigate();
  
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("specialty");
  const [selectedPlan, setSelectedPlan] = useState<string | null>("avulsa");
  const [activeTab, setActiveTab] = useState("consulta");
  const [subscribingCard, setSubscribingCard] = useState<string | null>(null);
  const [cardSubPaymentMethod, setCardSubPaymentMethod] = useState<PaymentMethod>("pix");
  const [cardSubPixQr, setCardSubPixQr] = useState<string | null>(null);
  const [cardSubPixCode, setCardSubPixCode] = useState<string | null>(null);
  const [cardSubBoletoUrl, setCardSubBoletoUrl] = useState<string | null>(null);

  // Avulsa flow state
  const [specialties, setSpecialties] = useState<{ id: string; name: string }[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Checkout state
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [pixCopied, setPixCopied] = useState(false);
  const [pixCountdown, setPixCountdown] = useState(900);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [cardDiscount, setCardDiscount] = useState(0);

  const currentPlan = plans.find(p => p.id === selectedPlan);

  // Check if user has active discount card
  useEffect(() => {
    if (!user) return;
    supabase.from("discount_cards").select("discount_percent").eq("user_id", user.id).eq("status", "active").maybeSingle().then(({ data }) => {
      if (data) setCardDiscount(Number(data.discount_percent));
    });
  }, [user]);

  // PIX countdown
  useEffect(() => {
    if (step !== "checkout" || paymentMethod !== "pix") return;
    setPixCountdown(900);
    const timer = setInterval(() => setPixCountdown(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [step, paymentMethod]);
  useEffect(() => {
    supabase.from("specialties").select("id, name").order("name").then(({ data }) => {
      if (data) setSpecialties(data);
    });
  }, []);

  // Fetch doctors when specialty is selected
  useEffect(() => {
    if (selectedSpecialty && step === "doctor") fetchDoctorsForSpecialty();
  }, [selectedSpecialty, step]);

  // Fetch booked slots when date changes
  useEffect(() => {
    if (selectedDate && selectedDoctor) fetchBookedSlots();
  }, [selectedDate]);

  const fetchDoctorsForSpecialty = async () => {
    setLoadingDoctors(true);
    // Get doctor IDs for this specialty
    const { data: specDocs } = await supabase
      .from("doctor_specialties")
      .select("doctor_id, specialties(name)")
      .eq("specialty_id", selectedSpecialty!);

    if (!specDocs || specDocs.length === 0) {
      setDoctors([]);
      setLoadingDoctors(false);
      return;
    }

    const docIds = specDocs.map((s: any) => s.doctor_id);

    const { data: docData } = await supabase
      .from("doctor_profiles")
      .select("id, user_id, crm, crm_state, consultation_price, rating, total_reviews, experience_years")
      .eq("is_approved", true)
      .in("id", docIds);

    if (!docData) { setDoctors([]); setLoadingDoctors(false); return; }

    const userIds = docData.map(d => d.user_id);
    const allDocIds = docData.map(d => d.id);

    const [profilesRes, slotsRes, allSpecsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds),
      supabase.from("availability_slots").select("doctor_id, day_of_week, start_time, end_time").eq("is_active", true).in("doctor_id", allDocIds),
      supabase.from("doctor_specialties").select("doctor_id, specialties(name)").in("doctor_id", allDocIds),
    ]);

    const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) ?? []);
    const slotsMap = new Map<string, any[]>();
    slotsRes.data?.forEach(s => {
      const arr = slotsMap.get(s.doctor_id) ?? [];
      arr.push(s);
      slotsMap.set(s.doctor_id, arr);
    });
    const specsMap = new Map<string, string[]>();
    allSpecsRes.data?.forEach((s: any) => {
      const arr = specsMap.get(s.doctor_id) ?? [];
      if (s.specialties?.name) arr.push(s.specialties.name);
      specsMap.set(s.doctor_id, arr);
    });

    const result: DoctorOption[] = docData.map(d => {
      const p = profileMap.get(d.user_id);
      return {
        ...d,
        consultation_price: Number(d.consultation_price),
        rating: Number(d.rating),
        first_name: (p as { first_name?: string })?.first_name ?? "",
        last_name: (p as { last_name?: string })?.last_name ?? "",
        specialties: specsMap.get(d.id) ?? [],
        slots: slotsMap.get(d.id) ?? [],
      };
    });

    setDoctors(result);
    setLoadingDoctors(false);
  };

  const fetchBookedSlots = async () => {
    if (!selectedDate || !selectedDoctor) return;
    const dayStart = new Date(selectedDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate); dayEnd.setHours(23, 59, 59, 999);
    const { data } = await supabase
      .from("appointments")
      .select("scheduled_at")
      .eq("doctor_id", selectedDoctor.id)
      .gte("scheduled_at", dayStart.toISOString())
      .lte("scheduled_at", dayEnd.toISOString())
      .neq("status", "cancelled");
    setBookedSlots(data?.map(a => format(new Date(a.scheduled_at), "HH:mm")) ?? []);
  };

  const getAvailableTimesForDate = (date: Date): string[] => {
    if (!selectedDoctor) return [];
    const dayOfWeek = date.getDay();
    const daySlots = selectedDoctor.slots.filter(s => s.day_of_week === dayOfWeek);
    const times: string[] = [];
    daySlots.forEach(slot => {
      const [startH, startM] = slot.start_time.split(":").map(Number);
      const [endH, endM] = slot.end_time.split(":").map(Number);
      let h = startH, m = startM;
      while (h < endH || (h === endH && m < endM)) {
        const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        const slotDateTime = setMinutes(setHours(new Date(date), h), m);
        if (!bookedSlots.includes(timeStr) && !isBefore(slotDateTime, new Date())) {
          times.push(timeStr);
        }
        m += 30;
        if (m >= 60) { h++; m = 0; }
      }
    });
    return times;
  };

  const isDayAvailable = (date: Date): boolean => {
    if (!selectedDoctor) return false;
    if (isBefore(date, new Date()) && date.toDateString() !== new Date().toDateString()) return false;
    return selectedDoctor.slots.some(s => s.day_of_week === date.getDay());
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setStep("specialty");
  };

  const handleSelectSpecialty = (specId: string) => {
    setSelectedSpecialty(specId);
    setStep("doctor");
    const specName = specialties.find(s => s.id === specId)?.name;
    saveCheckoutDraft({ step: "doctor", plan_id: selectedPlan ?? undefined, specialty_id: specId, specialty_name: specName });
  };

  const handleSelectDoctor = (doc: DoctorOption) => {
    setSelectedDoctor(doc);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setStep("datetime");
    saveCheckoutDraft({ step: "datetime", plan_id: selectedPlan ?? undefined, doctor_id: doc.id, doctor_name: `Dr(a). ${doc.first_name} ${doc.last_name}` });
  };

  const handleProceedToPayment = () => {
    setStep("checkout");
    saveCheckoutDraft({
      step: "checkout",
      plan_id: selectedPlan ?? undefined,
      doctor_id: selectedDoctor?.id,
      doctor_name: selectedDoctor ? `Dr(a). ${selectedDoctor.first_name} ${selectedDoctor.last_name}` : undefined,
      scheduled_at: selectedDate && selectedTime ? setMinutes(setHours(new Date(selectedDate), parseInt(selectedTime.split(":")[0])), parseInt(selectedTime.split(":")[1])).toISOString() : undefined,
    });
  };

  // Asaas payment state
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixCopyPasteCode, setPixCopyPasteCode] = useState<string | null>(null);
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);
  const [asaasPaymentId, setAsaasPaymentId] = useState<string | null>(null);

  // Track appointment ID created during checkout for PIX polling
  const [currentAppointmentId, setCurrentAppointmentId] = useState<string | null>(null);

  // Payment polling for confirmation (PIX and Boleto)
  useEffect(() => {
    if (step !== "checkout" || !currentAppointmentId) return;
    // Only poll when we have a generated payment (PIX QR or Boleto URL or asaas ID)
    const hasPendingPayment = pixQrCode || boletoUrl || asaasPaymentId;
    if (!hasPendingPayment) return;
    
    const pollTimer = setInterval(async () => {
      if (user && currentAppointmentId) {
        const { data } = await supabase
          .from("appointments")
          .select("payment_status")
          .eq("id", currentAppointmentId)
          .in("payment_status", ["approved", "confirmed", "received"])
          .limit(1);
        if (data && data.length > 0) {
          clearInterval(pollTimer);
          toast.success("✅ Pagamento confirmado!");
          setStep("success");
          clearCheckoutDraft();
        }
      }
    }, 10000);
    return () => clearInterval(pollTimer);
  }, [step, pixQrCode, boletoUrl, asaasPaymentId, currentAppointmentId]);

  const handleCheckout = async () => {
    if (paymentMethod === "card" && (!cardName || !cardNumber || !cardExpiry || !cardCvv)) {
      toast.error("Preencha todos os campos do cartão");
      return;
    }
    setProcessing(true);

    try {
      // Get user profile for CPF
      let customerCpf = "";
      let customerName = "";
      let customerEmail = user?.email || "";
      let customerPhone = "";

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, cpf, phone")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          customerName = `${profile.first_name} ${profile.last_name}`.trim();
          customerCpf = profile.cpf || "";
          customerPhone = profile.phone || "";
        }
      }

      if (!customerCpf) {
        toast.error("CPF obrigatório", { description: "Complete seu perfil com o CPF antes de pagar." });
        setProcessing(false);
        return;
      }

      // Create appointment first for avulsa
      let appointmentId: string | undefined;
      if (selectedPlan === "avulsa" && selectedDoctor && selectedDate && selectedTime && user) {
        const [h, m] = selectedTime.split(":").map(Number);
        const scheduledAt = setMinutes(setHours(new Date(selectedDate), h), m);
        const { data: appt, error } = await supabase.from("appointments").insert({
          patient_id: user.id,
          doctor_id: selectedDoctor.id,
          scheduled_at: scheduledAt.toISOString(),
          status: "scheduled",
          payment_status: "pending",
        }).select("id").single();

        if (error || !appt) {
          toast.error("Erro ao agendar", { description: "Tente novamente." });
          setProcessing(false);
          return;
        }
        appointmentId = appt.id;
        setCurrentAppointmentId(appt.id);
      }

      const billingTypeMap: Record<PaymentMethod, string> = {
        pix: "PIX",
        card: "CREDIT_CARD",
        boleto: "BOLETO",
      };

      // cardExpiry split moved inside card tokenization block below

      const payload: Record<string, any> = {
        customerName,
        customerCpf,
        customerEmail,
        customerMobilePhone: customerPhone,
        billingType: billingTypeMap[paymentMethod],
        value: totalPrice,
        description: `Consulta Médica - AloClinica`,
        appointmentId,
        doctorProfileId: selectedDoctor?.id,
      };

      // PCI Compliance: Tokenize card via dedicated endpoint BEFORE payment
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

        // Send ONLY the token — never raw card data
        payload.creditCardToken = tokenData.creditCardToken;
      }

      // Pass coupon code to edge function for server-side tracking
      if (couponCode && couponDiscount > 0) {
        payload.couponCode = couponCode;
      }


      const { data, error } = await supabase.functions.invoke("create-asaas-payment", {
        body: payload,
      });

      if (error || !data?.success) {
        toast.error("Erro no pagamento", { description: data?.error || "Tente novamente." });

        // Cancel the appointment if payment failed
        if (appointmentId) {
          await supabase.from("appointments").update({ status: "cancelled", cancel_reason: "payment_failed" }).eq("id", appointmentId);
        }
        setProcessing(false);
        return;
      }

      setAsaasPaymentId(data.paymentId || data.subscriptionId);

      // Handle PIX→BOLETO fallback from Asaas
      if (data.fallbackUsed && data.billingType === "BOLETO") {
        setBoletoUrl(data.bankSlipUrl || data.invoiceUrl || null);
        setPaymentMethod("boleto");
        setProcessing(false);
        toast.warning("PIX indisponível no momento", { description: "Boleto gerado automaticamente como alternativa." });
        return;
      }

      if (paymentMethod === "pix") {
        setPixQrCode(data.pixQrCode || null);
        setPixCopyPasteCode(data.pixCopyPaste || null);
        setProcessing(false);
        // Don't go to success yet — user needs to pay
        toast.success("PIX gerado! 🎉", { description: "Escaneie o QR Code ou copie o código para pagar." });
        return;
      }

      if (paymentMethod === "boleto") {
        setBoletoUrl(data.bankSlipUrl || data.invoiceUrl || null);
        setProcessing(false);
        // Don't go to success — user needs to pay the boleto first
        toast.success("Boleto gerado! 📄", { description: "Pague o boleto para confirmar sua consulta." });
        return;
      }

      // Card payment — usually confirmed immediately
      if (data.status === "CONFIRMED" || data.status === "RECEIVED") {
        if (appointmentId) {
          await supabase.from("appointments").update({ payment_status: "approved", payment_confirmed_at: new Date().toISOString() }).eq("id", appointmentId);
        }
        // Increment coupon usage only after confirmed payment (issue #2 rodada 3)
        if (couponCode && couponDiscount > 0) {
          await supabase.rpc("fn_increment_coupon_usage_atomic", { p_code: couponCode });
        }
      }

      setProcessing(false);
      setStep("success");
      clearCheckoutDraft();
    } catch (err: unknown) {
      logError("PlansCheckout payment error", err);
      toast.error("Erro", { description: err instanceof Error ? err.message : "Erro inesperado." });
      setProcessing(false);
    }
  };

  const handleCopyPix = () => {
    const code = pixCopyPasteCode || "";
    navigator.clipboard.writeText(code);
    setPixCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setPixCopied(false), 3000);
  };

  const formatPixTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const goBack = () => {
    if (step === "specialty") navigate(-1);
    else if (step === "doctor") setStep("specialty");
    else if (step === "datetime") setStep("doctor");
    else if (step === "checkout") setStep("datetime");
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(\d{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return cleaned;
  };

  const availableTimes = selectedDate ? getAvailableTimesForDate(selectedDate) : [];
  const selectedSpecialtyName = specialties.find(s => s.id === selectedSpecialty)?.name;
  // Use real doctor consultation_price instead of hardcoded R$89 (issue #8 rodada 3)
  const basePrice = selectedPlan === "avulsa" ? (selectedDoctor?.consultation_price ?? 89) : (currentPlan?.price ?? 149);
  const totalDiscountPercent = Math.min(couponDiscount + cardDiscount, 100);
  const discountAmount = basePrice * (totalDiscountPercent / 100);
  const totalPrice = Math.max(basePrice - discountAmount, 0);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCheckingCoupon(true);
    setCouponValid(null);
    const { data, error } = await supabase
      .from("coupons")
      .select("discount_percentage, max_uses, times_used, expires_at")
      .eq("code", couponCode.trim().toUpperCase())
      .eq("is_active", true)
      .single();
    if (error || !data) {
      setCouponValid(false);
      setCouponDiscount(0);
      toast.error("Cupom inválido");
    } else {
      const expired = data.expires_at && new Date(data.expires_at) < new Date();
      const maxReached = data.max_uses && data.times_used >= data.max_uses;
      if (expired || maxReached) {
        setCouponValid(false);
        setCouponDiscount(0);
        toast.error(expired ? "Cupom expirado" : "Cupom esgotado");
      } else {
        setCouponValid(true);
        setCouponDiscount(Number(data.discount_percentage));
        toast.success(`Cupom aplicado! ${data.discount_percentage}% de desconto 🎉`);
      }
    }
    setCheckingCoupon(false);
  };

  // Step indicators
  const stepLabels = ["Especialidade", "Médico", "Data/Hora", "Pagamento"];
  const stepIndex = { specialty: 0, doctor: 1, datetime: 2, checkout: 3, success: 4 }[step] ?? 0;

  return (
    <DashboardLayout title="Paciente" nav={patientNav}>
      <div className="max-w-5xl">
        {/* Tab selector */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consulta" className="text-xs sm:text-sm">
              <CreditCard className="w-4 h-4 mr-1.5" /> Consulta Avulsa
            </TabsTrigger>
            <TabsTrigger value="cartao" className="text-xs sm:text-sm">
              <Shield className="w-4 h-4 mr-1.5" /> Cartão de Benefícios
            </TabsTrigger>
            <TabsTrigger value="empresarial" className="text-xs sm:text-sm">
              <Building2 className="w-4 h-4 mr-1.5" /> Empresarial
            </TabsTrigger>
          </TabsList>

          {/* ===== TAB: CARTÃO DE BENEFÍCIOS ===== */}
          <TabsContent value="cartao" className="mt-6">
            {!subscribingCard ? (
              <>
                <h2 className="text-2xl font-bold text-foreground mb-1">Cartão de Benefícios</h2>
                <p className="text-muted-foreground mb-6">Telemedicina 24h, clube de vantagens e assistência funerária.</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {cardPlans.map((plan) => (
                    <Card key={plan.id} className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full ${plan.highlighted ? "border-primary shadow-lg shadow-primary/15 ring-2 ring-primary/20" : "border-border/50"}`}>
                      {plan.tag && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-secondary text-primary-foreground text-center text-[10px] py-1 font-bold tracking-wide">{plan.tag}</div>
                      )}
                      <CardContent className={`p-5 text-center flex flex-col h-full ${plan.tag ? "pt-8" : ""}`}>
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mx-auto mb-3 shadow-lg`}>{plan.icon}</div>
                        <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                        <p className="text-[11px] text-muted-foreground mb-3">{plan.people}</p>
                        <div className="mb-2">
                          <span className="text-3xl font-black text-foreground">R$ {plan.price.toFixed(2).replace(".", ",")}</span>
                          <span className="text-muted-foreground text-xs">/mês</span>
                        </div>
                        <ul className="text-left space-y-1.5 my-3 flex-1">
                          {plan.benefits.map((b, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <Check className="w-3.5 h-3.5 text-secondary mt-0.5 shrink-0" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          className={`w-full h-10 rounded-xl font-bold text-sm ${plan.highlighted ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground" : ""}`}
                          variant={plan.highlighted ? "default" : "outline"}
                          onClick={async () => {
                            if (!user) { navigate("/paciente"); return; }
                            const { data: existing } = await supabase.from("discount_cards").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
                            if (existing) { toast.info("Você já possui um cartão ativo!"); return; }
                            setSubscribingCard(plan.id);
                            setCardSubPaymentMethod("pix");
                            setCardSubPixQr(null);
                            setCardSubPixCode(null);
                            setCardSubBoletoUrl(null);
                          }}
                        >
                          Assinar <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                        <p className="text-[10px] text-muted-foreground mt-2">Sem carência • Cancele quando quiser</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <CardSubscriptionCheckout
                plan={cardPlans.find(p => p.id === subscribingCard)!}
                user={user}
                paymentMethod={cardSubPaymentMethod}
                setPaymentMethod={setCardSubPaymentMethod}
                cardName={cardName} setCardName={setCardName}
                cardNumber={cardNumber} setCardNumber={(v) => setCardNumber(formatCardNumber(v))}
                cardExpiry={cardExpiry} setCardExpiry={(v) => setCardExpiry(formatExpiry(v))}
                cardCvv={cardCvv} setCardCvv={(v) => setCardCvv(v.replace(/\D/g, "").slice(0, 4))}
                pixQrCode={cardSubPixQr} pixCopyPaste={cardSubPixCode} boletoUrl={cardSubBoletoUrl}
                onBack={() => { setSubscribingCard(null); setCardSubPixQr(null); setCardSubPixCode(null); setCardSubBoletoUrl(null); }}
                onSuccess={() => { setSubscribingCard(null); toast.success("Assinatura criada! 🎉", { description: "Assim que o pagamento for confirmado, seu cartão será ativado automaticamente." }); navigate("/dashboard"); }}
                onPixGenerated={(qr, code) => { setCardSubPixQr(qr); setCardSubPixCode(code); }}
                onBoletoGenerated={(url) => { setCardSubBoletoUrl(url); }}
              />
            )}
          </TabsContent>

          {/* ===== TAB: EMPRESARIAL ===== */}
          <TabsContent value="empresarial" className="mt-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Building2 className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Plano Empresarial</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Ofereça saúde e bem-estar para seus colaboradores com condições especiais para empresas.
              </p>
              <Button size="lg" className="rounded-xl" onClick={() => navigate("/empresas")}>
                Conhecer Plano Empresarial <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* ===== TAB: CONSULTA AVULSA ===== */}
          <TabsContent value="consulta" className="mt-6">
      <div className={step === "checkout" ? "max-w-4xl" : "max-w-3xl"}>

        {/* Step indicator */}
        {step !== "success" && (
          <div className="mb-6">
            <button onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex items-center gap-1">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    i < (stepIndex ?? 0) ? "bg-secondary/20 text-secondary" :
                    i === (stepIndex ?? 0) ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {i < (stepIndex ?? 0) ? <Check className="w-3 h-3" /> : null}
                    {label}
                  </div>
                  {i < stepLabels.length - 1 && <div className="w-4 h-px bg-border flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan selection removed — only consulta avulsa */}

        {/* STEP 2: Choose Specialty (avulsa only) */}
        {step === "specialty" && (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-1">Escolha a Especialidade</h1>
            <p className="text-muted-foreground mb-6">Qual tipo de consulta você precisa?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {specialties.map(spec => (
                <Card
                  key={spec.id}
                  className="card-interactive border-border cursor-pointer hover:border-primary/50"
                  onClick={() => handleSelectSpecialty(spec.id)}
                >
                  <CardContent className="p-4 text-center">
                    <p className="font-semibold text-foreground text-sm">{spec.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {specialties.length === 0 && (
              <p className="text-muted-foreground text-sm">Nenhuma especialidade cadastrada ainda.</p>
            )}
          </>
        )}

        {/* STEP 3: Choose Doctor */}
        {step === "doctor" && (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-1">Escolha o Médico</h1>
            <p className="text-muted-foreground mb-6">
              Especialidade: <Badge variant="secondary">{selectedSpecialtyName}</Badge>
            </p>
            {loadingDoctors ? (
              <p className="text-muted-foreground text-sm">Carregando médicos...</p>
            ) : doctors.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-12 text-center">
                  <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Nenhum médico disponível nesta especialidade.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {doctors.map(doc => (
                  <Card key={doc.id} className="card-interactive border-border cursor-pointer" onClick={() => handleSelectDoctor(doc)}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-14 h-14 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {doc.first_name[0]}{doc.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">Dr(a). {doc.first_name} {doc.last_name}</h3>
                          <p className="text-xs text-muted-foreground">CRM {doc.crm}/{doc.crm_state}</p>
                          {doc.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {doc.specialties.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {doc.rating > 0 && (
                              <span className="flex items-center gap-1 text-sm">
                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                {doc.rating.toFixed(1)}
                              </span>
                            )}
                            {doc.experience_years > 0 && (
                              <span className="text-xs text-muted-foreground">{doc.experience_years} anos exp.</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-foreground">R${doc.consultation_price}</p>
                          <p className="text-xs text-muted-foreground">por consulta</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* STEP 4: Choose Date & Time */}
        {step === "datetime" && selectedDoctor && (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-1">Escolha Data e Horário</h1>
            <p className="text-muted-foreground mb-6">
              Dr(a). {selectedDoctor.first_name} {selectedDoctor.last_name} · R${selectedDoctor.consultation_price}
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Data</CardTitle></CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => { setSelectedDate(d); setSelectedTime(null); }}
                    disabled={(date) => !isDayAvailable(date)}
                    fromDate={new Date()}
                    toDate={addDays(new Date(), 60)}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </CardContent>
              </Card>

              <div>
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-base">Horários Disponíveis</CardTitle></CardHeader>
                  <CardContent>
                    {!selectedDate ? (
                      <p className="text-sm text-muted-foreground">Selecione uma data primeiro.</p>
                    ) : availableTimes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum horário disponível nesta data.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {availableTimes.map(time => (
                          <Button
                            key={time}
                            variant={selectedTime === time ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTime(time)}
                            className={selectedTime === time ? "bg-gradient-hero text-primary-foreground" : ""}
                          >
                            <Clock className="w-3 h-3 mr-1" /> {time}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedDate && selectedTime && (
                  <Card className="border-border mt-4">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-foreground mb-3">Resumo</h3>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <p className="flex items-center gap-2"><Check className="w-4 h-4 text-secondary" />Dr(a). {selectedDoctor.first_name} {selectedDoctor.last_name}</p>
                        <p className="flex items-center gap-2"><Check className="w-4 h-4 text-secondary" />{selectedSpecialtyName}</p>
                        <p className="flex items-center gap-2"><Check className="w-4 h-4 text-secondary" />{format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                        <p className="flex items-center gap-2"><Check className="w-4 h-4 text-secondary" />{selectedTime}h</p>
                        <p className="flex items-center gap-2"><Check className="w-4 h-4 text-secondary" />R${selectedDoctor.consultation_price}</p>
                      </div>
                      <Button className="w-full bg-gradient-hero text-primary-foreground" onClick={handleProceedToPayment}>
                        Ir para Pagamento
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}

        {/* STEP 5: Checkout Transparente */}
        {step === "checkout" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <Lock className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
              <h1 className="text-2xl font-bold text-foreground tabular-nums">Checkout Seguro</h1>
              <p className="text-muted-foreground text-sm">Ambiente protegido • Pagamento via Asaas</p>
            </div>

            <div className="grid md:grid-cols-5 gap-6">
              {/* Order Summary - Left */}
              <div className="md:col-span-2">
                <Card className="border-border sticky top-4">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Resumo</h3>
                    <div className="space-y-3 text-sm">
                      {selectedPlan === "avulsa" && selectedDoctor ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                                {selectedDoctor.first_name[0]}{selectedDoctor.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground text-sm truncate">Dr(a). {selectedDoctor.first_name} {selectedDoctor.last_name}</p>
                              <p className="text-xs text-muted-foreground">{selectedSpecialtyName}</p>
                            </div>
                          </div>
                          {selectedDate && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CalIcon className="w-4 h-4 text-primary" />
                              <span>{format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às {selectedTime}h</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-muted/50">
                          <p className="font-semibold text-foreground">{currentPlan?.name}</p>
                          <p className="text-xs text-muted-foreground">{currentPlan?.description}</p>
                        </div>
                      )}
                      <div className="border-t border-border pt-3">
                        {/* Coupon field */}
                        <div className="flex gap-2 mb-3">
                          <Input
                            value={couponCode}
                            onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponValid(null); }}
                            placeholder="Cupom de desconto"
                            className="flex-1 text-xs h-8"
                          />
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={applyCoupon} disabled={checkingCoupon || !couponCode.trim()}>
                            {checkingCoupon ? "..." : "Aplicar"}
                          </Button>
                        </div>
                        {couponValid === true && (
                          <div className="flex items-center gap-1 text-xs text-green-600 mb-2">
                            <CheckCircle2 className="w-3 h-3" /> Cupom {couponCode} — {couponDiscount}% off
                          </div>
                        )}
                        {cardDiscount > 0 && (
                          <div className="flex items-center gap-1 text-xs text-primary mb-2">
                            <CheckCircle2 className="w-3 h-3" /> Cartão de Benefícios — {cardDiscount}% off
                          </div>
                        )}
                        {couponValid === false && (
                          <p className="text-xs text-destructive mb-2">Cupom inválido ou expirado</p>
                        )}
                        <div className="flex justify-between items-baseline">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="text-foreground">R$ {basePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-baseline mt-1">
                          <span className="text-muted-foreground">Desconto</span>
                          <span className="text-secondary font-medium">- R$ {discountAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="border-t border-border pt-3 flex justify-between items-baseline">
                        <span className="font-bold text-foreground text-base">Total</span>
                        <span className="font-extrabold text-foreground text-2xl">R$ {totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-4 p-2.5 rounded-lg bg-secondary/10 border border-secondary/20">
                      <div className="flex items-center gap-2 text-xs text-secondary">
                        <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Pagamento seguro via Asaas • Dados protegidos</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Methods - Right */}
              <div className="md:col-span-3">
                {/* Method Selector Tabs */}
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
                  {/* PIX Payment */}
                  {paymentMethod === "pix" && (
                    <motion.div key="pix" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <Card className="border-border">
                        <CardContent className="p-6 text-center">
                          {pixQrCode ? (
                            <>
                              <div className="mb-4">
                                <Badge variant="outline" className="text-xs mb-3">
                                  Expira em {formatPixTime(pixCountdown)}
                                </Badge>
                              </div>
                              <div className="w-48 h-48 mx-auto rounded-2xl bg-card border-2 border-border p-2 mb-4">
                                <img
                                  src={`data:image/png;base64,${pixQrCode}`}
                                  alt="QR Code PIX"
                                  className="w-full h-full object-contain rounded-xl"
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">Escaneie o QR Code ou copie o código</p>
                              <Button
                                variant="outline"
                                className="w-full mb-4 font-mono text-xs"
                                onClick={handleCopyPix}
                              >
                                {pixCopied ? (
                                  <><CheckCircle2 className="w-4 h-4 mr-2 text-secondary" /> Copiado!</>
                                ) : (
                                  <><Copy className="w-4 h-4 mr-2" /> Copiar código PIX</>
                                )}
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                Após o pagamento, a confirmação será automática via webhook.
                              </p>
                            </>
                          ) : (
                            <>
                              <QrCode className="w-12 h-12 mx-auto text-primary/60 mb-4" />
                              <p className="text-sm text-muted-foreground mb-4">
                                Clique abaixo para gerar o QR Code PIX
                              </p>
                              <Button
                                className="w-full bg-gradient-hero text-primary-foreground h-12 text-base"
                                onClick={handleCheckout}
                                disabled={processing}
                              >
                                {processing ? (
                                  <motion.div className="flex items-center gap-2" animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    Gerando PIX...
                                  </motion.div>
                                ) : `Gerar PIX • R$ ${totalPrice.toFixed(2)}`}
                              </Button>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Card Payment */}
                  {paymentMethod === "card" && (
                    <motion.div key="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <Card className="border-border">
                        <CardContent className="p-6">
                          {/* Card preview */}
                          <div className="relative w-full h-44 rounded-2xl bg-gradient-hero p-5 mb-6 overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary-foreground/5 -translate-y-10 translate-x-10" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-primary-foreground/5 translate-y-10 -translate-x-10" />
                            <div className="relative z-10 h-full flex flex-col justify-between">
                              <div className="flex justify-between items-start">
                                <div className="w-10 h-7 rounded bg-primary-foreground/20" />
                                <CreditCard className="w-6 h-6 text-primary-foreground/60" />
                              </div>
                              <div>
                                <p className="font-mono text-primary-foreground text-lg tracking-[0.2em]">
                                  {cardNumber || "•••• •••• •••• ••••"}
                                </p>
                                <div className="flex justify-between mt-2">
                                  <p className="text-primary-foreground/80 text-xs uppercase">{cardName || "SEU NOME"}</p>
                                  <p className="text-primary-foreground/80 text-xs font-mono">{cardExpiry || "MM/AA"}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">Nome no cartão</Label>
                              <Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Nome como está no cartão" className="mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Número do cartão</Label>
                              <Input value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} placeholder="0000 0000 0000 0000" className="mt-1 font-mono" maxLength={19} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Validade</Label>
                                <Input value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} placeholder="MM/AA" className="mt-1 font-mono" maxLength={5} />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">CVV</Label>
                                <Input value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="•••" className="mt-1 font-mono" maxLength={4} type="password" />
                              </div>
                            </div>
                            <Button
                              className="w-full bg-gradient-hero text-primary-foreground h-12 text-base mt-2"
                              onClick={handleCheckout}
                              disabled={processing}
                            >
                              {processing ? (
                                <motion.div className="flex items-center gap-2" animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                  Processando...
                                </motion.div>
                              ) : (
                                <><Lock className="w-4 h-4 mr-2" /> Pagar R$ {totalPrice.toFixed(2)}</>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Boleto Payment */}
                  {paymentMethod === "boleto" && (
                    <motion.div key="boleto" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <Card className="border-border">
                        <CardContent className="p-6 text-center">
                          <FileBarChart className="w-12 h-12 mx-auto text-primary/60 mb-4" />
                          <h3 className="font-bold text-foreground mb-2">Boleto Bancário</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            O boleto será gerado e pode levar até 2 dias úteis para compensação.
                          </p>
                          <Button
                            className="w-full bg-gradient-hero text-primary-foreground h-12 text-base"
                            onClick={handleCheckout}
                            disabled={processing}
                          >
                            {processing ? (
                              <motion.div className="flex items-center gap-2" animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                Gerando boleto...
                              </motion.div>
                            ) : `Gerar Boleto • R$ ${totalPrice.toFixed(2)}`}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Security badges */}
                <div className="flex items-center justify-center gap-4 mt-4 text-muted-foreground">
                  <div className="flex items-center gap-1 text-xs">
                    <Lock className="w-3 h-3" /> SSL 256-bit
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Shield className="w-3 h-3" /> PCI DSS
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Check className="w-3 h-3" /> LGPD
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 6: Success */}
        {step === "success" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              className="w-24 h-24 rounded-full bg-secondary/10 mx-auto flex items-center justify-center mb-6"
            >
              <CheckCircle2 className="w-12 h-12 text-secondary" />
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {selectedPlan === "avulsa" ? "Consulta Agendada e Paga!" : "Plano Ativado!"}
            </h1>
            <p className="text-muted-foreground mb-1">
              {selectedPlan === "avulsa" && selectedDoctor && selectedDate && selectedTime
                ? `Consulta com Dr(a). ${selectedDoctor.first_name} em ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às ${selectedTime}h`
                : `Seu plano ${currentPlan?.name} foi ativado com sucesso.`
              }
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Pagamento via {paymentMethod === "pix" ? "PIX" : paymentMethod === "card" ? "Cartão de Crédito" : "Boleto"} • Asaas
            </p>
            {boletoUrl && paymentMethod === "boleto" && (
              <a href={boletoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline mb-4 inline-block">
                📄 Abrir boleto para pagamento
              </a>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate("/dashboard")} className="bg-gradient-hero text-primary-foreground h-11">
                <CalIcon className="w-4 h-4 mr-2" /> Ir para o Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard/appointments")} className="h-11">
                Ver Minhas Consultas
              </Button>
            </div>
          </motion.div>
        )}
      </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PlansCheckout;
