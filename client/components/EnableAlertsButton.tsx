"use client";
import { useEffect, useState } from "react";
import { enableAlerts, getPermission } from "../utils/notifications";

// Small button. Safari needs a user click for permission, and the same
// click unlocks the ringtone audio.
export default function EnableAlertsButton() {
  const [perm, setPerm] = useState("default");

  useEffect(() => {
    setPerm(getPermission());
    // Ask on app load as planned (works in Chrome/Edge; others use the button).
    if (getPermission() === "default") enableAlerts().then(setPerm);
  }, []);

  if (perm === "granted" || perm === "unsupported") return null;

  return (
    <button
      type="button"
      onClick={async () => setPerm(await enableAlerts())}
      className="rounded-full border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
    >
      {perm === "denied"
        ? "Alerts blocked - allow notifications in browser settings"
        : "Turn on call alerts"}
    </button>
  );
}
