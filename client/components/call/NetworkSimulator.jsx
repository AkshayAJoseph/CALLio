"use client";

import { useWebRTC } from "../../hooks/useWebRTC";

export default function NetworkSimulator() {
  const { setTelemetry, setFallbackMode } = useWebRTC();

  // Akhila will expand this to automatically trigger setFallbackMode based on stats
  const simulateDegradation = (level) => {
    if (level === "OPTIMAL") {
      setTelemetry({ jitter: 10, packetLoss: 0, rtt: 40 });
      setFallbackMode("FULL_AUDIO");
    } else if (level === "DEGRADED") {
      setTelemetry({ jitter: 150, packetLoss: 0.15, rtt: 300 });
      setFallbackMode("PTT");
    } else if (level === "CRITICAL") {
      setTelemetry({ jitter: 400, packetLoss: 0.3, rtt: 600 });
      setFallbackMode("TEXT");
    }
  };

  return (
    <div className="flex gap-2 p-2 bg-slate-200 rounded text-xs mt-4">
      <span className="font-bold my-auto">Simulate Network:</span>
      <button onClick={() => simulateDegradation("OPTIMAL")} className="bg-green-500 text-white px-2 py-1 rounded">Optimal</button>
      <button onClick={() => simulateDegradation("DEGRADED")} className="bg-yellow-500 text-white px-2 py-1 rounded">Degraded (PTT)</button>
      <button onClick={() => simulateDegradation("CRITICAL")} className="bg-red-500 text-white px-2 py-1 rounded">Critical (TEXT)</button>
    </div>
  );
}
