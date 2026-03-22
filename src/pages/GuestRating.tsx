import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Star, Heart, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import mascotThumbsUp from "@/assets/mascot-thumbsup.png";

const GuestRating = () => {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointment");
  const doctorName = searchParams.get("doctor") || "seu médico";
  const navigate = useNavigate();
  

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Selecione uma nota");
      return;
    }
    setSubmitting(true);
    try {
      if (appointmentId) {
        // Try to save survey (best-effort, guest may not have auth)
        await supabase.from("satisfaction_surveys").insert({
          appointment_id: appointmentId,
          doctor_id: "00000000-0000-0000-0000-000000000000",
          patient_id: "00000000-0000-0000-0000-000000000000",
          nps_score: rating * 2,
          quality_score: rating,
          comment: comment || null,
          would_recommend: rating >= 4,
        }).then(() => {});
      }
    } catch {
      // Best effort
    }
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(130,50%,97%)] via-[hsl(140,42%,93%)] to-[hsl(150,38%,88%)] dark:from-[hsl(130,25%,7%)] dark:via-[hsl(140,20%,9%)] dark:to-[hsl(150,18%,11%)]" />
        <SEOHead title="Obrigado! | AloClinica" description="Agradecemos sua avaliação." />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-md w-full text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto"
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground tabular-nums">Obrigado pela sua avaliação!</h1>
            <p className="text-muted-foreground">
              Sua opinião nos ajuda a melhorar cada vez mais o atendimento.
            </p>
          </div>

          <motion.img
            src={mascotThumbsUp}
            alt="Mascote agradecendo"
            className="w-32 h-32 mx-auto object-contain"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          />

          <div className="bg-muted/50 rounded-2xl p-4 space-y-2 border border-border">
            <p className="text-sm font-medium text-foreground">Quer acompanhar seu histórico?</p>
            <p className="text-xs text-muted-foreground">
              Crie uma conta gratuita para acessar receitas, histórico de consultas e muito mais.
            </p>
            <Button onClick={() => navigate("/paciente")} className="w-full mt-2 gap-2">
              Criar conta gratuita
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground">
            Voltar ao início
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(130,50%,97%)] via-[hsl(140,42%,93%)] to-[hsl(150,38%,88%)] dark:from-[hsl(130,25%,7%)] dark:via-[hsl(140,20%,9%)] dark:to-[hsl(150,18%,11%)]" />
      <SEOHead title="Avalie sua consulta | AloClinica" description="Conte como foi sua experiência." />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
          >
            <Heart className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground tabular-nums">Como foi sua consulta?</h1>
          <p className="text-muted-foreground text-sm">
            Avalie seu atendimento com <span className="font-medium text-foreground">{doctorName}</span>
          </p>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="p-1 transition-colors"
            >
              <Star
                className={`w-10 h-10 transition-all duration-200 ${
                  star <= (hovered || rating)
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]"
                    : "text-muted-foreground/30"
                }`}
              />
            </motion.button>
          ))}
        </div>

        {rating > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm font-medium text-foreground"
          >
            {rating === 1 && "Ruim 😞"}
            {rating === 2 && "Regular 😐"}
            {rating === 3 && "Bom 🙂"}
            {rating === 4 && "Muito bom! 😊"}
            {rating === 5 && "Excelente! 🤩"}
          </motion.p>
        )}

        {/* Comment */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Comentário <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Conte como foi sua experiência..."
            className="min-h-[100px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{comment.length}/500</p>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="w-full h-12 text-base font-semibold rounded-xl gap-2"
        >
          {submitting ? "Enviando..." : "Enviar avaliação"}
        </Button>

        <button
          onClick={() => { setSubmitted(true); }}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Pular avaliação
        </button>
      </motion.div>
    </div>
  );
};

export default GuestRating;
