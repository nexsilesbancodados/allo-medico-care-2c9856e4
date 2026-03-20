import { describe, it, expect, vi, beforeEach } from "vitest";

describe("PWA Offline Logic", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("initNetworkListeners registers offline/online handlers", async () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const { initNetworkListeners } = await import("@/lib/supabase-helpers");
    initNetworkListeners();
    const events = addSpy.mock.calls.map(([e]) => e);
    expect(events).toContain("offline");
    expect(events).toContain("online");
  });

  it("withRetry retries on 429 status", async () => {
    const { withRetry } = await import("@/lib/supabase-helpers");
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts++;
      if (attempts < 3) return { data: null, error: { status: 429, message: "rate limit" } };
      return { data: "ok", error: null };
    }, 3, 10);
    expect(result.data).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("withRetry gives up after maxRetries", async () => {
    const { withRetry } = await import("@/lib/supabase-helpers");
    const result = await withRetry(
      async () => ({ data: null, error: { status: 500, message: "fail" } }),
      2, 10
    );
    expect(result.error).toBeTruthy();
  });

  it("withRetry does not retry on non-retryable errors", async () => {
    const { withRetry } = await import("@/lib/supabase-helpers");
    let attempts = 0;
    await withRetry(async () => {
      attempts++;
      return { data: null, error: { status: 400, message: "bad request" } };
    }, 3, 10);
    expect(attempts).toBe(1);
  });
});

describe("Service Worker Registration", () => {
  it("registers push-sw.js under /push/ scope when serviceWorker is available", async () => {
    const registerMock = vi.fn().mockResolvedValue({});
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: registerMock, getRegistration: vi.fn().mockResolvedValue(null) },
      writable: true,
      configurable: true,
    });

    const { ensurePushServiceWorkerRegistration } = await import("@/lib/push-service-worker");
    await ensurePushServiceWorkerRegistration();

    expect(registerMock).toHaveBeenCalledWith("/push-sw.js", { scope: "/push/" });
  });
});
