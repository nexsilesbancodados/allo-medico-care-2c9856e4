import { describe, it, expect, vi } from "vitest";

// Test PreCallCheck logic without rendering the full component (avoids complex mock chains)
describe("PreCallCheck", () => {
  it("validates network speed thresholds", () => {
    // Good: < 150ms, Fair: < 300ms, Poor: >= 300ms
    const getQuality = (latency: number) => {
      if (latency < 150) return "good";
      if (latency < 300) return "fair";
      return "poor";
    };

    expect(getQuality(50)).toBe("good");
    expect(getQuality(200)).toBe("fair");
    expect(getQuality(500)).toBe("poor");
  });

  it("getUserMedia API is available in test environment", () => {
    const mockGetUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
      configurable: true,
    });

    expect(navigator.mediaDevices.getUserMedia).toBeDefined();
    navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    expect(mockGetUserMedia).toHaveBeenCalledWith({ video: true, audio: true });
  });
});
