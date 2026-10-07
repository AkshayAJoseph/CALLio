import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useNetworkStats } from "./useNetworkStats";

function makeReport({ jitter = 0.01, lost = 0, received = 0, rtt = 0.05 } = {}) {
  return new Map([
    ["a", { type: "inbound-rtp", kind: "audio", jitter, packetsLost: lost, packetsReceived: received }],
    ["b", { type: "candidate-pair", nominated: true, state: "succeeded", currentRoundTripTime: rtt }],
  ]);
}

describe("useNetworkStats hysteresis", () => {
  it("downgrades after 3 consecutive degraded polls", async () => {
    // Degraded report: jitter 160ms (>= 120ms -> PTT)
    const report = makeReport({ lost: 0, received: 100, jitter: 0.16, rtt: 0.05 });
    const pc = { getStats: vi.fn().mockResolvedValue(report) };

    const { result } = renderHook(() =>
      useNetworkStats({ peerConnectionRef: { current: pc }, networkMode: "FULL_AUDIO" })
    );

    // Initial poll: connecting / 1st sample
    await vi.waitFor(() => {
      expect(result.current.source).toBe("live");
    });
    // First sample establishes baseline, commits on 3rd bad poll
    await vi.waitFor(
      () => {
        expect(result.current.evaluatedLevel).toBe("PTT");
      },
      { timeout: 4000 }
    );
  });
});
