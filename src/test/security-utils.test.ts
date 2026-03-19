import { describe, it, expect } from "vitest";
import { validarCPF } from "@/lib/cpf";
import { validarCNPJ } from "@/lib/cnpj";

const validateCPF = validarCPF;
const validateCNPJ = validarCNPJ;

describe("Security & Validation", () => {
  describe("CPF validation prevents injection", () => {
    it("rejects SQL injection attempts", () => {
      expect(validateCPF("'; DROP TABLE--")).toBe(false);
      expect(validateCPF("<script>alert(1)</script>")).toBe(false);
      expect(validateCPF("000.000.000-00")).toBe(false);
    });

    it("accepts valid CPFs", () => {
      expect(validateCPF("529.982.247-25")).toBe(true);
      expect(validateCPF("52998224725")).toBe(true);
    });

    it("rejects all same digits", () => {
      expect(validateCPF("111.111.111-11")).toBe(false);
      expect(validateCPF("222.222.222-22")).toBe(false);
    });
  });

  describe("CNPJ validation", () => {
    it("rejects invalid CNPJ", () => {
      expect(validateCNPJ("00.000.000/0000-00")).toBe(false);
      expect(validateCNPJ("invalid")).toBe(false);
    });

    it("accepts valid CNPJ", () => {
      expect(validateCNPJ("11.222.333/0001-81")).toBe(true);
    });
  });

  describe("XSS prevention in user inputs", () => {
    it("should not allow script tags as valid input", () => {
      const malicious = "<script>alert('xss')</script>";
      expect(validateCPF(malicious)).toBe(false);
      expect(validateCNPJ(malicious)).toBe(false);
    });
  });
});
