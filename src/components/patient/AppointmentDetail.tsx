import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Share2, Calendar, Clock, MapPin, AlertTriangle, Check, RotateCcw, X, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface AppointmentData {
  id: string;
  scheduled_at: string;
  status: string;
  duration_minutes: number | null;
  notes: string | null;
  doctor_name: string;
  doctor_crm: string;
  specialties: string[];
  rating: number | null;
}

const AppointmentDetail = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appt, setAppt] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && appointmentId) fetchAppointment();
  }, [user, appointmentId]);

  const fetchAppointment = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("id, scheduled_at, status, duration_minutes, notes, doctor_id")
      .eq("id", appointmentId!)
      .single();

    if (!data) { setLoading(false); return; }

    const { data: doc } = await supabase
      .from("doctor_profiles")
      .select("id, crm, rating, user_id")
      .eq("id", data.doctor_id)
      .single();

    let doctorName = "Médico";
    let specialties: string[] = [];

    if (doc) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", doc.user_id)
        .single();
      if (profile) doctorName = `Dr(a). ${profile.first_name} ${profile.last_name}`;

      const { data: specs } = await supabase
        .from("doctor_specialties")
        .select("specialty_id")
        .eq("doctor_id", doc.id);
      if (specs?.length) {
        const { data: specNames } = await supabase
          .from("specialties")
          .select("name")
          .in("id", specs.map(s => s.specialty_id));
        specialties = specNames?.map(s => s.name) ?? [];
      }
    }

    setAppt({
      id: data.id,
      scheduled_at: data.scheduled_at,
      status: data.status,
      duration_minutes: data.duration_minutes,
      notes: data.notes,
      doctor_name: doctorName,
      doctor_crm: doc?.crm ?? "",
      specialties,
      rating: doc?.rating ?? null,
    });
    setLoading(false);
  };

  const prepInstructions = [
    "Esteja em jejum de 8 horas (se aplicável)",
    "Leve seus exames recentes",
    "Anote suas dúvidas e sintomas",
    "Tenha seus documentos em mãos",
  ];

  if (loading) {
    return (
      <DashboardLayout title="Paciente" nav={getPatientNav("appointments")} role="patient">
        <div className="max-w-2xl mx-auto space-y-4 pb-24">
          <Skeleton className="h-48 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!appt) {
    return (
      <DashboardLayout title="Paciente" nav={getPatientNav("appointments")} role="patient">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Consulta não encontrada.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/appointments?role=patient")}>
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const date = new Date(appt.scheduled_at);
  const initials = appt.doctor_name.replace("Dr(a). ", "").split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("appointments")} role="patient">
      <div className="max-w-2xl mx-auto pb-24 md:pb-6">
        {/* Top nav */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <button className="text-muted-foreground hover:text-foreground">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-primary p-6 text-center mb-6"
        >
          <Avatar className="w-20 h-20 mx-auto border-4 border-primary-foreground/20 mb-3">
            <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {appt.specialties.length > 0 && (
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/70 mb-1">
              {appt.specialties[0]} Especialista
            </p>
          )}
          <h2 className="font-[Manrope] text-[22px] font-bold text-primary-foreground">
            {appt.doctor_name}
          </h2>
          {appt.rating && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-primary-foreground/20">
              <Star className="w-3.5 h-3.5 text-warning fill-warning" />
              <span className="text-sm font-semibold text-primary-foreground">{appt.rating.toFixed(1)}</span>
            </div>
          )}
        </motion.div>

        {/* Date + Time Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-card rounded-2xl p-4 border border-border/30">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Data</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-base font-bold text-foreground">
                {format(date, "dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/30">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Horário</p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-base font-bold text-foreground">
                {format(date, "HH:mm")}
              </span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-card rounded-2xl p-4 border border-border/30 mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Localização</p>
            </div>
            <button className="text-[13px] font-semibold text-primary">Ver Rotas</button>
          </div>
          <p className="text-base font-bold text-foreground">Teleconsulta Online</p>
          <p className="text-sm text-muted-foreground">Acesse pela plataforma AloClínica</p>
        </div>

        {/* Map placeholder */}
        <div className="rounded-2xl overflow-hidden mb-4 h-40 bg-muted/30 flex items-center justify-center border border-border/30">
          <MapPin className="w-8 h-8 text-muted-foreground/30" />
        </div>

        {/* Instructions */}
        <div className="rounded-2xl p-4 mb-6" style={{ backgroundColor: "hsl(30, 100%, 97%)" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-[15px] font-bold text-foreground">Instruções de Preparo</span>
          </div>
          <ul className="space-y-2">
            {prepInstructions.map((inst, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                {inst}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        {appt.status === "scheduled" && (
          <div className="space-y-3">
            <Button
              className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-[Manrope] font-bold text-base"
              onClick={() => toast.info("Check-in disponível 15 min antes da consulta")}
            >
              Realizar Check-in Agora
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 rounded-full gap-2"
                onClick={() => toast.info("Em breve: reagendamento")}
              >
                <RotateCcw className="w-4 h-4" /> Reagendar
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-full gap-2 bg-destructive/5 border-destructive/20 text-destructive hover:bg-destructive/10"
                onClick={() => toast.info("Em breve: cancelamento")}
              >
                <X className="w-4 h-4" /> Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AppointmentDetail;
