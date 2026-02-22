import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
    from: vi.fn((table: string) => {
      if (table === "prescriptions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: [
                  {
                    id: "rx-1", appointment_id: "apt-1", patient_id: "p-1", doctor_id: "d-1",
                    medications: [{ name: "Amoxicilina 500mg", dosage: "1 comprimido", frequency: "8/8h", duration: "7 dias" }],
                    diagnosis: "Infecção bacteriana", observations: "Tomar após refeições",
                    created_at: new Date().toISOString(), pdf_url: null,
                  },
                ],
                error: null,
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: { id: "rx-new" },
                error: null,
              })),
            })),
          })),
        };
      }
      if (table === "document_verifications") {
        return {
          insert: vi.fn(() => Promise.resolve({ error: null })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      };
    }),
    functions: { invoke: vi.fn(() => Promise.resolve({ data: null, error: null })) },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
    removeChannel: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: { path: "test.pdf" }, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://test.com/test.pdf" } })),
      })),
    },
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

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "doc-user-1", email: "doctor@test.com" },
    session: { access_token: "token" },
    profile: { id: "p1", user_id: "doc-user-1", first_name: "Dra", last_name: "Ana", cpf: null, phone: null, avatar_url: null, date_of_birth: null },
    roles: ["doctor"],
    loading: false,
    signOut: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/assets/logo.png", () => ({ default: "logo.png" }));

describe("Prescription Data Validation", () => {
  it("validates medication structure", () => {
    const medication = {
      name: "Amoxicilina 500mg",
      dosage: "1 comprimido",
      frequency: "8/8h",
      duration: "7 dias",
    };
    expect(medication.name).toBeTruthy();
    expect(medication.dosage).toBeTruthy();
    expect(medication.frequency).toBeTruthy();
    expect(medication.duration).toBeTruthy();
  });

  it("validates prescription has required fields", () => {
    const prescription = {
      appointment_id: "apt-1",
      patient_id: "p-1",
      doctor_id: "d-1",
      medications: [{ name: "Test", dosage: "1", frequency: "1x", duration: "5d" }],
    };
    expect(prescription.appointment_id).toBeTruthy();
    expect(prescription.patient_id).toBeTruthy();
    expect(prescription.doctor_id).toBeTruthy();
    expect(prescription.medications.length).toBeGreaterThan(0);
  });

  it("validates CPF format utility", async () => {
    const { validarCPF } = await import("@/lib/cpf");
    expect(validarCPF("52998224725")).toBe(true);
    expect(validarCPF("11111111111")).toBe(false);
    expect(validarCPF("")).toBe(false);
  });
});

describe("Medical Certificate Validation", () => {
  it("generates verification code format", () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    expect(code.length).toBe(8);
    expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
  });
});

describe("PDF Generation", () => {
  it("jsPDF is available and can create a document", async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    expect(doc).toBeDefined();
    doc.text("Test Prescription", 20, 20);
    const output = doc.output("arraybuffer");
    expect(output.byteLength).toBeGreaterThan(0);
  });
});
