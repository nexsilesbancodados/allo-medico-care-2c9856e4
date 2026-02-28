import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock supabase — the onAuthStateChange callback must fire to set loading=false
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn((callback: any) => {
        // Fire callback with no session to simulate unauthenticated state
        setTimeout(() => callback("INITIAL_SESSION", null), 0);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
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
      const { initial, animate, exit, transition, viewport, whileInView, ...rest } = p;
      return <div {...rest}>{children}</div>;
    },
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/assets/logo.png", () => ({ default: "logo.png" }));

import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users to /auth", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div>Dashboard Content</div>
              </ProtectedRoute>
            } />
            <Route path="/auth" element={<div>Auth Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Auth Page")).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
