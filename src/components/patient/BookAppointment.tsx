import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { triggerAppointmentConfirmed } from "@/lib/whatsapp";
import { notifyNewAppointment } from "@/lib/notifications";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, Star, Check, UserPlus, UserCheck, AlertTriangle, CalendarDays, CheckCircle2, ChevronRight, Stethoscope } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, setHours, setMinutes, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { getFeriadosNacionais } from "@/lib/feriados";

import { getPatientNav } from "./patientNav";
const patientNav = getPatientNav("schedule");

interface DoctorInfo {
  id: string;
  user_id: string;
  crm: string;
  crm_state: string;
  bio: string | null;
  consultation_price: number;
  rating: number;
  experience_years: number;
  first_name: string;
  last_name: string;
  specialties: string[];
  slots: { day_of_week: number; start_time: string; end_time: string }[];
}

const STEPS = [
  { key: "date", label: "Data", icon: CalendarDays },
  { key: "time", label: "Horário", icon: Clock },
  { key: "confirm", label: "Confirmar", icon: CheckCircle2 },
];

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Sem recorrência" },
  { value: "weekly", label: "Semanal (mesmo dia/hora)" },
  { value: "biweekly", label: "Quinzenal" },
  { value: "monthly", label: "Mensal" },
];

const RECURRENCE_WEEKS: Record<string, number> = { weekly: 1, biweekly: 2, monthly: 4 };

const BookAppointment = () => {
  const { doctorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctor, setDoctor] = useState<DoctorInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<string>("first_visit");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [dependents, setDependents] = useState<{ id: string; name: string; relationship: string }[]>([]);
  const [bookingFor, setBookingFor] = useState<string>("self");
  const [feriados, setFeriados] = useState<Date[]>([]);
  const [recurrence, setRecurrence] = useState("none");
  const [recurrenceCount, setRecurrenceCount] = useState(4);

  const currentStep = !selectedDate ? 0 : !selectedTime ? 1 : 2;

  useEffect(() => {
    if (user) {
      supabase.from("dependents").select("id, name, relationship").eq("user_id", user.id)
        .then(({ data }) => setDependents(data ?? []));
    }
    // Load feriados for current and next year
    const currentYear = new Date().getFullYear();
    Promise.all([getFeriadosNacionais(currentYear), getFeriadosNacionais(currentYear + 1)])
      .then(([f1, f2]) => setFeriados([...f1, ...f2]));
  }, [user]);

  useEffect(() => {
    if (doctorId) fetchDoctor();
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate && doctorId) fetchBookedSlots();
  }, [selectedDate]);

  const fetchDoctor = async () => {
    const { data: doc } = await supabase
      .from("doctor_profiles")
      .select("id, user_id, crm, crm_state, bio, consultation_price, rating, experience_years")
      .eq("id", doctorId)
      .single();

    if (!doc) { setLoading(false); return; }

    const [profileRes, specsRes, slotsRes] = await Promise.all([
      supabase.from("profiles").select("first_name, last_name").eq("user_id", doc.user_id).single(),
      supabase.from("doctor_specialties").select("specialties(name)").eq("doctor_id", doc.id),
      supabase.from("availability_slots").select("day_of_week, start_time, end_time").eq("doctor_id", doc.id).eq("is_active", true),
    ]);

    setDoctor({
      ...doc,
      consultation_price: Number(doc.consultation_price),
      rating: Number(doc.rating),
      first_name: profileRes.data?.first_name ?? "",
      last_name: profileRes.data?.last_name ?? "",
      specialties: specsRes.data?.map((s: any) => s.specialties?.name).filter(Boolean) ?? [],
      slots: slotsRes.data ?? [],
    });
    setLoading(false);
  };

  const fetchBookedSlots = async () => {
    if (!selectedDate || !doctorId) return;
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from("appointments")
      .select("scheduled_at")
      .eq("doctor_id", doctorId)
      .gte("scheduled_at", dayStart.toISOString())
      .lte("scheduled_at", dayEnd.toISOString())
      .neq("status", "cancelled");

    setBookedSlots(data?.map(a => format(new Date(a.scheduled_at), "HH:mm")) ?? []);
  };

  const getAvailableTimesForDate = (date: Date): string[] => {
    if (!doctor) return [];
    const dayOfWeek = date.getDay();
    const daySlots = doctor.slots.filter(s => s.day_of_week === dayOfWeek);

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
    if (!doctor) return false;
    if (isBefore(date, new Date()) && date.toDateString() !== new Date().toDateString()) return false;
    // Check feriados
    const isFeriado = feriados.some(f => f.getFullYear() === date.getFullYear() && f.getMonth() === date.getMonth() && f.getDate() === date.getDate());
    if (isFeriado) return false;
    const dayOfWeek = date.getDay();
    return doctor.slots.some(s => s.day_of_week === dayOfWeek);
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedTime || !doctor || !user) return;
    setBooking(true);

    const [h, m] = selectedTime.split(":").map(Number);
    const scheduledAt = setMinutes(setHours(new Date(selectedDate), h), m);

    const dependentInfo = bookingFor !== "self" ? dependents.find(d => d.id === bookingFor) : null;
    const notesText = dependentInfo ? `Consulta para dependente: ${dependentInfo.name} (${dependentInfo.relationship})` : null;

    // Build list of dates (single or recurring)
    const datesToBook: Date[] = [scheduledAt];
    if (recurrence !== "none") {
      const weeksGap = RECURRENCE_WEEKS[recurrence] ?? 1;
      for (let i = 1; i < recurrenceCount; i++) {
        datesToBook.push(addDays(scheduledAt, weeksGap * 7 * i));
      }
    }

    let firstApptId: string | null = null;
    let errorOccurred = false;

    for (const dt of datesToBook) {
      const { data: insertedAppt, error } = await supabase.from("appointments").insert({
        patient_id: user.id,
        doctor_id: doctor.id,
        scheduled_at: dt.toISOString(),
        status: "scheduled",
        appointment_type: firstApptId ? "return" : appointmentType,
        notes: notesText ? notesText + (firstApptId ? ` | Recorrente` : "") : (firstApptId ? "Agendamento recorrente" : null),
        original_appointment_id: firstApptId || null,
      }).select("id").single();

      if (error || !insertedAppt) {
        errorOccurred = true;
        break;
      }

      if (!firstApptId) firstApptId = insertedAppt.id;
      triggerAppointmentConfirmed(insertedAppt.id).catch(console.error);
    }

    setBooking(false);

    if (errorOccurred || !firstApptId) {
      toast({ title: "Erro", description: "Não foi possível agendar. Tente novamente.", variant: "destructive" });
    } else {
      const patientProfile = user.user_metadata;
      const pName = `${patientProfile?.first_name || ""} ${patientProfile?.last_name || ""}`.trim() || "Paciente";
      const dateStr = format(scheduledAt, "dd/MM/yyyy", { locale: ptBR });
      const timeStr = format(scheduledAt, "HH:mm");
      notifyNewAppointment(firstApptId, doctor.id, pName, dateStr, timeStr).catch(console.error);

      const msg = recurrence !== "none"
        ? `${datesToBook.length} consultas agendadas com Dr(a). ${doctor.first_name}`
        : `${format(scheduledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} com Dr(a). ${doctor.first_name}`;
      toast({ title: "Consulta agendada! ✅", description: msg });
      navigate("/dashboard/appointments");
    }
  };

  const availableTimes = selectedDate ? getAvailableTimesForDate(selectedDate) : [];

  if (loading) return (
    <DashboardLayout title="Paciente" nav={patientNav}>
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  if (!doctor) return (
    <DashboardLayout title="Paciente" nav={patientNav}>
      <div className="text-center py-20">
        <Stethoscope className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">Médico não encontrado</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Paciente" nav={patientNav}>
      <div className="max-w-lg mx-auto pb-8">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 active:scale-95 transition-transform">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {/* Doctor card - compact with gradient */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 mb-5 hover:shadow-lg transition-shadow">
          <Avatar className="w-14 h-14 rounded-xl shrink-0">
            <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary to-secondary text-white font-bold text-lg">
              {doctor.first_name[0]}{doctor.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-foreground text-[15px] truncate">Dr(a). {doctor.first_name} {doctor.last_name}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>CRM {doctor.crm}/{doctor.crm_state}</span>
              {doctor.rating > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-warning fill-warning" /> {doctor.rating.toFixed(1)}
                </span>
              )}
            </div>
            {doctor.specialties.length > 0 && (
              <div className="flex gap-1 mt-1.5">
                {doctor.specialties.slice(0, 2).map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{s}</span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-black text-foreground">R${doctor.consultation_price}</p>
            <p className="text-[10px] text-muted-foreground">por consulta</p>
          </div>
        </div>

        {/* Step indicator - animated */}
        <div className="flex items-center justify-between px-4 mb-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <motion.div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      isDone ? "bg-primary text-primary-foreground" :
                      isActive ? "bg-primary/15 text-primary ring-2 ring-primary/30" :
                      "bg-muted text-muted-foreground"
                    )}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    {isDone ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                        <Check className="w-5 h-5" />
                      </motion.div>
                    ) : <Icon className="w-5 h-5" />}
                  </motion.div>
                  <span className={cn(
                    "text-[11px] mt-1.5 font-medium",
                    isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-full h-0.5 -mt-4 bg-muted overflow-hidden rounded-full">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: i < currentStep ? "100%" : "0%" }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Content area */}
        <AnimatePresence mode="wait">
          {/* Step 1: Date */}
          {currentStep === 0 && (
            <motion.div
              key="date"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-card rounded-2xl border border-border p-4"
            >
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" /> Escolha a data
              </h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => { setSelectedDate(d); setSelectedTime(null); }}
                disabled={(date) => !isDayAvailable(date)}
                fromDate={new Date()}
                toDate={addDays(new Date(), 60)}
                locale={ptBR}
                className="pointer-events-auto mx-auto"
              />
            </motion.div>
          )}

          {/* Step 2: Time */}
          {currentStep === 1 && selectedDate && (
            <motion.div
              key="time"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Selected date pill */}
              <button
                onClick={() => { setSelectedDate(undefined); setSelectedTime(null); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium active:scale-95 transition-transform"
              >
                <CalendarDays className="w-4 h-4" />
                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                <span className="text-primary/50 ml-1">✕</span>
              </button>

              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Horários disponíveis
                </h3>

                {availableTimes.length === 0 ? (
                  <div className="text-center py-10">
                    <Clock className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Sem horários nesta data</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 rounded-xl"
                      onClick={async () => {
                        const { error } = await supabase.from("appointment_waitlist").insert({
                          patient_id: user!.id,
                          doctor_id: doctor.id,
                          desired_date: format(selectedDate, "yyyy-MM-dd"),
                        });
                        if (!error) toast({ title: "✅ Avisaremos você!", description: "Se uma vaga abrir, você será notificado." });
                      }}
                    >
                      🔔 Me avise se vagar
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimes.map(time => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          "h-12 text-sm rounded-xl font-medium active:scale-95 transition-all",
                          selectedTime === time && "bg-gradient-hero text-primary-foreground shadow-md scale-[1.02]"
                        )}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirm */}
          {currentStep === 2 && selectedDate && selectedTime && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Edit pills */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => { setSelectedDate(undefined); setSelectedTime(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium active:scale-95 transition-transform"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  {format(selectedDate, "dd/MM", { locale: ptBR })}
                  <span className="opacity-50">✕</span>
                </button>
                <button
                  onClick={() => setSelectedTime(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium active:scale-95 transition-transform"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {selectedTime}h
                  <span className="opacity-50">✕</span>
                </button>
              </div>

              <div className="bg-card rounded-2xl border-2 border-primary/20 p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Confirmar Agendamento
                </h3>

                {/* Dependent selection */}
                {dependents.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-1.5">Para quem é a consulta?</p>
                    <Select value={bookingFor} onValueChange={setBookingFor}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self"><span className="flex items-center gap-2"><UserPlus className="w-3.5 h-3.5" /> Para mim</span></SelectItem>
                        {dependents.map(dep => (
                          <SelectItem key={dep.id} value={dep.id}>
                            <span className="flex items-center gap-2"><UserCheck className="w-3.5 h-3.5" /> {dep.name} ({dep.relationship})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Type */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-1.5">Tipo de consulta</p>
                  <Select value={appointmentType} onValueChange={setAppointmentType}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_visit"><span className="flex items-center gap-2"><UserPlus className="w-3.5 h-3.5" /> 1ª Consulta</span></SelectItem>
                      <SelectItem value="return"><span className="flex items-center gap-2"><UserCheck className="w-3.5 h-3.5" /> Retorno</span></SelectItem>
                      <SelectItem value="urgency"><span className="flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> Urgência</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Summary */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-2.5 mb-5">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    Dr(a). {doctor.first_name} {doctor.last_name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {selectedTime}h
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground font-semibold">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    R${doctor.consultation_price}
                  </div>
                </div>

                {/* Recurrence selector */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-1.5">Agendamento recorrente</p>
                  <Select value={recurrence} onValueChange={setRecurrence}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {recurrence !== "none" && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Quantas consultas?</p>
                      <Select value={String(recurrenceCount)} onValueChange={v => setRecurrenceCount(Number(v))}>
                        <SelectTrigger className="h-9 rounded-xl w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[2, 3, 4, 6, 8, 12].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} consultas</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-primary mt-1">
                        Serão agendadas {recurrenceCount} consultas no mesmo horário ({selectedTime}h), {recurrence === "weekly" ? "toda semana" : recurrence === "biweekly" ? "a cada 2 semanas" : "a cada 4 semanas"}.
                      </p>
                    </div>
                  )}
                </div>

                {/* Return policy notice */}
                {appointmentType === "return" && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20 mb-4">
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <p className="text-[11px] text-foreground/80">
                      Retornos são gratuitos dentro de 15 dias da consulta original. Fora desse prazo, será cobrado o valor integral.
                    </p>
                  </div>
                )}

                <Button
                  className="w-full h-14 rounded-xl bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground text-base font-bold shadow-xl shadow-primary/20 hover:shadow-2xl transition-shadow active:scale-[0.98]"
                  onClick={handleBook}
                  disabled={booking}
                >
                  {booking ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Agendando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      ✅ Confirmar Agendamento
                      <ChevronRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>

                <p className="text-[10px] text-center text-muted-foreground mt-3">
                  Ao confirmar, você concorda com os termos de uso e política de cancelamento.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default BookAppointment;
