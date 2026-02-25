import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: vi.fn().mockResolvedValue({ data: { totp: [] } }),
        enroll: vi.fn().mockResolvedValue({
          data: { id: "factor-1", totp: { qr_code: "data:image/png;base64,abc", secret: "ABCDEF123456" } },
        }),
        challenge: vi.fn().mockResolvedValue({ data: { id: "challenge-1" } }),
        verify: vi.fn().mockResolvedValue({ data: {} }),
        unenroll: vi.fn().mockResolvedValue({ data: {} }),
      },
    },
  },
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { MFASetup } from "@/components/auth/MFASetup";

describe("MFASetup", () => {
  it("renders setup button when not enrolled", () => {
    render(
      <MemoryRouter>
        <MFASetup />
      </MemoryRouter>
    );
    expect(screen.getByText("Configurar 2FA")).toBeInTheDocument();
  });

  it("renders the 2FA title", () => {
    render(
      <MemoryRouter>
        <MFASetup />
      </MemoryRouter>
    );
    expect(screen.getByText(/Autenticação em Duas Etapas/)).toBeInTheDocument();
  });
});

describe("MFAChallenge", () => {
  it("renders verification input", async () => {
    const { MFAChallenge } = await import("@/components/auth/MFAChallenge");
    render(
      <MemoryRouter>
        <MFAChallenge onSuccess={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText("000000")).toBeInTheDocument();
    expect(screen.getByText("Verificar")).toBeInTheDocument();
  });

  it("verify button is disabled without 6 digits", async () => {
    const { MFAChallenge } = await import("@/components/auth/MFAChallenge");
    render(
      <MemoryRouter>
        <MFAChallenge onSuccess={vi.fn()} />
      </MemoryRouter>
    );
    const btn = screen.getByText("Verificar");
    expect(btn).toBeDisabled();
  });
});
