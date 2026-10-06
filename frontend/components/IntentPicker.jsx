"use client";
import { useEffect, useState } from "react";
import { INTENT_LIST, INTENTS, formatTimeIn } from "../utils/intents";

const MAX_NOTE = 40;

// Build the payload at click time so the time is fresh.
function buildIntent(tag, note) {
  const i = INTENTS[tag];
  const d = new Date();
  return {
    intentTag: i.label, // locked schema: full label string
    priority: i.priority,
    note: note.trim(),
    callerTime: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }),
    callerTz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/**
 * Props:
 *  - targetNumber: string, number being dialled
 *  - onCall(intentObject): usually (intent) => startCall(targetNumber, intent)
 *  - disabled: boolean, true when callState !== "IDLE"
 */
export default function IntentPicker({ targetNumber, onCall, disabled = false }) {
  const [selected, setSelected] = useState("Casual");
  const [note, setNote] = useState("");
  const [now, setNow] = useState("");
  const [tz, setTz] = useState("");

  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const tick = () => setNow(formatTimeIn());
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const canCall = !disabled && !!targetNumber;

  return (
    <section aria-label="Choose why you are calling" className="w-full max-w-md text-slate-100">
      <h2 className="mb-1 text-lg font-semibold">Why are you calling?</h2>
      <p className="mb-4 text-sm text-slate-400">They will see this before they answer.</p>

      <div role="radiogroup" aria-label="Call urgency" className="grid gap-3">
        {INTENT_LIST.map((i) => {
          const on = selected === i.tag;
          return (
            <label
              key={i.tag}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-4 text-base font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-white ${
                on ? i.cardOn : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
              }`}
            >
              <input
                type="radio"
                name="intent"
                value={i.tag}
                checked={on}
                onChange={() => setSelected(i.tag)}
                className="sr-only"
              />
              <span aria-hidden="true" className="text-2xl">{i.icon}</span>
              <span className="flex-1">{i.label}</span>
              {on && <span aria-hidden="true">✓</span>}
            </label>
          );
        })}
      </div>

      <div className="mt-4">
        <label htmlFor="intent-note" className="mb-1 block text-sm text-slate-300">
          Add a short note (optional)
        </label>
        <input
          id="intent-note"
          type="text"
          value={note}
          maxLength={MAX_NOTE}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Flight delayed"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
        />
        <p className="mt-1 text-right text-xs text-slate-500" aria-live="polite">
          {note.length}/{MAX_NOTE}
        </p>
      </div>

      <p className="mt-2 text-sm text-slate-400">
        We will send your local time: {now} {tz && `(${tz})`}
      </p>

      <button
        type="button"
        disabled={!canCall}
        onClick={() => onCall?.(buildIntent(selected, note))}
        className="mt-5 w-full rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-semibold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {targetNumber ? `Call ${targetNumber}` : "Enter a number to call"}
      </button>
    </section>
  );
}
