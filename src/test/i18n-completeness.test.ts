import { describe, it, expect } from "vitest";

describe("i18n locale files", () => {
  it("all locales have the same keys as pt-BR", async () => {
    const ptBR = (await import("@/i18n/locales/pt-BR")).default;
    const en = (await import("@/i18n/locales/en")).default;
    const es = (await import("@/i18n/locales/es")).default;

    const ptKeys = Object.keys(ptBR).sort();
    const enKeys = Object.keys(en).sort();
    const esKeys = Object.keys(es).sort();

    expect(enKeys).toEqual(ptKeys);
    expect(esKeys).toEqual(ptKeys);
  });

  it("no locale has empty string values", async () => {
    const ptBR = (await import("@/i18n/locales/pt-BR")).default;
    const en = (await import("@/i18n/locales/en")).default;
    const es = (await import("@/i18n/locales/es")).default;

    for (const [key, val] of Object.entries(ptBR)) {
      expect(val, `pt-BR.${key} is empty`).not.toBe("");
    }
    for (const [key, val] of Object.entries(en)) {
      expect(val, `en.${key} is empty`).not.toBe("");
    }
    for (const [key, val] of Object.entries(es)) {
      expect(val, `es.${key} is empty`).not.toBe("");
    }
  });

  it("pt-BR has at least 80 translation keys", async () => {
    const ptBR = (await import("@/i18n/locales/pt-BR")).default;
    expect(Object.keys(ptBR).length).toBeGreaterThanOrEqual(80);
  });
});
