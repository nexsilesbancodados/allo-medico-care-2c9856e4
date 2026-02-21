import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    img: ({ children, ...props }: any) => <img {...props} />,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
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

import Header from "@/components/landing/Header";
import StatsSection from "@/components/landing/StatsSection";

describe("Header", () => {
  it("renders logo and nav links", () => {
    render(<BrowserRouter><Header /></BrowserRouter>);
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
