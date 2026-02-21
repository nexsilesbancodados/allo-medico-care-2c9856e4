import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, { get: () => ({ children, ...p }: any) => { const { initial, animate, exit, whileInView, whileHover, whileTap, transition, viewport, variants, ...rest } = p; return <div {...rest}>{children}</div>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useMotionValue: () => ({ set: vi.fn() }),
  useTransform: () => ({ set: vi.fn() }),
  useSpring: (v: any) => v,
  useInView: () => true,
}));

vi.mock("@/assets/logo.png", () => ({ default: "logo.png" }));

import { I18nProvider, useTranslation } from "@/i18n";
import ptBR from "@/i18n/locales/pt-BR";
import en from "@/i18n/locales/en";
import es from "@/i18n/locales/es";

const I18nConsumer = () => {
  const { locale, setLocale, t } = useTranslation();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="hero-title">{t("hero.title1")}</span>
      <span data-testid="nav-plans">{t("nav.plans")}</span>
      <button data-testid="switch-en" onClick={() => setLocale("en")}>EN</button>
      <button data-testid="switch-es" onClick={() => setLocale("es")}>ES</button>
      <button data-testid="switch-pt" onClick={() => setLocale("pt-BR")}>PT</button>
    </div>
  );
};

describe("i18n System", () => {
  beforeEach(() => {
    localStorage.clear();
    // Force pt-BR default
    localStorage.setItem("locale", "pt-BR");
  });

  it("uses pt-BR when stored", () => {
    render(<I18nProvider><I18nConsumer /></I18nProvider>);
    expect(screen.getByTestId("hero-title")).toHaveTextContent("Sua saúde merece");
  });

  it("switches to English", () => {
    render(<I18nProvider><I18nConsumer /></I18nProvider>);
    fireEvent.click(screen.getByTestId("switch-en"));
    expect(screen.getByTestId("hero-title")).toHaveTextContent("Your health deserves");
    expect(screen.getByTestId("nav-plans")).toHaveTextContent("Plans");
  });

  it("switches to Spanish", () => {
    render(<I18nProvider><I18nConsumer /></I18nProvider>);
    fireEvent.click(screen.getByTestId("switch-es"));
    expect(screen.getByTestId("hero-title")).toHaveTextContent("Tu salud merece");
    expect(screen.getByTestId("nav-plans")).toHaveTextContent("Planes");
  });

  it("persists locale to localStorage", () => {
    render(<I18nProvider><I18nConsumer /></I18nProvider>);
    fireEvent.click(screen.getByTestId("switch-en"));
    expect(localStorage.getItem("locale")).toBe("en");
  });

  it("all translation keys exist in en and es", () => {
    const ptKeys = Object.keys(ptBR);
    const enKeys = Object.keys(en);
    const esKeys = Object.keys(es);
    for (const key of ptKeys) {
      expect(enKeys).toContain(key);
      expect(esKeys).toContain(key);
    }
  });

  it("no empty translation values", () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value.length, `en key "${key}" is empty`).toBeGreaterThan(0);
    }
    for (const [key, value] of Object.entries(es)) {
      expect(value.length, `es key "${key}" is empty`).toBeGreaterThan(0);
    }
  });
});
