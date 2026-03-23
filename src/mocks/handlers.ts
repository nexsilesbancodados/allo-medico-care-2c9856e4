import { http, HttpResponse } from "msw";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://oaixgmuocuwhsabidpei.supabase.co";

export const mockAppointments = [
  { id: "appt-1", doctor_id: "doc-1", patient_id: "pat-1", status: "scheduled", scheduled_at: "2026-04-01T10:00:00Z" },
  { id: "appt-2", doctor_id: "doc-1", patient_id: "pat-2", status: "confirmed", scheduled_at: "2026-04-02T14:00:00Z" },
];

export const mockProfiles = [
  { user_id: "pat-1", first_name: "João", last_name: "Silva", phone: "11999990001" },
];

export const handlers = [
  // Appointments — GET
  http.get(`${SUPABASE_URL}/rest/v1/appointments`, () => {
    return HttpResponse.json(mockAppointments);
  }),

  // Appointments — POST
  http.post(`${SUPABASE_URL}/rest/v1/appointments`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newAppt = { id: "appt-new", ...body };
    return HttpResponse.json([newAppt], { status: 201 });
  }),

  // Appointments — DELETE
  http.delete(`${SUPABASE_URL}/rest/v1/appointments`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Profiles — GET
  http.get(`${SUPABASE_URL}/rest/v1/profiles`, () => {
    return HttpResponse.json(mockProfiles);
  }),
];

/** Handler that returns 500 for appointments (use in error tests) */
export const errorHandlers = [
  http.get(`${SUPABASE_URL}/rest/v1/appointments`, () => {
    return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }),
];
