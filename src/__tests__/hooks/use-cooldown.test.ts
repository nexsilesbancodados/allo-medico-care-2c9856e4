import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCooldown } from "@/hooks/use-cooldown";

describe("useCooldown", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("starts unlocked", () => {
    const { result } = renderHook(() => useCooldown(1000));
    expect(result.current[0]).toBe(false);
  });

  it("locks during execution and unlocks after cooldown", async () => {
    const { result } = renderHook(() => useCooldown(1000));

    await act(async () => {
      await result.current[1](() => Promise.resolve("done"));
    });

    expect(result.current[0]).toBe(true);

    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current[0]).toBe(false);
  });

  it("returns undefined when locked", async () => {
    const { result } = renderHook(() => useCooldown(1000));

    await act(async () => {
      await result.current[1](() => Promise.resolve("first"));
    });

    let secondResult: string | undefined;
    await act(async () => {
      secondResult = await result.current[1](() => Promise.resolve("second"));
    });

    expect(secondResult).toBeUndefined();
  });
});
