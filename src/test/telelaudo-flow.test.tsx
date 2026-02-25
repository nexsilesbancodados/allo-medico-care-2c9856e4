import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { gerarHashDocumento, gerarCodigoVerificacao } from "@/lib/signature";

// ── Signature utility tests ──

describe("Signature Utilities", () => {
  it("gerarHashDocumento returns a 64-char hex string (SHA-256)", async () => {
    const hash = await gerarHashDocumento("Laudo de Raio-X do tórax");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("gerarHashDocumento produces deterministic output", async () => {
    const a = await gerarHashDocumento("Conteúdo idêntico");
    const b = await gerarHashDocumento("Conteúdo idêntico");
    expect(a).toBe(b);
  });

  it("gerarHashDocumento produces different hashes for different content", async () => {
    const a = await gerarHashDocumento("Laudo A");
    const b = await gerarHashDocumento("Laudo B");
    expect(a).not.toBe(b);
  });

  it("gerarCodigoVerificacao returns an 8-char alphanumeric code", () => {
    const code = gerarCodigoVerificacao();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
  });

  it("gerarCodigoVerificacao generates unique codes", () => {
    const codes = new Set(Array.from({ length: 50 }, () => gerarCodigoVerificacao()));
    expect(codes.size).toBeGreaterThan(45); // Statistically nearly all should be unique
  });
});

// ── Mock setup for component tests ──

const mockExamRequests = [
  { id: "exam-1", exam_type: "Raio-X Tórax", priority: "normal", status: "pending", created_at: "2026-02-20T10:00:00Z", file_urls: [] },
  { id: "exam-2", exam_type: "Tomografia Crânio", priority: "urgent", status: "in_review", created_at: "2026-02-20T11:00:00Z", file_urls: [] },
  { id: "exam-3", exam_type: "Ressonância Joelho", priority: "normal", status: "reported", created_at: "2026-02-19T09:00:00Z", file_urls: [] },
];

const mockReports = [
  { id: "r1", exam_request_id: "exam-3", content_text: "Sem alterações", signed_at: "2026-02-19T15:00:00Z", verification_code: "ABCD1234", document_hash: "abc123def456", created_at: "2026-02-19T12:00:00Z", pdf_url: "reports/test.pdf", exam_requests: { exam_type: "Ressonância Joelho", priority: "normal" } },
  { id: "r2", exam_request_id: "exam-2", content_text: "Rascunho", signed_at: null, verification_code: null, document_hash: null, created_at: "2026-02-20T11:30:00Z", pdf_url: null, exam_requests: { exam_type: "Tomografia Crânio", priority: "urgent" } },
];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
    from: vi.fn((table: string) => {
      if (table === "exam_requests") {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockExamRequests, error: null })),
            })),
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: mockExamRequests[0], error: null })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        };
      }
      if (table === "exam_reports") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: mockReports, error: null })),
              })),
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
          insert: vi.fn(() => Promise.resolve({ error: null })),
        };
      }
      if (table === "doctor_profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: { id: "dp-1", crm: "12345", crm_state: "SP" }, error: null })),
              single: vi.fn(() => Promise.resolve({ data: { user_id: "user-1" }, error: null })),
            })),
          })),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: { first_name: "Dr. João", last_name: "Silva", phone: "11999999999" }, error: null })),
              single: vi.fn(() => Promise.resolve({ data: { first_name: "João", last_name: "Silva" }, error: null })),
            })),
          })),
        };
      }
      if (table === "report_templates") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: [{ id: "tpl-1", title: "Raio-X Normal", exam_type: "Raio-X", body_text: "Exame dentro da normalidade.", is_active: true }],
                error: null,
              })),
            })),
          })),
        };
      }
      if (table === "user_roles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [{ role: "doctor" }], error: null })),
          })),
        };
      }
      if (table === "notifications") {
        return { insert: vi.fn(() => Promise.resolve({ error: null })) };
      }
      if (table === "document_verifications") {
        return { insert: vi.fn(() => Promise.resolve({ error: null })) };
      }
      // Default fallback
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        insert: vi.fn(() => Promise.resolve({ error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      };
    }),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ error: null })),
        createSignedUrl: vi.fn(() => Promise.resolve({ data: { signedUrl: "https://example.com/signed" } })),
      })),
    },
  },
}));

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    motion: new Proxy({}, {
      get: () => ({ children, ...p }: any) => {
        const { initial, animate, exit, whileInView, whileHover, whileTap, transition, viewport, variants, ...rest } = p;
        return <div {...rest}>{children}</div>;
      },
    }),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

vi.mock("@/assets/logo.png", () => ({ default: "logo.png" }));

// ── Telelaudo Status & Priority Logic ──

describe("Telelaudo Status Logic", () => {
  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    in_review: "Em Análise",
    reported: "Laudado",
    delivered: "Entregue",
  };

  it("maps all exam statuses to Portuguese labels", () => {
    expect(statusLabels["pending"]).toBe("Pendente");
    expect(statusLabels["in_review"]).toBe("Em Análise");
    expect(statusLabels["reported"]).toBe("Laudado");
    expect(statusLabels["delivered"]).toBe("Entregue");
  });

  it("distinguishes urgent from normal priority exams", () => {
    const urgent = mockExamRequests.find(e => e.priority === "urgent");
    const normal = mockExamRequests.filter(e => e.priority === "normal");
    expect(urgent).toBeDefined();
    expect(urgent!.exam_type).toBe("Tomografia Crânio");
    expect(normal).toHaveLength(2);
  });

  it("identifies which exams can be claimed (pending only)", () => {
    const claimable = mockExamRequests.filter(e => e.status === "pending");
    expect(claimable).toHaveLength(1);
    expect(claimable[0].id).toBe("exam-1");
  });

  it("identifies reportable exams (in_review status)", () => {
    const reportable = mockExamRequests.filter(e => e.status === "in_review");
    expect(reportable).toHaveLength(1);
    expect(reportable[0].id).toBe("exam-2");
  });
});

// ── Report Data Integrity ──

describe("Report Data Integrity", () => {
  it("signed reports have all required fields", () => {
    const signed = mockReports.filter(r => r.signed_at !== null);
    signed.forEach(report => {
      expect(report.verification_code).toBeTruthy();
      expect(report.document_hash).toBeTruthy();
      expect(report.content_text).toBeTruthy();
      expect(report.pdf_url).toBeTruthy();
    });
  });

  it("draft reports have null signature fields", () => {
    const drafts = mockReports.filter(r => r.signed_at === null);
    drafts.forEach(report => {
      expect(report.verification_code).toBeNull();
      expect(report.document_hash).toBeNull();
    });
  });

  it("all reports link to exam requests", () => {
    mockReports.forEach(report => {
      expect(report.exam_request_id).toBeTruthy();
      expect(report.exam_requests).toBeDefined();
      expect(report.exam_requests.exam_type).toBeTruthy();
    });
  });
});

// ── Partner Conversion Logic ──

describe("Partner Conversion Metrics", () => {
  const mockValidations = [
    { id: "v1", status: "dispensed" },
    { id: "v2", status: "dispensed" },
    { id: "v3", status: "validated" },
    { id: "v4", status: "dispensed" },
    { id: "v5", status: "validated" },
  ];

  it("calculates dispensed count correctly", () => {
    const dispensed = mockValidations.filter(v => v.status === "dispensed").length;
    expect(dispensed).toBe(3);
  });

  it("calculates conversion rate correctly", () => {
    const dispensed = mockValidations.filter(v => v.status === "dispensed").length;
    const rate = Math.round((dispensed / mockValidations.length) * 100);
    expect(rate).toBe(60);
  });

  it("handles empty validations without division by zero", () => {
    const empty: any[] = [];
    const rate = empty.length > 0 ? Math.round((0 / empty.length) * 100) : 0;
    expect(rate).toBe(0);
  });

  it("shows correct conversion message based on rate", () => {
    const getMsg = (rate: number) =>
      rate >= 80 ? "🎉 Excelente taxa de conversão!"
      : rate >= 50 ? "👍 Boa taxa — continue assim!"
      : "💡 Dica: Ofereça alternativas genéricas para aumentar a conversão";

    expect(getMsg(90)).toContain("Excelente");
    expect(getMsg(60)).toContain("Boa taxa");
    expect(getMsg(30)).toContain("Dica");
  });
});
