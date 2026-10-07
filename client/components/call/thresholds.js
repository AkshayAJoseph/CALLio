// Single home for every network threshold. Tune numbers here only.
// Values are locked by the lead. Critical is evaluated first.

export const THRESHOLDS = {
  TEXT: { packetLoss: 25, jitter: 300, rtt: 500 },
  PTT: { packetLoss: 10, jitter: 120, rtt: 250 },
};

// Numbers the three simulator presets inject (used by phase 4 as well).
export const PRESETS = {
  NORMAL: { packetLoss: 0.5, jitter: 15, rtt: 50 },
  EDGE_ROAMING: { packetLoss: 18, jitter: 160, rtt: 200 },
  CRITICAL_DROP: { packetLoss: 42, jitter: 450, rtt: 650 },
};

// Fake numbers shown for each mode when there is no real connection (mock hook).
// This keeps the HUD from ever contradicting the current mode.
export const MODE_PRESET_VALUES = {
  FULL_AUDIO: PRESETS.NORMAL,
  PTT: PRESETS.EDGE_ROAMING,
  TEXT: PRESETS.CRITICAL_DROP,
};

export const ZERO_TELEMETRY = { packetLoss: 0, jitter: 0, rtt: 0 };

// Returns "TEXT", "PTT" or "FULL_AUDIO".
export function evaluateNetwork({ packetLoss, jitter, rtt }) {
  const t = THRESHOLDS.TEXT;
  const p = THRESHOLDS.PTT;
  if (packetLoss >= t.packetLoss || jitter >= t.jitter || rtt >= t.rtt) return "TEXT";
  if (packetLoss >= p.packetLoss || jitter >= p.jitter || rtt >= p.rtt) return "PTT";
  return "FULL_AUDIO";
}
