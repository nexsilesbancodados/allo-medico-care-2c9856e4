import { describe, it, expect, vi } from "vitest";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { ok: true }, error: null }),
    },
  },
}));

describe("CPF validation", () => {
  it("accepts valid CPFs", async () => {
    const { validarCPF } = await import("@/lib/cpf");
    expect(validarCPF("52998224725")).toBe(true);
    expect(validarCPF("00000000000")).toBe(false);
    expect(validarCPF("123")).toBe(false);
  });

  it("formats CPF correctly", async () => {
    const { formatarCPF } = await import("@/lib/cpf");
    expect(formatarCPF("52998224725")).toBe("529.982.247-25");
    expect(formatarCPF("123")).toBe("123");
  });
});

describe("CNPJ validation", () => {
  it("validates CNPJ correctly", async () => {
    const { validarCNPJ } = await import("@/lib/cnpj");
    expect(validarCNPJ("11222333000181")).toBe(true);
    expect(validarCNPJ("00000000000000")).toBe(false);
  });
});


describe("Consent utility", () => {
  it("exports registerConsent function", async () => {
    const { registerConsent } = await import("@/lib/consent");
    expect(typeof registerConsent).toBe("function");
  });
});
