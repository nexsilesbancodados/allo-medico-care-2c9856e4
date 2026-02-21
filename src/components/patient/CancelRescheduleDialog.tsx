import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface CancelRescheduleDialogProps {
  appointmentId: string;
  currentDate: string;
  doctorName: string;
  onSuccess: () => void;
}

const CANCEL_REASONS = [
  "Problema de saúde imprevisto",
  "Conflito de agenda",
  "Problema financeiro",
  "Médico não disponível",
  "Outro motivo",
];

const CancelRescheduleDialog = ({ appointmentId, currentDate, doctorName, onSuccess }: CancelRescheduleDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"cancel" | "reschedule">("cancel");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCancel = async () => {
    const finalReason = reason === "Outro motivo" ? customReason.trim() : reason;
    if (!finalReason) {
      toast.error("Informe o motivo do cancelamento");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("appointments").update({
      status: "cancelled",
      cancelled_by: user!.id,
      cancel_reason: finalReason,
    }).eq("id", appointmentId);

    if (error) {
      toast.error("Erro ao cancelar consulta");
    } else {
      toast.success("Consulta cancelada com sucesso");
      setOpen(false);
      onSuccess();
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive hover:bg-destructive/10 gap-1">
            <X className="w-3 h-3" /> Cancelar
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cancelar Consulta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium text-foreground">{doctorName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{currentDate}</p>
          </div>

          <div>
            <Label className="text-sm">Motivo do cancelamento *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === "Outro motivo" && (
            <div>
              <Label className="text-sm">Descreva o motivo</Label>
              <Textarea
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="Descreva o motivo do cancelamento..."
                rows={3}
                className="mt-1.5"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleCancel}
              disabled={submitting || !reason}
            >
              {submitting ? "Cancelando..." : "Confirmar Cancelamento"}
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Cancelamentos com menos de 2h de antecedência podem estar sujeitos a cobrança.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CancelRescheduleDialog;
