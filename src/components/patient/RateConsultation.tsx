import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

interface RateConsultationProps {
  appointmentId: string;
  doctorId: string;
  onClose: () => void;
}

const RateConsultation = ({ appointmentId, doctorId, onClose }: RateConsultationProps) => {
  const { user } = useAuth();
  const [nps, setNps] = useState<number | null>(null);
  const [ease, setEase] = useState(0);
  const [quality, setQuality] = useState(0);
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [already, setAlready] = useState(false);

  useEffect(() => {
    checkExisting();
  }, [appointmentId]);

  const checkExisting = async () => {
    const { data } = await supabase
      .from("satisfaction_surveys")
      .select("id")
      .eq("appointment_id", appointmentId)
      .eq("patient_id", user!.id)
      .limit(1);
    if (data && data.length > 0) setAlready(true);
  };

  const updateDoctorRating = async () => {
    // Recalculate average rating from all surveys for this doctor
    const { data: surveys } = await supabase
      .from("satisfaction_surveys")
      .select("quality_score, nps_score")
      .eq("doctor_id", doctorId);

    if (!surveys || surveys.length === 0) return;

    // Convert NPS (0-10) to 5-star scale, combine with quality
    const ratings = surveys.map(s => {
      const npsAs5 = (s.nps_score / 10) * 5;
      const qual = s.quality_score ?? npsAs5;
      return (npsAs5 + qual) / 2;
    });
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

    await supabase
      .from("doctor_profiles")
      .update({ rating: Math.round(avgRating * 10) / 10, total_reviews: surveys.length })
      .eq("id", doctorId);
  };

  const submit = async () => {
    if (nps === null) { toast.error("Selecione uma nota NPS (0-10)"); return; }
    setSubmitting(true);

    const { error } = await supabase.from("satisfaction_surveys").insert({
      appointment_id: appointmentId,
      patient_id: user!.id,
      doctor_id: doctorId,
      nps_score: nps,
      ease_score: ease || null,
      quality_score: quality || null,
      would_recommend: recommend,
      comment: comment.trim() || null,
    });

    if (error) {
      toast.error("Erro ao enviar avaliação");
    } else {
      // Update the doctor's aggregate rating
      await updateDoctorRating();
      toast.success("Obrigado pela sua avaliação! ⭐");
      onClose();
    }
    setSubmitting(false);
  };

  if (already) return null;

  const npsColors = (i: number) => {
    if (i <= 6) return nps === i ? "bg-destructive text-destructive-foreground" : "border-destructive/30 text-destructive hover:bg-destructive/10";
    if (i <= 8) return nps === i ? "bg-yellow-500 text-white" : "border-yellow-500/30 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20";
    return nps === i ? "bg-green-600 text-white" : "border-green-500/30 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20";
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Como foi sua consulta?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* NPS */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">De 0 a 10, o quanto você recomendaria a AloClinica?</p>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setNps(i)}
                  className={`w-9 h-9 rounded-lg border text-sm font-bold transition-all ${npsColors(i)} ${nps === i ? "scale-110 shadow-md" : ""}`}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Nada provável</span>
              <span>Muito provável</span>
            </div>
          </div>

          {/* Star ratings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Facilidade de uso</p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star
                    key={i}
                    className={`w-7 h-7 cursor-pointer transition-all ${i <= ease ? "text-yellow-500 fill-yellow-500 scale-110" : "text-muted-foreground/30 hover:text-yellow-400"}`}
                    onClick={() => setEase(i)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Qualidade do atendimento</p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star
                    key={i}
                    className={`w-7 h-7 cursor-pointer transition-all ${i <= quality ? "text-yellow-500 fill-yellow-500 scale-110" : "text-muted-foreground/30 hover:text-yellow-400"}`}
                    onClick={() => setQuality(i)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Recommend */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Recomendaria este médico?</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={recommend === true ? "default" : "outline"}
                onClick={() => setRecommend(true)}
                className={recommend === true ? "gap-2" : "gap-2"}
              >
                <ThumbsUp className="w-4 h-4" /> Sim
              </Button>
              <Button
                size="sm"
                variant={recommend === false ? "destructive" : "outline"}
                onClick={() => setRecommend(false)}
                className="gap-2"
              >
                <ThumbsDown className="w-4 h-4" /> Não
              </Button>
            </div>
          </div>

          {/* Comment */}
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Comentário (opcional)</p>
            <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Conte-nos mais sobre sua experiência..." rows={3} />
          </div>

          <Button onClick={submit} disabled={nps === null || submitting} className="w-full h-11">
            {submitting ? "Enviando..." : "⭐ Enviar Avaliação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RateConsultation;
