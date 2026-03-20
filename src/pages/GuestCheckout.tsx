import { logError } from "@/lib/logger";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Check, Star, CreditCard, Calendar as CalIcon, Clock,
  Search, ArrowLeft, Shield, User, Mail, Phone, FileText,
  Sparkles, QrCode, Receipt, Copy, ExternalLink, Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, setHours, setMinutes, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import SEOHead from "@/components/SEOHead";
import { validarCPF } from "@/lib/cpf";
import mascotWave from "@/assets/mascot-wave.png";
import mascotThumbsup from "@/assets/mascot-thumbsup.png";
import mascotReading from "@/assets/mascot-reading.png";
import teleconsultaHero from "@/assets/teleconsulta-hero.png";

type Step = "specialty" | "doctor" | "datetime" | "patient_info" | "checkout" | "success";

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

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

const GuestCheckout = () => {
  const navigate = useNavigate();
  

  const [step, setStep] = useState<Step>("specialty");

  // Flow state
  const [specialties, setSpecialties] = useState<{ id: string; name: string }[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Guest info
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCpf, setGuestCpf] = useState("");
  const [guestDob, setGuestDob] = useState("");

  // Checkout
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "pix" | "boleto">("pix");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  // Payment result
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixCopyPaste, setPixCopyPaste] = useState<string | null>(null);
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  // Success
  const [consultationUrl, setConsultationUrl] = useState("");
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Poll for payment confirmation on success page (PIX/Boleto)
  useEffect(() => {
    if (step !== "success" || !appointmentId || paymentConfirmed) return;
    const hasPending = pixQrCode || boletoUrl;
    if (!hasPending) { setPaymentConfirmed(true); return; }
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("appointments")
        .select("payment_status")
        .eq("id", appointmentId)
        .in("payment_status", ["approved", "confirmed", "received"])
        .limit(1);
      if (data && data.length > 0) {
        clearInterval(poll);
        setPaymentConfirmed(true);
        toast.success("✅ Pagamento confirmado! Sua consulta está garantida.");
      }
    }, 8000);
    return () => clearInterval(poll);
  }, [step, appointmentId, pixQrCode, boletoUrl, paymentConfirmed]);

  useEffect(() => {
    supabase.from("specialties").select("id, name").order("name").then(({ data }) => {
      if (data) setSpecialties(data);
    });
  }, []);

  useEffect(() => {
    if (selectedSpecialty && step === "doctor") fetchDoctorsForSpecialty();
  }, [selectedSpecialty, step]);

  useEffect(() => {
    if (selectedDate && selectedDoctor) fetchBookedSlots();
  }, [selectedDate]);

  const fetchDoctorsForSpecialty = async () => {
    setLoadingDoctors(true);
    const { data: specDocs } = await supabase
      .from("doctor_specialties")
      .select("doctor_id, specialties(name)")
      .eq("specialty_id", selectedSpecialty!);

    if (!specDocs || specDocs.length === 0) { setDoctors([]); setLoadingDoctors(false); return; }

    const docIds = specDocs.map((s: { doctor_id: string }) => s.doctor_id);
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
    const slotsMap = new Map<string, { doctor_id: string; day_of_week: number; start_time: string; end_time: string }[]>();
    slotsRes.data?.forEach(s => {
      const arr = slotsMap.get(s.doctor_id) ?? [];
      arr.push(s);
      slotsMap.set(s.doctor_id, arr);
    });
    const specsMap = new Map<string, string[]>();
    allSpecsRes.data?.forEach((s: { doctor_id: string; specialties: { name: string } | null }) => {
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

  const formatCpf = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 11);
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 11);
    if (cleaned.length <= 2) return `(${cleaned}`;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
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

  const handleCheckout = async () => {
    // Validate guest info before checkout
    const cleanCpf = guestCpf.replace(/\D/g, "");
    if (!validarCPF(cleanCpf)) {
      toast.error("CPF inválido", { description: "Verifique o CPF informado." });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      toast.error("Email inválido", { description: "Digite um email válido." });
      return;
    }
    const cleanPhone = guestPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Telefone inválido", { description: "Digite um telefone com DDD." });
      return;
    }
    if (!guestName.trim() || guestName.trim().split(" ").length < 2) {
      toast.error("Nome completo obrigatório", { description: "Digite nome e sobrenome." });
      return;
    }
    if (paymentMethod === "credit" && (!cardName || !cardNumber || !cardExpiry || !cardCvv)) {
      toast.error("Preencha todos os dados do cartão");
      return;
    }
    if (!selectedDoctor || !selectedDate || !selectedTime) return;

    setProcessing(true);

    const [h, m] = selectedTime.split(":").map(Number);
    const scheduledAt = setMinutes(setHours(new Date(selectedDate), h), m);

    try {
      // Step 1: Create guest appointment
      const { data, error } = await supabase.functions.invoke("guest-checkout", {
        body: {
          full_name: guestName,
          email: guestEmail,
          phone: guestPhone.replace(/\D/g, ""),
          cpf: guestCpf.replace(/\D/g, ""),
          date_of_birth: guestDob || null,
          doctor_id: selectedDoctor.id,
          scheduled_at: scheduledAt.toISOString(),
          specialty_name: selectedSpecialtyName,
          payment_method: paymentMethod,
        },
      });

      if (error) throw error;

      // Step 2: Create real payment via Asaas
      const billingTypeMap: Record<string, string> = {
        credit: "CREDIT_CARD",
        pix: "PIX",
        boleto: "BOLETO",
      };

      const [expiryMonth, expiryYear] = (cardExpiry || "/").split("/");

      const paymentPayload: Record<string, string | number | boolean | null | undefined> = {
        customerName: guestName,
        customerCpf: guestCpf,
        customerEmail: guestEmail,
        customerMobilePhone: guestPhone,
        billingType: billingTypeMap[paymentMethod],
        value: totalPrice,
        description: `Consulta Avulsa - AloClínica`,
        appointmentId: data.appointment_id,
      };
      setAppointmentId(data.appointment_id);

      if (paymentMethod === "credit") {
        // PCI Compliance: Tokenize card via dedicated endpoint BEFORE sending to payment
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke("tokenize-card", {
          body: {
            customerName: guestName,
            customerCpf: guestCpf,
            customerEmail: guestEmail,
            customerPhone: guestPhone,
            cardHolderName: cardName,
            cardNumber: cardNumber.replace(/\s/g, ""),
            cardExpiryMonth: expiryMonth,
            cardExpiryYear: `20${expiryYear}`,
            cardCcv: cardCvv,
            cardHolderCpf: guestCpf,
            cardHolderPhone: guestPhone,
            remoteIp: "0.0.0.0",
          },
        });

        if (tokenError || !tokenData?.success) {
          toast.error("Erro no cartão", { description: tokenData?.error || "Não foi possível processar o cartão." });
          setProcessing(false);
          return;
        }

        // Send ONLY the token to payment endpoint — never raw card data
        paymentPayload.creditCardToken = tokenData.creditCardToken;
      }

      const { data: payData, error: payError } = await supabase.functions.invoke("create-asaas-payment", {
        body: paymentPayload,
      });

      if (payError || !payData?.success) {
        logError("GuestCheckout payment error", payError, { payData });
        toast.success("Consulta agendada, mas pagamento pendente", { description: payData?.error || "Você receberá instruções de pagamento por email." });
      } else {
        // Handle fallback from PIX to BOLETO
        if (payData.fallbackUsed) {
          toast.success("📋 Boleto gerado automaticamente", { description: payData.fallbackMessage || "PIX indisponível no momento. Um boleto foi gerado." });
          setPaymentMethod("boleto");
        }
        // Store payment results
        if (payData.pixQrCode) setPixQrCode(payData.pixQrCode);
        if (payData.pixCopyPaste) setPixCopyPaste(payData.pixCopyPaste);
        if (payData.bankSlipUrl) setBoletoUrl(payData.bankSlipUrl);
        if (payData.invoiceUrl) setInvoiceUrl(payData.invoiceUrl);
      }

      setConsultationUrl(data.consultation_url);
      setStep("success");
    } catch (err: unknown) {
      toast.error("Erro ao agendar", { description: err instanceof Error ? err.message : "Tente novamente." });
    } finally {
      setProcessing(false);
    }
  };

  const goBack = () => {
    if (step === "specialty") navigate("/");
    else if (step === "doctor") setStep("specialty");
    else if (step === "datetime") setStep("doctor");
    else if (step === "patient_info") setStep("datetime");
    else if (step === "checkout") setStep("patient_info");
  };

  const validatePatientInfo = () => {
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim() || !guestCpf.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      toast.error("Email inválido", { description: "Informe um email válido." });
      return;
    }
    if (!validarCPF(guestCpf)) {
      toast.error("CPF inválido", { description: "Verifique o CPF informado." });
      return;
    }
    const phoneDigits = guestPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      toast.error("Telefone inválido", { description: "Informe um telefone com pelo menos 10 dígitos." });
      return;
    }
    setStep("checkout");
  };

  const availableTimes = selectedDate ? getAvailableTimesForDate(selectedDate) : [];
  const selectedSpecialtyName = specialties.find(s => s.id === selectedSpecialty)?.name;
  const totalPrice = selectedDoctor?.consultation_price ?? 89;

  const stepLabels = ["Especialidade", "Médico", "Data/Hora", "Seus Dados", "Pagamento"];
  const stepIndex = { specialty: 0, doctor: 1, datetime: 2, patient_info: 3, checkout: 4, success: 5 }[step];

  // Glass card styles
  const glassCard = "backdrop-blur-xl bg-white/70 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]";
  const glassCardHover = `card-interactive ${glassCard} hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] hover:border-primary/30 transition-all duration-300`;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background mesh gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-emerald-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
      </div>

      <Header />
      <SEOHead title="Consulta Avulsa — Alô Médico" description="Agende uma consulta médica avulsa sem cadastro. Pagamento seguro via PIX, cartão ou boleto." />
      
      <main className="flex-1 pt-24 md:pt-28 pb-12 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Hero Banner */}
          <motion.div {...fadeUp} className="mb-10">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-secondary shadow-2xl shadow-primary/15">
              {/* Background decorations */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/[0.06] blur-2xl" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/[0.04] blur-2xl" />
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-0">
                {/* Text content */}
                <div className="flex-1 px-7 sm:px-10 py-8 sm:py-10 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/80 text-[10px] font-bold tracking-widest uppercase mb-4">
                    <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
                    Sem cadastro necessário
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-3" style={{ lineHeight: "1.1" }}>
                    Consulta Avulsa
                  </h1>
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-sm">
                    Agende sua consulta médica online de forma rápida, segura e transparente.
                  </p>
                  <div className="flex flex-wrap gap-4 mt-5 justify-center sm:justify-start text-[11px] text-white/60 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      Receita digital
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      A partir de R$89
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      30+ especialidades
                    </span>
                  </div>
                </div>

                {/* Image side */}
                <div className="w-full sm:w-[45%] shrink-0 relative">
                  <img
                    src={teleconsultaHero}
                    alt="Paciente em teleconsulta médica"
                    className="w-full h-48 sm:h-full sm:min-h-[280px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-transparent to-transparent sm:block hidden" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent sm:hidden" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step Progress Bar */}
          {step !== "success" && (
            <motion.div {...fadeUp} className="mb-8">
              <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 group transition-colors">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Voltar
              </button>
              <div className="relative">
                {/* Background track */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-border/50 rounded-full" />
                {/* Active track */}
                <div 
                  className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                  style={{ width: `${(stepIndex / (stepLabels.length - 1)) * 100}%` }}
                />
                <div className="relative flex justify-between">
                  {stepLabels.map((label, i) => (
                    <div key={label} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        i < stepIndex 
                          ? "bg-secondary text-white shadow-lg shadow-secondary/30" 
                          : i === stepIndex 
                            ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/30 ring-4 ring-primary/10" 
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {i < stepIndex ? <Check className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className={`text-[10px] mt-1.5 font-medium hidden sm:block ${
                        i <= stepIndex ? "text-foreground" : "text-muted-foreground"
                      }`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: Choose Specialty */}
            {step === "specialty" && (
              <motion.div key="specialty" {...fadeUp}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Escolha a Especialidade</h2>
                    <p className="text-sm text-muted-foreground">Qual tipo de consulta você precisa?</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {specialties.map((spec, i) => (
                    <motion.div
                      key={spec.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div
                        className={`card-interactive ${glassCardHover} rounded-2xl p-5 text-center cursor-pointer group`}
                        onClick={() => { setSelectedSpecialty(spec.id); setStep("doctor"); }}
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 mx-auto mb-3 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Heart className="w-5 h-5 text-primary" />
                        </div>
                        <p className="font-semibold text-foreground text-sm">{spec.name}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {specialties.length === 0 && (
                  <div className={`${glassCard} rounded-2xl p-12 text-center`}>
                    <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Nenhuma especialidade cadastrada ainda.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2: Choose Doctor */}
            {step === "doctor" && (
              <motion.div key="doctor" {...fadeUp}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Escolha o Médico</h2>
                    <p className="text-sm text-muted-foreground">
                      Especialidade: <Badge variant="secondary" className="ml-1">{selectedSpecialtyName}</Badge>
                    </p>
                  </div>
                </div>
                {loadingDoctors ? (
                  <div className={`${glassCard} rounded-2xl p-12 text-center`}>
                    <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm">Carregando médicos...</p>
                  </div>
                ) : doctors.length === 0 ? (
                  <div className={`${glassCard} rounded-2xl p-12 text-center`}>
                    <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Nenhum médico disponível nesta especialidade.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {doctors.map((doc, i) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                      >
                        <div
                          className={`card-interactive ${glassCardHover} rounded-2xl p-5 cursor-pointer group`}
                          onClick={() => { setSelectedDoctor(doc); setSelectedDate(undefined); setSelectedTime(null); setStep("datetime"); }}
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="w-14 h-14 flex-shrink-0 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-lg">
                                {doc.first_name[0]}{doc.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-foreground">Dr(a). {doc.first_name} {doc.last_name}</h3>
                              <p className="text-xs text-muted-foreground">CRM {doc.crm}/{doc.crm_state}</p>
                              {doc.specialties.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {doc.specialties.map(s => <Badge key={s} variant="secondary" className="text-[10px] px-2 py-0">{s}</Badge>)}
                                </div>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                {doc.rating > 0 && (
                                  <span className="flex items-center gap-1 text-sm">
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                    <span className="font-semibold">{doc.rating.toFixed(1)}</span>
                                  </span>
                                )}
                                {doc.experience_years > 0 && (
                                  <span className="text-xs text-muted-foreground">{doc.experience_years} anos</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-2xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                R${doc.consultation_price}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">por consulta</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: Date & Time */}
            {step === "datetime" && selectedDoctor && (
              <motion.div key="datetime" {...fadeUp}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CalIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Escolha Data e Horário</h2>
                    <p className="text-sm text-muted-foreground">
                      Dr(a). {selectedDoctor.first_name} {selectedDoctor.last_name} · <span className="font-semibold text-foreground">R${selectedDoctor.consultation_price}</span>
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className={`${glassCard} rounded-2xl p-5`}>
                    <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                      <CalIcon className="w-4 h-4 text-primary" /> Selecione a Data
                    </h3>
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
                  </div>

                  <div className="space-y-4">
                    <div className={`${glassCard} rounded-2xl p-5`}>
                      <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" /> Horários Disponíveis
                      </h3>
                      {!selectedDate ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">Selecione uma data primeiro.</p>
                      ) : availableTimes.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">Nenhum horário disponível.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {availableTimes.map(time => (
                            <Button
                              key={time}
                              variant={selectedTime === time ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedTime(time)}
                              className={`transition-all ${selectedTime === time 
                                ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md shadow-primary/20 scale-105" 
                                : "hover:border-primary/40 backdrop-blur-sm bg-white/50 dark:bg-white/5"}`}
                            >
                              <Clock className="w-3 h-3 mr-1" /> {time}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedDate && selectedTime && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`${glassCard} rounded-2xl p-5 border-primary/20`}
                      >
                        <div className="flex items-start gap-3">
                          <img src={mascotThumbsup} alt="" className="w-12 h-12 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="font-bold text-foreground mb-2 text-sm">Resumo</h3>
                            <div className="space-y-1.5 text-xs text-muted-foreground">
                              <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-secondary flex-shrink-0" />Dr(a). {selectedDoctor.first_name} {selectedDoctor.last_name}</p>
                              <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-secondary flex-shrink-0" />{selectedSpecialtyName}</p>
                              <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-secondary flex-shrink-0" />{format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                              <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-secondary flex-shrink-0" />{selectedTime}h</p>
                              <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-secondary flex-shrink-0" />R${selectedDoctor.consultation_price}</p>
                            </div>
                            <Button className="w-full mt-4 bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/20 hover:shadow-primary/30" onClick={() => setStep("patient_info")}>
                              Preencher Dados →
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Patient Info */}
            {step === "patient_info" && (
              <motion.div key="patient_info" {...fadeUp}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Seus Dados</h2>
                    <p className="text-sm text-muted-foreground">Preencha para receber a confirmação</p>
                  </div>
                </div>
                <div className={`${glassCard} rounded-2xl p-6 md:p-8`}>
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                    <img src={mascotReading} alt="" className="w-14 h-14" />
                    <p className="text-sm text-muted-foreground">Seus dados são protegidos e usados apenas para esta consulta.</p>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground/80 mb-1.5"><User className="w-3.5 h-3.5 text-primary" /> Nome Completo *</Label>
                      <Input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Seu nome completo" className="backdrop-blur-sm bg-white/50 dark:bg-white/5 border-white/20 focus:border-primary/50 rounded-xl h-11" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground/80 mb-1.5"><Mail className="w-3.5 h-3.5 text-primary" /> Email *</Label>
                        <Input value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="seu@email.com" type="email" className="backdrop-blur-sm bg-white/50 dark:bg-white/5 border-white/20 focus:border-primary/50 rounded-xl h-11" />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground/80 mb-1.5"><Phone className="w-3.5 h-3.5 text-primary" /> Telefone *</Label>
                        <Input value={guestPhone} onChange={e => setGuestPhone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" className="backdrop-blur-sm bg-white/50 dark:bg-white/5 border-white/20 focus:border-primary/50 rounded-xl h-11" maxLength={15} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground/80 mb-1.5"><FileText className="w-3.5 h-3.5 text-primary" /> CPF *</Label>
                        <Input value={guestCpf} onChange={e => setGuestCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" className="backdrop-blur-sm bg-white/50 dark:bg-white/5 border-white/20 focus:border-primary/50 rounded-xl h-11" maxLength={14} />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-foreground/80 mb-1.5">Data de Nascimento</Label>
                        <Input value={guestDob} onChange={e => setGuestDob(e.target.value)} type="date" className="backdrop-blur-sm bg-white/50 dark:bg-white/5 border-white/20 focus:border-primary/50 rounded-xl h-11 mt-1.5" />
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 rounded-xl h-12 text-base font-semibold mt-2" 
                      onClick={validatePatientInfo}
                    >
                      Ir para Pagamento →
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Checkout */}
            {step === "checkout" && (
              <motion.div key="checkout" {...fadeUp}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Pagamento Seguro</h2>
                    <p className="text-sm text-muted-foreground">Processado via Asaas · Ambiente seguro</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-5 gap-4">
                  {/* Order Summary - 2 cols */}
                  <div className="md:col-span-2">
                    <div className={`${glassCard} rounded-2xl p-6 sticky top-28`}>
                      <h3 className="font-bold text-foreground mb-4 text-sm flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-primary" /> Resumo
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Consulta Avulsa</span>
                          <span className="font-bold text-foreground">R${totalPrice}</span>
                        </div>
                        {selectedDoctor && (
                          <div className="text-muted-foreground text-xs space-y-1.5 py-3 border-y border-white/10">
                            <p className="flex items-center gap-2"><User className="w-3 h-3" /> Dr(a). {selectedDoctor.first_name} {selectedDoctor.last_name}</p>
                            <p className="flex items-center gap-2"><Heart className="w-3 h-3" /> {selectedSpecialtyName}</p>
                            {selectedDate && <p className="flex items-center gap-2"><CalIcon className="w-3 h-3" /> {format(selectedDate, "dd/MM/yyyy")} às {selectedTime}h</p>}
                            <p className="flex items-center gap-2"><Mail className="w-3 h-3" /> {guestName}</p>
                          </div>
                        )}
                        <div className="flex justify-between items-baseline pt-1">
                          <span className="font-bold text-foreground">Total</span>
                          <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            R${totalPrice}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 p-3 rounded-xl bg-secondary/5 border border-secondary/10">
                        <div className="flex items-center gap-2 text-xs text-secondary">
                          <Shield className="w-3.5 h-3.5 flex-shrink-0" /> Pagamento seguro · Dados criptografados
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Form - 3 cols */}
                  <div className="md:col-span-3">
                    <div className={`${glassCard} rounded-2xl p-6`}>
                      <h3 className="font-bold text-foreground mb-5 text-sm">Forma de Pagamento</h3>

                      {/* Payment method tabs */}
                      <div className="grid grid-cols-3 gap-2 mb-6">
                        {([
                          { key: "pix" as const, label: "PIX", icon: QrCode, desc: "Aprovação instantânea" },
                          { key: "credit" as const, label: "Cartão", icon: CreditCard, desc: "Até 12x" },
                          { key: "boleto" as const, label: "Boleto", icon: FileText, desc: "Vence em 3 dias" },
                        ]).map(({ key, label, icon: Icon, desc }) => (
                          <button
                            key={key}
                            onClick={() => setPaymentMethod(key)}
                            className={`relative p-4 rounded-xl text-center transition-all duration-300 ${
                              paymentMethod === key 
                                ? "bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/40 shadow-lg shadow-primary/10" 
                                : "border-2 border-transparent bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10"
                            }`}
                          >
                            <Icon className={`w-6 h-6 mx-auto mb-1 ${paymentMethod === key ? "text-primary" : "text-muted-foreground"}`} />
                            <p className={`text-xs font-bold ${paymentMethod === key ? "text-primary" : "text-foreground"}`}>{label}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">{desc}</p>
                            {paymentMethod === key && (
                              <motion.div layoutId="activePayment" className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </motion.div>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Credit Card Form */}
                      <AnimatePresence mode="wait">
                        {paymentMethod === "credit" && (
                          <motion.div key="credit" {...fadeUp} className="space-y-4">
                            <div>
                              <Label className="text-xs font-semibold text-foreground/80 mb-1.5">Nome no cartão</Label>
                              <Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Nome completo" className="backdrop-blur-sm bg-white/50 dark:bg-white/5 border-white/20 focus:border-primary/50 rounded-xl h-11 mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-foreground/80 mb-1.5">Número do cartão</Label>
                              <Input value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} placeholder="0000 0000 0000 0000" className="backdrop-blur-sm bg-white/50 dark:bg-white/5 border-white/20 focus:border-primary/50 rounded-xl h-11 font-mono mt-1" maxLength={19} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs font-semibold text-foreground/80 mb-1.5">Validade</Label>
                                <Input value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} placeholder="MM/AA" className="backdrop-blur-sm bg-white/50 dark:bg-white/5 border-white/20 focus:border-primary/50 rounded-xl h-11 font-mono mt-1" maxLength={5} />
                              </div>
                              <div>
                                <Label className="text-xs font-semibold text-foreground/80 mb-1.5">CVV</Label>
                                <Input value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="000" className="backdrop-blur-sm bg-white/50 dark:bg-white/5 border-white/20 focus:border-primary/50 rounded-xl h-11 font-mono mt-1" maxLength={4} type="password" />
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {paymentMethod === "pix" && (
                          <motion.div key="pix" {...fadeUp} className="text-center py-4">
                            <div className="w-44 h-44 mx-auto rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-dashed border-primary/20 flex items-center justify-center mb-4">
                              <div className="text-center">
                                <QrCode className="w-14 h-14 text-primary/40 mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground font-medium">QR Code PIX</p>
                                <p className="text-[10px] text-muted-foreground">Gerado ao confirmar</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                              Pagamento instantâneo · Confirmação automática via webhook Asaas
                            </p>
                          </motion.div>
                        )}

                        {paymentMethod === "boleto" && (
                          <motion.div key="boleto" {...fadeUp} className="text-center py-4">
                            <div className="w-full rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-dashed border-primary/20 p-8 mb-4">
                              <FileText className="w-14 h-14 text-primary/40 mx-auto mb-3" />
                              <p className="text-sm text-foreground font-semibold mb-1">Boleto Bancário</p>
                              <p className="text-xs text-muted-foreground">Gerado automaticamente após confirmar</p>
                            </div>
                            <p className="text-xs text-muted-foreground">Vence em 3 dias úteis · Confirmação em até 3 dias após pagamento</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button
                        className="w-full bg-gradient-to-r from-primary to-primary/80 text-white shadow-xl shadow-primary/20 hover:shadow-primary/30 rounded-xl h-13 text-base font-bold mt-6 relative overflow-hidden group"
                        size="lg"
                        onClick={handleCheckout}
                        disabled={processing}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        {processing ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            Processando...
                          </span>
                        ) : paymentMethod === "credit"
                          ? `Pagar R$${totalPrice}`
                          : paymentMethod === "pix"
                          ? `Confirmar PIX — R$${totalPrice}`
                          : `Gerar Boleto — R$${totalPrice}`}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 6: Success */}
            {step === "success" && (
              <motion.div key="success" {...fadeUp} className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/5 mx-auto flex items-center justify-center mb-4 ring-4 ring-secondary/10"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <Check className="w-12 h-12 text-secondary" />
                  </motion.div>
                </motion.div>

                <motion.img
                  src={mascotThumbsup}
                  alt="Mascote comemorando"
                  className="w-24 h-24 mx-auto mb-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                />

                <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                  Consulta Agendada!
                </h2>

                {/* Payment status badge */}
                {(pixQrCode || boletoUrl) && (
                  <div className="mb-4">
                    {paymentConfirmed ? (
                      <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 px-3 py-1">
                        <Check className="w-3.5 h-3.5 mr-1.5" /> Pagamento Confirmado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 px-3 py-1 animate-pulse">
                        <Clock className="w-3.5 h-3.5 mr-1.5" /> Aguardando Pagamento...
                      </Badge>
                    )}
                  </div>
                )}

                <p className="text-muted-foreground mb-1">
                  {selectedDoctor && selectedDate && selectedTime && (
                    <>Dr(a). {selectedDoctor.first_name} · {format(selectedDate, "dd/MM/yyyy")} às {selectedTime}h</>
                  )}
                </p>
                <p className="text-muted-foreground text-sm mb-6">
                  Confirmação enviada para <strong className="text-foreground">{guestEmail}</strong>
                </p>

                {/* PIX QR Code display */}
                {pixQrCode && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="max-w-sm mx-auto mb-6"
                  >
                    <div className={`${glassCard} rounded-2xl p-6`}>
                      <h3 className="font-bold text-foreground mb-3 flex items-center gap-2 justify-center">
                        <QrCode className="w-5 h-5 text-primary" /> Pague com PIX
                      </h3>
                      <div className="bg-white rounded-xl p-4 mb-4">
                        <img src={`data:image/png;base64,${pixQrCode}`} alt="QR Code PIX" className="w-48 h-48 mx-auto" />
                      </div>
                      {pixCopyPaste && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Ou copie o código:</p>
                          <div className="bg-muted/50 rounded-xl p-3 break-all text-[10px] font-mono text-foreground mb-3">
                            {pixCopyPaste.substring(0, 60)}...
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-xl"
                            onClick={() => { navigator.clipboard.writeText(pixCopyPaste); toast.success("Código PIX copiado!"); }}
                          >
                            <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar Código PIX
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Boleto URL */}
                {boletoUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="max-w-sm mx-auto mb-6"
                  >
                    <div className={`${glassCard} rounded-2xl p-6`}>
                      <h3 className="font-bold text-foreground mb-3 flex items-center gap-2 justify-center">
                        <FileText className="w-5 h-5 text-primary" /> Boleto Gerado
                      </h3>
                      <Button
                        className="w-full bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl"
                        onClick={() => window.open(boletoUrl, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" /> Abrir Boleto
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Invoice URL */}
                {invoiceUrl && (
                  <div className="mb-4">
                    <Button variant="link" size="sm" onClick={() => window.open(invoiceUrl, "_blank")} className="text-primary">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Ver fatura completa
                    </Button>
                  </div>
                )}

                {/* Consultation Link */}
                {consultationUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="max-w-md mx-auto mb-6"
                  >
                    <div className={`${glassCard} rounded-2xl p-5 border-primary/20`}>
                      <p className="text-xs text-muted-foreground mb-2">🔗 Link da consulta (guarde!):</p>
                      <div className="bg-muted/30 p-3 rounded-xl break-all text-[10px] font-mono text-foreground mb-3">
                        {consultationUrl}
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl shadow-lg shadow-primary/20"
                        onClick={() => navigator.clipboard.writeText(consultationUrl).then(() => toast.success("Link copiado!"))}
                      >
                        <Copy className="w-4 h-4 mr-2" /> Copiar Link da Consulta
                      </Button>
                    </div>
                  </motion.div>
                )}

                <Button variant="outline" onClick={() => navigate("/")} className="rounded-xl">
                  Voltar ao Início
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GuestCheckout;
