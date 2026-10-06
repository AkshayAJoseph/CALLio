"use client";

import { useWebRTC } from "../../hooks/useWebRTC";

export default function TelemetryHUD() {
  const { telemetry, networkMode } = useWebRTC();

  return (
    <div className="absolute top-2 right-2 bg-black/80 text-green-400 font-mono text-xs p-2 rounded pointer-events-none">
      <p>MODE: {networkMode}</p>
      <p>PING: {telemetry.rtt}ms</p>
      <p>JITTER: {telemetry.jitter}ms</p>
      <p>LOSS: {(telemetry.packetLoss * 100).toFixed(1)}%</p>
    </div>
  );
}
