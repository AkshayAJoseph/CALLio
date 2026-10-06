"use client";

import React from "react";

// Colour, icon and text label for each level. Never colour alone.
const LEVELS = {
  FULL_AUDIO: {
    label: "Optimal",
    pill: "bg-emerald-500/15 border-emerald-500 text-emerald-300",
    dot: "text-emerald-400",
    Icon: CheckIcon,
  },
  PTT: {
    label: "Degraded",
    pill: "bg-amber-500/15 border-amber-500 text-amber-300",
    dot: "text-amber-400",
    Icon: WarningIcon,
  },
  TEXT: {
    label: "Critical",
    pill: "bg-rose-500/15 border-rose-500 text-rose-300",
    dot: "text-rose-400",
    Icon: CrossIcon,
  },
};

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.7 2.7L16 9.5" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5L2.8 19.5h18.4L12 3.5z" />
      <path d="M12 10v4.5M12 17.2v.1" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  );
}

function fmt(value, decimals = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return String(Number(n.toFixed(decimals)));
}

function Stat({ label, value, unit, testId }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 min-w-[5.5rem]">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-lg font-semibold text-white" data-testid={testId}>
        {value}
        <span className="ml-0.5 text-sm font-normal text-slate-400">{unit}</span>
      </span>
    </div>
  );
}

// Props:
//   networkMode: FULL_AUDIO, PTT or TEXT. Drives the colour, icon and label.
//   telemetry: { packetLoss, jitter, rtt }
//   source: "fake", "connecting" or "live"
export default function TelemetryHUD({
  networkMode = "FULL_AUDIO",
  telemetry = { packetLoss: 0, jitter: 0, rtt: 0 },
  source = "fake",
}) {
  const level = LEVELS[networkMode] || LEVELS.FULL_AUDIO;
  const { Icon } = level;

  return (
    <div className="flex flex-col gap-2" data-testid="telemetry-hud">
      <div
        role="status"
        aria-live="polite"
        data-testid="status-pill"
        data-level={networkMode}
        className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-base font-semibold ${level.pill}`}
      >
        <Icon />
        <span>{`Network: ${level.label}`}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Stat label="Jitter" value={fmt(telemetry.jitter)} unit="ms" testId="hud-jitter" />
        <Stat label="Packet loss" value={fmt(telemetry.packetLoss, 1)} unit="%" testId="hud-loss" />
        <Stat label="RTT" value={fmt(telemetry.rtt)} unit="ms" testId="hud-rtt" />
        {source === "connecting" && (
          <span className="text-sm text-slate-400" data-testid="hud-connecting">
            Connecting
          </span>
        )}
      </div>
    </div>
  );
}
