import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface RateDoctorProps {
  doctorId: string;
  appointmentId: string;
  doctorName: string;
}

const RateDoctor = ({ doctorId, appointmentId, doctorName }: RateDoctorProps) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Selecione uma nota");
      return;
    }
    setSubmitting(true);

    // Update doctor's average rating
    const { data: doc } = await supabase
      .from("doctor_profiles")
      .select("rating, total_reviews")
      .eq("id", doctorId)
      .single();

    if (doc) {
      const currentRating = Number(doc.rating) || 0;
      const totalReviews = (doc.total_reviews || 0);
      const newTotal = totalReviews + 1;
      const newRating = ((currentRating * totalReviews) + rating) / newTotal;

      await supabase.from("doctor_profiles").update({
        rating: Math.round(newRating * 10) / 10,
        total_reviews: newTotal,
      }).eq("id", doctorId);
    }

    // Update appointment notes with rating
    await supabase.from("appointments").update({
      notes: `Avaliação: ${rating}/5${comment ? ` - ${comment}` : ""}`,
    }).eq("id", appointmentId);

    setSubmitting(false);
    setOpen(false);
    toast.success("Avaliação enviada!", { description: `Obrigado por avaliar ${doctorName}` });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs">
          <Star className="w-3 h-3 mr-1" /> Avaliar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Avaliar {doctorName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2 pb-24 md:pb-6">
          <div>
            <Label>Nota</Label>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${star <= (hover || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Comentário (opcional)</Label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={3}
              placeholder="Como foi sua experiência?"
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-gradient-hero text-primary-foreground">
            {submitting ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RateDoctor;
