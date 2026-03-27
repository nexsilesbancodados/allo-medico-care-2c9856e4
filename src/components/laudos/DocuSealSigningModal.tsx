import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import { verificarAssinatura } from "@/lib/docuseal";

interface DocuSealSigningModalProps {
  open: boolean;
  signingUrl: string;
  submissionId: number;
  onSigned: (documents: Array<{ url: string; filename: string }>) => void;
  onCancel: () => void;
}

export default function DocuSealSigningModal({
  open,
  signingUrl,
  submissionId,
  onSigned,
  onCancel,
}: DocuSealSigningModalProps) {
  const [checking, setChecking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open || !submissionId) return;

    const poll = async () => {
      try {
        setChecking(true);
        const result = await verificarAssinatura(submissionId);
        if (result.completed) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onSigned(result.documents);
        }
      } catch {
        // silently retry
      } finally {
        setChecking(false);
      }
    };

    intervalRef.current = setInterval(poll, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, submissionId, onSigned]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Assinatura Digital
            {checking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </DialogTitle>
          <DialogDescription>
            Assine o documento no formulário abaixo. A janela fechará automaticamente após a assinatura.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border">
          <iframe
            src={signingUrl}
            className="w-full h-full border-0"
            title="DocuSeal Signing"
            allow="camera"
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <a
            href={signingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" /> Abrir em nova aba
          </a>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
