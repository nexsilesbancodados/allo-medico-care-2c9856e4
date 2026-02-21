import { useMemo } from "react";

interface PasswordStrengthProps {
  password: string;
}

const getStrength = (pw: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Fraca", color: "bg-destructive" };
  if (score <= 2) return { score, label: "Razoável", color: "bg-warning" };
  if (score <= 3) return { score, label: "Boa", color: "bg-primary" };
  return { score, label: "Forte", color: "bg-success" };
};

const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  const { score, label, color } = useMemo(() => getStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= score ? color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Força: <span className="font-medium text-foreground">{label}</span>
        {score < 4 && (
          <span className="ml-1">
            — Use 12+ caracteres, maiúsculas, números e símbolos
          </span>
        )}
      </p>
    </div>
  );
};

export default PasswordStrength;
