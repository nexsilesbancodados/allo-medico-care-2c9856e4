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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Check, Star, CreditCard, Calendar as CalIcon, Clock,
  Search, ArrowLeft, Shield, User, Mail, Phone, FileText
} from "lucide-react";
import { motion } from "framer-motion";
import { format, addDays, setHours, setMinutes, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import SEOHead from "@/components/SEOHead";
import { validarCPF } from "@/lib/cpf";

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

const GuestCheckout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "pix" | "boleto">("credit");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  // Success
  const [consultationUrl, setConsultationUrl] = useState("");

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
    if (paymentMethod === "credit" && (!cardName || !cardNumber || !cardExpiry || !cardCvv)) {
      toast({ title: "Preencha todos os dados do cartão", variant: "destructive" });
      return;
    }
    if (!selectedDoctor || !selectedDate || !selectedTime) return;

    setProcessing(true);

    const [h, m] = selectedTime.split(":").map(Number);
    const scheduledAt = setMinutes(setHours(new Date(selectedDate), h), m);

    try {
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

      setConsultationUrl(data.consultation_url);
      setStep("success");
    } catch (err: any) {
      toast({ title: "Erro ao agendar", description: err.message || "Tente novamente.", variant: "destructive" });
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
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      toast({ title: "Email inválido", variant: "destructive" });
      return;
    }
    if (!validarCPF(guestCpf)) {
      toast({ title: "CPF inválido", variant: "destructive" });
      return;
    }
    setStep("checkout");
  };

  const availableTimes = selectedDate ? getAvailableTimesForDate(selectedDate) : [];
  const selectedSpecialtyName = specialties.find(s => s.id === selectedSpecialty)?.name;
  const totalPrice = selectedDoctor?.consultation_price ?? 89;

  const stepLabels = ["Especialidade", "Médico", "Data/Hora", "Seus Dados", "Pagamento"];
  const stepIndex = { specialty: 0, doctor: 1, datetime: 2, patient_info: 3, checkout: 4, success: 5 }[step];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <SEOHead title="Consulta Avulsa" description="Agende uma consulta médica avulsa sem cadastro na AloClinica. Pagamento seguro e consulta por vídeo." />
      <main className="flex-1 pt-24 md:pt-28 pb-8 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Consulta Avulsa</h1>
            <p className="text-muted-foreground">Agende sua consulta sem precisar se cadastrar</p>
          </div>

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
                      i < stepIndex ? "bg-secondary/20 text-secondary" :
                      i === stepIndex ? "bg-primary text-primary-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i < stepIndex ? <Check className="w-3 h-3" /> : null}
                      {label}
                    </div>
                    {i < stepLabels.length - 1 && <div className="w-4 h-px bg-border flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: Choose Specialty */}
          {step === "specialty" && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-1">Escolha a Especialidade</h2>
              <p className="text-muted-foreground mb-6">Qual tipo de consulta você precisa?</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {specialties.map(spec => (
                  <Card
                    key={spec.id}
                    className="border-border hover:shadow-card transition-shadow cursor-pointer hover:border-primary/50"
                    onClick={() => { setSelectedSpecialty(spec.id); setStep("doctor"); }}
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

          {/* STEP 2: Choose Doctor */}
          {step === "doctor" && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-1">Escolha o Médico</h2>
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
                    <Card key={doc.id} className="border-border hover:shadow-card transition-shadow cursor-pointer" onClick={() => { setSelectedDoctor(doc); setSelectedDate(undefined); setSelectedTime(null); setStep("datetime"); }}>
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

          {/* STEP 3: Date & Time */}
          {step === "datetime" && selectedDoctor && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-1">Escolha Data e Horário</h2>
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
                        <Button className="w-full bg-gradient-hero text-primary-foreground" onClick={() => setStep("patient_info")}>
                          Preencher Dados
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}

          {/* STEP 4: Patient Info */}
          {step === "patient_info" && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-1">Seus Dados</h2>
              <p className="text-muted-foreground mb-6">Preencha seus dados para receber a confirmação</p>
              <Card className="border-border">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label className="text-xs flex items-center gap-1"><User className="w-3 h-3" /> Nome Completo *</Label>
                    <Input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Seu nome completo" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> Email *</Label>
                    <Input value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="seu@email.com" type="email" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> Telefone *</Label>
                    <Input value={guestPhone} onChange={e => setGuestPhone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" className="mt-1" maxLength={15} />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1"><FileText className="w-3 h-3" /> CPF *</Label>
                    <Input value={guestCpf} onChange={e => setGuestCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" className="mt-1" maxLength={14} />
                  </div>
                  <div>
                    <Label className="text-xs">Data de Nascimento</Label>
                    <Input value={guestDob} onChange={e => setGuestDob(e.target.value)} type="date" className="mt-1" />
                  </div>
                  <Button className="w-full bg-gradient-hero text-primary-foreground mt-2" onClick={validatePatientInfo}>
                    Ir para Pagamento
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* STEP 5: Checkout */}
          {step === "checkout" && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-6">Pagamento</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-border">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-foreground mb-4">Resumo do Pedido</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Consulta Avulsa</span>
                        <span className="font-semibold text-foreground">R${totalPrice}</span>
                      </div>
                      {selectedDoctor && (
                        <div className="text-muted-foreground text-xs space-y-1">
                          <p>Dr(a). {selectedDoctor.first_name} {selectedDoctor.last_name}</p>
                          <p>{selectedSpecialtyName}</p>
                          {selectedDate && <p>{format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às {selectedTime}h</p>}
                          <p>Paciente: {guestName}</p>
                          <p>Email: {guestEmail}</p>
                        </div>
                      )}
                      <div className="border-t border-border pt-3 flex justify-between">
                        <span className="font-bold text-foreground">Total</span>
                        <span className="font-bold text-foreground text-lg">R${totalPrice}</span>
                      </div>
                    </div>
                    <div className="mt-6 p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="w-4 h-4" /> Pagamento simulado — sem cobrança real
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-foreground mb-4">Forma de Pagamento</h3>

                    {/* Payment method tabs */}
                    <div className="flex gap-2 mb-6">
                      {([
                        { key: "credit" as const, label: "Cartão", icon: CreditCard },
                        { key: "pix" as const, label: "PIX", icon: Shield },
                        { key: "boleto" as const, label: "Boleto", icon: FileText },
                      ]).map(({ key, label, icon: Icon }) => (
                        <Button
                          key={key}
                          variant={paymentMethod === key ? "default" : "outline"}
                          size="sm"
                          className={`flex-1 gap-1.5 ${paymentMethod === key ? "bg-gradient-hero text-primary-foreground" : ""}`}
                          onClick={() => setPaymentMethod(key)}
                        >
                          <Icon className="w-4 h-4" /> {label}
                        </Button>
                      ))}
                    </div>

                    {/* Credit Card */}
                    {paymentMethod === "credit" && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs">Nome no cartão</Label>
                          <Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Nome completo" className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs">Número do cartão</Label>
                          <Input value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} placeholder="0000 0000 0000 0000" className="mt-1 font-mono" maxLength={19} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Validade</Label>
                            <Input value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} placeholder="MM/AA" className="mt-1 font-mono" maxLength={5} />
                          </div>
                          <div>
                            <Label className="text-xs">CVV</Label>
                            <Input value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="000" className="mt-1 font-mono" maxLength={4} type="password" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PIX */}
                    {paymentMethod === "pix" && (
                      <div className="text-center space-y-4">
                        <div className="w-48 h-48 mx-auto bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-border">
                          <div className="text-center">
                            <Shield className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">QR Code PIX</p>
                            <p className="text-xs text-muted-foreground">(simulado)</p>
                          </div>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Chave PIX (copia e cola):</p>
                          <p className="text-sm font-mono text-foreground break-all">00020126580014br.gov.bcb.pix0136aloclinica-simulado</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Após o pagamento, a confirmação será automática.</p>
                      </div>
                    )}

                    {/* Boleto */}
                    {paymentMethod === "boleto" && (
                      <div className="text-center space-y-4">
                        <div className="w-full bg-muted rounded-xl p-6 border-2 border-dashed border-border">
                          <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground mb-2">Boleto Bancário (simulado)</p>
                          <div className="bg-background p-3 rounded-lg">
                            <p className="text-xs font-mono text-foreground break-all">23793.38128 60000.000003 00000.000400 1 84340000008900</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">O boleto vence em 3 dias úteis. Após confirmação do pagamento, você receberá o link da consulta por email.</p>
                      </div>
                    )}

                    <Button
                      className="w-full bg-gradient-hero text-primary-foreground mt-6"
                      size="lg"
                      onClick={handleCheckout}
                      disabled={processing}
                    >
                      {processing ? "Processando..." : paymentMethod === "credit"
                        ? `Pagar R$${totalPrice}`
                        : paymentMethod === "pix"
                        ? `Confirmar PIX — R$${totalPrice}`
                        : `Gerar Boleto — R$${totalPrice}`}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* STEP 6: Success */}
          {step === "success" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-secondary/10 mx-auto flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Consulta Agendada!</h2>
              <p className="text-muted-foreground mb-2">
                {selectedDoctor && selectedDate && selectedTime && (
                  <>Consulta com Dr(a). {selectedDoctor.first_name} em {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às {selectedTime}h</>
                )}
              </p>
              <p className="text-muted-foreground mb-4 text-sm">
                Um email de confirmação foi enviado para <strong>{guestEmail}</strong> com o link de acesso à consulta.
              </p>
              <Badge variant="default" className="mb-6">Consulta Confirmada</Badge>

              {consultationUrl && (
                <div className="mt-4">
                  <Card className="border-border max-w-md mx-auto">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-2">Guarde este link para acessar sua consulta:</p>
                      <div className="bg-muted p-3 rounded-lg break-all text-xs font-mono text-foreground">
                        {consultationUrl}
                      </div>
                      <Button
                        className="w-full mt-3 bg-gradient-hero text-primary-foreground"
                        onClick={() => navigator.clipboard.writeText(consultationUrl).then(() => toast({ title: "Link copiado!" }))}
                      >
                        Copiar Link
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="mt-6">
                <Button variant="outline" onClick={() => navigate("/")}>
                  Voltar ao Início
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GuestCheckout;
