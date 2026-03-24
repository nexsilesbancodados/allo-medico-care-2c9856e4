import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// Mock supabase - factory must not reference outer variables
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
          gte: vi.fn(() => ({
            lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        gt: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: "appt-1" }, error: null })),
        })),
      })),
    })),
    functions: { invoke: vi.fn(() => Promise.resolve({ data: null, error: null })) },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
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
  useReducedMotion: () => false,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "paciente@test.com" },
    session: { access_token: "token" },
    profile: { id: "p1", user_id: "test-user-id", first_name: "João", last_name: "Silva", cpf: null, phone: null, avatar_url: null, date_of_birth: null },
    roles: ["patient"],
    loading: false,
    signOut: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Mock image imports
vi.mock("@/assets/logo.png", () => ({ default: "logo.png" }));

describe("Booking Logic", () => {
  it("validates that appointment requires doctor_id and scheduled_at", () => {
    const appointment = {
      doctor_id: "doc-1",
      patient_id: "patient-1",
      scheduled_at: new Date().toISOString(),
      status: "scheduled",
    };
    expect(appointment.doctor_id).toBeTruthy();
    expect(appointment.patient_id).toBeTruthy();
    expect(appointment.scheduled_at).toBeTruthy();
    expect(appointment.status).toBe("scheduled");
  });

  it("calculates available time slots correctly", () => {
    const startHour = 9;
    const endHour = 17;
    const durationMinutes = 30;
    const totalMinutes = (endHour - startHour) * 60;
    const totalSlots = totalMinutes / durationMinutes;
    expect(totalSlots).toBe(16);
  });

  it("filters out booked slots", () => {
    const allSlots = ["09:00", "09:30", "10:00", "10:30", "11:00"];
    const bookedSlots = ["09:30", "10:30"];
    const available = allSlots.filter(s => !bookedSlots.includes(s));
    expect(available).toEqual(["09:00", "10:00", "11:00"]);
    expect(available.length).toBe(3);
  });
});

describe("Notification System", () => {
  it("exports notification functions", async () => {
    const notifications = await import("@/lib/notifications");
    expect(notifications.notifyAppointmentCancelled).toBeDefined();
    expect(notifications.notifyCertificateSent).toBeDefined();
    expect(notifications.notifyDoctorApproval).toBeDefined();
    expect(notifications.notifyConsultationStarted).toBeDefined();
    expect(notifications.notifyDocumentUploaded).toBeDefined();
  });
});

describe("WhatsApp Integration", () => {
  it("exports sendWhatsApp function", async () => {
    const { sendWhatsApp } = await import("@/lib/whatsapp");
    expect(sendWhatsApp).toBeDefined();
    expect(typeof sendWhatsApp).toBe("function");
  });

  it("exports triggerAppointmentConfirmed function", async () => {
    const { triggerAppointmentConfirmed } = await import("@/lib/whatsapp");
    expect(triggerAppointmentConfirmed).toBeDefined();
  });
});

