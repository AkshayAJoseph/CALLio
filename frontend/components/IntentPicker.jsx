"use client";
import { useState } from "react";
import { INTENT_LIST } from "../utils/intents";

const MAX_NOTE = 40;

export default function IntentPicker() {
  const [selected, setSelected] = useState("Casual");
  const [note, setNote] = useState("");

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
    </section>
  );
}
