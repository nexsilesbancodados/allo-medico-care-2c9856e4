import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatMask, unmask } from "@/hooks/use-mask";
import { validarCPF } from "@/lib/cpf";
import { CheckCircle, XCircle } from "lucide-react";

interface CpfInputProps {
  value: string;
  onChange: (raw: string) => void;
  optional?: boolean;
  className?: string;
  inputClassName?: string;
}

export default function CpfInput({ value, onChange, optional = false, className = "", inputClassName = "" }: CpfInputProps) {
  const [touched, setTouched] = useState(false);
  const raw = unmask(value);
  const masked = formatMask(value, "cpf");
  const complete = raw.length === 11;
  const valid = validarCPF(raw);
  const showError = touched && complete && !valid;
  const showSuccess = touched && complete && valid;
  const empty = raw.length === 0;

  return (
    <div className={className}>
      <div className="relative">
        <Input
          value={masked}
          onChange={e => onChange(e.target.value.replace(/\D/g, ""))}
          onBlur={() => setTouched(true)}
          placeholder="000.000.000-00"
          maxLength={14}
          className={`font-mono pr-10 ${
            showError
              ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
              : showSuccess
                ? "border-green-500/60 focus-visible:border-green-500/60"
                : ""
          } ${inputClassName}`}
        />
        {complete && touched && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {valid ? (
              <CheckCircle className="w-4.5 h-4.5 text-green-500" />
            ) : (
              <XCircle className="w-4.5 h-4.5 text-destructive" />
            )}
          </span>
        )}
      </div>
      {showError && (
        <p className="text-[11px] text-destructive mt-1 pl-0.5 font-medium">
          CPF inválido — verifique os dígitos.
        </p>
      )}
      {!optional && touched && empty && (
        <p className="text-[11px] text-destructive mt-1 pl-0.5 font-medium">
          CPF obrigatório.
        </p>
      )}
    </div>
  );
}
