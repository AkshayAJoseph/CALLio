"use client";

import React, { useState } from "react";
import { PRESETS } from "./thresholds";

const BUTTONS = [
  { key: "NORMAL", label: "Normal" },
  { key: "EDGE_ROAMING", label: "Edge Roaming" },
  { key: "CRITICAL_DROP", label: "Critical Drop" },
];

// Floating, collapsible bar. Clicking a preset calls onSelectPreset(preset), which
// sets the override in useNetworkStats so the real evaluator decides the mode.
export default function NetworkSimulator({
  onSelectPreset = () => {},
  onReturnToLive = () => {},
  isOverridden = false,
}) {
  const [open, setOpen] = useState(true);
  const [activeKey, setActiveKey] = useState(null);

  function choose(key) {
    setActiveKey(key);
    onSelectPreset(PRESETS[key]);
  }

  function returnToLive() {
    setActiveKey(null);
    onReturnToLive();
  }

  return (
    <aside
      aria-label="Dev Network Simulator"
      className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-900 px-4 py-3"
    >
      <div className="mx-auto flex max-w-xl flex-col gap-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="network-simulator-body"
          onClick={() => setOpen((value) => !value)}
          className="min-h-[44px] rounded-xl bg-slate-800 px-4 text-left text-base font-semibold text-white focus:outline-none focus:ring-4 focus:ring-violet-400"
        >
          {open ? "Hide Dev Network Simulator" : "Show Dev Network Simulator"}
        </button>

        {open && (
          <div id="network-simulator-body" className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              {BUTTONS.map(({ key, label }) => {
                const selected = isOverridden && activeKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => choose(key)}
                    className={`min-h-[56px] rounded-xl border px-2 text-base font-semibold text-white focus:outline-none focus:ring-4 focus:ring-violet-400 ${
                      selected
                        ? "border-violet-400 bg-violet-600"
                        : "border-slate-700 bg-slate-800"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {isOverridden && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p
                  role="status"
                  data-testid="simulation-active"
                  className="rounded-full border border-violet-500 px-3 py-1 text-base font-semibold text-violet-200"
                >
                  Simulation active
                </p>
                <button
                  type="button"
                  onClick={returnToLive}
                  className="min-h-[56px] rounded-xl border border-slate-600 px-4 text-base font-semibold text-white focus:outline-none focus:ring-4 focus:ring-violet-400"
                >
                  Return to live stats
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
