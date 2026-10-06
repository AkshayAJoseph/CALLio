import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNetworkStats } from "./useNetworkStats";
import { PRESETS } from "./thresholds";

function makeReport({ jitter = 0.01, lost = 0, received = 0, rtt = 0.05 } = {}) {
  return new Map([
    ["a", { type: "inbound-rtp", kind: "audio", jitter, packetsLost: lost, packetsReceived: received }],
    ["b", { type: "candidate-pair", nominated: true, state: "succeeded", currentRoundTripTime: rtt }],
  ]);
}

describe("useNetworkStats", () => {
  it("returns fake numbers matching the mode when the ref is null", () => {
    const ref = { current: null };
    const { result, rerender } = renderHook(
      ({ mode }) => useNetworkStats({ peerConnectionRef: ref, networkMode: mode }),
      { initialProps: { mode: "FULL_AUDIO" } }
    );
    expect(result.current.source).toBe("fake");
    expect(result.current.telemetry).toEqual(PRESETS.NORMAL);

    rerender({ mode: "PTT" });
    expect(result.current.telemetry).toEqual(PRESETS.EDGE_ROAMING);

    rerender({ mode: "TEXT" });
    expect(result.current.telemetry).toEqual(PRESETS.CRITICAL_DROP);
  });

  it("does not crash when no ref is passed at all", () => {
    const { result } = renderHook(() => useNetworkStats());
    expect(result.current.source).toBe("fake");
  });

  it("reports connecting with zeros when there is no inbound audio yet", async () => {
    const pc = { getStats: vi.fn().mockResolvedValue(new Map()) };
    const { result } = renderHook(() => useNetworkStats({ peerConnectionRef: { current: pc } }));
    await vi.waitFor(() => {
      expect(result.current.source).toBe("connecting");
    });
    expect(result.current.telemetry).toEqual({ packetLoss: 0, jitter: 0, rtt: 0 });
  });

  it("parses live stats and computes loss from deltas between polls", async () => {
    const report = makeReport({ lost: 0, received: 100, jitter: 0.02, rtt: 0.08 });
    const pc = { getStats: vi.fn().mockResolvedValue(report) };

    const { result } = renderHook(() =>
      useNetworkStats({ peerConnectionRef: { current: pc } })
    );

    await vi.waitFor(() => {
      expect(result.current.source).toBe("live");
    });
    expect(result.current.telemetry.packetLoss).toBe(0);
    expect(result.current.telemetry.jitter).toBeCloseTo(20);
    expect(result.current.telemetry.rtt).toBeCloseTo(80);
  });

  it("survives getStats throwing", async () => {
    const pc = { getStats: vi.fn().mockRejectedValue(new Error("boom")) };
    const { result } = renderHook(() => useNetworkStats({ peerConnectionRef: { current: pc } }));
    await vi.waitFor(() => {
      expect(pc.getStats).toHaveBeenCalled();
    });
    expect(result.current.telemetry).toBeDefined();
  });

  it("stops polling after unmount", async () => {
    const pc = { getStats: vi.fn().mockResolvedValue(new Map()) };
    const { unmount } = renderHook(() => useNetworkStats({ peerConnectionRef: { current: pc } }));
    await vi.waitFor(() => {
      expect(pc.getStats).toHaveBeenCalled();
    });
    const calls = pc.getStats.mock.calls.length;
    act(() => {
      unmount();
    });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(pc.getStats.mock.calls.length).toBe(calls);
  });
});
