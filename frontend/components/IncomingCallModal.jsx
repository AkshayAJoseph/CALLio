"use client";
import { getIntent } from "../utils/intents";

export default function IncomingCallModal({
  incomingCall, callState, onAccept, onDecline, suppress = false,
}) {
  const open = callState === "RINGING" && incomingCall !== null && !suppress;

  if (!open) return null;

  const intent = getIntent(incomingCall.intentTag, incomingCall.priority);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="incoming-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4"
    >
      <p className="sr-only" aria-live="assertive">
        Incoming {intent.label} call from {incomingCall.from}
      </p>

      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 p-6 text-center text-slate-100 shadow-2xl">
        {/* Separate ring so only the border pulses, not the text */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 rounded-3xl border-4 ${intent.ring} ${
            intent.pulse ? "animate-pulse" : "opacity-70"
          }`}
        />

        <p className="text-sm text-slate-400">Incoming Cooee call</p>
        <h1 id="incoming-title" className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl">
          {incomingCall.from}
        </h1>

        <p className={`mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-semibold ${intent.badge}`}>
          <span aria-hidden="true">{intent.icon}</span>
          {intent.label}
        </p>

        {incomingCall.note && (
          <p className="mt-4 text-lg text-slate-200">&ldquo;{incomingCall.note}&rdquo;</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onDecline}
            className="min-h-14 rounded-2xl bg-slate-700 px-4 py-4 text-lg font-semibold hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="min-h-14 rounded-2xl bg-emerald-500 px-4 py-4 text-lg font-semibold text-slate-950 hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
