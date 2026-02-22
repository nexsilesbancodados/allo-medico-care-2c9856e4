import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

interface TermsConsentCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

const TermsConsentCheckbox = ({ checked, onCheckedChange, className = "" }: TermsConsentCheckboxProps) => {
  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-lg border border-border bg-muted/30 ${className}`}>
      <Checkbox
        id="terms-consent"
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="mt-0.5"
        required
      />
      <label htmlFor="terms-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
        <Shield className="w-3 h-3 inline mr-1 text-primary" />
        Li e concordo com os{" "}
        <Link to="/terms" target="_blank" className="text-primary font-medium hover:underline">
          Termos de Uso
        </Link>
        , a{" "}
        <Link to="/privacy" target="_blank" className="text-primary font-medium hover:underline">
          Política de Privacidade
        </Link>
        {" "}e a{" "}
        <Link to="/lgpd" target="_blank" className="text-primary font-medium hover:underline">
          Política LGPD
        </Link>
        . Autorizo o tratamento dos meus dados pessoais conforme descrito nestes documentos.
      </label>
    </div>
  );
};

export default TermsConsentCheckbox;
