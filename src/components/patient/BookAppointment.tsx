import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { triggerAppointmentConfirmed } from "@/lib/whatsapp";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, Star, Check, UserPlus, UserCheck, AlertTriangle, CalendarDays, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, setHours, setMinutes, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

  const currentStep = !selectedDate ? 0 : !selectedTime ? 1 : 2;

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
    const dayOfWeek = date.getDay();
    return doctor.slots.some(s => s.day_of_week === dayOfWeek);
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedTime || !doctor || !user) return;
    setBooking(true);

    const [h, m] = selectedTime.split(":").map(Number);
    const scheduledAt = setMinutes(setHours(new Date(selectedDate), h), m);

    const { data: insertedAppt, error } = await supabase.from("appointments").insert({
      patient_id: user.id,
      doctor_id: doctor.id,
      scheduled_at: scheduledAt.toISOString(),
      status: "scheduled",
      appointment_type: appointmentType,
    }).select("id").single();

    setBooking(false);

    if (error || !insertedAppt) {
      toast({ title: "Erro", description: "Não foi possível agendar. Tente novamente.", variant: "destructive" });
    } else {
      triggerAppointmentConfirmed(insertedAppt.id).catch(console.error);
      toast({ title: "Consulta agendada! ✅", description: `${format(scheduledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} com Dr(a). ${doctor.first_name}` });
      navigate("/dashboard/appointments");
    }
  };

  const availableTimes = selectedDate ? getAvailableTimesForDate(selectedDate) : [];

  if (loading) return <DashboardLayout title="Paciente" nav={patientNav}><p className="text-muted-foreground">Carregando...</p></DashboardLayout>;
  if (!doctor) return <DashboardLayout title="Paciente" nav={patientNav}><p className="text-muted-foreground">Médico não encontrado.</p></DashboardLayout>;

  return (
    <DashboardLayout title="Paciente" nav={patientNav}>
      <div className="max-w-3xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 active:scale-95 transition-transform">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {/* Doctor info */}
        <Card className="border-border mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="w-12 h-12 sm:w-16 sm:h-16 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-base sm:text-lg">
                  {doctor.first_name[0]}{doctor.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-xl font-bold text-foreground truncate">Dr(a). {doctor.first_name} {doctor.last_name}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">CRM {doctor.crm}/{doctor.crm_state}</p>
                {doctor.specialties.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {doctor.specialties.map(s => <Badge key={s} variant="secondary" className="text-[10px] sm:text-xs">{s}</Badge>)}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg sm:text-2xl font-bold text-foreground">R${doctor.consultation_price}</p>
                {doctor.rating > 0 && (
                  <span className="flex items-center gap-1 text-xs sm:text-sm justify-end">
                    <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-500 fill-yellow-500" />
                    {doctor.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isDone ? "bg-primary border-primary text-primary-foreground" :
                    isActive ? "border-primary text-primary bg-primary/10" :
                    "border-muted text-muted-foreground"
                  )}>
                    {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={cn(
                    "text-xs mt-1 font-medium",
                    isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "w-16 h-0.5 mx-2 mb-5",
                    i < currentStep ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Calendar */}
          <Card className="border-border">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" /> Escolha a Data</CardTitle></CardHeader>
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

          {/* Time slots + confirm */}
          <div>
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Horários Disponíveis</CardTitle></CardHeader>
              <CardContent>
                {!selectedDate ? (
                  <div className="text-center py-8">
                    <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Selecione uma data no calendário</p>
                  </div>
                ) : availableTimes.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum horário disponível nesta data.</p>
                    <p className="text-xs text-muted-foreground mt-1">Tente outra data.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5 sm:gap-2">
                    {availableTimes.map(time => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          "transition-all h-10 sm:h-9 text-sm active:scale-95",
                          selectedTime === time && "bg-gradient-hero text-primary-foreground scale-105 shadow-md"
                        )}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {time}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedDate && selectedTime && (
              <Card className="border-border mt-4 ring-2 ring-primary/20">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Confirmar Agendamento
                  </h3>
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Tipo de Consulta</p>
                    <Select value={appointmentType} onValueChange={setAppointmentType}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first_visit"><span className="flex items-center gap-2"><UserPlus className="w-3 h-3" /> 1ª Consulta</span></SelectItem>
                        <SelectItem value="return"><span className="flex items-center gap-2"><UserCheck className="w-3 h-3" /> Retorno</span></SelectItem>
                        <SelectItem value="urgency"><span className="flex items-center gap-2"><AlertTriangle className="w-3 h-3" /> Urgência</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm mb-4">
                    <p className="flex items-center gap-2 text-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      Dr(a). {doctor.first_name} {doctor.last_name}
                    </p>
                    <p className="flex items-center gap-2 text-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <p className="flex items-center gap-2 text-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {selectedTime}h
                    </p>
                    <p className="flex items-center gap-2 text-foreground font-semibold">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      R${doctor.consultation_price}
                    </p>
                  </div>
                  <Button
                    className="w-full bg-gradient-hero text-primary-foreground h-12 sm:h-12 text-base active:scale-[0.98] transition-transform"
                    onClick={handleBook}
                    disabled={booking}
                  >
                    {booking ? "Agendando..." : "✅ Confirmar Agendamento"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BookAppointment;
