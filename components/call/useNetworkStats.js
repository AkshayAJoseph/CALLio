"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MODE_PRESET_VALUES, ZERO_TELEMETRY, evaluateNetwork } from "./thresholds";
import { parseStatsReport, calcPacketLoss } from "./statsParser";

// Polls getStats() once a second and returns plain numbers.
//
// Returns { telemetry, source, setOverride, isOverridden, evaluatedLevel }
//   telemetry: { packetLoss, jitter, rtt }
//   source: "simulated" (an override is active, real stats are ignored)
//           "fake" (no peer connection, numbers match the current mode)
//           "connecting" (connection exists but no inbound audio yet, zeros)
//           "live" (real numbers)
//   setOverride(presetObject | null): injects numbers, or clears the override with null
//   isOverridden: true while a simulation is active
//   evaluatedLevel: FULL_AUDIO, PTT or TEXT from evaluateNetwork, or null when there
//     are no real or simulated numbers to judge (fake or connecting).
//
// This hook only reports. ActiveCallView decides when to call setFallbackMode.
export function useNetworkStats({ peerConnectionRef, networkMode = "FULL_AUDIO" } = {}) {
  const [live, setLive] = useState(null);
  const [override, setOverrideState] = useState(null);
  const prevSampleRef = useRef(null);
  const lastRttRef = useRef(0);

  const setOverride = useCallback((preset) => {
    if (!preset) {
      setOverrideState(null);
      return;
    }
    const values = preset.telemetry ?? preset;
    setOverrideState({
      packetLoss: Number(values.packetLoss) || 0,
      jitter: Number(values.jitter) || 0,
      rtt: Number(values.rtt) || 0,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    prevSampleRef.current = null;
    lastRttRef.current = 0;

    async function poll() {
      const pc = peerConnectionRef ? peerConnectionRef.current : null;
      if (!pc || typeof pc.getStats !== "function") {
        setLive(null); // no real connection, fall back to fake values
        return;
      }
      try {
        const report = await pc.getStats();
        if (cancelled) return;
        const parsed = parseStatsReport(report);

        if (!parsed.hasAudio) {
          prevSampleRef.current = null;
          setLive({ connecting: true, telemetry: ZERO_TELEMETRY });
          return;
        }

        const packetLoss = calcPacketLoss(prevSampleRef.current, parsed);
        prevSampleRef.current = { lost: parsed.lost, received: parsed.received };
        if (parsed.rtt !== null) lastRttRef.current = parsed.rtt;

        setLive({
          connecting: false,
          telemetry: { packetLoss, jitter: parsed.jitter, rtt: lastRttRef.current },
        });
      } catch {
        // A failed poll must never crash the call screen. Try again next tick.
      }
    }

    poll();
    const id = setInterval(poll, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [peerConnectionRef]);

  // An active override wins over everything. Simulated values skip hysteresis.
  if (override) {
    return {
      telemetry: override,
      source: "simulated",
      setOverride,
      isOverridden: true,
      evaluatedLevel: evaluateNetwork(override),
    };
  }

  if (!live) {
    return {
      telemetry: MODE_PRESET_VALUES[networkMode] || MODE_PRESET_VALUES.FULL_AUDIO,
      source: "fake",
      setOverride,
      isOverridden: false,
      evaluatedLevel: null,
    };
  }

  if (live.connecting) {
    return {
      telemetry: live.telemetry,
      source: "connecting",
      setOverride,
      isOverridden: false,
      evaluatedLevel: null,
    };
  }

  return {
    telemetry: live.telemetry,
    source: "live",
    setOverride,
    isOverridden: false,
    evaluatedLevel: evaluateNetwork(live.telemetry),
  };
}
