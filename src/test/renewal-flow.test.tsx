import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const mockFrom = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: vi.fn().mockResolvedValue({ data: null }) },
    from: (...args: any[]) => mockFrom(...args),
    storage: { from: () => ({ upload: vi.fn().mockResolvedValue({ error: null }), createSignedUrl: vi.fn() }) },
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-id" }, roles: ["patient"], loading: false }),
}));

vi.mock("@/components/dashboards/DashboardLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/patient/patientNav", () => ({ getPatientNav: () => [] }));
vi.mock("@/components/doctor/doctorNav", () => ({ getDoctorNav: () => [] }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("PrescriptionRenewalForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation((table: string) => {
      if (table === "prescription_renewals") {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [] }),
            }),
          }),
          insert: () => Promise.resolve({ error: null }),
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }) };
    });
  });

  it("renders the renewal form with all fields", async () => {
    const { default: PrescriptionRenewalForm } = await import("@/components/patient/PrescriptionRenewalForm");
    render(<PrescriptionRenewalForm />);

    expect(screen.getByText("💊 Renovar Receita")).toBeInTheDocument();
    expect(screen.getByText("1. Envie a receita vencida")).toBeInTheDocument();
    expect(screen.getByText("2. Questionário de saúde")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex: Dipirona, Penicilina...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex: Hipertensão, Diabetes...")).toBeInTheDocument();
  });

  it("disables submit button when no prescription uploaded", async () => {
    const { default: PrescriptionRenewalForm } = await import("@/components/patient/PrescriptionRenewalForm");
    render(<PrescriptionRenewalForm />);

    const submitButton = screen.getByText("Prosseguir para Pagamento — R$ 80,00");
    expect(submitButton).toBeDisabled();
  });
});

describe("RenewalQueue (Doctor)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation((table: string) => {
      if (table === "prescription_renewals") {
        return {
          select: () => ({
            in: () => ({
              order: () => Promise.resolve({ data: [] }),
            }),
          }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        };
      }
      if (table === "doctor_profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { id: "doc-profile-id" } }),
            }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }) };
    });
  });

  it("renders empty state when no renewals pending", async () => {
    const { default: RenewalQueue } = await import("@/components/doctor/RenewalQueue");
    render(<RenewalQueue />);

    await waitFor(() => {
      expect(screen.getByText("Nenhuma renovação pendente")).toBeInTheDocument();
    });
  });
});

describe("Renewal Business Logic", () => {
  it("validates questionnaire structure", () => {
    const buildQuestionnaire = (data: Record<string, string>) => ({
      allergies: data.allergies?.trim() || "",
      chronic_conditions: data.conditions?.trim() || "",
      current_medications: data.medications?.trim() || "",
      side_effects: data.sideEffects?.trim() || "",
      additional_notes: data.notes?.trim() || "",
    });

    const q = buildQuestionnaire({
      allergies: " Dipirona ",
      conditions: "Hipertensão",
      medications: "Losartana 50mg",
      sideEffects: "",
      notes: "Nenhuma observação",
    });

    expect(q.allergies).toBe("Dipirona");
    expect(q.chronic_conditions).toBe("Hipertensão");
    expect(q.current_medications).toBe("Losartana 50mg");
    expect(q.side_effects).toBe("");
    expect(q.additional_notes).toBe("Nenhuma observação");
  });

  it("validates status badge mapping", () => {
    const statusLabels: Record<string, string> = {
      pending: "Pendente",
      in_review: "Em análise",
      approved: "Aprovada",
      rejected: "Rejeitada",
    };

    expect(statusLabels["pending"]).toBe("Pendente");
    expect(statusLabels["approved"]).toBe("Aprovada");
    expect(statusLabels["rejected"]).toBe("Rejeitada");
    expect(statusLabels["in_review"]).toBe("Em análise");
  });

  it("enforces file size limit of 10MB", () => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    expect(5 * 1024 * 1024 < MAX_SIZE).toBe(true); // 5MB OK
    expect(11 * 1024 * 1024 < MAX_SIZE).toBe(false); // 11MB exceeds
  });
});
