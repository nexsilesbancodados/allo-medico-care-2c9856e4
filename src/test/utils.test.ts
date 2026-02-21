import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    const result = cn("px-4", "py-2", "px-8");
    expect(result).toContain("py-2");
    expect(result).toContain("px-8");
    expect(result).not.toContain("px-4");
  });

  it("handles undefined/null values", () => {
    const result = cn("base", undefined, null, false && "hidden", "end");
    expect(result).toBe("base end");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });
});

describe("useMask patterns", () => {
  it("formats CPF correctly", () => {
    const raw = "12345678901";
    const formatted = raw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    expect(formatted).toBe("123.456.789-01");
  });

  it("formats phone correctly", () => {
    const raw = "11999887766";
    const formatted = raw.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    expect(formatted).toBe("(11) 99988-7766");
  });
});
