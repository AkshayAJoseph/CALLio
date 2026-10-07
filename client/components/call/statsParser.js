// Pure helpers that turn a getStats() report into plain numbers.
// No React in here so it is easy to test.

function eachStat(report, fn) {
  if (!report) return;
  if (typeof report.forEach === "function") {
    // RTCStatsReport is Map like, and arrays work too.
    report.forEach((value) => fn(value));
  }
}

// Reads one report. Returns:
// { hasAudio, jitter (ms), lost, received, rtt (ms or null) }
export function parseStatsReport(report) {
  const out = { hasAudio: false, jitter: 0, lost: 0, received: 0, rtt: null };

  eachStat(report, (stat) => {
    if (!stat || typeof stat !== "object") return;

    if (stat.type === "inbound-rtp" && (stat.kind === "audio" || stat.mediaType === "audio")) {
      out.hasAudio = true;
      out.jitter = (Number(stat.jitter) || 0) * 1000;
      out.lost = Number(stat.packetsLost) || 0;
      out.received = Number(stat.packetsReceived) || 0;
    }

    if (stat.type === "candidate-pair") {
      const chosen = stat.selected === true || (stat.nominated === true && stat.state === "succeeded");
      if (chosen && typeof stat.currentRoundTripTime === "number") {
        out.rtt = stat.currentRoundTripTime * 1000;
      }
    }
  });

  return out;
}

// Packet loss percent between two polls. Never divides by zero.
// prev and next are objects with lost and received counters, prev may be null.
export function calcPacketLoss(prev, next) {
  if (!prev || !next) return 0;
  const lostDelta = next.lost - prev.lost;
  const receivedDelta = next.received - prev.received;
  if (lostDelta < 0 || receivedDelta < 0) return 0; // counters reset
  const total = lostDelta + receivedDelta;
  if (total <= 0) return 0;
  return (lostDelta / total) * 100;
}
