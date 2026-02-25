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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Success icon */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-3 sm:mb-4"
          >
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-success" />
          </motion.div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">Consulta Encerrada</h1>
          <p className="text-sm text-muted-foreground">
            {isDoctor ? `Atendimento com ${otherPartyName}` : `Consulta com ${otherPartyName}`}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-2.5 sm:p-3 text-center">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary mx-auto mb-1" />
              <p className="text-base sm:text-lg font-bold text-foreground">{formatDuration(elapsed)}</p>
              <p className="text-[10px] text-muted-foreground">Duração</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-2.5 sm:p-3 text-center">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary mx-auto mb-1" />
              <p className="text-base sm:text-lg font-bold text-foreground">{messageCount}</p>
              <p className="text-[10px] text-muted-foreground">Mensagens</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-2.5 sm:p-3 text-center">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-success mx-auto mb-1" />
              <p className="text-base sm:text-lg font-bold text-success">E2E</p>
              <p className="text-[10px] text-muted-foreground">Criptografada</p>
            </CardContent>
          </Card>
        </div>

        {/* Checklist */}
        <Card className="bg-card border-border mb-5 sm:mb-6">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resumo</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 ${hasNotes ? "bg-success/15" : "bg-muted"}`}>
                  <FileText className={`w-3.5 h-3.5 ${hasNotes ? "text-success" : "text-muted-foreground"}`} />
                </div>
                <span className={`text-sm ${hasNotes ? "text-foreground" : "text-muted-foreground"}`}>
                  {hasNotes ? "Prontuário SOAP preenchido" : "Prontuário não preenchido"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 ${hasPrescription ? "bg-success/15" : "bg-muted"}`}>
                  <Pill className={`w-3.5 h-3.5 ${hasPrescription ? "text-success" : "text-muted-foreground"}`} />
                </div>
                <span className={`text-sm ${hasPrescription ? "text-foreground" : "text-muted-foreground"}`}>
                  {hasPrescription ? "Receita emitida" : "Nenhuma receita emitida"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next steps guidance */}
        <Card className="bg-primary/5 border-primary/20 mb-5 sm:mb-6">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Próximos Passos</p>
            {isDoctor ? (
              <ul className="text-sm text-muted-foreground space-y-1.5">
                {!hasPrescription && <li className="flex items-center gap-2"><Pill className="w-3.5 h-3.5 text-primary" /> Emitir receita se necessário</li>}
                {!hasNotes && <li className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-primary" /> Completar prontuário SOAP</li>}
                <li className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-primary" /> Paciente pode avaliar a consulta</li>
              </ul>
            ) : (
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-primary" /> Avalie sua experiência</li>
                <li className="flex items-center gap-2"><Download className="w-3.5 h-3.5 text-primary" /> Documentos disponíveis em "Meus Documentos"</li>
                {hasPrescription && <li className="flex items-center gap-2"><Pill className="w-3.5 h-3.5 text-primary" /> Receita disponível para download</li>}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          {isDoctor && !hasPrescription && (
            <Button
              onClick={() => navigate(`/dashboard/prescribe/${appointmentId}`)}
              className="w-full h-12 rounded-xl font-semibold gap-2"
            >
              <Pill className="w-5 h-5" />
              Emitir Receita
            </Button>
          )}

          <Button
            onClick={onContinue}
            variant={isDoctor && !hasPrescription ? "outline" : "default"}
            className="w-full h-12 rounded-xl font-semibold gap-2"
          >
            {isDoctor ? "Voltar ao Dashboard" : "Avaliar Consulta"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-6">
          Consulta registrada em conformidade com a Resolução CFM 2.314/2022
        </p>
      </motion.div>
    </div>
  );
};

export default PostConsultationSummary;
