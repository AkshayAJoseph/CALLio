import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNetworkStats } from "./useNetworkStats";
import { PRESETS } from "./thresholds";

function setup(networkMode = "FULL_AUDIO") {
  return renderHook(() =>
    useNetworkStats({ peerConnectionRef: { current: null }, networkMode })
  );
}

describe("useNetworkStats override", () => {
  it("starts with no override and nothing to evaluate", () => {
    const { result } = setup();
    expect(result.current.isOverridden).toBe(false);
    expect(result.current.source).toBe("fake");
    expect(result.current.evaluatedLevel).toBeNull();
  });

  it("Edge Roaming gives simulated numbers and level PTT", () => {
    const { result } = setup();
    act(() => result.current.setOverride(PRESETS.EDGE_ROAMING));
    expect(result.current.isOverridden).toBe(true);
    expect(result.current.source).toBe("simulated");
    expect(result.current.telemetry.jitter).toBe(160);
    expect(result.current.evaluatedLevel).toBe("PTT");
  });

  it("Critical Drop evaluates to TEXT and Normal to FULL_AUDIO", () => {
    const { result } = setup();
    act(() => result.current.setOverride(PRESETS.CRITICAL_DROP));
    expect(result.current.evaluatedLevel).toBe("TEXT");
    act(() => result.current.setOverride(PRESETS.NORMAL));
    expect(result.current.evaluatedLevel).toBe("FULL_AUDIO");
  });

  it("setOverride(null) returns to live (fake) numbers", () => {
    const { result } = setup();
    act(() => result.current.setOverride(PRESETS.CRITICAL_DROP));
    act(() => result.current.setOverride(null));
    expect(result.current.isOverridden).toBe(false);
    expect(result.current.source).toBe("fake");
    expect(result.current.evaluatedLevel).toBeNull();
  });
});
