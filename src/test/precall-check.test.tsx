import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// Mock dependencies
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user" }, profile: { first_name: "Test" } }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null }),
          limit: () => Promise.resolve({ data: [] }),
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

// Mock getUserMedia
const mockGetUserMedia = vi.fn().mockResolvedValue({
  getTracks: () => [{ stop: vi.fn(), kind: "video" }, { stop: vi.fn(), kind: "audio" }],
  getVideoTracks: () => [{ stop: vi.fn() }],
  getAudioTracks: () => [{ stop: vi.fn() }],
});

Object.defineProperty(navigator, "mediaDevices", {
  value: { getUserMedia: mockGetUserMedia },
  writable: true,
});

describe("PreCallCheck", () => {
  const onReady = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the pre-call check component", async () => {
    const PreCallCheck = (await import("@/components/consultation/PreCallCheck")).default;
    await act(async () => {
      render(
        <BrowserRouter>
          <PreCallCheck
            appointmentId="apt-1"
            doctorName="Dr. Silva"
            doctorSpecialty="Cardiologia"
            onReady={onReady}
          />
        </BrowserRouter>
      );
    });
    // Should render heading or connection info
    expect(screen.getByText(/Pronto para entrar/i)).toBeTruthy();
  });

  it("shows camera and mic status indicators", async () => {
    const PreCallCheck = (await import("@/components/consultation/PreCallCheck")).default;
    render(
      <BrowserRouter>
        <PreCallCheck appointmentId="apt-1" onReady={onReady} />
      </BrowserRouter>
    );
    // Should request media access
    expect(mockGetUserMedia).toHaveBeenCalled();
  });
});
