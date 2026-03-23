import { describe, it, expect } from "vitest";
import {
  stripHtml,
  sanitizeText,
  sanitizeName,
  sanitizePhone,
  sanitizeEmail,
  safeJsonParse,
  isValidUUID,
} from "@/lib/sanitize";

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<b>bold</b>")).toBe("bold");
    expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
  });
  it("returns plain text as-is", () => {
    expect(stripHtml("hello world")).toBe("hello world");
  });
});

describe("sanitizeText", () => {
  it("trims, strips HTML and limits length", () => {
    expect(sanitizeText("  <b>hi</b>  ")).toBe("hi");
    expect(sanitizeText("a".repeat(600), 500).length).toBe(500);
  });
});

describe("sanitizeName", () => {
  it("allows letters, spaces, hyphens and apostrophes", () => {
    expect(sanitizeName("João D'Arc")).toBe("João D'Arc");
  });
  it("removes numbers and special chars", () => {
    expect(sanitizeName("Admin123!@#")).toBe("Admin");
  });
});

describe("sanitizePhone", () => {
  it("keeps only digits and +", () => {
    expect(sanitizePhone("+55 (11) 99999-1234")).toBe("+5511999991234");
  });
  it("limits to 20 chars", () => {
    expect(sanitizePhone("1".repeat(25)).length).toBe(20);
  });
});

describe("sanitizeEmail", () => {
  it("lowercases and trims", () => {
    expect(sanitizeEmail("  Admin@Test.COM  ")).toBe("admin@test.com");
  });
});

describe("safeJsonParse", () => {
  it("parses valid JSON", () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
  });
  it("returns fallback for invalid JSON", () => {
    expect(safeJsonParse("not json", [])).toEqual([]);
  });
  it("blocks prototype pollution", () => {
    expect(safeJsonParse('{"__proto__":{"admin":true}}', {})).toEqual({});
  });
});

describe("isValidUUID", () => {
  it("accepts valid UUIDs", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });
  it("rejects invalid strings", () => {
    expect(isValidUUID("not-a-uuid")).toBe(false);
    expect(isValidUUID("")).toBe(false);
  });
});
