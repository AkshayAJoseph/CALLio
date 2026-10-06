import { describe, it, expect } from "vitest";
import { evaluateNetwork, PRESETS, MODE_PRESET_VALUES } from "./thresholds";
import { parseStatsReport, calcPacketLoss } from "./statsParser";

describe("evaluateNetwork", () => {
  it("returns FULL_AUDIO for healthy numbers", () => {
    expect(evaluateNetwork({ packetLoss: 0, jitter: 0, rtt: 0 })).toBe("FULL_AUDIO");
    expect(evaluateNetwork({ packetLoss: 9.9, jitter: 119, rtt: 249 })).toBe("FULL_AUDIO");
  });

  it("returns PTT exactly at each degraded boundary", () => {
    expect(evaluateNetwork({ packetLoss: 10, jitter: 0, rtt: 0 })).toBe("PTT");
    expect(evaluateNetwork({ packetLoss: 0, jitter: 120, rtt: 0 })).toBe("PTT");
    expect(evaluateNetwork({ packetLoss: 0, jitter: 0, rtt: 250 })).toBe("PTT");
  });

  it("returns TEXT exactly at each critical boundary", () => {
    expect(evaluateNetwork({ packetLoss: 25, jitter: 0, rtt: 0 })).toBe("TEXT");
    expect(evaluateNetwork({ packetLoss: 0, jitter: 300, rtt: 0 })).toBe("TEXT");
    expect(evaluateNetwork({ packetLoss: 0, jitter: 0, rtt: 500 })).toBe("TEXT");
  });

  it("checks critical before degraded", () => {
    expect(evaluateNetwork({ packetLoss: 30, jitter: 130, rtt: 260 })).toBe("TEXT");
  });

  it("maps each simulator preset to its expected mode", () => {
    expect(evaluateNetwork(PRESETS.NORMAL)).toBe("FULL_AUDIO");
    expect(evaluateNetwork(PRESETS.EDGE_ROAMING)).toBe("PTT");
    expect(evaluateNetwork(PRESETS.CRITICAL_DROP)).toBe("TEXT");
  });

  it("fake values for each mode evaluate back to that same mode", () => {
    for (const mode of ["FULL_AUDIO", "PTT", "TEXT"]) {
      expect(evaluateNetwork(MODE_PRESET_VALUES[mode])).toBe(mode);
    }
  });
});

describe("parseStatsReport", () => {
  it("reads jitter, counters and rtt from a Map style report", () => {
    const report = new Map([
      ["a", { type: "inbound-rtp", kind: "audio", jitter: 0.02, packetsLost: 5, packetsReceived: 95 }],
      ["b", { type: "candidate-pair", nominated: true, state: "succeeded", currentRoundTripTime: 0.08 }],
    ]);
    const out = parseStatsReport(report);
    expect(out.hasAudio).toBe(true);
    expect(out.jitter).toBeCloseTo(20);
    expect(out.lost).toBe(5);
    expect(out.received).toBe(95);
    expect(out.rtt).toBeCloseTo(80);
  });

  it("ignores video inbound reports", () => {
    const report = new Map([["v", { type: "inbound-rtp", kind: "video", jitter: 1 }]]);
    expect(parseStatsReport(report).hasAudio).toBe(false);
  });

  it("does not crash on empty, null or odd input", () => {
    expect(parseStatsReport(new Map()).hasAudio).toBe(false);
    expect(parseStatsReport(null).hasAudio).toBe(false);
    expect(parseStatsReport({}).hasAudio).toBe(false);
  });
});

describe("calcPacketLoss", () => {
  it("uses the delta between two polls", () => {
    expect(calcPacketLoss({ lost: 10, received: 100 }, { lost: 20, received: 190 })).toBeCloseTo(10);
  });

  it("returns 0 with no previous sample", () => {
    expect(calcPacketLoss(null, { lost: 5, received: 5 })).toBe(0);
  });

  it("returns 0 instead of dividing by zero", () => {
    expect(calcPacketLoss({ lost: 3, received: 7 }, { lost: 3, received: 7 })).toBe(0);
  });

  it("returns 0 when counters go backwards", () => {
    expect(calcPacketLoss({ lost: 10, received: 100 }, { lost: 1, received: 5 })).toBe(0);
  });
});
