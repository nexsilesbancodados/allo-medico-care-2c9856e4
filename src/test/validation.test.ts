import { describe, it, expect } from 'vitest';

// ─── CPF/CNPJ validation ─────────────────────────────────────────────────────
describe('CPF validation', () => {
  const validarCPF = (cpf: string): boolean => {
    const c = cpf.replace(/\D/g, "");
    if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
    const calc = (mod: number) => {
      const sum = c.slice(0, mod).split("").reduce(
        (acc, d, i) => acc + parseInt(d) * (mod + 1 - i), 0
      );
      const rest = (sum * 10) % 11;
      return rest >= 10 ? 0 : rest;
    };
    return calc(9) === parseInt(c[9]) && calc(10) === parseInt(c[10]);
  };

  it("validates real CPF numbers", () => {
    expect(validarCPF("529.982.247-25")).toBe(true);
    expect(validarCPF("52998224725")).toBe(true);
  });

  it("rejects invalid CPF", () => {
    expect(validarCPF("111.111.111-11")).toBe(false); // repeated digits
    expect(validarCPF("000.000.000-00")).toBe(false);
    expect(validarCPF("123.456.789-00")).toBe(false); // wrong digits
    expect(validarCPF("1234")).toBe(false);           // too short
  });
});

describe('CNPJ validation', () => {
  const validarCNPJ = (cnpj: string): boolean => {
    const c = cnpj.replace(/\D/g, "");
    if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
    const calc = (len: number) => {
      const weights = len === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const sum = c.slice(0, len).split("").reduce(
        (acc, d, i) => acc + parseInt(d) * weights[i], 0
      );
      const rest = sum % 11;
      return rest < 2 ? 0 : 11 - rest;
    };
    return calc(12) === parseInt(c[12]) && calc(13) === parseInt(c[13]);
  };

  it("validates real CNPJ", () => {
    expect(validarCNPJ("11.222.333/0001-81")).toBe(true);
    expect(validarCNPJ("11222333000181")).toBe(true);
  });

  it("rejects invalid CNPJ", () => {
    expect(validarCNPJ("11.111.111/1111-11")).toBe(false);
    expect(validarCNPJ("00.000.000/0000-00")).toBe(false);
    expect(validarCNPJ("1234")).toBe(false);
  });
});

// ─── authErrors translation ───────────────────────────────────────────────────
describe('Auth error translation', () => {
  const AUTH_ERRORS: Record<string, string> = {
    "Invalid login credentials": "Email ou senha incorretos.",
    "Email not confirmed": "Confirme seu email antes de entrar.",
    "User already registered": "Este email já possui uma conta.",
    "Email rate limit exceeded": "Muitas tentativas de email. Aguarde alguns minutos.",
  };

  const translateAuthError = (message: string): string => {
    if (!message) return "Ocorreu um erro. Tente novamente.";
    if (AUTH_ERRORS[message]) return AUTH_ERRORS[message];
    for (const [key, value] of Object.entries(AUTH_ERRORS)) {
      if (message.toLowerCase().includes(key.toLowerCase())) return value;
    }
    return message;
  };

  it("translates known errors", () => {
    expect(translateAuthError("Invalid login credentials")).toBe("Email ou senha incorretos.");
    expect(translateAuthError("Email not confirmed")).toContain("Confirme seu email");
  });

  it("handles partial matches", () => {
    expect(translateAuthError("Error: Invalid login credentials for user")).toBe("Email ou senha incorretos.");
  });

  it("returns original for unknown errors", () => {
    expect(translateAuthError("Unknown server error")).toBe("Unknown server error");
  });

  it("handles empty/null input", () => {
    expect(translateAuthError("")).toBe("Ocorreu um erro. Tente novamente.");
  });
});

// ─── Notification dedup logic ─────────────────────────────────────────────────
describe('Notification deduplication', () => {
  const isDuplicate = (existing: { created_at: string }[], windowMs: number) => {
    if (existing.length === 0) return false;
    const latest = new Date(existing[0].created_at).getTime();
    return Date.now() - latest < windowMs;
  };

  it("detects duplicate within window", () => {
    const recent = [{ created_at: new Date(Date.now() - 5 * 60000).toISOString() }];
    expect(isDuplicate(recent, 10 * 60000)).toBe(true); // 5min < 10min window
  });

  it("allows notification after window", () => {
    const old = [{ created_at: new Date(Date.now() - 20 * 60000).toISOString() }];
    expect(isDuplicate(old, 10 * 60000)).toBe(false); // 20min > 10min window
  });

  it("allows notification with no history", () => {
    expect(isDuplicate([], 10 * 60000)).toBe(false);
  });
});
