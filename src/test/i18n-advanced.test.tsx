import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { I18nProvider, useTranslation } from "@/i18n";
import ptBR from "@/i18n/locales/pt-BR";
import en from "@/i18n/locales/en";
import es from "@/i18n/locales/es";

// Helper component to test translations
const TranslationDisplay = ({ tKey }: { tKey: any }) => {
  const { t, locale, setLocale } = useTranslation();
  return (
    <div>
      <span data-testid="translation">{t(tKey)}</span>
      <span data-testid="locale">{locale}</span>
      <button onClick={() => setLocale("en")} data-testid="switch-en">EN</button>
      <button onClick={() => setLocale("es")} data-testid="switch-es">ES</button>
      <button onClick={() => setLocale("pt-BR")} data-testid="switch-pt">PT</button>
    </div>
  );
};

describe("i18n - Translation completeness", () => {
  const ptKeys = Object.keys(ptBR) as (keyof typeof ptBR)[];

  it("all pt-BR keys exist in English", () => {
    const enKeys = Object.keys(en);
    const missing = ptKeys.filter(k => !enKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it("all pt-BR keys exist in Spanish", () => {
    const esKeys = Object.keys(es);
    const missing = ptKeys.filter(k => !esKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it("no empty translations in en", () => {
    const empties = Object.entries(en).filter(([, v]) => !v || v.trim() === "");
    expect(empties).toEqual([]);
  });

  it("no empty translations in es", () => {
    const empties = Object.entries(es).filter(([, v]) => !v || v.trim() === "");
    expect(empties).toEqual([]);
  });
});

describe("i18n - Runtime switching", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("switches from pt-BR to English", () => {
    localStorage.setItem("locale", "pt-BR");
    render(
      <I18nProvider>
        <TranslationDisplay tKey="hero.cta" />
      </I18nProvider>
    );
    expect(screen.getByTestId("translation").textContent).toBe("Agendar Consulta");
    fireEvent.click(screen.getByTestId("switch-en"));
    expect(screen.getByTestId("translation").textContent).toBe("Book Consultation");
    expect(screen.getByTestId("locale").textContent).toBe("en");
  });

  it("switches from pt-BR to Spanish", () => {
    render(
      <I18nProvider>
        <TranslationDisplay tKey="hero.cta" />
      </I18nProvider>
    );
    fireEvent.click(screen.getByTestId("switch-es"));
    expect(screen.getByTestId("translation").textContent).toBe("Agendar Consulta");
    expect(screen.getByTestId("locale").textContent).toBe("es");
  });

  it("persists locale to localStorage", () => {
    render(
      <I18nProvider>
        <TranslationDisplay tKey="hero.cta" />
      </I18nProvider>
    );
    fireEvent.click(screen.getByTestId("switch-en"));
    expect(localStorage.getItem("locale")).toBe("en");
  });

  it("restores locale from localStorage", () => {
    localStorage.setItem("locale", "en");
    render(
      <I18nProvider>
        <TranslationDisplay tKey="hero.cta" />
      </I18nProvider>
    );
    expect(screen.getByTestId("translation").textContent).toBe("Book Consultation");
  });
});

describe("i18n - Browser language detection", () => {
  it("defaults to es for Spanish browser", () => {
    const langGetter = vi.spyOn(navigator, "language", "get").mockReturnValue("es-MX");
    localStorage.clear();
    render(
      <I18nProvider>
        <TranslationDisplay tKey="hero.cta" />
      </I18nProvider>
    );
    expect(screen.getByTestId("locale").textContent).toBe("es");
    langGetter.mockRestore();
  });
});
