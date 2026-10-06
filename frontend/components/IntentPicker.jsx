"use client";
import { useState } from "react";
import { INTENT_LIST } from "../utils/intents";

export default function IntentPicker() {
  const [selected, setSelected] = useState("Casual");

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
    </section>
  );
}
