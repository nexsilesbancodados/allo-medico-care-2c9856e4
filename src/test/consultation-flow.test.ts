import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Consultation flow state machine ─────────────────────────────────────────
describe("Consultation state transitions", () => {
  type Status = "scheduled" | "waiting" | "in_progress" | "completed" | "cancelled" | "no_show";

  const VALID_TRANSITIONS: Record<Status, Status[]> = {
    scheduled:   ["waiting", "cancelled"],
    waiting:     ["in_progress", "cancelled", "no_show"],
    in_progress: ["completed", "cancelled"],
    completed:   [],
    cancelled:   [],
    no_show:     [],
  };

  const canTransition = (from: Status, to: Status) =>
    VALID_TRANSITIONS[from]?.includes(to) ?? false;

  it("allows valid transitions", () => {
    expect(canTransition("scheduled", "waiting")).toBe(true);
    expect(canTransition("waiting", "in_progress")).toBe(true);
    expect(canTransition("in_progress", "completed")).toBe(true);
    expect(canTransition("scheduled", "cancelled")).toBe(true);
    expect(canTransition("waiting", "no_show")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(canTransition("completed", "in_progress")).toBe(false);
    expect(canTransition("completed", "scheduled")).toBe(false);
    expect(canTransition("cancelled", "waiting")).toBe(false);
    expect(canTransition("no_show", "completed")).toBe(false);
    expect(canTransition("in_progress", "waiting")).toBe(false);
  });

  it("completed and cancelled are terminal states", () => {
    const terminals: Status[] = ["completed", "cancelled", "no_show"];
    terminals.forEach(s => {
      expect(VALID_TRANSITIONS[s]).toHaveLength(0);
    });
  });
});

// ─── Doctor rating calculation ────────────────────────────────────────────────
describe("Doctor rating calculation", () => {
  const calcRating = (reviews: number[]) => {
    if (reviews.length === 0) return null;
    const avg = reviews.reduce((a, b) => a + b, 0) / reviews.length;
    return Math.round(avg * 10) / 10; // round to 1 decimal
  };

  it("calculates average correctly", () => {
    expect(calcRating([5, 4, 3, 5, 4])).toBe(4.2);
    expect(calcRating([5, 5, 5])).toBe(5);
    expect(calcRating([1])).toBe(1);
  });

  it("returns null for no reviews", () => {
    expect(calcRating([])).toBeNull();
  });

  it("handles edge cases", () => {
    expect(calcRating([5, 1])).toBe(3);
    expect(calcRating([4.5, 3.5])).toBe(4);
  });
});

// ─── Queue position logic ─────────────────────────────────────────────────────
describe("On-demand queue position", () => {
  interface QueueEntry { id: string; created_at: string; status: string }

  const getPosition = (entries: QueueEntry[], userId: string): number => {
    const waiting = entries
      .filter(e => e.status === "waiting")
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const idx = waiting.findIndex(e => e.id === userId);
    return idx === -1 ? -1 : idx + 1;
  };

  it("returns correct position", () => {
    const queue: QueueEntry[] = [
      { id: "a", created_at: "2024-01-01T10:00:00Z", status: "waiting" },
      { id: "b", created_at: "2024-01-01T10:05:00Z", status: "waiting" },
      { id: "c", created_at: "2024-01-01T10:10:00Z", status: "waiting" },
    ];
    expect(getPosition(queue, "a")).toBe(1);
    expect(getPosition(queue, "b")).toBe(2);
    expect(getPosition(queue, "c")).toBe(3);
  });

  it("excludes non-waiting entries from position", () => {
    const queue: QueueEntry[] = [
      { id: "x", created_at: "2024-01-01T09:00:00Z", status: "assigned" },
      { id: "a", created_at: "2024-01-01T10:00:00Z", status: "waiting" },
      { id: "b", created_at: "2024-01-01T10:05:00Z", status: "waiting" },
    ];
    expect(getPosition(queue, "a")).toBe(1); // x is not waiting, so a is first
    expect(getPosition(queue, "x")).toBe(-1); // not in waiting queue
  });

  it("returns -1 for unknown user", () => {
    const queue: QueueEntry[] = [
      { id: "a", created_at: "2024-01-01T10:00:00Z", status: "waiting" },
    ];
    expect(getPosition(queue, "unknown")).toBe(-1);
  });
});

// ─── Prescription medication formatting ──────────────────────────────────────
describe("Prescription formatting", () => {
  interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }

  const formatPrescription = (meds: Medication[]): string => {
    return meds
      .filter(m => m.name.trim())
      .map((m, i) => {
        let line = `${i + 1}. ${m.name} ${m.dosage}`;
        if (m.frequency) line += ` - ${m.frequency}`;
        if (m.duration) line += ` por ${m.duration}`;
        if (m.instructions) line += `\n   Obs: ${m.instructions}`;
        return line;
      })
      .join("\n");
  };

  it("formats single medication", () => {
    const result = formatPrescription([
      { name: "Amoxicilina", dosage: "500mg", frequency: "8/8h", duration: "7 dias" },
    ]);
    expect(result).toBe("1. Amoxicilina 500mg - 8/8h por 7 dias");
  });

  it("skips empty medications", () => {
    const result = formatPrescription([
      { name: "Paracetamol", dosage: "750mg", frequency: "6/6h", duration: "3 dias" },
      { name: "", dosage: "", frequency: "", duration: "" }, // empty — should be skipped
    ]);
    expect(result).not.toContain("2.");
  });

  it("includes instructions when present", () => {
    const result = formatPrescription([
      { name: "Metformina", dosage: "850mg", frequency: "2x/dia", duration: "contínuo", instructions: "Tomar com as refeições" },
    ]);
    expect(result).toContain("Tomar com as refeições");
  });
});
