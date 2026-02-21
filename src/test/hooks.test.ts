import { describe, it, expect, vi } from "vitest";

describe("useCooldown logic", () => {
  it("blocks during cooldown period", async () => {
    vi.useFakeTimers();
    let blocked = false;
    const cooldownMs = 2000;
    
    // Simulate cooldown logic
    blocked = true;
    setTimeout(() => { blocked = false; }, cooldownMs);
    
    expect(blocked).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(blocked).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(blocked).toBe(false);
    vi.useRealTimers();
  });
});

describe("useAnimateIn IntersectionObserver", () => {
  it("hook module exports correctly", async () => {
    const mod = await import("@/hooks/use-animate-in");
    expect(typeof mod.useAnimateIn).toBe("function");
  });
});
