import { sanitizeText, sanitizeName, sanitizeEmail, sanitizePhone } from "@/lib/sanitize";

/**
 * Hook para sanitização automática de inputs em formulários
 */
export function useSecureForm() {
  const sanitizeField = (type: "text" | "name" | "email" | "phone", value: string): string => {
    switch (type) {
      case "name": return sanitizeName(value);
      case "email": return sanitizeEmail(value);
      case "phone": return sanitizePhone(value);
      default: return sanitizeText(value);
    }
  };

  const hasInjectionAttempt = (value: string): boolean => {
    const patterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /--\s/,
    ];
    return patterns.some(p => p.test(value));
  };

  return { sanitizeField, hasInjectionAttempt };
}
