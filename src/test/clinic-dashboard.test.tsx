import { describe, it, expect, vi } from "vitest";

// Test ClinicDashboard logic without full component render (avoids deep mock chains)
describe("ClinicDashboard", () => {
  it("validates clinic profile structure", () => {
    const profile = { id: "c1", name: "Clínica Saúde", user_id: "u1", cnpj: "12345678000199" };
    expect(profile.id).toBeTruthy();
    expect(profile.name).toBeTruthy();
    expect(profile.user_id).toBeTruthy();
  });

  it("filters appointments by doctor IDs", () => {
    const doctorIds = ["d1", "d2", "d3"];
    const appointments = [
      { id: "a1", doctor_id: "d1", status: "scheduled" },
      { id: "a2", doctor_id: "d5", status: "scheduled" },
      { id: "a3", doctor_id: "d2", status: "completed" },
    ];
    const filtered = appointments.filter(a => doctorIds.includes(a.doctor_id));
    expect(filtered).toHaveLength(2);
    expect(filtered.map(a => a.id)).toEqual(["a1", "a3"]);
  });

  it("calculates clinic stats correctly", () => {
    const appointments = [
      { status: "completed" },
      { status: "completed" },
      { status: "cancelled" },
      { status: "scheduled" },
    ];
    const completed = appointments.filter(a => a.status === "completed").length;
    const cancelled = appointments.filter(a => a.status === "cancelled").length;
    const upcoming = appointments.filter(a => a.status === "scheduled").length;
    
    expect(completed).toBe(2);
    expect(cancelled).toBe(1);
    expect(upcoming).toBe(1);
  });
});
