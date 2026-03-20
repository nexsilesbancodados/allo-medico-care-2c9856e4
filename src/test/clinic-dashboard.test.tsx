import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "clinic-user" },
    profile: { first_name: "Clinic", last_name: "Test" },
    roles: ["clinic"],
    loading: false,
    signOut: vi.fn(),
    refreshRoles: vi.fn(),
  }),
}));

const mockChain = (): any => {
  const chain: any = {};
  chain.select = () => chain;
  chain.eq = () => chain;
  chain.in = () => chain;
  chain.gte = () => chain;
  chain.lte = () => chain;
  chain.order = () => chain;
  chain.limit = () => Promise.resolve({ data: [] });
  chain.single = () => Promise.resolve({ data: { id: "c1", name: "Test Clinic", user_id: "clinic-user" } });
  chain.maybeSingle = () => Promise.resolve({ data: null });
  chain.then = (fn: any) => Promise.resolve({ data: [] }).then(fn);
  return chain;
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => mockChain(),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: vi.fn() }) }),
    }),
    removeChannel: vi.fn(),
  },
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe("ClinicDashboard", () => {
  it("renders clinic dashboard without crash", async () => {
    const ClinicDashboard = (await import("@/components/dashboards/ClinicDashboard")).default;
    render(
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <ClinicDashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );
    expect(document.querySelector("div")).toBeTruthy();
  }, 15000);
});
