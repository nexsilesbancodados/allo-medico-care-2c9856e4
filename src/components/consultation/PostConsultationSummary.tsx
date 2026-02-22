import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  CheckCircle2, Clock, FileText, Pill, Star, ArrowRight,
  MessageSquare, Download, Shield
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PostConsultationSummaryProps {
  appointmentId: string;
  isDoctor: boolean;
  elapsed: number;
  messageCount: number;
  onContinue: () => void;
}

const PostConsultationSummary = ({
  appointmentId,
  isDoctor,
  elapsed,
  messageCount,
  onContinue,
}: PostConsultationSummaryProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasNotes, setHasNotes] = useState(false);
  const [hasPrescription, setHasPrescription] = useState(false);
  const [otherPartyName, setOtherPartyName] = useState("");

  useEffect(() => {
    const load = async () => {
      const [notesRes, prescRes, apptRes] = await Promise.all([
        supabase.from("consultation_notes").select("id").eq("appointment_id", appointmentId).limit(1),
        supabase.from("prescriptions").select("id").eq("appointment_id", appointmentId).limit(1),
        supabase.from("appointments").select("patient_id, doctor_id").eq("id", appointmentId).single(),
      ]);
      setHasNotes((notesRes.data?.length ?? 0) > 0);
      setHasPrescription((prescRes.data?.length ?? 0) > 0);

      if (apptRes.data) {
        const otherId = isDoctor ? apptRes.data.patient_id : null;
        const otherDocId = !isDoctor ? apptRes.data.doctor_id : null;
        if (otherId) {
          const { data: p } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", otherId).single();
          if (p) setOtherPartyName(`${p.first_name} ${p.last_name}`);
        } else if (otherDocId) {
          const { data: doc } = await supabase.from("doctor_profiles").select("user_id").eq("id", otherDocId).single();
          if (doc) {
            const { data: p } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", doc.user_id).single();
            if (p) setOtherPartyName(`Dr(a). ${p.first_name} ${p.last_name}`);
          }
        }
      }
    };
    load();
  }, [appointmentId, isDoctor]);

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
  };

  return (
    <div className="min-h-screen bg-[hsl(220,30%,4%)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Success icon */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-[hsl(150,60%,40%,0.15)] flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-10 h-10 text-[hsl(150,60%,50%)]" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">Consulta Encerrada</h1>
          <p className="text-sm text-[hsl(220,15%,55%)]">
            {isDoctor ? `Atendimento com ${otherPartyName}` : `Consulta com ${otherPartyName}`}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-[hsl(220,20%,8%)] border-[hsl(220,15%,15%)]">
            <CardContent className="p-3 text-center">
              <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{formatDuration(elapsed)}</p>
              <p className="text-[10px] text-[hsl(220,15%,45%)]">Duração</p>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(220,20%,8%)] border-[hsl(220,15%,15%)]">
            <CardContent className="p-3 text-center">
              <MessageSquare className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{messageCount}</p>
              <p className="text-[10px] text-[hsl(220,15%,45%)]">Mensagens</p>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(220,20%,8%)] border-[hsl(220,15%,15%)]">
            <CardContent className="p-3 text-center">
              <Shield className="w-5 h-5 text-[hsl(150,60%,45%)] mx-auto mb-1" />
              <p className="text-lg font-bold text-[hsl(150,60%,55%)]">E2E</p>
              <p className="text-[10px] text-[hsl(220,15%,45%)]">Criptografada</p>
            </CardContent>
          </Card>
        </div>

        {/* Checklist */}
        <Card className="bg-[hsl(220,20%,8%)] border-[hsl(220,15%,15%)] mb-6">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold text-[hsl(220,15%,55%)] uppercase tracking-wider">Resumo</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${hasNotes ? "bg-[hsl(150,60%,40%,0.15)]" : "bg-[hsl(220,20%,15%)]"}`}>
                  <FileText className={`w-3.5 h-3.5 ${hasNotes ? "text-[hsl(150,60%,50%)]" : "text-[hsl(220,15%,35%)]"}`} />
                </div>
                <span className={`text-sm ${hasNotes ? "text-white" : "text-[hsl(220,15%,45%)]"}`}>
                  {hasNotes ? "Prontuário SOAP preenchido" : "Prontuário não preenchido"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${hasPrescription ? "bg-[hsl(150,60%,40%,0.15)]" : "bg-[hsl(220,20%,15%)]"}`}>
                  <Pill className={`w-3.5 h-3.5 ${hasPrescription ? "text-[hsl(150,60%,50%)]" : "text-[hsl(220,15%,35%)]"}`} />
                </div>
                <span className={`text-sm ${hasPrescription ? "text-white" : "text-[hsl(220,15%,45%)]"}`}>
                  {hasPrescription ? "Receita emitida" : "Nenhuma receita emitida"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          {isDoctor && !hasPrescription && (
            <Button
              onClick={() => navigate(`/dashboard/prescribe/${appointmentId}`)}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
            >
              <Pill className="w-5 h-5" />
              Emitir Receita
            </Button>
          )}

          <Button
            onClick={onContinue}
            variant={isDoctor && !hasPrescription ? "outline" : "default"}
            className={`w-full h-12 rounded-xl font-semibold gap-2 ${
              isDoctor && !hasPrescription
                ? "border-[hsl(220,15%,18%)] text-[hsl(220,15%,65%)] hover:bg-[hsl(220,20%,10%)]"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            {isDoctor ? "Voltar ao Dashboard" : "Avaliar Consulta"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-[10px] text-[hsl(220,15%,35%)] text-center mt-6">
          Consulta registrada em conformidade com a Resolução CFM 2.314/2022
        </p>
      </motion.div>
    </div>
  );
};

export default PostConsultationSummary;
