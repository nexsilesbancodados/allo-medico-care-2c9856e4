import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null })),
        })),
      })),
    })),
  },
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: () => ({ children, ...p }: any) => {
      const { initial, animate, exit, whileInView, whileHover, whileTap, transition, viewport, variants, ...rest } = p;
      return <div {...rest}>{children}</div>;
    },
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/assets/logo.png", () => ({ default: "logo.png" }));

import Auth from "@/pages/Auth";
import { supabase } from "@/integrations/supabase/client";

describe("Auth Flow", () => {
  beforeEach(() => {
    vi.mocked(supabase.auth.signInWithPassword).mockReset();
  });

  it("renders login form by default", () => {
    render(<BrowserRouter><Auth /></BrowserRouter>);
    expect(screen.getByText("Entrar")).toBeInTheDocument();
  });

  it("calls signIn on valid submission", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: "1" } as any, session: null as any },
      error: null,
    });
    render(<BrowserRouter><Auth /></BrowserRouter>);

    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });

    const submitBtn = screen.getByRole("button", { name: /entrar/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password123",
      });
    });
  });

  it("switches to register mode", () => {
    render(<BrowserRouter><Auth /></BrowserRouter>);
    const registerLink = screen.getByText("Cadastre-se grátis");
    fireEvent.click(registerLink);
    expect(screen.getByText("Criar conta")).toBeInTheDocument();
  });
});
