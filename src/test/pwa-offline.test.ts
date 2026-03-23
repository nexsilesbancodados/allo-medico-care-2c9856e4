import { describe, it, expect, vi, beforeEach } from "vitest";

describe("PWA Offline Logic", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("safeQuery handles errors gracefully", async () => {
    const { safeQuery } = await import("@/lib/supabase-helpers");
    const result = await safeQuery(
      Promise.resolve({ data: null, error: { message: "test", details: "", hint: "", code: "ERR", name: "TestError" } }),
      "test"
    );
    expect(result.error).toBeTruthy();
  });

  it("safeQuery returns data on success", async () => {
    const { safeQuery } = await import("@/lib/supabase-helpers");
    const result = await safeQuery(
      Promise.resolve({ data: "ok", error: null }),
      "test"
    );
    expect(result.data).toBe("ok");
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
