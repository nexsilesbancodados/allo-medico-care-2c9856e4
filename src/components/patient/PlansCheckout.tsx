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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Check, Star, CreditCard, Calendar as CalIcon, Clock, FileText,
  Search, ArrowLeft, Shield, User, History, QrCode, FileBarChart, Copy, CheckCircle2, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, setHours, setMinutes, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  {
    id: "mensal",
    name: "Plano Mensal",
    price: 149,
    period: "por mês",
    description: "Acesso ilimitado para cuidar da saúde da família.",
    features: ["Consultas ilimitadas", "Receitas digitais ilimitadas", "Chat ilimitado com médicos", "Prioridade no agendamento", "Prontuário digital completo", "Acesso para até 4 dependentes"],
    highlighted: true,
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
  const { toast } = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("select");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

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

  const currentPlan = plans.find(p => p.id === selectedPlan);

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
        first_name: (p as any)?.first_name ?? "",
        last_name: (p as any)?.last_name ?? "",
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
    if (planId === "avulsa") {
      navigate("/consulta-avulsa");
      return;
    }
    setSelectedPlan(planId);
    setStep("checkout");
  };

  const handleSelectSpecialty = (specId: string) => {
    setSelectedSpecialty(specId);
    setStep("doctor");
  };

  const handleSelectDoctor = (doc: DoctorOption) => {
    setSelectedDoctor(doc);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setStep("datetime");
  };

  const handleProceedToPayment = () => {
    setStep("checkout");
  };

  const handleCheckout = async () => {
    if (paymentMethod === "card" && (!cardName || !cardNumber || !cardExpiry || !cardCvv)) {
      toast({ title: "Preencha todos os campos do cartão", variant: "destructive" });
      return;
    }
    setProcessing(true);

    // If avulsa, also create the appointment
    if (selectedPlan === "avulsa" && selectedDoctor && selectedDate && selectedTime && user) {
      const [h, m] = selectedTime.split(":").map(Number);
      const scheduledAt = setMinutes(setHours(new Date(selectedDate), h), m);
      const { error } = await supabase.from("appointments").insert({
        patient_id: user.id,
        doctor_id: selectedDoctor.id,
        scheduled_at: scheduledAt.toISOString(),
        status: "scheduled",
        payment_status: "approved",
      });
      if (error) {
        toast({ title: "Erro ao agendar", description: "Tente novamente.", variant: "destructive" });
        setProcessing(false);
        return;
      }
    }

    // Simulate payment processing
    const delay = paymentMethod === "pix" ? 3000 : paymentMethod === "boleto" ? 2000 : 2500;
    setTimeout(() => {
      setProcessing(false);
      setStep("success");
    }, delay);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText("00020126580014br.gov.bcb.pix0136aloclinica-demo-pix-key-simulated5204000053039865802BR5925ALOCLINICA SAUDE LTDA6009SAO PAULO62070503***6304ABCD");
    setPixCopied(true);
    toast({ title: "Código PIX copiado!" });
    setTimeout(() => setPixCopied(false), 3000);
  };

  const formatPixTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const goBack = () => {
    if (step === "specialty") setStep("select");
    else if (step === "doctor") setStep("specialty");
    else if (step === "datetime") setStep("doctor");
    else if (step === "checkout") {
      if (selectedPlan === "avulsa") setStep("datetime");
      else setStep("select");
    }
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
  const basePrice = selectedPlan === "avulsa" ? (selectedDoctor?.consultation_price ?? 89) : (currentPlan?.price ?? 149);
  const discountAmount = basePrice * (couponDiscount / 100);
  const totalPrice = basePrice - discountAmount;

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
      toast({ title: "Cupom inválido", variant: "destructive" });
    } else {
      const expired = data.expires_at && new Date(data.expires_at) < new Date();
      const maxReached = data.max_uses && data.times_used >= data.max_uses;
      if (expired || maxReached) {
        setCouponValid(false);
        setCouponDiscount(0);
        toast({ title: expired ? "Cupom expirado" : "Cupom esgotado", variant: "destructive" });
      } else {
        setCouponValid(true);
        setCouponDiscount(Number(data.discount_percentage));
        toast({ title: `Cupom aplicado! ${data.discount_percentage}% de desconto 🎉` });
      }
    }
    setCheckingCoupon(false);
  };

  // Step indicators
  const avulsaSteps = ["Plano", "Especialidade", "Médico", "Data/Hora", "Pagamento"];
  const mensalSteps = ["Plano", "Pagamento"];
  const stepLabels = selectedPlan === "avulsa" ? avulsaSteps : mensalSteps;
  const stepIndex = selectedPlan === "avulsa"
    ? { select: 0, specialty: 1, doctor: 2, datetime: 3, checkout: 4, success: 5 }[step]
    : { select: 0, checkout: 1, success: 2 }[step] ?? 0;

  return (
    <DashboardLayout title="Paciente" nav={patientNav}>
      <div className={step === "checkout" ? "max-w-4xl" : "max-w-3xl"}>

        {/* Step indicator */}
        {step !== "select" && step !== "success" && (
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

        {/* STEP 1: Select Plan */}
        {step === "select" && (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-1">Escolha seu Plano</h1>
            <p className="text-muted-foreground mb-8">Selecione o plano ideal para você</p>
            <div className="grid md:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  whileHover={{ scale: 1.02 }}
                  className={`relative rounded-2xl p-6 border cursor-pointer transition-all ${
                    plan.highlighted
                      ? "bg-gradient-hero text-primary-foreground border-transparent shadow-elevated"
                      : "bg-card border-border shadow-card hover:shadow-elevated"
                  }`}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-card text-primary text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3" /> Mais popular
                    </div>
                  )}
                  <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? "" : "text-foreground"}`}>{plan.name}</h3>
                  <p className={`text-sm mb-4 ${plan.highlighted ? "opacity-80" : "text-muted-foreground"}`}>{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold">R${plan.price}</span>
                    <span className={`text-sm ml-1 ${plan.highlighted ? "opacity-70" : "text-muted-foreground"}`}>{plan.period}</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* STEP 2: Choose Specialty (avulsa only) */}
        {step === "specialty" && (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-1">Escolha a Especialidade</h1>
            <p className="text-muted-foreground mb-6">Qual tipo de consulta você precisa?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {specialties.map(spec => (
                <Card
                  key={spec.id}
                  className="border-border hover:shadow-card transition-shadow cursor-pointer hover:border-primary/50"
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
                  <Card key={doc.id} className="border-border hover:shadow-card transition-shadow cursor-pointer" onClick={() => handleSelectDoctor(doc)}>
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
              <h1 className="text-2xl font-bold text-foreground">Checkout Seguro</h1>
              <p className="text-muted-foreground text-sm">Ambiente protegido • Pagamento simulado</p>
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
                        <span>Pagamento simulado — nenhuma cobrança será realizada</span>
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
                          <div className="mb-4">
                            <Badge variant="outline" className="text-xs mb-3">
                              Expira em {formatPixTime(pixCountdown)}
                            </Badge>
                          </div>
                          {/* Simulated QR Code */}
                          <div className="w-48 h-48 mx-auto rounded-2xl bg-card border-2 border-border p-3 mb-4 relative overflow-hidden">
                            <div className="w-full h-full rounded-xl bg-foreground/5 grid grid-cols-8 grid-rows-8 gap-px">
                              {Array.from({ length: 64 }).map((_, i) => (
                                <div key={i} className={`rounded-[2px] ${Math.random() > 0.45 ? "bg-foreground" : "bg-card"}`} />
                              ))}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-10 h-10 rounded-lg bg-card border-2 border-primary flex items-center justify-center">
                                <QrCode className="w-5 h-5 text-primary" />
                              </div>
                            </div>
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
                          <Button
                            className="w-full bg-gradient-hero text-primary-foreground h-12 text-base"
                            onClick={handleCheckout}
                            disabled={processing}
                          >
                            {processing ? (
                              <motion.div className="flex items-center gap-2" animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                Confirmando pagamento...
                              </motion.div>
                            ) : `Já paguei • R$ ${totalPrice.toFixed(2)}`}
                          </Button>
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
                          <div className="p-4 rounded-xl bg-muted/50 border border-border mb-4">
                            <p className="text-xs text-muted-foreground mb-1">Linha digitável (simulada)</p>
                            <p className="font-mono text-xs text-foreground break-all">
                              23793.38128 60000.000003 00000.000400 1 93670000{String(Math.round(totalPrice * 100)).padStart(8, "0")}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full mb-3"
                            onClick={() => {
                              navigator.clipboard.writeText("23793.38128 60000.000003 00000.000400 1 93670000" + String(Math.round(totalPrice * 100)).padStart(8, "0"));
                              toast({ title: "Código de barras copiado!" });
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" /> Copiar código
                          </Button>
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
            <p className="text-xs text-muted-foreground mb-6">
              Pagamento via {paymentMethod === "pix" ? "PIX" : paymentMethod === "card" ? "Cartão de Crédito" : "Boleto"} • Simulado
            </p>
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
    </DashboardLayout>
  );
};

export default PlansCheckout;
