import { describe, it, expect } from "vitest";
import { validarCNPJ, formatarCNPJ } from "@/lib/cnpj";

describe("validarCNPJ", () => {
  it("accepts a valid CNPJ", () => {
    expect(validarCNPJ("11.222.333/0001-81")).toBe(true);
    expect(validarCNPJ("11222333000181")).toBe(true);
  });

  it("rejects all-same-digit CNPJs", () => {
    for (let d = 0; d <= 9; d++) {
      expect(validarCNPJ(String(d).repeat(14))).toBe(false);
    }
  });

  it("rejects wrong length", () => {
    expect(validarCNPJ("123")).toBe(false);
    expect(validarCNPJ("")).toBe(false);
  });

  it("rejects invalid check digits", () => {
    expect(validarCNPJ("11.222.333/0001-82")).toBe(false);
  });
});

describe("formatarCNPJ", () => {
  it("formats a full CNPJ", () => {
    expect(formatarCNPJ("11222333000181")).toBe("11.222.333/0001-81");
  });

  it("handles partial input", () => {
    expect(formatarCNPJ("11")).toBe("11");
    expect(formatarCNPJ("112")).toBe("11.2");
    expect(formatarCNPJ("11222333")).toBe("11.222.333");
    expect(formatarCNPJ("112223330001")).toBe("11.222.333/0001");
  });

  it("truncates beyond 14 digits", () => {
    expect(formatarCNPJ("1122233300018199999")).toBe("11.222.333/0001-81");
  });
});
