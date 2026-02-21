import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: () => ({ children, ...p }: any) => {
      const { initial, animate, exit, whileInView, whileHover, whileTap, transition, viewport, variants, ...rest } = p;
      return <div {...rest}>{children}</div>;
    },
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useMotionValue: () => ({ set: vi.fn() }),
  useTransform: () => ({ set: vi.fn() }),
  useSpring: (v: any) => v,
  useInView: () => true,
}));

vi.mock("@/assets/hero-doctor.png", () => ({ default: "hero.png" }));
vi.mock("@/assets/mascot-wave.png", () => ({ default: "wave.png" }));
vi.mock("@/assets/mascot-thumbsup.png", () => ({ default: "thumbs.png" }));
vi.mock("@/assets/mascot-reading.png", () => ({ default: "reading.png" }));
vi.mock("@/assets/mascot-welcome.png", () => ({ default: "welcome.png" }));
vi.mock("@/assets/logo.png", () => ({ default: "logo.png" }));

import { I18nProvider } from "@/i18n";
import Header from "@/components/landing/Header";
import StatsSection from "@/components/landing/StatsSection";

describe("Header", () => {
  beforeEach(() => {
    localStorage.setItem("locale", "pt-BR");
  });

  it("renders logo and nav links with i18n", () => {
    render(
      <BrowserRouter>
        <I18nProvider>
          <Header />
        </I18nProvider>
      </BrowserRouter>
    );
    expect(screen.getByText("Sou Médico")).toBeInTheDocument();
    expect(screen.getByText("Sou Paciente")).toBeInTheDocument();
  });
});

describe("StatsSection", () => {
  it("renders stat labels", () => {
    render(<BrowserRouter><StatsSection /></BrowserRouter>);
    expect(screen.getByText("Pacientes atendidos")).toBeInTheDocument();
    expect(screen.getByText("Médicos especialistas")).toBeInTheDocument();
  });
});
