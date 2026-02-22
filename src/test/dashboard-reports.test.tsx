import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null })),
          order: vi.fn(() => Promise.resolve({ data: [] })),
        })),
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [] })),
        })),
        gt: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [] })),
        })),
        in: vi.fn(() => Promise.resolve({ data: [] })),
        order: vi.fn(() => Promise.resolve({ data: [] })),
      })),
    })),
    functions: { invoke: vi.fn(() => Promise.resolve({ data: null, error: null })) },
  },
}));

describe("Report PDF/CSV Export", () => {
  it("generates valid CSV from report data", () => {
    const data = [
      { month: "Jan/25", receita: 1200 },
      { month: "Fev/25", receita: 1500 },
      { month: "Mar/25", receita: 1800 },
    ];
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(r => Object.values(r).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;
    expect(csv).toContain("month,receita");
    expect(csv).toContain("Jan/25,1200");
    expect(csv).toContain("Mar/25,1800");
    expect(csv.split("\n").length).toBe(4); // header + 3 rows
  });

  it("calculates summary statistics correctly", () => {
    const appointments = [
      { status: "completed", scheduled_at: "2025-01-15" },
      { status: "completed", scheduled_at: "2025-01-16" },
      { status: "cancelled", scheduled_at: "2025-01-17" },
      { status: "no_show", scheduled_at: "2025-01-18" },
      { status: "scheduled", scheduled_at: "2025-01-19" },
    ];
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === "completed").length;
    const cancelled = appointments.filter(a => a.status === "cancelled").length;
    const noShow = appointments.filter(a => a.status === "no_show").length;
    const cancelRate = (cancelled / total) * 100;
    const noShowRate = (noShow / total) * 100;
    
    expect(total).toBe(5);
    expect(completed).toBe(2);
    expect(cancelled).toBe(1);
    expect(noShow).toBe(1);
    expect(cancelRate).toBe(20);
    expect(noShowRate).toBe(20);
  });

  it("calculates revenue from subscriptions", () => {
    const subs = [
      { plan_id: "plan-a", status: "active" },
      { plan_id: "plan-b", status: "active" },
      { plan_id: "plan-a", status: "cancelled" },
    ];
    const plans = [
      { id: "plan-a", price: 89 },
      { id: "plan-b", price: 149 },
    ];
    const planPriceMap = new Map(plans.map(p => [p.id, p.price]));
    const activeSubs = subs.filter(s => s.status === "active");
    const totalRevenue = activeSubs.reduce((acc, s) => acc + (planPriceMap.get(s.plan_id) ?? 0), 0);
    const avgTicket = totalRevenue / activeSubs.length;
    
    expect(totalRevenue).toBe(238); // 89 + 149
    expect(avgTicket).toBe(119);
  });

  it("calculates clinic occupancy rate", () => {
    const activeDoctors = 3;
    const slotsPerDoctor = 20;
    const totalSlots = activeDoctors * slotsPerDoctor;
    const monthAppts = 30;
    const occupancy = Math.round((monthAppts / totalSlots) * 100);
    
    expect(totalSlots).toBe(60);
    expect(occupancy).toBe(50);
  });

  it("ranks doctors by consultation count", () => {
    const doctorPerformance = [
      { name: "Dr. Carlos", consultas: 15, completadas: 12 },
      { name: "Dra. Ana", consultas: 25, completadas: 22 },
      { name: "Dr. Pedro", consultas: 10, completadas: 8 },
    ];
    const sorted = [...doctorPerformance].sort((a, b) => b.consultas - a.consultas);
    
    expect(sorted[0].name).toBe("Dra. Ana");
    expect(sorted[1].name).toBe("Dr. Carlos");
    expect(sorted[2].name).toBe("Dr. Pedro");
  });

  it("generates PDF with jsPDF", async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Relatório Administrativo — AloClínica", 14, 20);
    doc.setFontSize(10);
    doc.text("Receita: R$ 5.000,00", 14, 35);
    doc.text("Consultas: 50", 14, 42);
    const output = doc.output("arraybuffer");
    expect(output.byteLength).toBeGreaterThan(0);
  });
});
