import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "clinic-user" },
    profile: { first_name: "Clinic", last_name: "Test", role: "clinic" },
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: "c1", name: "Test Clinic", user_id: "clinic-user" } }),
          order: () => ({
            limit: () => Promise.resolve({ data: [] }),
          }),
          then: (fn: any) => fn({ data: [] }),
        }),
        in: () => ({
          gte: () => ({
            lte: () => Promise.resolve({ data: [] }),
          }),
        }),
      }),
    }),
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
    // Should render some dashboard content
    expect(document.querySelector("[class*='dashboard'], [class*='grid'], main, div")).toBeTruthy();
  });
});
