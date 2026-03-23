import { describe, it, expect } from "vitest";
import { validarCPF, formatarCPF } from "@/lib/cpf";

describe("validarCPF", () => {
  it("accepts a valid CPF", () => {
    expect(validarCPF("529.982.247-25")).toBe(true);
    expect(validarCPF("52998224725")).toBe(true);
  });

  it("rejects all-same-digit CPFs", () => {
    for (let d = 0; d <= 9; d++) {
      expect(validarCPF(String(d).repeat(11))).toBe(false);
    }
  });

  it("rejects wrong length", () => {
    expect(validarCPF("123")).toBe(false);
    expect(validarCPF("")).toBe(false);
    expect(validarCPF("1234567890123")).toBe(false);
  });

  it("rejects invalid check digits", () => {
    expect(validarCPF("529.982.247-26")).toBe(false);
  });
});

describe("formatarCPF", () => {
  it("formats a full CPF", () => {
    expect(formatarCPF("52998224725")).toBe("529.982.247-25");
  });

  it("handles partial input", () => {
    expect(formatarCPF("529")).toBe("529");
    expect(formatarCPF("5299")).toBe("529.9");
    expect(formatarCPF("5299822")).toBe("529.982.2");
    expect(formatarCPF("5299822472")).toBe("529.982.247-2");
  });

  it("strips non-digit characters", () => {
    expect(formatarCPF("abc529def982ghi24725")).toBe("529.982.247-25");
  });

  it("truncates beyond 11 digits", () => {
    expect(formatarCPF("529982247259999")).toBe("529.982.247-25");
  });
});
