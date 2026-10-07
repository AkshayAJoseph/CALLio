"use client";

import { useState } from "react";

export default function IntentPicker({ onIntentSelect }) {
  const [intentTag, setIntentTag] = useState("Just calling");
  const [priority, setPriority] = useState("MEDIUM");
  const [note, setNote] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onIntentSelect({
      intentTag,
      priority,
      note,
      callerTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      callerTz: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  return (
    <div className="p-4 border rounded bg-white shadow-sm">
      <h3 className="font-semibold mb-2">Call Intent</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input 
          type="text" 
          value={intentTag}
          onChange={(e) => setIntentTag(e.target.value)}
          placeholder="e.g. Urgent, Just checking in..." 
          className="border p-1 text-sm"
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="border p-1 text-sm">
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white p-1 rounded text-sm">
          Set Intent
        </button>
      </form>
    </div>
  );
}
