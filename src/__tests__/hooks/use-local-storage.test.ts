import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "@/hooks/use-local-storage";

describe("useLocalStorage", () => {
  beforeEach(() => { localStorage.clear(); });

  it("returns initial value when key is absent", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("persists value to localStorage", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    act(() => { result.current[1]("updated"); });
    expect(result.current[0]).toBe("updated");
    expect(JSON.parse(localStorage.getItem("test-key")!)).toBe("updated");
  });

  it("reads existing value from localStorage", () => {
    localStorage.setItem("test-key", JSON.stringify("existing"));
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("existing");
  });

  it("removes value", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    act(() => { result.current[1]("val"); });
    act(() => { result.current[2](); });
    expect(result.current[0]).toBe("default");
    expect(localStorage.getItem("test-key")).toBeNull();
  });

  it("supports updater function", () => {
    const { result } = renderHook(() => useLocalStorage("counter", 0));
    act(() => { result.current[1]((prev) => prev + 1); });
    expect(result.current[0]).toBe(1);
  });
});
